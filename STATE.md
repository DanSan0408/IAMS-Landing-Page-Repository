# Project State & Architecture

## Current State

- **Landing Page**: Static HTML (`backend/public/IAMS_landing_page.html`) with external CSS (`backend/public/style.css`).
- **Mobile Responsiveness**: Optimised for mobile (down to 375px screens) with horizontal overflow hidden and scalable typography.
- **Copy & Content**: Recently updated with new dates (2025/2026) and refined copywriting for the hero and features sections.
- **Image Assets**: Fully linked via relative paths (`images/`) so the site renders correctly both locally and on a server.

## Backend Architecture (Implemented)

The project uses a lightweight custom backend approach to handle low-volume demo requests (1-3 per week) without ongoing database costs.

- **Stack**: Node.js, Express, SQLite, and Nodemailer (via Brevo API).
- **Database**: Form submissions are stored in a local SQLite file (`backend/database.sqlite`).
- **Email Flow**:
  - The form (`/api/request-demo`) triggers an email notification.
  - **Auth**: Authenticated via Brevo SMTP using a dedicated login (`BREVO_SMTP_LOGIN`).
  - **From**: `eduinnovax@gmail.com` (Verified sender via `BREVO_SENDER_EMAIL`).
  - **To**: `pyliew@utm.my` (Admin receiver).
  - **Error Handling**: The server explicitly waits for the SMTP response. If the email fails to send (e.g. auth issues), it returns a 500 error to the frontend, even if the request was saved to the DB.

## Recent Updates

- **Security & Vulnerability Patching**:
  - Remediated 5 reported CVEs / advisories across dependencies (`nodemailer`, `body-parser`, `proxy-addr`, `qs`, `undici`) — `npm audit` now reports 0 vulnerabilities.
  - Upgraded Docker base image from deprecated `node:18-alpine` to LTS `node:22-alpine` with `npm ci --omit=dev`.
  - Added HTTP security headers and Content Security Policy (CSP) via `helmet`.
  - Added brute-force/DoS protection with `express-rate-limit` on the `/api/request-demo` endpoint.
  - Enforced JSON payload limits (`10kb`) and strict type/length/regex input validation on submitted fields.
  - Disabled `X-Powered-By` header and configured `trust proxy` support for reverse proxy environments.
- **Environment Separation**: Split `BREVO_SMTP_USER` into `BREVO_SMTP_LOGIN` and `BREVO_SENDER_EMAIL` to fix Brevo SMTP authentication where the login address differs from the sender address.
- **Frontend Form Notification**: Added a prominent dynamic notification banner at the top of the demo request form. It displays a green success message (with CSS animation) if the email succeeds, or a red error message if the backend fails to send the email, providing immediate clarity to the user.

- **Hosting Considerations**: This setup requires a VPS (like Dokploy, DigitalOcean, or AWS EC2) or a platform that supports persistent local storage for SQLite (e.g., Render with a persistent disk), since serverless platforms (like Vercel/Netlify) do not support local SQLite files.

---

## Next Steps / Pending Items
- Complete Brevo SMTP account validation/troubleshooting to resolve the `454 4.7.0 Temporary authentication failure`.
- Redeploy the Node.js backend to Dokploy with the newly added environment variables (`BREVO_SMTP_LOGIN`, `BREVO_SENDER_EMAIL`, etc.).
- Set up domain routing and SSL certificates for the production environment.
