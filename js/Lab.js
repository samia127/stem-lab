/**
 * lab.js — Virtual STEM Lab Main Logic
 * ──────────────────────────────────────
 * Features:
 *  • Full lab simulation (reactions, temperature, concentration)
 *  • Claude AI assistant integration
 *  • Text-to-speech (TTS) for accessibility
 *  • Speech-to-text microphone input
 *  • Chatbot show/hide toggle
 *  • Language switching (Arabic / English)
 *  • High contrast, large font, reduce motion modes
 *  • Session-based user greeting
 */
'use strict';

/* ══════════════════════════════════════════
   1. SESSION CHECK — redirect if not logged in
══════════════════════════════════════════ */
const session = JSON.parse(sessionStorage.getItem('stemlab_user') || 'null');
if (!session) { window.location.href = 'auth.html'; }

/* ══════════════════════════════════════════
   2. STATE
══════════════════════════════════════════ */
let currentLang  = localStorage.getItem('stemlab_lang') || 'ar';
let ttsEnabled   = false;
let chatVisible  = true;
let recognition  = null;
let isRecording  = false;
let burnerInterval = null;

const state = {
  burnerOn:     false,
  reactionDone: false,
  temperature:  25,
  concentration:50,
  experiment:   'acid-base',
  currentStep:  2,
  observations: [],
  startTime:    Date.now()
};

const CLAUDE_API = '/api/chat';
/* ══════════════════════════════════════════
   3. INIT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Get saved language from localStorage (i18n.js will also do this, but we need to sync currentLang)
  const savedLang = localStorage.getItem('stemlab_lang') || 'ar';
  currentLang = savedLang;
  
  // Restore accessibility prefs
  if (localStorage.getItem('stemlab_highcontrast') === 'true') applyA11y('highcontrast', true);
  if (localStorage.getItem('stemlab_largefont')    === 'true') applyA11y('largefont', true);
  if (localStorage.getItem('stemlab_reducemotion') === 'true') applyA11y('reducemotion', true);

  // Populate header user info
  if (session) {
    const av = document.getElementById('userAvatar');
    const un = document.getElementById('userName');
    if (av) av.textContent = session.name ? session.name.charAt(0).toUpperCase() : '?';
    if (un) un.textContent = session.name || '';
    
    // Update grade badge on load
    updateGradeBadge(currentLang);
    
    // Greet user
    const translations = window.translations || T;
    const t = translations[currentLang] || translations.ar;
    const userGreeting = document.getElementById('userGreeting');
    if (userGreeting) {
      userGreeting.innerHTML = `${t.greeting || ''}<strong>${session.name}</strong>`;
    }

    // Apply user's saved accessibility prefs from registration
    if (session.a11yPrefs) {
      if (session.a11yPrefs.includes('highcontrast')) applyA11y('highcontrast', true);
      if (session.a11yPrefs.includes('largefont'))    applyA11y('largefont', true);
      if (session.a11yPrefs.includes('reducemotion')) applyA11y('reducemotion', true);
      if (session.a11yPrefs.includes('tts'))          { ttsEnabled = true; updateTTSBtn(); }
    }
  }

  // Initialize welcome message and quick prompts
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  if (t.welcomeMsg) {
    const welcomeMsg = document.getElementById('welcomeMsg');
    if (welcomeMsg) welcomeMsg.innerHTML = t.welcomeMsg;
  }
  if (t.welcomeStep) {
    const welcomeStep = document.getElementById('welcomeStep');
    if (welcomeStep) welcomeStep.textContent = t.welcomeStep;
  }
  if (t.quickPrompts && Array.isArray(t.quickPrompts)) {
    const qp = document.getElementById('quickPrompts');
    if (qp) {
      qp.innerHTML = t.quickPrompts.map(p =>
        `<button class="quick-btn" onclick="quickAsk('${p.q.replace(/'/g, "\\'")}')">${p.label}</button>`
      ).join('');
    }
  }

  // Restore chat visibility preference
  const savedChat = localStorage.getItem('stemlab_chat');
  if (savedChat === 'hidden') { chatVisible = true; toggleChatPanel(); }

  // Update toggle chat button text
  updateToggleChatBtn();

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);
  
  // Note: applyLanguage() from i18n.js will be called on DOMContentLoaded and will handle
  // the initial language application. We don't need to call applyLang here to avoid conflicts.
});

/* ══════════════════════════════════════════
   4. KEYBOARD ACCESSIBILITY
══════════════════════════════════════════ */
function handleKeyboard(e) {
  // Escape closes modal
  if (e.key === 'Escape') {
    document.getElementById('reportModal').classList.remove('open');
  }
  // Test tubes keyboard support
  if (document.activeElement.classList.contains('test-tube') && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    document.activeElement.click();
  }
}

