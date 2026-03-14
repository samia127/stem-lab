## STEM Labs Oman — Technical Details

Deep-dive technical reference for the STEM Labs Oman virtual lab platform.

### 1. System Architecture Diagram

```text
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
│  - Serves HTML/CSS/JS files  │
└──────────────┬───────────────┘
               │
      In-memory Maps (dev)     │
┌──────────────▼───────────────┐
│        Data Storage          │
│  pendingUsers (email→record) │
│  users (email→record)        │
│  (future: SQL/NoSQL DB)      │
└──────────────┬───────────────┘
               │
               │ SMTP (TLS)
               ▼
┌──────────────────────────────┐
│        Email Service         │
│    (SMTP via Nodemailer)     │
│  - Sends OTP verification    │
│  - Logs OTP locally if OFF   │
└──────────────────────────────┘

Additional external service (currently called client-side):

┌──────────────────────────────┐
│       Claude API (AI)        │
│   https://api.anthropic.com  │
│  - Receives chat prompts     │
│  - Returns experiment-help   │
└──────────────────────────────┘
```

### 2. Authentication Flow

End-to-end flow: **register → OTP → verify → login → session**.

1. **Open Auth page**  
   - User lands on `Auth.html`.  
   - `Auth.js` checks `sessionStorage.stemlab_user`; if present, redirects to `Index.html`.
2. **Registration form (Step 1)**  
   - User clicks **Register** tab.  
   - `Auth.js` validates:
     - Full name (min 2 chars), valid email, school, grade (6–12), role (student/teacher).  
     - Password is at least 8 characters and matches confirm password.
3. **Create pending user**  
   - On success, frontend sends `POST /api/auth/register` with `{ name, email, school, grade, role, password }`.  
   - `server.js`:
     - Normalises email and checks `users` Map for duplicates.  
     - Hashes password using `bcrypt.hash(plain, 12)`.  
     - Generates 6-digit OTP and expiry (`now + 15 min`).  
     - Stores a record in `pendingUsers` Map keyed by email.  
     - Sends OTP email via Nodemailer (or logs to console if SMTP is not configured).  
   - Frontend stores `lastRegisteredEmail` and switches to OTP form (`formVerifyOtp`).
4. **Email verification (Step 2)**  
   - User enters 6-digit OTP.  
   - Frontend calls `POST /api/auth/verify-otp` with `{ email, otp }`.  
   - `server.js`:
     - Looks up pending record in `pendingUsers`.  
     - Checks expiry and code correctness.  
     - On success, moves user to `users` Map (id + email + name + role + grade + hashed password).  
     - Deletes pending record.  
   - Frontend shows success message and automatically switches back to the login tab.
5. **Login**  
   - User submits login form, `Auth.js` validates email + non-empty password.  
   - Sends `POST /api/auth/login` with `{ email, password }`.  
   - `server.js`:
     - Looks up user in `users` Map.  
     - Compares `bcrypt.compare(plain, storedHash)`.  
     - Returns `{ ok:true, user:{id,name,email,role,school,grade} }` on success.
   - `Auth.js` stores the user object into `sessionStorage.stemlab_user` and navigates to `Index.html`.
6. **Session usage in lab**  
   - At the top of `Lab.js`, session is read from `sessionStorage`.  
   - If no session exists, the script redirects back to `Auth.html`.  
   - Session data (name, role, grade, school) is used for greetings and header UI.

### 3. Frontend Architecture

- **HTML files**
  - `Auth.html`: Authentication SPA, with tabbed **Login** and **Register** views and an OTP step integrated into the register tab.
  - `Index.html`: Main lab UI containing:
    - Header (logo, language toggle, user menu, chatbot toggle button).
    - Lab area (experiment selector, stage, equipment, controls, observations).
    - AI side panel (chat history, quick prompts, input bar).
    - Report modal overlay.

