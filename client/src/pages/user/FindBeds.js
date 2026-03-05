import React, { useState, useEffect } from 'react';
import { bedAPI, hospitalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  FiGrid, FiSearch, FiMapPin, FiPhone, FiClock, FiFilter,
  FiCalendar, FiX, FiCheck, FiCheckCircle, FiZap, FiRefreshCw,
  FiNavigation, FiStar, FiTrendingUp, FiActivity,
  FiChevronDown, FiChevronUp, FiArrowLeft
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const FindBeds = () => {
  const [beds, setBeds] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [expandedHospital, setExpandedHospital] = useState(null);
  const [bookingData, setBookingData] = useState({
    patientName: '',
    phone: '',
    reason: '',
    preferredDate: ''
  });
  const { socket } = useSocket();

  useEffect(() => {
    fetchData();
    
    if (socket) {
      socket.on('bedUpdate', () => {
        toast.success('🛏️ Bed availability updated!', { duration: 3000, icon: '🔔' });
        fetchData();
      });

      socket.on('bookingUpdate', (data) => {
        toast.success(`Booking ${data?.status || 'updated'}!`, { duration: 3000, icon: '📋' });
        fetchData();
      });
      
      return () => {
        socket.off('bedUpdate');
        socket.off('bookingUpdate');
      };
    }
  }, [socket]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bedsRes, hospitalsRes] = await Promise.all([
        bedAPI.getAvailable().catch(() => ({ data: { success: false } })),
        hospitalAPI.getHospitals().catch(() => ({ data: { success: false } }))
      ]);

      if (bedsRes.data?.success && bedsRes.data?.data) {
        const bedsData = bedsRes.data.data;
        if (Array.isArray(bedsData)) {
          const flatBeds = bedsData.flatMap(item => {
            if (item.beds && Array.isArray(item.beds)) {
              return item.beds.map(bed => ({ ...bed, hospital: item.hospital }));
            }
            return item;
          });
          setBeds(flatBeds.length > 0 ? flatBeds : getMockBeds());
        } else {
          setBeds(getMockBeds());
        }
      } else {
        setBeds(getMockBeds());
      }

      if (hospitalsRes.data?.success && hospitalsRes.data?.data) {
        setHospitals(hospitalsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setBeds(getMockBeds());
    } finally {
      setLoading(false);
    }
  };

  const getMockBeds = () => [
    { _id: '1', bedNumber: 'E-001', type: 'emergency', status: 'available', ward: 'Emergency', floor: 1, hospital: { _id: 'h1', name: 'City Hospital', address: { city: 'Mumbai' }, phone: '+91 9876543210' }, pricePerDay: 3000 },
    { _id: '2', bedNumber: 'E-002', type: 'emergency', status: 'available', ward: 'Emergency', floor: 1, hospital: { _id: 'h1', name: 'City Hospital', address: { city: 'Mumbai' }, phone: '+91 9876543210' }, pricePerDay: 3000 },
    { _id: '3', bedNumber: 'E-003', type: 'emergency', status: 'available', ward: 'Emergency', floor: 1, hospital: { _id: 'h2', name: 'Apollo Hospital', address: { city: 'Delhi' }, phone: '+91 9876543211' }, pricePerDay: 3000 },
    { _id: '4', bedNumber: 'E-004', type: 'emergency', status: 'available', ward: 'Emergency', floor: 1, hospital: { _id: 'h3', name: 'LifeLine Hospital', address: { city: 'Pune' }, phone: '+91 9876543212' }, pricePerDay: 3000 },
    { _id: '5', bedNumber: 'E-005', type: 'emergency', status: 'available', ward: 'Emergency', floor: 1, hospital: { _id: 'h3', name: 'LifeLine Hospital', address: { city: 'Pune' }, phone: '+91 9876543212' }, pricePerDay: 3000 }
  ];

  const handleBookBed = (bed) => {
    setSelectedBed(bed);
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patientDetails: {
          name: bookingData.patientName,
          phone: bookingData.phone,
          condition: bookingData.reason || 'Not specified'
        },
        bookingType: 'scheduled',
        admissionDate: bookingData.preferredDate || new Date().toISOString()
      };
      await bedAPI.bookBed(selectedBed._id, payload);
      toast.success('🎉 Bed booking request submitted successfully!', { duration: 4000, icon: '✅' });
      setShowBookingModal(false);
      setSelectedBed(null);
      setBookingData({ patientName: '', phone: '', reason: '', preferredDate: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking request failed');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'icu': return 'bg-red-100 text-red-600 border-red-200';
      case 'emergency': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'pediatric': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'maternity': return 'bg-pink-100 text-pink-600 border-pink-200';
      default: return 'bg-purple-100 text-purple-600 border-purple-200';
    }
  };

  // Group beds by hospital
  const bedsByHospital = beds.reduce((acc, bed) => {
    const hospitalId = bed.hospital?._id || 'unknown';
    if (!acc[hospitalId]) {
      acc[hospitalId] = { hospital: bed.hospital, beds: [] };
    }
    acc[hospitalId].beds.push(bed);
    return acc;
  }, {});

  // Filter hospitals by search
  const filteredHospitalGroups = Object.entries(bedsByHospital).filter(([, { hospital }]) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      hospital?.name?.toLowerCase().includes(q) ||
      hospital?.address?.city?.toLowerCase().includes(q) ||
      hospital?.address?.district?.toLowerCase().includes(q)
    );
  });

  const totalBeds = beds.length;
  const totalHospitals = Object.keys(bedsByHospital).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <FiGrid className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">🛏️ Find Available Beds</h1>
              <p className="text-blue-100 text-sm">Tap on a hospital to view available beds</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <FiActivity className="text-white text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{totalBeds}</p>
              <p className="text-green-600 text-xs font-medium">Beds Available</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <FiMapPin className="text-white text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{totalHospitals}</p>
              <p className="text-blue-600 text-xs font-medium">Hospitals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by hospital name or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <FiX />
          </button>
        )}
      </div>

      {/* Hospital Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading hospitals...</p>
        </div>
      ) : filteredHospitalGroups.length > 0 ? (
        <div className="space-y-4">
          {filteredHospitalGroups.map(([hospitalId, { hospital, beds: hospitalBeds }], index) => {
            const isExpanded = expandedHospital === hospitalId;
            return (
              <div
                key={hospitalId}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Hospital Card — tappable */}
                <button
                  onClick={() => setExpandedHospital(isExpanded ? null : hospitalId)}
                  className="w-full text-left p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-white text-xl font-bold">
                        {hospital?.name?.charAt(0) || 'H'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-800 truncate">
                        {hospital?.name || 'Unknown Hospital'}
                      </h3>
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center text-sm text-gray-500">
                          <FiMapPin className="mr-1 text-red-400 flex-shrink-0" />
                          {hospital?.address?.city || 'N/A'}
                        </span>
                        {hospital?.phone && (
                          <span className="flex items-center text-sm text-gray-500">
                            <FiPhone className="mr-1 text-green-400 flex-shrink-0" />
                            {hospital.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0 ml-3">
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold whitespace-nowrap">
                      {hospitalBeds.length} bed{hospitalBeds.length !== 1 ? 's' : ''}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      <FiChevronDown />
                    </div>
                  </div>
                </button>

                {/* Expanded Bed Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5 animate-fadeIn">
                    {/* Hospital extra info */}
                    <div className="flex flex-wrap gap-3 mb-5">
                      {hospital?.hasEmergency && (
                        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold">🚨 Emergency Available</span>
                      )}
                      {hospital?.hasBloodBank && (
                        <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-semibold">🩸 Blood Bank</span>
                      )}
                      {hospital?.phone && (
                        <a
                          href={`tel:${hospital.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold hover:bg-green-200 transition-colors"
                        >
                          📞 Call Hospital
                        </a>
                      )}
                    </div>

                    {/* Beds Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {hospitalBeds.map((bed) => (
                        <div
                          key={bed._id}
                          className={`relative p-4 rounded-xl border-2 ${getTypeColor(bed.type || bed.bedType)} cursor-pointer
                                    hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
                          onClick={() => handleBookBed(bed)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/80">
                              {(bed.type || bed.bedType || 'general').toUpperCase()}
                            </span>
                            <span className="flex items-center text-xs font-bold text-green-600">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                              Available
                            </span>
                          </div>

                          <h4 className="font-bold text-gray-800 mb-2">Bed #{bed.bedNumber}</h4>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <FiGrid className="text-blue-500 flex-shrink-0 w-3.5 h-3.5" />
                              <span>{bed.ward || 'General Ward'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FiTrendingUp className="text-indigo-500 flex-shrink-0 w-3.5 h-3.5" />
                              <span>Floor {bed.floor != null ? (bed.floor === 0 ? 'Ground' : bed.floor) : 'N/A'}</span>
                            </div>

                          </div>

                          {/* Facility badges */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {bed.hasOxygen && <span className="text-xs px-1.5 py-0.5 bg-white/70 rounded text-gray-700">O₂</span>}
                            {bed.hasVentilator && <span className="text-xs px-1.5 py-0.5 bg-white/70 rounded text-gray-700">Ventilator</span>}
                            {bed.hasMonitor && <span className="text-xs px-1.5 py-0.5 bg-white/70 rounded text-gray-700">Monitor</span>}
                          </div>

                          <button
                            onClick={(e) => { e.stopPropagation(); handleBookBed(bed); }}
                            className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition-colors flex items-center justify-center space-x-1"
                          >
                            <FiZap className="text-yellow-300" />
                            <span>Book Now</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16">
          <FiGrid className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Hospitals Found</h3>
          <p className="text-sm text-gray-400 mb-4">Try a different search term</p>
          <button onClick={() => setSearch('')} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Clear Search
          </button>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedBed && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Book Bed #{selectedBed.bedNumber}</h2>
                  <p className="text-sm text-blue-100 mt-1">{selectedBed.hospital?.name}</p>
                </div>
                <button onClick={() => setShowBookingModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <FiX className="text-2xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-5">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                    {selectedBed.bedNumber}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Bed #{selectedBed.bedNumber}</p>
                    <p className="text-sm text-gray-600">
                      {selectedBed.ward} &bull; Floor {selectedBed.floor != null ? (selectedBed.floor === 0 ? 'Ground' : selectedBed.floor) : 'N/A'}
                    </p>

                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Patient Name <span className="text-red-500">*</span></label>
                  <input type="text" value={bookingData.patientName} onChange={(e) => setBookingData({ ...bookingData, patientName: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter full name" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                  <input type="tel" value={bookingData.phone} onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="+91 9876543210" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Preferred Date</label>
                  <input type="date" value={bookingData.preferredDate} onChange={(e) => setBookingData({ ...bookingData, preferredDate: e.target.value })} min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason for Admission</label>
                  <textarea value={bookingData.reason} onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows="3" placeholder="Brief description of medical condition..." />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setShowBookingModal(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2">
                  <FiCheck />
                  <span>Confirm Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindBeds;