/* ══════════════════════════════════════════
   5. LANGUAGE SYSTEM
══════════════════════════════════════════ */
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('stemlab_lang', lang);
  applyLang(lang, true);
}

// Helper function to update grade badge dynamically
function updateGradeBadge(lang) {
  const badgeGrade = document.getElementById('badgeGrade');
  if (!badgeGrade) return;
  
  const translations = window.translations || T;
  const t = translations[lang] || translations.ar;
  
  // Get user's grade from session
  const userGrade = session?.grade || '9';
  const gradeNum = parseInt(userGrade) || 9;
  
  // Format grade display based on language
  if (lang === 'ar') {
    badgeGrade.textContent = `الصف ${gradeNum}`;
  } else {
    badgeGrade.textContent = `Grade ${gradeNum}`;
  }
}

function applyLang(lang, announce) {
  // Update currentLang to match the passed lang parameter
  currentLang = lang;
  
  // Use window.translations if available, fallback to T for backwards compatibility
  const translations = window.translations || T;
  const t = translations[lang] || translations.ar;
  const html = document.documentElement;
  html.setAttribute('lang', t.lang || lang);
  html.setAttribute('dir', t.dir || (lang === 'ar' ? 'rtl' : 'ltr'));

  // Toggle buttons
  const btnAr = document.getElementById('btnAr');
  const btnEn = document.getElementById('btnEn');
  if (btnAr && btnEn) {
    btnAr.classList.toggle('active', lang === 'ar');
    btnAr.setAttribute('aria-pressed', lang === 'ar');
    btnEn.classList.toggle('active', lang === 'en');
    btnEn.setAttribute('aria-pressed', lang === 'en');
  }

  // Logo / badges
  const logoText = document.getElementById('logoText');
  if (logoText) logoText.innerHTML = t.logoText || t.appTitle || '';
  
  // Update grade badge dynamically from user session
  updateGradeBadge(lang);
  
  const badgeCurr = document.getElementById('badgeCurr');
  if (badgeCurr) badgeCurr.textContent = t.curriculumBadge || t.curr || '';

  // User greeting
  if (session) {
    const userGreeting = document.getElementById('userGreeting');
    if (userGreeting) {
      userGreeting.innerHTML = `${t.greeting || ''}<strong>${session.name}</strong>`;
    }
  }

  // Experiment buttons - update via data-i18n if present, otherwise use experiments array
  document.querySelectorAll('.exp-btn').forEach((btn, i) => {
    const i18nKey = btn.getAttribute('data-i18n');
    if (i18nKey && t[i18nKey]) {
      btn.textContent = t[i18nKey];
    } else if (t.experiments && t.experiments[i]) {
      btn.textContent = t.experiments[i];
    }
  });

  // Stage / controls
  document.getElementById('stageLabel').textContent = state.reactionDone ? t.stageDone : t.stageReady;
  document.getElementById('labelTemp').textContent   = t.labelTemp;
  document.getElementById('labelConc').textContent   = t.labelConc;
  document.getElementById('btnReact').textContent    = t.btnReact;
  document.getElementById('btnBurner').textContent   = t.btnBurner;
  document.getElementById('btnReport').textContent   = t.btnReport;
  document.getElementById('btnReset').textContent    = t.btnReset;
  document.getElementById('obsTitle').textContent    = t.obsTitle;
  document.getElementById('burnerLabel').textContent = t.burnerLabel;

  // Beaker labels - use expConfigs if available
  if (t.expConfigs && t.expConfigs[state.experiment]) {
    const cfg = t.expConfigs[state.experiment];
    const labelA = document.getElementById('labelA');
    const labelB = document.getElementById('labelB');
    if (labelA) labelA.innerHTML = `${cfg.a}<br>100 ${cfg.ml}`;
    if (labelB) labelB.innerHTML = `${cfg.b}<br>100 ${cfg.ml}`;
  }

  // AI panel
  const aiName = document.getElementById('aiName');
  const aiDesc = document.getElementById('aiDesc');
  const stepLabel = document.getElementById('stepLabel');
  const welcomeStep = document.getElementById('welcomeStep');
  const welcomeMsg = document.getElementById('welcomeMsg');
  const chatInput = document.getElementById('chatInput');
  const chatArea = document.getElementById('chatArea');
  const fabLabel = document.getElementById('fabLabel');
  
  if (aiName) aiName.textContent = t.aiName || '';
  if (aiDesc) aiDesc.textContent = t.aiDesc || '';
  if (stepLabel) stepLabel.textContent = t.stepLabel || '';
  if (welcomeStep) welcomeStep.textContent = t.welcomeStep || '';
  if (welcomeMsg) welcomeMsg.innerHTML = t.welcomeMsg || '';
  if (chatInput) {
    chatInput.placeholder = t.chatPlaceholder || '';
    chatInput.style.direction = t.dir || (lang === 'ar' ? 'rtl' : 'ltr');
  }
  if (chatArea) chatArea.style.direction = t.dir || (lang === 'ar' ? 'rtl' : 'ltr');
  if (fabLabel) fabLabel.textContent = t.fabLabel || '';

  // Quick prompts - only update if quickPrompts array exists
  const qp = document.getElementById('quickPrompts');
  if (qp && t.quickPrompts && Array.isArray(t.quickPrompts)) {
    qp.innerHTML = t.quickPrompts.map(p =>
      `<button class="quick-btn" onclick="quickAsk('${p.q.replace(/'/g, "\\'")}')">${p.label}</button>`
    ).join('');
  }
  
  // Update welcome message and step
  if (t.welcomeMsg) {
    const welcomeMsg = document.getElementById('welcomeMsg');
    if (welcomeMsg) welcomeMsg.innerHTML = t.welcomeMsg;
  }
  if (t.welcomeStep) {
    const welcomeStep = document.getElementById('welcomeStep');
    if (welcomeStep) welcomeStep.textContent = t.welcomeStep;
  }
  
  // Update toggle chat button
  updateToggleChatBtn();

  // Report modal - these are handled by data-i18n in HTML, but update if needed
  const modalTitle = document.getElementById('reportModalTitle');
  if (modalTitle && !modalTitle.getAttribute('data-i18n')) {
    modalTitle.textContent = t.modalTitle || '';
  }
  const repTitle = document.getElementById('repTitle');
  const repGoal = document.getElementById('repGoal');
  const repMaterials = document.getElementById('repMaterials');
  const repSafety = document.getElementById('repSafety');
  const modalClose = document.getElementById('reportClose');
  
  if (repTitle && !repTitle.getAttribute('data-i18n')) repTitle.textContent = t.repTitleVal || '';
  if (repGoal && !repGoal.getAttribute('data-i18n')) repGoal.textContent = t.repGoalVal || '';
  if (repMaterials && !repMaterials.getAttribute('data-i18n')) repMaterials.textContent = t.repMatsVal || '';
  if (repSafety && !repSafety.getAttribute('data-i18n')) repSafety.textContent = t.repSafetyVal || '';
  if (modalClose && !modalClose.getAttribute('data-i18n')) modalClose.textContent = t.modalClose || '';

  if (announce) {
    addMsg('ai', t.switchedMsg);
    showNotification(t.langSwitched);
    if (ttsEnabled) speakText(t.switchedMsg.replace(/<[^>]+>/g, ''));
  }
}

