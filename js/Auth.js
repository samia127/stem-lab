/* ============================================================
   OMAN VIRTUAL STEM LAB — auth.js
   Login & Register logic
   - Client-side SHA-256 pre-hash
   - Parameterised query pattern (mirrored server-side)
   - Full validation + ARIA accessibility
   ============================================================ */
"use strict";

// ── SHA-256 via Web Crypto API (no libraries needed) ───────
async function sha256(message) {
  const msgBuffer  = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Simulated DB (localStorage) ────────────────────────────
// In production replace with fetch() to:
//   POST /api/auth/register  → bcrypt.hash(pwd,12) + db.query('INSERT INTO users VALUES($1,$2,$3,$4)',[...])
//   POST /api/auth/login     → db.query('SELECT * FROM users WHERE email=$1',[email]) + bcrypt.compare()
const DB_KEY = 'stemlab_users';
const getUsers   = () => { try { return JSON.parse(localStorage.getItem(DB_KEY))||[]; } catch { return []; } };
const saveUsers  = u => localStorage.setItem(DB_KEY, JSON.stringify(u));
const findByEmail= email => getUsers().find(u => u.email === email) || null; // mirrors WHERE email=$1
const insertUser = user  => { const all=getUsers(); all.push(user); saveUsers(all); };

// ── Session ────────────────────────────────────────────────
const setSession   = u => sessionStorage.setItem('stemlab_user', JSON.stringify({id:u.id,name:u.name,email:u.email,role:u.role}));
const getSession   = () => { try { return JSON.parse(sessionStorage.getItem('stemlab_user')); } catch { return null; } };

if (getSession()) window.location.href = 'index.html';

// ── DOM ────────────────────────────────────────────────────
const tabLogin    = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const formLogin   = document.getElementById('formLogin');
const formRegister= document.getElementById('formRegister');
const liveRegion  = document.getElementById('liveRegion');

// ── Tab switching ──────────────────────────────────────────
function showTab(tab) {
  const isLogin = tab === 'login';
  tabLogin.classList.toggle('active', isLogin);
  tabRegister.classList.toggle('active', !isLogin);
  tabLogin.setAttribute('aria-selected', String(isLogin));
  tabRegister.setAttribute('aria-selected', String(!isLogin));
  formLogin.hidden    = !isLogin;
  formRegister.hidden =  isLogin;
  clearErrors();
  const firstInput = (isLogin ? formLogin : formRegister).querySelector('.form-input');
  if (firstInput) firstInput.focus();
}
tabLogin.addEventListener('click',    () => showTab('login'));
tabRegister.addEventListener('click', () => showTab('register'));

// ── Announce to screen readers ─────────────────────────────
function announce(msg, urgency='polite') {
  liveRegion.setAttribute('aria-live', urgency);
  liveRegion.textContent = msg;
  setTimeout(() => { liveRegion.textContent = ''; }, 3500);
}

// ── Error display ──────────────────────────────────────────
function showFieldError(input, msg) {
  const el = document.getElementById(input.id + 'Error');
  if (!el) return;
  el.textContent = msg; el.classList.add('visible');
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', el.id);
}
function clearFieldError(input) {
  const el = document.getElementById(input.id + 'Error');
  if (el) { el.textContent=''; el.classList.remove('visible'); }
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-describedby');
}
function showFormError(form, msg, isSuccess=false) {
  const el = form.querySelector('.auth-error');
  if (!el) return;
  el.textContent = (isSuccess ? '✅ ' : '⚠ ') + msg;
  el.style.background   = isSuccess ? 'rgba(0,255,136,0.1)'  : 'rgba(255,59,107,0.1)';
  el.style.borderColor  = isSuccess ? 'rgba(0,255,136,0.3)'  : 'rgba(255,59,107,0.3)';
  el.style.color        = isSuccess ? 'var(--green)'         : 'var(--red)';
  el.classList.add('visible');
  announce(msg, isSuccess ? 'polite' : 'assertive');
}
function clearErrors() {
  document.querySelectorAll('.auth-error').forEach(e => e.classList.remove('visible'));
  document.querySelectorAll('.field-error').forEach(e => { e.textContent=''; e.classList.remove('visible'); });
  document.querySelectorAll('[aria-invalid]').forEach(e => { e.removeAttribute('aria-invalid'); e.removeAttribute('aria-describedby'); });
}

// ── Password strength meter ────────────────────────────────
const strengthMeta = [
  { pct:'15%',  color:'#ff3b6b', ar:'ضعيف جداً', en:'Very weak'  },
  { pct:'35%',  color:'#ff6b2b', ar:'ضعيف',      en:'Weak'       },
  { pct:'58%',  color:'#ffd600', ar:'متوسط',      en:'Fair'       },
  { pct:'78%',  color:'#00d4ff', ar:'جيد',        en:'Good'       },
  { pct:'100%', color:'#00ff88', ar:'قوي',        en:'Strong'     },
];
const pwdInput     = document.getElementById('regPassword');
const strengthFill = document.getElementById('strengthFill');
const strengthLbl  = document.getElementById('strengthLabel');

if (pwdInput) {
  pwdInput.addEventListener('input', () => {
    const p = pwdInput.value;
    let score = 0;
    if (p.length >= 8)  score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const m = strengthMeta[Math.max(0, score-1)];
    strengthFill.style.width      = p ? m.pct   : '0%';
    strengthFill.style.background = m.color;
    const lang = document.documentElement.lang;
    strengthLbl.textContent = p ? m[lang==='en'?'en':'ar'] : '';
  });
}

// ── Toggle password visibility ─────────────────────────────
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const inp  = document.getElementById(btn.dataset.target);
    if (!inp) return;
    const show = inp.type === 'password';
    inp.type   = show ? 'text' : 'password';
    btn.textContent = show ? '🙈' : '👁';
    const lang = document.documentElement.lang;
    btn.setAttribute('aria-label', show
      ? (lang==='en' ? 'Hide password' : 'إخفاء كلمة المرور')
      : (lang==='en' ? 'Show password' : 'إظهار كلمة المرور'));
  });
});

