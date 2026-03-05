import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { adminAPI, userAPI } from '../services/api';
import { 
  FiBell, FiX, FiAlertTriangle, FiDroplet, FiGrid, 
  FiUserCheck, FiCheck, FiClock, FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (socket) {
      // Emergency alerts
      socket.on('newEmergencyAlert', (alert) => {
        const newNotification = {
          _id: alert.alertId || Date.now().toString(),
          type: 'emergency',
          title: `Emergency: ${alert.title || alert.type}`,
          message: alert.description || `${alert.type} emergency at ${alert.hospitalName || 'hospital'}`,
          severity: alert.severity || 'high',
          read: false,
          createdAt: new Date(),
          link: isAdmin ? '/admin/alerts' : '/staff/dashboard'
        };
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.error(`🚨 ${newNotification.title}`, { duration: 5000 });
      });

      // Staff approval notifications
      socket.on('staffApprovalRequest', (data) => {
        if (isAdmin) {
          const newNotification = {
            _id: Date.now().toString(),
            type: 'approval',
            title: 'New Staff Registration',
            message: `${data.name} has requested staff access`,
            read: false,
            createdAt: new Date(),
            link: '/admin/staff'
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast('New staff registration: ' + data.name, { icon: '👨‍⚕️' });
        }
      });

      // Blood request notifications
      socket.on('bloodRequestUpdate', (data) => {
        const newNotification = {
          _id: Date.now().toString(),
          type: 'blood',
          title: 'Blood Request Update',
          message: data.message || `Blood request ${data.status || 'updated'}`,
          read: false,
          createdAt: new Date(),
          link: isStaff ? '/staff/blood-requests' : '/user/requests'
        };
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      // Bed booking notifications
      socket.on('bedBookingUpdate', (data) => {
        const newNotification = {
          _id: Date.now().toString(),
          type: 'bed',
          title: 'Bed Booking Update',
          message: data.message || `Bed booking ${data.status || 'updated'}`,
          read: false,
          createdAt: new Date(),
          link: '/user/requests'
        };
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      // Low stock alerts
      socket.on('lowStockAlert', (data) => {
        if (isAdmin || isStaff) {
          const newNotification = {
            _id: Date.now().toString(),
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${data.bloodGroup || 'Blood'} stock is running low`,
            read: false,
            createdAt: new Date(),
            link: isAdmin ? '/admin/blood' : '/staff/blood-inventory'
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.warning(`⚠️ ${newNotification.message}`);
        }
      });

      // New blood request alerts (for admin and staff)
      socket.on('newBloodRequest', (data) => {
        if (isAdmin || isStaff) {
          const priorityLabels = { 1: 'EMERGENCY', 2: 'High', 3: 'Normal', 4: 'Scheduled' };
          const priorityColors = { 1: '🔴', 2: '🟠', 3: '🟡', 4: '🟢' };
          const newNotification = {
            _id: data.requestId || Date.now().toString(),
            type: 'blood',
            title: `${priorityColors[data.priority] || '🩸'} Blood Request: ${data.bloodGroup}`,
            message: `${data.unitsRequired} units of ${data.bloodGroup} requested by ${data.requestedBy?.name || 'Patient'}${data.patientName ? ` for ${data.patientName}` : ''}`,
            severity: data.priority === 1 ? 'critical' : data.priority === 2 ? 'high' : 'normal',
            read: false,
            createdAt: new Date(),
            link: isAdmin ? '/admin/blood' : '/staff/blood-requests',
            data: data
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification
          if (data.priority === 1) {
            toast.error(`🚨 EMERGENCY: ${data.unitsRequired} units of ${data.bloodGroup} needed immediately!`, { duration: 8000 });
          } else {
            toast.success(`🩸 New blood request: ${data.unitsRequired} units of ${data.bloodGroup}`, { duration: 5000 });
          }
        }
      });

      // Blood request alert for dashboard updates
      socket.on('bloodRequestAlert', (data) => {
        if (isAdmin || isStaff) {
          console.log('Blood request alert received:', data);
          // This is handled by the newBloodRequest listener above
        }
      });

      return () => {
        socket.off('newEmergencyAlert');
        socket.off('staffApprovalRequest');
        socket.off('bloodRequestUpdate');
        socket.off('bedBookingUpdate');
        socket.off('lowStockAlert');
        socket.off('newBloodRequest');
        socket.off('bloodRequestAlert');
      };
    }
  }, [socket, isAdmin, isStaff]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      if (isAdmin) {
        // Fetch alerts and pending approvals for admin
        const [alertsRes, staffRes] = await Promise.all([
          adminAPI.getAlerts({ status: 'active' }).catch(() => ({ data: { data: [] } })),
          adminAPI.getPendingStaff().catch(() => ({ data: { data: [] } }))
        ]);

        const alerts = (alertsRes.data?.data || []).map(alert => ({
          _id: alert._id,
          type: 'emergency',
          title: `Emergency: ${alert.type || 'Alert'}`,
          message: alert.description || alert.title,
          severity: alert.priority || 'high',
          read: false,
          createdAt: alert.createdAt,
          link: '/admin/alerts'
        }));

        const pendingStaff = (staffRes.data?.data || []).map(staff => ({
          _id: staff._id,
          type: 'approval',
          title: 'Pending Staff Approval',
          message: `${staff.name} (${staff.email}) awaiting approval`,
          read: false,
          createdAt: staff.createdAt,
          link: '/admin/staff'
        }));

        const allNotifications = [...alerts, ...pendingStaff].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setNotifications(allNotifications);
        setUnreadCount(allNotifications.filter(n => !n.read).length);
      } else {
        // Fetch user notifications
        const response = await userAPI.getNotifications().catch(() => ({ data: { data: [], unreadCount: 0 } }));
        if (response.data?.data) {
          setNotifications(response.data.data);
          setUnreadCount(response.data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Set some demo notifications
      setNotifications([
        {
          _id: '1',
          type: 'info',
          title: 'Welcome!',
          message: 'Welcome to Hospital Management System',
          read: true,
          createdAt: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    try {
      if (!isAdmin) {
        await userAPI.markAllRead().catch(() => {});
      }
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'emergency':
        return <FiAlertTriangle className="text-red-500" />;
      case 'blood':
        return <FiDroplet className="text-red-500" />;
      case 'bed':
        return <FiGrid className="text-blue-500" />;
      case 'approval':
        return <FiUserCheck className="text-amber-500" />;
      case 'warning':
        return <FiAlertTriangle className="text-amber-500" />;
      default:
        return <FiBell className="text-gray-500" />;
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner w-6 h-6"></div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{notification.message}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <FiClock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-400">{getTimeAgo(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <FiBell size={32} className="mb-2 text-gray-300" />
                <p className="text-sm">No notifications</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate(isAdmin ? '/admin/alerts' : '/user/requests');
                }}
                className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center space-x-1"
              >
                <span>View all notifications</span>
                <FiExternalLink size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
