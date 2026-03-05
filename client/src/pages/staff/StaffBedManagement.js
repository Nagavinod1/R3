import React, { useState, useEffect } from 'react';
import { bedAPI, hospitalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  FiGrid, FiSearch, FiFilter, FiMapPin, FiCheckCircle,
  FiXCircle, FiClock, FiArrowLeft, FiPhone, FiActivity,
  FiChevronRight, FiPlus, FiSettings, FiAlertCircle,
  FiUsers, FiHome, FiLayers
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const StaffBedManagement = () => {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const { socket } = useSocket();

  const bedTypes = ['emergency', 'icu', 'general', 'pediatric', 'maternity'];

  useEffect(() => {
    fetchHospitals();
    
    if (socket) {
      const handleBedUpdate = (data) => {
        console.log('Bed update received:', data);
        fetchHospitals();
        if (selectedHospital?._id) {
          fetchBeds(selectedHospital._id);
        }
      };

      const handleNewBedBooking = (data) => {
        console.log('New bed booking received:', data);
        toast.success(
          `🛏️ New bed booking! Bed #${data?.bedNumber || 'N/A'} in ${data?.ward || 'Unknown Ward'} (${data?.bookingType || 'scheduled'})`,
          { duration: 5000, icon: '🔔' }
        );
        fetchHospitals();
        if (selectedHospital?._id) {
          fetchBeds(selectedHospital._id);
        }
      };

      socket.on('bedUpdate', handleBedUpdate);
      socket.on('bedStatusUpdate', handleBedUpdate);
      socket.on('newBedBooking', handleNewBedBooking);
      
      return () => {
        socket.off('bedUpdate', handleBedUpdate);
        socket.off('bedStatusUpdate', handleBedUpdate);
        socket.off('newBedBooking', handleNewBedBooking);
      };
    }
  }, [socket, selectedHospital]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await hospitalAPI.getHospitals();
      if (response.data?.success) {
        const hospitalData = Array.isArray(response.data.data) ? response.data.data : [];
        // Fetch real bed stats for each hospital
        const hospitalsWithStats = await Promise.all(
          hospitalData.map(async (h) => {
            try {
              const statsRes = await bedAPI.getStats(h._id);
              const stats = statsRes.data?.data || {};
              return {
                ...h,
                totalBeds: stats.total || 0,
                availableBeds: stats.available || 0,
                occupiedBeds: stats.occupied || 0,
                maintenanceBeds: stats.maintenance || 0
              };
            } catch {
              return {
                ...h,
                totalBeds: h.totalBeds || 0,
                availableBeds: h.availableBeds || 0,
                occupiedBeds: h.occupiedBeds || 0,
                maintenanceBeds: h.maintenanceBeds || 0
              };
            }
          })
        );
        setHospitals(hospitalsWithStats);
      } else {
        setHospitals([]);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async (hospitalId) => {
    try {
      setLoading(true);
      const response = await bedAPI.getBeds({ hospitalId });
      if (response.data?.success && response.data?.data) {
        const bedsData = response.data.data.beds || response.data.data;
        setBeds(Array.isArray(bedsData) ? bedsData : []);
      } else {
        setBeds([]);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
      setBeds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHospital = (hospital) => {
    setSelectedHospital(hospital);
    fetchBeds(hospital._id);
  };

  const handleBackToHospitals = () => {
    setSelectedHospital(null);
    setBeds([]);
  };

  const handleUpdateStatus = async (bedId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this bed as ${newStatus}?`)) {
      return;
    }

    try {
      const response = await bedAPI.updateBed(bedId, { status: newStatus });
      
      if (response.data?.success) {
        toast.success(`Bed status updated to ${newStatus} successfully`);
        if (selectedHospital?._id) {
          fetchBeds(selectedHospital._id);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to update');
      }
    } catch (error) {
      console.error('Update bed status error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update bed status';
      toast.error(errorMessage);
    }
  };

  const filteredBeds = beds.filter(bed => {
    const bedType = bed.type || 'general';
    const matchesType = filterType === 'all' || bedType === filterType;
    const matchesStatus = filterStatus === 'all' || bed.status === filterStatus;
    const matchesSearch = !search || 
      bed.bedNumber?.toLowerCase().includes(search.toLowerCase()) ||
      bed.ward?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const filteredHospitals = hospitals.filter(h => {
    const hospitalName = (h.name || '').toLowerCase();
    const hospitalAddress = typeof h.address === 'object' 
      ? `${h.address?.street || ''} ${h.address?.city || ''} ${h.address?.district || ''}`.toLowerCase() 
      : (h.address || '').toLowerCase();
    const searchTerm = hospitalSearch.toLowerCase();
    return hospitalName.includes(searchTerm) || hospitalAddress.includes(searchTerm);
  });

  const getStatusColor = (status) => {
    const normalizedStatus = (status || 'available').toLowerCase();
    switch (normalizedStatus) {
      case 'available': return 'from-green-400 to-emerald-500';
      case 'occupied': return 'from-red-400 to-rose-500';
      case 'reserved': return 'from-amber-400 to-orange-500';
      case 'maintenance':
      case 'cleaning': return 'from-gray-400 to-slate-500';
      default: return 'from-gray-400 to-slate-500';
    }
  };

  const getStatusBgColor = (status) => {
    const normalizedStatus = (status || 'available').toLowerCase();
    switch (normalizedStatus) {
      case 'available': return 'bg-green-100 text-green-700 border-green-300';
      case 'occupied': return 'bg-red-100 text-red-700 border-red-300';
      case 'reserved': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'maintenance':
      case 'cleaning': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeIcon = (type) => {
    const normalizedType = (type || 'general').toLowerCase();
    switch (normalizedType) {
      case 'icu': return '🏥';
      case 'emergency': return '🚨';
      case 'pediatric': return '👶';
      case 'maternity': return '🤱';
      case 'general':
      default: return '🛏️';
    }
  };

  const getTypeColor = (type) => {
    const normalizedType = (type || 'general').toLowerCase();
    switch (normalizedType) {
      case 'icu': return 'bg-red-100 text-red-600 border-red-200';
      case 'emergency': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'pediatric': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'maternity': return 'bg-pink-100 text-pink-600 border-pink-200';
      case 'general':
      default: return 'bg-purple-100 text-purple-600 border-purple-200';
    }
  };

  const stats = {
    total: beds.length,
    available: beds.filter(b => b.status === 'available').length,
    occupied: beds.filter(b => b.status === 'occupied').length,
    reserved: beds.filter(b => b.status === 'reserved').length,
    maintenance: beds.filter(b => b.status === 'maintenance' || b.status === 'cleaning').length
  };

  // Hospital List View
  if (!selectedHospital) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <FiGrid className="text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bed Management</h1>
              <p className="text-blue-100 mt-1">Select a hospital to manage bed availability</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Hospitals</p>
                <p className="text-2xl font-bold text-blue-700">{hospitals.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <FiHome className="text-white text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Available</p>
                <p className="text-2xl font-bold text-green-700">{hospitals.reduce((a, h) => a + (h.availableBeds || 0), 0)}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <FiCheckCircle className="text-white text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Total Occupied</p>
                <p className="text-2xl font-bold text-red-700">{hospitals.reduce((a, h) => a + (h.occupiedBeds || 0), 0)}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <FiUsers className="text-white text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Under Maintenance</p>
                <p className="text-2xl font-bold text-gray-700">{hospitals.reduce((a, h) => a + (h.maintenanceBeds || 0), 0)}</p>
              </div>
              <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
                <FiSettings className="text-white text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search hospitals by name or location..."
              value={hospitalSearch}
              onChange={(e) => setHospitalSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700"
            />
          </div>
        </div>

        {/* Hospital Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Loading hospitals...</p>
          </div>
        ) : filteredHospitals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHospitals.map((hospital) => {
              const occupancyRate = hospital.totalBeds > 0 
                ? Math.round((hospital.occupiedBeds / hospital.totalBeds) * 100) 
                : 0;
              
              return (
                <div
                  key={hospital._id}
                  onClick={() => handleSelectHospital(hospital)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                      <FiActivity className="text-white text-2xl" />
                    </div>
                    <div className="flex items-center space-x-1 text-blue-500 group-hover:translate-x-1 transition-transform">
                      <span className="text-sm font-medium">Manage</span>
                      <FiChevronRight />
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-gray-800 text-lg mb-2">{hospital.name}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-500 text-sm">
                      <FiMapPin className="mr-2 text-gray-400" />
                      <span className="truncate">
                        {typeof hospital.address === 'object' 
                          ? `${hospital.address?.street || ''}, ${hospital.address?.city || ''}, ${hospital.address?.district || ''}`.replace(/^,\s*|,\s*$/g, '') 
                          : hospital.address || 'Address not available'}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <FiPhone className="mr-2 text-gray-400" />
                      <span>{hospital.phone || 'Phone not available'}</span>
                    </div>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Occupancy Rate</span>
                      <span className={`font-semibold ${occupancyRate > 80 ? 'text-red-600' : occupancyRate > 60 ? 'text-amber-600' : 'text-green-600'}`}>
                        {occupancyRate}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          occupancyRate > 80 ? 'bg-gradient-to-r from-red-400 to-rose-500' : 
                          occupancyRate > 60 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 
                          'bg-gradient-to-r from-green-400 to-emerald-500'
                        }`}
                        style={{ width: `${occupancyRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{hospital.totalBeds || 0}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{hospital.availableBeds || 0}</p>
                      <p className="text-xs text-gray-500">Free</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600">{hospital.occupiedBeds || 0}</p>
                      <p className="text-xs text-gray-500">Used</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-600">{hospital.maintenanceBeds || 0}</p>
                      <p className="text-xs text-gray-500">Fix</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {filteredHospitals.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMapPin className="text-gray-400 text-3xl" />
            </div>
            <p className="text-gray-500 text-lg">No hospitals found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    );
  }

  // Hospital Bed Management View
  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg">
        <button
          onClick={handleBackToHospitals}
          className="flex items-center space-x-2 text-white/80 hover:text-white mb-4 transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Hospitals</span>
        </button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <FiGrid className="text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{selectedHospital.name}</h1>
              <p className="text-blue-100 flex items-center mt-1">
                <FiMapPin className="mr-2" />
                {typeof selectedHospital.address === 'object'
                  ? `${selectedHospital.address?.street || ''}, ${selectedHospital.address?.city || ''}, ${selectedHospital.address?.district || ''}`.replace(/^,\s*|,\s*$/g, '')
                  : selectedHospital.address || 'Address not available'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-600' : 'text-white'}`}
              >
                <FiGrid />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600' : 'text-white'}`}
              >
                <FiLayers />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <FiGrid className="text-blue-500" />
          </div>
          <p className="text-gray-500 text-sm">Total</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-4 text-center hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
            <FiCheckCircle className="text-white" />
          </div>
          <p className="text-green-600 text-sm">Available</p>
          <p className="text-2xl font-bold text-green-700">{stats.available}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-sm border border-red-200 p-4 text-center hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-2">
            <FiXCircle className="text-white" />
          </div>
          <p className="text-red-600 text-sm">Occupied</p>
          <p className="text-2xl font-bold text-red-700">{stats.occupied}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-200 p-4 text-center hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center mx-auto mb-2">
            <FiClock className="text-white" />
          </div>
          <p className="text-amber-600 text-sm">Reserved</p>
          <p className="text-2xl font-bold text-amber-700">{stats.reserved}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center mx-auto mb-2">
            <FiSettings className="text-white" />
          </div>
          <p className="text-gray-600 text-sm">Maintenance</p>
          <p className="text-2xl font-bold text-gray-700">{stats.maintenance}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by bed number or ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Types</option>
              {bedTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Beds Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Loading beds...</p>
        </div>
      ) : filteredBeds.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBeds.map((bed) => (
              <div 
                key={bed._id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Status Bar */}
                <div className={`h-2 bg-gradient-to-r ${getStatusColor(bed.status)}`}></div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(bed.type || 'general')}`}>
                      {getTypeIcon(bed.type || 'general')} {(bed.type || 'general').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBgColor(bed.status || 'available')}`}>
                      {bed.status || 'available'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${getStatusColor(bed.status || 'available')} shadow-lg`}>
                      <span className="text-white text-2xl">🛏️</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">Bed #{bed.bedNumber || 'N/A'}</h3>
                      <p className="text-sm text-gray-500">{bed.ward || 'General Ward'}</p>
                    </div>
                  </div>

                  {(bed.floor !== undefined && bed.floor !== null) && (
                    <div className="flex items-center text-gray-500 text-sm mb-4 bg-gray-50 px-3 py-2 rounded-lg">
                      <FiLayers className="mr-2 text-gray-400" />
                      <span>Floor: {bed.floor === 0 ? 'Ground' : bed.floor}</span>
                    </div>
                  )}

                  {/* Quick Status Update */}
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-2">Quick Update:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {bed.status !== 'available' && (
                        <button
                          onClick={() => handleUpdateStatus(bed._id, 'available')}
                          className="px-3 py-2 text-xs font-semibold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center space-x-1"
                        >
                          <FiCheckCircle className="text-sm" />
                          <span>Available</span>
                        </button>
                      )}
                      {bed.status !== 'occupied' && (
                        <button
                          onClick={() => handleUpdateStatus(bed._id, 'occupied')}
                          className="px-3 py-2 text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-1"
                        >
                          <FiXCircle className="text-sm" />
                          <span>Occupied</span>
                        </button>
                      )}
                      {bed.status !== 'reserved' && (
                        <button
                          onClick={() => handleUpdateStatus(bed._id, 'reserved')}
                          className="px-3 py-2 text-xs font-semibold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center justify-center space-x-1"
                        >
                          <FiClock className="text-sm" />
                          <span>Reserved</span>
                        </button>
                      )}
                      {bed.status !== 'maintenance' && (
                        <button
                          onClick={() => handleUpdateStatus(bed._id, 'maintenance')}
                          className="px-3 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
                        >
                          <FiSettings className="text-sm" />
                          <span>Maintenance</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Bed Info</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ward</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Floor</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBeds.map((bed) => (
                    <tr key={bed._id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${getStatusColor(bed.status || 'available')}`}>
                            <span className="text-white">🛏️</span>
                          </div>
                          <span className="font-bold text-gray-800">#{bed.bedNumber || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(bed.type || 'general')}`}>
                          {getTypeIcon(bed.type || 'general')} {(bed.type || 'general').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{bed.ward || 'General'}</td>
                      <td className="px-6 py-4 text-gray-700">
                        {bed.floor !== undefined && bed.floor !== null ? (bed.floor === 0 ? 'Ground' : bed.floor) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBgColor(bed.status || 'available')}`}>
                          {bed.status || 'available'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {bed.status !== 'available' && (
                            <button
                              onClick={() => handleUpdateStatus(bed._id, 'available')}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                              title="Mark Available"
                            >
                              <FiCheckCircle />
                            </button>
                          )}
                          {bed.status !== 'occupied' && (
                            <button
                              onClick={() => handleUpdateStatus(bed._id, 'occupied')}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="Mark Occupied"
                            >
                              <FiXCircle />
                            </button>
                          )}
                          {bed.status !== 'maintenance' && (
                            <button
                              onClick={() => handleUpdateStatus(bed._id, 'maintenance')}
                              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                              title="Mark Maintenance"
                            >
                              <FiSettings />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiGrid className="text-blue-400 text-3xl" />
          </div>
          <p className="text-gray-600 text-lg font-medium">No beds found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

export default StaffBedManagement;
