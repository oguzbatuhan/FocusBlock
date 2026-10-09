/* ==========================================================================
   FocusBlock Pro v2
   Bölümler:
   1. Sabitler & yardımcılar   2. Durum (state)   3. Ses / bildirim / modal
   4. Zamanlayıcı motoru       5. Görünümler      6. Olaylar   7. Başlangıç
   ========================================================================== */

/* ==========================================================================
   1. SABİTLER & YARDIMCILAR
   ========================================================================== */
import {
  SyncError,
  initGoogleAuth,
  requestToken,
  findSyncFile,
  downloadFile as downloadDriveFile,
  uploadFile,
  getAccountEmail,
  signOutGoogle,
} from "./services/googleSync.js";

/* Sürüm bilgisi derleme sırasında vite.config.js (define) ile package.json'dan otomatik gelir */
const APP_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
const APP_BUILD = typeof __APP_BUILD__ !== "undefined" ? __APP_BUILD__ : "";

const STORAGE_KEY = "focusblock-v2";
const SYNC_KEY = "focusblock-v2-sync";
const OLD_KEY = "focusblock-pro-state";
const PREV_KEY = "focusblock-v2-prev";

const PALETTE = [
  { id: "indigo", hex: "#6366f1" },
  { id: "emerald", hex: "#10b981" },
  { id: "amber", hex: "#f59e0b" },
  { id: "rose", hex: "#f43f5e" },
  { id: "sky", hex: "#0ea5e9" },
  { id: "purple", hex: "#a855f7" },
  { id: "teal", hex: "#14b8a6" },
  { id: "orange", hex: "#f97316" },
];

const EMOJIS = [
  "🎯",
  "🧠",
  "📚",
  "💻",
  "🧮",
  "📖",
  "✍️",
  "🍅",
  "🩺",
  "🌍",
  "🎨",
  "🏃",
];

const THEMES = [
  { id: "dark", name: "Koyu Cam", sw: "#18181b" },
  { id: "light", name: "Açık Minimal", sw: "#e2e8f0" },
  { id: "forest", name: "Zümrüt", sw: "#064e3b" },
  { id: "ocean", name: "Okyanus", sw: "#0f1b33" },
];

const rep = (n, o) => Array.from({ length: n }, () => ({ ...o }));

const TEMPLATES = [
  {
    name: "Boş Blok",
    emoji: "✨",
    color: "indigo",
    desc: "Tek setle başla, sonra kendin düzenle",
    sets: [{ title: "", work: 25, break: 5 }],
  },
  {
    name: "Pomodoro",
    emoji: "🍅",
    color: "rose",
    desc: "4 set · 25 dk odak / 5 dk mola",
    sets: rep(4, { title: "", work: 25, break: 5 }),
  },
  {
    name: "Derin Çalışma",
    emoji: "🧠",
    color: "indigo",
    desc: "3 set · 50 dk odak / 10 dk mola",
    sets: rep(3, { title: "", work: 50, break: 10 }),
  },
  {
    name: "Konu + Soru + Tekrar",
    emoji: "📚",
    color: "amber",
    desc: "Konu anlatımı, soru çözümü, yanlış analizi, tekrar",
    sets: [
      { title: "Konu anlatımı", work: 45, break: 10 },
      { title: "Soru çözümü", work: 45, break: 10 },
      { title: "Yanlış analizi", work: 30, break: 10 },
      { title: "Tekrar notları", work: 25, break: 5 },
    ],
  },
  {
    name: "Kodlama Oturumu",
    emoji: "💻",
    color: "emerald",
    desc: "Planlama, kodlama, test ve düzenleme",
    sets: [
      { title: "Planlama ve kurulum", work: 50, break: 10 },
      { title: "Kodlama", work: 50, break: 10 },
      { title: "Test ve düzenleme", work: 50, break: 10 },
    ],
  },
];

