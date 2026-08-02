# Project State & Architecture Proposals

## Current State
- **Landing Page**: Static HTML (`IAMS_landing_page.html`)
- **Requirement**: Capture demo requests (1-3 per week) and send an email notification to the admin.
- **Constraints**: 
  - Do not use Formspree.
  - Need a simple database to store inputs.
  - Send email via Brevo or Google (Gmail).

---

## Architecture Proposals for Demo Requests

Given the extremely low volume of requests (1-3 per week) and the current static HTML setup, here are the most suitable options ranging from easiest to most robust.

### Option 1: Google Apps Script + Google Sheets (🏆 Most Recommended)
Since you mentioned using Google for emails, you can use Google Sheets as your "simple database" and Google Apps Script as your backend.
- **How it works**: Your HTML form sends a POST request to a Google Apps Script Web App URL. The script appends the demo request data as a new row in a Google Sheet (acting as your database) and immediately uses `MailApp.sendEmail()` to send a notification to the admin via Gmail.
- **Pros**: 100% Free forever. No servers to maintain. No separate database to set up. Handles both storage and email in one place. Perfect for low volume.
- **Cons**: Requires setting up a Google Apps Script and deploying it as a web app.

### Option 2: Serverless Function + Supabase + Brevo
If you want a "real" database (like PostgreSQL) rather than a spreadsheet, going serverless is the best approach so you don't have to pay for or manage a 24/7 server.
- **How it works**: You host the landing page on Vercel or Netlify. When the form is submitted, it hits a Serverless API route (e.g., `/api/request-demo`). The API inserts the data into a **Supabase** database (free tier) and then calls the **Brevo API** to send the email.
- **Pros**: Very robust and professional. Uses standard modern web technologies. Supabase gives you a great dashboard to view requests.
- **Cons**: Overkill for 1-3 requests a week. Requires setting up Vercel/Netlify, Supabase, and Brevo accounts, plus writing the backend code for the API route.

### Option 3: Simple Node.js/Express Backend + SQLite + Google/Brevo
If you are planning to host this on a VPS (like DigitalOcean or AWS EC2), you can build a tiny custom backend.
- **How it works**: A lightweight Node.js server using Express. It saves form submissions to a local **SQLite** database file. It then uses `Nodemailer` (with Gmail credentials) or the Brevo SDK to send the email.
- **Pros**: You own everything. Extremely lightweight.
- **Cons**: You have to host, deploy, and maintain a Node.js server just for a simple form. Not ideal unless you are already renting a server for this project.

---

## Next Steps
Please let me know which option sounds best to you! If you like **Option 1**, I can provide the exact Google Apps Script code and instructions on how to hook it up to your HTML form right now. If you prefer a real database, let me know if **Option 2** or **Option 3** fits your hosting plans better.
