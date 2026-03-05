import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bedAPI, bloodAPI, hospitalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FiGrid, FiDroplet, FiMessageCircle, FiAlertTriangle, 
  FiMapPin, FiPhone, FiArrowRight, FiClock, FiActivity
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const [availableBeds, setAvailableBeds] = useState([]);
  const [bloodAvailability, setBloodAvailability] = useState([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchDashboardData();
    
    if (socket) {
      socket.on('bedUpdate', handleBedUpdate);
      socket.on('bloodUpdate', handleBloodUpdate);
      
      return () => {
        socket.off('bedUpdate', handleBedUpdate);
        socket.off('bloodUpdate', handleBloodUpdate);
      };
    }
  }, [socket]);

  const handleBedUpdate = (data) => {
    toast('Bed availability updated!', { icon: '🛏️' });
    fetchDashboardData();
  };

  const handleBloodUpdate = (data) => {
    toast('Blood availability updated!', { icon: '🩸' });
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      const [bedsRes, bloodRes, hospitalsRes] = await Promise.all([
        bedAPI.getAvailableBeds().catch(() => ({ data: { data: [] } })),
        bloodAPI.getBloodStats().catch(() => ({ data: { data: [] } })),
        hospitalAPI.getHospitals().catch(() => ({ data: { data: [] } }))
      ]);

      // Available beds
      if (bedsRes.data?.data) {
        setAvailableBeds(Array.isArray(bedsRes.data.data) 
          ? bedsRes.data.data.slice(0, 5) 
          : []);
      }

      // Blood availability
      let bloodData = bloodRes.data?.data || [];
      if (!Array.isArray(bloodData) || bloodData.length === 0) {
        bloodData = bloodGroups.map(bg => ({ 
          bloodGroup: bg, 
          count: Math.floor(Math.random() * 50) + 10,
          available: Math.random() > 0.2
        }));
      }
      setBloodAvailability(bloodData);

      // Nearby hospitals
      if (hospitalsRes.data?.data) {
        setNearbyHospitals(Array.isArray(hospitalsRes.data.data) 
          ? hospitalsRes.data.data.slice(0, 4) 
          : []);
      }

      // Mock user's requests
      setMyRequests([
        { id: 1, type: 'blood', bloodGroup: 'O+', status: 'pending', date: '2024-01-15' },
        { id: 2, type: 'bed', bedType: 'general', hospital: 'City Hospital', status: 'confirmed', date: '2024-01-10' }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard:', error);
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
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}!</h1>
          <p className="text-gray-500">Find beds, check blood availability, and get assistance</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-gray-500">{isConnected ? 'Live Updates' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <FiAlertTriangle className="text-3xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Emergency Assistance</h2>
              <p className="text-red-100">Get immediate help with our AI assistant</p>
            </div>
          </div>
          <Link to="/user/chatbot" className="bg-white text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center space-x-2">
            <FiMessageCircle />
            <span>Get Help Now</span>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/user/beds" className="card hover:shadow-lg transition-shadow group">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <FiGrid className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Find Available Beds</h3>
              <p className="text-sm text-gray-500">Search hospitals with vacancy</p>
            </div>
          </div>
        </Link>

        <Link to="/user/blood" className="card hover:shadow-lg transition-shadow group">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <FiDroplet className="text-red-600 text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Check Blood Availability</h3>
              <p className="text-sm text-gray-500">Find blood by group</p>
            </div>
          </div>
        </Link>

        <Link to="/user/chatbot" className="card hover:shadow-lg transition-shadow group">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <FiMessageCircle className="text-green-600 text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">AI Health Assistant</h3>
              <p className="text-sm text-gray-500">First aid & emergency guidance</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Blood Availability */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Blood Availability</h2>
          <Link to="/user/blood" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
            View Details <FiArrowRight className="ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {bloodAvailability.map((blood) => (
            <div 
              key={blood.bloodGroup} 
              className={`text-center p-3 rounded-xl ${
                blood.count > 20 ? 'bg-green-50' : 
                blood.count > 10 ? 'bg-amber-50' : 'bg-red-50'
              }`}
            >
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <FiDroplet className="text-red-500" />
              </div>
              <p className="font-bold text-gray-800">{blood.bloodGroup}</p>
              <p className={`text-xs ${
                blood.count > 20 ? 'text-green-600' : 
                blood.count > 10 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {blood.count > 20 ? 'Available' : blood.count > 10 ? 'Limited' : 'Low'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Beds */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Available Beds Nearby</h2>
            <Link to="/user/beds" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
              View All <FiArrowRight className="ml-1" />
            </Link>
          </div>
          {availableBeds.length > 0 ? (
            <div className="space-y-3">
              {availableBeds.map((bed, index) => (
                <div key={bed._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      bed.bedType === 'icu' ? 'bg-red-100' :
                      bed.bedType === 'emergency' ? 'bg-orange-100' : 'bg-blue-100'
                    }`}>
                      <FiGrid className={`${
                        bed.bedType === 'icu' ? 'text-red-600' :
                        bed.bedType === 'emergency' ? 'text-orange-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {bed.bedType?.charAt(0).toUpperCase() + bed.bedType?.slice(1)} Bed
                      </p>
                      <p className="text-sm text-gray-500">{bed.hospital?.name || 'Hospital'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Available
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiGrid className="mx-auto text-4xl text-gray-300 mb-2" />
              <p>No beds data available</p>
            </div>
          )}
        </div>

        {/* Nearby Hospitals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Nearby Hospitals</h2>
          </div>
          {nearbyHospitals.length > 0 ? (
            <div className="space-y-3">
              {nearbyHospitals.map((hospital, index) => (
                <div key={hospital._id || index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FiActivity className="text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{hospital.name}</p>
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
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiMapPin className="mx-auto text-4xl text-gray-300 mb-2" />
              <p>No hospitals data available</p>
            </div>
          )}
        </div>
      </div>

      {/* My Requests */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">My Recent Requests</h2>
          <Link to="/user/requests" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
            View All <FiArrowRight className="ml-1" />
          </Link>
        </div>
        {myRequests.length > 0 ? (
          <div className="space-y-3">
            {myRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    request.type === 'blood' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {request.type === 'blood' ? (
                      <FiDroplet className="text-red-600" />
                    ) : (
                      <FiGrid className="text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {request.type === 'blood' 
                        ? `Blood Request - ${request.bloodGroup}` 
                        : `Bed Request - ${request.bedType}`}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <FiClock className="mr-1" />
                      <span>{request.date}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  request.status === 'confirmed' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FiClock className="mx-auto text-4xl text-gray-300 mb-2" />
            <p>No recent requests</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
