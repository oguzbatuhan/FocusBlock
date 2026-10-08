// src/services/googleSync.js
// Google Drive "appDataFolder" için ince API katmanı.
// Dosya, kullanıcının Drive'ında uygulamaya özel GİZLİ klasörde durur:
// Drive arayüzünde görünmez, başka uygulamalar erişemez.
// Birleştirme / çakışma mantığı main.js içindedir.

const CLIENT_ID =
  "189742566298-05i4abr0unl96q0ka5mnqockjev4uv7t.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const FILE_NAME = "focusblock_app_data.json";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";

/** code: "auth" | "scope" | "network" | "api-disabled" | "rate" | "format" | "api" */
export class SyncError extends Error {
  constructor(code, message, detail) {
    super(message);
    this.name = "SyncError";
    this.code = code;
    this.detail = detail;
  }
}

let tokenClient = null;
let accessToken = null;
let tokenExpiry = 0;
let tokenWaiter = null; // { promise, resolve, reject }

const gisReady = () =>
  !!(window.google && google.accounts && google.accounts.oauth2);

function waitForGoogle(timeout) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    (function check() {
      if (gisReady()) return resolve(true);
      if (Date.now() - t0 > timeout) return resolve(false);
      setTimeout(check, 150);
    })();
  });
}

/* index.html'deki script yüklenemediyse (çevrimdışı açılış gibi) yeniden dener */
function loadGisScript() {
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

function onToken(res) {
  const w = tokenWaiter;
  tokenWaiter = null;
  if (!w) return;
  if (!res || res.error) {
    const e = res && res.error;
    return w.reject(
      new SyncError(
        "auth",
        e === "access_denied"
          ? "Google izni verilmedi"
          : "Google oturumu açılamadı",
        e,
      ),
    );
  }
  if (!google.accounts.oauth2.hasGrantedAllScopes(res, SCOPE)) {
    return w.reject(
      new SyncError(
        "scope",
        "Drive izni verilmedi; eşitleme için izin kutusunu işaretlemelisin",
      ),
    );
  }
  accessToken = res.access_token;
  tokenExpiry = Date.now() + (Number(res.expires_in) || 3600) * 1000;
  w.resolve(accessToken);
}

function onTokenError(err) {
  const w = tokenWaiter;
  tokenWaiter = null;
  if (!w) return;
  const t = err && err.type;
  w.reject(
    new SyncError(
      "auth",
      t === "popup_closed"
        ? "Giriş penceresi kapatıldı"
        : t === "popup_failed_to_open"
          ? "Giriş penceresi açılamadı (açılır pencere engelini kontrol et)"
          : "Google oturumu açılamadı",
      t,
    ),
  );
}

/** Google Identity Services istemcisini hazırlar. Hazırsa true döner. */
export async function initGoogleAuth() {
  if (tokenClient) return true;
  if (!gisReady()) {
    if (!(await waitForGoogle(4000))) {
      await loadGisScript();
      if (!(await waitForGoogle(8000))) return false;
    }
  }
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: onToken,
    error_callback: onTokenError,
  });
  return true;
}

/**
 * Erişim jetonu ister.
 * interactive:true  → kullanıcı tıklamasından çağrılmalı (giriş/izin penceresi açabilir)
 * interactive:false → sessiz yenileme; mümkün değilse "auth" hatası verir
 */
export function requestToken({ interactive = false, hint } = {}) {
  if (!tokenClient)
    return Promise.reject(
      new SyncError("network", "Google servisi hazır değil"),
    );
  if (tokenWaiter) return tokenWaiter.promise;

  const w = {};
  w.promise = new Promise((resolve, reject) => {
    w.resolve = resolve;
    w.reject = reject;
  });
  tokenWaiter = w;

  const timer = setTimeout(
    () => {
      if (tokenWaiter !== w) return;
      tokenWaiter = null;
      w.reject(new SyncError("auth", "Google yanıt vermedi"));
    },
    interactive ? 120000 : 15000,
  );
  const clear = () => clearTimeout(timer);
  w.promise.then(clear, clear);

  try {
    const opts = { prompt: interactive ? "" : "none" };
    if (hint) opts.hint = hint;
    tokenClient.requestAccessToken(opts);
  } catch (e) {
    tokenWaiter = null;
    w.reject(new SyncError("auth", "Google oturumu başlatılamadı"));
  }
  return w.promise;
}

function ensureToken(auth = {}) {
  if (accessToken && Date.now() < tokenExpiry - 60000)
    return Promise.resolve(accessToken);
  return requestToken(auth);
}

