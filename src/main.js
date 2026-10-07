/* ==========================================================================
   FocusBlock Pro v2
   Bölümler:
   1. Sabitler & yardımcılar   2. Durum (state)   3. Ses / bildirim / modal
   4. Zamanlayıcı motoru       5. Görünümler      6. Olaylar   7. Başlangıç
   ========================================================================== */

/* ==========================================================================
   1. SABİTLER & YARDIMCILAR
   ========================================================================== */
const STORAGE_KEY = "focusblock-v2";
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
      dailyGoal: 120,
      lastBackup: null,
    },
    types,
    activeTypeId: types[0].id,
    session: freshSession(types[0]),
    history: [],
  };
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
  const vol = parseInt(out.settings.volume);
  out.settings.volume = clamp(isNaN(vol) ? 70 : vol, 0, 100);
  out.settings.lastBackup =
    Number.isFinite(Number(out.settings.lastBackup)) && out.settings.lastBackup
      ? Number(out.settings.lastBackup)
      : null;

  if (Array.isArray(raw.types) && raw.types.length) {
    out.types = raw.types.map((t) => ({
      id: String(t.id || uid()),
      name: String(t.name || "Blok").slice(0, 40),
      emoji: String(t.emoji || "🎯"),
      color: PALETTE.some((c) => c.id === t.color) ? t.color : "indigo",
      sets: (Array.isArray(t.sets) && t.sets.length ? t.sets : [{}]).map(
        (s) => {
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

  const active = out.types.find((t) => t.id === out.activeTypeId);
  const s = raw.session;
  const okSession =
    s &&
    ["work", "break", "done"].includes(s.mode) &&
    Number.isInteger(s.setIndex) &&
    s.setIndex >= 0 &&
    s.setIndex < active.sets.length &&
    typeof s.remaining === "number" &&
    s.remaining >= 0;
  out.session = okSession
    ? {
        setIndex: s.setIndex,
        mode: s.mode,
        remaining: Math.round(s.remaining),
        running: !!s.running,
        endAt: s.endAt || null,
      }
    : freshSession(active);
  return out;
}

function migrateOld(old) {
  const s = defaultState();
  if (!old || !Array.isArray(old.subjects) || !old.subjects.length) return s;
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
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeState(JSON.parse(saved));
    const old = localStorage.getItem(OLD_KEY);
    if (old) return normalizeState(migrateOld(JSON.parse(old)));
  } catch (_) {}
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

function logHistory(status, minutes) {
  const t = curType();
  const s = curSet();
  state.history.push({
    id: uid(),
    ts: Date.now(),
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
  if (audio.ctx.state === "suspended") audio.ctx.resume().catch(() => {});
  return audio;
}

/* Bir "çan" notası: temel ses + üst harmonikler, her biri farklı hızda sönüyor */
function bell(a, freq, at, dur, vel) {
  const { ctx, dry, send } = a;
  const partials = [
    [1, 1, 1],
    [2, 0.28, 0.55],
    [3.01, 0.09, 0.3],
    [4.97, 0.03, 0.18],
  ];
  partials.forEach(([mult, amp, decayMul]) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq * mult;
    o.detune.value = (Math.random() - 0.5) * 6;
    const end = at + dur * decayMul;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, vel * amp),
      at + 0.012,
    );
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    o.connect(g);
    g.connect(dry);
    g.connect(send);
    o.start(at);
    o.stop(end + 0.05);
  });
}

const SOUNDS = {
  start: {
    notes: [
      [392.0, 0],
      [587.33, 0.09],
    ],
    dur: 0.9,
    vel: 0.28,
  },
  pause: {
    notes: [
      [587.33, 0],
      [392.0, 0.08],
    ],
    dur: 0.7,
    vel: 0.2,
  },
  break: {
    notes: [
      [783.99, 0],
      [659.25, 0.15],
      [523.25, 0.3],
    ],
    dur: 1.6,
    vel: 0.3,
  },
  focus: {
    notes: [
      [523.25, 0],
      [659.25, 0.1],
      [783.99, 0.2],
      [1046.5, 0.3],
    ],
    dur: 1.3,
    vel: 0.28,
  },
  done: {
    notes: [
      [523.25, 0],
      [659.25, 0.12],
      [783.99, 0.24],
      [987.77, 0.36],
      [1318.51, 0.5],
    ],
    dur: 2.6,
    vel: 0.3,
  },
};

function playSound(kind, force = false) {
  if (!force && !state.settings.sound) return;
  const def = SOUNDS[kind];
  const vol = clamp(state.settings.volume, 0, 100) / 100;
  if (!def || vol === 0) return;
  const a = getAudio();
  if (!a) return;
  a.master.gain.value = Math.pow(vol, 1.6) * 1.4;
  const t0 = a.ctx.currentTime + 0.03;
  def.notes.forEach(([f, off], i) => {
    const last = kind === "done" && i === def.notes.length - 1;
    bell(a, f, t0 + off, def.dur, def.vel * (last ? 1.25 : 1));
  });
  if (kind === "done")
    [523.25, 659.25, 783.99].forEach((f) =>
      bell(a, f, t0 + 0.5, def.dur, def.vel * 0.45),
    );
}

function notify(title, body) {
  if (
    !state.settings.notify ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  )
    return;
  try {
    const n = new Notification(title, { body });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch (_) {}
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  $("toastRoot").appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

let modalResolve = null;
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
    modalResolve = resolve;
    openModal(`
      <h3>${esc(title)}</h3>
      <p>${esc(message)}</p>
      <div class="modal-actions">
        <button class="btn" data-action="modalNo">Vazgeç</button>
        <button class="btn ${danger ? "danger" : "primary"}" data-action="modalYes">${esc(okLabel)}</button>
      </div>`);
  });
}
function openTemplateModal() {
  modalResolve = null;
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
function startTimer() {
  const se = state.session;
  if (se.mode === "done") restartRun();
  se.running = true;
  se.endAt = Date.now() + se.remaining * 1000;
  playSound("start");
  save();
  refreshAll();
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
    refreshAll();
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

function tick() {
  const se = state.session;
  if (!se.running) return;
  const rem = Math.max(0, Math.ceil((se.endAt - Date.now()) / 1000));
  if (rem !== se.remaining) {
    se.remaining = rem;
    updateTimerDOM();
  }
  if (rem <= 0) completePhase(false);
}

function completePhase(skipped) {
  const se = state.session;
  const type = curType();
  const set = curSet();
  const lastIdx = type.sets.length - 1;
  const label = set.title || `Set ${se.setIndex + 1}`;

  if (se.mode === "work") {
    const total = set.work * 60;
    const done = skipped ? Math.floor((total - se.remaining) / 60) : set.work;
    if (done >= 1) {
      logHistory(skipped ? "partial" : "completed", done);
      if (skipped) toast(`${done} dk geçmişe kaydedildi`);
    }
    if (se.setIndex >= lastIdx) {
      se.mode = "done";
      se.remaining = 0;
      if (!skipped) playSound("done");
      notify("Tebrikler! 🎉", `${type.name} bloğunun tüm setleri tamamlandı.`);
    } else if (set.break <= 0) {
      se.setIndex++;
      se.mode = "work";
      se.remaining = curSet().work * 60;
      if (!skipped) playSound("focus");
      notify("Sıradaki set 🎯", curSet().title || `Set ${se.setIndex + 1}`);
    } else {
      se.mode = "break";
      se.remaining = set.break * 60;
      if (!skipped) playSound("break");
      notify("Mola zamanı ☕", `"${label}" bitti. ${set.break} dk dinlen.`);
    }
  } else if (se.mode === "break") {
    se.setIndex++;
    se.mode = "work";
    se.remaining = curSet().work * 60;
    if (!skipped) playSound("focus");
    notify("Odak zamanı 🎯", curSet().title || `Set ${se.setIndex + 1}`);
  } else {
    restartRun();
  }

  const auto = state.settings.autoStart && se.mode !== "done";
  se.running = auto;
  se.endAt = auto ? Date.now() + se.remaining * 1000 : null;
  save();
  refreshAll();
}

function skipPhase() {
  const se = state.session;
  if (se.mode === "done") return (restartRun(), refreshAll());
  if (se.running) pauseTimer();
  completePhase(true);
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
  document
    .querySelectorAll(".nav-btn")
    .forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.view === ui.view),
    );
}

function setView(v) {
  ui.view = v;
  renderShellState();
  render();
  $("view").scrollTop = 0;
}

function render() {
  const el = $("view");
  const scroll = el.scrollTop;
  if (ui.view === "focus") el.innerHTML = focusHTML();
  else if (ui.view === "blocks") el.innerHTML = blocksHTML();
  else if (ui.view === "history") el.innerHTML = historyHTML();
  else if (ui.view === "stats") el.innerHTML = statsHTML();
  else el.innerHTML = settingsHTML();
  el.scrollTop = scroll;
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
  const started = !se.running && !done && se.remaining < phaseTotal();
  const mainLabel = se.running
    ? "Duraklat"
    : done
      ? "Yeniden Başla"
      : started
        ? "Devam Et"
        : "Başlat";

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
          <button class="ctl main" data-action="toggle">${se.running ? I.pause : I.play}<span>${mainLabel}</span></button>
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
      <input class="input num" data-field="setWork" type="number" min="1" max="180" value="${s.work}" title="Odak (dk)" />
      <input class="input num" data-field="setBreak" type="number" min="0" max="60" value="${s.break}" title="Mola (dk)" />
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
    Odak <input class="input num" id="bulkWork" type="number" min="1" max="180" value="${t.sets[0].work}" /> dk
    Mola <input class="input num" id="bulkBreak" type="number" min="0" max="60" value="${t.sets[0].break}" /> dk
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
        <button class="btn danger small" data-action="clearHist" ${state.history.length ? "" : "disabled"}>${I.trash} Geçmişi temizle</button>
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

  const list = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    list.push({ d, key: dayKey(d), min: mMap[dayKey(d)] || 0 });
  }
  const from = list[0].d.getTime();
  const inRange = state.history.filter((h) => h.ts >= from);

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
      if (days === 7) lb = wd[x.d.getDay()];
      else if (days === 30)
        lb = i % 5 === 0 || i === days - 1 ? String(x.d.getDate()) : "";
      else lb = i % 15 === 0 ? `${x.d.getDate()}/${x.d.getMonth() + 1}` : "";
      const h = x.min > 0 ? Math.max(4, Math.round((x.min / maxV) * H)) : 3;
      return `<div class="col" title="${esc(dayLabel(x.key))}: ${fmtDur(x.min)}">
        <div class="b ${x.min === 0 ? "zero" : x.min >= goal ? "hit" : ""}" style="height:${h}px"></div>
        <div class="lb">${lb}</div></div>`;
    })
    .join("");
  const goalBottom = 20 + Math.round((goal / maxV) * H);

  /* Blok dağılımı */
  const dist = {};
  inRange.forEach((h) => {
    const k = h.typeName + "|" + h.color + "|" + h.emoji;
    dist[k] = (dist[k] || 0) + h.minutes;
  });
  const distList = Object.entries(dist)
    .map(([k, v]) => {
      const [name, color, emoji] = k.split("|");
      return { name, color, emoji, v };
    })
    .sort((a, b) => b.v - a.v);
  const distTotal = distList.reduce((a, x) => a + x.v, 0);

  /* Isı haritası (son 16 hafta) */
  const weeks = 16;
  const dow = (today.getDay() + 6) % 7;
  const hStart = addDays(today, -dow - 7 * (weeks - 1));
  let cells = "";
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(hStart, i);
    if (d > today) {
      cells += '<div class="cell off"></div>';
      continue;
    }
    const m = mMap[dayKey(d)] || 0;
    const lvl =
      m <= 0 ? 0 : m < goal * 0.25 ? 1 : m < goal * 0.5 ? 2 : m < goal ? 3 : 4;
    cells += `<div class="cell ${lvl ? "l" + lvl : ""}" title="${esc(dayLabel(dayKey(d)))}: ${fmtDur(m)}"></div>`;
  }

  /* Ritim: saat & haftanın günü */
  const hours = Array(24).fill(0);
  const wdays = Array(7).fill(0);
  inRange.forEach((h) => {
    const d = new Date(h.ts);
    hours[d.getHours()] += h.minutes;
    wdays[(d.getDay() + 6) % 7] += h.minutes;
  });
  const miniCol = (arr, labels) => {
    const mx = Math.max(...arr, 1);
    return arr
      .map(
        (v, i) =>
          `<div class="col" title="${fmtDur(v)}"><div class="b ${v === 0 ? "zero" : ""}" style="height:${v > 0 ? Math.max(4, Math.round((v / mx) * 80)) : 3}px"></div><div class="lb">${labels[i] ?? ""}</div></div>`,
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

  const ranges = [7, 30, 90];

  return `
  <div class="page">
    <header class="page-head">
      <div><h1>İstatistik</h1><p>Çalışma alışkanlıklarını ve ilerlemeni detaylı incele.</p></div>
      <div class="chips">
        ${ranges.map((r) => `<button class="chip ${days === r ? "active" : ""}" data-action="sRange" data-id="${r}">Son ${r} gün</button>`).join("")}
      </div>
    </header>

    <div class="kpi-grid">
      <div class="card kpi"><span class="card-title">Toplam odak</span><b>${fmtDur(total)}</b><small>${activeDays} aktif gün</small></div>
      <div class="card kpi"><span class="card-title">Günlük ortalama</span><b>${fmtDur(total / days)}</b><small>Hedef: ${fmtDur(goal)}</small></div>
      <div class="card kpi"><span class="card-title">Tamamlanan set</span><b>${completed}</b><small>${partial} yarım bırakıldı</small></div>
      <div class="card kpi"><span class="card-title">Seri</span><b>🔥 ${currentStreak(mMap)} gün</b><small>En uzun: ${longestStreak(mMap)} gün</small></div>
      <div class="card kpi"><span class="card-title">En verimli gün</span><b>${best.min > 0 ? fmtDur(best.min) : "—"}</b><small>${best.min > 0 ? esc(dayLabel(best.key)) : "Henüz veri yok"}</small></div>
      <div class="card kpi"><span class="card-title">Hedef tutturma</span><b>${hitDays}/${days}</b><small>gün hedefe ulaşıldı</small></div>
    </div>

    <div class="stats-grid">
      <section class="card wide">
        <div class="card-head"><span class="card-title">Günlük odak süresi</span></div>
        <div class="chart">
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
            <div class="mini-chart">${miniCol(hours, hourLabels)}</div>
          </div>
          <div>
            <div class="field-label">Güne göre ${total ? `· en yoğun ${wdNames[peakDay]}` : ""}</div>
            <div class="mini-chart">${miniCol(wdays, ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"])}</div>
          </div>
        </div>
      </section>

      <section class="card wide">
        <div class="card-head"><span class="card-title">Son 16 hafta</span></div>
        <div class="heat-wrap">
          <div class="heat-days"><span>Pzt</span><span></span><span>Çar</span><span></span><span>Cum</span><span></span><span>Paz</span></div>
          <div class="heat">${cells}</div>
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
          <div class="info"><b>Masaüstü bildirimleri</b><span>Sekme arkadayken mola ve odak uyarısı gönder.</span></div>
          ${sw("notify", s.notify)}
        </div>
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

      <section class="card set-section">
        <span class="card-title">Veri ve yedekleme</span>
        <div class="s-row">
          <div class="info">
            <b>Yedek al</b>
            <span>${
              s.lastBackup
                ? `Son yedek: ${esc(new Date(s.lastBackup).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }))}`
                : "Henüz yedek almadın. Tarayıcı verilerini temizlersen kayıtların silinir; ara sıra yedek indir."
            }</span>
          </div>
        </div>
        <div class="data-actions" style="padding-top:0">
          <button class="btn primary" data-action="exportData">${I.download} Yedeği indir</button>
          <button class="btn" data-action="importData">${I.upload} Yedekten yükle</button>
          <button class="btn" data-action="exportCSV">${I.download} Geçmiş (CSV)</button>
        </div>
        ${
          hasUndo()
            ? `<div class="s-row" style="margin-top:8px">
                <div class="info"><b>Son işlemi geri al</b><span>İçe aktarma, geçmişi temizleme veya sıfırlamadan önceki duruma dön.</span></div>
                <button class="btn small" data-action="undoImport">${I.reset} Geri al</button>
              </div>`
            : ""
        }
        <div class="s-row" style="margin-top:8px">
          <div class="info"><b>Geçmişi temizle</b><span>${state.history.length} kayıt silinir; bloklar ve ayarlar kalır.</span></div>
          <button class="btn danger small" data-action="clearHist" ${state.history.length ? "" : "disabled"}>Temizle</button>
        </div>
        <div class="s-row">
          <div class="info"><b>Her şeyi sıfırla</b><span>Tüm veriler silinir ve varsayılan bloklar geri gelir.</span></div>
          <button class="btn danger small" data-action="resetAll">Sıfırla</button>
        </div>
      </section>

      <section class="card set-section">
        <span class="card-title">Kısayollar</span>
        <div class="keys">
          <div><span>Başlat / Duraklat</span><kbd>Boşluk</kbd></div>
          <div><span>Odaklan · Bloklar · Geçmiş · İstatistik · Ayarlar</span><kbd>1 – 5</kbd></div>
        </div>
      </section>
    </div>
  </div>`;
}

