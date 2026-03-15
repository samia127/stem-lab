# STEM Labs Oman — Technical Details

Deep-dive technical reference for the STEM Labs Oman virtual lab platform.

---

## 1. System Architecture

```
┌──────────────────────────────┐
│          Browser             │
│  (Auth.html / Index.html)    │
│                              │
│  - Auth UI (login/register)  │
│  - Virtual Lab UI            │
│  - AI chat panel             │
│  - i18n + RTL/LTR switching  │
│  - TTS & Voice Input         │
└──────────────┬───────────────┘
               │ HTTPS (JSON, static assets)
               ▼
┌──────────────────────────────┐
│        Node.js Server        │
│          (server.js)         │
│                              │
│  Express + CORS              │
│  - /api/auth/register        │
│  - /api/auth/verify-otp      │
│  - /api/auth/resend-otp      │
│  - /api/auth/login           │
│  - /api/user/grade           │
│  - /api/chat  ← AI proxy     │
│  - Serves HTML/CSS/JS files  │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌──────────────────────────────┐
│ users.json  │  │     Google Gemini API         │
│  (disk)     │  │  gemini-1.5-flash             │
│             │  │  - Receives chat prompts      │
│ Persists    │  │  - Returns experiment help    │
│ user accts  │  │  - Free tier, no credit card  │
└─────────────┘  └──────────────────────────────┘
```

**Key architectural decision — AI calls are proxied through the server.**
The browser never contacts the Gemini API directly. All AI requests go:
`browser → /api/chat → server.js → Gemini API`
This keeps the API key server-side only and avoids CORS errors.

---

## 2. Authentication Flow

End-to-end flow: **register → OTP → verify → login → session**

1. **Open Auth page** — `Auth.html` loads. `Auth.js` checks `sessionStorage.stemlab_user`; if present, redirects to `Index.html`.
2. **Registration (Step 1)** — user fills name, email, school, grade, role, password. `Auth.js` validates all fields client-side, then POSTs to `/api/auth/register`.
3. **Server creates pending user** — `server.js` normalises the email, checks for duplicates in `users.json`, hashes the password with `bcrypt` (cost 12), generates a 6-digit OTP, stores a record in the in-memory `pendingUsers` Map, and sends/logs the OTP.
4. **Email verification (Step 2)** — user enters OTP. Frontend POSTs to `/api/auth/verify-otp`. On success, server moves the record from `pendingUsers` (RAM) to `users` (RAM + disk). `users.json` is written immediately.
5. **Login** — user submits email + password. Server looks up `users`, runs `bcrypt.compare`, and returns the user object on success. Frontend writes to `sessionStorage.stemlab_user` and navigates to `Index.html`.
6. **Session in lab** — `Lab.js` reads session from `sessionStorage` on every load. If missing, redirects to `Auth.html`.

---

## 3. User Persistence — `users.json`

This is the key difference from the original in-memory-only implementation.

