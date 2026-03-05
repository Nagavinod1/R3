const { Web3 } = require('web3');
const path = require('path');
const fs = require('fs');

// Try to load contract ABI if it exists
let contractABI = null;
const artifactPath = path.join(__dirname, '../../blockchain/artifacts/contracts/HospitalManagement.sol/HospitalManagement.json');
if (fs.existsSync(artifactPath)) {
  try {
    contractABI = require(artifactPath);
  } catch (err) {
    console.log('⚠️ Could not load contract ABI:', err.message);
  }
} else {
  console.log('⚠️ Contract artifacts not found. Run "npm run deploy-contracts" to compile and deploy the smart contract.');
}

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Check if contract ABI is available
      if (!contractABI) {
        console.log('⚠️ Blockchain features disabled - contract not compiled');
        return false;
      }

      const networkUrl = process.env.BLOCKCHAIN_NETWORK || 'http://127.0.0.1:8545';
      this.web3 = new Web3(networkUrl);
      
      // Get accounts
      const accounts = await this.web3.eth.getAccounts();
      this.account = accounts[0];
      
      // Initialize contract if address is set
      if (process.env.CONTRACT_ADDRESS) {
        this.contract = new this.web3.eth.Contract(
          contractABI.abi,
          process.env.CONTRACT_ADDRESS
        );
        this.initialized = true;
        console.log('✅ Blockchain service initialized');
      } else {
        console.log('⚠️ Contract address not set. Blockchain features limited.');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Blockchain initialization error:', error.message);
      return false;
    }
  }

  async recordBloodUnit(bloodUnitId, bloodGroup, quantity, hospitalId) {
    if (!this.initialized) {
      console.log('Blockchain not initialized, skipping record');
      return { success: false, message: 'Blockchain not initialized' };
    }

    try {
      const tx = await this.contract.methods.recordBloodUnit(
        bloodUnitId,
        bloodGroup,
        quantity,
        hospitalId
      ).send({ from: this.account, gas: 500000 });

      return {
        success: true,
        transactionHash: tx.transactionHash,
        blockNumber: tx.blockNumber
      };
    } catch (error) {
      console.error('Blockchain record error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateBedStatus(bedId, hospitalId, isAvailable) {
    if (!this.initialized) {
      return { success: false, message: 'Blockchain not initialized' };
    }

    try {
      const tx = await this.contract.methods.updateBedStatus(
        bedId,
        hospitalId,
        isAvailable
      ).send({ from: this.account, gas: 500000 });

      return {
        success: true,
        transactionHash: tx.transactionHash,
        blockNumber: tx.blockNumber
      };
    } catch (error) {
      console.error('Blockchain bed update error:', error);
      return { success: false, error: error.message };
    }
  }

  async getBloodUnitHistory(bloodUnitId) {
    if (!this.initialized) {
      return { success: false, message: 'Blockchain not initialized' };
    }

    try {
      const history = await this.contract.methods.getBloodUnitHistory(bloodUnitId).call();
      return { success: true, history };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getBedHistory(bedId) {
    if (!this.initialized) {
      return { success: false, message: 'Blockchain not initialized' };
    }

    try {
      const history = await this.contract.methods.getBedHistory(bedId).call();
      return { success: true, history };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async verifyTransaction(transactionHash) {
    if (!this.web3) {
      return { success: false, message: 'Blockchain not initialized' };
    }
    try {
      const receipt = await this.web3.eth.getTransactionReceipt(transactionHash);
      return {
        success: true,
        verified: receipt !== null,
        receipt
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  generateHash(data) {
    return this.web3 ? this.web3.utils.sha3(JSON.stringify(data)) : null;
  }
}

// Singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;
