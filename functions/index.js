// functions/index.js

// Import v2 functions and parameters using ES Modules 'import' syntax
// This is the correct v2 syntax when "type": "module" is in package.json
import { onRequest } from "firebase-functions/v2/https"; // For HTTP callable functions
import { defineString } from "firebase-functions/params"; // For accessing secrets and other parameters

// Import Firebase Admin SDK components using ES Modules
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as nodemailer from "nodemailer"; // For sending emails
import cors from "cors"; // Corrected: Import cors as a default export function

// Initialize Firebase Admin SDK
const app = initializeApp();
const db = getFirestore(app);

// --- Define Secrets as Parameters ---
// These should match the names you set using `firebase functions:secrets:set`
// These are *parameters* that automatically pull values from Secret Manager.
// We are defining them once and correctly here.
const GMAIL_EMAIL = defineString('GMAIL_EMAIL');
const GMAIL_PASSWORD = defineString('GMAIL_PASSWORD');

// --- Nodemailer Transporter Configuration ---
// Access secret values using .value() on the defined parameters.
// This configuration will only be available when the function is deployed,
// as the secret values are resolved at runtime by Firebase.
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_EMAIL.value(), // Access the secret value
    pass: GMAIL_PASSWORD.value(), // Access the secret value
  },
});

// --- Cloud Function: sendContactEmail (v2 HTTP Function) ---
// Using onRequest from firebase-functions/v2/https
// This function will automatically use the secrets declared above
// (GMAIL_EMAIL and GMAIL_PASSWORD)
export const sendContactEmail = onRequest((req, res) => {
  // Create the CORS middleware handler.
  // { origin: true } allows requests from any origin.
  // For production, you might want to restrict this to your specific frontend domain:
  // cors({ origin: 'https://your-frontend-domain.com' })
  const corsHandler = cors({ origin: true });

  // Apply the CORS middleware. It will handle OPTIONS preflight requests
  // and then call the provided callback for the actual request (e.g., POST).
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      // Respond with Method Not Allowed for non-POST requests
      return res.status(405).send('Method Not Allowed');
    }

    const { name, email, subject, message } = req.body;

    // Basic validation to ensure all required fields are present
    if (!name || !email || !subject || !message) {
      return res.status(400).send('All fields are required.');
    }

    // Optional: More robust email format validation
    // This is a simple check; for production, consider a more comprehensive regex
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).send('Invalid email format.');
    }

    // Configure the email options
    const mailOptions = {
      from: `ZORVH Contact <${GMAIL_EMAIL.value()}>`, // Sender will be your sending email
      to: GMAIL_EMAIL.value(), // Recipient will be your sending email (or a dedicated contact email)
      subject: `Contact Form: ${subject}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    try {
      // Attempt to send the email using the configured transporter
      await mailTransport.sendMail(mailOptions);
      console.log('Email sent successfully!'); // Log success to Firebase Functions logs
      res.status(200).send('Email sent successfully!'); // Send success response to client
    } catch (error) {
      // Catch and log any errors during email sending
      console.error('Error sending email:', error); // Log error to Firebase Functions logs
      res.status(500).send('Error sending email'); // Send error response to client
    }
  });
});
