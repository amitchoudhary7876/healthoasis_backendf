const express = require('express');
const router = express.Router();
const videoCallController = require('../controllers/videoCallController');

// Create a video call session
router.post('/create', videoCallController.createVideoCallSession);

// Get active video call sessions for a doctor
router.get('/doctor/:doctorId', videoCallController.getDoctorCallSessions);

// End a video call session
router.delete('/:roomId', videoCallController.endVideoCallSession);

// Send video call invitation
router.post('/invite', videoCallController.sendVideoCallInvite);

module.exports = router;