const ico = (inner) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const I = {
  focus: ico('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>'),
  blocks: ico(
    '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17.5l9 5 9-5" opacity=".5"/>',
  ),
  history: ico(
    '<path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  ),
  stats: ico(
    '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-8"/><path d="M22 20H2"/>',
  ),
  settings: ico(
    '<path d="M4 6h10"/><path d="M18 6h2"/><circle cx="16" cy="6" r="2"/><path d="M4 12h2"/><path d="M10 12h10"/><circle cx="8" cy="12" r="2"/><path d="M4 18h12"/><path d="M20 18h0"/><circle cx="18" cy="18" r="2"/>',
  ),
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  reset: ico('<path d="M4 4v5h5"/><path d="M4.6 9a8 8 0 111.9 8.2"/>'),
  skip: ico('<path d="M5 4l10 8-10 8V4z"/><path d="M19 5v14"/>'),
  check: ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  plus: ico('<path d="M12 5v14M5 12h14"/>'),
  trash: ico(
    '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12"/><path d="M9 7V4h6v3"/>',
  ),
  up: ico('<path d="M6 15l6-6 6 6"/>'),
  down: ico('<path d="M6 9l6 6 6-6"/>'),
  copy: ico(
    '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>',
  ),
  download: ico(
    '<path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/>',
  ),
  upload: ico(
    '<path d="M12 16V5"/><path d="M7 9l5-5 5 5"/><path d="M5 20h14"/>',
  ),
  bolt: ico('<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>'),
  cloud: ico(
    '<path d="M7 18a4 4 0 010-8 5.5 5.5 0 0110.7-1.5A4.5 4.5 0 0117 18H7z"/>',
  ),
  sync: ico(
    '<path d="M20 11a8 8 0 00-14.9-3"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0014.9 3"/><path d="M20 20v-4h-4"/>',
  ),
  shield: ico('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  mail: ico(
    '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  ),
  external: ico(
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  ),
  arrowLeft: ico(
    '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  ),
};

const NAV = [
  { id: "focus", label: "Odaklan", icon: I.focus },
  { id: "blocks", label: "Bloklar", icon: I.blocks },
  { id: "history", label: "Geçmiş", icon: I.history },
  { id: "stats", label: "İstatistik", icon: I.stats },
  { id: "settings", label: "Ayarlar", icon: I.settings },
];

const $ = (id) => document.getElementById(id);
const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const pad = (n) => String(n).padStart(2, "0");
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const colorHex = (id) => (PALETTE.find((c) => c.id === id) || PALETTE[0]).hex;
const BREAK_COLOR = "#22c55e";

const fmtClock = (sec) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
const fmtDur = (min) => {
  min = Math.round(min);
  if (min < 60) return `${min} dk`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} sa ${m} dk` : `${h} sa`;
};
const fmtHM = (ts) =>
  new Date(ts).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

function dayKey(x) {
  const d = x instanceof Date ? x : new Date(x);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function dayLabel(key) {
  if (key === dayKey(new Date())) return "Bugün";
  if (key === dayKey(addDays(new Date(), -1))) return "Dün";
  return new Date(key + "T12:00:00").toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/* ==========================================================================
   2. DURUM (STATE)
   ========================================================================== */
function makeType(tpl) {
  return {
    id: uid(),
    name: tpl.name,
    emoji: tpl.emoji,
    color: tpl.color,
    sets: tpl.sets.map((s) => ({
      id: uid(),
      title: s.title,
      work: s.work,
      break: s.break,
    })),
  };
}

function defaultTypes() {
  return [
    makeType({
      name: "Derin Çalışma",
      emoji: "🧠",
      color: "indigo",
      sets: rep(4, { title: "", work: 50, break: 10 }),
    }),
    makeType({
      name: "Pomodoro",
      emoji: "🍅",
      color: "rose",
      sets: rep(4, { title: "", work: 25, break: 5 }),
    }),
    makeType(TEMPLATES[4]),
    makeType(TEMPLATES[3]),
  ];
}

function freshSession(type) {
  return {
    setIndex: 0,
    mode: "work",
    remaining: type.sets[0].work * 60,
    running: false,
    endAt: null,
  };
}

function defaultState() {
  const types = defaultTypes();
  return {
    v: 2,
    settings: {
      theme: "dark",
      accent: "indigo",
      autoStart: false,
      sound: true,
      volume: 70,
      notify: false,
      vibrate: true,
      wakeLock: false,
      dailyGoal: 120,
      lastBackup: null,
    },
    types,
    activeTypeId: types[0].id,
    session: freshSession(types[0]),
    history: [],
    /* Drive eşitlemesi için: silinenler (mezar taşı), ayar zaman damgası, dokunulmamış mı? */
    sync: { tomb: { h: {}, t: {} }, settingsAt: 0, epoch: 0, pristine: true },
  };
}

const validEnd = (s) =>
  Number.isFinite(Number(s && s.endAt)) && Number(s.endAt) > 0
    ? Number(s.endAt)
    : null;

function normalizeSync(s) {
  const o = {
    tomb: { h: {}, t: {} },
    settingsAt: 0,
    epoch: 0,
    pristine: false,
  };
  if (!s || typeof s !== "object") return o;
  o.settingsAt = Number(s.settingsAt) > 0 ? Number(s.settingsAt) : 0;
  /* epoch: "her şeyi değiştiren" işlemin (sıfırlama, üzerine yazma, geri alma) zamanı */
  o.epoch = Number(s.epoch) > 0 ? Number(s.epoch) : 0;
  o.pristine = !!s.pristine;
  ["h", "t"].forEach((k) => {
    const src = s.tomb && s.tomb[k];
    if (!src || typeof src !== "object") return;
    Object.keys(src).forEach((id) => {
      const v = Number(src[id]);
      if (Number.isFinite(v) && v > 0) o.tomb[k][id] = v;
    });
  });
  return o;
}

function normalizeState(raw) {
  const d = defaultState();
  if (!raw || typeof raw !== "object") return d;
  const out = { ...d };

  out.settings = { ...d.settings, ...(raw.settings || {}) };
  if (!THEMES.some((t) => t.id === out.settings.theme))
    out.settings.theme = "dark";
  if (!PALETTE.some((c) => c.id === out.settings.accent))
    out.settings.accent = "indigo";
  out.settings.dailyGoal = clamp(
    parseInt(out.settings.dailyGoal) || 120,
    15,
    720,
  );
  out.settings.notify = !!out.settings.notify;
  out.settings.autoStart = !!out.settings.autoStart;
  out.settings.sound = out.settings.sound !== false;
  out.settings.vibrate = out.settings.vibrate !== false;
  out.settings.wakeLock = !!out.settings.wakeLock;
  const vol = parseInt(out.settings.volume);
  out.settings.volume = clamp(isNaN(vol) ? 70 : vol, 0, 100);
  out.settings.lastBackup =
    Number.isFinite(Number(out.settings.lastBackup)) && out.settings.lastBackup
      ? Number(out.settings.lastBackup)
      : null;

  if (Array.isArray(raw.types) && raw.types.length) {
    const mapped = raw.types
      .filter((t) => t && typeof t === "object")
      .map((t) => ({
        id: String(t.id || uid()),
        name: String(t.name || "Blok").slice(0, 40),
        emoji: String(t.emoji || "🎯"),
        color: PALETTE.some((c) => c.id === t.color) ? t.color : "indigo",
        updatedAt: Number(t.updatedAt) > 0 ? Number(t.updatedAt) : 0,
        sets: (Array.isArray(t.sets) && t.sets.length ? t.sets : [{}]).map(
          (s0) => {
            const s = s0 && typeof s0 === "object" ? s0 : {};
            const br = parseInt(s.break);
            return {
              id: String(s.id || uid()),
              title: String(s.title || "").slice(0, 80),
              work: clamp(parseInt(s.work) || 25, 1, 180),
              break: clamp(isNaN(br) ? 5 : br, 0, 60),
            };
          },
        ),
      }));
    if (mapped.length) out.types = mapped;
  }

  const seenT = new Set();
  out.types = out.types.filter((t) => !seenT.has(t.id) && seenT.add(t.id));

  out.activeTypeId = out.types.some((t) => t.id === raw.activeTypeId)
    ? raw.activeTypeId
    : out.types[0].id;

  out.history = (Array.isArray(raw.history) ? raw.history : [])
    .filter((h) => h && Number.isFinite(Number(h.ts)) && Number(h.minutes) > 0)
    .map((h) => ({
      id: String(h.id || uid()),
      ts: Number(h.ts),
      typeId: String(h.typeId || ""),
      typeName: String(h.typeName || "Blok"),
      emoji: String(h.emoji || "🎯"),
      color: PALETTE.some((c) => c.id === h.color) ? h.color : "indigo",
      setNo: parseInt(h.setNo) || 1,
      setTitle: String(h.setTitle || ""),
      minutes: Math.max(1, Math.round(Number(h.minutes))),
      status: h.status === "partial" ? "partial" : "completed",
    }));
  const seenH = new Set();
  out.history = out.history.filter((h) => !seenH.has(h.id) && seenH.add(h.id));
  if (out.history.length > 5000)
    out.history = out.history.sort((a, b) => a.ts - b.ts).slice(-5000);

  out.sync = normalizeSync(raw.sync);

  const active = out.types.find((t) => t.id === out.activeTypeId);
  const s = raw.session;
  const okSession =
    s &&
    ["work", "break", "done"].includes(s.mode) &&
    Number.isInteger(s.setIndex) &&
    s.setIndex >= 0 &&
    s.setIndex < active.sets.length &&
    Number.isFinite(s.remaining) &&
    s.remaining >= 0;
  out.session = okSession
    ? {
        setIndex: s.setIndex,
        mode: s.mode,
        remaining: Math.round(s.remaining),
        running: !!s.running && !!validEnd(s) && s.mode !== "done",
        endAt: s.running && s.mode !== "done" ? validEnd(s) : null,
      }
    : freshSession(active);
  return out;
}

function migrateOld(old) {
  const s = defaultState();
  if (!old || !Array.isArray(old.subjects) || !old.subjects.length) return s;
  s.sync.pristine = false;
  s.types = old.subjects.map((sub) => ({
    id: String(sub.id || uid()),
    name: String(sub.title || "Blok"),
    emoji: "🎯",
    color: sub.color || "indigo",
    sets: Array.from({ length: clamp(parseInt(sub.sets) || 4, 1, 20) }, () => ({
      id: uid(),
      title: "",
      work: sub.work || 50,
      break: sub.break ?? 10,
    })),
  }));
  s.activeTypeId = s.types.some((t) => t.id === old.activeSubjectId)
    ? old.activeSubjectId
    : s.types[0].id;
  if (old.theme && THEMES.some((t) => t.id === old.theme))
    s.settings.theme = old.theme;
  old.subjects.forEach((sub) => {
    if (sub.completedMinutes > 0) {
      s.history.push({
        id: uid(),
        ts: Date.now() - 1000,
        typeId: String(sub.id),
        typeName: sub.title,
        emoji: "🎯",
        color: sub.color || "indigo",
        setNo: 1,
        setTitle: "Önceki sürümden aktarılan kayıt",
        minutes: sub.completedMinutes,
        status: "completed",
      });
    }
  });
  s.session = freshSession(s.types.find((t) => t.id === s.activeTypeId));
  return s;
}

function loadState() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeState(JSON.parse(saved));
    const old = localStorage.getItem(OLD_KEY);
    if (old) return normalizeState(migrateOld(JSON.parse(old)));
  } catch (_) {
    /* Okunamayan veri üzerine yazılmadan önce ham kopyası ayrı bir anahtarda saklanır */
    try {
      if (saved) localStorage.setItem(STORAGE_KEY + "-corrupt", saved);
    } catch (_) {}
  }
  return defaultState();
}

let state = loadState();
const ui = {
  view: "focus",
  selectedTypeId: state.activeTypeId,
  hist: { type: "all", range: "7" },
  statsRange: 30,
};

let saveWarned = false;
function save() {
  if (persist()) scheduleSync();
}

/* Yalnızca yerel kayıt (bulut eşitlemesini tetiklemez). Eşitlenecek bir şey değiştiyse true döner. */
function persist() {
  let changed = false;
  try {
    changed = stampChanges();
  } catch (_) {}
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    if (!saveWarned) {
      saveWarned = true;
      toast(
        "Veriler tarayıcıya kaydedilemedi — Ayarlar'dan yedek indirmeyi unutma",
      );
    }
  }
  return changed;
}

/* ---- Türetilmiş veriler ---- */
const curType = () =>
  state.types.find((t) => t.id === state.activeTypeId) || state.types[0];
const curSet = () =>
  curType().sets[state.session.setIndex] || curType().sets[0];
const typeById = (id) => state.types.find((t) => t.id === id);

function phaseTotal() {
  const s = curSet();
  return (state.session.mode === "break" ? s.break : s.work) * 60;
}

function runRemaining() {
  const se = state.session;
  const sets = curType().sets;
  const n = sets.length;
  if (se.mode === "done") return 0;
  let total = se.remaining;
  if (se.mode === "work" && se.setIndex < n - 1)
    total += sets[se.setIndex].break * 60;
  for (let j = se.setIndex + 1; j < n; j++) {
    total += sets[j].work * 60;
    if (j < n - 1) total += sets[j].break * 60;
  }
  return total;
}

const sumWork = (t) => t.sets.reduce((a, s) => a + s.work, 0);

function minutesByDay() {
  const m = {};
  state.history.forEach((h) => {
    const k = dayKey(h.ts);
    m[k] = (m[k] || 0) + h.minutes;
  });
  return m;
}
const todayMinutes = () => minutesByDay()[dayKey(new Date())] || 0;

function currentStreak(m = minutesByDay()) {
  let d = startOfDay();
  if (!(m[dayKey(d)] > 0)) d = addDays(d, -1);
  let n = 0;
  while (m[dayKey(d)] > 0) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
function longestStreak(m = minutesByDay()) {
  const keys = Object.keys(m)
    .filter((k) => m[k] > 0)
    .sort();
  let best = 0;
  let run = 0;
  let prev = null;
  keys.forEach((k) => {
    const t = new Date(k + "T12:00:00").getTime();
    run =
      prev !== null && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  });
  return best;
}

function logHistory(status, minutes, ts = Date.now()) {
  const t = curType();
  const s = curSet();
  state.history.push({
    id: uid(),
    ts,
    typeId: t.id,
    typeName: t.name,
    emoji: t.emoji,
    color: t.color,
    setNo: state.session.setIndex + 1,
    setTitle: s.title || "",
    minutes,
    status,
  });
  if (state.history.length > 5000)
    state.history.splice(0, state.history.length - 5000);
}

/* ==========================================================================
   3. SES / BİLDİRİM / TOAST / MODAL / GÖRÜNÜM AYARI
   ========================================================================== */
/* ---- Ses motoru: tek AudioContext, yumuşak çan tınısı + hafif yankı ---- */
let audio = null;

function makeImpulse(ctx, seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function getAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audio) {
    try {
      const ctx = new AC();
      const master = ctx.createGain();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      comp.attack.value = 0.005;
      comp.release.value = 0.2;
      const dry = ctx.createGain();
      dry.gain.value = 0.85;
      const send = ctx.createGain();
      send.gain.value = 0.32;
      const verb = ctx.createConvolver();
      verb.buffer = makeImpulse(ctx, 1.8, 2.6);
      dry.connect(master);
      send.connect(verb);
      verb.connect(master);
      master.connect(comp);
      comp.connect(ctx.destination);
      audio = { ctx, master, dry, send };
    } catch (_) {
      return null;
    }
  }
  if (audio.ctx.state !== "running") audio.ctx.resume().catch(() => {});
  return audio;
}

/* Zengin çan / pluck: temel + inharmonic kısmi tonlar, yumuşak zarf, hafif FM ışıltısı */
function tone(a, freq, at, dur, vel, opts = {}) {
  const { ctx, dry, send } = a;
  const {
    partials = [
      [1, 1, 1],
      [2.01, 0.32, 0.55],
      [3.0, 0.12, 0.32],
      [4.96, 0.05, 0.2],
      [6.1, 0.02, 0.12],
    ],
    attack = 0.014,
    bright = 1,
  } = opts;
  partials.forEach(([mult, amp, decayMul]) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    o.type = "sine";
    o.frequency.setValueAtTime(freq * mult, at);
    o.detune.value = (Math.random() - 0.5) * 8;
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(
      Math.min(12000, freq * mult * 4 * bright + 800),
      at,
    );
    filt.frequency.exponentialRampToValueAtTime(
      Math.max(200, freq * mult * 0.8),
      at + dur * decayMul,
    );
    filt.Q.value = 0.7;
    const end = at + dur * decayMul;
    const peak = Math.max(0.0002, vel * amp);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    o.connect(filt);
    filt.connect(g);
    g.connect(dry);
    g.connect(send);
    o.start(at);
    o.stop(end + 0.04);
  });
}

/* Anlamlı, birbirinden ayırt edilebilir tınılar */
const SOUNDS = {
  /* Başlat: yükselen iki not — kararlı, motive edici */
  start: {
    notes: [
      [329.63, 0, 0.9], // E4
      [493.88, 0.11, 1.05], // B4
    ],
    vel: 0.3,
    bright: 1.05,
  },
  /* Duraklat: alçalan, yumuşak kapanış */
  pause: {
    notes: [
      [493.88, 0, 0.7],
      [329.63, 0.1, 0.85],
    ],
    vel: 0.22,
    bright: 0.85,
  },
  /* Mola: ferah, sakin üçlü iniş */
  break: {
    notes: [
      [659.25, 0, 1.1], // E5
      [523.25, 0.18, 1.25], // C5
      [392.0, 0.36, 1.5], // G4
    ],
    vel: 0.28,
    bright: 0.95,
  },
  /* Odak (moladan dönüş): net yükselen arpej */
  focus: {
    notes: [
      [392.0, 0, 0.95],
      [493.88, 0.12, 1.0],
      [587.33, 0.24, 1.05],
      [783.99, 0.36, 1.2],
    ],
    vel: 0.3,
    bright: 1.1,
  },
  /* Blok tamam: coşkulu, çözümlü kadans + hafif koro */
  done: {
    notes: [
      [392.0, 0, 1.4],
      [493.88, 0.14, 1.5],
      [587.33, 0.28, 1.6],
      [783.99, 0.42, 1.8],
      [987.77, 0.58, 2.1],
    ],
    vel: 0.32,
    bright: 1.15,
    chorus: [523.25, 659.25, 783.99],
  },
};

function playSound(kind, force = false) {
  if (!force && !state.settings.sound) return;
  const def = SOUNDS[kind];
  const vol = clamp(state.settings.volume, 0, 100) / 100;
  if (!def || vol === 0) return;
  const a = getAudio();
  if (!a) return;
  a.master.gain.value = Math.pow(vol, 1.5) * 1.25;
  const t0 = a.ctx.currentTime + 0.025;
  def.notes.forEach(([f, off, dur], i) => {
    const last = kind === "done" && i === def.notes.length - 1;
    tone(a, f, t0 + off, dur || 1, def.vel * (last ? 1.2 : 1), {
      bright: def.bright || 1,
      attack: kind === "pause" ? 0.02 : 0.012,
    });
  });
  if (def.chorus) {
    def.chorus.forEach((f, i) =>
      tone(a, f, t0 + 0.55 + i * 0.04, 1.8, def.vel * 0.38, {
        bright: 0.9,
        attack: 0.03,
      }),
    );
  }
}

/* ---- Bildirim: Android Chrome "new Notification" desteklemez; Service Worker üzerinden gösterilir ---- */
let swReg = null;
async function registerSW() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return null;
  try {
    swReg = await navigator.serviceWorker.register("./sw.js");
  } catch (_) {}
  return swReg;
}

const isIOS =
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  navigator.standalone === true;
const notifGranted = () =>
  "Notification" in window && Notification.permission === "granted";

function notifHint() {
  if (!("Notification" in window))
    return isIOS && !isStandalone()
      ? "iPhone/iPad'de bildirim için: Paylaş → Ana Ekrana Ekle, sonra uygulamayı oradan aç."
      : "Bu tarayıcı bildirimleri desteklemiyor.";
  if (Notification.permission === "denied")
    return "İzin engellenmiş. Tarayıcının site ayarlarından bildirimlere izin ver.";
  return "Aşama bittiğinde (uygulama arka plandayken de) uyarı gönderir.";
}

async function showNotification(title, body) {
  if (!notifGranted()) return false;
  const opts = {
    body,
    tag: "focusblock",
    renotify: true,
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    vibrate: [200, 100, 200],
  };
  try {
    if ("serviceWorker" in navigator) {
      const reg =
        swReg ||
        (await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((r) => setTimeout(() => r(null), 1500)),
        ]));
      if (reg && reg.showNotification) {
        await reg.showNotification(title, opts);
        return true;
      }
    }
  } catch (_) {}
  try {
    const n = new Notification(title, opts);
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch (_) {
    return false;
  }
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    toast(notifHint());
    return false;
  }
  let perm = Notification.permission;
  if (perm === "default") {
    try {
      perm = await new Promise((resolve) => {
        const r = Notification.requestPermission(resolve);
        if (r && typeof r.then === "function") r.then(resolve);
      });
    } catch (_) {}
  }
  if (perm !== "granted") {
    toast(
      perm === "denied"
        ? "Bildirim izni engellenmiş — tarayıcı ayarlarından açmalısın"
        : "Bildirim izni verilmedi",
    );
    return false;
  }
  await registerSW();
  return true;
}

function notify(title, body) {
  if (!state.settings.notify) return;
  showNotification(title, body);
}

function buzz(pattern) {
  if (!state.settings.vibrate || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch (_) {}
}

/* Aşama bitişi: ses + bildirim + titreşim + (ekran açıksa) bildirim şeridi */
function announce(a) {
  playSound(a.sound);
  notify(a.title, a.body);
  buzz(a.sound === "done" ? [250, 120, 250, 120, 400] : [220, 110, 220]);
  if (!document.hidden) toast(`${a.title}  ${a.body}`);
}

/* ---- Ekranı açık tut (mobilde kilitlenince ses/bildirim kaçmasın) ---- */
let wakeLock = null;
let wakeBusy = false;
async function syncWakeLock() {
  if (!("wakeLock" in navigator) || wakeBusy) return;
  const want =
    state.settings.wakeLock && state.session.running && !document.hidden;
  if (!!wakeLock === want) return;
  wakeBusy = true;
  try {
    if (want) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => (wakeLock = null));
    } else if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (_) {
    wakeLock = null;
  } finally {
    wakeBusy = false;
  }
}

function toast(msg, cls = "") {
  const el = document.createElement("div");
  el.className = "toast" + (cls ? " " + cls : "");
  el.textContent = msg;
  const root = $("toastRoot");
  while (root.children.length >= 3) root.firstChild.remove();
  root.appendChild(el);
  setTimeout(() => el.remove(), cls === "tip" ? 1800 : 2600);
}

let modalResolve = null;
function beginModal(resolve) {
  if (modalResolve) {
    const r = modalResolve;
    modalResolve = null;
    r(false);
  }
  modalResolve = resolve;
}
function openModal(html) {
  $("modalRoot").innerHTML =
    `<div class="modal-backdrop" data-action="modalBackdrop"><div class="modal">${html}</div></div>`;
}
function closeModal(result = false) {
  $("modalRoot").innerHTML = "";
  if (modalResolve) {
    const r = modalResolve;
    modalResolve = null;
    r(result);
  }
}
function confirmDialog(title, message, okLabel = "Onayla", danger = false) {
  return new Promise((resolve) => {
    beginModal(resolve);
    openModal(`
      <h3>${esc(title)}</h3>
      <p>${esc(message)}</p>
      <div class="modal-actions">
        <button class="btn" data-action="modalNo">Vazgeç</button>
        <button class="btn ${danger ? "danger" : "primary"}" data-action="modalYes">${esc(okLabel)}</button>
      </div>`);
  });
}
/* Birden fazla seçenekli diyalog: seçilen değeri, vazgeçilirse false döner */
function choiceDialog(title, message, choices) {
  return new Promise((resolve) => {
    beginModal(resolve);
    openModal(`
      <h3>${esc(title)}</h3>
      <p>${esc(message)}</p>
      <div class="modal-actions col">
        ${choices
          .map(
            (c) =>
              `<button class="btn ${c.danger ? "danger" : c.primary ? "primary" : ""}" data-action="modalPick" data-v="${esc(c.value)}">${esc(c.label)}</button>`,
          )
          .join("")}
        <button class="btn" data-action="modalNo">Vazgeç</button>
      </div>`);
  });
}
function openTemplateModal() {
  beginModal(null);
  openModal(`
    <h3>Yeni blok türü</h3>
    <p>Bir şablonla başla; setleri, süreleri ve renkleri sonra istediğin gibi değiştirebilirsin.</p>
    <div class="tpl-list">
      ${TEMPLATES.map(
        (t, i) => `
        <button class="tpl" data-action="tpl" data-i="${i}">
          <span class="type-emoji" style="--c:${colorHex(t.color)}">${t.emoji}</span>
          <div><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></div>
        </button>`,
      ).join("")}
    </div>
    <div class="modal-actions"><button class="btn" data-action="modalNo">Kapat</button></div>`);
}

function applyAppearance() {
  const s = state.settings;
  const hex = colorHex(s.accent);
  const root = document.documentElement;
  root.dataset.theme = s.theme;
  root.style.setProperty("--accent", hex);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  root.style.setProperty(
    "--on-accent",
    (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? "#111827" : "#ffffff",
  );
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta)
    meta.setAttribute(
      "content",
      s.theme === "light"
        ? "#eef2f7"
        : s.theme === "forest"
          ? "#02231b"
          : s.theme === "ocean"
            ? "#070d1a"
            : "#09090b",
    );
}

/* ==========================================================================
   4. ZAMANLAYICI MOTORU
   ========================================================================== */
function mainLabelText() {
  const se = state.session;
  if (se.running) return "Duraklat";
  if (se.mode === "done") return "Yeniden Başla";
  return se.remaining < phaseTotal() ? "Devam Et" : "Başlat";
}

/* Sayfayı yeniden çizmeden yalnızca ana düğmeyi ve sayaç göstergelerini günceller
   (mobilde başlat/duraklat'ta ekranın "yenilenmiş" gibi görünmesini önler) */
function syncTimerUI() {
  renderShellState();
  const btn = document.querySelector(".ctl.main");
  if (btn) {
    const label = mainLabelText();
    btn.innerHTML = `${state.session.running ? I.pause : I.play}<span>${label}</span>`;
    btn.setAttribute("aria-label", label);
  }
  updateTimerDOM();
}

function startTimer() {
  const se = state.session;
  const wasDone = se.mode === "done";
  if (wasDone) restartRun();
  se.running = true;
  se.endAt = Date.now() + se.remaining * 1000;
  playSound("start");
  save();
  if (wasDone) refreshAll();
  else syncTimerUI();
}

function pauseTimer() {
  const se = state.session;
  if (se.running) {
    se.remaining = Math.max(0, Math.ceil((se.endAt - Date.now()) / 1000));
  }
  se.running = false;
  se.endAt = null;
  save();
}

function toggleTimer() {
  if (state.session.running) {
    pauseTimer();
    playSound("pause");
    syncTimerUI();
  } else {
    startTimer();
  }
}

function restartRun() {
  const se = state.session;
  se.running = false;
  se.endAt = null;
  se.setIndex = 0;
  se.mode = "work";
  se.remaining = curType().sets[0].work * 60;
  save();
}

function resetPhase() {
  const se = state.session;
  if (se.mode === "done") return restartRun();
  se.running = false;
  se.endAt = null;
  se.remaining = phaseTotal();
  save();
}

function jumpToSet(i) {
  const se = state.session;
  if (se.running) return toast("Önce zamanlayıcıyı duraklat");
  if (i < 0 || i >= curType().sets.length) return;
  se.setIndex = i;
  se.mode = "work";
  se.remaining = curSet().work * 60;
  save();
  refreshAll();
}

/* Bir aşamanın bitişini işler (geçmişe yazar, sıradaki aşamaya geçer).
   Duyuru bilgisini döndürür; ekranı yenilemek / kaydetmek çağıranın işidir. */
function advancePhase(skipped, at = Date.now()) {
  const se = state.session;
  const type = curType();
  const set = curSet();
  const lastIdx = type.sets.length - 1;
  const label = set.title || `Set ${se.setIndex + 1}`;
  let ann = null;

  if (se.mode === "work") {
    const total = set.work * 60;
    const done = skipped ? Math.floor((total - se.remaining) / 60) : set.work;
    if (done >= 1) {
      logHistory(skipped ? "partial" : "completed", done, at);
      if (skipped) toast(`${done} dk geçmişe kaydedildi`);
    }
    if (se.setIndex >= lastIdx) {
      se.mode = "done";
      se.remaining = 0;
      ann = {
        sound: "done",
        title: "Tebrikler! 🎉",
        body: `${type.name} bloğunun tüm setleri tamamlandı.`,
      };
    } else if (set.break <= 0) {
      se.setIndex++;
      se.mode = "work";
      se.remaining = curSet().work * 60;
      ann = {
        sound: "focus",
        title: "Sıradaki set 🎯",
        body: curSet().title || `Set ${se.setIndex + 1}`,
      };
    } else {
      se.mode = "break";
      se.remaining = set.break * 60;
      ann = {
        sound: "break",
        title: "Mola zamanı ☕",
        body: `"${label}" bitti. ${set.break} dk dinlen.`,
      };
    }
  } else if (se.mode === "break") {
    se.setIndex++;
    se.mode = "work";
    se.remaining = curSet().work * 60;
    ann = {
      sound: "focus",
      title: "Odak zamanı 🎯",
      body: curSet().title || `Set ${se.setIndex + 1}`,
    };
  } else {
    restartRun();
  }

  const auto = state.settings.autoStart && se.mode !== "done";
  se.running = auto;
  se.endAt = auto ? at + se.remaining * 1000 : null;
  return skipped ? null : ann;
}

/* Aynı anda açık başka sekme/pencere durumu ilerlettiyse onu esas al (çift kayıt olmasın) */
function adoptStoredIfNewer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const st = JSON.parse(raw);
    const a = st && st.session;
    const se = state.session;
    if (
      a &&
      (a.endAt !== se.endAt || a.setIndex !== se.setIndex || a.mode !== se.mode)
    ) {
      state = normalizeState(st);
      initSyncTracking();
      if (!typeById(ui.selectedTypeId)) ui.selectedTypeId = state.activeTypeId;
      applyAppearance();
      refreshAll();
      return true;
    }
  } catch (_) {}
  return false;
}

/* Süre dolduysa (arka plan, kilitli ekran, sayfa yeniden yüklendi) aşamaları sırayla tamamlar */
function catchUp() {
  const se = state.session;
  if (!se.running || !se.endAt || se.endAt > Date.now()) return;
  if (adoptStoredIfNewer()) return;
  let n = 0;
  let ann = null;
  let lastAt = Date.now();
  while (se.running && se.endAt && se.endAt <= Date.now() && n < 80) {
    lastAt = se.endAt;
    ann = advancePhase(false, se.endAt) || ann;
    n++;
  }
  if (!n) return;
  save();
  refreshAll();
  if (ann && Date.now() - lastAt < 90000) announce(ann);
  else if (n > 0)
    toast(
      n > 1
        ? `Sen yokken ${n} aşama tamamlandı`
        : "Sen yokken bir aşama tamamlandı",
    );
}

function tick() {
  const se = state.session;
  if (!se.running || !se.endAt) return;
  const left = se.endAt - Date.now();
  if (left <= 0) return catchUp();
  const rem = Math.ceil(left / 1000);
  if (rem !== se.remaining) {
    se.remaining = rem;
    updateTimerDOM();
  }
}

function skipPhase() {
  const se = state.session;
  if (se.mode === "done") {
    restartRun();
    return refreshAll();
  }
  if (se.running) pauseTimer();
  advancePhase(true);
  save();
  refreshAll();
}

/* Sekme arka plandayken tarayıcı sayfa zamanlayıcılarını yavaşlatır; Worker kullanmak bunu büyük ölçüde önler */
function startTicker() {
  try {
    const src =
      "let t=null;onmessage=e=>{if(e.data==='start'&&!t)t=setInterval(()=>postMessage(1),500)}";
    const w = new Worker(
      URL.createObjectURL(new Blob([src], { type: "text/javascript" })),
    );
    w.onmessage = () => tick();
    w.postMessage("start");
  } catch (_) {}
  setInterval(tick, 250);
}

/* ---- Canlı DOM güncellemesi (her saniye) ---- */
const RING_C = 2 * Math.PI * 45;

function updateTimerDOM() {
  const se = state.session;
  const label = fmtClock(se.remaining);
  const set = curSet();
  document.title = se.running
    ? `(${label}) ${set.title || `Set ${se.setIndex + 1}`} · FocusBlock`
    : "FocusBlock Pro";

  if (ui.view !== "focus") return;
  const tEl = $("timerText");
  if (!tEl) return;
  tEl.textContent = se.mode === "done" ? "🎉" : label;

  const total = phaseTotal();
  const elapsed =
    se.mode === "done"
      ? 0
      : total > 0
        ? clamp((total - se.remaining) / total, 0, 1)
        : 0;
  const ring = $("ringBar");
  if (ring) ring.style.strokeDashoffset = String(RING_C * elapsed);
  const bar = $("planBar");
  if (bar) bar.style.width = `${(se.mode === "done" ? 1 : elapsed) * 100}%`;

  const left = $("runLeft");
  if (left) left.textContent = fmtDur(Math.ceil(runRemaining() / 60));
  const eta = $("runEta");
  if (eta)
    eta.textContent =
      se.mode === "done" ? "—" : fmtHM(Date.now() + runRemaining() * 1000);
}

function refreshAll() {
  renderShellState();
  render();
}

/* ==========================================================================
   5. GÖRÜNÜMLER
   ========================================================================== */
function buildShell() {
  const navHTML = NAV.map(
    (n) => `
    <button class="nav-btn" data-action="nav" data-view="${n.id}">
      ${n.icon}<span>${n.label}</span>${n.id === "focus" ? '<i class="nav-live"></i>' : ""}
    </button>`,
  ).join("");

  $("app").innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">${I.bolt}</div>
        <div class="brand-name">FocusBlock<small>Pro</small></div>
      </div>
      ${navHTML}
      <div class="side-spacer"></div>
      <div class="side-today">
        <div class="label">Bugün</div>
        <div class="value" id="sideToday"></div>
        <div class="bar"><i id="sideBar"></i></div>
      </div>
    </aside>
    <main class="view" id="view"></main>
    <nav class="bottom-nav">${navHTML}</nav>`;
}

function renderShellState() {
  const goal = state.settings.dailyGoal;
  const today = todayMinutes();
  const v = $("sideToday");
  if (v) v.innerHTML = `${fmtDur(today)} <small>/ ${fmtDur(goal)}</small>`;
  const b = $("sideBar");
  if (b) b.style.width = `${clamp((today / goal) * 100, 0, 100)}%`;
  $("app").classList.toggle("is-running", state.session.running);
  syncWakeLock();
  /* Gizlilik / İletişim alt sayfalarında "Ayarlar" menüsü vurgulu kalsın */
  const navView =
    ui.view === "privacy" || ui.view === "contact" ? "settings" : ui.view;
  document
    .querySelectorAll(".nav-btn")
    .forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.view === navView),
    );
}

