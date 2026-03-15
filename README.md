# STEM Labs Oman — Virtual STEM Lab Platform

An accessible virtual science lab for Omani students in Grades 6–12, with interactive experiments, an Arabic-first AI assistant, and lab report generation.

---

## Overview

STEM Labs Oman simulates a school science lab in the browser so that students can experiment safely even when their school has limited or no physical laboratories.

The platform is designed primarily for Omani students in Grades 6–12 and their teachers. It focuses on chemistry (with plans for physics and biology), using visual simulations, guided AI explanations in Arabic and English, and auto-generated lab reports to reinforce scientific thinking and documentation skills.

---

## Key Features

- **Virtual experiments**: Interactive simulations of core curriculum experiments (acid-base reactions, boiling, pH indicators, electrolysis).
- **AI assistant in Arabic & English**: Context-aware chat assistant powered by Google Gemini (free tier) that explains concepts, answers questions, and guides students step-by-step.
- **Lab report generator**: Compiles observations and experiment metadata into a structured lab report.
- **Persistent user accounts**: Email + password login with OTP email verification. User accounts are saved to `users.json` on disk and survive server restarts.
- **Accessibility features**: High-contrast mode, large fonts, reduced motion, TTS reading, and optional voice input.
- **Language switcher**: Global English/Arabic toggle with RTL/LTR switching and persistent preference across pages.

---

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, and modern JavaScript (no framework).
- **Backend**: Node.js with Express (`server.js`), JSON APIs for auth, OTP, and AI chat proxying.
- **AI**: Google Gemini API (`gemini-1.5-flash`) via a secure backend proxy route — the API key never touches the browser.
- **Database**: `users.json` file on disk for persistent user storage (replaceable with PostgreSQL/MySQL later). In-memory Map for pending OTP sessions.
- **TTS / Speech**: Browser `speechSynthesis` (TTS) and Web Speech API for microphone input where supported.
- **Email**: Nodemailer (SMTP), with console fallback when SMTP is not configured.
- **Hosting**: Any Node-capable host (Vercel, Omantel Cloud VM, Render, etc.).

---

## Prerequisites

