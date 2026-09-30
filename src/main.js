/* ==========================================================================
   1. SABİTLER VE SÖZLÜK (i18n & THEMES)
   ========================================================================== */
const i18n = {
  tr: {
    appTitle: "Pomodoro",
    settings: "Ayarlar",
    language: "Dil",
    theme: "Tema",
    work: "Çalışma",
    break: "Mola",
    set: "Set",
    workDuration: "Çalışma Süresi (dk)",
    breakDuration: "Mola Süresi (dk)",
    setsCount: "Set Sayısı",
    addSet: "+ Set",
    removeSet: "− Set",
    done: "Tamamlandı!",
    clearData: "Verileri Sıfırla",
    confirmClear:
      "Tüm kayıtlı ayarlarınız ve ilerlemeniz silinecektir. Onaylıyor musunuz?",
    notifWorkDoneTitle: "Mola Zamanı! ☕",
    notifWorkDoneBody: "Çalışma süren bitti, biraz dinlenmeyi hak ettin.",
    notifBreakDoneTitle: "Çalışma Zamanı! 🎯",
    notifBreakDoneBody: "sete başlama zamanı geldi.",
    notifAllDoneTitle: "Tebrikler! 🎉",
    notifAllDoneBody: "Tüm Pomodoro setlerini başarıyla tamamladın.",
  },
  en: {
    appTitle: "Pomodoro",
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    work: "Work",
    break: "Break",
    set: "Set",
    workDuration: "Work (minutes)",
    breakDuration: "Break (minutes)",
    setsCount: "Number of sets",
    addSet: "+ Set",
    removeSet: "− Set",
    done: "Done!",
    clearData: "Reset All Data",
    confirmClear:
      "All your saved settings and progress will be erased. Are you sure?",
    notifWorkDoneTitle: "Break Time! ☕",
    notifWorkDoneBody: "Work session completed, take a rest.",
    notifBreakDoneTitle: "Work Time! 🎯",
    notifBreakDoneBody: "time to start set number",
    notifAllDoneTitle: "Congratulations! 🎉",
    notifAllDoneBody: "You completed all Pomodoro sets.",
  },
};

const themes = {
  dark: {
    bg: "bg-zinc-950",
    text: "text-zinc-100",
    accent: "bg-indigo-600 hover:bg-indigo-700",
    badge: "bg-indigo-500/20 text-indigo-300",
    panel: "bg-zinc-900 text-zinc-100",
  },
  light: {
    bg: "bg-stone-100",
    text: "text-stone-800",
    accent: "bg-rose-500 hover:bg-rose-600",
    badge: "bg-rose-100 text-rose-700",
    panel: "bg-white text-stone-800",
  },
  forest: {
    bg: "bg-emerald-950",
    text: "text-emerald-50",
    accent: "bg-emerald-600 hover:bg-emerald-700",
    badge: "bg-emerald-500/20 text-emerald-300",
    panel: "bg-emerald-900 text-emerald-50",
  },
  ocean: {
    bg: "bg-slate-950",
    text: "text-sky-50",
    accent: "bg-sky-500 hover:bg-sky-600",
    badge: "bg-sky-500/20 text-sky-300",
    panel: "bg-slate-900 text-sky-50",
  },
  sunset: {
    bg: "bg-orange-950",
    text: "text-orange-50",
    accent: "bg-orange-500 hover:bg-orange-600",
    badge: "bg-orange-500/20 text-orange-300",
    panel: "bg-orange-900 text-orange-50",
  },
  lavender: {
    bg: "bg-purple-950",
    text: "text-purple-50",
    accent: "bg-fuchsia-600 hover:bg-fuchsia-700",
    badge: "bg-fuchsia-500/20 text-fuchsia-300",
    panel: "bg-purple-900 text-purple-50",
  },
};

/* ==========================================================================
   2. UYGULAMA DURUMU (STATE MANAGEMENT)
   ========================================================================== */
