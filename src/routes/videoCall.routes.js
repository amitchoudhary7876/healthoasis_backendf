const express = require('express');
const router = express.Router();
const {
    createVideoCallSession,
    getDoctorCallSessions,
    endVideoCallSession,
    sendVideoCallInvite
} = require('../controllers/videoCallController');
const auth = require('../middleware/auth');

// Create a new video call session
router.post('/', auth, createVideoCallSession);

// Get active video call sessions for a doctor
router.get('/doctor/:doctorId', auth, getDoctorCallSessions);

// End a video call session
router.delete('/:roomId', auth, endVideoCallSession);

// Send video call invitation via email
router.post('/invite', sendVideoCallInvite);

module.exports = router;