- **Node.js**: v18 or later (built-in `fetch` required — no extra packages needed for API calls).
- **npm**: v8+.
- **Google AI Studio account**: Free Gemini API key from [aistudio.google.com](https://aistudio.google.com).
- **Email service** *(optional)*: SMTP credentials for sending OTP emails in production. Without them, OTP codes are logged to the server console — fine for local dev.

---

## Installation & Setup

1. **Clone the repository**

```bash
git clone <your-repo-url> stemlab
cd stemlab
```

2. **Install dependencies**

```bash
npm install
```

3. **Create a `.env` file** in the project root:

```bash
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "users.json" >> .gitignore
```

Then create `.env` with the following content (see table below).

4. **Run the development server**

```bash
npm start
```

5. **Open the app**

- Login page: `http://localhost:3000/`
- Lab page (requires login): `http://localhost:3000/Index.html`

---

## Environment Variables

Create a `.env` file in the project root:

| Variable         | Required | Description                                               | Example                        |
|------------------|----------|-----------------------------------------------------------|--------------------------------|
| `PORT`           | No       | HTTP port for the Express server (default: 3000)         | `3000`                         |
| `GEMINI_API_KEY` | **Yes**  | Google Gemini API key for the AI assistant               | `AIzaSy...`                    |
| `SMTP_HOST`      | No       | SMTP host for sending OTP emails                         | `smtp.sendgrid.net`            |
| `SMTP_PORT`      | No       | SMTP port (usually 587 for TLS)                          | `587`                          |
| `SMTP_SECURE`    | No       | Use secure SMTP (`true`/`false`)                         | `false`                        |
| `SMTP_USER`      | No       | SMTP username                                            | `apikey`                       |
| `SMTP_PASS`      | No       | SMTP password or API token                               | `xxxxxxx`                      |
| `MAIL_FROM`      | No       | From-address used in OTP emails                          | `no-reply@stemlabs.om`         |

**To get a free Gemini API key:**
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with any Google account
3. Click **"Get API key"** → **"Create API key"**
4. Copy the key and paste it into `.env` as `GEMINI_API_KEY=AIza...`

> **Important:** Never commit `.env`, `users.json`, or `node_modules/` to git. The `.gitignore` setup above covers all three.

---

## Project Structure

```
stemlab/
  Auth.html        # Login / register page (with OTP flow)
  Index.html       # Main virtual lab interface (requires login)
  server.js        # Node + Express backend (auth, OTP, AI proxy)
  users.json       # Persisted user accounts (auto-created, gitignored)
  package.json     # Node project metadata and scripts
  .env             # Environment variables (gitignored)
  .gitignore       # Excludes node_modules/, .env, users.json
  README.md        # Project overview and setup
  DETAILS.md       # Deep-dive technical reference
  css/
    Main.css       # Shared styles, layout, variables, language toggle
    Auth.css       # Auth page-specific styling
    Lab.css        # Lab layout, equipment, AI panel
  js/
    Auth.js        # Login + registration + OTP client logic
    Lab.js         # Lab simulation, AI assistant, TTS, state management
    i18n.js        # Unified translation system (single window.translations object)
```

---

## How to Use

1. **Register** — go to the login page, open the **Register** tab, and fill in your details.
2. **Verify email** — a 6-digit OTP is sent to your email (or logged to the server console in dev). Enter it to activate your account.
3. **Login** — enter your email and password.
4. **Enter lab** — choose an experiment, adjust temperature and concentration, and run the simulation.
5. **Chat with AI** — ask questions in Arabic or English. The assistant is powered by Gemini and is aware of your current experiment state.
6. **Change grade** — click the green **Grade** badge in the header to update your grade level.
7. **Generate lab report** — click **Lab Report** to compile your observations into a structured report.

---

## API Endpoints

| Method  | Path                   | Description                                              |
|---------|------------------------|----------------------------------------------------------|
| POST    | `/api/auth/register`   | Create pending user, hash password, send OTP email      |
| POST    | `/api/auth/verify-otp` | Verify 6-digit OTP, activate user, save to `users.json` |
| POST    | `/api/auth/resend-otp` | Resend a new OTP for a pending user                     |
| POST    | `/api/auth/login`      | Login with email/password                               |
| PATCH   | `/api/user/grade`      | Update a user's grade, persisted to `users.json`        |
| POST    | `/api/chat`            | Proxy AI chat messages to Google Gemini API             |
| GET     | `/*`                   | Serve static HTML/CSS/JS files                          |

---

## Known Issues & Limitations

- **No JWT / session tokens**: Authentication is managed client-side with `sessionStorage`. Fine for local/demo use; add JWT or signed cookies before any public deployment.
- **Single-file user store**: `users.json` works well for dev and small deployments but is not suitable for concurrent high-traffic use. Replace with PostgreSQL/MySQL for production.
- **OTP sessions are in-memory**: If the server restarts while a user is mid-registration, they will need to register again. Completed accounts in `users.json` are unaffected.
- **2D lab visuals**: Current experiments are CSS/SVG-based rather than full 3D physics scenes.
- **Chrome recommended**: The Web Speech API (voice input) has the best support in Chrome. Firefox works for all other features.

---

## Future Roadmap

### Phase 2
- Replace `users.json` with PostgreSQL or MySQL.
- Add JWT-based authentication with role-based access (Student / Teacher / Admin).
- Teacher dashboard with real-time student session monitoring.
- Export lab reports as PDF or Word documents.

### Phase 3
- Full 3D engine (Three.js / React Three Fiber) with physics simulation (Rapier.js).
- Experiment authoring tool for teachers.
- Support for physics and biology subjects.
- Additional language support.
- Deploy to Omantel Cloud with autoscaling.

---

## License

MIT License — you are free to use, modify, and distribute this project with attribution.
