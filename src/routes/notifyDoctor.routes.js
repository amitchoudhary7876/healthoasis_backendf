const express = require('express');
const router = express.Router();
const { sendMail } = require('../utils');
require('dotenv').config();
const videoCallUrl = process.env.VIDEO_CALL_URL;

// POST /api/notify-doctor
router.post('/', async (req, res) => {
  try {
    const { doctorEmail, doctorName, patientName, doctorId } = req.body;
    await sendMail({
      to: doctorEmail,
      subject: `Video Call Request from ${patientName}`,
      text: `Dear Dr. ${doctorName},\n\nYou have a new video call request from patient ${patientName}.\nJoin the call here: ${videoCallUrl}/doctor-call/${doctorId}`,
      html: `<p>Dear Dr. <b>${doctorName}</b>,</p><p>You have a new video call request from patient <b>${patientName}</b>.</p><p><a href="${videoCallUrl}/doctor-call/${doctorId}" style="display: inline-block; background-color: #2563eb; color: white; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px;">Join Video Call Now</a></p><p style="margin-top: 20px; font-size: 14px; color: #666;">Note: Please allow camera and microphone access when prompted.</p>`
    });
    res.status(200).json({ success: true, message: 'Doctor notified by email.' });
  } catch (err) {
    console.error('Error sending doctor email:', err);
    res.status(500).json({ success: false, message: 'Failed to send doctor email.' });
  }
});

module.exports = router;