function setView(v) {
  const changed = ui.view !== v;
  ui.view = v;
  renderShellState();
  render(changed);
}

/* animate=true yalnızca görünüm değişince: aynı sayfada yeniden çizimde animasyon/scroll sıçraması olmaz */
function render(animate = false) {
  const el = $("view");
  const scroll = el.scrollTop;
  const plan = el.querySelector(".plan-list");
  const planScroll = plan ? plan.scrollTop : 0;
  if (ui.view === "focus") el.innerHTML = focusHTML();
  else if (ui.view === "blocks") el.innerHTML = blocksHTML();
  else if (ui.view === "history") el.innerHTML = historyHTML();
  else if (ui.view === "stats") el.innerHTML = statsHTML();
  else if (ui.view === "settings") el.innerHTML = settingsHTML();
  else if (ui.view === "privacy") el.innerHTML = privacyHTML();
  else if (ui.view === "contact") el.innerHTML = contactHTML();

  const page = el.firstElementChild;
  if (animate) {
    el.scrollTop = 0;
    if (page) page.classList.add("enter");
  } else {
    el.scrollTop = scroll;
    const p2 = el.querySelector(".plan-list");
    if (p2) p2.scrollTop = planScroll;
  }
  const heat = el.querySelector(".heat-wrap");
  if (heat) heat.scrollLeft = heat.scrollWidth;
  updateTimerDOM();
}

/* ---------- ODAKLAN ---------- */
function focusHTML() {
  const se = state.session;
  const type = curType();
  const set = curSet();
  const n = type.sets.length;
  const isBreak = se.mode === "break";
  const done = se.mode === "done";
  const ringColor = isBreak ? BREAK_COLOR : colorHex(type.color);
  const today = todayMinutes();
  const goal = state.settings.dailyGoal;
  const streak = currentStreak();

  const modeText = done ? "Tamamlandı" : isBreak ? "Mola" : "Odaklanma";
  const mainLabel = mainLabelText();

  const nextText = done
    ? "Tüm setler bitti"
    : se.mode === "work"
      ? set.break > 0 && se.setIndex < n - 1
        ? `Sonra ${set.break} dk mola`
        : se.setIndex < n - 1
          ? "Sonra yeni set"
          : "Son set"
      : `Sonra: ${type.sets[se.setIndex + 1]?.title || `Set ${se.setIndex + 2}`}`;

  const planItems = type.sets
    .map((s, i) => {
      let cls = "pending";
      let icon = String(i + 1);
      if (done || i < se.setIndex) {
        cls = "done";
        icon = I.check;
      } else if (i === se.setIndex) {
        cls = "current";
      }
      const status =
        cls === "done"
          ? '<span class="badge ok">Tamam</span>'
          : cls === "current"
            ? `<span class="badge accent">${isBreak ? "Molada" : "Odakta"}</span>`
            : "";
      const bar =
        cls === "current"
          ? '<div class="bar mini"><i id="planBar"></i></div>'
          : "";
      return `
      <li class="plan-item ${cls}" data-action="jump" data-i="${i}">
        <span class="plan-icon">${icon}</span>
        <div class="plan-body">
          <div class="plan-title ${s.title ? "" : "muted"}">${esc(s.title || `Set ${i + 1}`)}</div>
          <div class="plan-meta">${s.work} dk odak${i < n - 1 && s.break > 0 ? ` · ${s.break} dk mola` : ""}</div>
          ${bar}
        </div>
        ${status}
      </li>`;
    })
    .join("");

  return `
  <div class="page" style="--ring:${ringColor}">
    <header class="page-head">
      <div>
        <h1>Odaklan</h1>
        <p>${new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}${streak > 0 ? ` · 🔥 ${streak} günlük seri` : ""}</p>
      </div>
      <div class="goal-chip">
        <div class="row"><span>Günlük hedef</span><span>${fmtDur(today)} / ${fmtDur(goal)}</span></div>
        <div class="bar"><i style="width:${clamp((today / goal) * 100, 0, 100)}%"></i></div>
      </div>
    </header>

    <div class="chips">
      ${state.types
        .map(
          (t) =>
            `<button class="chip ${t.id === type.id ? "active" : ""}" style="--chip:${colorHex(t.color)}" data-action="pickType" data-id="${t.id}">${t.emoji} ${esc(t.name)}</button>`,
        )
        .join("")}
      <button class="chip" data-action="nav" data-view="blocks">＋ Düzenle</button>
    </div>

    <div class="focus-grid">
      <section class="card timer-card">
        <div class="timer-top">
          <span class="mode-badge">${modeText}</span>
          <span class="set-count">${done ? `${n}/${n}` : `Set ${se.setIndex + 1}/${n}`}</span>
        </div>
        <div class="set-title">
          ${esc(set.title || `Set ${se.setIndex + 1}`)}
          <small>${type.emoji} ${esc(type.name)}</small>
        </div>

        <div class="ring-wrap">
          <svg viewBox="0 0 100 100">
            <circle class="ring-track" cx="50" cy="50" r="45" fill="none" stroke-width="3.2" />
            <circle id="ringBar" class="ring-bar" cx="50" cy="50" r="45" fill="none" stroke-width="3.8"
              stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="0" />
          </svg>
          <div class="ring-center">
            <div class="timer-text" id="timerText">${fmtClock(se.remaining)}</div>
            <div class="timer-sub">${esc(nextText)}</div>
          </div>
        </div>

        <div class="controls">
          <button class="ctl" data-action="reset" title="Bu aşamayı sıfırla">${I.reset}</button>
          <button class="ctl main" data-action="toggle" aria-label="${mainLabel}">${se.running ? I.pause : I.play}<span>${mainLabel}</span></button>
          <button class="ctl" data-action="skip" title="Aşamayı atla">${I.skip}</button>
        </div>
      </section>

      <section class="card plan-card">
        <div class="card-head">
          <span class="card-title">Set planı</span>
          <button class="btn small" data-action="restartRun">${I.reset} Baştan</button>
        </div>
        <ol class="plan-list">${planItems}</ol>
        <div class="plan-foot">
          <div><b>${fmtDur(sumWork(type))}</b><span>Toplam odak</span></div>
          <div><b id="runLeft">—</b><span>Kalan</span></div>
          <div><b id="runEta">—</b><span>Tahmini bitiş</span></div>
        </div>
      </section>
    </div>
  </div>`;
}

/* ---------- BLOKLAR ---------- */
function typeCardHTML(t) {
  const isActive = t.id === state.activeTypeId;
  return `
  <button class="type-card ${t.id === ui.selectedTypeId ? "selected" : ""}" style="--c:${colorHex(t.color)}" data-action="selType" data-id="${t.id}">
    <span class="type-emoji">${t.emoji}</span>
    <div style="min-width:0">
      <div class="name"><span>${esc(t.name)}</span>${isActive ? '<span class="badge accent">Aktif</span>' : ""}</div>
      <div class="meta">${t.sets.length} set · ${fmtDur(sumWork(t))} odak</div>
    </div>
  </button>`;
}

