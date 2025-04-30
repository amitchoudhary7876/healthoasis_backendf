require('dotenv').config();
const nodemailer = require('nodemailer');
// Use a fallback URL if the environment variable is not set
const videoCallUrl = process.env.VIDEO_CALL_URL || 'https://healthoasis-pc6bigdw7-amitchoudhary7876s-projects.vercel.app';
// SMTP config for 172.16.13.100
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // 587 for TLS, 465 for SSL
  secure: false, // true for 465, false for 587
  auth: {
    user: 'adish5969@gmail.com',
    pass: 'frwu lgkt zgck easy', // Use an App Password if 2FA is enabled
  },
});

async function sendMail({ to, subject, text, html }) {
  const mailOptions = {
    from: 'adish5969@gmail.com',
    to,
    subject,
    text,
    html
  };
  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Nodemailer sendMail error:', error);
    throw error;
  }
}

module.exports = { sendMail };
