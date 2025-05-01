const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Set this in your environment variables
    pass: process.env.EMAIL_PASS || 'your-app-password', // Set this in your environment variables
  },
});

/**
 * Send a video call invitation email to a doctor
 * @param {string} doctorEmail - Doctor's email
 * @param {string} patientName - Patient's name
 * @param {string} callLink - Video call link
 */
const sendVideoCallInvitation = async (doctorEmail, patientName, callLink) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: doctorEmail,
      subject: `HealthOasis: Video Call Request from ${patientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3b82f6;">HealthOasis Video Call Request</h2>
          <p>Hello Doctor,</p>
          <p><strong>${patientName}</strong> is requesting a video consultation with you.</p>
          <p>Please click the button below to join the call:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${callLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Join Video Call
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser: <a href="${callLink}">${callLink}</a>
          </p>
          <p>Thank you for using HealthOasis.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVideoCallInvitation,
};
