/* ==========================================================================
   1. SABİTLER VE SÖZLÜK (i18n & POPÜLER TEMALAR)
   ========================================================================== */
const i18n = {
  tr: {
    settings: "Ayarlar",
    language: "Dil",
    theme: "Tema",
    work: "Odaklanma",
    break: "Dinlenme",
    set: "Blok",
    workDuration: "Çalışma Süresi",
    breakDuration: "Mola Süresi",
    setsCount: "Hedef Bloklar",
    done: "Tamamlandı",
    clearData: "Tüm Verileri Sıfırla",
    taskPlaceholder: "Neye odaklanıyorsun?",
    tabTimer: "Zamanlayıcı",
    tabAppearance: "Görünüm",
    start: "Başlat",
    pause: "Duraklat",
    confirmClear:
      "Tüm verileriniz ve ayarlarınız sıfırlanacaktır. Onaylıyor musunuz?",
    notifWorkDoneTitle: "Mola Zamanı! ☕",
    notifWorkDoneBody: "Çalışma bloğun tamamlandı, dinlenmeyi hak ettin.",
    notifBreakDoneTitle: "Odaklanma Zamanı! 🎯",
    notifBreakDoneBody: "blok için hazırsan başlayalım.",
    notifAllDoneTitle: "Tebrikler! 🎉",
    notifAllDoneBody: "Bugünkü tüm çalışma bloklarını tamamladın.",
  },
  en: {
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    work: "Focus",
    break: "Rest",
    set: "Block",
    workDuration: "Focus Duration",
    breakDuration: "Break Duration",
    setsCount: "Target Blocks",
    done: "Completed",
    clearData: "Reset All Data",
    taskPlaceholder: "What are you focusing on?",
    tabTimer: "Timer",
    tabAppearance: "Appearance",
    start: "Start",
    pause: "Pause",
    confirmClear:
      "All your saved settings and progress will be reset. Are you sure?",
    notifWorkDoneTitle: "Break Time! ☕",
    notifWorkDoneBody: "Focus block completed, take a rest.",
    notifBreakDoneTitle: "Focus Time! 🎯",
    notifBreakDoneBody: "time to start block number",
    notifAllDoneTitle: "Congratulations! 🎉",
    notifAllDoneBody: "You completed all target blocks today.",
  },
};

const themes = {
  dark: {
    bg: "bg-zinc-950",
    text: "text-zinc-100",
    accent: "bg-indigo-600 hover:bg-indigo-500",
    badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    ring: "text-indigo-500",
    panel: "bg-zinc-900/95 text-zinc-100",
  },
  light: {
    bg: "bg-slate-100",
    text: "text-slate-800",
    accent: "bg-slate-900 hover:bg-slate-800",
    badge: "bg-slate-200 text-slate-800 border-slate-300",
    ring: "text-slate-800",
    panel: "bg-white/95 text-slate-800",
  },
  forest: {
    bg: "bg-emerald-950",
    text: "text-emerald-50",
    accent: "bg-emerald-600 hover:bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    ring: "text-emerald-400",
    panel: "bg-emerald-900/95 text-emerald-50",
  },
  ocean: {
    bg: "bg-slate-950",
    text: "text-sky-50",
    accent: "bg-sky-500 hover:bg-sky-400",
    badge: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    ring: "text-sky-400",
    panel: "bg-slate-900/95 text-sky-50",
  },
  sunset: {
    bg: "bg-zinc-950",
    text: "text-rose-50",
    accent: "bg-rose-600 hover:bg-rose-500",
    badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    ring: "text-rose-500",
    panel: "bg-zinc-900/95 text-rose-50",
  },
  lavender: {
    bg: "bg-slate-950",
    text: "text-purple-50",
    accent: "bg-purple-600 hover:bg-purple-500",
    badge: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    ring: "text-purple-400",
    panel: "bg-slate-900/95 text-purple-50",
  },
};

