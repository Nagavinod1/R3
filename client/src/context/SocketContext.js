import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Global event listeners
    socketInstance.on('newEmergencyAlert', (data) => {
      toast.error(`🚨 Emergency Alert: ${data.title}`, {
        duration: 6000,
        icon: '🚨'
      });
    });

    socketInstance.on('bedUpdate', (data) => {
      toast.success(`Bed availability updated`, {
        icon: '🛏️'
      });
    });

    socketInstance.on('bloodInventoryUpdate', (data) => {
      toast.success(`Blood inventory updated: ${data.bloodGroup}`, {
        icon: '🩸'
      });
    });

    socketInstance.on('bloodRequestUpdate', (data) => {
      toast.success(`Your blood request status: ${data.status}`, {
        icon: '📋'
      });
    });

    socketInstance.on('bookingUpdate', (data) => {
      toast.success(`Your bed booking status: ${data.status}`, {
        icon: '🏥'
      });
    });

    socketInstance.on('accountStatus', (data) => {
      if (data.isApproved) {
        toast.success('Your account has been approved!', {
          icon: '✅'
        });
      } else {
        toast.error('Your account approval was rejected', {
          icon: '❌'
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated]);

  const subscribe = (channel) => {
    if (socket) {
      socket.emit('subscribe', channel);
    }
  };

  const unsubscribe = (channel) => {
    if (socket) {
      socket.emit('unsubscribe', channel);
    }
  };

  const emit = (event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    connected,
    isConnected: connected,
    subscribe,
    unsubscribe,
    emit,
    on,
    off
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