- **JavaScript**
  - `Auth.js`: Pure JS, no framework. All interactions are DOM-based (query selectors, event listeners).  
    - Manages tab switching and form validation.  
    - Implements a two-step registration (form + OTP) with backend calls via `fetch`.  
    - Updates ARIA attributes and error messages for accessibility.
  - `Lab.js`: Main stateful controller for the lab SPA:
    - Holds full lab state (temperature, concentration, experiment type, steps).  
    - Controls DOM manipulation (heights of liquids, text of labels, flashing animations).  
    - Orchestrates AI calls, TTS, voice input, and accessibility toggles.
  - `i18n.js`:
    - Defines a `translations` object for auth + shared text and a `T` object for lab-specific strings.  
    - Provides `applyLanguage(lang)` and `handleLanguageToggle(lang)` for both auth and lab pages.

- **CSS**
  - `Main.css`: Base reset, colors, typography, header, language toggle, modal, and shared components.  
  - `Auth.css`: Card layout for the auth page, tabs, inputs, password strength meter.  
  - `Lab.css`: Two-column grid layout, lab bench visuals, equipment, AI side panel, chat area, and responsive behaviour.

### 4. 3D Lab Engine (Design & Current Implementation)

The current version simulates the lab using **2D CSS/SVG-style elements**, but the architecture is designed so that the central **state + events** can later be wired into a 3D/physics engine.

- **Current 2D setup**
  - The beakers, thermometer, burner, and test tubes are styled via CSS in `Lab.css` inside containers like `.lab-stage`, `.beaker-glass`, `.thermo-body`.  
  - Lab state (temperature, concentration, experiment, reactionDone) lives in the `state` object in `Lab.js`.  
  - Functions such as `setTemperature`, `toggleBurner`, `startReaction`, and `testTubeClick` translate state changes directly into DOM style updates.

- **Future 3D integration (conceptual)**
  - Replace `.lab-stage` DOM visuals with a `<canvas>` or React Three Fiber scene.  
  - Map `state.temperature`, `state.concentration`, and `state.experiment` to uniforms/props used by Three.js materials and animations.  
  - Use a physics engine (e.g. Rapier.js) to simulate realistic liquid motion, collisions, and dragging of equipment:
    - Drag & drop of test tubes → event updates a physics body transform.  
    - Collisions between “beaker” and “liquid particle emitters” trigger interaction events and color changes.  
  - Keep the AI + UI logic in `Lab.js` and mount a separate React/Three component for rendering scenes.

### 5. AI Assistant Integration

- **Prompt structure** (`Lab.js`, function `askClaude(userMsg)`):
  - Uses `T[currentLang].aiSystemPrompt` as a **system-level prompt** that tells Claude:
    - Student grade and context (Omani Grade 9).  
    - Language (Arabic or English).  
    - Style (short, encouraging, educational).  
  - Adds **current experiment context**:

```js
system: `${t.aiSystemPrompt}
Current lab: experiment=${state.experiment}, temp=${state.temperature}°C, reaction=${state.reactionDone ? 'complete' : 'not started'}.`
```

- Sends a `POST` request to Claude Messages API:
  - `model`: `claude-sonnet-4-20250514`  
  - `max_tokens`: `1000`  
  - `messages`: `[{ role: 'user', content: userMsg }]`

- **Response handling**:
  - Aggregates all text segments into a single string.  
  - Appends to the chat as an AI message via `addMsg('ai', text)`.  
  - Triggers `advanceStep()` in the step indicator.  
  - If TTS is enabled, passes a text-only version to `speakText(...)`.

- **Arabic response and TTS**:
  - When `currentLang === 'ar'`, prompts and explanations are in Arabic.  
  - TTS sets `utter.lang = 'ar-SA'` to use an Arabic voice where available.  
  - Chat messages are still plain HTML; TTS strips tags before speaking.

### 6. Lab Report Generator

- **Data collection**:
  - Every significant action logs an observation via `addObservation(text)` in `Lab.js`.  
  - Observations are stored in `state.observations` as objects: `{ time, text }`.  
  - Timestamps are relative to `state.startTime`.

- **Report generation** (`generateReport()`):
  - Builds a human-readable block of bullet lines:

```js
const obsText = state.observations.length > 0
  ? state.observations.map(o => `• [${o.time}] ${o.text}`).join('\n')
  : t.repNoObs;
```

  - Injects into the report modal sections `repResults` and `repConclusion`.  
  - Uses translation keys from `T[...]` for section titles and default conclusions.  
  - Opens a modal overlay and optionally reads the report aloud via TTS.