/* ══════════════════════════════════════════
   6. CHATBOT SHOW / HIDE
══════════════════════════════════════════ */
function toggleChatPanel() {
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  chatVisible = !chatVisible;
  const appEl  = document.querySelector('.app');
  const panel  = document.getElementById('aiPanelRegion');
  const fab    = document.getElementById('openChatFab');

  if (chatVisible) {
    appEl.classList.remove('chat-hidden');
    if (panel) { panel.setAttribute('aria-hidden','false'); }
    if (fab)   { fab.classList.remove('visible'); fab.setAttribute('aria-expanded','false'); }
    showNotification(t.notifChatVisible || (currentLang==="ar"?"✅ المساعد ظاهر":"✅ Assistant shown"));
    updateToggleChatBtn();
    localStorage.setItem('stemlab_chat','visible');
    setTimeout(() => { const ci = document.getElementById('chatInput'); if(ci) ci.focus(); }, 300);
  } else {
    appEl.classList.add('chat-hidden');
    if (panel) { panel.setAttribute('aria-hidden','true'); }
    if (fab)   { fab.classList.add('visible'); fab.setAttribute('aria-expanded','true'); }
    showNotification(t.notifChatHidden || (currentLang==="ar"?"المساعد مخفي":"Assistant hidden"));
    updateToggleChatBtn();
    localStorage.setItem('stemlab_chat','hidden');
  }
}

