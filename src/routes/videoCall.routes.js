const express = require('express');
const router = express.Router();
const VideoCall = require('../models/videoCall.model');
const Doctor = require('../models/doctor.js');

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
    const { doctorId, patientId, endTime, duration } = req.body;
    
    // Find the active call for the doctor and patient
    const videoCall = await VideoCall.findOne({
      where: {
        doctorId,
        ...(patientId && { patientId }),
        status: 'in-progress',
      },
      order: [['startTime', 'DESC']]
    });
    
    if (!videoCall) {
      return res.status(404).json({ message: 'No active video call found' });
    }
    
    // Update the video call record
    videoCall.endTime = endTime || new Date();
    videoCall.duration = duration || Math.floor((new Date() - videoCall.startTime) / 1000);
    videoCall.status = 'completed';
    await videoCall.save();
    
    res.status(200).json(videoCall);
  } catch (error) {
    console.error('Error ending video call:', error);
    res.status(500).json({ message: 'Failed to end video call session', error: error.message });
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

module.exports = router;
