/* ============================================================
   OMAN VIRTUAL STEM LAB — Auth.js
   Login + multi-step Register with email OTP verification
   - Client-side validation
   - Backend API integration (/api/auth/*)
   - ARIA-friendly error messaging
   ============================================================ */
"use strict";

// ── Session helpers ─────────────────────────────────────────
const setSession = (u) =>
  sessionStorage.setItem(
    "stemlab_user",
    JSON.stringify({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      school: u.school,
      grade: u.grade,
    })
  );

const getSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem("stemlab_user"));
  } catch {
    return null;
  }
};

if (getSession()) window.location.href = "index.html";

// ── DOM refs ────────────────────────────────────────────────
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const formLogin = document.getElementById("formLogin");
const registerFlow = document.getElementById("registerFlow");
const formRegister = document.getElementById("formRegister");
const formVerifyOtp = document.getElementById("formVerifyOtp");
const liveRegion = document.getElementById("liveRegion");

let lastRegisteredEmail = null;
let otpCooldownTimerId = null;
let otpCooldownEnd = null;

// ── Tab switching ──────────────────────────────────────────
function showTab(tab) {
  const isLogin = tab === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  tabLogin.setAttribute("aria-selected", String(isLogin));
  tabRegister.setAttribute("aria-selected", String(!isLogin));
  formLogin.hidden = !isLogin;

  if (registerFlow) {
    registerFlow.hidden = isLogin;
  }
  if (!isLogin && formRegister && formVerifyOtp) {
    formRegister.hidden = false;
    formVerifyOtp.hidden = true;
  }

  clearErrors();
  const container = isLogin ? formLogin : registerFlow || formRegister;
  const firstInput = container ? container.querySelector(".form-input") : null;
  if (firstInput) firstInput.focus();
}

if (tabLogin && tabRegister) {
  tabLogin.addEventListener("click", () => showTab("login"));
  tabRegister.addEventListener("click", () => showTab("register"));
}

// ── Screen reader announcements ────────────────────────────
function announce(msg, urgency = "polite") {
  if (!liveRegion) return;
  liveRegion.setAttribute("aria-live", urgency);
  liveRegion.textContent = msg;
  setTimeout(() => {
    liveRegion.textContent = "";
  }, 3500);
}

// ── Error helpers ──────────────────────────────────────────
function showFieldError(input, msg) {
  if (!input) return;
  const el = document.getElementById(input.id + "Error");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("visible");
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", el.id);
}

function clearFieldError(input) {
  if (!input) return;
  const el = document.getElementById(input.id + "Error");
  if (el) {
    el.textContent = "";
    el.classList.remove("visible");
  }
  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-describedby");
}

function showFormError(form, msg, isSuccess = false) {
  if (!form) return;
  const el = form.querySelector(".auth-error");
  if (!el) return;
  el.textContent = (isSuccess ? "✅ " : "⚠ ") + msg;
  el.style.background = isSuccess
    ? "rgba(0,255,136,0.1)"
    : "rgba(255,59,107,0.1)";
  el.style.borderColor = isSuccess
    ? "rgba(0,255,136,0.3)"
    : "rgba(255,59,107,0.3)";
  el.style.color = isSuccess ? "var(--green)" : "var(--red)";
  el.classList.add("visible");
  announce(msg, isSuccess ? "polite" : "assertive");
}

function clearErrors() {
  document
    .querySelectorAll(".auth-error")
    .forEach((e) => e.classList.remove("visible"));
  document.querySelectorAll(".field-error").forEach((e) => {
    e.textContent = "";
    e.classList.remove("visible");
  });
  document.querySelectorAll("[aria-invalid]").forEach((e) => {
    e.removeAttribute("aria-invalid");
    e.removeAttribute("aria-describedby");
  });
}

// ── Password strength meter ────────────────────────────────
const strengthMeta = [
  { pct: "15%", color: "#ff3b6b", ar: "ضعيف جداً", en: "Very weak" },
  { pct: "35%", color: "#ff6b2b", ar: "ضعيف", en: "Weak" },
  { pct: "58%", color: "#ffd600", ar: "متوسط", en: "Fair" },
  { pct: "78%", color: "#00d4ff", ar: "جيد", en: "Good" },
  { pct: "100%", color: "#00ff88", ar: "قوي", en: "Strong" },
];
const pwdInput = document.getElementById("regPassword");
const strengthFill = document.getElementById("strengthFill");
const strengthLbl = document.getElementById("strengthLabel");

if (pwdInput && strengthFill && strengthLbl) {
  pwdInput.addEventListener("input", () => {
    const p = pwdInput.value;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const m = strengthMeta[Math.max(0, score - 1)];
    strengthFill.style.width = p ? m.pct : "0%";
    strengthFill.style.background = m.color;
    const langCode =
      document.documentElement.lang === "en" ? "en" : "ar";
    strengthLbl.textContent = p ? m[langCode] : "";
  });
}

