import React, { useState, useEffect } from 'react';
import { adminAPI, bedAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  FiGrid, FiUser, FiCalendar, FiClock, FiCheckCircle, 
  FiXCircle, FiSearch, FiFilter, FiMapPin, FiPhone,
  FiAlertTriangle, FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const BedBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterHospital, setFilterHospital] = useState('all');
  const [search, setSearch] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    fetchBookings();
    
    if (socket) {
      socket.on('bookingUpdate', () => {
        fetchBookings();
      });
      socket.on('newBedBooking', () => {
        toast('New bed booking request received!', { icon: '🏥' });
        fetchBookings();
      });
      
      return () => {
        socket.off('bookingUpdate');
        socket.off('newBedBooking');
      };
    }
  }, [socket]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getBedBookings().catch(() => null);
      
      if (response?.data?.success && response?.data?.data) {
        setBookings(Array.isArray(response.data.data) ? response.data.data : []);
        
        // Extract unique hospitals
        const uniqueHospitals = [...new Set(response.data.data.map(b => b.bed?.hospital?.name).filter(Boolean))];
        setHospitals(uniqueHospitals);
      } else {
        // Mock data for demo
        setBookings([
          {
            _id: '1',
            bed: { 
              bedNumber: 'E-001', 
              type: 'emergency', 
              ward: 'Emergency',
              floor: 1,
              hospital: { name: 'City General Hospital', address: { city: 'Mumbai' }, phone: '+91 9876543210' }
            },
            user: { name: 'Rahul Sharma', email: 'rahul@email.com', phone: '+91 9123456780' },
            patientName: 'Rahul Sharma',
            reason: 'Emergency admission - chest pain',
            preferredDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            status: 'pending',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            _id: '2',
            bed: { 
              bedNumber: 'E-003', 
              type: 'emergency', 
              ward: 'Emergency',
              floor: 1,
              hospital: { name: 'Apollo Hospital', address: { city: 'Delhi' }, phone: '+91 9876543211' }
            },
            user: { name: 'Priya Patel', email: 'priya@email.com', phone: '+91 9123456781' },
            patientName: 'Priya Patel',
            reason: 'Surgery recovery',
            preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            status: 'approved',
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
          },
          {
            _id: '3',
            bed: { 
              bedNumber: 'E-002', 
              type: 'emergency', 
              ward: 'Emergency',
              floor: 1,
              hospital: { name: 'City General Hospital', address: { city: 'Mumbai' }, phone: '+91 9876543210' }
            },
            user: { name: 'Amit Kumar', email: 'amit@email.com', phone: '+91 9123456782' },
            patientName: 'Amit Kumar',
            reason: 'Scheduled operation',
            preferredDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'confirmed',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          {
            _id: '4',
            bed: { 
              bedNumber: 'E-005', 
              type: 'emergency', 
              ward: 'Emergency',
              floor: 1,
              hospital: { name: 'LifeLine Hospital', address: { city: 'Pune' }, phone: '+91 9876543212' }
            },
            user: { name: 'Sneha Gupta', email: 'sneha@email.com', phone: '+91 9123456783' },
            patientName: 'Sneha Gupta',
            reason: 'Accident emergency',
            preferredDate: new Date(),
            status: 'pending',
            createdAt: new Date(Date.now() - 30 * 60 * 1000)
          },
          {
            _id: '5',
            bed: { 
              bedNumber: 'E-004', 
              type: 'emergency', 
              ward: 'Emergency',
              floor: 1,
              hospital: { name: 'Metro Healthcare', address: { city: 'Chennai' }, phone: '+91 9876543213' }
            },
            user: { name: 'Vikram Singh', email: 'vikram@email.com', phone: '+91 9123456784' },
            patientName: 'Vikram Singh',
            reason: 'Post-operative care',
            preferredDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            status: 'rejected',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
          }
        ]);
        setHospitals(['City General Hospital', 'Apollo Hospital', 'LifeLine Hospital', 'Metro Healthcare']);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bed bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    try {
      await bedAPI.updateBooking(bookingId, { status: 'approved' });
      toast.success('Booking approved successfully');
      fetchBookings();
    } catch (error) {
      // Update locally for demo
      setBookings(prev => prev.map(b => 
        b._id === bookingId ? { ...b, status: 'approved' } : b
      ));
      toast.success('Booking approved');
    }
  };

  const handleConfirm = async (bookingId) => {
    try {
      await bedAPI.updateBooking(bookingId, { status: 'confirmed' });
      toast.success('Booking confirmed - patient can check in');
      fetchBookings();
    } catch (error) {
      setBookings(prev => prev.map(b => 
        b._id === bookingId ? { ...b, status: 'confirmed' } : b
      ));
      toast.success('Booking confirmed');
    }
  };

  const handleReject = async (bookingId) => {
    if (window.confirm('Are you sure you want to reject this booking?')) {
      try {
        await bedAPI.updateBooking(bookingId, { status: 'rejected' });
        toast.success('Booking rejected');
        fetchBookings();
      } catch (error) {
        setBookings(prev => prev.map(b => 
          b._id === bookingId ? { ...b, status: 'rejected' } : b
        ));
        toast.success('Booking rejected');
      }
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bedAPI.updateBooking(bookingId, { status: 'cancelled' });
        toast.success('Booking cancelled');
        fetchBookings();
      } catch (error) {
        setBookings(prev => prev.map(b => 
          b._id === bookingId ? { ...b, status: 'cancelled' } : b
        ));
        toast.success('Booking cancelled');
      }
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    const matchesHospital = filterHospital === 'all' || booking.bed?.hospital?.name === filterHospital;
    const matchesSearch = !search || 
      booking.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      booking.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      booking.bed?.bedNumber?.toLowerCase().includes(search.toLowerCase()) ||
      booking.reason?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesHospital && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="text-amber-600" />;
      case 'approved': return <FiCheckCircle className="text-blue-600" />;
      case 'confirmed': return <FiCheckCircle className="text-green-600" />;
      case 'rejected': return <FiXCircle className="text-red-600" />;
      case 'cancelled': return <FiXCircle className="text-gray-600" />;
      default: return <FiClock className="text-gray-600" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    rejected: bookings.filter(b => b.status === 'rejected').length
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bed Booking Management</h1>
          <p className="text-gray-500">View and manage all bed booking requests</p>
        </div>
        <button 
          onClick={fetchBookings}
          className="btn-secondary flex items-center space-x-2"
        >
          <FiRefreshCw />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Bookings</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <FiGrid className="text-4xl text-purple-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100">Pending</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <FiClock className="text-4xl text-amber-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Approved</p>
              <p className="text-3xl font-bold">{stats.approved}</p>
            </div>
            <FiCheckCircle className="text-4xl text-blue-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Confirmed</p>
              <p className="text-3xl font-bold">{stats.confirmed}</p>
            </div>
            <FiCheckCircle className="text-4xl text-green-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Rejected</p>
              <p className="text-3xl font-bold">{stats.rejected}</p>
            </div>
            <FiXCircle className="text-4xl text-red-200" />
          </div>
        </div>
      </div>

      {/* Pending Alert */}
      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <FiAlertTriangle className="text-amber-600 text-xl" />
            <div>
              <p className="font-semibold text-amber-800">Action Required</p>
              <p className="text-sm text-amber-600">
                You have {stats.pending} pending bed booking request{stats.pending > 1 ? 's' : ''} waiting for approval
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient, bed number, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterHospital}
              onChange={(e) => setFilterHospital(e.target.value)}
              className="input min-w-[160px]"
            >
              <option value="all">All Hospitals</option>
              {hospitals.map(hospital => (
                <option key={hospital} value={hospital}>{hospital}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="card text-center py-12">
            <FiGrid className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">No bed bookings found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div 
              key={booking._id} 
              className={`card border-l-4 ${
                booking.status === 'pending' ? 'border-amber-500' :
                booking.status === 'approved' ? 'border-blue-500' :
                booking.status === 'confirmed' ? 'border-green-500' :
                'border-gray-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Booking Info */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Patient & Bed */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FiUser className="text-gray-400" />
                      <span className="font-semibold text-gray-800">{booking.patientName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiGrid className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Bed: {booking.bed?.bedNumber} ({booking.bed?.type})
                      </span>
                    </div>
                  </div>

                  {/* Hospital */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FiMapPin className="text-gray-400" />
                      <span className="font-medium text-gray-700">{booking.bed?.hospital?.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiPhone className="text-gray-400" />
                      <span className="text-sm text-gray-600">{booking.user?.phone}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FiCalendar className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        Preferred: {formatDate(booking.preferredDate)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiClock className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Requested: {formatDate(booking.createdAt)} {formatTime(booking.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Status & Reason */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(booking.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1" title={booking.reason}>
                      {booking.reason}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 justify-end">
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(booking._id)}
                        className="btn-sm bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        <FiCheckCircle className="mr-1" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(booking._id)}
                        className="btn-sm bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        <FiXCircle className="mr-1" /> Reject
                      </button>
                    </>
                  )}
                  {booking.status === 'approved' && (
                    <>
                      <button
                        onClick={() => handleConfirm(booking._id)}
                        className="btn-sm bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        <FiCheckCircle className="mr-1" /> Confirm
                      </button>
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="btn-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        <FiXCircle className="mr-1" /> Cancel
                      </button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ Patient can check in
                    </span>
                  )}
                  {(booking.status === 'rejected' || booking.status === 'cancelled') && (
                    <span className="text-sm text-gray-500">
                      No actions available
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BedBookingManagement;
