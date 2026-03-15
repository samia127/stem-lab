// OMAN VIRTUAL STEM LAB – Minimal Auth Backend with OTP Email
// ------------------------------------------------------------
// Provides:
//   POST /api/auth/register     – create pending user + send OTP
//   POST /api/auth/verify-otp   – verify OTP and activate user
//   POST /api/auth/resend-otp   – resend OTP with new code
//   POST /api/auth/login        – email/password login for active users
//
// Storage: in‑memory arrays (suitable for dev/demo). Replace with a real DB in production.

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const nodemailer = require('nodemailer');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Serve static frontend files from project root
app.use(express.static(__dirname));

// In‑memory "database"
const pendingUsers = new Map(); // email -> { ... , otp, otpExpiresAt }
const users        = new Map(); // email -> { id, name, email, passwordHash, school, grade, role, createdAt }

// Nodemailer transport (optional)
let mailTransport = null;
let emailEnabled  = false;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: !!process.env.SMTP_SECURE && process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  emailEnabled = true;
  console.log('[mail] SMTP transport initialised');
} else {
  console.log('[mail] No SMTP configuration found – OTP codes will be logged to console only.');
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(to, otp) {
  const expiresMinutes = 15;
  const subject = 'Your STEM Lab Oman verification code';
  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; background:#0f1528; color:#e8eef8;">
      <h2 style="color:#00d4ff;margin-bottom:8px;">STEM Labs Oman</h2>
      <p style="margin:0 0 16px 0;">Use the following verification code to complete your registration:</p>
      <div style="font-size:32px;letter-spacing:8px;font-weight:700;color:#00ff88;margin:16px 0;text-align:center;">
        ${otp}
      </div>
      <p style="margin:8px 0 0 0;font-size:13px;color:#6b7fa3;">
        This code expires in <strong>${expiresMinutes} minutes</strong>. If you did not request this, you can ignore this email.
      </p>
    </div>
  `;

  if (!emailEnabled) {
    console.log('──────────────── OTP VERIFICATION CODE ────────────────');
    console.log(`Email: ${to}`);
    console.log(`OTP  : ${otp}`);
    console.log('NOTE : Configure SMTP_* env vars to send real emails.');
    console.log('────────────────────────────────────────────────────────');
    return;
  }

  await mailTransport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

// Helpers
function normaliseEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, school, grade, role } = req.body || {};
    if (!name || !email || !password || !school || !grade || !role) {
      return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
    }

    const normEmail = normaliseEmail(email);
    if (users.has(normEmail)) {
      return res.status(409).json({ ok: false, error: 'EMAIL_EXISTS' });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    const otp = generateOtp();
    const otpExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    pendingUsers.set(normEmail, {
      name: String(name).trim(),
      email: normEmail,
      school: String(school).trim(),
      grade: String(grade),
      role: String(role),
      passwordHash,
      otp,
      otpExpiresAt,
      createdAt: new Date().toISOString(),
    });

    await sendOtpEmail(normEmail, otp);

    return res.json({ ok: true, message: 'PENDING_CREATED' });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const normEmail = normaliseEmail(email);
    const record = pendingUsers.get(normEmail);
    if (!record) {
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }
    if (record.otpExpiresAt < Date.now()) {
      pendingUsers.delete(normEmail);
      return res.status(400).json({ ok: false, error: 'OTP_EXPIRED' });
    }
    if (String(record.otp) !== String(otp)) {
      return res.status(400).json({ ok: false, error: 'OTP_INVALID' });
    }

    const user = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: record.name,
      email: record.email,
      school: record.school,
      grade: record.grade,
      role: record.role,
      passwordHash: record.passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.set(normEmail, user);
    pendingUsers.delete(normEmail);

    return res.json({
      ok: true,
      message: 'VERIFIED',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        school: user.school,
        grade: user.grade,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('verify-otp error', err);
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    const normEmail = normaliseEmail(email);
    const record = pendingUsers.get(normEmail);
    if (!record) {
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }
    const otp = generateOtp();
    record.otp = otp;
    record.otpExpiresAt = Date.now() + 15 * 60 * 1000;
    pendingUsers.set(normEmail, record);

    await sendOtpEmail(normEmail, otp);

    return res.json({ ok: true, message: 'OTP_RESENT' });
  } catch (err) {
    console.error('resend-otp error', err);
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normEmail = normaliseEmail(email);
    const user = users.get(normEmail);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }
    const match = await bcrypt.compare(String(password), user.passwordHash);
    if (!match) {
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }

    // For simplicity we return user details and let frontend manage session (no JWT yet)
    return res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        school: user.school,
        grade: user.grade,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// Update user grade (simple endpoint - in production would require auth middleware)
app.patch('/api/user/grade', async (req, res) => {
  try {
    const { grade } = req.body || {};
    const { email } = req.query || {};
    
    // In production, get email from JWT/session instead of query param
    // For now, we'll accept email in body for simplicity
    const userEmail = req.body.email || email;
    if (!userEmail || !grade) {
      return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
    }
    
    const normEmail = normaliseEmail(userEmail);
    const user = users.get(normEmail);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });
    }
    
    // Validate grade
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 6 || gradeNum > 12) {
      return res.status(400).json({ ok: false, error: 'INVALID_GRADE' });
    }
    
    // Update grade
    user.grade = String(gradeNum);
    users.set(normEmail, user);
    
    return res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        school: user.school,
        grade: user.grade,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('update grade error', err);
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// Fallback: send auth.html as default entry if hitting "/"
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'Auth.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { system, messages, max_tokens } = req.body || {};
    if (!messages) return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });

    // Combine system prompt + user message for Gemini
    const userMsg = messages[messages.length - 1].content;
    const prompt = system ? `${system}\n\n${userMsg}` : userMsg;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: max_tokens || 1000 }
        })
      }
    );

    const data = await response.json();

    // Reformat Gemini response to match Anthropic's shape so Lab.js needs no changes
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.json({ content: [{ type: 'text', text }] });

  } catch (err) {
    console.error('chat error', err);
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

app.listen(PORT, () => {
  console.log(`STEM Lab auth server running at http://localhost:${PORT}`);
});

