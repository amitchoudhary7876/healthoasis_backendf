const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { sendMail } = require('../utils');
const VideoCall = require('../models/videoCall.model');
require('dotenv').config();
// Use the deployed Vercel frontend URL for video calls
const videoCallUrl = process.env.FRONTEND_URL || 'https://healthoasis-kd3d.vercel.app';
console.log(`Using frontend URL for video calls: ${videoCallUrl}`);

// POST /api/notify-doctor - Send video call invitation with ZegoCloud room ID
router.post('/', async (req, res) => {
  try {
    console.log('Received notify-doctor request:', req.body);
    const { doctorEmail, doctorName, patientName, doctorId, patientId } = req.body;
    
    // Validate required fields
    if (!doctorEmail) {
      return res.status(400).json({ success: false, message: 'Doctor email is required' });
    }
    if (!doctorName) {
      return res.status(400).json({ success: false, message: 'Doctor name is required' });
    }
    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'Doctor ID is required' });
    }
    
    // Generate a unique room ID for ZegoCloud
    const roomId = uuidv4();
    console.log(`Generated room ID: ${roomId}`);
    
    // Create a video call record in the database
    const videoCall = await VideoCall.create({
      doctorId,
      patientId: patientId || null,
      roomId,
      startTime: new Date(),
      status: 'in-progress',
      initiatedBy: 'patient'
    });
    console.log(`Created video call record with ID: ${videoCall.id}`);
    
    // Generate the video call URL with the room ID
    const callLink = `${videoCallUrl}/video-call/${roomId}`;
    console.log(`Generated call link: ${callLink}`);
    
    // Send email notification
    await sendMail({
      to: doctorEmail,
      subject: `Video Call Request from ${patientName}`,
      text: `Dear Dr. ${doctorName},\n\nYou have a new video call request from patient ${patientName}.\nJoin the call here: ${callLink}\n\nThis link will be active for the next 30 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #2563eb;">HealthOasis Video Call Request</h2>
          </div>
          <p>Dear Dr. <b>${doctorName}</b>,</p>
          <p>You have a new video call request from patient <b>${patientName}</b>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${callLink}" style="display: inline-block; background-color: #2563eb; color: white; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Join Video Call Now</a>
          </div>
          <p style="color: #666; font-size: 14px;">Note: Please allow camera and microphone access when prompted. This link will be active for the next 30 minutes.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 12px; text-align: center;">Regards,<br>The HealthOasis Team</p>
        </div>
      `
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Doctor notified by email.',
      videoCallId: videoCall.id,
      roomId,
      callLink
    });
  } catch (err) {
    console.error('Error in notify-doctor route:', err);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Failed to send doctor email.';
    if (err.name === 'SequelizeValidationError') {
      errorMessage = 'Invalid data provided for video call creation.';
      console.error('Validation errors:', err.errors);
    } else if (err.name === 'SequelizeUniqueConstraintError') {
      errorMessage = 'A video call with this room ID already exists.';
    } else if (err.code === 'EAUTH' || err.code === 'ESOCKET') {
      errorMessage = 'Email server configuration error. Please contact support.';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// POST /api/notify-doctor/schedule - Schedule a future video call
router.post('/schedule', async (req, res) => {
  try {
    const { doctorEmail, doctorName, patientName, doctorId, patientId, scheduledTime } = req.body;
    
    // Generate a unique room ID for ZegoCloud
    const roomId = uuidv4();
    
    // Create a scheduled video call record
    const videoCall = await VideoCall.create({
      doctorId,
      patientId,
      roomId,
      scheduledTime: new Date(scheduledTime),
      status: 'scheduled',
      initiatedBy: 'patient'
    });
    
    // Generate the video call URL with the room ID
    const callLink = `${videoCallUrl}/video-call/${roomId}`;
    
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
      subject: `Scheduled Video Call with ${patientName}`,
      text: `Dear Dr. ${doctorName},\n\nYou have a scheduled video call with patient ${patientName}.\n\nScheduled Time: ${formattedTime}\n\nJoin the call here: ${callLink}\n\nThis link will be active at the scheduled time.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #2563eb;">HealthOasis Scheduled Video Call</h2>
          </div>
          <p>Dear Dr. <b>${doctorName}</b>,</p>
          <p>You have a scheduled video call with patient <b>${patientName}</b>.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Scheduled Time:</strong> ${formattedTime}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${callLink}" style="display: inline-block; background-color: #2563eb; color: white; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Join Video Call</a>
          </div>
          <p style="color: #666; font-size: 14px;">Please allow camera and microphone access when prompted. This link will be active at the scheduled time.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 12px; text-align: center;">Regards,<br>The HealthOasis Team</p>
        </div>
      `
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Scheduled video call notification sent to doctor.',
      videoCallId: videoCall.id,
      roomId,
      callLink
    });
  } catch (err) {
    console.error('Error sending scheduled video call notification:', err);
    res.status(500).json({ success: false, message: 'Failed to send scheduled video call notification.' });
  }
});

module.exports = router;
