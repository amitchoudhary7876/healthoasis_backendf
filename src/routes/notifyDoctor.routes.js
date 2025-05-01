const express = require('express');
const router = express.Router();
const { sendMail } = require('../utils');
require('dotenv').config();


// POST /api/notify-doctor - Send notification to doctor
router.post('/', async (req, res) => {
  try {
    const { doctorEmail, doctorName, patientName, message } = req.body;
    
    // Validate required fields
    if (!doctorEmail) {
      return res.status(400).json({ success: false, message: 'Doctor email is required' });
    }
    if (!doctorName) {
      return res.status(400).json({ success: false, message: 'Doctor name is required' });
    }
    
    // Send email notification
    await sendMail({
      to: doctorEmail,
      subject: `Message from ${patientName}`,
      text: `Dear Dr. ${doctorName},\n\nYou have a new message from patient ${patientName}.\n\n${message || 'The patient would like to connect with you.'}\n\nPlease check your HealthOasis dashboard for more details.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #2563eb;">HealthOasis Patient Message</h2>
          </div>
          <p>Dear Dr. <b>${doctorName}</b>,</p>
          <p>You have a new message from patient <b>${patientName}</b>:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;">${message || 'The patient would like to connect with you.'}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Please check your HealthOasis dashboard for more details.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 12px; text-align: center;">Regards,<br>The HealthOasis Team</p>
        </div>
      `
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Doctor notified by email.'
    });
  } catch (err) {
    console.error('Error in notify-doctor route:', err);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Failed to send doctor email.';
    if (err.code === 'EAUTH' || err.code === 'ESOCKET') {
      errorMessage = 'Email server configuration error. Please contact support.';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// POST /api/notify-doctor/schedule - Schedule a future appointment notification
router.post('/schedule', async (req, res) => {
  try {
    const { doctorEmail, doctorName, patientName, scheduledTime, appointmentType } = req.body;
    
    // Format the scheduled time for display
    const formattedTime = new Date(scheduledTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    await sendMail({
      to: doctorEmail,
      subject: `Scheduled Appointment with ${patientName}`,
      text: `Dear Dr. ${doctorName},\n\nYou have a scheduled appointment with patient ${patientName}.\n\nAppointment Type: ${appointmentType || 'Regular checkup'}\n\nScheduled Time: ${formattedTime}\n\nPlease check your HealthOasis dashboard for more details.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #2563eb;">HealthOasis Scheduled Appointment</h2>
          </div>
          <p>Dear Dr. <b>${doctorName}</b>,</p>
          <p>You have a scheduled appointment with patient <b>${patientName}</b>.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Appointment Type:</strong> ${appointmentType || 'Regular checkup'}</p>
            <p style="margin: 5px 0;"><strong>Scheduled Time:</strong> ${formattedTime}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Please check your HealthOasis dashboard for more details.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 12px; text-align: center;">Regards,<br>The HealthOasis Team</p>
        </div>
      `
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Scheduled appointment notification sent to doctor.'
    });
  } catch (err) {
    console.error('Error sending scheduled appointment notification:', err);
    res.status(500).json({ success: false, message: 'Failed to send scheduled appointment notification.' });
  }
});

module.exports = router;