const DEFAULT_STATE = {
  lang: "tr",
  theme: "dark",
  workMinutes: 25,
  breakMinutes: 5,
  totalSets: 4,
  mode: "work", // 'work' | 'break' | 'done'
  currentSet: 1,
  remainingSeconds: 25 * 60,
  isRunning: false,
};

let state = loadState();
let timerInterval = null;

/* LocalStorage'dan yükleme yapılırken isRunning HER ZAMAN false olmalıdır */
function loadState() {
  try {
    const saved = localStorage.getItem("pomodoro-state");
    if (!saved) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(saved);
    return { ...DEFAULT_STATE, ...parsed, isRunning: false };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState() {
  localStorage.setItem("pomodoro-state", JSON.stringify(state));
}

/* LocalStorage temizleme */
function clearAllData() {
  const t = i18n[state.lang] || i18n.tr;
  if (confirm(t.confirmClear)) {
    localStorage.removeItem("pomodoro-state");
    location.reload();
  }
}

/* ==========================================================================
   3. DOM BİLEŞEN SEÇİCİLERİ
   ========================================================================== */
const $ = (id) => document.getElementById(id);

const timerDisplay = $("timerDisplay");
const modeBadge = $("modeBadge");
const currentSetEl = $("currentSet");
const totalSetsEl = $("totalSets");

const startPauseBtn = $("startPauseBtn");
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
   4. BİLDİRİM VE SES SERVİSLERİ
   ========================================================================== */
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    const notification = new Notification(title, {
      body: body,
      icon: "https://fav.farm/🍅",
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.1;
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 200);
  } catch (_) {}
}

/* ==========================================================================
   5. ARAYÜZ VE TEMA GÜNCELLEME (UI RENDERERS)
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

  // Sayacı Güncelle
  timerDisplay.textContent = formattedTime;
  currentSetEl.textContent = state.currentSet;
  totalSetsEl.textContent = state.totalSets;

  // Mod Adını Belirle
  let modeText = t.work;
  if (state.mode === "break") modeText = t.break;
  if (state.mode === "done") modeText = t.done;

  modeBadge.querySelector("span").textContent = modeText;
  document.title = `(${formattedTime}) ${modeText} - Pomodoro`;

  // Başlat/Durdur İkonlarını Güncelle
  if (state.isRunning) {
    playIcon.classList.add("hidden");
    pauseIcon.classList.remove("hidden");
  } else {
    playIcon.classList.remove("hidden");
    pauseIcon.classList.add("hidden");
  }

  // Form alanlarını eşitle
  workInput.value = state.workMinutes;
  breakInput.value = state.breakMinutes;
  setsInput.value = state.totalSets;
}

function applyTheme() {
  const th = themes[state.theme] || themes.dark;

  // Temayı güvenli şekilde uygula
  document.body.className = `min-h-screen font-sans antialiased overflow-x-hidden ${th.bg} ${th.text}`;
  settingsPanel.className = `settings-panel fixed inset-y-0 left-0 w-full max-w-sm z-50 flex flex-col border-r border-black/10 dark:border-white/10 shadow-2xl ${th.panel}`;
  startPauseBtn.className = `btn-click w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg text-white font-semibold ${th.accent}`;
  modeBadge.className = `mb-6 px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 ${th.badge}`;

  // Buton durumlarını güncelle
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
   6. SAYAÇ ÇEKİRDEK MANTIĞI (TIMER CORE)
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
  playBeep();
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
   7. ETKİLEŞİM DİNLENİCİLERİ (EVENT LISTENERS)
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

// Ayarlar Paneli Aç/Kapat
const openSettings = () => {
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

// Dil & Tema
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

// Süre İnputları
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

// Boşluk (Space) ile Başlat/Durdur
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.code === "Space") {
    e.preventDefault();
    toggleStartPause();
  }
});

/* ==========================================================================
   8. İLK ÇALIŞTIRMA (INITIALIZATION)
   ========================================================================== */
applyTheme();
applyLanguage();
updateUI();
