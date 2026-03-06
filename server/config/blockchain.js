const { Web3 } = require('web3');
const path = require('node:path');
const fs = require('node:fs');

// Try to load contract ABI if it exists.
let contractABI = null;
const artifactPath = path.join(
  __dirname,
  '../../blockchain/artifacts/contracts/HospitalManagement.sol/HospitalManagement.json'
);

if (fs.existsSync(artifactPath)) {
  try {
    contractABI = require(artifactPath);
  } catch (err) {
    console.warn('Could not load contract ABI:', err.message);
  }
} else {
  console.warn('Contract artifacts not found. Run "npm run deploy-contracts" after compiling/deploying contracts.');
}

function isConfigured(value) {
  if (!value) return false;

  const normalized = String(value).trim().toLowerCase();
  return normalized.length > 0
    && !normalized.includes('replace')
    && !normalized.includes('placeholder')
    && !normalized.includes('your_');
}

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.initialized = false;
  }

  async initialize() {
    // Check if contract ABI is available.
    if (!contractABI) {
      console.info('Blockchain integration disabled: contract ABI not available.');
      return false;
    }

    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!isConfigured(contractAddress)) {
      console.info('Blockchain integration disabled: CONTRACT_ADDRESS not configured.');
      return false;
    }

    const networkUrl = process.env.BLOCKCHAIN_NETWORK || 'http://127.0.0.1:8545';

    try {
      this.web3 = new Web3(networkUrl);
      const accounts = await this.web3.eth.getAccounts();

      if (!Array.isArray(accounts) || accounts.length === 0) {
        console.warn('Blockchain integration disabled: no accounts available from configured node.');
        this.web3 = null;
        return false;
      }

      this.account = accounts[0];
      this.contract = new this.web3.eth.Contract(contractABI.abi, contractAddress);
      this.initialized = true;
      console.log(`Blockchain service initialized at ${networkUrl}`);
      return true;
    } catch (error) {
      this.web3 = null;
      this.contract = null;
      this.account = null;
      this.initialized = false;

      const isConnectionRefused = typeof error?.message === 'string' && error.message.includes('ECONNREFUSED');
      if (isConnectionRefused) {
        console.warn(`Blockchain node not reachable at ${networkUrl}. Continuing without blockchain writes.`);
      } else {
        console.warn(`Blockchain initialization skipped: ${error.message}`);
      }

      return false;
    }
  }

  async recordBloodUnit(bloodUnitId, bloodGroup, quantity, hospitalId) {
    if (!this.initialized) {
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

// Singleton instance.
const blockchainService = new BlockchainService();

module.exports = blockchainService;