// ── Toggle password visibility ─────────────────────────────
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", () => {
    const inp = document.getElementById(btn.dataset.target);
    if (!inp) return;
    const show = inp.type === "password";
    inp.type = show ? "text" : "password";
    btn.textContent = show ? "🙈" : "👁";
    const langCode =
      document.documentElement.lang === "en" ? "en" : "ar";
    btn.setAttribute(
      "aria-label",
      show
        ? langCode === "en"
          ? "Hide password"
          : "إخفاء كلمة المرور"
        : langCode === "en"
        ? "Show password"
        : "إظهار كلمة المرور"
    );
  });
});

// ── Validation helpers ─────────────────────────────────────
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isValidPwd = (p) => p.length >= 8;
const lang = () =>
  document.documentElement.lang === "en" ? "en" : "ar";
const t = (ar, en) => (lang() === "en" ? en : ar);

// ── OTP cooldown timer ─────────────────────────────────────
function startOtpCooldown(seconds) {
  const countdownEl = document.getElementById("otpCountdown");
  if (!countdownEl || !window.translations) return;
  otpCooldownEnd = Date.now() + seconds * 1000;
  const dict =
    window.translations[lang()] || window.translations.ar;

  function tick() {
    const remainingMs = otpCooldownEnd - Date.now();
    if (remainingMs <= 0) {
      countdownEl.textContent = "";
      const btn = document.getElementById("btnResendOtp");
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("disabled");
      }
      otpCooldownTimerId = null;
      return;
    }
    const sec = Math.ceil(remainingMs / 1000);
    const template = dict.otpCountdown || "{seconds}s";
    countdownEl.textContent = template.replace("{seconds}", sec);
  }

  const btn = document.getElementById("btnResendOtp");
  if (btn) {
    btn.disabled = true;
    btn.classList.add("disabled");
  }
  tick();
  if (otpCooldownTimerId) clearInterval(otpCooldownTimerId);
  otpCooldownTimerId = setInterval(tick, 1000);
}

// ── REGISTER STEP 1: create pending user ───────────────────
if (formRegister) {
  formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    const name = document.getElementById("regName");
    const email = document.getElementById("regEmail");
    const school = document.getElementById("regSchool");
    const grade = document.getElementById("regGrade");
    const role = document.getElementById("regRole");
    const pwd = document.getElementById("regPassword");
    const cpwd = document.getElementById("regConfirmPassword");
    const btn = formRegister.querySelector(".auth-submit");
    const spin = btn.querySelector(".spinner");

    let ok = true;
    if (!name.value.trim() || name.value.trim().length < 2) {
      showFieldError(
        name,
        t(
          "الاسم مطلوب (حرفان على الأقل)",
          "Name required (min 2 chars)"
        )
      );
      ok = false;
    }
    if (!isValidEmail(email.value.trim())) {
      showFieldError(
        email,
        t("بريد إلكتروني غير صالح", "Invalid email address")
      );
      ok = false;
    }
    if (!school.value.trim()) {
      showFieldError(
        school,
        t("اسم المدرسة مطلوب", "School name required")
      );
      ok = false;
    }
    if (!grade.value) {
      showFieldError(
        grade,
        t("الرجاء اختيار الصف", "Please select a grade")
      );
      ok = false;
    }
    if (!isValidPwd(pwd.value)) {
      showFieldError(
        pwd,
        t("8 أحرف على الأقل", "Minimum 8 characters")
      );
      ok = false;
    }
    if (pwd.value !== cpwd.value) {
      showFieldError(
        cpwd,
        t(
          "كلمتا المرور غير متطابقتين",
          "Passwords do not match"
        )
      );
      ok = false;
    }
    if (!ok) return;

    btn.disabled = true;
    spin.classList.add("visible");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          school: school.value.trim(),
          grade: grade.value,
          role: role.value,
          password: pwd.value,
        }),
      });
      const data = await res.json();
      btn.disabled = false;
      spin.classList.remove("visible");

      if (!res.ok || !data.ok) {
        if (data.error === "EMAIL_EXISTS") {
          showFormError(
            formRegister,
            t(
              "هذا البريد مسجّل بالفعل",
              "Email already registered"
            )
          );
        } else {
          showFormError(
            formRegister,
            t(
              "حدث خطأ أثناء التسجيل. حاول مرة أخرى.",
              "Registration failed. Please try again."
            )
          );
        }
        return;
      }

      lastRegisteredEmail = email.value.trim();
      if (registerFlow && formVerifyOtp) {
        formRegister.hidden = true;
        formVerifyOtp.hidden = false;
      }
      startOtpCooldown(60);
      const otpInput = document.getElementById("otpCode");
      if (otpInput) otpInput.focus();
      if (formVerifyOtp) {
        showFormError(
          formVerifyOtp,
          t(
            "تم إرسال رمز التحقق إلى بريدك الإلكتروني.",
            "Verification code sent to your email."
          ),
          true
        );
      }
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      spin.classList.remove("visible");
      showFormError(
        formRegister,
        t("تعذر الاتصال بالخادم.", "Could not reach server.")
      );
    }
  });
}