/* ==========================================================================
   YEDEKLEME
   ========================================================================== */
const BACKUP_APP = "focusblock-pro";

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

function exportBackup() {
  if (state.session.running) pauseTimer();
  state.settings.lastBackup = Date.now();
  save();
  const payload = {
    app: BACKUP_APP,
    version: 2,
    exportedAt: Date.now(),
    data: {
      settings: state.settings,
      types: state.types,
      activeTypeId: state.activeTypeId,
      history: state.history,
    },
  };
  downloadFile(
    `focusblock-yedek-${stampName()}.json`,
    JSON.stringify(payload, null, 2),
    "application/json",
  );
  refreshAll();
  toast(
    `Yedek indirildi · ${state.types.length} blok, ${state.history.length} kayıt`,
  );
}

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
  const csv = "﻿" + rows.map((r) => r.map(q).join(";")).join("\r\n");
  downloadFile(
    `focusblock-gecmis-${stampName()}.csv`,
    csv,
    "text/csv;charset=utf-8",
  );
  toast(`${state.history.length} kayıt CSV olarak indirildi`);
}

/* Yedek dosyasını çöz: yeni biçim, doğrudan durum dosyası ve eski (v1) sürüm desteklenir */
function parseBackup(text) {
  let raw;
  try {
    raw = JSON.parse(String(text).replace(/^﻿/, ""));
  } catch (_) {
    throw new Error("Dosya geçerli bir JSON değil.");
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Dosya içeriği tanınamadı.");
  let data = raw;
  let exportedAt = null;
  if (raw.app === BACKUP_APP && raw.data && typeof raw.data === "object") {
    data = raw.data;
    exportedAt = Number(raw.exportedAt) || null;
  }
  if (Array.isArray(data.subjects) && !Array.isArray(data.types))
    data = migrateOld(data);
  if (!Array.isArray(data.types) || !data.types.length)
    throw new Error("Bu dosyada FocusBlock verisi bulunamadı.");
  return { norm: normalizeState({ ...data, session: null }), exportedAt };
}

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
    const lb = state.settings.lastBackup;
    state = normalizeState(prev.state);
    state.session.running = false;
    state.session.endAt = null;
    state.settings.lastBackup =
      Math.max(lb || 0, state.settings.lastBackup || 0) || null;
    localStorage.removeItem(PREV_KEY);
    ui.selectedTypeId = state.activeTypeId;
    ui.hist.type = "all";
    save();
    applyAppearance();
    refreshAll();
    toast("Önceki duruma dönüldü");
  } catch (_) {
    toast("Geri alınacak bir kayıt bulunamadı");
  }
}

