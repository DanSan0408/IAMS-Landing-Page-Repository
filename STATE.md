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
  - **From**: `eduinnovax@gmail.com` (Authenticated sender via Brevo SMTP).
  - **To**: `pyliew@utm.my` (Admin receiver).
- **Hosting Considerations**: This setup requires a VPS (like DigitalOcean or AWS EC2) or a platform that supports persistent local storage for SQLite (e.g., Render with a persistent disk), since serverless platforms (like Vercel/Netlify) do not support local SQLite files.

---

## Next Steps / Pending Items
- Deploy the Node.js backend to a hosting provider.
- Set up domain routing and SSL certificates for the production environment.
- Any further copywriting tweaks or section refinements as needed.
