require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies if needed

// Serve static frontend files from the parent directory
app.use(express.static(path.join(__dirname, '../')));

// Serve the landing page when visiting the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../IAMS_landing_page.html'));
});

// Nodemailer Transporter Setup for Brevo SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_USER, // Your Brevo login email
    pass: process.env.BREVO_SMTP_KEY   // Your Brevo SMTP key
  }
});

// Endpoint to handle demo requests
app.post('/api/request-demo', (req, res) => {
  const { name, inst, email, msg } = req.body;

  if (!name || !inst || !email) {
    return res.status(400).json({ error: 'Name, Institution, and Email are required.' });
  }

  // Insert into SQLite database
  const sql = `INSERT INTO demo_requests (name, institution, email, message) VALUES (?, ?, ?, ?)`;
  db.run(sql, [name, inst, email, msg], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to save request.' });
    }

    // Prepare email
    const mailOptions = {
      from: process.env.BREVO_SMTP_USER, // Must be a verified sender in Brevo
      to: 'eduinnovax@gmail.com', // The admin email specified in the UI
      subject: 'New IAMS Demo Request',
      text: `You have received a new demo request for IAMS:\n\nName: ${name}\nInstitution: ${inst}\nEmail: ${email}\nMessage: ${msg || 'N/A'}\n\nThis request has been saved to your database.`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        // Even if email fails, we saved it to DB, so we can still return success (or a partial success).
        // For simplicity, we return success but log the error.
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(200).json({ success: true, message: 'Request submitted successfully.' });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
