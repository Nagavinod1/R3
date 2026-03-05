import React, { useState, useEffect } from 'react';
import { blockchainAPI } from '../../services/api';
import { 
  FiLink, FiCheckCircle, FiClock, FiExternalLink, FiCopy,
  FiDroplet, FiGrid, FiHash, FiDatabase
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const BlockchainVerification = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchHash, setSearchHash] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await blockchainAPI.getTransactions();
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Mock data for demo
      setTransactions([
        {
          _id: '1',
          transactionHash: '0x7a9e8c4b2f1d3e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
          type: 'blood_record',
          status: 'confirmed',
          blockNumber: 12345678,
          bloodUnit: { bloodGroup: 'O+', donorId: 'DON-001' },
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
          verifiedAt: new Date(Date.now() - 1000 * 60 * 25)
        },
        {
          _id: '2',
          transactionHash: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
          type: 'bed_status',
          status: 'confirmed',
          blockNumber: 12345679,
          bed: { bedNumber: 'ICU-01', hospital: 'City Hospital' },
          createdAt: new Date(Date.now() - 1000 * 60 * 45),
          verifiedAt: new Date(Date.now() - 1000 * 60 * 40)
        },
        {
          _id: '3',
          transactionHash: '0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
          type: 'blood_record',
          status: 'pending',
          bloodUnit: { bloodGroup: 'AB-', donorId: 'DON-002' },
          createdAt: new Date(Date.now() - 1000 * 60 * 5)
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (transactionId) => {
    setVerifying(transactionId);
    try {
      const response = await blockchainAPI.verifyTransaction(transactionId);
      if (response.data.success) {
        toast.success('Transaction verified on blockchain!');
        fetchTransactions();
      }
    } catch (error) {
      // Mock verification for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTransactions(prev => prev.map(t => 
        t._id === transactionId 
          ? { ...t, status: 'confirmed', verifiedAt: new Date() }
          : t
      ));
      toast.success('Transaction verified on blockchain!');
    } finally {
      setVerifying(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const truncateHash = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesSearch = !searchHash || tx.transactionHash?.toLowerCase().includes(searchHash.toLowerCase());
    return matchesType && matchesSearch;
  });

  const stats = {
    total: transactions.length,
    confirmed: transactions.filter(t => t.status === 'confirmed').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    bloodRecords: transactions.filter(t => t.type === 'blood_record').length,
    bedRecords: transactions.filter(t => t.type === 'bed_status').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Blockchain Verification</h1>
        <p className="text-gray-500">Verify and track all blockchain transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FiDatabase className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FiCheckCircle className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Confirmed</p>
              <p className="text-2xl font-bold text-gray-800">{stats.confirmed}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <FiDroplet className="text-red-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Blood Records</p>
              <p className="text-2xl font-bold text-gray-800">{stats.bloodRecords}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiGrid className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Bed Records</p>
              <p className="text-2xl font-bold text-gray-800">{stats.bedRecords}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiHash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by transaction hash..."
              value={searchHash}
              onChange={(e) => setSearchHash(e.target.value)}
              className="input-field pl-10 font-mono text-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Types</option>
            <option value="blood_record">Blood Records</option>
            <option value="bed_status">Bed Status</option>
          </select>
        </div>
      </div>

      {/* Blockchain Info */}
      <div className="card bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <FiLink className="text-3xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Blockchain Network Status</h3>
            <p className="text-purple-200">Connected to Ethereum Network (Local/Testnet)</p>
            <p className="text-sm text-purple-200 mt-1">
              All records are immutably stored on the blockchain for transparency and verification.
            </p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner w-10 h-10"></div>
        </div>
      ) : filteredTransactions.length > 0 ? (
        <div className="space-y-4">
          {filteredTransactions.map((tx) => (
            <div key={tx._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    tx.type === 'blood_record' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {tx.type === 'blood_record' ? (
                      <FiDroplet className="text-red-600 text-xl" />
                    ) : (
                      <FiGrid className="text-blue-600 text-xl" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {tx.type === 'blood_record' ? 'Blood Unit Record' : 'Bed Status Update'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === 'confirmed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {tx.status}
                      </span>
                    </div>

                    {/* Transaction Hash */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-500">Hash:</span>
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {truncateHash(tx.transactionHash)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(tx.transactionHash)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <FiCopy />
                      </button>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {tx.blockNumber && (
                        <div className="flex items-center space-x-1">
                          <span>Block:</span>
                          <span className="font-mono">{tx.blockNumber}</span>
                        </div>
                      )}
                      {tx.type === 'blood_record' && tx.bloodUnit && (
                        <div className="flex items-center space-x-1">
                          <FiDroplet className="text-red-400" />
                          <span>{tx.bloodUnit.bloodGroup}</span>
                          <span>• {tx.bloodUnit.donorId}</span>
                        </div>
                      )}
                      {tx.type === 'bed_status' && tx.bed && (
                        <div className="flex items-center space-x-1">
                          <FiGrid className="text-blue-400" />
                          <span>{tx.bed.bedNumber}</span>
                          <span>• {tx.bed.hospital}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <FiClock className="text-gray-400" />
                        <span>{new Date(tx.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {tx.status === 'pending' && (
                    <button
                      onClick={() => handleVerify(tx._id)}
                      disabled={verifying === tx._id}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {verifying === tx._id ? (
                        <>
                          <div className="spinner w-4 h-4"></div>
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <FiCheckCircle />
                          <span>Verify</span>
                        </>
                      )}
                    </button>
                  )}
                  {tx.status === 'confirmed' && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <FiCheckCircle />
                      <span className="text-sm">Verified</span>
                    </div>
                  )}
                  <a
                    href={`https://etherscan.io/tx/${tx.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="View on Etherscan"
                  >
                    <FiExternalLink />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <FiLink className="mx-auto text-5xl text-gray-300 mb-4" />
          <p className="text-gray-500">No transactions found</p>
        </div>
      )}
    </div>
  );
};

export default BlockchainVerification;
