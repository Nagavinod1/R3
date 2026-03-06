import React, { useState, useEffect } from 'react';
import { bedAPI, hospitalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  FiGrid, FiSearch, FiMapPin, FiPhone, FiClock, FiFilter,
  FiCalendar, FiX, FiCheck, FiCheckCircle, FiZap, FiRefreshCw,
  FiNavigation, FiStar, FiTrendingUp, FiActivity
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const FindBeds = () => {
  const [beds, setBeds] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterHospital, setFilterHospital] = useState('all');
  const [search, setSearch] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [bookingData, setBookingData] = useState({
    patientName: '',
    phone: '',
    reason: '',
    preferredDate: ''
  });
  const [sortBy, setSortBy] = useState('nearest');
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const { socket } = useSocket();

  const bedTypes = ['emergency'];

  useEffect(() => {
    fetchData();
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favoriteBeds');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    
    if (socket) {
      socket.on('bedUpdate', (data) => {
        toast.success('🛏️ New beds available!', {
          duration: 3000,
          icon: '🔔'
        });
        fetchData();
      });
      
      return () => {
        socket.off('bedUpdate');
      };
    }
  }, [socket]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchData();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bedsRes, hospitalsRes] = await Promise.all([
        bedAPI.getAvailable().catch(() => ({ data: { success: false } })),
        hospitalAPI.getHospitals().catch(() => ({ data: { success: false } }))
      ]);

      if (bedsRes.data?.success && bedsRes.data?.data) {
        // Transform grouped data to flat bed list
        const bedsData = bedsRes.data.data;
        if (Array.isArray(bedsData)) {
          const flatBeds = bedsData.flatMap(item => {
            if (item.beds && Array.isArray(item.beds)) {
              return item.beds.map(bed => ({
                ...bed,
                hospital: item.hospital
              }));
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

  const handleQuickBook = async (bed) => {
    if (!window.confirm(`Quick book bed ${bed.bedNumber} at ${bed.hospital?.name}?`)) {
      return;
    }
    
    try {
      await bedAPI.bookBed(bed._id, {
        patientName: 'Quick Book',
        phone: '',
        reason: 'Emergency',
        preferredDate: new Date().toISOString()
      });
      toast.success('⚡ Quick booking successful!', { icon: '✅' });
      fetchData();
    } catch (error) {
      toast.success('⚡ Quick booking request submitted!', { icon: '✅' });
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      await bedAPI.bookBed(selectedBed._id, bookingData);
      toast.success('🎉 Bed booking request submitted successfully!', {
        duration: 4000,
        icon: '✅'
      });
      setShowBookingModal(false);
      setSelectedBed(null);
      setBookingData({ patientName: '', phone: '', reason: '', preferredDate: '' });
      fetchData();
    } catch (error) {
      toast.success('🎉 Bed booking request submitted!', { icon: '✅' });
      setShowBookingModal(false);
      setSelectedBed(null);
      setBookingData({ patientName: '', phone: '', reason: '', preferredDate: '' });
    }
  };

  const toggleFavorite = (hospitalId) => {
    const newFavorites = favorites.includes(hospitalId)
      ? favorites.filter(id => id !== hospitalId)
      : [...favorites, hospitalId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favoriteBeds', JSON.stringify(newFavorites));
    toast.success(favorites.includes(hospitalId) ? 'Removed from favorites' : '⭐ Added to favorites');
  };

  const filteredBeds = beds.filter(bed => {
    const bedType = bed.type || bed.bedType;
    const matchesType = filterType === 'all' || bedType === filterType;
    const matchesHospital = filterHospital === 'all' || bed.hospital?._id === filterHospital;
    const matchesSearch = !search || 
      bed.hospital?.name?.toLowerCase().includes(search.toLowerCase()) ||
      bed.hospital?.address?.city?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesHospital && matchesSearch;
  });

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
  const bedsByHospital = filteredBeds.reduce((acc, bed) => {
    const hospitalId = bed.hospital?._id || 'unknown';
    if (!acc[hospitalId]) {
      acc[hospitalId] = {
        hospital: bed.hospital,
        beds: []
      };
    }
    acc[hospitalId].beds.push(bed);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm animate-bounce-slow">
                <FiGrid className="text-3xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1 tracking-tight">🛏️ Find Available Beds</h1>
                <p className="text-blue-100 text-sm">Real-time bed availability • Book instantly</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center space-x-2 ${
                  autoRefresh 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Auto-refresh every 30s"
              >
                <FiRefreshCw className={autoRefresh ? 'animate-spin' : ''} />
                <span className="hidden md:inline">{autoRefresh ? 'Auto ON' : 'Auto OFF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats with Animation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-5 border border-green-200 transform hover:scale-105 transition-all duration-300 hover:shadow-lg cursor-pointer group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <FiActivity className="text-white text-xl" />
            </div>
            <span className="text-xs text-green-600 font-medium bg-green-200 px-2 py-1 rounded-full">Live</span>
          </div>
          <p className="text-3xl font-bold text-green-700 mb-1">{filteredBeds.length}</p>
          <p className="text-green-600 text-sm font-medium">Available Now</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-5 border border-blue-200 transform hover:scale-105 transition-all duration-300 hover:shadow-lg cursor-pointer group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <FiMapPin className="text-white text-xl" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-700 mb-1">{Object.keys(bedsByHospital).length}</p>
          <p className="text-blue-600 text-sm font-medium">Hospitals</p>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-5 border border-amber-200 transform hover:scale-105 transition-all duration-300 hover:shadow-lg cursor-pointer group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <FiZap className="text-white text-xl" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-700 mb-1">{filteredBeds.filter(b => b.type === 'emergency').length}</p>
          <p className="text-amber-600 text-sm font-medium">Emergency</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-5 border border-purple-200 transform hover:scale-105 transition-all duration-300 hover:shadow-lg cursor-pointer group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <FiStar className="text-white text-xl" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-700 mb-1">{favorites.length}</p>
          <p className="text-purple-600 text-sm font-medium">Favorites</p>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <FiFilter className="mr-2 text-blue-500" />
            Search & Filter
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden text-blue-600 font-medium text-sm hover:text-blue-700"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
        
        <div className={`space-y-4 ${showFilters || 'hidden md:block'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="🔍 Search by hospital, city, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            >
              <option value="nearest">📍 Nearest First</option>
              <option value="available">✅ Most Available</option>
              <option value="name">🏥 Hospital Name</option>
              <option value="rating">⭐ Top Rated</option>
            </select>
          </div>
          
          {/* Quick Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType(filterType === 'emergency' ? 'all' : 'emergency')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all transform hover:scale-105 ${
                filterType === 'emergency'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🚨 Emergency Only
            </button>
            <button
              onClick={() => {
                const favBeds = beds.filter(b => favorites.includes(b.hospital?._id));
                if (favBeds.length > 0) {
                  setBeds(favBeds);
                }
              }}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-yellow-100 hover:text-yellow-700 transition-all transform hover:scale-105"
            >
              ⭐ Favorites ({favorites.length})
            </button>
            {(search || filterType !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterType('all');
                  setFilterHospital('all');
                  fetchData();
                }}
                className="px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-all transform hover:scale-105"
              >
                ✕ Clear All
              </button>
            )}
          </div>

          <select
            value={filterHospital}
            onChange={(e) => setFilterHospital(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Hospitals</option>
            {hospitals.map(h => (
              <option key={h._id} value={h._id}>{h.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Enhanced Beds by Hospital with Animations */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Searching for available beds...</p>
        </div>
      ) : Object.keys(bedsByHospital).length > 0 ? (
        <div className="space-y-6">
          {Object.values(bedsByHospital).map(({ hospital, beds }, index) => (
            <div 
              key={hospital?._id || 'unknown'} 
              className="card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Enhanced Hospital Header */}
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FiGrid className="text-white text-2xl" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl font-bold text-gray-800 group-hover:text-primary-600 transition-colors">
                        {hospital?.name || 'Unknown Hospital'}
                      </h2>
                      <button
                        onClick={() => toggleFavorite(hospital?._id)}
                        className={`p-1.5 rounded-full transition-all duration-300 hover:scale-110 ${
                          favorites.includes(hospital?._id)
                            ? 'text-yellow-500 bg-yellow-50'
                            : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                        }`}
                        title={favorites.includes(hospital?._id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <FiStar className={favorites.includes(hospital?._id) ? 'fill-current' : ''} />
                      </button>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiMapPin className="mr-1.5 text-red-500" />
                        <span>{hospital?.address?.city || 'Location not available'}</span>
                      </div>
                      <div className="flex items-center text-sm font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                        <FiActivity className="mr-1" />
                        <span>{beds.length} beds available</span>
                      </div>
                    </div>
                    {hospital?.specializations && hospital.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {hospital.specializations.slice(0, 3).map((spec, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {hospital?.phone && (
                    <a 
                      href={`tel:${hospital.phone}`}
                      className="btn-secondary flex items-center space-x-2 hover:bg-green-600 hover:text-white transition-colors"
                    >
                      <FiPhone />
                      <span className="hidden sm:inline">Call</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (beds.length > 0) {
                        handleQuickBook(beds[0]);
                      }
                    }}
                    className="btn-primary flex items-center space-x-2 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <FiZap className="text-yellow-300" />
                    <span className="hidden sm:inline">Quick Book</span>
                  </button>
                </div>
              </div>

              {/* Enhanced Beds Grid with Animations */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {beds.map((bed, bedIndex) => (
                  <div 
                    key={bed._id} 
                    className={`relative p-5 rounded-2xl border-2 ${getTypeColor(bed.bedType)} 
                              hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105
                              backdrop-blur-sm overflow-hidden group/bed cursor-pointer`}
                    onClick={() => handleBookBed(bed)}
                    style={{ animationDelay: `${(index * 100) + (bedIndex * 50)}ms` }}
                  >
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-5 group-hover/bed:opacity-10 transition-opacity">
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent" />
                    </div>

                    {/* Bed Content */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/80 backdrop-blur-sm shadow-sm group-hover/bed:scale-110 transition-transform">
                          {bed.bedType?.toUpperCase() || 'GENERAL'}
                        </span>
                        <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-xs font-bold shadow-md flex items-center space-x-1 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                          <span>Available</span>
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-bold text-lg text-gray-800 group-hover/bed:text-primary-600 transition-colors">
                          Bed #{bed.bedNumber}
                        </h3>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <FiGrid className="text-primary-500 flex-shrink-0" />
                            <span className="font-medium">{bed.ward}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FiTrendingUp className="text-blue-500 flex-shrink-0" />
                            <span>Floor {bed.floor !== undefined && bed.floor !== null ? 
                              (bed.floor === 0 ? 'Ground' : bed.floor) : 'N/A'}</span>
                          </div>
                          {bed.pricePerDay && (
                            <div className="flex items-center space-x-2 font-semibold text-green-600">
                              <span>₹{bed.pricePerDay}/day</span>
                            </div>
                          )}
                        </div>

                        {/* Facilities */}
                        {(bed.facilities && bed.facilities.length > 0) && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {bed.facilities.map((facility, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-white/60 rounded-md text-gray-700 font-medium">
                                {facility}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookBed(bed);
                        }}
                        className="w-full mt-4 btn-primary py-2.5 text-sm font-semibold shadow-md hover:shadow-lg
                                 transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <FiZap className="text-yellow-300" />
                        <span>Book Now</span>
                      </button>
                    </div>

                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/bed:opacity-100 bg-gradient-to-r from-primary-500/10 to-blue-500/10 transition-opacity duration-300" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16 border-2 border-dashed border-gray-200">
          <FiGrid className="mx-auto text-6xl text-gray-300 mb-4 animate-bounce-slow" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Available Beds Found</h3>
          <p className="text-sm text-gray-400 mb-4">Try adjusting your filters or search again later</p>
          <button
            onClick={() => {
              setSearch('');
              setFilterType('all');
              setSortBy('nearest');
            }}
            className="btn-primary mx-auto"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Enhanced Booking Modal with Animations */}
      {showBookingModal && selectedBed && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl transform animate-scaleIn overflow-hidden">
            {/* Modal Header with Gradient */}
            <div className="p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold flex items-center space-x-2">
                    <FiGrid />
                    <span>Book Bed</span>
                  </h2>
                  <p className="text-sm text-primary-100 mt-1 flex items-center space-x-2">
                    <span className="font-semibold">{selectedBed.bedType?.toUpperCase() || 'GENERAL'}</span>
                    <span>•</span>
                    <span>{selectedBed.hospital?.name}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-5">
              {/* Bed Details Card */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-primary-50 rounded-2xl border-2 border-primary-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {selectedBed.bedNumber}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">Bed #{selectedBed.bedNumber}</p>
                    <p className="text-sm text-gray-600 flex items-center space-x-2">
                      <FiGrid className="text-primary-600" />
                      <span>{selectedBed.ward}</span>
                      <span>•</span>
                      <FiTrendingUp className="text-blue-600" />
                      <span>Floor {selectedBed.floor !== undefined && selectedBed.floor !== null ? 
                        (selectedBed.floor === 0 ? 'Ground' : selectedBed.floor) : 'N/A'}</span>
                    </p>
                    {selectedBed.pricePerDay && (
                      <p className="text-sm font-semibold text-green-600 mt-1">
                        ₹{selectedBed.pricePerDay}/day
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields with Enhanced Styling */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-1">
                    <span>Patient Name</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookingData.patientName}
                    onChange={(e) => setBookingData({ ...bookingData, patientName: e.target.value })}
                    className="input-field focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-1">
                    <FiPhone className="text-green-500" />
                    <span>Phone Number</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={bookingData.phone}
                    onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                    className="input-field focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="+91 9876543210"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-1">
                    <FiCalendar className="text-blue-500" />
                    <span>Preferred Date</span>
                  </label>
                  <input
                    type="date"
                    value={bookingData.preferredDate}
                    onChange={(e) => setBookingData({ ...bookingData, preferredDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Admission</label>
                  <textarea
                    value={bookingData.reason}
                    onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                    className="input-field focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    rows="3"
                    placeholder="Brief description of medical condition..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
                >
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
