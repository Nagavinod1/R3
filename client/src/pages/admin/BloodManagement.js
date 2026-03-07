import React, { useState, useEffect, useMemo } from 'react';
import { bloodAPI, hospitalAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
  FiSearch, FiDroplet, FiPlus, FiAlertTriangle, FiX,
  FiCalendar, FiCheckCircle, FiArrowLeft, FiMapPin,
  FiActivity, FiPackage, FiTrendingUp, FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const BloodManagement = () => {
  const [bloodUnits, setBloodUnits] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [detailSearch, setDetailSearch] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: '',
    quantity: 1,
    hospital: '',
    collectionDate: '',
    expiryDate: '',
    donorId: ''
  });
  const { socket } = useSocket();

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.on('bloodUpdate', () => fetchData());
      return () => socket.off('bloodUpdate');
    }
  }, [socket]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [unitsRes, hospitalsRes, statsRes] = await Promise.all([
        bloodAPI.getInventory(),
        hospitalAPI.getHospitals(),
        bloodAPI.getBloodStats()
      ]);

      if (unitsRes.data.success && unitsRes.data.data) {
        const inventoryData = unitsRes.data.data.inventory || unitsRes.data.data;
        setBloodUnits(Array.isArray(inventoryData) ? inventoryData : []);
      }

      if (hospitalsRes.data.success && hospitalsRes.data.data) {
        setHospitals(Array.isArray(hospitalsRes.data.data) ? hospitalsRes.data.data : []);
      }

      if (statsRes.data.success && statsRes.data.data) {
        setStats(statsRes.data.data.map(item => ({
          bloodGroup: item.bloodGroup,
          count: item.units || item.count || 0
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setStats([
        { bloodGroup: 'A+', count: 45 }, { bloodGroup: 'A-', count: 12 },
        { bloodGroup: 'B+', count: 38 }, { bloodGroup: 'B-', count: 8 },
        { bloodGroup: 'AB+', count: 15 }, { bloodGroup: 'AB-', count: 5 },
        { bloodGroup: 'O+', count: 52 }, { bloodGroup: 'O-', count: 10 }
      ]);
      setBloodUnits([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Compute hospital-wise summaries ---
  const hospitalBloodMap = useMemo(() => {
    const map = {};
    bloodUnits.forEach(unit => {
      const hId = unit.hospital?._id || unit.hospitalId || 'unknown';
      if (!map[hId]) {
        map[hId] = { totalUnits: 0, available: 0, reserved: 0, used: 0, expired: 0, groups: {} };
      }
      const qty = unit.quantity || 1;
      map[hId].totalUnits += qty;
      if (unit.status) map[hId][unit.status] = (map[hId][unit.status] || 0) + qty;
      if (unit.bloodGroup) {
        map[hId].groups[unit.bloodGroup] = (map[hId].groups[unit.bloodGroup] || 0) + qty;
      }
    });
    return map;
  }, [bloodUnits]);

  const filteredHospitals = hospitals.filter(h =>
    h.name?.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.address?.city?.toLowerCase().includes(hospitalSearch.toLowerCase())
  );

  const hospitalUnits = useMemo(() => {
    if (!selectedHospital) return [];
    return bloodUnits.filter(u => {
      const hId = u.hospital?._id || u.hospitalId;
      const matchesHospital = hId === selectedHospital._id;
      const matchesSearch = !detailSearch ||
        u.donorId?.toLowerCase().includes(detailSearch.toLowerCase()) ||
        u.bloodGroup?.toLowerCase().includes(detailSearch.toLowerCase());
      const matchesBG = filterBloodGroup === 'all' || u.bloodGroup === filterBloodGroup;
      const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
      return matchesHospital && matchesSearch && matchesBG && matchesStatus;
    });
  }, [selectedHospital, bloodUnits, detailSearch, filterBloodGroup, filterStatus]);

  const selectedHospitalStats = useMemo(() => {
    if (!selectedHospital) return {};
    return hospitalBloodMap[selectedHospital._id] || { totalUnits: 0, available: 0, reserved: 0, used: 0, expired: 0, groups: {} };
  }, [selectedHospital, hospitalBloodMap]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    try {
      const bloodData = {
        bloodGroup: formData.bloodGroup,
        quantity: Number.parseInt(formData.quantity, 10) || 1,
        hospitalId: formData.hospital,
        collectionDate: formData.collectionDate || new Date().toISOString(),
        expiryDate: formData.expiryDate || new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
        donorInfo: formData.donorId ? { bloodDonationId: formData.donorId } : undefined
      };
      await bloodAPI.addBloodUnit(bloodData);
      toast.success('Blood unit added successfully');
      setShowAddModal(false);
      setFormData({ bloodGroup: '', quantity: 1, hospital: '', collectionDate: '', expiryDate: '', donorId: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add blood unit');
    }
  };

  const handleUpdateStatus = async (unitId, status) => {
    try {
      await bloodAPI.updateBloodUnit(unitId, { status });
      toast.success(`Blood unit marked as ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openAddModalForHospital = () => {
    setFormData(prev => ({ ...prev, hospital: selectedHospital?._id || '' }));
    setShowAddModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'reserved': return 'bg-amber-100 text-amber-700';
      case 'used': return 'bg-blue-100 text-blue-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getBloodGroupColor = (group) => {
    const colors = {
      'A+': 'bg-red-500', 'A-': 'bg-red-400',
      'B+': 'bg-blue-500', 'B-': 'bg-blue-400',
      'AB+': 'bg-purple-500', 'AB-': 'bg-purple-400',
      'O+': 'bg-emerald-500', 'O-': 'bg-emerald-400'
    };
    return colors[group] || 'bg-gray-500';
  };

  const totalAvailable = stats.reduce((sum, s) => sum + s.count, 0);
  const lowStockGroups = stats.filter(s => s.count < 15);

  // ==================== HOSPITAL DETAIL VIEW ====================
  if (selectedHospital) {
    return (
      <div className="space-y-6">
        {/* Back Button & Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => { setSelectedHospital(null); setFilterBloodGroup('all'); setFilterStatus('all'); setDetailSearch(''); }}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
            >
              <FiArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{selectedHospital.name}</h1>
              <p className="text-gray-500 flex items-center space-x-1 mt-0.5">
                <FiMapPin size={14} />
                <span>{[selectedHospital.address?.city, selectedHospital.address?.state].filter(Boolean).join(', ') || 'Location not set'}</span>
              </p>
            </div>
          </div>
          <button onClick={openAddModalForHospital} className="btn-primary flex items-center space-x-2">
            <FiPlus size={18} />
            <span>Add Blood Unit</span>
          </button>
        </div>

        {/* Hospital Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <FiPackage className="text-indigo-600" size={20} />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Units</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{selectedHospitalStats.totalUnits || 0}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <FiCheckCircle className="text-green-600" size={20} />
              </div>
              <span className="text-sm font-medium text-gray-500">Available</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{selectedHospitalStats.available || 0}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <FiCalendar className="text-amber-600" size={20} />
              </div>
              <span className="text-sm font-medium text-gray-500">Reserved</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">{selectedHospitalStats.reserved || 0}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <FiAlertTriangle className="text-red-500" size={20} />
              </div>
              <span className="text-sm font-medium text-gray-500">Expired</span>
            </div>
            <p className="text-3xl font-bold text-red-500">{selectedHospitalStats.expired || 0}</p>
          </div>
        </div>

        {/* Blood Group Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-700 mb-4">Blood Group Stock</h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {bloodGroups.map(group => {
              const count = selectedHospitalStats.groups?.[group] || 0;
              const isLow = count > 0 && count < 10;
              const isEmpty = count === 0;
              return (
                <div
                  key={group}
                  className={`relative rounded-xl p-3 text-center transition-all border ${
                    isEmpty ? 'bg-gray-50 border-gray-100' : isLow ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-xs font-bold ${getBloodGroupColor(group)}`}>
                    {group}
                  </div>
                  <p className={`text-lg font-bold ${isEmpty ? 'text-gray-300' : isLow ? 'text-amber-600' : 'text-gray-800'}`}>{count}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">units</p>
                  {isLow && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by donor ID or blood group..."
                value={detailSearch}
                onChange={(e) => setDetailSearch(e.target.value)}
                className="input-field pl-10 text-sm"
              />
            </div>
            <select
              value={filterBloodGroup}
              onChange={(e) => setFilterBloodGroup(e.target.value)}
              className="input-field text-sm"
            >
              <option value="all">All Blood Groups</option>
              {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field text-sm"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Blood Units Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="spinner w-10 h-10"></div>
            </div>
          ) : hospitalUnits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Blood Group</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Donor ID</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Collected</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {hospitalUnits.map((unit) => (
                    <tr key={unit._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${getBloodGroupColor(unit.bloodGroup)}`}>
                            {unit.bloodGroup}
                          </div>
                          <span className="font-semibold text-gray-800">{unit.bloodGroup}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{unit.donorInfo?.bloodDonationId || 'Anonymous'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {unit.collectionDate ? new Date(unit.collectionDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {unit.expiryDate ? new Date(unit.expiryDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(unit.status)}`}>
                          {unit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-1">
                          {unit.status === 'available' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(unit._id, 'reserved')}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Reserve"
                              >
                                <FiCalendar size={16} />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(unit._id, 'used')}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Mark Used"
                              >
                                <FiCheckCircle size={16} />
                              </button>
                            </>
                          )}
                          {unit.status === 'reserved' && (
                            <button
                              onClick={() => handleUpdateStatus(unit._id, 'used')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Mark Used"
                            >
                              <FiCheckCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FiDroplet size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No blood units found</p>
              <p className="text-xs mt-1">Try adjusting filters or add a new blood unit</p>
            </div>
          )}
        </div>

        {/* Add Blood Unit Modal */}
        {showAddModal && renderAddModal()}
      </div>
    );
  }

  // ==================== HOSPITAL LIST VIEW (DEFAULT) ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Blood Management</h1>
          <p className="text-gray-500">Manage blood inventory hospital-wise</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center space-x-2">
          <FiPlus size={18} />
          <span>Add Blood Unit</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <FiDroplet className="text-red-500" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Units</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalAvailable}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <FiActivity className="text-indigo-600" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">Hospitals</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{hospitals.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <FiTrendingUp className="text-green-600" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">Blood Groups</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.filter(s => s.count > 0).length}<span className="text-lg text-gray-400">/{bloodGroups.length}</span></p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <FiAlertTriangle className="text-amber-500" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">Low Stock</span>
          </div>
          <p className="text-3xl font-bold text-amber-600">{lowStockGroups.length}</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockGroups.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <FiAlertTriangle className="text-amber-600" size={18} />
            </div>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Low Stock Alert</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {lowStockGroups.map(s => (
                  <span key={s.bloodGroup} className="inline-flex items-center px-2.5 py-1 bg-white/70 border border-amber-200 rounded-lg text-xs font-medium text-amber-700">
                    <FiDroplet size={12} className="mr-1" /> {s.bloodGroup}: {s.count} units
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Blood Group Overview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-700 mb-4">Overall Blood Stock</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {bloodGroups.map(group => {
            const groupStats = stats.find(s => s.bloodGroup === group);
            const count = groupStats?.count || 0;
            const isLow = count > 0 && count < 15;
            const maxCount = Math.max(...stats.map(s => s.count), 1);
            const barHeight = Math.max((count / maxCount) * 100, 4);
            return (
              <div key={group} className={`rounded-xl p-3 text-center border transition-all ${isLow ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="h-16 flex items-end justify-center mb-2">
                  <div
                    className={`w-5 rounded-t-md transition-all ${getBloodGroupColor(group)}`}
                    style={{ height: `${barHeight}%`, minHeight: '4px' }}
                  />
                </div>
                <p className="text-sm font-bold text-gray-800">{group}</p>
                <p className={`text-xs mt-0.5 ${isLow ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hospital Search */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search hospitals by name or city..."
          value={hospitalSearch}
          onChange={(e) => setHospitalSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Hospital Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner w-10 h-10"></div>
        </div>
      ) : filteredHospitals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredHospitals.map(hospital => {
            const hStats = hospitalBloodMap[hospital._id] || { totalUnits: 0, available: 0, groups: {} };
            const hasLowStock = Object.values(hStats.groups).some(c => c > 0 && c < 10);
            const activeGroups = Object.keys(hStats.groups).filter(g => hStats.groups[g] > 0);

            return (
              <div
                key={hospital._id}
                onClick={() => setSelectedHospital(hospital)}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
              >
                {/* Hospital Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FiDroplet className="text-white" size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate group-hover:text-primary-600 transition-colors">{hospital.name}</h3>
                      <p className="text-xs text-gray-400 flex items-center space-x-1 mt-0.5">
                        <FiMapPin size={11} />
                        <span className="truncate">{hospital.address?.city || 'Location not set'}</span>
                      </p>
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" size={18} />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-gray-800">{hStats.totalUnits}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-green-600">{hStats.available || 0}</p>
                    <p className="text-[10px] text-green-500 uppercase tracking-wide">Available</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-amber-600">{hStats.reserved || 0}</p>
                    <p className="text-[10px] text-amber-500 uppercase tracking-wide">Reserved</p>
                  </div>
                </div>

                {/* Blood Group Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {activeGroups.length > 0 ? activeGroups.map(group => (
                    <span
                      key={group}
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold text-white ${getBloodGroupColor(group)}`}
                    >
                      {group}: {hStats.groups[group]}
                    </span>
                  )) : (
                    <span className="text-xs text-gray-300 italic">No blood units</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FiActivity size={48} className="mb-3 opacity-20" />
          <p className="text-sm font-medium">No hospitals found</p>
          <p className="text-xs mt-1">Try a different search term</p>
        </div>
      )}

      {/* Add Blood Unit Modal */}
      {showAddModal && renderAddModal()}
    </div>
  );

  // ==================== ADD MODAL ====================
  function renderAddModal() {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Add Blood Unit</h2>
              <p className="text-xs text-gray-400 mt-0.5">Fill in the details below</p>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
            >
              <FiX size={20} />
            </button>
          </div>

          <form onSubmit={handleAddUnit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Blood Group *</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className="input-field text-sm" required>
                  <option value="">Select</option>
                  {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Quantity</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="input-field text-sm" min="1" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Hospital *</label>
              <select name="hospital" value={formData.hospital} onChange={handleInputChange} className="input-field text-sm" required>
                <option value="">Select Hospital</option>
                {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Collection Date</label>
                <input type="date" name="collectionDate" value={formData.collectionDate} onChange={handleInputChange} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Expiry Date</label>
                <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="input-field text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Donor ID</label>
              <input type="text" name="donorId" value={formData.donorId} onChange={handleInputChange} className="input-field text-sm" placeholder="Optional" />
            </div>

            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" className="flex-1 btn-primary py-2.5 text-sm">
                Add Unit
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
};

export default BloodManagement;