/* ==========================================================================
   2. STATE MANAGEMENT
   ========================================================================== */
const DEFAULT_STATE = {
  lang: "tr",
  theme: "dark",
  workMinutes: 50,
  breakMinutes: 10,
  totalSets: 4,
  mode: "work",
  currentSet: 1,
  currentTask: "",
  remainingSeconds: 50 * 60,
  isRunning: false,
};

let state = loadState();
let timerInterval = null;

function loadState() {
  try {
    const saved = localStorage.getItem("focusblock-state");
    if (!saved) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(saved);
    return { ...DEFAULT_STATE, ...parsed, isRunning: false };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState() {
  localStorage.setItem("focusblock-state", JSON.stringify(state));
}

function clearAllData() {
  const t = i18n[state.lang] || i18n.tr;
  if (confirm(t.confirmClear)) {
    localStorage.removeItem("focusblock-state");
    location.reload();
  }
}

/* ==========================================================================
   3. DOM BİLEŞENLERİ
   ========================================================================== */
const $ = (id) => document.getElementById(id);

const timerDisplay = $("timerDisplay");
const modeBadge = $("modeBadge");
const currentSetEl = $("currentSet");
const totalSetsEl = $("totalSets");
const taskInput = $("taskInput");
const progressRing = $("progressRing");

const startPauseBtn = $("startPauseBtn");
const startPauseLabel = $("startPauseLabel");
const playIcon = $("playIcon");
const pauseIcon = $("pauseIcon");
const resetBtn = $("resetBtn");
const skipBtn = $("skipBtn");
const addSetBtn = $("addSetBtn");
const removeSetBtn = $("removeSetBtn");

const settingsBtn = $("settingsBtn");
const closeSettingsBtn = $("closeSettingsBtn");
const settingsPanel = $("settingsPanel");
const overlay = $("overlay");
const clearStorageBtn = $("clearStorageBtn");

const workInput = $("workInput");
const breakInput = $("breakInput");
const setsInput = $("setsInput");

/* ==========================================================================
   4. BİLDİRİM VE SES
   ========================================================================== */
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "https://fav.farm/✨",
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

function playCustomSound(type = "start") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    if (type === "start") {
      playTone(440, now, 0.2);
      playTone(659.25, now + 0.1, 0.3);
    } else {
      playTone(523.25, now, 0.2);
      playTone(659.25, now + 0.1, 0.2);
      playTone(783.99, now + 0.2, 0.3);
    }
    setTimeout(() => ctx.close(), 800);
  } catch (_) {}
}

/* ==========================================================================
   5. DAİRESEL İLERLEME ÇUBUĞU
   ========================================================================== */
const CIRCUMFERENCE = 2 * Math.PI * 44;

function updateProgressRing() {
  let totalSeconds = state.workMinutes * 60;
  if (state.mode === "break") totalSeconds = state.breakMinutes * 60;

  if (totalSeconds <= 0 || state.mode === "done") {
    progressRing.style.strokeDashoffset = CIRCUMFERENCE;
    return;
  }

  const offset =
    CIRCUMFERENCE - (state.remainingSeconds / totalSeconds) * CIRCUMFERENCE;
  progressRing.style.strokeDasharray = `${CIRCUMFERENCE}`;
  progressRing.style.strokeDashoffset = offset;
}

