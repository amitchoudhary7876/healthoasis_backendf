const User = require('../models/user');
const Doctor = require('../models/doctor');
const Appointment = require('../models/appointment');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');

// Create a new video call session
const createVideoCallSession = async (req, res) => {
    try {
        const { doctorId, patientId, appointmentId } = req.body;

        if (!doctorId || !patientId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Doctor ID and Patient ID are required' 
            });
        }

        // Generate a unique room ID (using doctorId and timestamp)
        const roomId = `room-${doctorId}-${Date.now()}`;

        // Update doctor's availability status to 'busy'
        try {
            const doctor = await Doctor.findByPk(doctorId);
            if (doctor) {
                await doctor.update({ availability_status: 'busy' });
                console.log(`Doctor ${doctorId} status set to busy for video call`);
            }
        } catch (err) {
            console.error('Error updating doctor status:', err);
            // Continue with call creation even if status update fails
        }

        // If appointment ID is provided, update the appointment with the room ID
        if (appointmentId) {
            const appointment = await Appointment.findByPk(appointmentId);
            if (appointment) {
                await appointment.update({ videoRoomId: roomId });
            }
        }

        // Return the room ID to be used by frontend
        res.status(201).json({
            success: true,
            roomId,
            message: 'Video call session created successfully'
        });
    } catch (error) {
        console.error('Error creating video call session:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create video call session',
            error: error.message
        });
    }
};

// Get active video call sessions for a doctor
const getDoctorCallSessions = async (req, res) => {
    try {
        const { doctorId } = req.params;
        
        if (!doctorId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Doctor ID is required' 
            });
        }

        // Find appointments with video room IDs for this doctor
        const appointments = await Appointment.findAll({
            where: {
                doctor_id: doctorId,
                videoRoomId: {
                    [Op.ne]: null
                }
            },
            include: [
                { model: User, attributes: ['id', 'name', 'email'] }
            ]
        });

        res.status(200).json({
            success: true,
            callSessions: appointments.map(appointment => ({
                roomId: appointment.videoRoomId,
                patientName: appointment.User?.name || 'Patient',
                appointmentId: appointment.id,
                appointmentDate: appointment.appointment_date
            }))
        });
    } catch (error) {
        console.error('Error fetching doctor call sessions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch doctor call sessions',
            error: error.message
        });
    }
};

// End a video call session
const endVideoCallSession = async (req, res) => {
    try {
        const { roomId } = req.params;
        
        if (!roomId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Room ID is required' 
            });
        }

        // Find and update any appointments with this room ID
        const appointment = await Appointment.findOne({
            where: { videoRoomId: roomId }
        });

        let doctorId = null;
        
        if (appointment) {
            doctorId = appointment.doctor_id;
            await appointment.update({ videoRoomId: null });
        } else {
            // Try to extract doctor ID from room ID format (room-{doctorId}-{timestamp})
            const parts = roomId.split('-');
            if (parts.length >= 2 && parts[0] === 'room') {
                doctorId = parseInt(parts[1]);
            } else if (parts.length >= 2 && parts[0] === 'doctor') {
                doctorId = parseInt(parts[1]);
            }
        }

        // Update doctor's availability status back to 'available'
        if (doctorId) {
            try {
                const doctor = await Doctor.findByPk(doctorId);
                if (doctor) {
                    await doctor.update({ availability_status: 'available' });
                    console.log(`Doctor ${doctorId} status set back to available after video call`);
                }
            } catch (err) {
                console.error('Error updating doctor status:', err);
                // Continue with call ending even if status update fails
            }
        }

        res.status(200).json({
            success: true,
            message: 'Video call session ended successfully'
        });
    } catch (error) {
        console.error('Error ending video call session:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to end video call session',
            error: error.message
        });
    }
};

// Send video call invitation via email
const sendVideoCallInvite = async (req, res) => {
    try {
        const { patientName, patientId } = req.body;

        if (!patientName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Patient name is required' 
            });
        }

        // Generate a unique room ID
        const roomId = `doctor-${patientId}-${Date.now()}`;
         
        // Create the video call link using the deployed frontend URL
        const baseUrl = process.env.FRONTEND_URL || process.env.VIDEO_CALL_URL;
        const callLink = `${baseUrl}/video-call/${roomId}`;

        // Send email invitation to the doctor
        const doctorEmail = 'adishsingla64@gmail.com';
        const emailResult = await emailService.sendVideoCallInvitation(doctorEmail, patientName, callLink);

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send email invitation',
                error: emailResult.error
            });
        }

        res.status(200).json({
            success: true,
            roomId,
            callLink,
            message: 'Video call invitation sent successfully'
        });
    } catch (error) {
        console.error('Error sending video call invitation:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send video call invitation',
            error: error.message
        });
    }
};

module.exports = {
    createVideoCallSession,
    getDoctorCallSessions,
    endVideoCallSession,
    sendVideoCallInvite
};