### 7. Teacher Observation Panel (Future)

The current UI is student-focused, but the architecture anticipates a teacher observation panel.

- **Planned behaviour**:
  - Each student session emits real-time updates:
    - Active experiment, parameter changes, reaction start/finish, notes taken.  
  - Data would be sent to a teacher dashboard either via:
    - **WebSockets** (preferred) for low-latency updates.  
    - Or **short-polling** (XHR/fetch interval) in low-resource deployments.

- **Visible data for teachers**:
  - Connected students and their roles (student/teacher).  
  - Current experiment and progress step (1–5).  
  - Latest AI questions and responses.  
  - Generated lab report summaries.

### 8. Translation System

- **`i18n.js`**
  - `translations`: For auth and shared text (logo, language labels, OTP copy, page titles).  
  - `T`: Full lab translation object used by `Lab.js` for all in-lab strings.

- **Public functions**:
  - `applyLanguage(lang)`:
    - Sets `document.documentElement.lang` and `dir`.  
    - Updates all `[data-i18n]` elements with text or HTML.  
    - Updates the document `<title>` based on `pageTitleAuth` or `pageTitleLab`.  
  - `handleLanguageToggle(lang)`:
    - Saves `stemlab_lang` to `localStorage`.  
    - Calls `applyLanguage(lang)` and then `window.setLang(lang)` if available (lab page).

- **DOM attributes**:
  - All translatable labels in auth + main title use `data-i18n="key"`.  
  - Language toggle buttons wrap their text in `<span data-i18n="langArLabel">` etc.  
  - Lab-specific strings are managed by `T` via `applyLang()` in `Lab.js`, not via `data-i18n` to avoid performance overhead on every change.

- **RTL/LTR handling**:
  - `document.documentElement.dir` is set to `rtl` for Arabic and `ltr` for English.  
  - CSS contains `[dir="rtl"]` and `[dir="ltr"]` rules for aligning certain UI elements (e.g. stage labels, borders).

### 9. Database Schema (Logical)

Current implementation uses in-memory Maps, but they mirror what would later be proper DB tables.

- **`pending_users`** (represented by `pendingUsers` Map)
  - `email` (string, PK): Student/teacher email.  
  - `name` (string): Full name.  
  - `school` (string): School name.  
  - `grade` (string/int): Grade 6–12.  
  - `role` (string): `"student"` or `"teacher"`.  
  - `password_hash` (string): Bcrypt hash of user password.  
  - `otp` (string): 6-digit OTP string.  
  - `otp_expires_at` (timestamp): Expiration time.  
  - `created_at` (timestamp): Creation time.

- **`users`** (represented by `users` Map)
  - `id` (string, PK): Unique identifier for user.  
  - `email` (string, unique): Login email.  
  - `name` (string): Full name.  
  - `school` (string): School name.  
  - `grade` (string/int): Grade 6–12.  
  - `role` (string): `"student"` or `"teacher"`.  
  - `password_hash` (string): Bcrypt hash.  
  - `created_at` (timestamp): When user was activated.

### 10. Key Code Snippets

- **Register → OTP backend (simplified)** (`server.js`):

```js
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, school, grade, role } = req.body || {};
  const normEmail = normaliseEmail(email);
  if (users.has(normEmail)) return res.status(409).json({ ok:false, error:'EMAIL_EXISTS' });

  const passwordHash = await bcrypt.hash(String(password), 12);
  const otp = generateOtp();
  const otpExpiresAt = Date.now() + 15 * 60 * 1000;

  pendingUsers.set(normEmail, { name, email:normEmail, school, grade, role,
                                passwordHash, otp, otpExpiresAt, createdAt:new Date().toISOString() });
  await sendOtpEmail(normEmail, otp);
  res.json({ ok:true, message:'PENDING_CREATED' });
});
```

- **OTP verification and promotion to user** (`server.js`):

