import React, { useState, useEffect } from 'react';
import { hospitalAPI } from '../../services/api';
import { 
  FiSearch, FiPlus, FiMapPin, FiPhone, FiMail, FiGrid, FiDroplet, 
  FiEdit2, FiTrash2, FiEye, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Hospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    totalBeds: {
      general: 0,
      icu: 0,
      emergency: 0,
      pediatric: 0,
      maternity: 0
    }
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await hospitalAPI.getHospitals();
      if (response.data.success) {
        setHospitals(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch hospitals');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: parent === 'totalBeds' ? parseInt(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await hospitalAPI.updateHospital(selectedHospital._id, formData);
        toast.success('Hospital updated successfully');
      } else {
        await hospitalAPI.createHospital(formData);
        toast.success('Hospital added successfully');
      }
      setShowModal(false);
      resetForm();
      fetchHospitals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (hospital) => {
    setSelectedHospital(hospital);
    setFormData({
      name: hospital.name,
      email: hospital.email || '',
      phone: hospital.phone || '',
      address: hospital.address || { street: '', city: '', state: '', pincode: '' },
      totalBeds: hospital.totalBeds || { general: 0, icu: 0, emergency: 0, pediatric: 0, maternity: 0 }
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (hospitalId) => {
    if (window.confirm('Are you sure you want to delete this hospital?')) {
      try {
        await hospitalAPI.deleteHospital(hospitalId);
        toast.success('Hospital deleted successfully');
        fetchHospitals();
      } catch (error) {
        toast.error('Failed to delete hospital');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: { street: '', city: '', state: '', pincode: '' },
      totalBeds: { general: 0, icu: 0, emergency: 0, pediatric: 0, maternity: 0 }
    });
    setEditMode(false);
    setSelectedHospital(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredHospitals = hospitals.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.address?.city?.toLowerCase().includes(search.toLowerCase())
  );

  const getTotalBeds = (hospital) => {
    if (!hospital.totalBeds) return 0;
    return Object.values(hospital.totalBeds).reduce((a, b) => a + b, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hospital Management</h1>
          <p className="text-gray-500">Manage registered hospitals and facilities</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center space-x-2">
          <FiPlus />
          <span>Add Hospital</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search hospitals by name or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Hospitals Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner w-10 h-10"></div>
        </div>
      ) : filteredHospitals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map((hospital) => (
            <div key={hospital._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <FiGrid className="text-primary-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{hospital.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      hospital.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {hospital.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <FiMapPin className="text-gray-400" />
                  <span>
                    {hospital.address 
                      ? `${hospital.address.city}, ${hospital.address.state}`
                      : 'Address not available'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <FiPhone className="text-gray-400" />
                  <span>{hospital.phone || 'N/A'}</span>
                </div>
              </div>

              {/* Bed Stats */}
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{getTotalBeds(hospital)}</p>
                    <p className="text-xs text-gray-500">Total Beds</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{hospital.availableBeds || 0}</p>
                    <p className="text-xs text-gray-500">Available</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleEdit(hospital)}
                  className="flex-1 btn-secondary py-2 flex items-center justify-center space-x-1"
                >
                  <FiEdit2 />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(hospital._id)}
                  className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <FiGrid className="mx-auto text-5xl text-gray-300 mb-4" />
          <p className="text-gray-500">No hospitals found</p>
          <button onClick={openAddModal} className="btn-primary mt-4">
            Add First Hospital
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {editMode ? 'Edit Hospital' : 'Add New Hospital'}
              </h2>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="City General Hospital"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="contact@hospital.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="123 Healthcare Lane"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Maharashtra"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code</label>
                    <input
                      type="text"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="400001"
                    />
                  </div>
                </div>
              </div>

              {/* Bed Configuration */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">Bed Configuration</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">General</label>
                    <input
                      type="number"
                      name="totalBeds.general"
                      value={formData.totalBeds.general}
                      onChange={handleInputChange}
                      className="input-field"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ICU</label>
                    <input
                      type="number"
                      name="totalBeds.icu"
                      value={formData.totalBeds.icu}
                      onChange={handleInputChange}
                      className="input-field"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emergency</label>
                    <input
                      type="number"
                      name="totalBeds.emergency"
                      value={formData.totalBeds.emergency}
                      onChange={handleInputChange}
                      className="input-field"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pediatric</label>
                    <input
                      type="number"
                      name="totalBeds.pediatric"
                      value={formData.totalBeds.pediatric}
                      onChange={handleInputChange}
                      className="input-field"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maternity</label>
                    <input
                      type="number"
                      name="totalBeds.maternity"
                      value={formData.totalBeds.maternity}
                      onChange={handleInputChange}
                      className="input-field"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 btn-secondary py-3"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-3">
                  {editMode ? 'Update Hospital' : 'Add Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hospitals;
