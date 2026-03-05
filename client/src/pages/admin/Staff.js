import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { FiSearch, FiCheckCircle, FiXCircle, FiUser, FiMail, FiPhone, FiClock, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const [allStaffRes, pendingRes] = await Promise.all([
        adminAPI.getUsers({ role: 'staff' }),
        adminAPI.getPendingStaff()
      ]);

      if (allStaffRes.data.success) {
        setStaff(allStaffRes.data.data.filter(s => s.isApproved));
      }
      if (pendingRes.data.success) {
        setPendingStaff(pendingRes.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (staffId) => {
    try {
      await adminAPI.approveStaff(staffId);
      toast.success('Staff approved successfully');
      fetchStaff();
    } catch (error) {
      toast.error('Failed to approve staff');
    }
  };

  const handleReject = async (staffId) => {
    if (window.confirm('Are you sure you want to reject this staff application?')) {
      try {
        await adminAPI.rejectStaff(staffId);
        toast.success('Staff application rejected');
        fetchStaff();
      } catch (error) {
        toast.error('Failed to reject staff');
      }
    }
  };

  const displayList = activeTab === 'pending' ? pendingStaff : staff;
  const filteredList = displayList.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
        <p className="text-gray-500">Manage blood department staff and approvals</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-4 px-2 font-medium transition-colors relative ${
            activeTab === 'pending' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Approvals
          {pendingStaff.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
              {pendingStaff.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`pb-4 px-2 font-medium transition-colors ${
            activeTab === 'approved' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Approved Staff
          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
            {staff.length}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Staff List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner w-10 h-10"></div>
        </div>
      ) : filteredList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((member) => (
            <div key={member._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                    <FiUser className="text-primary-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.hospital?.name || 'Unassigned'}</p>
                  </div>
                </div>
                {activeTab === 'pending' && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    Pending
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center space-x-2 text-gray-600">
                  <FiMail className="text-gray-400" />
                  <span className="text-sm">{member.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <FiPhone className="text-gray-400" />
                  <span className="text-sm">{member.phone || 'Not provided'}</span>
                </div>
                {activeTab === 'pending' && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FiClock className="text-gray-400" />
                    <span className="text-sm">
                      Applied: {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {activeTab === 'pending' && (
                <div className="flex space-x-3 mt-4 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(member._id)}
                    className="flex-1 btn-primary py-2 flex items-center justify-center space-x-2"
                  >
                    <FiCheckCircle />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleReject(member._id)}
                    className="flex-1 btn-secondary py-2 flex items-center justify-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <FiXCircle />
                    <span>Reject</span>
                  </button>
                </div>
              )}

              {activeTab === 'approved' && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <FiUser className="mx-auto text-5xl text-gray-300 mb-4" />
          <p className="text-gray-500">
            {activeTab === 'pending' 
              ? 'No pending staff approvals' 
              : 'No approved staff members'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Staff;
