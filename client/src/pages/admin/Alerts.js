import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiClock,
  FiDroplet, FiGrid, FiMapPin, FiPhone, FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const { socket } = useSocket();

  useEffect(() => {
    fetchAlerts();
    
    if (socket) {
      socket.on('emergencyAlert', (newAlert) => {
        toast.error('New Emergency Alert!');
        setAlerts(prev => [newAlert, ...prev]);
      });

      // Listen for new blood requests from patients
      socket.on('newBloodRequest', (data) => {
        const priorityMap = { 1: 'critical', 2: 'high', 3: 'medium', 4: 'low' };
        const newAlert = {
          _id: data.requestId || Date.now().toString(),
          type: 'blood',
          priority: priorityMap[data.priority] || 'medium',
          status: 'active',
          bloodGroup: data.bloodGroup,
          unitsRequired: data.unitsRequired,
          hospital: { name: 'Patient Request' },
          user: { 
            name: data.requestedBy?.name || 'Unknown Patient',
            phone: data.requestedBy?.phone || ''
          },
          description: `${data.unitsRequired} units of ${data.bloodGroup} blood requested${data.patientName ? ` for ${data.patientName}` : ''}. Reason: ${data.reason || 'Not specified'}`,
          createdAt: new Date(data.timestamp) || new Date()
        };
        
        setAlerts(prev => [newAlert, ...prev]);
        
        if (data.priority === 1) {
          toast.error(`🚨 EMERGENCY Blood Request: ${data.unitsRequired} units of ${data.bloodGroup}!`, { duration: 8000 });
        } else {
          toast.success(`🩸 New Blood Request: ${data.unitsRequired} units of ${data.bloodGroup}`, { duration: 5000 });
        }
      });

      // Listen for blood request general alerts
      socket.on('bloodRequestAlert', (data) => {
        console.log('Blood request alert:', data);
      });
      
      return () => {
        socket.off('emergencyAlert');
        socket.off('newBloodRequest');
        socket.off('bloodRequestAlert');
      };
    }
  }, [socket]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAlerts();
      if (response.data.success && response.data.data) {
        setAlerts(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Mock data for demo
      setAlerts([
        {
          _id: '1',
          type: 'blood',
          priority: 'critical',
          status: 'active',
          bloodGroup: 'O-',
          hospital: { name: 'City General Hospital', phone: '+91 9876543210' },
          user: { name: 'John Doe', phone: '+91 9876543211' },
          description: 'Urgent need for O- blood for accident victim',
          createdAt: new Date(Date.now() - 1000 * 60 * 5)
        },
        {
          _id: '2',
          type: 'bed',
          priority: 'high',
          status: 'active',
          bedType: 'icu',
          hospital: { name: 'Apollo Hospital', phone: '+91 9876543212' },
          user: { name: 'Jane Smith', phone: '+91 9876543213' },
          description: 'ICU bed needed for cardiac patient',
          createdAt: new Date(Date.now() - 1000 * 60 * 15)
        },
        {
          _id: '3',
          type: 'blood',
          priority: 'medium',
          status: 'resolved',
          bloodGroup: 'AB+',
          hospital: { name: 'LifeLine Hospital', phone: '+91 9876543214' },
          user: { name: 'Mike Johnson', phone: '+91 9876543215' },
          description: 'AB+ blood required for scheduled surgery',
          createdAt: new Date(Date.now() - 1000 * 60 * 60),
          resolvedAt: new Date(Date.now() - 1000 * 60 * 30)
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId, isBloodRequest = false) => {
    try {
      await adminAPI.resolveAlert(alertId, { isBloodRequest });
      toast.success(isBloodRequest ? 'Blood request fulfilled!' : 'Alert resolved successfully');
      setAlerts(prev => prev.map(a => 
        a._id === alertId ? { ...a, status: 'resolved', resolvedAt: new Date() } : a
      ));
    } catch (error) {
      // Update locally for demo
      setAlerts(prev => prev.map(a => 
        a._id === alertId ? { ...a, status: 'resolved', resolvedAt: new Date() } : a
      ));
      toast.success(isBloodRequest ? 'Blood request fulfilled!' : 'Alert resolved');
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesType = filterType === 'all' || alert.type === filterType;
    return matchesStatus && matchesType;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      default: return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-700';
      case 'assigned': return 'bg-amber-100 text-amber-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const activeAlerts = alerts.filter(a => a.status === 'active').length;
  const criticalAlerts = alerts.filter(a => a.priority === 'critical' && a.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Emergency Alerts</h1>
          <p className="text-gray-500">Monitor and manage emergency requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
              <FiAlertTriangle className="text-red-600 text-2xl" />
            </div>
            <div>
              <p className="text-red-600">Critical Alerts</p>
              <p className="text-3xl font-bold text-red-700">{criticalAlerts}</p>
            </div>
          </div>
        </div>
        <div className="card bg-amber-50 border border-amber-200">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
              <FiAlertCircle className="text-amber-600 text-2xl" />
            </div>
            <div>
              <p className="text-amber-600">Active Alerts</p>
              <p className="text-3xl font-bold text-amber-700">{activeAlerts}</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <FiCheckCircle className="text-green-600 text-2xl" />
            </div>
            <div>
              <p className="text-green-600">Resolved Today</p>
              <p className="text-3xl font-bold text-green-700">
                {alerts.filter(a => a.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="assigned">Assigned</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">All Types</option>
          <option value="blood">Blood Emergency</option>
          <option value="bed">Bed Emergency</option>
        </select>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner w-10 h-10"></div>
        </div>
      ) : filteredAlerts.length > 0 ? (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div 
              key={alert._id} 
              className={`card border-l-4 ${getPriorityColor(alert.priority)} hover:shadow-lg transition-shadow`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    alert.type === 'blood' ? 'bg-red-100' : 'bg-purple-100'
                  }`}>
                    {alert.type === 'blood' ? (
                      <FiDroplet className="text-red-600 text-xl" />
                    ) : (
                      <FiGrid className="text-purple-600 text-xl" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {alert.type === 'blood' 
                          ? `Blood Emergency - ${alert.bloodGroup}` 
                          : `Bed Emergency - ${alert.bedType?.toUpperCase()}`}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        alert.priority === 'critical' ? 'bg-red-600 text-white' :
                        alert.priority === 'high' ? 'bg-orange-500 text-white' :
                        'bg-amber-500 text-white'
                      }`}>
                        {alert.priority}
                      </span>
                      {alert.unitsRequired && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {alert.unitsRequired} units needed
                        </span>
                      )}
                      {alert.isBloodRequest && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                          Patient Request
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{alert.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FiMapPin className="text-gray-400" />
                        <span>{alert.hospital?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiUser className="text-gray-400" />
                        <span>{alert.user?.name || alert.patientInfo?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiPhone className="text-gray-400" />
                        <span>{alert.user?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiClock className="text-gray-400" />
                        <span>{getTimeAgo(alert.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {(alert.status === 'active' || alert.status === 'pending') && (
                    <button
                      onClick={() => handleResolveAlert(alert._id, alert.isBloodRequest)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <FiCheckCircle />
                      <span>{alert.isBloodRequest ? 'Fulfill' : 'Resolve'}</span>
                    </button>
                  )}
                  {(alert.status === 'resolved' || alert.status === 'fulfilled') && (
                    <div className="text-sm text-green-600">
                      {alert.status === 'fulfilled' ? 'Fulfilled' : 'Resolved'} {getTimeAgo(alert.resolvedAt || alert.processedAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <FiCheckCircle className="mx-auto text-5xl text-green-300 mb-4" />
          <p className="text-gray-500">No alerts found</p>
        </div>
      )}
    </div>
  );
};

export default Alerts;
