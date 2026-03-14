## STEM Labs Oman — Virtual STEM Lab Platform

An accessible virtual science lab for Omani students in Grades 6–12, with interactive experiments, an Arabic-first AI assistant, and lab report generation.

### Overview

STEM Labs Oman simulates a school science lab in the browser so that students can experiment safely even when their school has limited or no physical laboratories.  
The platform is designed primarily for Omani students in Grades 6–12 and their teachers. It focuses on chemistry (with plans for physics and biology), using visual simulations, guided AI explanations in Arabic, and auto-generated lab reports to reinforce scientific thinking and documentation skills.

### Key Features

- **Virtual experiments**: Interactive simulations of core curriculum experiments (e.g. acid-base reactions, boiling, indicators, electrolysis).
- **AI assistant in Arabic & English**: Context-aware chat assistant that explains concepts, answers questions, and guides students step-by-step.
- **Lab report generator**: Compiles observations and experiment metadata into a structured lab report that students can review or export.
- **Teacher / admin-ready authentication**: Email + password login with OTP email verification for secure account creation.
- **Accessibility features**: High-contrast mode, large fonts, reduced motion, TTS reading, and optional voice input.
- **Language switcher**: Global English/Arabic toggle with RTL/LTR switching and persistent preference across pages.

### Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, and modern JavaScript (no framework) with responsive and accessible UI.
- **3D / Simulation layer**: Current version uses rich 2D SVG/CSS-based lab visuals and animations, designed to be replaceable with Three.js / React Three Fiber scenes in future phases.
- **Backend**: Node.js with Express (`server.js`), JSON APIs for auth and OTP flows.
- **Database**: In-memory Maps for dev/demo (replaceable with PostgreSQL/MySQL later).
- **AI**: Claude Messages API (Anthropic) via HTTPS from the browser (`lab.js`).
- **TTS / Speech**: Browser `speechSynthesis` (TTS) and Web Speech API for microphone input where supported.
- **Email**: Nodemailer (SMTP), with console fallbacks when SMTP is not configured.
- **Hosting**: Any Node-capable host (e.g. Vercel Node serverless, Omantel Cloud VM, Render, Heroku-style PaaS).

### Prerequisites

- **Node.js**: v18 or later recommended.
- **npm**: v8+.
- **Email service**: SMTP credentials (e.g. from a transactional email provider) for sending OTP emails in production.
- **Claude API access**: Anthropic API key if you want live AI responses (optional for local demo).

### Installation & Setup

1. **Clone the repository**

```bash
git clone <your-repo-url> stemlab
cd stemlab
```

2. **Install dependencies**

```bash
npm install
```

3. **Create a `.env` file** in the project root and set required environment variables (see table below).

```bash
copy .env.example .env  # or create manually on Windows
```

4. **Run the development server**

```bash
npm start
```

5. **Open the app**

- Auth / login page: `http://localhost:3000/Auth.html` (also served on `/`).
- Lab page (requires login): `http://localhost:3000/Index.html`.

### Environment Variables

Create a `.env` file with values like the following:

| Variable        | Description                                                | Example                         |
|----------------|------------------------------------------------------------|---------------------------------|
| `PORT`         | HTTP port for the Node/Express server                     | `3000`                          |
| `SMTP_HOST`    | SMTP host for sending OTP emails                          | `smtp.sendgrid.net`             |
| `SMTP_PORT`    | SMTP port (usually 587 for TLS)                           | `587`                           |
| `SMTP_SECURE`  | Use secure SMTP (true/false)                              | `false`                         |
| `SMTP_USER`    | SMTP username / account                                   | `apikey` or full email address  |
| `SMTP_PASS`    | SMTP password or API token                                | `xxxxxxx`                       |
| `MAIL_FROM`    | From-address used in OTP emails                           | `no-reply@stemlabs.om`          |
| `CLAUDE_API_KEY` | Anthropic API key (if routing AI calls via backend later)| `sk-ant-...`                    |

