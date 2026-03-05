import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, bloodAPI, bedAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  FiUsers, FiDroplet, FiGrid, FiActivity, FiAlertTriangle, 
  FiTrendingUp, FiClock, FiCheckCircle, FiXCircle, FiArrowRight
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHospitals: 0,
    totalBloodUnits: 0,
    totalBeds: 0,
    availableBeds: 0,
    pendingStaff: 0,
    activeEmergencies: 0,
    bloodRequests: 0
  });
  const [bloodGroupData, setBloodGroupData] = useState([]);
  const [hospitalDistribution, setHospitalDistribution] = useState([]);
  const [pendingStaffList, setPendingStaffList] = useState([]);
  const [recentEmergencies, setRecentEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocket();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  // State for blood request alerts
  const [bloodRequestAlerts, setBloodRequestAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    
    // Real-time updates
    if (socket) {
      socket.on('bedUpdate', handleBedUpdate);
      socket.on('bloodUpdate', handleBloodUpdate);
      socket.on('emergencyAlert', handleEmergencyAlert);
      socket.on('newBloodRequest', handleNewBloodRequest);
      socket.on('bloodRequestAlert', handleBloodRequestAlert);
      socket.on('newBedBooking', handleNewBedBooking);
      
      return () => {
        socket.off('bedUpdate', handleBedUpdate);
        socket.off('bloodUpdate', handleBloodUpdate);
        socket.off('emergencyAlert', handleEmergencyAlert);
        socket.off('newBloodRequest', handleNewBloodRequest);
        socket.off('bloodRequestAlert', handleBloodRequestAlert);
        socket.off('newBedBooking', handleNewBedBooking);
      };
    }
  }, [socket]);

  const handleBedUpdate = (data) => {
    toast('Bed status updated', { icon: '🛏️' });
    fetchDashboardData();
  };

  const handleNewBedBooking = (data) => {
    const isEmergency = data.bookingType === 'emergency';
    if (isEmergency) {
      toast.error(
        `🚨 EMERGENCY Bed Booking! Bed #${data.bedNumber} at ${data.hospitalName || 'Hospital'}\nPatient: ${data.patientName}`,
        { duration: 8000, icon: '🛏️' }
      );
    } else {
      toast.success(
        `🛏️ New Bed Booking: Bed #${data.bedNumber} (${data.ward})\nHospital: ${data.hospitalName || 'N/A'}\nBooked by: ${data.bookedBy || 'User'}`,
        { duration: 6000 }
      );
    }
    fetchDashboardData();
  };

  const handleBloodUpdate = (data) => {
    toast('Blood inventory updated', { icon: '🩸' });
    fetchDashboardData();
  };

  const handleEmergencyAlert = (data) => {
    toast.error('New Emergency Alert!');
    fetchDashboardData();
  };

  // Handle new blood request alert
  const handleNewBloodRequest = (data) => {
    const isEmergency = data.requestType === 'emergency';
    
    // Show toast notification
    if (isEmergency) {
      toast.error(
        `🚨 EMERGENCY: ${data.unitsRequired} units of ${data.bloodGroup} needed!\nPatient: ${data.patientName}`,
        { duration: 10000, icon: '🩸' }
      );
    } else {
      toast.success(
        `🩸 New Blood Request: ${data.unitsRequired} units of ${data.bloodGroup}\nRequested by: ${data.requestedBy?.name}`,
        { duration: 6000 }
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
      time: new Date().toLocaleTimeString(),
      isNew: true
    }, ...prev.slice(0, 9)]); // Keep last 10 alerts

    // Refresh dashboard data
    fetchDashboardData();
  };

  const handleBloodRequestAlert = (data) => {
    // Update stats
    setStats(prev => ({
      ...prev,
      bloodRequests: prev.bloodRequests + 1
    }));
  };

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, bloodStatsRes, pendingStaffRes] = await Promise.all([
        adminAPI.getDashboardStats().catch(() => ({ data: { success: false, data: {} } })),
        bloodAPI.getBloodStats().catch(() => ({ data: { data: [] } })),
        adminAPI.getPendingStaff().catch(() => ({ data: { data: [] } }))
      ]);

      if (dashboardRes.data?.success && dashboardRes.data?.data) {
        const dashData = dashboardRes.data.data;
        setStats({
          totalUsers: dashData.stats?.totalUsers || 0,
          totalHospitals: dashData.stats?.totalHospitals || 0,
          totalBloodUnits: dashData.bloodInventory?.totalUnits || 0,
          totalBeds: dashData.stats?.totalBeds || 0,
          availableBeds: dashData.stats?.availableBeds || 0,
          pendingStaff: dashData.stats?.pendingStaff || 0,
          activeEmergencies: dashData.stats?.activeAlerts || 0,
          bloodRequests: dashData.stats?.bloodRequestsCount || 0
        });

        // Set hospital distribution from dashboard data
        if (dashData.hospitalDistribution && dashData.hospitalDistribution.length > 0) {
          setHospitalDistribution(dashData.hospitalDistribution.map(h => ({
            name: h._id || 'Unknown',
            beds: h.count || 0
          })));
        }
      } else {
        // Use mock data if API fails
        setStats({
          totalUsers: 125,
          totalHospitals: 5,
          totalBloodUnits: 185,
          totalBeds: 810,
          availableBeds: 248,
          pendingStaff: 3,
          activeEmergencies: 2,
          bloodRequests: 8
        });
      }

      if (bloodStatsRes.data?.data) {
        const bloodData = bloodStatsRes.data.data;
        setBloodGroupData(Array.isArray(bloodData) ? bloodData.map(b => ({
          bloodGroup: b.bloodGroup || b._id,
          count: b.units || b.totalUnits || b.count || 0
        })) : [
          { bloodGroup: 'A+', count: 45 },
          { bloodGroup: 'A-', count: 12 },
          { bloodGroup: 'B+', count: 38 },
          { bloodGroup: 'B-', count: 8 },
          { bloodGroup: 'AB+', count: 15 },
          { bloodGroup: 'AB-', count: 5 },
          { bloodGroup: 'O+', count: 52 },
          { bloodGroup: 'O-', count: 10 }
        ]);
      } else {
        setBloodGroupData([
          { bloodGroup: 'A+', count: 45 },
          { bloodGroup: 'A-', count: 12 },
          { bloodGroup: 'B+', count: 38 },
          { bloodGroup: 'B-', count: 8 },
          { bloodGroup: 'AB+', count: 15 },
          { bloodGroup: 'AB-', count: 5 },
          { bloodGroup: 'O+', count: 52 },
          { bloodGroup: 'O-', count: 10 }
        ]);
      }

      // Set default hospital distribution if not set
      if (hospitalDistribution.length === 0) {
        setHospitalDistribution([
          { name: 'City Hospital', beds: 150 },
          { name: 'General Hospital', beds: 200 },
          { name: 'Apollo Care', beds: 120 },
          { name: 'LifeLine Hospital', beds: 180 },
          { name: 'Medicare Center', beds: 90 }
        ]);
      }

      if (pendingStaffRes.data?.data) {
        setPendingStaffList(pendingStaffRes.data.data.slice(0, 5));
      }

      setRecentEmergencies([
        { id: 1, type: 'Blood Emergency', hospital: 'City Hospital', bloodGroup: 'O-', time: '5 mins ago', status: 'active' },
        { id: 2, type: 'Bed Request', hospital: 'General Hospital', bedType: 'ICU', time: '15 mins ago', status: 'active' },
        { id: 3, type: 'Blood Emergency', hospital: 'Apollo Care', bloodGroup: 'AB-', time: '1 hour ago', status: 'resolved' }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStaff = async (staffId) => {
    try {
      await adminAPI.approveStaff(staffId);
      toast.success('Staff approved successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to approve staff');
    }
  };

  const handleRejectStaff = async (staffId) => {
    try {
      await adminAPI.rejectStaff(staffId);
      toast.success('Staff rejected');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to reject staff');
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
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's what's happening</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-gray-500">{isConnected ? 'Real-time Active' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={<FiUsers />}
          color="bg-blue-500"
          trend="+12%"
        />
        <StatCard
          title="Total Hospitals"
          value={stats.totalHospitals || 0}
          icon={<FiActivity />}
          color="bg-green-500"
          trend="+3"
        />
        <StatCard
          title="Blood Units"
          value={stats.totalBloodUnits || 0}
          icon={<FiDroplet />}
          color="bg-red-500"
          trend="+25"
        />
        <StatCard
          title="Available Beds"
          value={`${stats.availableBeds || 0}/${stats.totalBeds || 0}`}
          icon={<FiGrid />}
          color="bg-purple-500"
          trend={`${Math.round((stats.availableBeds / stats.totalBeds) * 100) || 0}%`}
        />
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <FiClock className="text-amber-600 text-xl" />
          </div>
          <div>
            <p className="text-amber-800 font-semibold">{stats.pendingStaff || 0} Pending Staff</p>
            <p className="text-amber-600 text-sm">Awaiting approval</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <FiAlertTriangle className="text-red-600 text-xl" />
          </div>
          <div>
            <p className="text-red-800 font-semibold">{stats.activeEmergencies || 0} Active Emergencies</p>
            <p className="text-red-600 text-sm">Require attention</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FiDroplet className="text-blue-600 text-xl" />
          </div>
          <div>
            <p className="text-blue-800 font-semibold">{stats.bloodRequests || 0} Blood Requests</p>
            <p className="text-blue-600 text-sm">Processing</p>
          </div>
        </div>
      </div>

      {/* Blood Request Alerts Section */}
      {bloodRequestAlerts.length > 0 && (
        <div className="card border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiDroplet className="mr-2 text-red-500" />
              Recent Blood Requests
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                {bloodRequestAlerts.length} New
              </span>
            </h2>
            <button 
              onClick={() => setBloodRequestAlerts([])}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {bloodRequestAlerts.map((alert, index) => (
              <div 
                key={alert.id || index} 
                className={`p-3 rounded-lg border ${
                  alert.type === 'emergency' 
                    ? 'bg-red-50 border-red-200 animate-pulse' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      alert.type === 'emergency' ? 'bg-red-500' : 'bg-blue-500'
                    }`}>
                      {alert.bloodGroup}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {alert.units} units of {alert.bloodGroup}
                        {alert.type === 'emergency' && (
                          <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                            EMERGENCY
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Patient: {alert.patient} • By: {alert.requestedBy}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{alert.time}</p>
                    <Link 
                      to="/admin/alerts" 
                      className="text-xs text-primary-600 hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Group Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Blood Group Distribution</h2>
            <Link to="/admin/hospitals" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
              View All <FiArrowRight className="ml-1" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bloodGroupData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bloodGroup" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hospital Bed Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Hospital Distribution</h2>
            <Link to="/admin/hospitals" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
              View All <FiArrowRight className="ml-1" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={hospitalDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="beds"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {hospitalDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Staff & Recent Emergencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Staff Approvals */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Pending Staff Approvals</h2>
            <Link to="/admin/staff" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
              View All <FiArrowRight className="ml-1" />
            </Link>
          </div>
          {pendingStaffList.length > 0 ? (
            <div className="space-y-4">
              {pendingStaffList.map((staff) => (
                <div key={staff._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <FiUsers className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{staff.name}</p>
                      <p className="text-sm text-gray-500">{staff.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveStaff(staff._id)}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <FiCheckCircle />
                    </button>
                    <button
                      onClick={() => handleRejectStaff(staff._id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <FiXCircle />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiCheckCircle className="mx-auto text-4xl text-green-500 mb-2" />
              <p>No pending staff approvals</p>
            </div>
          )}
        </div>

        {/* Recent Emergencies */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Recent Emergencies</h2>
            <Link to="/admin/alerts" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
              View All <FiArrowRight className="ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentEmergencies.map((emergency) => (
              <div key={emergency.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    emergency.type.includes('Blood') ? 'bg-red-100' : 'bg-purple-100'
                  }`}>
                    {emergency.type.includes('Blood') ? (
                      <FiDroplet className="text-red-600" />
                    ) : (
                      <FiGrid className="text-purple-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{emergency.type}</p>
                    <p className="text-sm text-gray-500">
                      {emergency.hospital} • {emergency.bloodGroup || emergency.bedType}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    emergency.status === 'active' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {emergency.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{emergency.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, trend }) => (
  <div className="card hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        <div className="flex items-center mt-2">
          <FiTrendingUp className="text-green-500 mr-1" />
          <span className="text-green-500 text-sm">{trend}</span>
        </div>
      </div>
      <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center text-white text-2xl`}>
        {icon}
      </div>
    </div>
  </div>
);

export default AdminDashboard;