function chooseImportMode(norm, when) {
  return new Promise((resolve) => {
    modalResolve = resolve;
    const haveT = new Set(state.types.map((t) => t.id));
    const haveH = new Set(state.history.map((h) => h.id));
    const newT = norm.types.filter((t) => !haveT.has(t.id)).length;
    const newH = norm.history.filter((h) => !haveH.has(h.id)).length;
    const totalMin = norm.history.reduce((a, h) => a + h.minutes, 0);
    openModal(`
      <h3>Yedek dosyası okundu</h3>
      <p>Yedek tarihi: ${esc(when)}</p>
      <div class="imp-stats">
        <div><b>${norm.types.length}</b><span>Blok</span></div>
        <div><b>${norm.history.length}</b><span>Kayıt</span></div>
        <div><b>${esc(fmtDur(totalMin))}</b><span>Toplam odak</span></div>
      </div>
      <p><b>Birleştir:</b> bu cihazdaki veriye yalnızca eksik olanlar eklenir (${newT} yeni blok, ${newH} yeni kayıt); hiçbir şey silinmez.<br><b>Değiştir:</b> mevcut veri yedektekiyle yer değiştirir. İkisini de Ayarlar'dan geri alabilirsin.</p>
      <div class="modal-actions col">
        <button class="btn primary" data-action="impMerge">Birleştir (önerilen)</button>
        <button class="btn" data-action="impReplace">Mevcut verinin yerine koy</button>
        <button class="btn ghost" data-action="modalNo">Vazgeç</button>
      </div>`);
  });
}