function editorHTML(t) {
  const rows = t.sets
    .map(
      (s, i) => `
    <div class="set-row" data-i="${i}">
      <span class="no">${i + 1}</span>
      <input class="input" data-field="setTitle" maxlength="80" placeholder="Bu sette ne yapılacak?" value="${esc(s.title)}" />
      <label class="num-field"><span>Odak dk</span><input class="input num" data-field="setWork" type="number" inputmode="numeric" min="1" max="180" value="${s.work}" aria-label="Odak süresi (dk)" /></label>
      <label class="num-field"><span>Mola dk</span><input class="input num" data-field="setBreak" type="number" inputmode="numeric" min="0" max="60" value="${s.break}" aria-label="Mola süresi (dk)" /></label>
      <div class="row-actions">
        <button class="icon-btn" data-action="moveSet" data-dir="-1" ${i === 0 ? "disabled" : ""} title="Yukarı taşı">${I.up}</button>
        <button class="icon-btn" data-action="moveSet" data-dir="1" ${i === t.sets.length - 1 ? "disabled" : ""} title="Aşağı taşı">${I.down}</button>
        <button class="icon-btn" data-action="dupSet" title="Kopyala">${I.copy}</button>
        <button class="icon-btn del" data-action="delSet" title="Seti sil">${I.trash}</button>
      </div>
    </div>`,
    )
    .join("");

  return `
  <div class="editor-head">
    <div>
      <label class="field-label">Blok adı</label>
      <input class="input" data-field="typeName" maxlength="40" value="${esc(t.name)}" placeholder="Örn: KPSS Tarih" />
    </div>
    <div>
      <label class="field-label">Simge</label>
      <div class="emoji-row">
        ${EMOJIS.map((e) => `<button class="emoji-btn ${e === t.emoji ? "on" : ""}" data-action="emoji" data-v="${e}">${e}</button>`).join("")}
      </div>
    </div>
    <div>
      <label class="field-label">Renk</label>
      <div class="color-row">
        ${PALETTE.map((c) => `<button class="swatch ${c.id === t.color ? "on" : ""}" style="--c:${c.hex}" data-action="color" data-v="${c.id}" aria-label="${c.id}"></button>`).join("")}
      </div>
    </div>
  </div>

  <div>
    <div class="sets-head">
      <div><b>Setler</b><span id="setSummary">${t.sets.length} set · ${fmtDur(sumWork(t))} odak</span></div>
      <button class="btn small" data-action="addSet">${I.plus} Set ekle</button>
    </div>
    <div class="set-cols"><span>#</span><span>Bu sette ne yapılacak?</span><span>Odak</span><span>Mola</span><span></span></div>
    <div class="set-list">${rows}</div>
  </div>

  <div class="bulk">
    <span>Tüm setlere uygula:</span>
    Odak <input class="input num" id="bulkWork" type="number" inputmode="numeric" min="1" max="180" value="${t.sets[0].work}" /> dk
    Mola <input class="input num" id="bulkBreak" type="number" inputmode="numeric" min="0" max="60" value="${t.sets[0].break}" /> dk
    <button class="btn small" data-action="bulkApply">Uygula</button>
  </div>

  <div class="editor-foot">
    <button class="btn primary grow" data-action="startType">${I.play} Bu bloğu başlat</button>
    <button class="btn" data-action="dupType">${I.copy} Kopyala</button>
    <button class="btn danger" data-action="delType">${I.trash} Sil</button>
  </div>`;
}

function blocksHTML() {
  if (!typeById(ui.selectedTypeId)) ui.selectedTypeId = state.activeTypeId;
  const t = typeById(ui.selectedTypeId);
  return `
  <div class="page">
    <header class="page-head">
      <div>
        <h1>Bloklar</h1>
        <p>Blok türleri oluştur; her blokta kaç set olacağını ve hangi sette ne yapılacağını belirle.</p>
      </div>
      <div class="head-actions"><button class="btn primary" data-action="addType">${I.plus} Yeni blok</button></div>
    </header>
    <div class="blocks-layout">
      <div class="type-list" id="typeList">${state.types.map(typeCardHTML).join("")}</div>
      <section class="card editor" id="typeEditor">${editorHTML(t)}</section>
    </div>
  </div>`;
}

function refreshTypeList() {
  const l = $("typeList");
  if (l) l.innerHTML = state.types.map(typeCardHTML).join("");
  const t = typeById(ui.selectedTypeId);
  const s = $("setSummary");
  if (s && t)
    s.textContent = `${t.sets.length} set · ${fmtDur(sumWork(t))} odak`;
}

function refreshEditor() {
  const e = $("typeEditor");
  const t = typeById(ui.selectedTypeId);
  if (e && t) e.innerHTML = editorHTML(t);
  refreshTypeList();
}

/* Aktif bloğun düzenlenmesi sonrası oturumu tutarlı tut */
function syncSession(typeId) {
  if (typeId === state.activeTypeId) {
    const se = state.session;
    const n = curType().sets.length;
    if (se.setIndex > n - 1) se.setIndex = n - 1;
    if (!se.running && se.mode !== "done") se.remaining = phaseTotal();
  }
  save();
  renderShellState();
  updateTimerDOM();
}

/* ---------- GEÇMİŞ ---------- */
function historyHTML() {
  const { type, range } = ui.hist;
  const now = Date.now();
  const from =
    range === "all"
      ? 0
      : startOfDay(addDays(new Date(), -(parseInt(range) - 1))).getTime();
  const list = state.history
    .filter((h) => h.ts >= from && (type === "all" || h.typeId === type))
    .sort((a, b) => b.ts - a.ts);

  const total = list.reduce((a, h) => a + h.minutes, 0);
  const doneCount = list.filter((h) => h.status === "completed").length;
  const groups = {};
  list.forEach((h) => (groups[dayKey(h.ts)] ||= []).push(h));
  const keys = Object.keys(groups).sort().reverse();

  const ranges = [
    ["1", "Bugün"],
    ["7", "7 gün"],
    ["30", "30 gün"],
    ["all", "Tümü"],
  ];

  return `
  <div class="page">
    <header class="page-head">
      <div><h1>Geçmiş</h1><p>Tamamladığın tüm odak setleri burada kayıtlı.</p></div>
      <div class="head-actions">
       
      </div>
    </header>

    <div class="filters">
      <div class="chips">
        ${ranges.map(([id, l]) => `<button class="chip ${range === id ? "active" : ""}" data-action="hRange" data-id="${id}">${l}</button>`).join("")}
      </div>
      <div class="chips">
        <button class="chip ${type === "all" ? "active" : ""}" data-action="hType" data-id="all">Tüm bloklar</button>
        ${state.types.map((t) => `<button class="chip ${type === t.id ? "active" : ""}" style="--chip:${colorHex(t.color)}" data-action="hType" data-id="${t.id}">${t.emoji} ${esc(t.name)}</button>`).join("")}
      </div>
    </div>

    <div class="sum-row">
      <div class="card sum-card"><span class="card-title">Toplam süre</span><b>${fmtDur(total)}</b></div>
      <div class="card sum-card"><span class="card-title">Tamamlanan set</span><b>${doneCount}</b></div>
      <div class="card sum-card"><span class="card-title">Kayıt</span><b>${list.length}</b></div>
    </div>

    ${
      keys.length
        ? keys
            .map((k) => {
              const items = groups[k];
              const dayTotal = items.reduce((a, h) => a + h.minutes, 0);
              return `
        <div class="day-group">
          <div class="day-head"><b>${esc(dayLabel(k))}</b><span>${fmtDur(dayTotal)} · ${items.length} kayıt</span></div>
          <div class="hist-list">
            ${items
              .map(
                (h) => `
              <div class="hist-item">
                <span class="type-emoji" style="--c:${colorHex(h.color)}">${h.emoji}</span>
                <div class="hist-main">
                  <div class="t">${esc(h.setTitle || `Set ${h.setNo}`)}</div>
                  <div class="s">${esc(h.typeName)} · Set ${h.setNo} · ${fmtHM(h.ts)}</div>
                </div>
                <div class="hist-right">
                  <b>${fmtDur(h.minutes)}</b>
                  <span class="badge ${h.status === "completed" ? "ok" : "part"}">${h.status === "completed" ? "Tamamlandı" : "Yarım"}</span>
                </div>
                <button class="icon-btn del" data-action="delHist" data-id="${h.id}" title="Kaydı sil">${I.trash}</button>
              </div>`,
              )
              .join("")}
          </div>
        </div>`;
            })
            .join("")
        : `<div class="card empty"><b>🕑</b>Bu filtrede kayıt yok. Bir set tamamladığında burada görünür.</div>`
    }
  </div>`;
}

/* ---------- İSTATİSTİK ---------- */
function statsHTML() {
  const days = ui.statsRange;
  const goal = state.settings.dailyGoal;
  const mMap = minutesByDay();
  const today = startOfDay();

  let span = days;
  if (span === 0) {
    const keys = Object.keys(mMap).sort();
    if (keys.length) {
      const first = new Date(keys[0] + "T12:00:00");
      span = Math.max(
        7,
        Math.round((today - startOfDay(first)) / 86400000) + 1,
      );
    } else {
      span = 30;
    }
    span = Math.min(span, 730); /* grafik için üst sınır */
  }

  const list = [];
  for (let i = span - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    list.push({ d, key: dayKey(d), min: mMap[dayKey(d)] || 0 });
  }
  const from = days === 0 ? 0 : list[0].d.getTime();
  const inRange =
    days === 0
      ? state.history.slice()
      : state.history.filter((h) => h.ts >= from);

  const total = list.reduce((a, x) => a + x.min, 0);
  const activeDays = list.filter((x) => x.min > 0).length;
  const completed = inRange.filter((h) => h.status === "completed").length;
  const partial = inRange.length - completed;
  const best = list.reduce((a, x) => (x.min > a.min ? x : a), list[0]);
  const hitDays = list.filter((x) => x.min >= goal).length;

  /* Günlük çubuk grafik */
  const maxV = Math.max(...list.map((x) => x.min), goal, 1);
  const H = 140;
  const wd = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const bars = list
    .map((x, i) => {
      let lb = "";
      const n = list.length;
      if (n <= 7) lb = wd[x.d.getDay()];
      else if (n <= 31)
        lb = i % 5 === 0 || i === n - 1 ? String(x.d.getDate()) : "";
      else if (n <= 100)
        lb =
          i % 14 === 0 || i === n - 1
            ? `${x.d.getDate()}/${x.d.getMonth() + 1}`
            : "";
      else
        lb =
          i % 30 === 0 || i === n - 1
            ? `${x.d.getMonth() + 1}/${String(x.d.getFullYear()).slice(2)}`
            : "";
      const h = x.min > 0 ? Math.max(4, Math.round((x.min / maxV) * H)) : 3;
      return `<div class="col" title="${esc(dayLabel(x.key))}: ${fmtDur(x.min)}" data-action="tip" data-tip="${esc(dayLabel(x.key))}: ${fmtDur(x.min)}">
        <div class="b ${x.min === 0 ? "zero" : x.min >= goal ? "hit" : ""}" style="height:${h}px"></div>
        <div class="lb">${lb}</div></div>`;
    })
    .join("");
  const goalBottom = 20 + Math.round((goal / maxV) * H);

  /* Blok dağılımı */
  const dist = {};
  inRange.forEach((h) => {
    const k = JSON.stringify([h.typeName, h.color, h.emoji]);
    dist[k] = (dist[k] || 0) + h.minutes;
  });
  const distList = Object.entries(dist)
    .map(([k, v]) => {
      const [name, color, emoji] = JSON.parse(k);
      return { name, color, emoji, v };
    })
    .sort((a, b) => b.v - a.v);
  const distTotal = distList.reduce((a, x) => a + x.v, 0);

  /* Isı haritası */
  const allKeys = Object.keys(mMap)
    .filter((k) => mMap[k] > 0)
    .sort();

  /* Veri başlangıcı */
  let heatFirst = allKeys.length ? new Date(allKeys[0] + "T12:00:00") : today;

  /* En az 1 yıl, en fazla 2 yıl göster */
  const minStart = addDays(today, -364);
  const maxStart = addDays(today, -7 * 104);

  /* En az 1 yıl göster */
  if (heatFirst > minStart) {
    heatFirst = minStart;
  }

  /* En fazla 2 yıl geriye git */
  if (heatFirst < maxStart) {
    heatFirst = maxStart;
  }

  /* Pazartesi hizala */
  const heatDow = (heatFirst.getDay() + 6) % 7;
  heatFirst = addDays(heatFirst, -heatDow);

  /* Bugünün bulunduğu haftanın Pazar günü */
  const endDow = (today.getDay() + 6) % 7;
  const heatEnd = addDays(today, 6 - endDow);

  const totalDays = Math.round((heatEnd - heatFirst) / 86400000) + 1;

  const weeks = Math.ceil(totalDays / 7);

  const monthNames = [
    "Oca",
    "Şub",
    "Mar",
    "Nis",
    "May",
    "Haz",
    "Tem",
    "Ağu",
    "Eyl",
    "Eki",
    "Kas",
    "Ara",
  ];

  let cells = "";
  let monthLabels = [];
  let lastMonthKey = "";

  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(heatFirst, i);
    const key = dayKey(d);

    const isFuture = d > today;
    const m = isFuture ? 0 : mMap[key] || 0;

    const lvl = isFuture
      ? -1
      : m <= 0
        ? 0
        : m < goal * 0.25
          ? 1
          : m < goal * 0.5
            ? 2
            : m < goal
              ? 3
              : 4;

    /* Her haftanın başında ay kontrolü */
    if (i % 7 === 0) {
      const mk = `${d.getFullYear()}-${d.getMonth()}`;

      if (mk !== lastMonthKey) {
        lastMonthKey = mk;

        monthLabels.push({
          week: Math.floor(i / 7),
          label:
            d.getMonth() === 0
              ? `${monthNames[d.getMonth()]} ${d.getFullYear()}`
              : monthNames[d.getMonth()],
        });
      }
    }

    const tip = isFuture ? "" : `${esc(dayLabel(key))}: ${fmtDur(m)}`;

    cells += `
    <div
      class="cell ${lvl < 0 ? "off" : lvl ? "l" + lvl : ""}"
      ${tip ? `title="${tip}" data-action="tip" data-tip="${tip}"` : ""}
    ></div>
  `;
  }

  const monthRow = monthLabels
    .map(
      (x) =>
        `<span class="heat-month" style="grid-column:${x.week + 1}">${x.label}</span>`,
    )
    .join("");

  const heatTitle =
    weeks <= 16
      ? `Son ${weeks} hafta`
      : weeks <= 53
        ? "Son 1 yıl"
        : `Son ${Math.round(weeks / 52)} yıl`;

  /* Ritim: saat & haftanın günü */
  const hours = Array(24).fill(0);
  const wdays = Array(7).fill(0);
  inRange.forEach((h) => {
    const d = new Date(h.ts);
    hours[d.getHours()] += h.minutes;
    wdays[(d.getDay() + 6) % 7] += h.minutes;
  });
  const miniCol = (arr, labels, names) => {
    const mx = Math.max(...arr, 1);
    return arr
      .map(
        (v, i) =>
          `<div class="col" title="${fmtDur(v)}" data-action="tip" data-tip="${esc(names[i])}: ${fmtDur(v)}"><div class="b ${v === 0 ? "zero" : ""}" style="height:${v > 0 ? Math.max(4, Math.round((v / mx) * 80)) : 3}px"></div><div class="lb">${labels[i] ?? ""}</div></div>`,
      )
      .join("");
  };
  const hourLabels = hours.map((_, i) => (i % 6 === 0 ? pad(i) : ""));
  const peakHour = hours.indexOf(Math.max(...hours));
  const peakDay = wdays.indexOf(Math.max(...wdays));
  const wdNames = [
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi",
    "Pazar",
  ];

  const ranges = [7, 30, 90, 365, 0];
  const rangeLabel = (r) =>
    r === 0 ? "Tümü" : r === 365 ? "Son 1 yıl" : `Son ${r} gün`;

  return `
  <div class="page">
    <header class="page-head">
      <div><h1>İstatistik</h1><p>Çalışma alışkanlıklarını ve ilerlemeni detaylı incele.</p></div>
      <div class="chips">
        ${ranges.map((r) => `<button class="chip ${days === r ? "active" : ""}" data-action="sRange" data-id="${r}">${rangeLabel(r)}</button>`).join("")}
      </div>
    </header>

    <div class="kpi-grid">
      <div class="card kpi"><span class="card-title">Toplam odak</span><b>${fmtDur(total)}</b><small>${activeDays} aktif gün</small></div>
      <div class="card kpi"><span class="card-title">Günlük ortalama</span><b>${fmtDur(total / list.length)}</b><small>Hedef: ${fmtDur(goal)}</small></div>
      <div class="card kpi"><span class="card-title">Tamamlanan set</span><b>${completed}</b><small>${partial} yarım bırakıldı</small></div>
      <div class="card kpi"><span class="card-title">Seri</span><b>🔥 ${currentStreak(mMap)} gün</b><small>En uzun: ${longestStreak(mMap)} gün</small></div>
      <div class="card kpi"><span class="card-title">En verimli gün</span><b>${best.min > 0 ? fmtDur(best.min) : "—"}</b><small>${best.min > 0 ? esc(dayLabel(best.key)) : "Henüz veri yok"}</small></div>
      <div class="card kpi"><span class="card-title">Hedef tutturma</span><b>${hitDays}/${list.length}</b><small>gün hedefe ulaşıldı</small></div>
    </div>

    <div class="stats-grid">
      <section class="card wide">
        <div class="card-head"><span class="card-title">Günlük odak süresi</span></div>
        <div class="chart ${list.length > 45 ? "dense" : ""}">
          <div class="goal-line" style="bottom:${goalBottom}px"><span>Hedef ${fmtDur(goal)}</span></div>
          ${bars}
        </div>
        <div class="legend"><span><i></i>Odak süresi</span><span><i class="g"></i>Hedef aşıldı</span></div>
      </section>

      <section class="card">
        <div class="card-head"><span class="card-title">Blok dağılımı</span></div>
        ${
          distList.length
            ? `<div class="stack">${distList.map((x) => `<i style="--c:${colorHex(x.color)};width:${(x.v / distTotal) * 100}%"></i>`).join("")}</div>
               ${distList.map((x) => `<div class="dist-row"><span class="dot" style="--c:${colorHex(x.color)}"></span><span class="n">${x.emoji} ${esc(x.name)}</span><span class="v">${fmtDur(x.v)} · %${Math.round((x.v / distTotal) * 100)}</span></div>`).join("")}`
            : '<div class="empty"><b>📊</b>Bu aralıkta veri yok.</div>'
        }
      </section>

      <section class="card">
        <div class="card-head"><span class="card-title">Ritim</span></div>
        <div class="rhythm">
          <div>
            <div class="field-label">Saate göre ${total ? `· en yoğun ${pad(peakHour)}:00` : ""}</div>
            <div class="mini-chart">${miniCol(
              hours,
              hourLabels,
              hours.map((_, i) => `${pad(i)}:00`),
            )}</div>
          </div>
          <div>
            <div class="field-label">Güne göre ${total ? `· en yoğun ${wdNames[peakDay]}` : ""}</div>
            <div class="mini-chart">${miniCol(wdays, ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"], wdNames)}</div>
          </div>
        </div>
      </section>

      <section class="card wide">
        <div class="card-head"><span class="card-title">Aktivite · ${heatTitle}</span></div>
        <div class="heat-wrap gh" style="--weeks:${weeks}">
          <div class="heat-months">${monthRow}</div>
          <div class="heat-body">
            <div class="heat-days"><span>Pzt</span><span></span><span>Çar</span><span></span><span>Cum</span><span></span><span>Paz</span></div>
            <div class="heat">${cells}</div>
          </div>
        </div>
        <div class="legend"><span>Az</span><span class="cell" style="display:inline-block"></span><span class="cell l1" style="display:inline-block"></span><span class="cell l2" style="display:inline-block"></span><span class="cell l3" style="display:inline-block"></span><span class="cell l4" style="display:inline-block"></span><span>Hedef</span></div>
      </section>
    </div>
  </div>`;
}

