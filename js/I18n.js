// Simple client-side translation system shared across pages
// --------------------------------------------------------
// Usage:
//   - Elements with data-i18n="key" will have their textContent/innerHTML
//     updated based on translations[lang][key].
//   - Call applyLanguage(lang) to switch, it will:
//       * update document <html lang/dir>
//       * update visible language toggle buttons if present
//       * update document.title from translations[lang].appTitle or pageTitleAuth
//   - Language preference is stored in localStorage under "stemlab_lang".

window.translations = {

  /* ── ENGLISH ─────────────────────────────────────────── */
  en: {
    // HTML attributes
    dir: 'ltr',
    lang: 'en',

    // Page titles
    appTitle: 'STEM Labs Oman',
    pageTitleAuth: 'Login | STEM Labs Oman',
    pageTitleLab: 'Virtual STEM Lab — STEM Labs Oman',

    // Auth / login
    authLogo: 'STEM<span>Labs</span> Oman',
    loginTab: 'Login',
    registerTab: 'Register',
    loginEmailLabel: 'Email Address',
    loginPasswordLabel: 'Password',
    loginButton: 'Log In',
    noAccountText: "Don't have an account?",
    goRegisterLink: 'Create free account',
    haveAccountText: 'Already have an account?',
    goLoginLink: 'Log in',

    // Register form
    regFullNameLabel: 'Full Name',
    regEmailLabel: 'Email Address',
    regSchoolLabel: 'School Name',
    regGradeLabel: 'Grade',
    regRoleLabel: 'Role',
    regPasswordLabel: 'Password',
    regConfirmPasswordLabel: 'Confirm Password',
    regButton: 'Create Account',
    roleStudent: 'Student',
    roleTeacher: 'Teacher',
    gradePlaceholder: 'Select grade',
    grade6: 'Grade 6',
    grade7: 'Grade 7',
    grade8: 'Grade 8',
    grade9: 'Grade 9',
    grade10: 'Grade 10',
    grade11: 'Grade 11',
    grade12: 'Grade 12',
    securityNote: 'Your password is hashed — it is never stored in plain text',

    // OTP step
    otpTitle: 'Check your email',
    otpDescription: 'We sent a 6‑digit verification code to your email. Enter it below to activate your account.',
    otpCodeLabel: 'Verification code',
    otpPlaceholder: 'Enter 6‑digit code',
    otpSubmitButton: 'Verify code',
    otpResendPrefix: "Didn't get a code?",
    otpResendButton: 'Resend code',
    otpCountdown: 'You can request a new code in {seconds}s',

    // Language toggle
    langArLabel: 'عربي',
    langEnLabel: 'EN',

    // Logout / profile
    logout: 'Logout',
    changeGrade: 'Change Grade',
    gradeChanged: 'Grade updated successfully',
    saveButton: 'Save',
    cancelButton: 'Cancel',
    gradeDisplay: 'Grade —',
    curriculumBadge: 'MOE Curriculum',

    // ── Lab page ──────────────────────────────────────────
    grade: 'Grade 9',
    curr: 'MOE Curriculum',
    logoText: 'STEM<span style="color:var(--accent)">Labs</span> Oman',
    greeting: 'Hello, ',

    experiments: ['⚗️ Acid-Base Reaction','🌡️ Boiling Experiment','🌈 pH Indicator','⚡ Electrolysis'],
    expAcidBase: '⚗️ Acid-Base Reaction',
    expBoiling: '🌡️ Boiling Experiment',
    expIndicator: '🌈 pH Indicator',
    expElectrolysis: '⚡ Electrolysis',

    stageReady: 'Status: Ready',
    stageRunning: '⚗️ Reaction in progress...',
    stageDone: '✅ Reaction Complete',
    labelTemp: 'Temperature',
    labelConc: 'Concentration',
    btnReact: '⚗️ Start Reaction',
    btnBurner: '🔥 Toggle Burner',
    btnReport: '📄 Lab Report',
    btnReset: '↺ Reset Lab',
    obsTitle: '📋 Observations Log',
    obsInit: 'Lab ready — acid and base in separate beakers',
    burnerLabel: 'Bunsen Burner',

    aiName: 'AI Science Assistant',
    aiDesc: 'Your personal virtual lab guide',
    stepLabel: 'Steps:',
    welcomeStep: 'Step 1 of 5',
    welcomeMsg: "Hello! I'm your AI Chemistry Lab assistant. 🧪<br><br>Today you'll learn about <strong>neutralization reactions</strong> between hydrochloric acid and sodium hydroxide.<br><br><strong>Chemical Equation:</strong><br>HCl + NaOH → NaCl + H₂O<br><br>Ready to start? 🚀",
    chatPlaceholder: 'Ask your assistant... e.g. Why did the color change?',

    quickPrompts: [
      { label: 'What is neutralization?', q: 'What is a neutralization reaction?' },
      { label: 'What happens when mixed?', q: 'What happens when acid and base are mixed?' },
      { label: 'How to measure pH?',       q: 'How do I measure pH?' },
      { label: 'Real-world uses',          q: 'What are real-world applications of neutralization reactions?' }
    ],

    chatToggleHide: 'Hide Assistant',
    chatToggleShow: 'Show Assistant',
    fabLabel: 'Assistant',

    modalTitle: '📄 Virtual Lab Report',
    repSec0: '📌 Experiment Title',
    repSec1: '🎯 Objective',
    repSec2: '🧪 Materials & Equipment',
    repSec3: '📊 Observations & Results',
    repSec4: '💡 Conclusion',
    repSec5: '⚠️ Safety Measures',
    repSec: ['📌 Experiment Title','🎯 Objective','🧪 Materials & Equipment','📊 Observations & Results','💡 Conclusion','⚠️ Safety Measures'],
    repTitleVal: 'Neutralization Reaction between HCl and NaOH',
    repGoalVal: 'Study the neutralization reaction and observe changes in chemical properties',
    repMatsVal: 'Hydrochloric acid (HCl) · Sodium hydroxide (NaOH) · Glass beakers · Bunsen burner · Thermometer · Indicator paper',
    repSafetyVal: 'Safety goggles · Gloves · Well-ventilated area · Safe chemical disposal',
    repNoObs: 'No observations recorded — please perform the experiment first',
    repConclusionVal: 'The neutralization reaction between HCl and NaOH was confirmed. Products: NaCl + H₂O. Exothermic reaction.',
    modalClose: '✅ Close Report',

    notifReactDone: '⚗️ Reaction completed!',
    notifReset: '↺ Lab reset',
    notifBurnerOn: '🔥 Burner is on',
    notifBurnerOff: 'Burner turned off',
    notifResetFirst: 'Please reset the lab first',
    notifChatHidden: '💬 Assistant hidden',
    notifChatVisible: '💬 Assistant visible',
    notifTTSOn: '🔊 Text-to-speech enabled',
    notifTTSOff: '🔊 Text-to-speech disabled',
    notifHCOn: '🌓 High contrast on',
    notifHCOff: '🌓 High contrast off',
    notifLFOn: '🔡 Large font on',
    notifLFOff: '🔡 Large font off',
    notifRMOn: '🎞️ Reduce motion on',
    notifRMOff: '🎞️ Normal motion',

    obs1: 'Mixing started — immediate reaction observed',
    obs2: 'Color changed from red/blue to green — neutral solution',
    obs3: 'Temperature rose slightly — exothermic reaction confirmed',
    obsBurner: 'Bunsen burner on — heating solution',
    obsBoiling: 'Temperature reached 100°C — boiling started',

    reactionMsg: '<strong>Excellent! 🎉</strong> The color change confirms the reaction is complete!<br><br><strong>What happened?</strong><br>H⁺ ions from the acid combined with OH⁻ from the base to form water H₂O and salt NaCl.<br>The temperature rise confirms this is an <strong>exothermic</strong> reaction 🌡️',

    tubeLabels: ['Very Acidic - pH 1','Acidic - pH 5','Neutral - pH 7','Basic - pH 10'],
    tubePrefix: 'Tube',
    tubeAsk: 'Why is tube',

    beakerA: 'HCl Acid<br>100 ml',
    beakerB: 'NaOH Base<br>100 ml',
    beakerResult: 'Reaction Result',

    expConfigs: {
      'acid-base':    { a: 'HCl Acid',           b: 'NaOH Base',          ml: 'ml' },
      'boiling':      { a: 'Distilled Water',     b: 'Salt Solution',      ml: 'ml' },
      'indicator':    { a: 'Universal Indicator', b: 'Unknown Solution',   ml: 'ml' },
      'electrolysis': { a: 'Water + H₂SO₄',      b: 'Positive Electrode', ml: 'ml' }
    },

    expUserPrefix: 'I want to run the experiment:',
    expAskPrefix: 'Brief explanation of experiment',
    expAskSuffix: 'for Grade 9 students in Oman',

    aiSystemPrompt: `You are an AI science assistant for middle and high school students in Oman.
Explain chemistry, physics, and biology in a simple, engaging way in English.
You are speaking with Grade 9 students. Include chemical equations when relevant.
Keep responses concise and friendly (3-5 sentences).`,

    aiError: 'Sorry, a connection error occurred. Please try again.',
    aiNoAnswer: "Sorry, I can't answer right now.",
    voiceListening: '🎤 Listening...',
    voiceNotSupported: 'Your browser does not support voice input',
    ttsReading: 'Reading aloud...',
    ttsNotSupported: 'Your browser does not support text-to-speech',
    langSwitched: '🌐 Switched to English',
    switchedMsg: '🌐 Switched to English! How can I help with your experiment?',
    logoutConfirm: 'Are you sure you want to logout?',
  },

  /* ── ARABIC ──────────────────────────────────────────── */
  ar: {
    // HTML attributes
    dir: 'rtl',
    lang: 'ar',

    // Page titles
    appTitle: 'مختبرات ستيم عُمان',
    pageTitleAuth: 'تسجيل الدخول | مختبرات ستيم عُمان',
    pageTitleLab: 'المختبر الافتراضي | مختبرات ستيم عُمان',

    // Auth / login
    authLogo: 'مختبر<span>عُمان</span> الافتراضي',
    loginTab: 'تسجيل الدخول',
    registerTab: 'إنشاء حساب',
    loginEmailLabel: 'البريد الإلكتروني',
    loginPasswordLabel: 'كلمة المرور',
    loginButton: 'تسجيل الدخول',
    noAccountText: 'ليس لديك حساب؟',
    goRegisterLink: 'إنشاء حساب مجاني',
    haveAccountText: 'لديك حساب بالفعل؟',
    goLoginLink: 'تسجيل الدخول',

    // Register form
    regFullNameLabel: 'الاسم الكامل',
    regEmailLabel: 'البريد الإلكتروني',
    regSchoolLabel: 'اسم المدرسة',
    regGradeLabel: 'الصف الدراسي',
    regRoleLabel: 'الدور',
    regPasswordLabel: 'كلمة المرور',
    regConfirmPasswordLabel: 'تأكيد كلمة المرور',
    regButton: 'إنشاء الحساب',
    roleStudent: 'طالب',
    roleTeacher: 'معلم',
    gradePlaceholder: 'اختر الصف',
    grade6: 'الصف 6',
    grade7: 'الصف 7',
    grade8: 'الصف 8',
    grade9: 'الصف 9',
    grade10: 'الصف 10',
    grade11: 'الصف 11',
    grade12: 'الصف 12',
    securityNote: 'كلمة مرورك مشفّرة — لا تُخزّن بصيغتها الأصلية أبداً',

    // OTP step
    otpTitle: 'تحقق من بريدك الإلكتروني',
    otpDescription: 'أرسلنا رمز تحقق مكوّن من 6 أرقام إلى بريدك. أدخله أدناه لتفعيل حسابك.',
    otpCodeLabel: 'رمز التحقق',
    otpPlaceholder: 'أدخل الرمز المكوّن من 6 أرقام',
    otpSubmitButton: 'تأكيد الرمز',
    otpResendPrefix: 'لم يصلك الرمز؟',
    otpResendButton: 'إعادة إرسال الرمز',
    otpCountdown: 'يمكنك طلب رمز جديد بعد {seconds} ثانية',

    // Language toggle
    langArLabel: 'عربي',
    langEnLabel: 'EN',

    // Logout / profile
    logout: 'تسجيل الخروج',
    changeGrade: 'تغيير الصف',
    gradeChanged: 'تم تحديث الصف بنجاح',
    saveButton: 'حفظ',
    cancelButton: 'إلغاء',
    gradeDisplay: 'الصف —',
    curriculumBadge: 'منهج وزارة التربية',

    // ── Lab page ──────────────────────────────────────────
    grade: 'الصف 9',
    curr: 'منهج وزارة التربية',
    logoText: 'مختبر<span style="color:var(--accent)">عُمان</span> الافتراضي',
    greeting: 'مرحباً، ',

    experiments: ['⚗️ تفاعل حمض وقاعدة','🌡️ تجربة الغليان','🌈 كاشف الـ pH','⚡ تحليل كهربائي'],
    expAcidBase: '⚗️ تفاعل حمض وقاعدة',
    expBoiling: '🌡️ تجربة الغليان',
    expIndicator: '🌈 كاشف الـ pH',
    expElectrolysis: '⚡ تحليل كهربائي',

    stageReady: 'الحالة: جاهز',
    stageRunning: '⚗️ التفاعل جارٍ...',
    stageDone: '✅ اكتمل التفاعل',
    labelTemp: 'درجة الحرارة',
    labelConc: 'تركيز المحلول',
    btnReact: '⚗️ ابدأ التفاعل',
    btnBurner: '🔥 تشغيل الموقد',
    btnReport: '📄 تقرير المختبر',
    btnReset: '↺ إعادة ضبط',
    obsTitle: '📋 سجل الملاحظات',
    obsInit: 'المختبر جاهز — الحمض والقاعدة في الكؤوس المنفصلة',
    burnerLabel: 'موقد بنزن',

    aiName: 'مساعد العلوم الذكي',
    aiDesc: 'دليلك الشخصي في المختبر الافتراضي',
    stepLabel: 'الخطوات:',
    welcomeStep: 'الخطوة 1 من 5',
    welcomeMsg: 'مرحباً! أنا مساعدك الذكي في مختبر الكيمياء. 🧪<br><br>اليوم ستتعلم عن <strong>تفاعل التعادل</strong> بين حمض الهيدروكلوريك وهيدروكسيد الصوديوم.<br><br><strong>المعادلة الكيميائية:</strong><br>HCl + NaOH → NaCl + H₂O<br><br>هل أنت مستعد لبدء التجربة؟ 🚀',
    chatPlaceholder: 'اسأل مساعدك... مثلاً: لماذا تغير اللون؟',

    quickPrompts: [
      { label: 'ما هو التعادل؟',   q: 'ما هو تفاعل التعادل؟' },
      { label: 'ماذا يحدث؟',       q: 'ماذا يحدث عند خلط الحمض والقاعدة؟' },
      { label: 'كيف أقيس pH؟',    q: 'كيف أقيس الـ pH؟' },
      { label: 'تطبيقات عملية',    q: 'ما هي تطبيقات تفاعل التعادل في الحياة؟' }
    ],

    chatToggleHide: 'إخفاء المساعد',
    chatToggleShow: 'إظهار المساعد',
    fabLabel: 'المساعد',

    modalTitle: '📄 تقرير المختبر الافتراضي',
    repSec0: '📌 عنوان التجربة',
    repSec1: '🎯 الهدف',
    repSec2: '🧪 المواد والأدوات',
    repSec3: '📊 الملاحظات والنتائج',
    repSec4: '💡 الاستنتاج',
    repSec5: '⚠️ تدابير السلامة',
    repSec: ['📌 عنوان التجربة','🎯 الهدف','🧪 المواد والأدوات','📊 الملاحظات والنتائج','💡 الاستنتاج','⚠️ تدابير السلامة'],
    repTitleVal: 'تفاعل التعادل بين حمض الهيدروكلوريك وهيدروكسيد الصوديوم',
    repGoalVal: 'دراسة تفاعل التعادل وملاحظة تغير الخصائص الكيميائية للمواد',
    repMatsVal: 'حمض الهيدروكلوريك (HCl) · هيدروكسيد الصوديوم (NaOH) · كؤوس زجاجية · موقد بنزن · ميزان حرارة · ورق تباين',
    repSafetyVal: 'ارتداء النظارات الواقية · القفازات · تهوية جيدة',
    repNoObs: 'لم تُسجَّل ملاحظات — يرجى إجراء التجربة أولاً',
    repConclusionVal: 'تأكد تفاعل التعادل بين HCl و NaOH. المنتج: NaCl + H₂O. التفاعل طارد للحرارة.',
    modalClose: '✅ إغلاق التقرير',

    notifReactDone: '⚗️ التفاعل اكتمل بنجاح!',
    notifReset: '↺ تم إعادة ضبط المختبر',
    notifBurnerOn: '🔥 الموقد يعمل',
    notifBurnerOff: 'موقد بنزن مُطفأ',
    notifResetFirst: 'أعد ضبط المختبر أولاً',
    notifChatHidden: '💬 المساعد مخفي',
    notifChatVisible: '💬 المساعد ظاهر',
    notifTTSOn: '🔊 قراءة النص مفعّلة',
    notifTTSOff: '🔊 قراءة النص معطّلة',
    notifHCOn: '🌓 تباين عالٍ مفعّل',
    notifHCOff: '🌓 تباين عالٍ معطّل',
    notifLFOn: '🔡 خط كبير مفعّل',
    notifLFOff: '🔡 خط كبير معطّل',
    notifRMOn: '🎞️ تقليل الحركة',
    notifRMOff: '🎞️ حركة عادية',

    obs1: 'بدأ خلط الحمض والقاعدة — لوحظ تفاعل مباشر',
    obs2: 'تغير اللون من الأحمر/الأزرق إلى الأخضر — محلول متعادل',
    obs3: 'درجة الحرارة ارتفعت قليلاً — تفاعل طارد للحرارة',
    obsBurner: 'تشغيل موقد بنزن — بدء تسخين المحلول',
    obsBoiling: 'وصلت درجة الحرارة إلى 100°C — بدأ الغليان',

    reactionMsg: '<strong>رائع! 🎉</strong> لاحظت تغير اللون — هذا يؤكد اكتمال التفاعل!<br><br><strong>ما الذي حدث؟</strong><br>أيونات H⁺ من الحمض اتحدت مع OH⁻ من القاعدة لتكوين الماء H₂O والملح NaCl.<br>ارتفاع الحرارة يؤكد أن التفاعل <strong>طارد للحرارة</strong> 🌡️',

    tubeLabels: ['حمضي جداً - pH 1','حمضي - pH 5','متعادل - pH 7','قاعدي - pH 10'],
    tubePrefix: 'أنبوب',
    tubeAsk: 'لماذا لون الأنبوب',

    beakerA: 'حمض HCl<br>100 مل',
    beakerB: 'قاعدة NaOH<br>100 مل',
    beakerResult: 'ناتج التفاعل',

    expConfigs: {
      'acid-base':    { a: 'حمض HCl',        b: 'قاعدة NaOH',      ml: 'مل' },
      'boiling':      { a: 'ماء مقطر',        b: 'محلول ملحي',       ml: 'مل' },
      'indicator':    { a: 'كاشف عالمي',      b: 'محلول مجهول',      ml: 'مل' },
      'electrolysis': { a: 'ماء + H₂SO₄',    b: 'قطب موجب',         ml: 'مل' }
    },

    expUserPrefix: 'أريد إجراء تجربة:',
    expAskPrefix: 'شرح مختصر عن تجربة',
    expAskSuffix: 'للصف التاسع في سلطنة عمان',

    aiSystemPrompt: `أنت مساعد علوم ذكي لطلاب المرحلة الإعدادية والثانوية في سلطنة عُمان.
تشرح الكيمياء والفيزياء والأحياء بطريقة بسيطة وممتعة باللغة العربية.
تتحدث مع طلاب الصف التاسع. تُضمّن معادلات كيميائية عند الحاجة.
ردودك قصيرة ومركزة (3-5 جمل) وودية.`,

    aiError: 'عذراً، حدث خطأ في الاتصال. تحقق من الإنترنت وأعد المحاولة.',
    aiNoAnswer: 'عذراً، لا يمكنني الإجابة الآن.',
    voiceListening: '🎤 جارٍ الاستماع...',
    voiceNotSupported: 'المتصفح لا يدعم الإدخال الصوتي',
    ttsReading: 'جارٍ القراءة...',
    ttsNotSupported: 'المتصفح لا يدعم قراءة النص',
    langSwitched: '🌐 تم التبديل إلى العربية',
    switchedMsg: '🌐 تم التبديل إلى العربية! كيف يمكنني مساعدتك؟',
    logoutConfirm: 'هل تريد تسجيل الخروج؟',
  },
};