/* ══════════════════════════════════════════
   7. CLAUDE AI
══════════════════════════════════════════ */
async function askClaude(userMsg) {
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  showTyping();
  try {
    const response = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `${t.aiSystemPrompt}
Current lab: experiment=${state.experiment}, temp=${state.temperature}°C, reaction=${state.reactionDone ? 'complete' : 'not started'}.`,
        messages: [{ role: 'user', content: userMsg }]
      })
    });
    const data = await response.json();
    hideTyping();
    const text = data.content?.map(b => b.text || '').join('') || t.aiNoAnswer;
    addMsg('ai', text);
    advanceStep();
    if (ttsEnabled) speakText(text.replace(/<[^>]+>/g, ''));
  } catch(e) {
    hideTyping();
    addMsg('ai', t.aiError);
  }
}

function addMsg(role, text) {
  const area = document.getElementById('chatArea');
  const div  = document.createElement('div');
  div.className = `msg ${role}`;
  div.setAttribute('role', 'article');
  div.setAttribute('aria-label', role === 'ai' ? 'AI response' : 'Your message');
  div.innerHTML = `
    <div class="msg-avatar" aria-hidden="true">${role === 'ai' ? '🤖' : '👨‍🎓'}</div>
    <div class="msg-bubble">${text}</div>
  `;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

let typingEl = null;
function showTyping() {
  const area = document.getElementById('chatArea');
  typingEl = document.createElement('div');
  typingEl.className = 'msg ai';
  typingEl.setAttribute('aria-label', 'AI is typing');
  typingEl.innerHTML = `
    <div class="msg-avatar" aria-hidden="true">🤖</div>
    <div class="msg-bubble">
      <div class="typing" aria-label="Loading">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div>
    </div>`;
  area.appendChild(typingEl);
  area.scrollTop = area.scrollHeight;
}
function hideTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text  = input.value.trim();
  if (!text) return;
  addMsg('user', text);
  input.value = '';
  askClaude(text);
}

function quickAsk(text) { addMsg('user', text); askClaude(text); }

function advanceStep() {
  if (state.currentStep >= 5) return;
  const el = document.getElementById(`step${state.currentStep}`);
  if (el) el.className = 'step-dot done';
  state.currentStep++;
  const next = document.getElementById(`step${state.currentStep}`);
  if (next) next.className = 'step-dot current';
}

/* ══════════════════════════════════════════
   8. TEXT-TO-SPEECH (Accessibility)
══════════════════════════════════════════ */
function toggleTTS() {
  ttsEnabled = !ttsEnabled;
  updateTTSBtn();
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  showNotification(ttsEnabled ? t.notifTTSOn : t.notifTTSOff);
  if (!ttsEnabled) window.speechSynthesis?.cancel();
}

function updateTTSBtn() {
  const btn = document.getElementById('ttsBtn');
  if (!btn) return;
  btn.classList.toggle('active', ttsEnabled);
  btn.setAttribute('aria-pressed', ttsEnabled);
}