/* ==========================================================================
   6. UI RENDERERS
   ========================================================================== */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateUI() {
  const formattedTime = formatTime(state.remainingSeconds);
  const t = i18n[state.lang] || i18n.tr;

  timerDisplay.textContent = formattedTime;
  currentSetEl.textContent = state.currentSet;
  totalSetsEl.textContent = state.totalSets;

  updateProgressRing();

  let modeText = t.work;
  if (state.mode === "break") modeText = t.break;
  if (state.mode === "done") modeText = t.done;

  modeBadge.querySelector("span").textContent = modeText;

  const taskPrefix = state.currentTask ? `[${state.currentTask}] ` : "";
  document.title = `(${formattedTime}) ${taskPrefix}${modeText}`;

  if (state.isRunning) {
    playIcon.classList.add("hidden");
    pauseIcon.classList.remove("hidden");
    startPauseLabel.textContent = t.pause;
  } else {
    playIcon.classList.remove("hidden");
    pauseIcon.classList.add("hidden");
    startPauseLabel.textContent = t.start;
  }

  // Input alanlarını senkronize et
  workInput.value = state.workMinutes;
  breakInput.value = state.breakMinutes;
  setsInput.value = state.totalSets;
  taskInput.value = state.currentTask || "";
}

function applyTheme() {
  const th = themes[state.theme] || themes.dark;

  document.body.className = `h-screen w-screen overflow-hidden font-sans antialiased select-none transition-colors duration-500 ${th.bg} ${th.text}`;

  const isPanelOpen = settingsPanel.classList.contains("open");
  settingsPanel.className = `settings-panel fixed inset-y-0 right-0 sm:right-6 sm:top-6 sm:bottom-6 w-full max-w-md sm:rounded-3xl z-50 flex flex-col border border-black/10 dark:border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden ${th.panel} ${isPanelOpen ? "open" : ""}`;

  startPauseBtn.className = `px-8 py-4 rounded-2xl shadow-xl text-white font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 min-w-[140px] ${th.accent}`;
  modeBadge.className = `px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all border backdrop-blur-md ${th.badge}`;

  progressRing.className = `transition-all duration-1000 ease-linear ${th.ring}`;

  document.querySelectorAll(".theme-btn").forEach((btn) => {
    const active = btn.dataset.theme === state.theme;
    btn.classList.toggle("border-current", active);
    btn.classList.toggle("opacity-100", active);
    btn.classList.toggle("opacity-40", !active);
  });
}

function applyLanguage() {
  const t = i18n[state.lang] || i18n.tr;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key]) el.placeholder = t[key];
  });

  document.documentElement.lang = state.lang;

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const active = btn.dataset.lang === state.lang;
    btn.classList.toggle("border-current", active);
    btn.classList.toggle("opacity-100", active);
    btn.classList.toggle("opacity-40", !active);
  });

  updateUI();
}

/* ==========================================================================
   7. SAYAÇ MANTIĞI
   ========================================================================== */
function tick() {
  if (state.remainingSeconds > 0) {
    state.remainingSeconds--;
  } else {
    advancePhase();
  }
  saveState();
  updateUI();
}

function startTimer() {
  requestNotificationPermission();
  if (state.mode === "done") return;

  playCustomSound("start");
  state.isRunning = true;
  clearInterval(timerInterval);
  timerInterval = setInterval(tick, 1000);
  updateUI();
  saveState();
}

function pauseTimer() {
  state.isRunning = false;
  clearInterval(timerInterval);
  updateUI();
  saveState();
}

