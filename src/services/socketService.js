// Socket.io service for handling real-time communication
const Doctor = require('../models/doctor');

const socketService = (io) => {
    // Store active users and their socket IDs
    const activeUsers = new Map();
    
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        
        // Handle room joining for video calls
        socket.on('join-room', async (data) => {
            try {
                const { roomId, userInfo } = data;
                
                if (!roomId) {
                    socket.emit('error', { message: 'Room ID is required' });
                    return;
                }
                
                // Join the socket room
                socket.join(roomId);
                
                // Check if this is a doctor joining
                let doctorId = null;
                if (userInfo && userInfo.role === 'doctor' && userInfo.id) {
                    doctorId = userInfo.id;
                } else {
                    // Try to extract doctor ID from room ID format (room-{doctorId}-{timestamp} or doctor-{doctorId}-{timestamp})
                    const parts = roomId.split('-');
                    if (parts.length >= 2) {
                        if (parts[0] === 'room') {
                            doctorId = parseInt(parts[1]);
                        } else if (parts[0] === 'doctor') {
                            doctorId = parseInt(parts[1]);
                        }
                    }
                }
                
                // Update doctor status to busy if a doctor is joining
                if (doctorId) {
                    try {
                        const doctor = await Doctor.findByPk(doctorId);
                        if (doctor) {
                            await doctor.update({ availability_status: 'busy' });
                            console.log(`Doctor ${doctorId} status set to busy (socket join)`);
                        }
                    } catch (err) {
                        console.error('Error updating doctor status on join:', err);
                    }
                }
                
                // Add user to active users with doctor ID if applicable
                activeUsers.set(socket.id, {
                    roomId,
                    userInfo,
                    doctorId
                });
                
                // Notify other users in the room
                socket.to(roomId).emit('user-joined', {
                    socketId: socket.id,
                    userInfo
                });
                
                // Send list of existing users in the room
                const roomSockets = await io.in(roomId).fetchSockets();
                const usersInRoom = roomSockets
                    .filter(s => s.id !== socket.id)
                    .map(s => {
                        const user = activeUsers.get(s.id);
                        return {
                            socketId: s.id,
                            userInfo: user?.userInfo || { name: 'Unknown User' }
                        };
                    });
                
                socket.emit('room-users', usersInRoom);
                
                console.log(`User joined room ${roomId}: ${socket.id}`);
            } catch (error) {
                console.error('Error in join-room event:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });
        
        // Handle WebRTC signaling
        socket.on('signal', (data) => {
            const { to, signal, from } = data;
            
            if (!to || !signal) {
                socket.emit('error', { message: 'Invalid signaling data' });
                return;
            }
            
            // Forward the signal to the target user
            io.to(to).emit('signal', {
                from: from || socket.id,
                signal
            });
        });
        
        // Handle room leaving
        socket.on('leave-room', async () => {
            const userSession = activeUsers.get(socket.id);
            
            if (userSession) {
                const { roomId, doctorId } = userSession;
                
                // Leave the socket room
                socket.leave(roomId);
                
                // Update doctor status back to available if this was a doctor
                if (doctorId) {
                    try {
                        const doctor = await Doctor.findByPk(doctorId);
                        if (doctor) {
                            await doctor.update({ availability_status: 'available' });
                            console.log(`Doctor ${doctorId} status set back to available (socket leave)`);
                        }
                    } catch (err) {
                        console.error('Error updating doctor status on leave:', err);
                    }
                }
                
                // Notify other users
                socket.to(roomId).emit('user-left', {
                    socketId: socket.id,
                    userInfo: userSession.userInfo
                });
                
                // Remove from active users
                activeUsers.delete(socket.id);
                
                console.log(`User left room ${roomId}: ${socket.id}`);
            }
        });
        
        // Handle call end
        socket.on('end-call', (data) => {
            const { roomId } = data;
            
            if (roomId) {
                // Notify all users in the room
                io.to(roomId).emit('call-ended', {
                    socketId: socket.id
                });
                
                console.log(`Call ended in room ${roomId} by ${socket.id}`);
            }
        });
        
        // Handle disconnection
        socket.on('disconnect', async () => {
            const userSession = activeUsers.get(socket.id);
            
            if (userSession) {
                const { roomId, doctorId } = userSession;
                
                // Update doctor status back to available if this was a doctor
                if (doctorId) {
                    try {
                        const doctor = await Doctor.findByPk(doctorId);
                        if (doctor) {
                            await doctor.update({ availability_status: 'available' });
                            console.log(`Doctor ${doctorId} status set back to available (socket disconnect)`);
                        }
                    } catch (err) {
                        console.error('Error updating doctor status on disconnect:', err);
                    }
                }
                
                // Notify other users
                socket.to(roomId).emit('user-left', {
                    socketId: socket.id,
                    userInfo: userSession.userInfo
                });
                
                // Remove from active users
                activeUsers.delete(socket.id);
                
                console.log(`User disconnected from room ${roomId}: ${socket.id}`);
            }
            
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};

module.exports = socketService;