> Note: In the current version, client-side code calls the Claude Messages API directly using `CLAUDE_API` endpoint in `lab.js`. In production, move this call to a secured backend route that uses `CLAUDE_API_KEY`.

### Project Structure

```text
stemlab/
  Auth.html        # Login / register page (with OTP flow)
  Index.html       # Main virtual lab interface (requires login)
  server.js        # Node + Express backend for auth and OTP
  package.json     # Node project metadata and scripts
  README.md        # High-level project overview and setup
  DETAILS.md       # Deep-dive technical reference
  css/
    Main.css       # Shared styles, layout, variables, language toggle
    Auth.css       # Auth page-specific styling
    Lab.css        # Lab layout, equipment, AI panel
  js/
    Auth.js        # Login + registration + OTP client logic
    Lab.js         # Lab simulation, AI assistant, TTS, state management
    i18n.js        # Shared translation system + lab translation dictionary (T)
```

### How to Use

1. **Register**  
   Go to `Auth.html`, open the **Register** tab, and fill in: Full Name, Email, Password, Confirm Password, School Name, Grade (6–12), and Role (Student/Teacher).
2. **Verify email**  
   A 6-digit OTP is sent to your email (or logged in the server console for local/dev). Enter it on the verification screen and confirm.
3. **Login**  
   After verification, the UI switches back to Login. Enter your email and password to sign in.
4. **Enter lab**  
   You are redirected to `Index.html`, where you can choose an experiment, adjust controls (temperature, concentration), and run the simulation.
5. **Interact and ask AI**  
   Use the AI assistant panel to ask conceptual questions in Arabic or English. You can also enable TTS or voice input if your browser supports it.
6. **Generate lab report**  
   Click **Lab Report** to compile your observations into a structured report and review the generated summary.

### API Endpoints

All endpoints are served from the Node/Express server (`server.js`).

| Method | Path                  | Description                                                | Auth Required |
|--------|-----------------------|------------------------------------------------------------|--------------|
| POST   | `/api/auth/register`  | Create a pending user, hash password, send OTP email      | No           |
| POST   | `/api/auth/verify-otp`| Verify 6-digit OTP, activate user, move to active store   | No           |
| POST   | `/api/auth/resend-otp`| Resend a new OTP for a pending user (with countdown)      | No           |
| POST   | `/api/auth/login`     | Login with email/password against active user store       | No (returns user, no JWT yet) |
| GET    | `/*` static files     | Serve `Auth.html`, `Index.html`, CSS, JS assets           | —            |

> In production, you should secure `/Index.html` and lab APIs with session cookies or JWTs. Current version enforces login only in the frontend (`lab.js`) by checking `sessionStorage`.

### Known Issues & Limitations

- **In-memory storage only**: Users and pending OTPs are stored in server memory; they reset on restart and are not suitable for production.
- **No JWT / session tokens yet**: Authentication is managed on the client with `sessionStorage`; there is no signed token or server-side session.
- **AI calls from client**: Claude API is called from the browser, which is not safe for production API keys.
- **Email deliverability**: If SMTP is not configured, OTP codes are only logged to the server console (fine for local testing).
- **2D lab visuals**: Current experiments are 2D/animated rather than full 3D physics-based scenes.

### Future Roadmap

- **Phase 2**
  - Replace in-memory user storage with PostgreSQL or MySQL.
  - Add proper JWT-based auth or secure sessions, with role-based access (Student/Teacher/Admin).
  - Move Claude API calls to backend routes and secure with `CLAUDE_API_KEY`.
  - Introduce teacher dashboard with real-time student session monitoring.
  - Add export/download for lab reports (PDF/Docx).

- **Phase 3**
  - Integrate a full 3D engine (Three.js or React Three Fiber) and physics (e.g. Rapier.js) for rich experiment scenes.
  - Build a dedicated experiment authoring tool for teachers.
  - Support more subjects (physics, biology) and additional languages.
  - Deploy to Omantel Cloud with autoscaling and centralized logging.

### License

Specify your preferred license here, for example:

> MIT License — You are free to use, modify, and distribute this project with attribution.