// ── REGISTER STEP 2: verify OTP ────────────────────────────
if (formVerifyOtp) {
  formVerifyOtp.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    const codeInput = document.getElementById("otpCode");
    const btn = formVerifyOtp.querySelector(".auth-submit");
    const spin = btn.querySelector(".spinner");

    if (
      !codeInput.value.trim() ||
      codeInput.value.trim().length !== 6
    ) {
      showFieldError(
        codeInput,
        t(
          "الرجاء إدخال الرمز المكوّن من 6 أرقام",
          "Please enter the 6‑digit code"
        )
      );
      return;
    }
    if (!lastRegisteredEmail) {
      showFormError(
        formVerifyOtp,
        t(
          "انتهت جلسة التحقق. الرجاء التسجيل من جديد.",
          "Verification session expired. Please register again."
        )
      );
      return;
    }

    btn.disabled = true;
    spin.classList.add("visible");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: lastRegisteredEmail,
          otp: codeInput.value.trim(),
        }),
      });
      const data = await res.json();
      btn.disabled = false;
      spin.classList.remove("visible");

      if (!res.ok || !data.ok) {
        if (data.error === "OTP_EXPIRED") {
          showFormError(
            formVerifyOtp,
            t(
              "انتهت صلاحية الرمز. الرجاء طلب رمز جديد.",
              "Code expired. Please request a new one."
            )
          );
        } else if (data.error === "OTP_INVALID") {
          showFieldError(
            codeInput,
            t(
              "الرمز غير صحيح. حاول مرة أخرى.",
              "Incorrect code. Please try again."
            )
          );
        } else {
          showFormError(
            formVerifyOtp,
            t(
              "تعذر التحقق من الرمز.",
              "Could not verify code."
            )
          );
        }
        return;
      }

      showFormError(
        formVerifyOtp,
        t(
          "تم تفعيل الحساب بنجاح! يمكنك تسجيل الدخول الآن.",
          "Account verified! You can log in now."
        ),
        true
      );
      announce(
        t(
          "تم تفعيل الحساب. سيتم نقلك إلى صفحة تسجيل الدخول.",
          "Account verified. Redirecting to login."
        ),
        "assertive"
      );

      setTimeout(() => {
        showTab("login");
        if (formLogin) {
          showFormError(
            formLogin,
            t(
              "تم إنشاء الحساب! سجّل دخولك الآن.",
              "Account created! Please log in."
            ),
            true
          );
        }
      }, 1200);
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      spin.classList.remove("visible");
      showFormError(
        formVerifyOtp,
        t("تعذر الاتصال بالخادم.", "Could not reach server.")
      );
    }
  });
}

// Resend OTP with 60s cooldown
const resendBtn = document.getElementById("btnResendOtp");
if (resendBtn) {
  resendBtn.addEventListener("click", async () => {
    if (!lastRegisteredEmail) {
      showFormError(
        formVerifyOtp,
        t(
          "انتهت جلسة التحقق. الرجاء التسجيل من جديد.",
          "Verification session expired. Please register again."
        )
      );
      return;
    }
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lastRegisteredEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showFormError(
          formVerifyOtp,
          t("تعذر إرسال رمز جديد.", "Could not resend code.")
        );
        return;
      }
      startOtpCooldown(60);
    } catch (err) {
      console.error(err);
      showFormError(
        formVerifyOtp,
        t("تعذر الاتصال بالخادم.", "Could not reach server.")
      );
    }
  });
}

// ── LOGIN ──────────────────────────────────────────────────
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    const email = document.getElementById("loginEmail");
    const pwd = document.getElementById("loginPassword");
    const btn = formLogin.querySelector(".auth-submit");
    const spin = btn.querySelector(".spinner");

    let ok = true;
    if (!isValidEmail(email.value.trim())) {
      showFieldError(
        email,
        t("بريد غير صالح", "Invalid email")
      );
      ok = false;
    }
    if (!pwd.value) {
      showFieldError(
        pwd,
        t("كلمة المرور مطلوبة", "Password required")
      );
      ok = false;
    }
    if (!ok) return;

    btn.disabled = true;
    spin.classList.add("visible");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.value.trim(),
          password: pwd.value,
        }),
      });
      const data = await res.json();
      btn.disabled = false;
      spin.classList.remove("visible");

      if (!res.ok || !data.ok || !data.user) {
        showFormError(
          formLogin,
          t(
            "البريد أو كلمة المرور غير صحيحة",
            "Incorrect email or password"
          )
        );
        return;
      }

      setSession(data.user);
      announce(
        t(
          "تم تسجيل الدخول بنجاح!",
          "Login successful!"
        ),
        "assertive"
      );
      setTimeout(() => {
        window.location.href = "index.html";
      }, 300);
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      spin.classList.remove("visible");
      showFormError(
        formLogin,
        t("تعذر الاتصال بالخادم.", "Could not reach server.")
      );
    }
  });
}

// ── Live field validation on blur ─────────────────────────
document.querySelectorAll(".form-input").forEach((inp) => {
  inp.addEventListener("input", () => clearFieldError(inp));
  inp.addEventListener("blur", () => {
    if (!inp.value) return;
    if (
      inp.type === "email" &&
      !isValidEmail(inp.value.trim())
    ) {
      showFieldError(
        inp,
        t("بريد غير صالح", "Invalid email")
      );
    }
  });
});

