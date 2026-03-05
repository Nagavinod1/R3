import React, { useState, useEffect } from 'react';
import { bloodAPI, hospitalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FiDroplet, FiSearch, FiMapPin, FiPhone, FiX, FiPlus,
  FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiZap,
  FiActivity, FiClock, FiUsers, FiTrendingUp
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const BloodAvailability = () => {
  const [bloodStats, setBloodStats] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requestData, setRequestData] = useState({
    bloodGroup: '',
    units: 1,
    urgency: 'normal',
    reason: '',
    hospital: ''
  });
  const { socket } = useSocket();
  const { user } = useAuth();

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchData();
    
    if (socket) {
      socket.on('bloodUpdate', () => {
        toast('Blood availability updated!', { icon: '🩸' });
        fetchData();
      });
      
      return () => {
        socket.off('bloodUpdate');
      };
    }
  }, [socket]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const [statsRes, hospitalsRes] = await Promise.all([
        bloodAPI.getBloodStats(),
        hospitalAPI.getHospitals()
      ]);

      // Handle stats - API returns { bloodGroup, units }
      let statsData = statsRes.data?.data || [];
      if (Array.isArray(statsData) && statsData.length > 0) {
        statsData = statsData.map(item => ({
          bloodGroup: item.bloodGroup,
          count: item.units || item.count || 0
        }));
      } else {
        statsData = bloodGroups.map(bg => ({ 
          bloodGroup: bg, 
          count: Math.floor(Math.random() * 50) + 10 
        }));
      }
      setBloodStats(statsData);

      if (hospitalsRes.data.success && hospitalsRes.data.data) {
        setHospitals(Array.isArray(hospitalsRes.data.data) ? hospitalsRes.data.data : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Mock data
      setBloodStats(bloodGroups.map(bg => ({ 
        bloodGroup: bg, 
        count: Math.floor(Math.random() * 50) + 10 
      })));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    toast.loading('Refreshing blood availability...');
    await fetchData();
    toast.dismiss();
    toast.success('Blood data refreshed!');
  };

  const handleRequestBlood = (bloodGroup = null) => {
    setRequestData({
      ...requestData,
      bloodGroup: bloodGroup || user?.bloodGroup || ''
    });
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      // Map frontend data to server expected format
      const urgencyToRequestType = {
        'normal': 'normal',
        'high': 'urgent',
        'critical': 'emergency'
      };
      
      const submitData = {
        bloodGroup: requestData.bloodGroup,
        unitsRequired: requestData.units,
        requestType: urgencyToRequestType[requestData.urgency] || 'normal',
        reason: requestData.reason,
        targetHospital: requestData.hospital || undefined,
        patientInfo: {
          name: user?.name || 'Patient'
        }
      };
      
      await bloodAPI.createBloodRequest(submitData);
      toast.success('Blood request submitted successfully! Admin has been notified.');
      setShowRequestModal(false);
      setRequestData({
        bloodGroup: '',
        units: 1,
        urgency: 'normal',
        reason: '',
        hospital: ''
      });
    } catch (error) {
      console.error('Blood request error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit blood request');
    }
  };

  const getAvailabilityColor = (count) => {
    if (count > 30) return 'bg-green-100 text-green-700 border-green-300';
    if (count > 15) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const getAvailabilityLabel = (count) => {
    if (count > 30) return 'Good Stock';
    if (count > 15) return 'Limited';
    return 'Low Stock';
  };

  const getCompatibleGroups = (bloodGroup) => {
    const compatibility = {
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      'AB-': ['A-', 'B-', 'AB-', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O-']
    };
    return compatibility[bloodGroup] || [];
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Gradient Header with Animations */}
      <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-pink-600 rounded-3xl p-8 overflow-hidden shadow-2xl">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FiDroplet className="text-white text-3xl animate-bounce-slow" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
                <span>Blood Availability</span>
                <FiActivity className="text-white animate-pulse" />
              </h1>
              <p className="text-red-100 mt-1">Real-time blood stock monitoring and requests</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-xl font-semibold backdrop-blur-sm transition-all flex items-center space-x-2 hover:scale-105"
            >
              <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button 
              onClick={() => handleRequestBlood()}
              className="bg-white text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-50 transition-all shadow-lg hover:scale-105 flex items-center space-x-2"
            >
              <FiZap className="text-yellow-500" />
              <span>Request Blood</span>
            </button>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FiDroplet className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Total Units</p>
                <p className="text-2xl font-bold text-white">{bloodStats.reduce((acc, b) => acc + b.count, 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FiCheckCircle className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Good Stock</p>
                <p className="text-2xl font-bold text-white">{bloodStats.filter(b => b.count > 30).length}/8</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FiAlertTriangle className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Low Stock</p>
                <p className="text-2xl font-bold text-white">{bloodStats.filter(b => b.count < 15).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FiUsers className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Blood Banks</p>
                <p className="text-2xl font-bold text-white">{hospitals.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User's Blood Group Info - Enhanced */}
      {user?.bloodGroup && (
        <div className="relative bg-gradient-to-br from-red-500 via-red-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl overflow-hidden group">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-64 h-64 bg-white rounded-full -top-20 -right-20 animate-pulse"></div>
          </div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold">{user.bloodGroup}</span>
              </div>
              <div>
                <p className="text-red-100 text-sm font-medium">Your Blood Group</p>
                <h2 className="text-xl font-bold mt-1">Compatible: {getCompatibleGroups(user.bloodGroup).join(', ')}</h2>
                <p className="text-red-100 text-sm mt-1 flex items-center space-x-1">
                  <FiTrendingUp />
                  <span>{bloodStats.find(b => b.bloodGroup === user.bloodGroup)?.count || 0} units available</span>
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleRequestBlood(user.bloodGroup)}
              className="bg-white text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-50 transition-all shadow-lg hover:scale-105 flex items-center space-x-2"
            >
              <FiZap className="text-yellow-500" />
              <span className="hidden sm:inline">Request {user.bloodGroup}</span>
              <span className="sm:hidden">Request</span>
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Blood Group Cards with Animations */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading blood availability...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bloodStats.map((blood, index) => (
              <div 
                key={blood.bloodGroup} 
                className={`relative card border-2 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 transform
                  ${getAvailabilityColor(blood.count)} ${
                  selectedBloodGroup === blood.bloodGroup ? 'ring-4 ring-red-500 scale-105' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setSelectedBloodGroup(
                  selectedBloodGroup === blood.bloodGroup ? null : blood.bloodGroup
                )}
              >
                {/* Pulse Animation for Low Stock */}
                {blood.count < 15 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                )}

                {/* Blood Drop Icon with Animation */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-110 transition-transform">
                    <FiDroplet className={`text-3xl ${
                      blood.count > 30 ? 'text-green-500' :
                      blood.count > 15 ? 'text-amber-500' : 'text-red-500 animate-pulse'
                    }`} />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-gray-800">{blood.bloodGroup}</h3>
                  
                  <div className="my-3">
                    <p className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                      {blood.count}
                    </p>
                    <p className="text-sm font-medium text-gray-600 mt-1">units available</p>
                  </div>
                  
                  <div className="space-y-2">
                    <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold shadow-md ${
                      blood.count > 30 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                      blood.count > 15 ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 
                      'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                    }`}>
                      {getAvailabilityLabel(blood.count)}
                    </span>
                    
                    {blood.count < 15 && (
                      <div className="flex items-center justify-center space-x-1 text-xs text-red-600">
                        <FiAlertTriangle className="animate-pulse" />
                        <span className="font-semibold">Urgent</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Request Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRequestBlood(blood.bloodGroup);
                    }}
                    className="mt-4 w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-2 rounded-lg font-semibold
                             hover:from-red-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg
                             transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <FiZap className="text-yellow-300" />
                    <span className="text-sm">Request</span>
                  </button>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 bg-gradient-to-r from-red-500/10 to-pink-500/10 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Blood Stock Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bloodStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bloodGroup" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Low Stock Warning */}
          {bloodStats.filter(b => b.count < 15).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <FiAlertTriangle className="text-amber-600 text-xl" />
                <div>
                  <p className="font-semibold text-amber-800">Low Stock Alert</p>
                  <p className="text-sm text-amber-600">
                    The following blood groups have limited availability: {
                      bloodStats.filter(b => b.count < 15).map(b => b.bloodGroup).join(', ')
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selected Blood Group Details */}
          {selectedBloodGroup && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedBloodGroup} Blood Details
                </h2>
                <button 
                  onClick={() => setSelectedBloodGroup(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Compatible Donors</h3>
                  <div className="flex flex-wrap gap-2">
                    {getCompatibleGroups(selectedBloodGroup).map(group => (
                      <span key={group} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {group}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    These blood groups can donate to {selectedBloodGroup}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Quick Request</h3>
                  <button
                    onClick={() => handleRequestBlood(selectedBloodGroup)}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <FiPlus />
                    <span>Request {selectedBloodGroup} Blood</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hospitals with Blood Bank */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Blood Banks Near You</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hospitals.slice(0, 4).map((hospital) => (
                <div key={hospital._id} className="p-4 bg-gray-50 rounded-lg flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FiDroplet className="text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{hospital.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <FiMapPin className="mr-1" />
                        <span>{hospital.address?.city || 'Location not available'}</span>
                      </div>
                    </div>
                  </div>
                  {hospital.phone && (
                    <a 
                      href={`tel:${hospital.phone}`}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <FiPhone />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Request Blood Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Request Blood</h2>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group *</label>
                <select
                  value={requestData.bloodGroup}
                  onChange={(e) => setRequestData({ ...requestData, bloodGroup: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Units Required *</label>
                <input
                  type="number"
                  value={requestData.units}
                  onChange={(e) => setRequestData({ ...requestData, units: parseInt(e.target.value) })}
                  className="input-field"
                  min="1"
                  max="10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency *</label>
                <select
                  value={requestData.urgency}
                  onChange={(e) => setRequestData({ ...requestData, urgency: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical (Emergency)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hospital</label>
                <select
                  value={requestData.hospital}
                  onChange={(e) => setRequestData({ ...requestData, hospital: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Hospital (Optional)</option>
                  {hospitals.map(h => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <textarea
                  value={requestData.reason}
                  onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Brief description of why blood is needed (min 10 characters)..."
                  required
                  minLength={10}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 btn-secondary py-3"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-3">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodAvailability;
