import React, { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  FiDroplet, FiHome, FiClock, FiCheckCircle, FiXCircle,
  FiAlertTriangle, FiCalendar, FiMapPin, FiUser, FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const MyRequests = () => {
  const [activeTab, setActiveTab] = useState('blood');
  const [bloodRequests, setBloodRequests] = useState([]);
  const [bedBookings, setBedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchRequests = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [bloodRes, bookingsRes] = await Promise.all([
        userAPI.getMyBloodRequests(),
        userAPI.getMyBookings()
      ]);

      if (bloodRes?.data?.success) {
        setBloodRequests(bloodRes.data.data);
      }

      if (bookingsRes?.data?.success) {
        setBedBookings(bookingsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Real-time socket listeners — match the exact event names emitted by the server
  useEffect(() => {
    if (!socket) return;

    // Server emits 'bloodRequestUpdate' from /process route
    const handleBloodRequestUpdate = (data) => {
      // Re-fetch to get fully populated data (processedAt, fulfilledAt, etc.)
      fetchRequests(false);
      toast.success(`Blood request status updated to ${data.status}`);
    };

    // Server emits 'blood-request-update' from simple PUT /requests/:id route
    const handleBloodRequestUpdateAlt = (data) => {
      fetchRequests(false);
      toast.success(`Blood request status updated to ${data.status}`);
    };

    // Server emits 'bookingUpdate' from bed booking routes
    const handleBookingUpdate = (data) => {
      fetchRequests(false);
      toast.success(`Bed booking status updated to ${data.status}`);
    };

    socket.on('bloodRequestUpdate', handleBloodRequestUpdate);
    socket.on('blood-request-update', handleBloodRequestUpdateAlt);
    socket.on('bookingUpdate', handleBookingUpdate);

    return () => {
      socket.off('bloodRequestUpdate', handleBloodRequestUpdate);
      socket.off('blood-request-update', handleBloodRequestUpdateAlt);
      socket.off('bookingUpdate', handleBookingUpdate);
    };
  }, [socket, fetchRequests]);

  const cancelBloodRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this blood request?')) return;

    try {
      await userAPI.cancelBloodRequest(requestId);
      setBloodRequests(prev => prev.map(r =>
        r._id === requestId ? { ...r, status: 'cancelled' } : r
      ));
      toast.success('Blood request cancelled');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const cancelBedBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this bed booking?')) return;

    try {
      await userAPI.cancelBooking(bookingId);
      setBedBookings(prev => prev.map(b =>
        b._id === bookingId ? { ...b, status: 'cancelled' } : b
      ));
      toast.success('Booking cancelled');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      partially_approved: 'bg-blue-100 text-blue-700',
      fulfilled: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      confirmed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700',
      completed: 'bg-purple-100 text-purple-700',
      'checked-in': 'bg-indigo-100 text-indigo-700',
      'checked-out': 'bg-purple-100 text-purple-700',
      'no-show': 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getRequestTypeBadge = (type) => {
    const styles = {
      emergency: 'bg-red-100 text-red-700',
      urgent: 'bg-orange-100 text-orange-700',
      normal: 'bg-green-100 text-green-700',
      scheduled: 'bg-blue-100 text-blue-700'
    };
    return styles[type] || 'bg-gray-100 text-gray-700';
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to get the fulfilled date from history or updatedAt
  const getFulfilledDate = (request) => {
    if (request.status === 'fulfilled') {
      const fulfilledEntry = request.history?.slice().reverse().find(h => h.status === 'fulfilled');
      return fulfilledEntry?.timestamp || request.updatedAt;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Requests</h1>
          <p className="text-gray-500 mt-1">Track your blood requests and bed bookings</p>
        </div>
        <button
          onClick={() => fetchRequests()}
          className="btn-secondary flex items-center space-x-2"
        >
          <FiRefreshCw />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('blood')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'blood' 
              ? 'bg-white text-primary-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <FiDroplet />
          <span>Blood Requests ({bloodRequests.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('beds')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'beds' 
              ? 'bg-white text-primary-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <FiHome />
          <span>Bed Bookings ({bedBookings.length})</span>
        </button>
      </div>

      {/* Blood Requests Tab */}
      {activeTab === 'blood' && (
        <div className="space-y-4">
          {bloodRequests.length === 0 ? (
            <div className="card text-center py-12">
              <FiDroplet className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No Blood Requests</h3>
              <p className="text-gray-500 mt-1">You haven't made any blood requests yet</p>
            </div>
          ) : (
            bloodRequests.map((request) => {
              const units = request.unitsRequired || request.units || 1;
              const patientName = request.patientInfo?.name || request.patientName || 'Patient';
              const reqType = request.requestType || 'normal';
              const fulfilledDate = getFulfilledDate(request);

              return (
                <div key={request._id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                        <span className="text-xl font-bold text-red-600">{request.bloodGroup}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-800">
                            {units} Unit{units > 1 ? 's' : ''} Blood Request
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusBadge(request.status)}`}>
                            {formatStatus(request.status)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getRequestTypeBadge(reqType)}`}>
                            {formatStatus(reqType)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{request.reason}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <FiMapPin className="text-gray-400" />
                            <span>{request.hospital?.name || request.targetHospital?.name || 'Any Hospital'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <FiUser className="text-gray-400" />
                            <span>For: {patientName}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    {request.status === 'pending' && (
                      <button
                        onClick={() => cancelBloodRequest(request._id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-8">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <FiClock className="text-primary-600 text-sm" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Requested</p>
                          <p className="text-sm font-medium text-gray-700">{formatDateTime(request.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex-1 border-t border-dashed border-gray-200"></div>
                      
                      {request.processedAt ? (
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            request.status === 'rejected' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {request.status === 'rejected' ? (
                              <FiXCircle className="text-red-600 text-sm" />
                            ) : (
                              <FiCheckCircle className="text-blue-600 text-sm" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">
                              {request.status === 'rejected' ? 'Rejected' : 'Processed'}
                            </p>
                            <p className="text-sm font-medium text-gray-700">{formatDateTime(request.processedAt)}</p>
                          </div>
                        </div>
                      ) : request.status === 'cancelled' ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <FiXCircle className="text-gray-500 text-sm" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Cancelled</p>
                            <p className="text-sm text-gray-500">By you</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 opacity-50">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <FiClock className="text-gray-400 text-sm" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Processing</p>
                            <p className="text-sm text-gray-400">Pending</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex-1 border-t border-dashed border-gray-200"></div>
                      
                      {fulfilledDate ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <FiCheckCircle className="text-green-600 text-sm" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Fulfilled</p>
                            <p className="text-sm font-medium text-gray-700">{formatDateTime(fulfilledDate)}</p>
                          </div>
                        </div>
                      ) : request.status === 'rejected' ? (
                        <div className="flex items-center space-x-2 opacity-50">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <FiXCircle className="text-gray-400 text-sm" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Fulfillment</p>
                            <p className="text-sm text-gray-400">Denied</p>
                          </div>
                        </div>
                      ) : request.status === 'cancelled' ? (
                        <div className="flex items-center space-x-2 opacity-50">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <FiXCircle className="text-gray-400 text-sm" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Fulfillment</p>
                            <p className="text-sm text-gray-400">Cancelled</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 opacity-50">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <FiClock className="text-gray-400 text-sm" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Fulfillment</p>
                            <p className="text-sm text-gray-400">Pending</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rejection reason */}
                  {request.status === 'rejected' && request.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg flex items-start space-x-2">
                      <FiXCircle className="text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-red-700">
                        <strong>Reason:</strong> {request.rejectionReason}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Bed Bookings Tab */}
      {activeTab === 'beds' && (
        <div className="space-y-4">
          {bedBookings.length === 0 ? (
            <div className="card text-center py-12">
              <FiHome className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No Bed Bookings</h3>
              <p className="text-gray-500 mt-1">You haven't booked any beds yet</p>
            </div>
          ) : (
            bedBookings.map((booking) => {
              const patientName = booking.patientDetails?.name || booking.patientName || 'Patient';
              const patientAge = booking.patientDetails?.age || booking.patientAge;
              const checkIn = booking.admissionDate || booking.checkInDate;
              const checkOut = booking.expectedDischargeDate || booking.checkOutDate;
              const hospitalName = booking.hospital?.name || booking.bed?.hospital?.name || 'Hospital';
              const condition = booking.patientDetails?.condition || booking.reason || '';

              return (
                <div key={booking._id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                        <FiHome className="text-2xl text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-800">
                            Bed {booking.bed?.bedNumber || 'N/A'}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusBadge(booking.status)}`}>
                            {formatStatus(booking.status)}
                          </span>
                          {booking.bed?.ward && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                              {booking.bed.ward} Ward
                            </span>
                          )}
                          {booking.bookingType && booking.bookingType !== 'scheduled' && (
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getRequestTypeBadge(booking.bookingType)}`}>
                              {formatStatus(booking.bookingType)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{condition}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <FiMapPin className="text-gray-400" />
                            <span>{hospitalName}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <FiUser className="text-gray-400" />
                            <span>For: {patientName}{patientAge ? ` (${patientAge} yrs)` : ''}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button
                        onClick={() => cancelBedBooking(booking._id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* Dates */}
                  {checkIn && checkOut && (
                    <div className="mt-4 pt-4 border-t flex items-center space-x-8">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FiCalendar className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Admission</p>
                          <p className="font-medium text-gray-700">{formatDate(checkIn)}</p>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex items-center">
                        <div className="flex-1 border-t border-dashed border-gray-200"></div>
                        <span className="px-3 text-sm text-gray-400">
                          {Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))} days
                        </span>
                        <div className="flex-1 border-t border-dashed border-gray-200"></div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <FiCalendar className="text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Discharge</p>
                          <p className="font-medium text-gray-700">{formatDate(checkOut)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Messages */}
                  {booking.status === 'confirmed' && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center space-x-2">
                      <FiCheckCircle className="text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-700">
                        Your booking is confirmed. Please arrive at the hospital by {formatDate(checkIn)}.
                      </span>
                    </div>
                  )}
                  {booking.status === 'pending' && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-center space-x-2">
                      <FiAlertTriangle className="text-yellow-600 flex-shrink-0" />
                      <span className="text-sm text-yellow-700">
                        Your booking is awaiting confirmation from the hospital.
                      </span>
                    </div>
                  )}
                  {booking.status === 'checked-in' && (
                    <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex items-center space-x-2">
                      <FiCheckCircle className="text-indigo-600 flex-shrink-0" />
                      <span className="text-sm text-indigo-700">
                        You are currently checked in. Checked in at {formatDateTime(booking.checkInTime)}.
                      </span>
                    </div>
                  )}
                  {booking.status === 'checked-out' && booking.totalCharges > 0 && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg flex items-center space-x-2">
                      <FiCheckCircle className="text-purple-600 flex-shrink-0" />
                      <span className="text-sm text-purple-700">
                        Discharged. Total charges: ₹{booking.totalCharges.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
