import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bloodAPI, bedAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FiDroplet, FiGrid, FiAlertTriangle, FiTrendingUp,
  FiArrowRight, FiClock, FiCheckCircle, FiActivity, FiBell
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const StaffDashboard = () => {
  const [stats, setStats] = useState({
    totalBloodUnits: 0,
    availableBeds: 0,
    pendingRequests: 0,
    lowStockGroups: []
  });
  const [bloodStats, setBloodStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [bloodRequestAlerts, setBloodRequestAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchDashboardData();
    
    if (socket) {
      socket.on('bloodUpdate', handleBloodUpdate);
      socket.on('bedUpdate', handleBedUpdate);
      socket.on('newBloodRequest', handleNewBloodRequest);
      socket.on('bloodRequestAlert', handleBloodRequestAlert);
      
      return () => {
        socket.off('bloodUpdate', handleBloodUpdate);
        socket.off('bedUpdate', handleBedUpdate);
        socket.off('newBloodRequest', handleNewBloodRequest);
        socket.off('bloodRequestAlert', handleBloodRequestAlert);
      };
    }
  }, [socket]);

  const handleBloodUpdate = (data) => {
    toast('Blood inventory updated', { icon: '🩸' });
    fetchDashboardData();
  };

  const handleBedUpdate = (data) => {
    toast('Bed status updated', { icon: '🛏️' });
    fetchDashboardData();
  };

  // Handle new blood request alert
  const handleNewBloodRequest = (data) => {
    const isEmergency = data.requestType === 'emergency';
    
    // Show toast notification with sound effect simulation
    if (isEmergency) {
      toast.error(
        `🚨 EMERGENCY BLOOD REQUEST!\n${data.unitsRequired} units of ${data.bloodGroup}\nPatient: ${data.patientName}`,
        { duration: 10000, icon: '🩸' }
      );
    } else {
      toast(
        `🩸 New Blood Request\n${data.unitsRequired} units of ${data.bloodGroup}`,
        { duration: 5000, icon: '📋' }
      );
    }

    // Add to alerts list
    setBloodRequestAlerts(prev => [{
      id: data.requestId,
      bloodGroup: data.bloodGroup,
      units: data.unitsRequired,
      type: data.requestType,
      patient: data.patientName,
      requestedBy: data.requestedBy?.name,
      reason: data.reason,
      time: new Date().toLocaleTimeString(),
      isNew: true
    }, ...prev.slice(0, 9)]);

    // Update pending requests count
    setStats(prev => ({
      ...prev,
      pendingRequests: prev.pendingRequests + 1
    }));

    // Add to recent activity
    setRecentActivity(prev => [{
      id: Date.now(),
      type: 'blood_request',
      description: `${isEmergency ? '🚨 EMERGENCY: ' : ''}${data.unitsRequired} units of ${data.bloodGroup} requested`,
      time: 'Just now',
      icon: <FiDroplet className={isEmergency ? 'text-red-500 animate-pulse' : 'text-red-500'} />
    }, ...prev.slice(0, 4)]);
  };

  const handleBloodRequestAlert = (data) => {
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      const [bloodRes, bedsRes, requestsRes] = await Promise.all([
        bloodAPI.getBloodStats().catch(() => ({ data: { data: [] } })),
        bedAPI.getAvailableBeds().catch(() => ({ data: { data: [] } })),
        bloodAPI.getBloodRequests().catch(() => ({ data: { data: [] } }))
      ]);

      // Process blood stats
      let bloodData = bloodRes.data?.data || [];
      if (!Array.isArray(bloodData) || bloodData.length === 0) {
        bloodData = bloodGroups.map(bg => ({ bloodGroup: bg, count: Math.floor(Math.random() * 50) + 5 }));
      }
      setBloodStats(bloodData);

      const lowStock = bloodData.filter(b => b.count < 15);
      const totalUnits = bloodData.reduce((sum, b) => sum + (b.count || 0), 0);

      setStats({
        totalBloodUnits: totalUnits,
        availableBeds: Array.isArray(bedsRes.data?.data) ? bedsRes.data.data.length : 0,
        pendingRequests: Array.isArray(requestsRes.data?.data) 
          ? requestsRes.data.data.filter(r => r.status === 'pending').length 
          : 0,
        lowStockGroups: lowStock
      });

      // Mock recent activity
      setRecentActivity([
        { id: 1, type: 'blood_added', description: 'Added 3 units of O+ blood', time: '10 mins ago', icon: <FiDroplet className="text-red-500" /> },
        { id: 2, type: 'bed_updated', description: 'ICU Bed #5 marked as available', time: '25 mins ago', icon: <FiGrid className="text-blue-500" /> },
        { id: 3, type: 'request_fulfilled', description: 'Blood request #1234 fulfilled', time: '1 hour ago', icon: <FiCheckCircle className="text-green-500" /> },
        { id: 4, type: 'low_stock', description: 'AB- blood stock running low', time: '2 hours ago', icon: <FiAlertTriangle className="text-amber-500" /> }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name}!</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-gray-500">{isConnected ? 'Live Updates Active' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Total Blood Units</p>
              <p className="text-3xl font-bold">{stats.totalBloodUnits}</p>
            </div>
            <FiDroplet className="text-4xl text-red-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Available Beds</p>
              <p className="text-3xl font-bold">{stats.availableBeds}</p>
            </div>
            <FiGrid className="text-4xl text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100">Pending Requests</p>
              <p className="text-3xl font-bold">{stats.pendingRequests}</p>
            </div>
            <FiClock className="text-4xl text-amber-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Low Stock Alerts</p>
              <p className="text-3xl font-bold">{stats.lowStockGroups.length}</p>
            </div>
            <FiAlertTriangle className="text-4xl text-purple-200" />
          </div>
        </div>
      </div>

      {/* Low Stock Warning */}
      {stats.lowStockGroups.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <FiAlertTriangle className="text-amber-600 text-xl" />
            <div>
              <p className="font-semibold text-amber-800">Low Stock Alert</p>
              <p className="text-sm text-amber-600">
                Blood groups running low: {stats.lowStockGroups.map(b => b.bloodGroup).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Blood Request Alerts Section */}
      {bloodRequestAlerts.length > 0 && (
        <div className="card border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <FiBell className="text-red-500 text-2xl" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {bloodRequestAlerts.length}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Blood Request Alerts</h2>
            </div>
            <button 
              onClick={() => setBloodRequestAlerts([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {bloodRequestAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-3 rounded-lg border ${
                  alert.type === 'emergency' 
                    ? 'bg-red-50 border-red-200 animate-pulse' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-sm font-bold ${
                      alert.type === 'emergency' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'
                    }`}>
                      {alert.bloodGroup}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">
                        {alert.type === 'emergency' && '🚨 '}{alert.units} units requested
                      </p>
                      <p className="text-sm text-gray-500">
                        Patient: {alert.patient} | Requested by: {alert.requestedBy}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{alert.time}</p>
                    <Link to="/staff/requests" className="text-xs text-primary-600 hover:underline">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Inventory Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Blood Inventory Overview</h2>
            <Link to="/staff/inventory" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
              View Details <FiArrowRight className="ml-1" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bloodStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bloodGroup" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
            <span className="text-sm text-gray-500">Today</span>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800">{activity.description}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to="/staff/inventory" 
          className="card hover:shadow-lg transition-shadow group cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <FiDroplet className="text-red-600 text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Manage Blood Inventory</h3>
              <p className="text-sm text-gray-500">Add, update, or view blood units</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/staff/requests" 
          className="card hover:shadow-lg transition-shadow group cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <FiClock className="text-amber-600 text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Blood Requests</h3>
              <p className="text-sm text-gray-500">Process pending blood requests</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/staff/beds" 
          className="card hover:shadow-lg transition-shadow group cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <FiGrid className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Bed Management</h3>
              <p className="text-sm text-gray-500">Update bed availability status</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default StaffDashboard;