function speakText(text) {
  if (!ttsEnabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang  = currentLang === 'ar' ? 'ar-SA' : 'en-US';
  utter.rate  = 0.9;

  const bar = document.getElementById('ttsBar');
  document.getElementById('ttsBarText').textContent = t.ttsReading;
  bar.style.display = 'flex';
  utter.onend = () => { bar.style.display = 'none'; };
  utter.onerror = () => { bar.style.display = 'none'; };

  window.speechSynthesis.speak(utter);
}

/* ══════════════════════════════════════════
   9. VOICE INPUT — MICROPHONE (Accessibility)
══════════════════════════════════════════ */
function startVoiceInput() {
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showNotification(t.voiceNotSupported);
    return;
  }
  const micBtn = document.getElementById('micBtn');

  if (isRecording && recognition) {
    recognition.abort();
    recognition = null;
    isRecording = false;
    micBtn.classList.remove('recording');
    micBtn.setAttribute('aria-pressed', 'false');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = currentLang === 'ar' ? 'ar-SA' : 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  isRecording = true;
  micBtn.classList.add('recording');
  micBtn.setAttribute('aria-pressed', 'true');
  showNotification(t.voiceListening);

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const input = document.getElementById('chatInput');
    input.value = transcript;
    input.focus();
    isRecording = false;
    micBtn.classList.remove('recording');
    micBtn.setAttribute('aria-pressed', 'false');
    sendMessage();
  };

  recognition.onerror = recognition.onend = () => {
    isRecording = false;
    micBtn.classList.remove('recording');
    micBtn.setAttribute('aria-pressed', 'false');
    recognition = null;
  };

  recognition.start();
}

/* ══════════════════════════════════════════
   10. ACCESSIBILITY TOGGLES
══════════════════════════════════════════ */
function applyA11y(mode, value) {
  const map = {
    highcontrast: 'high-contrast',
    largefont:    'large-font',
    reducemotion: 'reduce-motion'
  };
  document.body.classList.toggle(map[mode], value);
}

function toggleHighContrast() {
  const on = document.body.classList.toggle('high-contrast');
  localStorage.setItem('stemlab_highcontrast', on);
  const btn = document.getElementById('ttsBtn')?.parentElement?.querySelectorAll('.icon-btn')[1];
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  showNotification(on ? t.notifHCOn : t.notifHCOff);
}

function toggleLargeFont() {
  const on = document.body.classList.toggle('large-font');
  localStorage.setItem('stemlab_largefont', on);
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  showNotification(on ? t.notifLFOn : t.notifLFOff);
}

function toggleReduceMotion() {
  const on = document.body.classList.toggle('reduce-motion');
  localStorage.setItem('stemlab_reducemotion', on);
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  showNotification(on ? t.notifRMOn : t.notifRMOff);
}

/* ══════════════════════════════════════════
   11. LAB ACTIONS
══════════════════════════════════════════ */
function startReaction() {
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  if (state.reactionDone) { showNotification(t.notifResetFirst); return; }
  state.reactionDone = true;
  document.getElementById('stageLabel').textContent = t.stageRunning;
  document.getElementById('liquidA').style.height = '5%';
  document.getElementById('liquidB').style.height = '5%';
  setTimeout(() => {
    document.getElementById('liquidResult').style.height = '55%';
    document.getElementById('liquidResult').style.background = 'linear-gradient(180deg, rgba(0,255,136,0.5), rgba(0,200,100,0.8))';
    document.getElementById('resultLabel').textContent = 'NaCl + H₂O';
    document.getElementById('stageLabel').textContent = t.stageDone;
    const flash = document.getElementById('reactionFlash');
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 600);
  }, 1500);
  addObservation(t.obs1);
  setTimeout(() => addObservation(t.obs2), 2000);
  setTimeout(() => addObservation(t.obs3), 3000);
  showNotification(t.notifReactDone);
  addMsg('ai', t.reactionMsg);
  if (ttsEnabled) setTimeout(() => speakText(t.reactionMsg.replace(/<[^>]+>/g, '')), 200);
}

function toggleBurner() {
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  state.burnerOn = !state.burnerOn;
  document.getElementById('flame').classList.toggle('active', state.burnerOn);
  if (state.burnerOn) {
    addObservation(t.obsBurner);
    showNotification(t.notifBurnerOn);
    let temp = state.temperature;
    burnerInterval = setInterval(() => {
      if (!state.burnerOn || temp >= 100) { clearInterval(burnerInterval); return; }
      temp += 2;
      state.temperature = temp;
      setTemperatureDisplay(temp);
      if (temp >= 100) addObservation(t.obsBoiling);
    }, 400);
  } else {
    if (burnerInterval) clearInterval(burnerInterval);
    showNotification(t.notifBurnerOff);
  }
}

