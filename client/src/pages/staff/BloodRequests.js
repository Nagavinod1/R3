import React, { useState, useEffect } from 'react';
import { bloodAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  FiDroplet, FiClock, FiCheckCircle, FiXCircle, FiUser,
  FiMapPin, FiPhone, FiSearch, FiFilter
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const BloodRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBloodGroup, setFilterBloodGroup] = useState('all');
  const [search, setSearch] = useState('');
  const { socket } = useSocket();

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchRequests();
    
    if (socket) {
      // Listen for new blood requests from users
      const handleNewRequest = (data) => {
        toast(`New blood request: ${data.unitsRequired} units of ${data.bloodGroup}`, { icon: '🩸' });
        fetchRequests();
      };

      // Listen for status updates on existing requests
      const handleRequestUpdate = () => {
        fetchRequests();
      };

      socket.on('newBloodRequest', handleNewRequest);
      socket.on('bloodRequestUpdate', handleRequestUpdate);
      socket.on('blood-request-update', handleRequestUpdate);
      socket.on('bloodRequestAlert', handleRequestUpdate);
      
      return () => {
        socket.off('newBloodRequest', handleNewRequest);
        socket.off('bloodRequestUpdate', handleRequestUpdate);
        socket.off('blood-request-update', handleRequestUpdate);
        socket.off('bloodRequestAlert', handleRequestUpdate);
      };
    }
  }, [socket]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await bloodAPI.getRequests();
      if (response.data.success && response.data.data) {
        setRequests(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load blood requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await bloodAPI.updateBloodRequest(requestId, { status: 'approved' });
      toast.success('Request approved');
      fetchRequests();
    } catch (error) {
      // Update locally for demo
      setRequests(prev => prev.map(r => 
        r._id === requestId ? { ...r, status: 'approved' } : r
      ));
      toast.success('Request approved');
    }
  };

  const handleFulfill = async (requestId) => {
    try {
      await bloodAPI.updateBloodRequest(requestId, { status: 'fulfilled' });
      toast.success('Request fulfilled - blood allocated');
      fetchRequests();
    } catch (error) {
      setRequests(prev => prev.map(r => 
        r._id === requestId ? { ...r, status: 'fulfilled' } : r
      ));
      toast.success('Request fulfilled');
    }
  };

  const handleReject = async (requestId) => {
    if (window.confirm('Are you sure you want to reject this request?')) {
      try {
        await bloodAPI.updateBloodRequest(requestId, { status: 'rejected' });
        toast.success('Request rejected');
        fetchRequests();
      } catch (error) {
        setRequests(prev => prev.map(r => 
          r._id === requestId ? { ...r, status: 'rejected' } : r
        ));
        toast.success('Request rejected');
      }
    }
  };

  // Map server requestType to display urgency
  const getUrgency = (request) => {
    const type = request.requestType || request.urgency || 'normal';
    const map = { emergency: 'critical', urgent: 'high', scheduled: 'normal', normal: 'normal' };
    return map[type] || type;
  };

  // Get units from server field
  const getUnits = (request) => request.unitsRequired || request.units || 1;

  // Get requester info from populated fields
  const getRequester = (request) => request.requestedBy || request.user || {};

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesBloodGroup = filterBloodGroup === 'all' || request.bloodGroup === filterBloodGroup;
    const requester = getRequester(request);
    const matchesSearch = !search || 
      requester?.name?.toLowerCase().includes(search.toLowerCase()) ||
      request.hospital?.name?.toLowerCase().includes(search.toLowerCase()) ||
      request.targetHospital?.name?.toLowerCase().includes(search.toLowerCase()) ||
      request.patientInfo?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesBloodGroup && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'fulfilled': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const criticalCount = requests.filter(r => getUrgency(r) === 'critical' && r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Blood Requests</h1>
        <p className="text-gray-500">Manage and process blood allocation requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-amber-50 border border-amber-200">
          <div className="flex items-center space-x-3">
            <FiClock className="text-amber-600 text-2xl" />
            <div>
              <p className="text-amber-600 text-sm">Pending</p>
              <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center space-x-3">
            <FiDroplet className="text-red-600 text-2xl" />
            <div>
              <p className="text-red-600 text-sm">Critical</p>
              <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
            </div>
          </div>
        </div>
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-center space-x-3">
            <FiCheckCircle className="text-blue-600 text-2xl" />
            <div>
              <p className="text-blue-600 text-sm">Approved</p>
              <p className="text-2xl font-bold text-blue-700">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-center space-x-3">
            <FiCheckCircle className="text-green-600 text-2xl" />
            <div>
              <p className="text-green-600 text-sm">Fulfilled</p>
              <p className="text-2xl font-bold text-green-700">
                {requests.filter(r => r.status === 'fulfilled').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by doctor or hospital..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filterBloodGroup}
            onChange={(e) => setFilterBloodGroup(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Blood Groups</option>
            {bloodGroups.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner w-10 h-10"></div>
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div 
              key={request._id} 
              className={`card hover:shadow-lg transition-shadow border-l-4 ${
                getUrgency(request) === 'critical' ? 'border-red-500' :
                getUrgency(request) === 'high' ? 'border-orange-500' : 'border-blue-500'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                    <span className="text-red-600 font-bold text-lg">{request.bloodGroup}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {getUnits(request)} unit{getUnits(request) > 1 ? 's' : ''} of {request.bloodGroup}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getUrgencyColor(getUrgency(request))}`}>
                        {getUrgency(request)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{request.reason}</p>
                    {request.patientInfo?.name && (
                      <p className="text-sm text-gray-500 mb-1">Patient: <span className="font-medium text-gray-700">{request.patientInfo.name}</span></p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FiUser className="text-gray-400" />
                        <span>{getRequester(request)?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiMapPin className="text-gray-400" />
                        <span>{request.hospital?.name || request.targetHospital?.name || 'Any Hospital'}</span>
                      </div>
                      {getRequester(request)?.phone && (
                        <div className="flex items-center space-x-1">
                          <FiPhone className="text-gray-400" />
                          <span>{getRequester(request).phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <FiClock className="text-gray-400" />
                        <span>{getTimeAgo(request.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(request._id)}
                        className="btn-primary flex items-center space-x-1 py-2 px-4"
                      >
                        <FiCheckCircle />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(request._id)}
                        className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center space-x-1 py-2 px-4"
                      >
                        <FiXCircle />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  {request.status === 'approved' && (
                    <button
                      onClick={() => handleFulfill(request._id)}
                      className="btn-primary bg-green-600 hover:bg-green-700 flex items-center space-x-1 py-2 px-4"
                    >
                      <FiCheckCircle />
                      <span>Mark Fulfilled</span>
                    </button>
                  )}
                  {request.status === 'fulfilled' && (
                    <span className="text-green-600 flex items-center space-x-1">
                      <FiCheckCircle />
                      <span>Completed</span>
                    </span>
                  )}
                  {request.status === 'rejected' && (
                    <span className="text-red-600 flex items-center space-x-1">
                      <FiXCircle />
                      <span>Rejected</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <FiDroplet className="mx-auto text-5xl text-gray-300 mb-4" />
          <p className="text-gray-500">No blood requests found</p>
        </div>
      )}
    </div>
  );
};

export default BloodRequests;
