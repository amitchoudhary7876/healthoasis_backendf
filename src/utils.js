require('dotenv').config();
const nodemailer = require('nodemailer');
// Use the deployed Vercel frontend URL for video calls
const videoCallUrl = 'https://healthoasis-kd3d.vercel.app';
// Configure transporter using environment variables for flexibility
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP transporter verification failed:', error);
  } else {
    console.log('SMTP transporter is ready to send messages');
  }
});

async function sendMail({ to, subject, text, html }) {
  const mailOptions = {
    from: process.env.SMTP_USER || 'adish5969@gmail.com', // Use env var or fallback
    to,
    subject,
    text,
    html
  };
  
  try {
    console.log(`Attempting to send email to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Nodemailer sendMail error:', error);
    // Log more detailed error information
    if (error.code === 'EAUTH') {
      console.error('Authentication error - check SMTP credentials');
    } else if (error.code === 'ESOCKET') {
      console.error('Socket error - check SMTP host and port');
    }
    throw error;
  }
}

module.exports = { sendMail };