/* ---------- AYARLAR ---------- */
function settingsHTML() {
  const s = state.settings;
  const sw = (key, on) =>
    `<button class="switch ${on ? "on" : ""}" role="switch" aria-checked="${on}" data-action="toggleSetting" data-key="${key}"></button>`;
  return `
  <div class="page">
    <header class="page-head"><div><h1>Ayarlar</h1><p>Zamanlayıcı davranışını, görünümü ve verilerini yönet.</p></div></header>

    <div class="settings-grid">
      <div class="settings-col">
      <section class="card set-section">
        <span class="card-title">Zamanlayıcı</span>
        <div class="s-row">
          <div class="info"><b>Sonraki aşamayı otomatik başlat</b><span>Odak ve mola bittiğinde sayaç kendiliğinden devam eder.</span></div>
          ${sw("autoStart", s.autoStart)}
        </div>
        <div class="s-row nb">
          <div class="info"><b>Sesler</b><span>Yumuşak çan tınılı başlangıç, mola ve bitiş sesleri.</span></div>
          ${sw("sound", s.sound)}
        </div>
        <div class="sound-sub ${s.sound ? "" : "off"}">
          <div class="s-row nb">
            <div class="info"><b>Ses seviyesi</b><span id="volLabel">%${s.volume}</span></div>
            <input class="range" type="range" min="0" max="100" step="5" value="${s.volume}" data-field="volume" style="--p:${s.volume}%" aria-label="Ses seviyesi" />
          </div>
          <div class="sound-tests">
            <button class="chip" data-action="testSound" data-kind="start">▶ Başlangıç</button>
            <button class="chip" data-action="testSound" data-kind="break">☕ Mola</button>
            <button class="chip" data-action="testSound" data-kind="focus">🎯 Odak</button>
            <button class="chip" data-action="testSound" data-kind="done">🎉 Bitiş</button>
          </div>
        </div>
        <div class="s-row">
          <div class="info"><b>Bildirimler</b><span>${esc(notifHint())}</span></div>
          ${sw("notify", s.notify && notifGranted())}
        </div>
        ${s.notify && notifGranted() ? `<div class="sound-tests"><button class="chip" data-action="testNotif">🔔 Test bildirimi gönder</button></div>` : ""}
        ${"vibrate" in navigator ? `<div class="s-row"><div class="info"><b>Titreşim</b><span>Aşama bittiğinde telefon titrer.</span></div>${sw("vibrate", s.vibrate)}</div>` : ""}
        ${"wakeLock" in navigator ? `<div class="s-row"><div class="info"><b>Ekranı açık tut</b><span>Sayaç çalışırken ekran kapanmaz; ses ve bildirim kaçmaz.</span></div>${sw("wakeLock", s.wakeLock)}</div>` : ""}
        <div class="s-row">
          <div class="info"><b>Günlük hedef</b><span>İstatistik ve ilerleme çubukları buna göre hesaplanır.</span></div>
          <div class="stepper">
            <button class="icon-btn" data-action="goal" data-d="-15">−</button>
            <b>${fmtDur(s.dailyGoal)}</b>
            <button class="icon-btn" data-action="goal" data-d="15">+</button>
          </div>
        </div>
      </section>

      <section class="card set-section">
        <span class="card-title">Görünüm</span>
        <div class="theme-grid">
          ${THEMES.map((t) => `<button class="theme-card ${s.theme === t.id ? "on" : ""}" style="--sw:${t.sw}" data-action="theme" data-id="${t.id}"><span class="sw"></span>${t.name}</button>`).join("")}
        </div>
        <div style="padding-top:18px">
          <label class="field-label">Vurgu rengi</label>
          <div class="color-row">
            ${PALETTE.map((c) => `<button class="swatch ${s.accent === c.id ? "on" : ""}" style="--c:${c.hex}" data-action="accent" data-id="${c.id}" aria-label="${c.id}"></button>`).join("")}
          </div>
        </div>
      </section>

      </div>
      <div class="settings-col">
      <section class="card set-section">
        <span class="card-title">Google Drive eşitleme</span>
        <div id="syncBox">${syncBoxHTML()}</div>
      </section>

      <section class="card set-section">
        <span class="card-title">Veriler</span>
        <div class="s-row nb">
          <div class="info">
            <b>Kayıtlı veri</b>
            <span>${state.types.length} blok, ${state.history.length} kayıt${state.settings.lastBackup ? ` · son yedek ${whenText(state.settings.lastBackup)}` : ""}</span>
          </div>
        </div>
        <div class="data-actions" style="padding-top:4px">
          <button class="btn primary" data-action="exportBackup">${I.download} Tam yedek indir</button>
          <button class="btn" data-action="importBackup">${I.upload} Yedekten geri yükle</button>
          <!-- <button class="btn" data-action="exportCSV">${I.download} Geçmişi CSV</button> ########### GEÇİCİ OLARAK KAPALI  -->
        </div>
        <p class="sync-note">Tam yedek tüm blokları, geçmişi, ayarları ve silme mezar taşlarını içerir. Cihazlar arasında aktarmak veya Drive dışı saklamak için kullan. Geri yüklerken birleştir veya üzerine yaz seçebilirsin.</p>
        ${
          hasUndo()
            ? `<div class="s-row" style="margin-top:8px">
                <div class="info"><b>Son işlemi geri al</b><span>İçe aktarma, temizleme veya sıfırlamadan önceki duruma dön.</span></div>
                <button class="btn small" data-action="undoImport">${I.reset} Geri al</button>
              </div>`
            : ""
        }
        <div class="s-row" style="margin-top:8px">
          <div class="info"><b>Geçmişi temizle</b><span>${state.history.length} kayıt silinir; bloklar ve ayarlar kalır.</span></div>
          <button class="btn danger small" data-action="clearHist" ${state.history.length ? "" : "disabled"}>Temizle</button>
        </div>
        <div class="s-row">
          <div class="info"><b>Her şeyi sıfırla</b><span>Tüm veriler silinir ve varsayılan bloklar geri gelir. Drive'a bağlıysan silme diğer cihazlara da yayılır.</span></div>
          <button class="btn danger small" data-action="resetAll">Sıfırla</button>
        </div>
      </section>

      <section class="card set-section">
        <span class="card-title">Yasal Bilgiler & Destek</span>
        <div class="s-row">
          <div class="info">
            <b>Gizlilik Politikası</b>
            <span>Verilerinizin nasıl saklandığı ve korunduğu hakkında bilgi edinin.</span>
          </div>
          <button class="btn small" data-action="nav" data-view="privacy">
            ${I.shield} Görüntüle
          </button>
        </div>
        <div class="s-row">
          <div class="info"><b>İletişim ve Destek</b><span>Öneri, geri bildirim veya yardım için bize ulaşın.</span></div>
          <button class="btn small" data-action="nav" data-view="contact">
            ${I.mail} İletişim
          </button>
        </div>
      </section>

      <section class="card set-section">
        <span class="card-title">Uygulama Hakkında</span>
        
        <div class="s-row nb" style="padding-top: 8px;">
          <div class="info">
            <b>FocusBlock Pro</b>
            <span>Sürüm ${esc(APP_VERSION)}${APP_BUILD ? ` · ${esc(APP_BUILD)}` : ""}</span>
          </div>
        </div>

        <p style="font-size: 12.5px; color: var(--muted); margin-top: 6px; line-height: 1.5;">
          Verimli çalışma alışkanlıkları kazanmanız ve odaklanma sürelerinizi yönetmeniz için tasarlanmıştır.
        </p>

        <!-- Telif Hakkı ve Geliştirici Alt Bilgisi -->
        <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border); font-size: 11.5px; color: var(--muted); line-height: 1.5;">
          <div>Geliştirici: <strong style="color: var(--text)">Oğuz Batuhan Çözeli</strong></div>
          <div>© 2026 FocusBlock Pro. Tüm hakları saklıdır.</div>
        </div>
      </section>
      </div>
    </div>
  </div>`;
}

/* ---------- GİZLİLİK POLITIKASI SAYFASI ---------- */
function privacyHTML() {
  return `
  <div class="page">
    <header class="page-head">
      <div>
        <button class="btn small" data-action="nav" data-view="settings" style="margin-bottom:8px">
          ${I.arrowLeft} Ayarlara Dön
        </button>
        <h1>Gizlilik Politikası</h1>
        <p>Gizliliğinize ve kişisel verilerinizin güvenliğine önem veriyoruz.</p>
      </div>
    </header>

    <div class="settings-grid">
      <section class="card set-section wide" style="grid-column: 1 / -1;">
        <span class="card-title">Veri Gizliliği ve Güvenliği</span>
        
        <div style="display:flex; flex-direction:column; gap:16px; font-size:13.5px; line-height:1.6; margin-top:12px;">
          <div>
            <b style="display:block; font-size:14px; margin-bottom:4px">1. Verilerin Depolanması</b>
            <span style="color:var(--muted)">FocusBlock Pro, kullanıcı verilerinin gizliliğini ön planda tutar. Çalışma oturumlarınız, oluşturduğunuz bloklar ve ayarlarınız öncelikli olarak cihazınızın yerel depolama alanında (LocalStorage) saklanır.</span>
          </div>

          <div>
            <b style="display:block; font-size:14px; margin-bottom:4px">2. Google Drive Eşitlemesi</b>
            <span style="color:var(--muted)">Google Drive senkronizasyonunu etkinleştirdiğinizde, verileriniz yalnızca sizin kişisel Google Drive hesabınızdaki gizli uygulama klasörüne ("appDataFolder") yedeklenir. Verileriniz hiçbir şekilde üçüncü taraf sunuculara veya geliştiricilere aktarılmaz.</span>
          </div>

          <div>
            <b style="display:block; font-size:14px; margin-bottom:4px">3. Çerezler ve Analitik</b>
            <span style="color:var(--muted)">Uygulamamız tamamen reklamsızdır. Üçüncü taraf takip çerezleri, reklam kimlikleri veya izleme araçları kullanılmaz.</span>
          </div>

          <div>
            <b style="display:block; font-size:14px; margin-bottom:4px">4. Veri Kontrolü ve Silme</b>
            <span style="color:var(--muted)">Tüm geçmişinizi ve uygulama verilerinizi Ayarlar menüsünden dilediğiniz zaman tek tıkla silebilir veya sıfırlayabilirsiniz.</span>
          </div>
        </div>
      </section>
    </div>
  </div>`;
}