// ── Validation helpers ─────────────────────────────────────
const isValidEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isValidPwd   = p => p.length >= 8;
const lang = () => document.documentElement.lang === 'en' ? 'en' : 'ar';
const t = (ar, en) => lang()==='en' ? en : ar;

// ── REGISTER ───────────────────────────────────────────────
if (formRegister) {
  formRegister.addEventListener('submit', async e => {
    e.preventDefault(); clearErrors();
    const name  = document.getElementById('regName');
    const email = document.getElementById('regEmail');
    const role  = document.getElementById('regRole');
    const pwd   = document.getElementById('regPassword');
    const cpwd  = document.getElementById('regConfirmPassword');
    const btn   = formRegister.querySelector('.auth-submit');
    const spin  = btn.querySelector('.spinner');

    let ok = true;
    if (!name.value.trim() || name.value.trim().length < 2) { showFieldError(name, t('الاسم مطلوب (حرفان على الأقل)','Name required (min 2 chars)')); ok=false; }
    if (!isValidEmail(email.value.trim())) { showFieldError(email, t('بريد إلكتروني غير صالح','Invalid email address')); ok=false; }
    if (!isValidPwd(pwd.value)) { showFieldError(pwd, t('8 أحرف على الأقل','Minimum 8 characters')); ok=false; }
    if (pwd.value !== cpwd.value) { showFieldError(cpwd, t('كلمتا المرور غير متطابقتين','Passwords do not match')); ok=false; }
    if (!ok) return;

    if (findByEmail(email.value.trim().toLowerCase())) {
      showFormError(formRegister, t('هذا البريد مسجّل بالفعل','Email already registered'));
      return;
    }

    btn.disabled = true; spin.classList.add('visible');
    const passwordHash = await sha256(pwd.value); // client pre-hash; server would bcrypt this further
    insertUser({ id: crypto.randomUUID(), name:name.value.trim(), email:email.value.trim().toLowerCase(), role:role.value, passwordHash, createdAt: new Date().toISOString() });
    await new Promise(r => setTimeout(r, 700));
    btn.disabled = false; spin.classList.remove('visible');

    showTab('login');
    showFormError(formLogin, t('تم إنشاء الحساب! سجّل دخولك الآن.','Account created! Please log in.'), true);
  });
}

// ── LOGIN ──────────────────────────────────────────────────
if (formLogin) {
  formLogin.addEventListener('submit', async e => {
    e.preventDefault(); clearErrors();
    const email = document.getElementById('loginEmail');
    const pwd   = document.getElementById('loginPassword');
    const btn   = formLogin.querySelector('.auth-submit');
    const spin  = btn.querySelector('.spinner');

    let ok = true;
    if (!isValidEmail(email.value.trim())) { showFieldError(email, t('بريد غير صالح','Invalid email')); ok=false; }
    if (!pwd.value) { showFieldError(pwd, t('كلمة المرور مطلوبة','Password required')); ok=false; }
    if (!ok) return;

    btn.disabled = true; spin.classList.add('visible');
    const passwordHash = await sha256(pwd.value);
    const user = findByEmail(email.value.trim().toLowerCase()); // parameterised lookup
    await new Promise(r => setTimeout(r, 600));
    btn.disabled = false; spin.classList.remove('visible');

    if (!user || user.passwordHash !== passwordHash) {
      showFormError(formLogin, t('البريد أو كلمة المرور غير صحيحة','Incorrect email or password'));
      return;
    }

    setSession(user);
    announce(t('تم تسجيل الدخول بنجاح!','Login successful!'), 'assertive');
    setTimeout(() => { window.location.href = 'index.html'; }, 300);
  });
}

// ── Live field validation on blur ─────────────────────────
document.querySelectorAll('.form-input').forEach(inp => {
  inp.addEventListener('input', () => clearFieldError(inp));
  inp.addEventListener('blur',  () => {
    if (!inp.value) return;
    if (inp.type==='email' && !isValidEmail(inp.value.trim())) showFieldError(inp, t('بريد غير صالح','Invalid email'));
  });
});