async function handleImportFile(file) {
  if (file.size > 20 * 1024 * 1024)
    return toast("Dosya çok büyük (en fazla 20 MB)");
  let parsed;
  try {
    parsed = parseBackup(await file.text());
  } catch (err) {
    return toast(err.message || "Yedek dosyası okunamadı");
  }
  const { norm, exportedAt } = parsed;
  const when = exportedAt
    ? new Date(exportedAt).toLocaleString("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "belirtilmemiş";
  const choice = await chooseImportMode(norm, when);
  if (choice !== "merge" && choice !== "replace") return;

  if (state.session.running) pauseTimer();
  snapshotForUndo();

  if (choice === "replace") {
    const lb = state.settings.lastBackup;
    state = norm;
    state.settings.lastBackup = lb;
    ui.selectedTypeId = state.activeTypeId;
    ui.hist.type = "all";
    applyAppearance();
    save();
    refreshAll();
    return toast(
      `Yedek yüklendi · ${state.types.length} blok, ${state.history.length} kayıt`,
    );
  }

  const haveT = new Set(state.types.map((t) => t.id));
  const haveH = new Set(state.history.map((h) => h.id));
  let addedT = 0;
  let addedH = 0;
  norm.types.forEach((t) => {
    if (!haveT.has(t.id)) {
      state.types.push(t);
      addedT++;
    }
  });
  norm.history.forEach((h) => {
    if (!haveH.has(h.id)) {
      state.history.push(h);
      addedH++;
    }
  });
  state.history.sort((a, b) => a.ts - b.ts);
  save();
  refreshAll();
  toast(
    addedT || addedH
      ? `${addedT} blok, ${addedH} kayıt eklendi`
      : "Yedekteki her şey zaten bu cihazda var",
  );
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
  if (a === "impMerge") return closeModal("merge");
  if (a === "impReplace") return closeModal("replace");
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

    /* Odaklan */
    case "toggle":
      return toggleTimer();
    case "reset":
      resetPhase();
      return refreshAll();
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
        `${state.history.length} kayıt silinecek. Ayarlar'dan geri alabilirsin.`,
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
      if (key === "notify" && !state.settings.notify) {
        if (!("Notification" in window))
          return toast("Tarayıcın bildirimleri desteklemiyor");
        const perm =
          Notification.permission === "granted"
            ? "granted"
            : await Notification.requestPermission();
        if (perm !== "granted") return toast("Bildirim izni verilmedi");
      }
      state.settings[key] = !state.settings[key];
      save();
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
    case "exportData":
      return exportBackup();
    case "exportCSV":
      return exportCSV();
    case "undoImport":
      return undoImport();
    case "testSound":
      return playSound(d.kind, true);
    case "importData":
      return $("importFile").click();
    case "resetAll": {
      const ok = await confirmDialog(
        "Her şey sıfırlansın mı?",
        "Bloklar, geçmiş ve ayarlar silinecek. İstersen Ayarlar'dan geri alabilirsin.",
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
      applyAppearance();
      save();
      refreshAll();
      return toast("Her şey sıfırlandı");
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

$("importFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (file) await handleImportFile(file);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("modalRoot").innerHTML) return closeModal(false);
  const tag = e.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if ($("modalRoot").innerHTML) return;
  if (e.code === "Space" && ui.view === "focus") {
    e.preventDefault();
    toggleTimer();
  } else if (/^[1-5]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
    setView(NAV[parseInt(e.key) - 1].id);
  }
});

document.addEventListener("visibilitychange", tick);

/* ==========================================================================
   7. BAŞLANGIÇ
   ========================================================================== */
(function init() {
  applyAppearance();
  buildShell();
  /* Ses motoru ilk dokunuşta hazırlansın (otomatik başlayan aşamalarda da ses çıksın) */
  document.addEventListener("pointerdown", () => getAudio(), { once: true });

  /* Sayfa kapanıp açıldıysa: süre dolmadıysa devam et, dolduysa duraklat */
  const se = state.session;
  if (se.running) {
    if (se.endAt && se.endAt > Date.now()) {
      se.remaining = Math.ceil((se.endAt - Date.now()) / 1000);
    } else {
      se.running = false;
      se.endAt = null;
      se.remaining = phaseTotal();
    }
  }

  renderShellState();
  render();
  setInterval(tick, 250);
  /* "Kalan / tahmini bitiş" değerleri dakikada bir tazelensin (duraklatılmışken de) */
  setInterval(() => ui.view === "focus" && updateTimerDOM(), 15000);
})();