/* ---------- İLETİŞİM SAYFASI ---------- */
function contactHTML() {
  // E-posta konu ve gövde şablonları
  const supportSubject = encodeURIComponent(
    "FocusBlock Pro - Destek ve Geri Bildirim",
  );
  const supportBody = encodeURIComponent(
    "Merhaba Oğuz Batuhan,\n\nFocusBlock Pro uygulaması ile ilgili görüş/önerim şu şekildedir:\n\n\n----\nCihaz Bilgisi: " +
      navigator.userAgent +
      "\nSürüm: " +
      APP_VERSION,
  );

  const donateSubject = encodeURIComponent(
    "FocusBlock Pro - Proje Destek Talebi",
  );
  const donateBody = encodeURIComponent(
    "Merhaba Oğuz Batuhan,\n\nFocusBlock Pro projesinin gelişimine katkıda bulunmak ve destek olmak istiyorum. Detaylar için dönüş yapabilirseniz sevinirim.\n\nİyi çalışmalar.",
  );

  return `
  <div class="page">
    <header class="page-head">
      <div>
        <button class="btn small" data-action="nav" data-view="settings" style="margin-bottom:8px">
          ${I.arrowLeft} Ayarlara Dön
        </button>
        <h1>İletişim ve Destek</h1>
        <p>Soru, öneri veya geri bildirimleriniz için bizimle iletişime geçebilirsiniz.</p>
      </div>
    </header>

    <div class="settings-grid">
      <section class="card set-section wide" style="grid-column: 1 / -1;">
        <span class="card-title">Bize Ulaşın & Destek Olun</span>
        
        <div class="s-row" style="margin-top: 8px;">
          <div class="info">
            <b>Geri Bildirim Gönder</b>
            <span>Geri bildirim, destek talebi ve sorularınız için direkt e-posta gönderebilirsiniz.</span>
          </div>
          <a class="btn primary small" href="mailto:cozelioguzbatuhan@gmail.com?subject=${supportSubject}&body=${supportBody}" target="_blank" rel="noopener" style="text-decoration:none">
            ${I.mail} E-posta Gönder
          </a>
        </div>

        <div class="s-row">
          <div class="info">
            <b>Geliştirmeye Destek Olun</b>
            <span>FocusBlock Pro'nun gelişimine katkıda bulunmak ve geliştirme süreçlerini desteklemek için e-posta adresim üzerinden iletişime geçebilirsiniz.</span>
          </div>
          <a class="btn small" href="mailto:cozelioguzbatuhan@gmail.com?subject=${donateSubject}&body=${donateBody}" target="_blank" rel="noopener" style="text-decoration:none">
            ${I.bolt} Destek Ol
          </a>
        </div>

      </section>
    </div>
  </div>`;
}

/* ==========================================================================
   YEDEKLEME
   ========================================================================== */
const BACKUP_APP = "focusblock-pro";
const DAY_MS = 86400000;

function downloadFile(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 30000);
}

const stampName = () => {
  const d = new Date();
  return `${dayKey(d)}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const whenText = (ts) =>
  ts
    ? new Date(ts).toLocaleString("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "belirtilmemiş";

function exportCSV() {
  if (!state.history.length) return toast("Dışa aktarılacak geçmiş kaydı yok");
  const q = (v) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // Excel formül enjeksiyonuna karşı
    return `"${s.replace(/"/g, '""')}"`;
  };
  const rows = [
    ["Tarih", "Saat", "Blok", "Set no", "Set notu", "Dakika", "Durum"],
  ];
  [...state.history]
    .sort((a, b) => a.ts - b.ts)
    .forEach((h) =>
      rows.push([
        dayKey(h.ts),
        fmtHM(h.ts),
        h.typeName,
        h.setNo,
        h.setTitle,
        h.minutes,
        h.status === "completed" ? "Tamamlandı" : "Yarım",
      ]),
    );
  const csv = "\uFEFF" + rows.map((r) => r.map(q).join(";")).join("\r\n");
  downloadFile(
    `focusblock-gecmis-${stampName()}.csv`,
    csv,
    "text/csv;charset=utf-8",
  );
  toast(`${state.history.length} kayıt CSV olarak indirildi`);
}

/* ---- Tam yedek (JSON) indirme / geri yükleme ----
   Drive senkronu ile aynı birleştirme kurallarını kullanır.
   Format, gelecekteki kendi sunucu API'si ile uyumlu tutulur. */
const BACKUP_FORMAT = "focusblock-backup-v2";

function buildFullBackup() {
  try {
    stampChanges();
  } catch (_) {}
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    version: 2,
    savedAt: Date.now(),
    device: (typeof syncMeta !== "undefined" && syncMeta.device) || "local",
    settings: { ...state.settings },
    settingsAt: (state.sync && state.sync.settingsAt) || 0,
    types: state.types,
    history: state.history,
    activeTypeId: state.activeTypeId,
    tomb: (state.sync && state.sync.tomb) || { h: {}, t: {} },
  };
}

function exportFullBackup() {
  const payload = buildFullBackup();
  const text = JSON.stringify(payload, null, 2);
  downloadFile(
    `focusblock-yedek-${stampName()}.json`,
    text,
    "application/json;charset=utf-8",
  );
  state.settings.lastBackup = Date.now();
  persist();
  toast(
    `Tam yedek indirildi · ${payload.types.length} blok, ${payload.history.length} kayıt`,
  );
}

function parseBackupFile(raw) {
  if (!raw || typeof raw !== "object")
    throw new Error("Geçersiz yedek dosyası");
  if (raw.app && raw.app !== BACKUP_APP)
    throw new Error("Bu dosya FocusBlock yedeği değil");
  /* Eski senkron dosyası veya yeni yedek formatı kabul edilir */
  const isSync =
    raw.format === SYNC_FORMAT || raw.format === "focusblock-sync-v1";
  const isBackup =
    raw.format === BACKUP_FORMAT ||
    raw.format === "focusblock-backup-v1" ||
    !raw.format;
  if (!isSync && !isBackup) throw new Error("Yedek formatı tanınamadı");
  if (!Array.isArray(raw.types) || !Array.isArray(raw.history))
    throw new Error("Yedekte blok veya geçmiş verisi yok");
  return raw;
}

async function importFullBackup() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.style.display = "none";
  document.body.appendChild(input);

  const file = await new Promise((resolve) => {
    input.onchange = () => resolve(input.files && input.files[0]);
    input.click();
    setTimeout(() => {
      if (!input.files || !input.files.length) resolve(null);
    }, 60000);
  });
  input.remove();
  if (!file) return;

  let raw;
  try {
    raw = parseBackupFile(JSON.parse(await file.text()));
  } catch (err) {
    return toast(err.message || "Yedek dosyası okunamadı");
  }

  const remoteTypes = Array.isArray(raw.types) ? raw.types.length : 0;
  const remoteHist = Array.isArray(raw.history) ? raw.history.length : 0;

  const choice = await choiceDialog(
    "Yedekten geri yükle",
    `Dosyada ${remoteTypes} blok ve ${remoteHist} geçmiş kaydı var.\n\n• Birleştir (önerilen): mevcut verilerle birleştirir; mevcut hiçbir kayıt silinmez.\n• Üzerine yaz: mevcut tüm bloklar, geçmiş ve ayarlar yedektekilerle değişir${syncMeta.connected ? "; Drive'daki veriler de bununla değiştirilir" : ""}.\n\nÇalışan sayaç duraklatılır. Önceki durum Geri al ile dönebilir.`,
    [
      { value: "merge", label: "Birleştir", primary: true },
      { value: "overwrite", label: "Üzerine yaz", danger: true },
    ],
  );
  if (!choice) return;
  const merge = choice === "merge";

  if (state.session.running) pauseTimer();
  snapshotForUndo();

  try {
    if (merge) {
      const remote = {
        types: raw.types,
        history: raw.history,
        settings: syncSettingsOf(raw.settings || {}),
        settingsAt: Number(raw.settingsAt) || 0,
        epoch: state.sync.epoch || 0,
        tomb: normalizeSync({ tomb: raw.tomb, settingsAt: raw.settingsAt })
          .tomb,
      };
      if (raw.settings) {
        remote.settingsAt = Math.max(
          remote.settingsAt,
          (state.sync.settingsAt || 0) + 1,
        );
      }
      mergeRemote(remote);
      if (raw.activeTypeId && typeById(raw.activeTypeId)) {
        state.activeTypeId = raw.activeTypeId;
      }
    } else {
      const ns = normalizeState({
        settings: raw.settings,
        types: raw.types,
        history: raw.history,
        activeTypeId: raw.activeTypeId,
        session: null,
        sync: {
          tomb:
            raw.tomb && typeof raw.tomb === "object"
              ? raw.tomb
              : { h: {}, t: {} },
          settingsAt: Number(raw.settingsAt) || Date.now(),
          pristine: false,
        },
      });
      state = ns;
      state.session.running = false;
      state.session.endAt = null;
      commitReplace();
    }
    ui.selectedTypeId = state.activeTypeId;
    ui.hist.type = "all";
    persist();
    scheduleSync();
    applyAppearance();
    refreshAll();
    toast(
      merge
        ? "Yedek birleştirildi"
        : "Yedek yüklendi · önceki durum Geri al ile dönebilirsin",
    );
  } catch (err) {
    console.error(err);
    toast("Geri yükleme sırasında hata oluştu");
  }
}

/* ---- Geri alma (tek seviye) ---- */
function snapshotForUndo() {
  try {
    localStorage.setItem(PREV_KEY, JSON.stringify({ at: Date.now(), state }));
  } catch (_) {}
}
function hasUndo() {
  try {
    return !!localStorage.getItem(PREV_KEY);
  } catch (_) {
    return false;
  }
}
function undoImport() {
  try {
    const prev = JSON.parse(localStorage.getItem(PREV_KEY));
    if (state.session.running) pauseTimer();
    state = normalizeState(prev.state);
    state.session.running = false;
    state.session.endAt = null;
    localStorage.removeItem(PREV_KEY);
    ui.selectedTypeId = state.activeTypeId;
    ui.hist.type = "all";
    commitReplace();
    applyAppearance();
    refreshAll();
    toast("Önceki duruma dönüldü");
  } catch (_) {
    toast("Geri alınacak bir kayıt bulunamadı");
  }
}

/* ==========================================================================
   6. OLAYLAR
   ========================================================================== */
function mutateType(fn) {
  const t = typeById(ui.selectedTypeId);
  if (!t) return;
  fn(t);
  syncSession(t.id);
}

document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const a = el.dataset.action;
  const d = el.dataset;

  /* Modal */
  if (a === "modalBackdrop") {
    if (e.target === el) closeModal(false);
    return;
  }
  if (a === "modalYes") return closeModal(true);
  if (a === "modalNo") return closeModal(false);
  if (a === "modalPick") return closeModal(d.v);
  if (a === "tpl") {
    const t = makeType(TEMPLATES[parseInt(d.i)]);
    state.types.push(t);
    ui.selectedTypeId = t.id;
    save();
    closeModal(false);
    render();
    return toast(`“${t.name}” eklendi`);
  }

  switch (a) {
    case "nav":
      return setView(d.view);
    case "tip": {
      document.querySelectorAll(".toast.tip").forEach((n) => n.remove());
      return toast(d.tip, "tip");
    }

    /* Odaklan */
    case "toggle":
      return toggleTimer();
    case "reset": {
      const wasDone = state.session.mode === "done";
      resetPhase();
      return wasDone ? refreshAll() : syncTimerUI();
    }
    case "skip":
      return skipPhase();
    case "restartRun": {
      if (
        state.session.running ||
        state.session.setIndex > 0 ||
        state.session.remaining < phaseTotal()
      ) {
        const ok = await confirmDialog(
          "Baştan başlansın mı?",
          "Blok ilk sete döner. Geçmişe kaydedilen setler silinmez.",
          "Baştan başla",
        );
        if (!ok) return;
      }
      restartRun();
      return refreshAll();
    }
    case "jump":
      return jumpToSet(parseInt(d.i));
    case "pickType": {
      if (state.session.running) return toast("Önce zamanlayıcıyı duraklat");
      state.activeTypeId = d.id;
      ui.selectedTypeId = d.id;
      state.session = freshSession(curType());
      save();
      return refreshAll();
    }

    /* Bloklar */
    case "selType":
      ui.selectedTypeId = d.id;
      return render();
    case "addType":
      return openTemplateModal();
    case "startType": {
      if (state.session.running && ui.selectedTypeId !== state.activeTypeId)
        return toast("Önce çalışan zamanlayıcıyı duraklat");
      if (ui.selectedTypeId !== state.activeTypeId) {
        state.activeTypeId = ui.selectedTypeId;
        state.session = freshSession(curType());
        save();
      }
      return setView("focus");
    }
    case "dupType": {
      const src = typeById(ui.selectedTypeId);
      const copy = {
        ...src,
        id: uid(),
        name: (src.name + " (kopya)").slice(0, 40),
        sets: src.sets.map((s) => ({ ...s, id: uid() })),
      };
      state.types.splice(state.types.indexOf(src) + 1, 0, copy);
      ui.selectedTypeId = copy.id;
      save();
      render();
      return toast("Blok kopyalandı");
    }
    case "delType": {
      if (state.types.length <= 1) return toast("En az bir blok türü kalmalı");
      const t = typeById(ui.selectedTypeId);
      const ok = await confirmDialog(
        "Blok silinsin mi?",
        `“${t.name}” ve içindeki ${t.sets.length} set silinecek. Geçmiş kayıtların korunur.`,
        "Sil",
        true,
      );
      if (!ok) return;
      const wasActive = t.id === state.activeTypeId;
      state.types = state.types.filter((x) => x.id !== t.id);
      ui.selectedTypeId = state.types[0].id;
      if (ui.hist.type !== "all" && !typeById(ui.hist.type))
        ui.hist.type = "all";
      if (wasActive) {
        state.session.running = false;
        state.activeTypeId = state.types[0].id;
        state.session = freshSession(curType());
      }
      save();
      refreshAll();
      return toast("Blok silindi");
    }
    case "emoji":
      mutateType((t) => (t.emoji = d.v));
      return refreshEditor();
    case "color":
      mutateType((t) => (t.color = d.v));
      refreshEditor();
      return updateTimerDOM();
    case "addSet":
      mutateType((t) => {
        const last = t.sets[t.sets.length - 1];
        if (t.sets.length >= 30) return toast("En fazla 30 set eklenebilir");
        t.sets.push({
          id: uid(),
          title: "",
          work: last.work,
          break: last.break,
        });
      });
      return refreshEditor();
    case "dupSet": {
      const i = parseInt(el.closest(".set-row").dataset.i);
      mutateType((t) => {
        if (t.sets.length >= 30) return toast("En fazla 30 set eklenebilir");
        t.sets.splice(i + 1, 0, { ...t.sets[i], id: uid() });
        if (t.id === state.activeTypeId && state.session.setIndex > i)
          state.session.setIndex++;
      });
      return refreshEditor();
    }
    case "delSet": {
      const i = parseInt(el.closest(".set-row").dataset.i);
      const t = typeById(ui.selectedTypeId);
      if (t.sets.length <= 1) return toast("Bir blokta en az 1 set olmalı");
      t.sets.splice(i, 1);
      if (t.id === state.activeTypeId) {
        const se = state.session;
        if (se.setIndex > i) se.setIndex--;
        else if (se.setIndex === i) {
          se.running = false;
          se.endAt = null;
          se.mode = "work";
          se.setIndex = Math.min(i, t.sets.length - 1);
          se.remaining = t.sets[se.setIndex].work * 60;
        }
      }
      syncSession(t.id);
      return refreshEditor();
    }
    case "moveSet": {
      const i = parseInt(el.closest(".set-row").dataset.i);
      const dir = parseInt(d.dir);
      const t = typeById(ui.selectedTypeId);
      const j = i + dir;
      if (j < 0 || j >= t.sets.length) return;
      [t.sets[i], t.sets[j]] = [t.sets[j], t.sets[i]];
      if (t.id === state.activeTypeId) {
        const se = state.session;
        if (se.setIndex === i) se.setIndex = j;
        else if (se.setIndex === j) se.setIndex = i;
      }
      syncSession(t.id);
      return refreshEditor();
    }
    case "bulkApply": {
      const w = clamp(parseInt($("bulkWork").value) || 25, 1, 180);
      const bv = parseInt($("bulkBreak").value);
      const b = clamp(isNaN(bv) ? 5 : bv, 0, 60);
      mutateType((t) => t.sets.forEach((s) => ((s.work = w), (s.break = b))));
      refreshEditor();
      return toast("Süreler tüm setlere uygulandı");
    }

    /* Geçmiş */
    case "hRange":
      ui.hist.range = d.id;
      return render();
    case "hType":
      ui.hist.type = d.id;
      return render();
    case "delHist":
      state.history = state.history.filter((h) => h.id !== d.id);
      save();
      renderShellState();
      return render();
    case "clearHist": {
      const ok = await confirmDialog(
        "Geçmiş temizlensin mi?",
        `${state.history.length} kayıt silinecek${syncMeta.connected ? " (Drive'a bağlı olduğun için diğer cihazlardan da silinir)" : ""}. Ayarlar'dan geri alabilirsin.`,
        "Temizle",
        true,
      );
      if (!ok) return;
      snapshotForUndo();
      state.history = [];
      save();
      renderShellState();
      render();
      return toast("Geçmiş temizlendi");
    }

    /* İstatistik */
    case "sRange":
      ui.statsRange = parseInt(d.id);
      return render();

    /* Ayarlar */
    case "toggleSetting": {
      const key = d.key;
      if (key === "notify") {
        if (state.settings.notify && notifGranted()) {
          state.settings.notify = false;
        } else {
          if (!(await enableNotifications())) {
            state.settings.notify = false;
            save();
            return render();
          }
          state.settings.notify = true;
          showNotification(
            "Bildirimler açık ✅",
            "Aşamalar bittiğinde buradan haber vereceğim.",
          );
        }
        save();
        return render();
      }
      state.settings[key] = !state.settings[key];
      save();
      if (key === "wakeLock") syncWakeLock();
      return render();
    }
    case "goal":
      state.settings.dailyGoal = clamp(
        state.settings.dailyGoal + parseInt(d.d),
        15,
        720,
      );
      save();
      renderShellState();
      return render();
    case "theme":
      state.settings.theme = d.id;
      save();
      applyAppearance();
      return render();
    case "accent":
      state.settings.accent = d.id;
      save();
      applyAppearance();
      return render();
    case "syncConnect":
      return connectDrive();
    case "syncNow":
      return runSync({ interactive: true });
    case "syncDisconnect":
      return disconnectDrive();
    case "testNotif": {
      const ok = await showNotification(
        "FocusBlock testi",
        "Bildirimler çalışıyor 🎉",
      );
      buzz([200, 100, 200]);
      return toast(ok ? "Test bildirimi gönderildi" : "Bildirim gösterilemedi");
    }
    case "exportCSV":
      return exportCSV();
    case "exportBackup":
      return exportFullBackup();
    case "importBackup":
      return importFullBackup();
    case "undoImport":
      return undoImport();
    case "testSound":
      return playSound(d.kind, true);
    case "resetAll": {
      const connected = syncMeta.connected;
      const ok = await confirmDialog(
        "Her şey sıfırlansın mı?",
        connected
          ? "Bloklar, geçmiş ve ayarlar bu cihazdan ve Google Drive'daki yedekten silinecek; diğer cihazlar da eşitlenince temizlenir. İstersen Ayarlar'dan geri alabilirsin."
          : "Bloklar, geçmiş ve ayarlar silinecek. İstersen Ayarlar'dan geri alabilirsin.",
        "Sıfırla",
        true,
      );
      if (!ok) return;
      if (state.session.running) pauseTimer();
      snapshotForUndo();
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(OLD_KEY);
      state = defaultState();
      ui.selectedTypeId = state.activeTypeId;
      ui.hist.type = "all";
      commitReplace();
      applyAppearance();
      refreshAll();
      return toast(
        connected
          ? "Her şey sıfırlandı · Drive'daki veriler de siliniyor"
          : "Her şey sıfırlandı",
      );
    }
  }
});

