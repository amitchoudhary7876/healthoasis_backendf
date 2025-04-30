const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const VideoCall = require('../models/videoCall.model');
const Doctor = require('../models/doctor.js');
const Patient = require('../models/patient.js');
const { sendMail } = require('../utils');
require('dotenv').config();

// Use the deployed Vercel frontend URL for video calls
const frontendUrl = 'https://healthoasis-pc6bigdw7-amitchoudhary7876s-projects.vercel.app';

// Create a new video call session
router.post('/', async (req, res) => {
  try {
    const { doctorId, patientId, startTime } = req.body;
    
    // Check if doctor exists
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Create a new video call session
    const videoCall = await VideoCall.create({
      doctorId,
      patientId,
      startTime: startTime || new Date(),
      status: 'in-progress',
    });
    
    res.status(201).json(videoCall);
  } catch (error) {
    console.error('Error creating video call:', error);
    res.status(500).json({ message: 'Failed to create video call session', error: error.message });
  }
});

// End a video call session
router.post('/end', async (req, res) => {
  try {
    console.log('Received request to end video call:', req.body);
    const { roomId, endTime, duration } = req.body;
    
    if (!roomId) {
      console.error('Missing roomId in end call request');
      return res.status(400).json({ success: false, message: 'Room ID is required.' });
    }
    
    // Find the video call by roomId
    const videoCall = await VideoCall.findOne({ where: { roomId } });
    
    if (!videoCall) {
      console.warn(`Video call with roomId ${roomId} not found`);
      // Create a record anyway to ensure we have a record of the call
      try {
        const newVideoCall = await VideoCall.create({
          roomId,
          startTime: new Date(Date.now() - (duration * 1000) || 0),
          endTime: endTime || new Date(),
          duration: duration || 0,
          status: 'completed',
          doctorId: 1, // Default doctor ID
          initiatedBy: 'unknown'
        });
        console.log(`Created new video call record for ended call: ${newVideoCall.id}`);
        return res.status(201).json({ 
          success: true, 
          message: 'Video call record created and marked as completed.', 
          videoCallId: newVideoCall.id 
        });
      } catch (createErr) {
        console.error('Error creating video call record:', createErr);
        return res.status(500).json({ success: false, message: 'Failed to create video call record.' });
      }
    }
    
    // Update the video call record
    videoCall.endTime = endTime || new Date();
    videoCall.duration = duration || 0;
    videoCall.status = 'completed';
    
    await videoCall.save();
    console.log(`Video call ${videoCall.id} marked as completed`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Video call ended successfully.',
      videoCallId: videoCall.id
    });
  } catch (err) {
    console.error('Error ending video call:', err);
    // Provide more specific error messages
    let errorMessage = 'Failed to end video call.';
    if (err.name === 'SequelizeValidationError') {
      errorMessage = 'Invalid data provided for ending video call.';
    }
    res.status(500).json({ success: false, message: errorMessage, error: err.message });
  }
});

// Get video call history for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const calls = await VideoCall.findAll({
      where: { doctorId },
      order: [['startTime', 'DESC']]
    });
    
    res.status(200).json(calls);
  } catch (error) {
    console.error('Error fetching doctor video call history:', error);
    res.status(500).json({ message: 'Failed to fetch video call history', error: error.message });
  }
});

// Get video call history for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const calls = await VideoCall.findAll({
      where: { patientId },
      order: [['startTime', 'DESC']]
    });
    
    res.status(200).json(calls);
  } catch (error) {
    console.error('Error fetching patient video call history:', error);
    res.status(500).json({ message: 'Failed to fetch video call history', error: error.message });
  }
});

// Get details of a specific video call
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const videoCall = await VideoCall.findByPk(id);
    
    if (!videoCall) {
      return res.status(404).json({ message: 'Video call not found' });
    }
    
    res.status(200).json(videoCall);
  } catch (error) {
    console.error('Error fetching video call details:', error);
    res.status(500).json({ message: 'Failed to fetch video call details', error: error.message });
  }
});

// Generate and send a video call invitation via email
router.post('/invite', async (req, res) => {
  try {
    const { doctorId, patientId, scheduledTime, initiatedBy } = req.body;
    
    // Generate a unique room ID for ZegoCloud
    const roomId = uuidv4();
    
    // Get doctor and patient information
    const doctor = await Doctor.findByPk(doctorId);
    const patient = await Patient.findByPk(patientId);
    
    if (!doctor || !patient) {
      return res.status(404).json({ 
        success: false, 
        message: !doctor ? 'Doctor not found' : 'Patient not found' 
      });
    }
    
    // Create a new video call record
    const videoCall = await VideoCall.create({
      doctorId,
      patientId,
      roomId,
      scheduledTime: scheduledTime || new Date(),
      status: 'scheduled',
      initiatedBy
    });
    
    // Generate video call URL with the room ID
    const videoCallLink = `${frontendUrl}/video-call/${roomId}`;
    
    // Determine recipient based on who initiated the call
    const recipient = initiatedBy === 'doctor' ? {
      email: patient.email,
      name: `${patient.firstName} ${patient.lastName}`,
      role: 'Patient'
    } : {
      email: doctor.email,
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      role: 'Doctor'
    };
    
    const sender = initiatedBy === 'doctor' ? {
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      role: 'Doctor'
    } : {
      name: `${patient.firstName} ${patient.lastName}`,
      role: 'Patient'
    };
    
    // Format scheduled time
    const formattedTime = new Date(scheduledTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Send email invitation
    await sendMail({
      to: recipient.email,
      subject: `HealthOasis Video Call Invitation from ${sender.name}`,
      text: `Dear ${recipient.name},\n\nYou have been invited to a video call by ${sender.name} on HealthOasis.\n\nScheduled Time: ${formattedTime}\n\nJoin the call here: ${videoCallLink}\n\nThis link will be active at the scheduled time.\n\nRegards,\nThe HealthOasis Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #2563eb;">HealthOasis Video Call Invitation</h2>
          </div>
          <p>Dear <b>${recipient.name}</b>,</p>
          <p>You have been invited to a video call by <b>${sender.name}</b> on HealthOasis.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Scheduled Time:</strong> ${formattedTime}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${videoCallLink}" style="display: inline-block; background-color: #2563eb; color: white; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Join Video Call</a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will be active at the scheduled time. Please allow camera and microphone access when prompted.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 12px; text-align: center;">Regards,<br>The HealthOasis Team</p>
        </div>
      `
    });
    
    res.status(200).json({
      success: true,
      message: `Video call invitation sent to ${recipient.role.toLowerCase()} ${recipient.name}`,
      videoCallId: videoCall.id,
      roomId,
      videoCallLink
    });
  } catch (error) {
    console.error('Error sending video call invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send video call invitation',
      error: error.message
    });
  }
});

module.exports = router;