### Why it was changed
The original code stored users in a plain JavaScript `Map` which lived only in RAM. Every server restart (including Cursor's automatic restarts during development) wiped all registered accounts, making login impossible.

### How it works

```js
const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
  // Called once at startup — reads users.json into a Map
  const raw = fs.readFileSync(USERS_FILE, 'utf8');
  return new Map(Object.entries(JSON.parse(raw)));
}

function saveUsers() {
  // Called after every write operation (verify-otp, grade change)
  fs.writeFileSync(USERS_FILE, JSON.stringify(Object.fromEntries(users), null, 2));
}
```

- `loadUsers()` is called **once at startup** — the Map is populated from disk.
- `saveUsers()` is called **immediately after** any mutation: OTP verification (new account) and grade update.
- `pendingUsers` (OTP sessions) remain **in-memory only** — they expire in 15 minutes anyway, so persisting them adds no value.

### What's in `users.json`

```json
{
  "student@school.om": {
    "id": "1718000000000-abc123",
    "name": "Mohammed Al-Harthi",
    "email": "student@school.om",
    "school": "Al Nmoothajia School",
    "grade": "9",
    "role": "student",
    "passwordHash": "$2b$12$...",
    "createdAt": "2024-06-10T08:00:00.000Z"
  }
}
```

> `users.json` is gitignored. It must never be committed to version control as it contains password hashes.

---

## 4. AI Assistant — Google Gemini Integration

### Why Gemini instead of Claude

The original design called for the Anthropic Claude API. Gemini's `gemini-1.5-flash` model was substituted because it has a **free tier with no credit card required**, making it accessible for student/educational projects.

### Proxy architecture (`server.js`)

```js
app.post('/api/chat', async (req, res) => {
  const { system, messages, max_tokens } = req.body;
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
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Response is reshaped to match the original Anthropic format
  // so Lab.js requires zero changes
  return res.json({ content: [{ type: 'text', text }] });
});
```

### Response shape compatibility

Gemini's response format differs from Anthropic's. The server normalises the response before sending it to the browser:

| | Gemini (raw) | Returned by `/api/chat` |
|---|---|---|
| Format | `candidates[0].content.parts[0].text` | `content[0].text` |
| Shape | Gemini-specific | Anthropic-compatible |

`Lab.js` reads `data.content?.map(b => b.text).join('')` — this works unchanged because the server does the translation.

### Prompt construction (`Lab.js`)

```js
body: JSON.stringify({
  system: `${t.aiSystemPrompt}
Current lab: experiment=${state.experiment}, temp=${state.temperature}°C, reaction=${state.reactionDone ? 'complete' : 'not started'}.`,
  messages: [{ role: 'user', content: userMsg }]
})
```

The system prompt includes the student's current lab state so the AI can give contextually relevant answers.

---

## 5. Translation System (`i18n.js`)

### What changed and why

The original `i18n.js` had a **critical structural bug**: the `window.translations` object defined the `en` key twice:

```js
window.translations = {
  en: { /* auth keys */ },   // ← first definition
  ar: { /* ... */ },
  en: { /* lab keys */ },    // ← second definition — OVERWRITES the first
};
```

JavaScript silently discards the first key when duplicates exist, so `window.translations.en` only contained lab keys and none of the auth keys (`loginTab`, `authLogo`, `loginButton`, etc.). Switching to EN did nothing visible.

Additionally, a separate `const T = { ar: {...}, en: {...} }` block existed below the main object — a leftover from an earlier version — with its own duplicate set of keys.

### The fix

Both issues were resolved by **merging everything into a single, unified `window.translations` object** with one `en` block and one `ar` block, each containing all keys for both the auth page and the lab page.

A safe alias `window.T = window.translations` was added at the end so that any `|| T` fallback references in `Lab.js` continue to resolve correctly without requiring changes to that file.

### Structure

```js
window.translations = {
  en: {
    // HTML attributes
    dir: 'ltr', lang: 'en',
    // Page titles
    pageTitleAuth: '...', pageTitleLab: '...',
    // Auth page keys
    loginTab: 'Login', registerTab: 'Register', ...
    // Lab page keys
    experiments: [...], btnReact: '...', quickPrompts: [...], ...
    // AI system prompt
    aiSystemPrompt: `...`,
  },
  ar: {
    // Mirror structure in Arabic + dir: 'rtl'
  }
};

window.T = window.translations; // safe alias for Lab.js fallbacks
```

### `applyLanguage(lang)` flow

1. Reads `window.translations[lang]`
2. Sets `document.documentElement.lang` and `dir`
3. Updates all `[data-i18n]` elements with `textContent` or `innerHTML`
4. Updates `[data-i18n-placeholder]` placeholders
5. Updates `document.title`
6. Calls `window.applyLang(lang, false)` if Lab.js is loaded (lab page only)

---

## 6. Header UI Changes (`Index.html`)

### Profile dropdown removed

The original header had a floating `.profile-dropdown` div attached to the user avatar that contained "Change Grade" and "Logout" buttons. This was removed because:
- The Logout button duplicated the existing navbar logout button
- The floating card had positioning issues

### Grade badge is now interactive

The `#badgeGrade` element was changed from a plain `<div>` to a `<button>` that directly calls `openChangeGradeModal()`:

```html
<button class="badge badge-green" id="badgeGrade"
        onclick="openChangeGradeModal()"
        title="Click to change grade"
        style="cursor:pointer;border:none;...">Grade —</button>
```

Clicking the green grade badge in the header now opens the change grade modal directly. The `toggleProfileDropdown()` function in `Lab.js` was removed as it is no longer needed.

---

## 7. Database Schema (Logical)

### `pending_users` (in-memory Map only)

| Field | Type | Description |
|---|---|---|
| `email` | string (PK) | Normalised lowercase email |
| `name` | string | Full name |
| `school` | string | School name |
| `grade` | string | Grade 6–12 |
| `role` | string | `"student"` or `"teacher"` |
| `passwordHash` | string | bcrypt hash (cost 12) |
| `otp` | string | 6-digit OTP |
| `otpExpiresAt` | timestamp | `Date.now() + 15 min` |
| `createdAt` | ISO string | Creation time |

### `users` (in-memory Map + `users.json`)

| Field | Type | Description |
|---|---|---|
| `id` | string (PK) | `timestamp-randomhex` |
| `email` | string (unique) | Normalised lowercase email |
| `name` | string | Full name |
| `school` | string | School name |
| `grade` | string | Grade 6–12 |
| `role` | string | `"student"` or `"teacher"` |
| `passwordHash` | string | bcrypt hash |
| `createdAt` | ISO string | Activation time |

---

## 8. Deployment Notes

### Development
- Users stored in `users.json` next to `server.js` — persists across restarts.
- OTP codes logged to console if SMTP is not configured.
- AI calls proxied through `/api/chat` using `GEMINI_API_KEY` from `.env`.
- Recommended browser: Chrome (best Web Speech API support). Firefox works for all non-voice features.

### Production (Omantel Cloud / Linux VM)

```bash
cd /var/www/stemlab
npm install
pm2 start server.js --name stemlab
pm2 save
```

Put Nginx in front as a reverse proxy terminating TLS:
```nginx
location / {
  proxy_pass http://localhost:3000;
}
```

For production, also:
- Replace `users.json` with PostgreSQL or MySQL
- Add JWT-based auth middleware
- Set a Gemini API quota/budget in Google AI Studio
- Enforce HTTPS, rate limiting on auth routes, and CSRF protection

### Vercel / serverless
- Convert `server.js` endpoints to Vercel Serverless Functions
- Serve static files via Vercel's static hosting
- Set `GEMINI_API_KEY` in Vercel's environment variable dashboard

---

## 9. `.gitignore`

The following must always be gitignored:

```
node_modules/
.env
users.json
```

- `.env` contains the Gemini API key
- `users.json` contains password hashes
- `node_modules/` is large and reproducible via `npm install`

Create with:
```bash
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "users.json" >> .gitignore
```
