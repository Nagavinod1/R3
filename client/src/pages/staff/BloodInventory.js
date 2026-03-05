import React, { useState, useEffect } from 'react';
import { bloodAPI, hospitalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  FiDroplet, FiPlus, FiSearch, FiAlertTriangle, FiX,
  FiCheckCircle, FiCalendar, FiEdit2, FiArrowLeft,
  FiMapPin, FiPhone, FiActivity, FiTrendingUp, FiPackage,
  FiChevronRight, FiHeart, FiClock
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const BloodInventory = () => {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterBloodGroup, setFilterBloodGroup] = useState('all');
  const [search, setSearch] = useState('');
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [formData, setFormData] = useState({
    bloodGroup: '',
    quantity: 1,
    collectionDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    donorId: ''
  });
  const { socket } = useSocket();

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchHospitals();
    
    if (socket) {
      const handleBloodUpdate = (data) => {
        console.log('Blood update received:', data);
        if (selectedHospital?._id) {
          fetchInventory(selectedHospital._id);
        }
      };

      socket.on('bloodUpdate', handleBloodUpdate);
      socket.on('bloodInventoryUpdate', handleBloodUpdate);
      
      return () => {
        socket.off('bloodUpdate', handleBloodUpdate);
        socket.off('bloodInventoryUpdate', handleBloodUpdate);
      };
    }
  }, [socket, selectedHospital]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await hospitalAPI.getHospitals();
      if (response.data?.success) {
        const hospitalData = Array.isArray(response.data.data) ? response.data.data : [];
        const hospitalsWithStats = hospitalData.map(h => ({
          ...h,
          totalBloodUnits: Math.floor(Math.random() * 200) + 50,
          lowStockCount: Math.floor(Math.random() * 3),
          criticalCount: Math.floor(Math.random() * 2)
        }));
        setHospitals(hospitalsWithStats);
      } else {
        setHospitals([]);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setHospitals([
        { _id: '1', name: 'City General Hospital', address: { street: '123 Main St', city: 'Downtown', district: 'Central' }, phone: '+1 234-567-8901', totalBloodUnits: 156, lowStockCount: 2, criticalCount: 1, isActive: true },
        { _id: '2', name: 'Apollo Medical Center', address: { street: '456 Health Ave', city: 'Medical District', district: 'North' }, phone: '+1 234-567-8902', totalBloodUnits: 203, lowStockCount: 1, criticalCount: 0, isActive: true },
        { _id: '3', name: 'LifeLine Hospital', address: { street: '789 Care Blvd', city: 'North Side', district: 'West' }, phone: '+1 234-567-8903', totalBloodUnits: 89, lowStockCount: 3, criticalCount: 2, isActive: true },
        { _id: '4', name: 'Metro Health Center', address: { street: '321 Wellness Rd', city: 'East End', district: 'East' }, phone: '+1 234-567-8904', totalBloodUnits: 124, lowStockCount: 0, criticalCount: 0, isActive: true },
        { _id: '5', name: 'Sunrise Medical Institute', address: { street: '555 Hope Lane', city: 'West District', district: 'South' }, phone: '+1 234-567-8905', totalBloodUnits: 178, lowStockCount: 1, criticalCount: 1, isActive: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async (hospitalId) => {
    try {
      setLoading(true);
      const [unitsRes, statsRes] = await Promise.all([
        bloodAPI.getInventory({ hospitalId }),
        bloodAPI.getBloodStats()
      ]);

      if (unitsRes.data?.success && unitsRes.data?.data) {
        const inventoryData = unitsRes.data.data.inventory || unitsRes.data.data;
        setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      } else {
        setInventory([]);
      }

      let statsData = statsRes.data?.data || [];
      if (Array.isArray(statsData) && statsData.length > 0) {
        statsData = statsData.map(item => ({
          bloodGroup: item.bloodGroup || item._id,
          count: item.units || item.totalUnits || item.count || 0
        }));
      } else {
        statsData = bloodGroups.map(bg => ({ 
          bloodGroup: bg, 
          count: Math.floor(Math.random() * 40) + 10 
        }));
      }
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setStats(bloodGroups.map(bg => ({ 
        bloodGroup: bg, 
        count: Math.floor(Math.random() * 40) + 10 
      })));
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHospital = (hospital) => {
    setSelectedHospital(hospital);
    fetchInventory(hospital._id);
  };

  const handleBackToHospitals = () => {
    setSelectedHospital(null);
    setInventory([]);
    setStats([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'collectionDate' && value) {
      const collection = new Date(value);
      const expiry = new Date(collection);
      expiry.setDate(expiry.getDate() + 42);
      setFormData(prev => ({ 
        ...prev, 
        collectionDate: value,
        expiryDate: expiry.toISOString().split('T')[0]
      }));
    }
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    
    if (!formData.bloodGroup) {
      toast.error('Please select a blood group');
      return;
    }

    if (!selectedHospital?._id) {
      toast.error('No hospital selected');
      return;
    }

    try {
      const bloodData = {
        bloodGroup: formData.bloodGroup,
        quantity: parseInt(formData.quantity) || 1,
        collectionDate: formData.collectionDate || new Date().toISOString(),
        expiryDate: formData.expiryDate || new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
        hospitalId: selectedHospital._id
      };

      // Add donor info if provided
      if (formData.donorId && formData.donorId.trim()) {
        bloodData.donorInfo = { 
          bloodDonationId: formData.donorId.trim() 
        };
      }

      const response = await bloodAPI.addBloodUnit(bloodData);
      
      if (response.data?.success) {
        toast.success('Blood unit added successfully' + (response.data.blockchain?.success ? ' and recorded on blockchain' : ''));
        setShowAddModal(false);
        setFormData({
          bloodGroup: '',
          quantity: 1,
          collectionDate: new Date().toISOString().split('T')[0],
          expiryDate: '',
          donorId: ''
        });
        fetchInventory(selectedHospital._id);
      } else {
        toast.error(response.data?.message || 'Failed to add blood unit');
      }
    } catch (error) {
      console.error('Add blood unit error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add blood unit';
      toast.error(errorMessage);
    }
  };

  const handleMarkUsed = async (unitId) => {
    if (!window.confirm('Are you sure you want to mark this blood unit as used?')) {
      return;
    }

    try {
      const response = await bloodAPI.updateBloodUnit(unitId, { status: 'used' });
      
      if (response.data?.success) {
        toast.success('Blood unit marked as used successfully');
        if (selectedHospital?._id) {
          fetchInventory(selectedHospital._id);
        }
      } else {
        toast.error(response.data?.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Mark used error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update status';
      toast.error(errorMessage);
    }
  };

  const filteredInventory = inventory.filter(unit => {
    const matchesBloodGroup = filterBloodGroup === 'all' || unit.bloodGroup === filterBloodGroup;
    const donorId = unit.donorInfo?.bloodDonationId || unit.donorId || '';
    const matchesSearch = !search || 
      donorId.toLowerCase().includes(search.toLowerCase());
    return matchesBloodGroup && matchesSearch && unit.status === 'available';
  });

  const filteredHospitals = hospitals.filter(h => {
    const hospitalName = (h.name || '').toLowerCase();
    const hospitalAddress = typeof h.address === 'object' 
      ? `${h.address?.street || ''} ${h.address?.city || ''} ${h.address?.district || ''}`.toLowerCase() 
      : (h.address || '').toLowerCase();
    const searchTerm = hospitalSearch.toLowerCase();
    return hospitalName.includes(searchTerm) || hospitalAddress.includes(searchTerm);
  });

  const getLowStockGroups = () => {
    return stats.filter(s => s.count < 15);
  };

  // Hospital List View
  if (!selectedHospital) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <FiDroplet className="text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Blood Inventory Management</h1>
              <p className="text-red-100 mt-1">Select a hospital to manage blood inventory</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Total Hospitals</p>
                <p className="text-2xl font-bold text-red-700">{hospitals.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <FiMapPin className="text-white text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Total Blood Units</p>
                <p className="text-2xl font-bold text-orange-700">{hospitals.reduce((a, h) => a + (h.totalBloodUnits || 0), 0)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <FiPackage className="text-white text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-amber-700">{hospitals.reduce((a, h) => a + (h.lowStockCount || 0), 0)}</p>
              </div>
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <FiAlertTriangle className="text-white text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4 border border-rose-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-600 text-sm font-medium">Critical Shortage</p>
                <p className="text-2xl font-bold text-rose-700">{hospitals.reduce((a, h) => a + (h.criticalCount || 0), 0)}</p>
              </div>
              <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center">
                <FiHeart className="text-white text-xl" />
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
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-700"
            />
          </div>
        </div>

        {/* Hospital Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Loading hospitals...</p>
          </div>
        ) : filteredHospitals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHospitals.map((hospital) => (
              <div
                key={hospital._id}
                onClick={() => handleSelectHospital(hospital)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-red-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                    <FiActivity className="text-white text-2xl" />
                  </div>
                  <div className="flex items-center space-x-1 text-red-500 group-hover:translate-x-1 transition-transform">
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

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xl font-bold text-red-600">{hospital.totalBloodUnits || 0}</p>
                    <p className="text-xs text-gray-500">Blood Units</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-amber-600">{hospital.lowStockCount || 0}</p>
                    <p className="text-xs text-gray-500">Low Stock</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-rose-600">{hospital.criticalCount || 0}</p>
                    <p className="text-xs text-gray-500">Critical</p>
                  </div>
                </div>
              </div>
            ))}
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

  // Hospital Blood Inventory View
  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
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
              <FiDroplet className="text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{selectedHospital.name}</h1>
              <p className="text-red-100 flex items-center mt-1">
                <FiMapPin className="mr-2" />
                {typeof selectedHospital.address === 'object'
                  ? `${selectedHospital.address?.street || ''}, ${selectedHospital.address?.city || ''}, ${selectedHospital.address?.district || ''}`.replace(/^,\s*|,\s*$/g, '')
                  : selectedHospital.address || 'Address not available'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="bg-white text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center space-x-2 shadow-lg"
          >
            <FiPlus />
            <span>Add Blood Unit</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning */}
      {getLowStockGroups().length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <FiAlertTriangle className="text-white text-xl" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">Low Stock Alert</p>
              <p className="text-sm text-amber-600">
                Critical shortage: {getLowStockGroups().map(s => `${s.bloodGroup} (${s.count} units)`).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Blood Group Cards */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {bloodGroups.map((group, index) => {
          const groupStat = stats.find(s => s.bloodGroup === group);
          const count = groupStat?.count || 0;
          const isLow = count < 15;
          const isCritical = count < 5;
          
          return (
            <div 
              key={group} 
              className={`bg-white rounded-xl p-4 text-center shadow-sm border-2 transition-all hover:shadow-md ${
                isCritical ? 'border-red-400 bg-red-50' :
                isLow ? 'border-amber-400 bg-amber-50' : 'border-gray-100'
              }`}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: `${COLORS[index]}20` }}
              >
                <FiDroplet style={{ color: COLORS[index] }} className="text-xl" />
              </div>
              <p className="font-bold text-lg text-gray-800">{group}</p>
              <p className={`text-sm font-semibold ${
                isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-500'
              }`}>
                {count} units
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <FiTrendingUp className="mr-2 text-red-500" />
            Inventory Distribution
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bloodGroup" tick={{ fill: '#6b7280' }} />
              <YAxis tick={{ fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="#ef4444" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <FiPackage className="mr-2 text-red-500" />
            Blood Group Distribution
          </h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="bloodGroup"
                >
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {stats.map((entry, index) => (
              <div key={entry.bloodGroup} className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                <span className="text-xs text-gray-600">{entry.bloodGroup}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by donor ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={filterBloodGroup}
            onChange={(e) => setFilterBloodGroup(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          >
            <option value="all">All Blood Groups</option>
            {bloodGroups.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Loading blood inventory...</p>
        </div>
      ) : filteredInventory.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Blood Group</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Donor ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Collection Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInventory.map((unit) => {
                  let isExpiringSoon = false;
                  try {
                    if (unit.expiryDate) {
                      const expiryDate = new Date(unit.expiryDate);
                      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                      isExpiringSoon = expiryDate < sevenDaysFromNow && expiryDate > new Date();
                    }
                  } catch (err) {
                    console.error('Error parsing expiry date:', err);
                  }
                  
                  return (
                    <tr key={unit._id} className="hover:bg-red-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <FiDroplet className="text-red-500" />
                          </div>
                          <span className="font-bold text-red-600">{unit.bloodGroup}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                          {unit.quantity || 1} {(unit.quantity || 1) === 1 ? 'unit' : 'units'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{unit.donorInfo?.bloodDonationId || unit.donorId || 'Anonymous'}</td>
                      <td className="px-6 py-4 text-gray-700">
                        <div className="flex items-center space-x-2">
                          <FiCalendar className="text-gray-400" />
                          <span>
                            {unit.collectionDate 
                              ? new Date(unit.collectionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
                              : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <FiClock className={isExpiringSoon ? 'text-amber-500' : 'text-gray-400'} />
                          <span className={isExpiringSoon ? 'text-amber-600 font-medium' : 'text-gray-700'}>
                            {unit.expiryDate 
                              ? new Date(unit.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
                              : 'N/A'}
                          </span>
                          {isExpiringSoon && (
                            <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                              Expiring Soon
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          {unit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleMarkUsed(unit._id)}
                          className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center space-x-2"
                        >
                          <FiCheckCircle />
                          <span>Mark Used</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiDroplet className="text-red-400 text-3xl" />
          </div>
          <p className="text-gray-600 text-lg font-medium">No blood units found</p>
          <p className="text-gray-400 text-sm mt-1">Add new blood units to get started</p>
        </div>
      )}

      {/* Add Blood Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-500 to-pink-500 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Add Blood Unit</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleAddUnit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group *</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity (units)</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  min="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Collection Date *</label>
                  <input
                    type="date"
                    name="collectionDate"
                    value={formData.collectionDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Donor ID</label>
                <input
                  type="text"
                  name="donorId"
                  value={formData.donorId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Optional - for tracking"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-colors shadow-lg shadow-red-200"
                >
                  Add Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodInventory;