/* Metin alanları: yazarken anında kaydet (odağı bozmadan) */
document.addEventListener("input", (e) => {
  const f = e.target.dataset.field;
  if (!f) return;
  if (f === "volume") {
    state.settings.volume = clamp(parseInt(e.target.value) || 0, 0, 100);
    e.target.style.setProperty("--p", state.settings.volume + "%");
    const l = $("volLabel");
    if (l) l.textContent = "%" + state.settings.volume;
    return save();
  }
  if (f === "typeName") {
    mutateType((t) => (t.name = e.target.value.slice(0, 40) || "Adsız blok"));
    refreshTypeList();
  } else if (f === "setTitle") {
    const i = parseInt(e.target.closest(".set-row").dataset.i);
    mutateType((t) => (t.sets[i].title = e.target.value.slice(0, 80)));
  }
});

/* Sayı alanları: bırakınca doğrula ve kaydet */
document.addEventListener("change", (e) => {
  const f = e.target.dataset.field;
  if (f === "volume") return playSound("start", true);
  if (f !== "setWork" && f !== "setBreak") return;
  const i = parseInt(e.target.closest(".set-row").dataset.i);
  const raw = parseInt(e.target.value);
  mutateType((t) => {
    if (f === "setWork") {
      t.sets[i].work = clamp(isNaN(raw) ? 25 : raw, 1, 180);
      e.target.value = t.sets[i].work;
    } else {
      t.sets[i].break = clamp(isNaN(raw) ? 5 : raw, 0, 60);
      e.target.value = t.sets[i].break;
    }
  });
  refreshTypeList();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("modalRoot").innerHTML) return closeModal(false);
  const tag = e.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if ($("modalRoot").innerHTML) return;
  if (e.code === "Space" && ui.view === "focus") {
    if (tag === "BUTTON" || tag === "A") return;
    e.preventDefault();
    toggleTimer();
  } else if (/^[1-5]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
    setView(NAV[parseInt(e.key) - 1].id);
  }
});

document.addEventListener("visibilitychange", () => {
  tick();
  if (!document.hidden) {
    syncWakeLock();
    updateTimerDOM();
  }
});
window.addEventListener("pageshow", tick);
window.addEventListener("focus", tick);

/* Başka sekmede yapılan değişiklikler bu sekmeye yansısın (üst üste yazmayı önler) */
window.addEventListener("storage", (e) => {
  if (e.key !== STORAGE_KEY || !e.newValue) return;
  try {
    state = normalizeState(JSON.parse(e.newValue));
    initSyncTracking();
    if (!typeById(ui.selectedTypeId)) ui.selectedTypeId = state.activeTypeId;
    applyAppearance();
    refreshAll();
  } catch (_) {}
});

/* ==========================================================================
   8. GOOGLE DRIVE EŞİTLEME
   Veriler kullanıcının kendi Drive hesabındaki gizli "appDataFolder" klasöründe durur.
   Birleştirme kuralları (iki cihaz aynı anda değişse de veri kaybolmaz):
   • Geçmiş kayıtları: benzersiz id ile birleştirilir; silinenler "mezar taşı" (tomb) ile yayılır
   • Bloklar: id ile birleştirilir; aynı blok iki yerde değiştiyse son değiştiren kazanır
   • Ayarlar (tema, hedef, ses…): son değiştiren kazanır
   • Çalışan sayaç (oturum) cihaza özeldir, eşitlenmez
   ========================================================================== */
const SYNC_FORMAT = "focusblock-sync-v1";
const SYNC_DEBOUNCE = 3000; // son değişiklikten sonra buluta gönderme gecikmesi
const SYNC_POLL = 60000; // başka cihazdaki değişiklikleri yoklama aralığı
const SILENT_COOLDOWN = 15 * 60000; // sessiz yenileme başarısızsa tekrar deneme aralığı
const TOMB_TTL = 120 * 86400000;
const TOMB_MAX = 10000;

/* ---- Cihaza özel eşitleme bilgisi (buluta gitmez) ---- */
function loadSyncMeta() {
  let m = {};
  try {
    m = JSON.parse(localStorage.getItem(SYNC_KEY)) || {};
  } catch (_) {}
  return {
    device: String(m.device || uid()),
    connected: !!m.connected,
    email: String(m.email || ""),
    lastSync: Number(m.lastSync) || 0,
    remoteMod: String(m.remoteMod || ""),
  };
}
let syncMeta = loadSyncMeta();
function saveSyncMeta() {
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(syncMeta));
  } catch (_) {}
}

const syncRt = {
  ready: false, // Google istemcisi hazır mı
  busy: false,
  queued: false,
  dirty: false, // buluta gitmemiş yerel değişiklik var
  seq: 0,
  timer: null,
  needsAuth: false,
  offline: false,
  error: "",
  lastSilentFail: 0,
  pendingRefresh: false,
  overwrote: false, // ilk eşitlemede yerel veri Drive ile değiştirildi mi
};

/* ---- Değişiklik takibi: düzenleme/silme noktalarına dokunmadan otomatik ---- */
let track = null;

const typeSig = (t) =>
  JSON.stringify([
    t.name,
    t.emoji,
    t.color,
    t.sets.map((s) => [s.title, s.work, s.break]),
  ]);

/* Tüm senkronize edilen ayarlar — gelecekteki kendi sunucu adaptörü de aynı şemayı kullanır */
const syncSettingsOf = (s) => ({
  theme: s.theme,
  accent: s.accent,
  dailyGoal: s.dailyGoal,
  autoStart: s.autoStart,
  sound: s.sound,
  volume: s.volume,
  notify: !!s.notify,
  vibrate: s.vibrate !== false,
  wakeLock: !!s.wakeLock,
});
const settingsSig = () => JSON.stringify(syncSettingsOf(state.settings));

function snapshotTrack() {
  return {
    types: new Map(state.types.map((t) => [t.id, typeSig(t)])),
    hist: new Set(state.history.map((h) => h.id)),
    set: settingsSig(),
  };
}
function initSyncTracking() {
  track = snapshotTrack();
}

/* "Her şeyi değiştiren" işlem (sıfırlama, yedeğin üzerine yazılması, geri alma) sonrası çağrılır:
   yeni bir dönem başlatır ve Drive'a hemen yazar; diğer cihazlar eşitlenince eski veriyi bırakır. */
function commitReplace() {
  const now = Date.now();
  state.sync.epoch = now;
  state.sync.settingsAt = now;
  state.sync.pristine = false;
  initSyncTracking();
  persist();
  scheduleSync();
  clearTimeout(syncRt.timer);
  runSync();
}

function trimTomb(sy) {
  const cutoff = Date.now() - TOMB_TTL;
  ["h", "t"].forEach((k) => {
    const m = sy.tomb[k];
    for (const id in m) if (m[id] < cutoff) delete m[id];
    const ids = Object.keys(m);
    if (ids.length > TOMB_MAX)
      ids
        .sort((a, b) => m[a] - m[b])
        .slice(0, ids.length - TOMB_MAX)
        .forEach((id) => delete m[id]);
  });
}

/* Son kayıttan bu yana neler değişti? Değişen bloklara zaman damgası, silinenlere mezar taşı koyar.
   Eşitlenecek bir şey değiştiyse true döner. */
function stampChanges() {
  if (!track) {
    track = snapshotTrack();
    return false;
  }
  const now = Date.now();
  const sy = state.sync;
  let changed = false;

  const curT = new Set();
  state.types.forEach((t) => {
    curT.add(t.id);
    if (track.types.get(t.id) !== typeSig(t)) {
      t.updatedAt = now;
      changed = true;
    }
    if (sy.tomb.t[t.id]) delete sy.tomb.t[t.id]; // geri yüklendi (ör. "Geri al")
  });
  track.types.forEach((_, id) => {
    if (!curT.has(id)) {
      sy.tomb.t[id] = now;
      changed = true;
    }
  });

  const curH = new Set();
  state.history.forEach((h) => {
    curH.add(h.id);
    if (!track.hist.has(h.id)) changed = true;
    if (sy.tomb.h[h.id]) delete sy.tomb.h[h.id];
  });
  track.hist.forEach((id) => {
    if (!curH.has(id)) {
      sy.tomb.h[id] = now;
      changed = true;
    }
  });

  const ss = settingsSig();
  if (ss !== track.set) {
    sy.settingsAt = now;
    changed = true;
  }

  if (changed) {
    sy.pristine = false;
    trimTomb(sy);
  }
  track = {
    types: new Map(state.types.map((t) => [t.id, typeSig(t)])),
    hist: curH,
    set: ss,
  };
  return changed;
}

/* ---- Bulut dosyası: oluşturma, okuma, karşılaştırma ---- */
function buildSyncPayload() {
  return {
    app: BACKUP_APP,
    format: SYNC_FORMAT,
    savedAt: Date.now(),
    device: syncMeta.device,
    settings: syncSettingsOf(state.settings),
    settingsAt: state.sync.settingsAt || 0,
    epoch: state.sync.epoch || 0,
    types: state.types,
    history: state.history,
    tomb: state.sync.tomb,
  };
}

function parseRemote(raw) {
  const bad = () =>
    new SyncError(
      "format",
      "Drive'daki eşitleme dosyası tanınamadı; güvenlik için üzerine yazılmadı",
    );
  if (
    !raw ||
    typeof raw !== "object" ||
    raw.app !== BACKUP_APP ||
    raw.format !== SYNC_FORMAT ||
    !Array.isArray(raw.types) ||
    !Array.isArray(raw.history)
  )
    throw bad();
  const rawIds = new Set(raw.types.map((t) => t && String(t.id)));
  const ns = normalizeState({
    types: raw.types,
    history: raw.history,
    settings: raw.settings,
    session: null,
  });
  const types = raw.types.length ? ns.types : [];
  if (types.some((t) => !rawIds.has(t.id))) throw bad();
  const sy = normalizeSync({
    tomb: raw.tomb,
    settingsAt: raw.settingsAt,
    epoch: raw.epoch,
  });
  return {
    types,
    history: ns.history,
    settings: syncSettingsOf(ns.settings),
    settingsAt: sy.settingsAt,
    epoch: sy.epoch,
    tomb: sy.tomb,
  };
}