async function toApiError(res) {
  let msg = "";
  let reason = "";
  try {
    const j = await res.json();
    msg = (j.error && j.error.message) || "";
    reason =
      (j.error &&
        j.error.errors &&
        j.error.errors[0] &&
        j.error.errors[0].reason) ||
      "";
  } catch (_) {}
  if (res.status === 401)
    return new SyncError("auth", "Google oturumu sona erdi");
  if (
    res.status === 403 &&
    /accessNotConfigured|has not been used|is disabled/i.test(
      reason + " " + msg,
    )
  )
    return new SyncError(
      "api-disabled",
      "Google Cloud projesinde Drive API etkin değil",
      msg,
    );
  if (res.status === 429 || /rateLimit|userRateLimit/i.test(reason))
    return new SyncError(
      "rate",
      "Google istek sınırına takıldı, biraz sonra tekrar denenecek",
    );
  if (res.status === 403)
    return new SyncError(
      "api",
      msg || "Drive erişimi reddedildi (izinleri kontrol et)",
      msg,
    );
  return new SyncError("api", msg || `Drive hatası (${res.status})`, msg);
}

/* Jetonu ekler; 401 gelirse bir kez yenileyip tekrar dener */
async function driveFetch(url, init = {}, auth = {}) {
  let token = await ensureToken(auth);
  for (let attempt = 0; attempt < 2; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        ...init,
        headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
      });
    } catch (_) {
      throw new SyncError("network", "İnternet bağlantısı yok");
    }
    if (res.status === 401 && attempt === 0) {
      accessToken = null;
      tokenExpiry = 0;
      token = await requestToken(auth);
      continue;
    }
    if (!res.ok) throw await toApiError(res);
    return res;
  }
}

/**
 * Gizli klasördeki eşitleme dosyasını bulur → { id, modifiedTime } | null
 * (Yarış sonucu birden fazla oluşmuşsa her cihaz aynı, en eski olanı seçer.)
 */
export async function findSyncFile(auth) {
  const q = `name='${FILE_NAME}' and trashed=false`;
  const url =
    `${API}/files?spaces=appDataFolder&orderBy=createdTime&pageSize=10` +
    `&q=${encodeURIComponent(q)}` +
    `&fields=${encodeURIComponent("files(id,modifiedTime,createdTime)")}`;
  const data = await (await driveFetch(url, {}, auth)).json();
  return data.files && data.files.length ? data.files[0] : null;
}

/** Dosya içeriğini JSON olarak indirir */
export async function downloadFile(fileId, auth) {
  const res = await driveFetch(
    `${API}/files/${encodeURIComponent(fileId)}?alt=media`,
    {},
    auth,
  );
  try {
    return await res.json();
  } catch (_) {
    throw new SyncError("format", "Drive'daki eşitleme dosyası okunamadı");
  }
}

/** Dosyayı oluşturur (fileId yoksa) ya da günceller → { id, modifiedTime } */
export async function uploadFile(data, fileId, auth) {
  const boundary = "fb" + Math.random().toString(36).slice(2) + Date.now();
  const meta = fileId
    ? {}
    : {
        name: FILE_NAME,
        parents: ["appDataFolder"],
        mimeType: "application/json",
      };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(data)}\r\n--${boundary}--`;
  const url = fileId
    ? `${UPLOAD}/files/${encodeURIComponent(fileId)}?uploadType=multipart&fields=id,modifiedTime`
    : `${UPLOAD}/files?uploadType=multipart&fields=id,modifiedTime`;
  const res = await driveFetch(
    url,
    {
      method: fileId ? "PATCH" : "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
    auth,
  );
  return res.json();
}

/** Bağlı Google hesabının e-postası (yalnızca gösterim için) */
export async function getAccountEmail(auth) {
  const res = await driveFetch(
    `${API}/about?fields=${encodeURIComponent("user(emailAddress)")}`,
    {},
    auth,
  );
  const j = await res.json();
  return (j.user && j.user.emailAddress) || "";
}

/** Uygulamanın Google erişimini iptal eder (Drive'daki dosya silinmez) */
export async function signOutGoogle() {
  const t = accessToken;
  accessToken = null;
  tokenExpiry = 0;
  if (t && gisReady()) {
    await new Promise((resolve) => {
      try {
        google.accounts.oauth2.revoke(t, resolve);
      } catch (_) {
        resolve();
      }
      setTimeout(resolve, 3000);
    });
  }
}