function setTemperature(val) {
  state.temperature = parseInt(val);
  setTemperatureDisplay(val);
  document.getElementById('tempSlider').setAttribute('aria-valuenow', val);
}

function setTemperatureDisplay(val) {
  const pct   = ((val - 20) / 100) * 80 + 20;
  const color = val > 80 ? 'var(--red)' : val > 50 ? 'var(--orange)' : 'var(--accent)';
  document.getElementById('thermoFill').style.height    = pct + '%';
  document.getElementById('thermoReading').textContent  = val + '°C';
  document.getElementById('thermoReading').style.color  = color;
}

function setConcentration(val) {
  state.concentration = parseInt(val);
  const opacity = 0.4 + (val / 100) * 0.5;
  document.getElementById('liquidA').style.opacity = opacity;
  document.getElementById('liquidB').style.opacity = opacity;
  document.getElementById('concSlider').setAttribute('aria-valuenow', val);
}

function testTubeClick(i) {
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  const colors = ['rgba(255,100,100,0.8)','rgba(255,165,0,0.8)','rgba(100,255,150,0.8)','rgba(100,150,255,0.8)'];
  document.getElementById(`tube${i}`).style.background = colors[i];
  const obs = `${t.tubePrefix} ${i+1}: ${t.tubeLabels[i]}`;
  addObservation(obs);
  if (ttsEnabled) speakText(obs);
  askClaude(`${t.tubeAsk} ${i+1} this color? Solution pH = ${[1,5,7,10][i]}`);
}

function selectExp(btn, exp) {
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  document.querySelectorAll('.exp-btn').forEach((b, i) => {
    b.classList.toggle('active', b === btn);
    b.setAttribute('aria-selected', b === btn);
  });
  state.experiment = exp;
  resetLab(true);

  const colorMap = {
    'acid-base':    { cA: 'rgba(255,59,107,0.8)',  cB: 'rgba(59,107,255,0.8)' },
    'boiling':      { cA: 'rgba(150,200,255,0.6)', cB: 'rgba(200,240,255,0.6)' },
    'indicator':    { cA: 'rgba(255,165,0,0.7)',   cB: 'rgba(200,100,255,0.7)' },
    'electrolysis': { cA: 'rgba(100,200,255,0.7)', cB: 'rgba(255,220,100,0.7)' }
  };
  const cfg = t.expConfigs[exp];
  const col = colorMap[exp];
  document.getElementById('labelA').innerHTML = `${cfg.a}<br>100 ${cfg.ml}`;
  document.getElementById('labelB').innerHTML = `${cfg.b}<br>100 ${cfg.ml}`;
  document.getElementById('liquidA').style.background =
    `linear-gradient(180deg, ${col.cA.replace('0.8','0.4')}, ${col.cA})`;
  document.getElementById('liquidB').style.background =
    `linear-gradient(180deg, ${col.cB.replace('0.8','0.4')}, ${col.cB})`;

  addMsg('user', `${t.expUserPrefix} ${btn.textContent}`);
  askClaude(`${t.expAskPrefix} "${btn.textContent}" ${t.expAskSuffix}`);
}

function resetLab(silent = false) {
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  state.reactionDone  = false;
  state.burnerOn      = false;
  state.temperature   = 25;
  if (burnerInterval) clearInterval(burnerInterval);

  document.getElementById('flame').classList.remove('active');
  document.getElementById('liquidA').style.height  = '50%';
  document.getElementById('liquidB').style.height  = '45%';
  document.getElementById('liquidResult').style.height = '0%';
  document.getElementById('resultLabel').textContent   = '—';
  document.getElementById('stageLabel').textContent    = t.stageReady;
  document.getElementById('thermoFill').style.height   = '20%';
  document.getElementById('thermoReading').textContent = '25°C';
  document.getElementById('thermoReading').style.color = 'var(--accent)';
  document.getElementById('tempSlider').value          = 25;

  if (!silent) showNotification(t.notifReset);
}