/* İki durumun eşit olup olmadığını anlamak için kararlı bir imza (sıra ve anahtar sırasından bağımsız) */
function syncSig(p) {
  const T = (t) => [
    t.id,
    t.name,
    t.emoji,
    t.color,
    t.updatedAt || 0,
    t.sets.map((s) => [s.id, s.title, s.work, s.break]),
  ];
  const H = (h) => [
    h.id,
    h.ts,
    h.typeId,
    h.typeName,
    h.emoji,
    h.color,
    h.setNo,
    h.setTitle,
    h.minutes,
    h.status,
  ];
  const byId = (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  const M = (m) =>
    Object.keys(m)
      .sort()
      .map((k) => k + ":" + m[k])
      .join(",");
  const s = p.settings;
  return JSON.stringify([
    [
      s.theme,
      s.accent,
      s.dailyGoal,
      s.autoStart,
      s.sound,
      s.volume,
      s.notify,
      s.vibrate,
      s.wakeLock,
    ],
    p.settingsAt || 0,
    p.epoch || 0,
    p.types.map(T).sort(byId),
    p.history.map(H).sort(byId),
    M(p.tomb.h),
    M(p.tomb.t),
  ]);
}

/* İlk eşitlemede iki cihazda aynı içerikli ama farklı id'li bloklar (ör. varsayılanlar) çoğalmasın */
function dedupeLocalTypes(remote) {
  const rIds = new Set(remote.types.map((t) => t.id));
  const bySig = new Map(remote.types.map((t) => [typeSig(t), t.id]));
  const idMap = {};
  state.types = state.types.filter((t) => {
    if (rIds.has(t.id)) return true;
    const to = bySig.get(typeSig(t));
    if (!to) return true;
    idMap[t.id] = to;
    return false;
  });
  if (!Object.keys(idMap).length) return;
  state.history.forEach((h) => {
    if (idMap[h.typeId]) h.typeId = idMap[h.typeId];
  });
  if (idMap[state.activeTypeId]) state.activeTypeId = idMap[state.activeTypeId];
}

/* Bulut verisini yerel duruma birleştirir (aynı olay iki kez gelse bile sonuç değişmez) */
function mergeRemote(remote) {
  const sy = state.sync;
  const firstSync = !syncMeta.lastSync;
  const remoteEpoch = Number(remote.epoch) || 0;
  const localEpoch = sy.epoch || 0;

  /* Drive'daki veri, bu cihazın bildiği son "sıfırlama / üzerine yazma" öncesine aitse yok say;
     yerel durum esas alınır ve Drive'ın üzerine yazılır. */
  if (remoteEpoch < localEpoch && !firstSync) return;

  /* Drive esastır: ilk bağlanışta (eşitlemeden önce yapılan yerel değişiklikler dahil) ya da başka
     bir cihaz her şeyi sıfırlayıp üzerine yazdıysa, bu cihazdaki veri bırakılır ve Drive'daki durum
     aynen alınır. İlk bağlanışta ezilen yerel veri "Geri al" ile döndürülebilsin diye saklanır. */
  const replace = firstSync || remoteEpoch > localEpoch;
  if (replace) {
    if (firstSync && !sy.pristine && remote.types.length) {
      snapshotForUndo();
      syncRt.overwrote = true;
    }
    sy.tomb = { h: {}, t: {} };
    sy.epoch = remoteEpoch;
  }

  ["h", "t"].forEach((k) => {
    for (const id in remote.tomb[k])
      sy.tomb[k][id] = Math.max(sy.tomb[k][id] || 0, remote.tomb[k][id]);
  });

  const se = state.session;
  const fullBefore =
    !se.running && se.mode !== "done" && se.remaining === phaseTotal();

  let types;
  let history;
  if ((sy.pristine || replace) && remote.types.length) {
    /* Bu cihaz yeni/dokunulmamış: varsayılan blokları bırak, bulutaki veriyi al */
    types = remote.types.slice();
    history = remote.history.slice();
  } else {
    if (firstSync) dedupeLocalTypes(remote);
    const tm = new Map(state.types.map((t) => [t.id, t]));
    remote.types.forEach((r) => {
      const l = tm.get(r.id);
      if (!l || (r.updatedAt || 0) > (l.updatedAt || 0)) tm.set(r.id, r);
    });
    types = [...tm.values()];
    const hm = new Map(state.history.map((h) => [h.id, h]));
    remote.history.forEach((h) => {
      if (!hm.has(h.id)) hm.set(h.id, h);
    });
    history = [...hm.values()];
  }

  /* Silinenleri ayıkla (silindikten sonra düzenlenen blok korunur) */
  types = types.filter((t) => {
    const at = sy.tomb.t[t.id];
    if (!at) return true;
    if ((t.updatedAt || 0) > at) {
      delete sy.tomb.t[t.id];
      return true;
    }
    return false;
  });
  history = history
    .filter((h) => !sy.tomb.h[h.id])
    .sort((a, b) => a.ts - b.ts)
    .slice(-5000);

  state.types = types.length ? types : defaultTypes();
  state.history = history;

  /* Bu cihazda ayarlar hiç özelleştirilmediyse (ör. sıfırlamadan sonra yeniden bağlanış),
     Drive'daki kişiselleştirmeler zaman damgasına bakılmadan alınır. */
  const localSettingsUntouched =
    JSON.stringify(syncSettingsOf(state.settings)) ===
    JSON.stringify(syncSettingsOf(defaultState().settings));
  if (
    replace ||
    remote.settingsAt > (sy.settingsAt || 0) ||
    (firstSync && localSettingsUntouched && remote.settingsAt > 0)
  ) {
    Object.assign(state.settings, remote.settings);
    sy.settingsAt = remote.settingsAt;
  }
  sy.pristine = false;
  trimTomb(sy);

  /* Oturumu yeni bloklarla tutarlı tut */
  if (!typeById(state.activeTypeId)) {
    state.activeTypeId = state.types[0].id;
    state.session = freshSession(curType());
  } else {
    const s2 = state.session;
    const n = curType().sets.length;
    if (s2.setIndex > n - 1) {
      s2.setIndex = n - 1;
      if (!s2.running) {
        s2.mode = "work";
        s2.remaining = curSet().work * 60;
      }
    }
    if (!s2.running && s2.mode !== "done") {
      s2.remaining = fullBefore
        ? phaseTotal()
        : Math.min(s2.remaining, phaseTotal());
    }
  }
  if (!typeById(ui.selectedTypeId)) ui.selectedTypeId = state.activeTypeId;
  if (ui.hist.type !== "all" && !typeById(ui.hist.type)) ui.hist.type = "all";

  track = null; // buluttan gelenler "yerel değişiklik" sayılmasın
  persist();
}

/* ---- Eşitleme döngüsü ---- */
function scheduleSync() {
  if (!syncMeta.connected) return;
  syncRt.seq++;
  syncRt.dirty = true;
  clearTimeout(syncRt.timer);
  syncRt.timer = setTimeout(() => runSync(), SYNC_DEBOUNCE);
}

async function tryInitGoogle() {
  if (syncRt.ready) return true;
  try {
    syncRt.ready = await initGoogleAuth();
  } catch (_) {
    syncRt.ready = false;
  }
  return syncRt.ready;
}

function handleSyncError(err, interactive) {
  const code = err && err.code;
  const msg = (err && err.message) || "Eşitleme başarısız";
  if (code === "auth" || code === "scope") {
    syncRt.needsAuth = true;
    syncRt.lastSilentFail = Date.now();
    if (interactive) {
      syncRt.error = msg;
      toast(msg);
    }
  } else if (code === "network") {
    syncRt.offline = true;
  } else {
    syncRt.error = msg;
    if (interactive) toast(msg);
  }
  console.error("Drive eşitleme:", err);
}

function refreshAfterSync() {
  applyAppearance();
  renderShellState();
  const a = document.activeElement;
  if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName) && $("view").contains(a)) {
    syncRt.pendingRefresh = true; // yazarken ekranı bozma; odak bırakılınca yenile
    return;
  }
  refreshAll();
}

async function runSync({ interactive = false } = {}) {
  if (!syncMeta.connected) return;
  if (syncRt.busy) {
    syncRt.queued = true;
    return;
  }
  if (
    !interactive &&
    syncRt.needsAuth &&
    Date.now() - syncRt.lastSilentFail < SILENT_COOLDOWN
  )
    return;

  syncRt.busy = true;
  syncRt.error = "";
  syncRt.offline = false;
  updateSyncUI();
  const seq = syncRt.seq;
  const auth = { interactive, hint: syncMeta.email || undefined };
  let changedLocal = false;

  try {
    if (!syncRt.ready && !(await tryInitGoogle()))
      throw new SyncError("network", "Google servisine ulaşılamadı");
    try {
      stampChanges();
    } catch (_) {}

    const file = await findSyncFile(auth);
    const mustCheck =
      interactive ||
      syncRt.dirty ||
      !syncMeta.lastSync ||
      !file ||
      file.modifiedTime !== syncMeta.remoteMod;

    if (mustCheck) {
      let remote = null;
      let remoteSig = "";
      let before = "";
      if (file) {
        remote = parseRemote(await downloadDriveFile(file.id, auth));
        remoteSig = syncSig(remote);
        before = syncSig(buildSyncPayload());
        mergeRemote(remote); // indirme ile birleştirme arasında await yok → tutarlı
      }
      const payload = buildSyncPayload();
      changedLocal = !!remote && syncSig(payload) !== before;
      if (!remote || syncSig(payload) !== remoteSig) {
        const up = await uploadFile(payload, file ? file.id : null, auth);
        syncMeta.remoteMod = (up && up.modifiedTime) || "";
      } else {
        syncMeta.remoteMod = file.modifiedTime || "";
      }
    }

    if (state.sync.pristine) {
      state.sync.pristine = false;
      persist();
    }
    syncMeta.lastSync = Date.now();
    saveSyncMeta();
    syncRt.needsAuth = false;
    if (syncRt.seq === seq) syncRt.dirty = false;
    else scheduleSync(); // eşitlerken yeni değişiklik olduysa tekrar

    if (changedLocal) {
      refreshAfterSync();
      toast(
        syncRt.overwrote
          ? "Drive'daki veriler bu cihazdakilerin yerine alındı · Ayarlar'dan geri alabilirsin"
          : "Drive'daki değişiklikler bu cihaza eklendi",
      );
    } else if (interactive) {
      toast("Google Drive ile eşitlendi");
    }
  } catch (err) {
    handleSyncError(err, interactive);
  } finally {
    syncRt.overwrote = false;
    syncRt.busy = false;
    updateSyncUI();
    if (syncRt.queued) {
      syncRt.queued = false;
      setTimeout(() => runSync(), 300);
    }
  }
}

async function connectDrive() {
  if (syncRt.busy) return;
  if (!syncRt.ready && !(await tryInitGoogle()))
    return toast(
      "Google servisine ulaşılamadı; bağlantını kontrol edip tekrar dene",
    );
  try {
    await requestToken({
      interactive: true,
      hint: syncMeta.email || undefined,
    });
  } catch (err) {
    syncRt.error = err.message || "Bağlanılamadı";
    updateSyncUI();
    return toast(syncRt.error);
  }
  syncMeta.connected = true;
  syncRt.needsAuth = false;
  syncRt.error = "";
  saveSyncMeta();
  updateSyncUI();
  getAccountEmail({ interactive: false })
    .then((email) => {
      if (!email) return;
      syncMeta.email = email;
      saveSyncMeta();
      updateSyncUI();
    })
    .catch(() => {});
  await runSync({ interactive: true });
}

async function disconnectDrive() {
  const ok = await confirmDialog(
    "Google Drive bağlantısı kesilsin mi?",
    "Bu cihazdaki verilerin yerinde kalır; Drive'daki yedek de silinmez. İstediğin zaman yeniden bağlanabilirsin.",
    "Bağlantıyı kes",
    true,
  );
  if (!ok) return;
  clearTimeout(syncRt.timer);
  syncMeta.connected = false;
  syncMeta.email = "";
  syncMeta.lastSync = 0;
  syncMeta.remoteMod = "";
  saveSyncMeta();
  syncRt.needsAuth = false;
  syncRt.error = "";
  syncRt.dirty = false;
  syncRt.offline = false;
  try {
    await signOutGoogle();
  } catch (_) {}
  updateSyncUI();
  toast("Google Drive bağlantısı kesildi");
}

/* ---- Arayüz ---- */
function syncStatusText() {
  if (!syncMeta.connected)
    return "Bağlı değil · verilerini cihazlar arasında eşitle ve Drive'da yedekle";
  if (syncRt.busy) return "Eşitleniyor…";
  if (syncRt.needsAuth) return "Oturum süresi doldu · yeniden bağlan";
  if (syncRt.error) return syncRt.error;
  if (syncRt.offline) return "Çevrimdışı · bağlantı gelince eşitlenecek";
  if (syncMeta.lastSync) return `Eşitlendi · ${whenText(syncMeta.lastSync)}`;
  return "Hazırlanıyor…";
}

function syncBoxHTML() {
  const m = syncMeta;
  const reconnect = m.connected && syncRt.needsAuth;
  const actions = !m.connected
    ? `<button class="btn primary" data-action="syncConnect">${I.cloud} Google Drive ile eşitle</button>`
    : `<button class="btn primary" data-action="${reconnect ? "syncConnect" : "syncNow"}" ${syncRt.busy ? "disabled" : ""}>
         <span class="${syncRt.busy ? "spin" : "ico-wrap"}">${I.sync}</span> ${reconnect ? "Yeniden bağlan" : "Şimdi eşitle"}
       </button>
       <button class="btn danger" data-action="syncDisconnect">Bağlantıyı kes</button>`;
  return `
    <div class="s-row nb">
      <div class="info">
        <b>${m.connected ? "Google Drive bağlı" : "Google Drive ile eşitle"}</b>
        <span>${esc(syncStatusText())}</span>
        ${m.connected && m.email ? `<span>Hesap: ${esc(m.email)}</span>` : ""}
      </div>
    </div>
    <div class="data-actions" style="padding-top:4px">${actions}</div>
    <p class="sync-note">Verilerin yalnızca senin Drive hesabındaki uygulamaya özel gizli klasörde saklanır; Drive'da görünmez ve başka uygulamalar erişemez. Bloklar, geçmiş ve ayarlar cihazlar arasında birleştirilir, hiçbir kayıt ezilmez. Çalışan sayaç her cihaza özeldir.</p>`;
}

function updateSyncUI() {
  const b = $("syncBox");
  if (b) b.innerHTML = syncBoxHTML();
}

function startSync() {
  tryInitGoogle().then((ok) => {
    if (ok && syncMeta.connected) runSync(); // sessiz yenileme + eşitleme
    updateSyncUI();
  });

  let vt = null;
  document.addEventListener("visibilitychange", () => {
    if (!syncMeta.connected) return;
    clearTimeout(vt);
    if (document.hidden) {
      if (syncRt.dirty) {
        clearTimeout(syncRt.timer);
        runSync(); // arka plana geçerken bekleyen değişiklikleri hemen gönder
      }
    } else {
      vt = setTimeout(() => runSync(), 400);
    }
  });
  window.addEventListener("online", () => syncMeta.connected && runSync());
  setInterval(() => {
    if (syncMeta.connected && !document.hidden) runSync();
  }, SYNC_POLL);

  document.addEventListener("focusout", () => {
    if (!syncRt.pendingRefresh) return;
    setTimeout(() => {
      const a = document.activeElement;
      if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName)) return;
      syncRt.pendingRefresh = false;
      refreshAll();
    }, 80);
  });
}

/* ==========================================================================
   7. BAŞLANGIÇ
   ========================================================================== */
(function init() {
  initSyncTracking();
  applyAppearance();
  buildShell();
  /* Ses motoru ilk dokunuşta hazırlansın (otomatik başlayan aşamalarda da ses çıksın) */
  document.addEventListener("pointerdown", () => getAudio(), { once: true });
  registerSW();
  /* Tarayıcıdan "verilerimi otomatik silme" iste (özellikle iOS Safari için önemli) */
  try {
    if (navigator.storage && navigator.storage.persist)
      navigator.storage.persist();
  } catch (_) {}

  /* Sayfa kapanıp açıldıysa: süre dolmadıysa devam et, dolduysa aşamaları tamamlayıp geçmişe yaz */
  const se = state.session;
  if (se.running && se.endAt) {
    se.remaining = Math.max(0, Math.ceil((se.endAt - Date.now()) / 1000));
  }
  catchUp();
  save();

  renderShellState();
  render(true);
  startTicker();
  /* "Kalan / tahmini bitiş" değerleri dakikada bir tazelensin (duraklatılmışken de) */
  setInterval(() => ui.view === "focus" && updateTimerDOM(), 15000);

  startSync();
})();
