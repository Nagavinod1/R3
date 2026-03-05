const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user) {
          socket.user = user;
          socket.userId = user._id.toString();
          socket.userRole = user.role;
        }
      }
      next();
    } catch (error) {
      // Allow connection even without auth for public features
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join role-based rooms
    if (socket.user) {
      // Personal room for notifications
      socket.join(`user_${socket.userId}`);
      
      // Role-based rooms
      socket.join(socket.userRole);
      
      // Hospital room if staff
      if (socket.user.hospital) {
        socket.join(`hospital_${socket.user.hospital}`);
      }

      console.log(`👤 User ${socket.user.name} (${socket.userRole}) joined rooms`);
    }

    // Subscribe to specific updates
    socket.on('subscribe', (channel) => {
      if (channel) {
        socket.join(channel);
        console.log(`📢 Socket ${socket.id} subscribed to ${channel}`);
      }
    });

    // Unsubscribe from updates
    socket.on('unsubscribe', (channel) => {
      if (channel) {
        socket.leave(channel);
        console.log(`🔕 Socket ${socket.id} unsubscribed from ${channel}`);
      }
    });

    // Handle bed availability updates
    socket.on('requestBedUpdate', async (hospitalId) => {
      const Bed = require('../models/Bed');
      try {
        const stats = await Bed.getBedStats(hospitalId);
        socket.emit('bedStats', { hospitalId, stats });
      } catch (error) {
        socket.emit('error', { message: 'Error fetching bed stats' });
      }
    });

    // Handle blood inventory updates
    socket.on('requestBloodUpdate', async (hospitalId) => {
      const BloodUnit = require('../models/BloodUnit');
      try {
        const summary = await BloodUnit.getInventorySummary(hospitalId);
        socket.emit('bloodInventory', { hospitalId, summary });
      } catch (error) {
        socket.emit('error', { message: 'Error fetching blood inventory' });
      }
    });

    // Handle emergency alerts
    socket.on('emergencyAlert', async (data) => {
      if (socket.userRole === 'staff' || socket.userRole === 'admin') {
        const EmergencyAlert = require('../models/EmergencyAlert');
        try {
          const alert = await EmergencyAlert.create({
            ...data,
            createdBy: socket.userId
          });
          
          // Broadcast to all connected clients
          io.emit('newEmergencyAlert', {
            alertId: alert._id,
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            description: alert.description
          });
        } catch (error) {
          socket.emit('error', { message: 'Error creating alert' });
        }
      }
    });

    // Handle chat messages (for AI chatbot)
    socket.on('chatMessage', async (data) => {
      const { message, context } = data;
      
      // Emit typing indicator
      socket.emit('aiTyping', { isTyping: true });
      
      try {
        const axios = require('axios');
        const response = await axios.post(`${process.env.PYTHON_AI_URL}/chat`, {
          message,
          context,
          userId: socket.userId
        }, { timeout: 10000 });

        socket.emit('aiResponse', {
          message: response.data.response,
          timestamp: new Date()
        });
      } catch (error) {
        // Fallback response
        socket.emit('aiResponse', {
          message: "I'm here to help with healthcare queries. You can ask about first aid, finding hospitals, blood availability, or emergency assistance.",
          timestamp: new Date(),
          isError: true
        });
      }
      
      socket.emit('aiTyping', { isTyping: false });
    });

    // Track active users (admin only)
    socket.on('getActiveUsers', () => {
      if (socket.userRole === 'admin') {
        const rooms = io.sockets.adapter.rooms;
        const activeUsers = {
          total: io.sockets.sockets.size,
          admins: rooms.get('admin')?.size || 0,
          staff: rooms.get('staff')?.size || 0,
          users: rooms.get('user')?.size || 0
        };
        socket.emit('activeUsers', activeUsers);
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} - Reason: ${reason}`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Utility function to emit to specific user
  io.emitToUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  // Utility function to emit to role
  io.emitToRole = (role, event, data) => {
    io.to(role).emit(event, data);
  };

  // Utility function to emit to hospital
  io.emitToHospital = (hospitalId, event, data) => {
    io.to(`hospital_${hospitalId}`).emit(event, data);
  };

  console.log('📡 Socket.IO handler initialized');
};