// Also expose as T for any legacy references (safe alias, no duplication)
window.T = window.translations;

const LANG_STORAGE_KEY = 'stemlab_lang';

function getPreferredLanguage() {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === 'en' || stored === 'ar') return stored;
  return 'ar';
}

function setPreferredLanguage(lang) {
  localStorage.setItem(LANG_STORAGE_KEY, lang);
}

function applyLanguage(lang) {
  const dict = window.translations[lang] || window.translations.ar;
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Update language toggle buttons if present
  const btnAr = document.getElementById('btnAr');
  const btnEn = document.getElementById('btnEn');
  if (btnAr && btnEn) {
    btnAr.classList.toggle('active', lang === 'ar');
    btnEn.classList.toggle('active', lang === 'en');
    btnAr.setAttribute('aria-pressed', String(lang === 'ar'));
    btnEn.setAttribute('aria-pressed', String(lang === 'en'));
  }

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = dict[key];
    if (value === undefined || value === null) return;
    // Use innerHTML for keys that contain HTML markup
    if (key === 'authLogo' || key === 'appTitle' || key.startsWith('beaker') || key.startsWith('exp')) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });

  // Update placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const value = dict[key];
    if (value && 'placeholder' in el) el.placeholder = value;
  });

  // Update browser tab title
  const isAuthPage = !!document.getElementById('authPageRoot');
  const pageTitleKey = isAuthPage ? 'pageTitleAuth' : 'pageTitleLab';
  document.title = dict[pageTitleKey] || dict.appTitle;

  // If Lab.js is loaded, call its applyLang function too
  if (typeof window.applyLang === 'function') {
    window.applyLang(lang, false);
  }
}

function handleLanguageToggle(lang) {
  setPreferredLanguage(lang);
  applyLanguage(lang);
}

// Auto-apply on page load
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(getPreferredLanguage());
});

// Expose globally
window.applyLanguage       = applyLanguage;
window.handleLanguageToggle = handleLanguageToggle;
window.getPreferredLanguage = getPreferredLanguage;
window.setPreferredLanguage = setPreferredLanguage;