```js
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body || {};
  const normEmail = normaliseEmail(email);
  const record = pendingUsers.get(normEmail);
  if (!record) return res.status(404).json({ ok:false, error:'NOT_FOUND' });
  if (record.otpExpiresAt < Date.now()) {
    pendingUsers.delete(normEmail);
    return res.status(400).json({ ok:false, error:'OTP_EXPIRED' });
  }
  if (String(record.otp) !== String(otp)) {
    return res.status(400).json({ ok:false, error:'OTP_INVALID' });
  }
  const user = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, ...record };
  users.set(normEmail, user);
  pendingUsers.delete(normEmail);
  res.json({ ok:true, message:'VERIFIED', user:{ id:user.id, name:user.name, email:user.email,
        school:user.school, grade:user.grade, role:user.role } });
});
```

- **Client-side register step 1** (`Auth.js`):

```js
if (formRegister) {
  formRegister.addEventListener("submit", async (e) => {
    e.preventDefault(); clearErrors();
    // ... validate fields ...
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, school, grade, role, password }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      lastRegisteredEmail = email;
      formRegister.hidden  = true;
      formVerifyOtp.hidden = false;
      startOtpCooldown(60);
    }
  });
}
```

- **Language toggle that keeps everything in sync** (`i18n.js`):

```js
function handleLanguageToggle(lang) {
  setPreferredLanguage(lang);
  applyLanguage(lang);      // Updates HTML dir/lang, titles, auth labels
  if (typeof window.setLang === 'function') {
    window.setLang(lang);   // Notifies Lab.js to update lab-specific UI
  }
}
```

### 11. How Everything Connects (User Story)

1. **Student opens the site** at `http://localhost:3000/`. The server serves `Auth.html`.  
2. **Student chooses language** via the header toggle; `handleLanguageToggle` updates `lang`, `dir`, visible labels, and stores the choice.  
3. **Student registers** with name/email/password/school/grade/role. `Auth.js` validates and calls `/api/auth/register`.  
4. **Server** creates a pending user, hashes the password, generates OTP, and sends/logs the OTP.  
5. **Student enters OTP** on the verification screen; `Auth.js` calls `/api/auth/verify-otp`. On success, the user is moved to the `users` store.  
6. **Student logs in**, and the server validates credentials. On success, the frontend writes `sessionStorage.stemlab_user` and redirects to `Index.html`.  
7. **Index page loads**. `Lab.js` checks session; if missing, it redirects back. Otherwise, it:  
   - Reads `stemlab_lang` and applies translations via `applyLang`.  
   - Builds lab visuals (beakers, burner, thermometer) and greeting.  
8. **Student runs an experiment** by pressing "Start Reaction":  
   - DOM animations update beaker liquid heights and colors.  
   - Observations are appended with formatted timestamps.  
   - AI assistant posts a guiding explanation for the reaction.  
9. **Student chats with AI**: Each question triggers `askClaude`, sending lab context + question to Claude, and new messages appear in the chat.  
10. **Student generates a lab report**: `generateReport()` composes an observation list and conclusion, fills the modal, and optionally reads it aloud.  
11. **Student logs out** using the header menu, which clears `sessionStorage` and returns them to `Auth.html`.

### 12. Deployment Notes

- **Omantel Cloud / VM-style deployment**
  - Provision a Linux VM with Node.js (v18+) installed.  
  - Place project files in `/var/www/stemlab` (for example).  
  - Set environment variables via `.env` or systemd unit.  
  - Run with a process manager like `pm2`:

```bash
cd /var/www/stemlab
npm install
pm2 start server.js --name stemlab
pm2 save
```

  - Put Nginx in front as a reverse proxy terminating TLS, forwarding `https://stemlab.your-domain.om` to `http://localhost:3000`.

- **Vercel / serverless-style deployment**
  - Convert `server.js` endpoints to Vercel Serverless Functions or another FaaS runtime.  
  - Serve the static `Auth.html`, `Index.html`, CSS, and JS via a static hosting configuration.  
  - Move AI + email configuration into environment variables provided via Vercel’s dashboard.

- **Development vs Production differences**
  - **Dev**:
    - In-memory Maps for users (no persistence).  
    - OTP codes may be logged to console if SMTP is not configured.  
    - Claude or AI calls may be disabled or stubbed if keys are not available.
  - **Prod**:
    - Use a real database (PostgreSQL/MySQL) instead of Maps.  
    - Route AI calls through a secure backend endpoint with rate limiting.  
    - Enforce HTTPS, strong password policies, and CSRF protection if you add mutating routes beyond auth.

