import React, { useState, useEffect } from 'react';
import { bedAPI, hospitalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  FiSearch, FiFilter, FiGrid, FiPlus, FiX, FiMapPin,
  FiCheckCircle, FiXCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const BedManagement = () => {
  const [beds, setBeds] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterHospital, setFilterHospital] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    hospital: '',
    bedType: 'general',
    bedNumber: '',
    ward: '',
    floor: ''
  });
  const { socket } = useSocket();

  const bedTypes = ['general', 'semi-private', 'private', 'ICU', 'NICU', 'PICU', 'CCU', 'emergency', 'maternity', 'pediatric', 'isolation'];

  useEffect(() => {
    fetchData();
    
    if (socket) {
      socket.on('bedUpdate', () => {
        fetchData();
      });
      
      return () => {
        socket.off('bedUpdate');
      };
    }
  }, [socket]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bedsRes, hospitalsRes] = await Promise.all([
        bedAPI.getBeds(),
        hospitalAPI.getHospitals()
      ]);

      if (bedsRes.data.success) {
        // API returns { beds, stats, availableByType, total, available }
        setBeds(bedsRes.data.data.beds || []);
      }
      if (hospitalsRes.data.success) {
        setHospitals(Array.isArray(hospitalsRes.data.data) ? hospitalsRes.data.data : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch bed data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    try {
      // Transform form data to match API expectations
      const bedData = {
        hospitalId: formData.hospital,
        type: formData.bedType,
        bedNumber: formData.bedNumber,
        ward: formData.ward,
        floor: formData.floor
      };
      await bedAPI.addBed(bedData);
      toast.success('Bed added successfully');
      setShowAddModal(false);
      setFormData({
        hospital: '',
        bedType: 'general',
        bedNumber: '',
        ward: '',
        floor: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add bed');
    }
  };

  const handleUpdateStatus = async (bedId, status) => {
    try {
      await bedAPI.updateBed(bedId, { status });
      toast.success(`Bed status updated to ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update bed status');
    }
  };

  const handleDeleteBed = async (bedId) => {
    if (window.confirm('Are you sure you want to delete this bed?')) {
      try {
        await bedAPI.deleteBed(bedId);
        toast.success('Bed deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete bed');
      }
    }
  };

  const filteredBeds = beds.filter(bed => {
    const matchesSearch = bed.bedNumber?.toLowerCase().includes(search.toLowerCase()) ||
                         bed.hospital?.name?.toLowerCase().includes(search.toLowerCase()) ||
                         bed.ward?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || bed.type === filterType;
    const matchesStatus = filterStatus === 'all' || bed.status === filterStatus;
    const matchesHospital = filterHospital === 'all' || bed.hospital?._id === filterHospital;
    return matchesSearch && matchesType && matchesStatus && matchesHospital;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'occupied': return 'bg-red-100 text-red-700';
      case 'reserved': return 'bg-amber-100 text-amber-700';
      case 'maintenance': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'ICU': case 'NICU': case 'PICU': case 'CCU': return 'bg-red-50 text-red-600';
      case 'emergency': return 'bg-orange-50 text-orange-600';
      case 'pediatric': return 'bg-blue-50 text-blue-600';
      case 'maternity': return 'bg-pink-50 text-pink-600';
      case 'private': case 'semi-private': return 'bg-indigo-50 text-indigo-600';
      case 'isolation': return 'bg-yellow-50 text-yellow-600';
      case 'general': return 'bg-green-50 text-green-600';
      default: return 'bg-purple-50 text-purple-600';
    }
  };

  // Calculate stats
  const stats = {
    total: beds.length,
    available: beds.filter(b => b.status === 'available').length,
    occupied: beds.filter(b => b.status === 'occupied').length,
    reserved: beds.filter(b => b.status === 'reserved').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bed Management</h1>
          <p className="text-gray-500">Manage hospital beds across all facilities</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center space-x-2">
          <FiPlus />
          <span>Add Bed</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <p className="text-purple-100">Total Beds</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <p className="text-green-100">Available</p>
          <p className="text-3xl font-bold">{stats.available}</p>
        </div>
        <div className="card bg-gradient-to-r from-red-500 to-red-600 text-white">
          <p className="text-red-100">Occupied</p>
          <p className="text-3xl font-bold">{stats.occupied}</p>
        </div>
        <div className="card bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <p className="text-amber-100">Reserved</p>
          <p className="text-3xl font-bold">{stats.reserved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by bed number, hospital, or ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <select
              value={filterHospital}
              onChange={(e) => setFilterHospital(e.target.value)}
              className="input-field"
            >
              <option value="all">All Hospitals</option>
              {hospitals.map(h => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              {bedTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
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

      {/* Beds Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner w-10 h-10"></div>
        </div>
      ) : filteredBeds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBeds.map((bed) => (
            <div key={bed._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(bed.type)}`}>
                    {bed.type?.toUpperCase()}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bed.status)}`}>
                  {bed.status}
                </span>
              </div>

              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FiGrid className="text-gray-500 text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Bed #{bed.bedNumber}</h3>
                  <p className="text-sm text-gray-500">{bed.ward || 'General Ward'}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <FiMapPin className="text-gray-400" />
                  <span>{bed.hospital?.name || 'Unknown Hospital'}</span>
                </div>
                {bed.floor && (
                  <p className="text-gray-500">Floor: {bed.floor}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-3 border-t">
                {bed.status === 'available' && (
                  <button
                    onClick={() => handleUpdateStatus(bed._id, 'reserved')}
                    className="flex-1 btn-secondary py-2 text-sm"
                  >
                    Reserve
                  </button>
                )}
                {bed.status === 'reserved' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(bed._id, 'occupied')}
                      className="flex-1 btn-primary py-2 text-sm"
                    >
                      Occupy
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(bed._id, 'available')}
                      className="flex-1 btn-secondary py-2 text-sm"
                    >
                      Release
                    </button>
                  </>
                )}
                {bed.status === 'occupied' && (
                  <button
                    onClick={() => handleUpdateStatus(bed._id, 'available')}
                    className="flex-1 btn-secondary py-2 text-sm"
                  >
                    Mark Available
                  </button>
                )}
                <button
                  onClick={() => handleDeleteBed(bed._id)}
                  className="p-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <FiXCircle />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <FiGrid className="mx-auto text-5xl text-gray-300 mb-4" />
          <p className="text-gray-500">No beds found</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4">
            Add First Bed
          </button>
        </div>
      )}

      {/* Add Bed Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Add New Bed</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleAddBed} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hospital *</label>
                <select
                  name="hospital"
                  value={formData.hospital}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  <option value="">Select Hospital</option>
                  {hospitals.map(h => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bed Type *</label>
                <select
                  name="bedType"
                  value={formData.bedType}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  {bedTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bed Number *</label>
                <input
                  type="text"
                  name="bedNumber"
                  value={formData.bedNumber}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., A101"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ward</label>
                  <input
                    type="text"
                    name="ward"
                    value={formData.ward}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., Ward A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
                  <input
                    type="text"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., 2"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 btn-secondary py-3"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-3">
                  Add Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BedManagement;