function generateReport() {
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  const obsText = state.observations.length > 0
    ? state.observations.map(o => `• [${o.time}] ${o.text}`).join('\n')
    : t.repNoObs;
  document.getElementById('repResults').textContent   = obsText;
  document.getElementById('repConclusion').textContent = state.reactionDone ? t.repConclusionVal : t.repNoObs;
  document.getElementById('reportModal').classList.add('open');
  // Focus modal for accessibility
  setTimeout(() => document.getElementById('modalClose').focus(), 100);
  if (ttsEnabled) speakText(t.repTitleVal + '. ' + obsText);
}

/* ══════════════════════════════════════════
   12. UTILITIES
══════════════════════════════════════════ */
function addObservation(text) {
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const mins    = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs    = String(elapsed % 60).padStart(2, '0');
  const log     = document.getElementById('obsLog');
  const entry   = document.createElement('div');
  entry.className = 'obs-entry';
  entry.innerHTML = `<span class="obs-time">${mins}:${secs}</span><span>${text}</span>`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
  state.observations.push({ time: `${mins}:${secs}`, text });
}

function showNotification(msg) {
  const n = document.getElementById('notification');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 2500);
}

function logout() {
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  if (confirm(t.logoutConfirm)) {
    sessionStorage.removeItem('stemlab_user');
    window.location.href = 'auth.html';
  }
}

/* ══════════════════════════════════════════
   EXTRA: Aliases & init for index.html
══════════════════════════════════════════ */

// Alias used by index.html buttons
function toggleChat() { toggleChatPanel(); }
function closeReport() {
  document.getElementById('reportModal').classList.remove('open');
  document.getElementById('btnReport').focus();
}

// Removed duplicate DOMContentLoaded listener - merged into the one above

function updateToggleChatBtn() {
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  const btn = document.getElementById('headerToggleChat');
  const lbl = document.getElementById('toggleChatLabel');
  const fab = document.getElementById('openChatFab');
  if (btn) btn.setAttribute('aria-expanded', chatVisible ? 'true' : 'false');
  if (lbl) {
    const labelKey = chatVisible ? 'chatToggleHide' : 'chatToggleShow';
    lbl.textContent = t[labelKey] || (currentLang==='ar' ? '🤖 إخفاء المساعد' : '🤖 Hide Assistant');
  }
  if (fab) fab.classList.toggle('visible', !chatVisible);
}


function openChangeGradeModal() {
  const modal = document.getElementById('changeGradeModal');
  const gradeSelect = document.getElementById('gradeSelect');
  if (!modal || !gradeSelect) return;
  
  // Set current grade in select
  const currentGrade = session?.grade || '9';
  gradeSelect.value = currentGrade;
  
  // Apply translations to modal
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  document.querySelectorAll('#changeGradeModal [data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      if (el.tagName === 'OPTION') {
        el.textContent = t[key];
      } else {
        el.textContent = t[key];
      }
    }
  });
  
  // Update grade select options
  const gradeKeys = ['grade6', 'grade7', 'grade8', 'grade9', 'grade10', 'grade11', 'grade12'];
  gradeSelect.querySelectorAll('option').forEach((opt, idx) => {
    const key = gradeKeys[idx];
    if (key && t[key]) opt.textContent = t[key];
  });
  
  modal.classList.add('open');
  gradeSelect.focus();
  
}

function closeChangeGradeModal() {
  const modal = document.getElementById('changeGradeModal');
  if (modal) modal.classList.remove('open');
}

async function saveGradeChange() {
  const gradeSelect = document.getElementById('gradeSelect');
  if (!gradeSelect || !session) return;
  
  const newGrade = gradeSelect.value;
  if (!newGrade) return;
  
  const translations = window.translations || T;
  const t = translations[currentLang] || translations.ar;
  
  try {
    const res = await fetch('/api/user/grade', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade: newGrade, email: session.email }),
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.ok) {
      showNotification(t.gradeChanged || 'Failed to update grade');
      return;
    }
    
    // Update session
    session.grade = newGrade;
    sessionStorage.setItem('stemlab_user', JSON.stringify(session));
    
    // Update grade badge immediately
    updateGradeBadge(currentLang);
    
    // Show success message
    showNotification(t.gradeChanged || 'Grade updated successfully');
    
    // Close modal
    closeChangeGradeModal();
  } catch (err) {
    console.error(err);
    showNotification(t.gradeChanged || 'Failed to update grade');
  }
}

// Expose applyLang globally so i18n.js can call it
window.applyLang = applyLang;