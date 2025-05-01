require('dotenv').config();
const nodemailer = require('nodemailer');
// Use the deployed Vercel frontend URL for video calls
// Video call functionality removed
// Configure transporter using environment variables for flexibility
// Use default credentials if environment variables are not set
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
};

// Only add auth if credentials are provided
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpConfig.auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  };
  
} else {
  
}

const transporter = nodemailer.createTransport(smtpConfig);

// Verify SMTP configuration on startup but don't fail if it doesn't work
transporter.verify((error, success) => {
  if (error) {
    
    
  } else {
    
  }
});

async function sendMail({ to, subject, text, html }) {
  // Check if SMTP is properly configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`Email sending skipped: No SMTP credentials configured. Would have sent to: ${to}`);
    console.log('Email content would have been:', { subject, text });
    // Return a mock successful response instead of throwing an error
    return {
      messageId: `mock-${Date.now()}`,
      response: 'Mock email sent (SMTP not configured)',
      mock: true
    };
  }
  
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
    
    // Instead of throwing an error, return a mock response
    // This prevents the application from crashing when email fails
    console.warn('Returning mock email response due to error');
    return {
      messageId: `error-${Date.now()}`,
      response: `Email sending failed: ${error.message}`,
      error: error.message,
      mock: true
    };
  }
}

module.exports = { sendMail };