function toggleStartPause() {
  if (state.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function resetTimer() {
  pauseTimer();
  state.mode = "work";
  state.currentSet = 1;
  state.remainingSeconds = state.workMinutes * 60;
  saveState();
  updateUI();
}

function advancePhase() {
  playCustomSound("complete");
  const t = i18n[state.lang] || i18n.tr;

  if (state.mode === "work") {
    if (state.currentSet >= state.totalSets) {
      state.mode = "done";
      state.remainingSeconds = 0;
      pauseTimer();
      showNotification(t.notifAllDoneTitle, t.notifAllDoneBody);
      return;
    }
    state.mode = "break";
    state.remainingSeconds = state.breakMinutes * 60;
    showNotification(t.notifWorkDoneTitle, t.notifWorkDoneBody);
  } else if (state.mode === "break") {
    state.currentSet++;
    state.mode = "work";
    state.remainingSeconds = state.workMinutes * 60;
    showNotification(
      t.notifBreakDoneTitle,
      state.lang === "tr"
        ? `${state.currentSet}. ${t.notifBreakDoneBody}`
        : `${t.notifBreakDoneBody} ${state.currentSet}.`,
    );
  } else {
    state.mode = "work";
    state.currentSet = 1;
    state.remainingSeconds = state.workMinutes * 60;
  }

  pauseTimer();
}

/* ==========================================================================
   8. ETKİLEŞİM DİNLENİCİLERİ
   ========================================================================== */
startPauseBtn.addEventListener("click", toggleStartPause);
resetBtn.addEventListener("click", resetTimer);
skipBtn.addEventListener("click", () => {
  advancePhase();
  saveState();
  updateUI();
});

addSetBtn.addEventListener("click", () => {
  if (state.totalSets < 20) {
    state.totalSets++;
    if (state.mode === "done") {
      state.mode = "work";
      state.remainingSeconds = state.workMinutes * 60;
    }
    saveState();
    updateUI();
  }
});

removeSetBtn.addEventListener("click", () => {
  if (state.totalSets > 1) {
    state.totalSets--;
    if (state.currentSet > state.totalSets) state.currentSet = state.totalSets;
    saveState();
    updateUI();
  }
});

taskInput.addEventListener("input", (e) => {
  state.currentTask = e.target.value;
  saveState();
  updateUI();
});

// Ayarlar Paneli Tab Mantığı
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.remove("active");
      b.classList.add("opacity-40");
    });
    document.querySelectorAll(".tab-content").forEach((c) => {
      c.classList.add("hidden");
    });

    btn.classList.add("active");
    btn.classList.remove("opacity-40");

    const targetTab = btn.dataset.tab;
    if (targetTab === "timer") $("tabContentTimer").classList.remove("hidden");
    if (targetTab === "appearance")
      $("tabContentAppearance").classList.remove("hidden");
  });
});

// Stepper (+ / -) Butonları
document.querySelectorAll(".stepper-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = $(btn.dataset.target);
    const step = parseInt(btn.dataset.step);
    let val = (parseInt(input.value) || 0) + step;

    val = Math.min(
      Math.max(val, parseInt(input.min) || 1),
      parseInt(input.max) || 100,
    );
    input.value = val;
    input.dispatchEvent(new Event("change"));
  });
});

// Ayarlar Panelini Aç/Kapat
const openSettings = () => {
  workInput.value = state.workMinutes;
  breakInput.value = state.breakMinutes;
  setsInput.value = state.totalSets;

  settingsPanel.classList.add("open");
  overlay.classList.add("open");
};

const closeSettings = () => {
  settingsPanel.classList.remove("open");
  overlay.classList.remove("open");
};

settingsBtn.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
overlay.addEventListener("click", closeSettings);
clearStorageBtn.addEventListener("click", clearAllData);

// Dil & Tema Seçimleri
document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.lang = btn.dataset.lang;
    applyLanguage();
    saveState();
  });
});

document.querySelectorAll(".theme-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    applyTheme();
    saveState();
  });
});

// Süre Güncellemeleri
workInput.addEventListener("change", (e) => {
  let val = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 120);
  state.workMinutes = val;
  if (state.mode === "work" && !state.isRunning)
    state.remainingSeconds = val * 60;
  saveState();
  updateUI();
});

breakInput.addEventListener("change", (e) => {
  let val = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 60);
  state.breakMinutes = val;
  if (state.mode === "break" && !state.isRunning)
    state.remainingSeconds = val * 60;
  saveState();
  updateUI();
});

setsInput.addEventListener("change", (e) => {
  let val = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 20);
  state.totalSets = val;
  saveState();
  updateUI();
});

// Klavye Kısayolu (Space ile Başlat / Duraklat)
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.code === "Space") {
    e.preventDefault();
    toggleStartPause();
  }
});

/* ==========================================================================
   9. İLK ÇALIŞTIRMA
   ========================================================================== */
applyTheme();
applyLanguage();
updateUI();
