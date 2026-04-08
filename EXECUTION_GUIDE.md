# 🚀 STEP-BY-STEP EXECUTION GUIDE
## Blockchain Enabled Intelligent Hospital Bed and Blood Resource Management System

---

## 📋 TABLE OF CONTENTS
1. [Prerequisites Check](#prerequisites-check)
2. [Initial Setup](#initial-setup)
3. [Database Setup](#database-setup)
4. [Blockchain Setup](#blockchain-setup)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [AI Service Setup](#ai-service-setup)
8. [Running the Complete Application](#running-the-complete-application)
9. [Testing the Application](#testing-the-application)
10. [Troubleshooting](#troubleshooting)

---

## ✅ PREREQUISITES CHECK

### Required Software
Before starting, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Check: `node --version`
   - Download: https://nodejs.org/

2. **MongoDB** (v6.0 or higher)
   - Check: `mongod --version`
   - Download: https://www.mongodb.com/try/download/community

3. **Python** (v3.8 or higher)
   - Check: `python --version` or `python3 --version`
   - Download: https://www.python.org/downloads/

4. **Git** (optional, for version control)
   - Check: `git --version`
   - Download: https://git-scm.com/

### Verify Installation
```bash
# Check Node.js
node --version
npm --version

# Check Python
python --version
pip --version

# Check MongoDB
mongod --version
```

---

## 🔧 INITIAL SETUP

### Step 1: Navigate to Project Directory
```bash
cd "c:\Users\wwwna\Desktop\PROJECT IMPPPP"
```

### Step 2: Install All Dependencies
This will install dependencies for root, client, and blockchain:
```bash
npm run install-all
```

**What this does:**
- Installs root dependencies (Express, MongoDB, Socket.IO, Web3, etc.)
- Installs client dependencies (React, Tailwind CSS, Recharts, etc.)
- Installs blockchain dependencies (Hardhat, Ethereum tools)

**Expected Output:**
```
✓ Root dependencies installed
✓ Client dependencies installed
✓ Blockchain dependencies installed
```

### Step 3: Install Python Dependencies
```bash
cd ai-service
pip install -r requirements.txt
cd ..
```

**What this installs:**
- Flask (Python web framework)
- flask-cors (CORS support)
- python-dotenv (Environment variables)
- google-genai (AI integration)

---

## 🗄️ DATABASE SETUP

### Step 1: Start MongoDB Service

**Option A: Windows Service (Recommended)**
```bash
# Start MongoDB as a service
net start MongoDB
```

**Option B: Manual Start**
```bash
# Open a new terminal and run:
mongod
```

**Keep this terminal open** - MongoDB must run continuously.

### Step 2: Verify MongoDB is Running
```bash
# In a new terminal:
mongosh
# Or
mongo
```

You should see:
```
MongoDB shell version...
connecting to: mongodb://127.0.0.1:27017
```

Type `exit` to close the shell.

### Step 3: Database Configuration
The database will be automatically created when you start the server:
- **Database Name:** `hospital_blood_management`
- **Connection URI:** `mongodb://localhost:27017/hospital_blood_management`

**Collections that will be created:**
1. users
2. hospitals
3. beds
4. bedbookings
5. bloodunits
6. bloodrequests
7. emergencyalerts
8. blockchaintransactions

---

## ⛓️ BLOCKCHAIN SETUP

### Step 1: Start Local Blockchain Network

**Open a NEW terminal** (Terminal 1 - Blockchain):
```bash
cd "c:\Users\wwwna\Desktop\PROJECT IMPPPP"
npm run blockchain
```

**What this does:**
- Starts Hardhat local Ethereum network
- Creates 20 test accounts with 10000 ETH each
- Runs on `http://127.0.0.1:8545`

**Expected Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...
```

**⚠️ IMPORTANT:** Keep this terminal running! Do not close it.

### Step 2: Deploy Smart Contracts

**Open ANOTHER NEW terminal** (Terminal 2 - Deployment):
```bash
cd "c:\Users\wwwna\Desktop\PROJECT IMPPPP"
npm run deploy-contracts
```

**What this does:**
- Compiles Solidity smart contract (`HospitalManagement.sol`)
- Deploys contract to local blockchain
- Updates `.env` file with contract address

**Expected Output:**
```
🚀 Deploying HospitalManagement contract...

✅ HospitalManagement deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
📝 Updating .env file with contract address...
✅ .env file updated

🎉 Deployment complete!

Contract Details:
================
Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Network: localhost

📊 Initial Contract State:
Blood Units: 0
Beds: 0
```

**✅ Verification:**
Check your `.env` file - it should now have:
```
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

## 🖥️ BACKEND SETUP

### Step 1: Configure Environment Variables
Your `.env` file is already configured with:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hospital_blood_management
JWT_SECRET=hospital_blood_mgmt_secret_key_2024_secure_random_string
JWT_EXPIRE=30d
BLOCKCHAIN_NETWORK=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
PYTHON_AI_URL=http://localhost:5001
GEMINI_API_KEY=AIzaSyDuamU6oAxKsG2z3GVXAfTA79ndHJgqlLo
OPENAI_API_KEY=sk-th-XeV1XgO2z3mliiQhDw9HSypVAvKHexd27Z8kTtFbHh1xSCugu1wVJ2Xj8EPnlr1Dim4P3RAPrSQaR8VOiVDNLLzQjL85zXxTtolO
CLIENT_URL=http://localhost:3000
```

### Step 2: Seed Initial Data (Optional but Recommended)
```bash
npm run seed
```

**What this does:**
- Creates default admin account
- Seeds sample hospitals
- Seeds sample beds
- Seeds sample blood units

**Default Admin Credentials:**
- Email: `admin@hospital.com`
- Password: `admin123`

---

## 🎨 FRONTEND SETUP

The frontend is already configured. Key files:
- **Entry Point:** `client/src/index.js`
- **Main App:** `client/src/App.js`
- **Proxy:** Configured to `http://localhost:5000`

**No additional setup needed!**

---

## 🤖 AI SERVICE SETUP

### Step 1: Verify Python Environment
```bash
cd ai-service
python --version
```

### Step 2: Test AI Service Configuration
The AI service is configured with:
- **OpenAI API Key:** Already set in `.env`
- **Model:** `gpt-4o-mini`
- **Port:** `5001`

---

## 🚀 RUNNING THE COMPLETE APPLICATION

### Option 1: Run Everything Separately (Recommended for Development)

You'll need **4 terminals**:

#### Terminal 1: MongoDB
```bash
# If not already running
mongod
```

#### Terminal 2: Blockchain
```bash
cd "c:\Users\wwwna\Desktop\PROJECT IMPPPP"
npm run blockchain
```

#### Terminal 3: AI Service
```bash
cd "c:\Users\wwwna\Desktop\PROJECT IMPPPP"
npm run ai-service
```

**Expected Output:**
```
🤖 AI Health Assistant Service v3.0 - Powered by OpenAI
🧠 AI Model: gpt-4o-mini
🌐 Provider: OpenAI
🚀 Starting on port 5001

📚 Available endpoints:
   POST /api/ai/chat - Chat with OpenAI
   POST /api/ai/emergency - Emergency guidance
   POST /api/ai/severity-detection - Severity Detection
   ...
```

#### Terminal 4: Backend + Frontend
```bash
cd "c:\Users\wwwna\Desktop\PROJECT IMPPPP"
npm run dev
```

**Expected Output:**
```
[server] 🚀 Server running on port 5000
[server] 📡 Socket.IO ready for real-time connections
[server] 🔗 API available at http://localhost:5000/api
[server] ✅ MongoDB Connected: hospital_blood_management
[server] ℹ️ Blockchain integration disabled (set ENABLE_BLOCKCHAIN=true to enable)
[server] ✅ Default admin seeded
[server] ✅ Sample data seeded

[client] Compiled successfully!
[client] webpack compiled with 0 warnings
[client] You can now view hospital-management-client in the browser.
[client] Local: http://localhost:3000
```

### Option 2: Run Backend + Frontend + AI Together
```bash
npm run dev:all
```

**Note:** You still need to run MongoDB and Blockchain separately.

---

## 🧪 TESTING THE APPLICATION

### Step 1: Access the Application
Open your browser and go to:
```
http://localhost:3000
```

### Step 2: Login as Admin
1. Click **"Login"**
2. Enter credentials:
   - Email: `admin@hospital.com`
   - Password: `admin123`
3. Click **"Sign In"**

### Step 3: Explore Admin Dashboard
You should see:
- **Total Users:** Count of registered users
- **Total Staff:** Count of hospital staff
- **Total Hospitals:** Count of hospitals in system
- **Emergency Alerts:** Active emergency alerts
- Charts showing bed availability and blood inventory

### Step 4: Test User Registration
1. Logout from admin
2. Click **"Register"**
3. Fill in user details:
   - Name: Test User
   - Email: testuser@example.com
   - Password: test123
   - Role: User
4. Register and login

### Step 5: Test Bed Booking
1. Login as user
2. Go to **"Find Beds"**
3. Select a hospital
4. Choose an available bed
5. Fill in patient details
6. Submit booking

### Step 6: Test Blood Request
1. Go to **"Blood Availability"**
2. Check available blood groups
3. Click **"Request Blood"**
4. Fill in request details:
   - Blood Group: A+
   - Units: 2
   - Priority: Emergency
   - Reason: Surgery
5. Submit request

### Step 7: Test AI Chatbot
1. Click on the **AI Assistant** icon (floating button)
2. Ask questions like:
   - "What should I do for fever?"
   - "How to treat a burn?"
   - "I have chest pain" (emergency detection)
   - "Check blood availability"

### Step 8: Test Real-time Features
1. Open application in two browser windows
2. In Window 1: Login as admin
3. In Window 2: Login as user
4. In Window 2: Make a blood request
5. In Window 1: You should see real-time notification

---

## 🔍 API TESTING

### Using Browser or Postman

#### 1. Health Check
```
GET http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Hospital Blood Management System API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 2. AI Service Health Check
```
GET http://localhost:5001/api/ai/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "AI Health Assistant Service is running with OpenAI",
  "version": "3.0.0",
  "ai_provider": "OpenAI",
  "ai_model": "gpt-4o-mini"
}
```

#### 3. Get All Hospitals
```
GET http://localhost:5000/api/hospitals
```

#### 4. Get Blood Inventory
```
GET http://localhost:5000/api/blood/inventory
```

#### 5. AI Chat Test
```
POST http://localhost:5001/api/ai/chat
Content-Type: application/json

{
  "message": "What should I do for fever?",
  "userId": "test123"
}
```

---

## 🐛 TROUBLESHOOTING

### Issue 1: MongoDB Connection Error
**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
```bash
# Check if MongoDB is running
net start MongoDB

# Or start manually
mongod
```

### Issue 2: Port Already in Use
**Error:** `Port 5000 is already in use`

**Solution:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in .env file
PORT=5001
```

### Issue 3: Blockchain Connection Failed
**Error:** `Could not connect to blockchain network`

**Solution:**
1. Ensure blockchain is running: `npm run blockchain`
2. Check if port 8545 is available
3. Verify `BLOCKCHAIN_NETWORK=http://127.0.0.1:8545` in `.env`

### Issue 4: Contract Not Deployed
**Error:** `Contract address not found`

**Solution:**
```bash
# Redeploy contracts
npm run deploy-contracts

# Verify CONTRACT_ADDRESS in .env file
```

### Issue 5: AI Service Not Responding
**Error:** `AI service connection failed`

**Solution:**
1. Check if AI service is running on port 5001
2. Verify `PYTHON_AI_URL=http://localhost:5001` in `.env`
3. Check OpenAI API key is valid
4. Restart AI service:
```bash
cd ai-service
python app.py
```

### Issue 6: React App Won't Start
**Error:** `Module not found` or compilation errors

**Solution:**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue 7: Python Dependencies Error
**Error:** `ModuleNotFoundError: No module named 'flask'`

**Solution:**
```bash
cd ai-service
pip install -r requirements.txt --upgrade
```

### Issue 8: Blockchain Resets After Restart
**Note:** Hardhat local network resets when stopped. This is normal.

**Solution:**
1. Restart blockchain: `npm run blockchain`
2. Redeploy contracts: `npm run deploy-contracts`
3. Reseed data: `npm run seed`

---

## 📊 SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React)                          │
│                   http://localhost:3000                     │
│  - User Interface                                           │
│  - Admin Dashboard                                          │
│  - Staff Portal                                             │
│  - Real-time Updates (Socket.IO)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                    │
│                   http://localhost:5000                     │
│  - REST API                                                 │
│  - Authentication (JWT)                                     │
│  - Socket.IO Server                                         │
│  - Business Logic                                           │
└──────┬──────────────┬──────────────┬───────────────────────┘
       │              │              │
       ↓              ↓              ↓
┌──────────┐   ┌──────────┐   ┌──────────────────────────┐
│ MongoDB  │   │Blockchain│   │   AI Service (Python)    │
│  :27017  │   │  :8545   │   │   http://localhost:5001  │
│          │   │          │   │   - OpenAI Integration   │
│ Database │   │ Ethereum │   │   - Emergency Detection  │
│          │   │ Hardhat  │   │   - Health Assistant     │
└──────────┘   └──────────┘   └──────────────────────────┘
```

---

## 🎯 QUICK START CHECKLIST

- [ ] Node.js installed (v18+)
- [ ] MongoDB installed and running
- [ ] Python installed (v3.8+)
- [ ] All dependencies installed (`npm run install-all`)
- [ ] Python dependencies installed (`pip install -r requirements.txt`)
- [ ] MongoDB service started
- [ ] Blockchain network running (`npm run blockchain`)
- [ ] Smart contracts deployed (`npm run deploy-contracts`)
- [ ] AI service running (`npm run ai-service`)
- [ ] Backend + Frontend running (`npm run dev`)
- [ ] Application accessible at `http://localhost:3000`
- [ ] Admin login working (`admin@hospital.com` / `admin123`)

---

## 📝 IMPORTANT NOTES

1. **Always start services in this order:**
   - MongoDB → Blockchain → AI Service → Backend + Frontend

2. **Keep these terminals open:**
   - Terminal 1: MongoDB (if manual start)
   - Terminal 2: Blockchain (`npm run blockchain`)
   - Terminal 3: AI Service (`npm run ai-service`)
   - Terminal 4: Backend + Frontend (`npm run dev`)

3. **Blockchain data resets** when you stop the Hardhat network. This is expected behavior for local development.

4. **Default Ports:**
   - Frontend: 3000
   - Backend: 5000
   - AI Service: 5001
   - MongoDB: 27017
   - Blockchain: 8545

5. **API Keys:** Your OpenAI API key is already configured in `.env`

---

## 🎓 USER ROLES & CREDENTIALS

### Admin
- **Email:** admin@hospital.com
- **Password:** admin123
- **Access:** Full system management

### Staff (Create via Admin Panel)
- **Role:** Hospital Staff
- **Access:** Blood & bed management for assigned hospital
- **Note:** Requires admin approval

### User (Self Registration)
- **Role:** Patient/Public
- **Access:** View beds, request blood, book beds, AI chatbot
- **Note:** Auto-approved on registration

---

## 🔗 USEFUL LINKS

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **AI Service:** http://localhost:5001/api/ai
- **API Health:** http://localhost:5000/api/health
- **AI Health:** http://localhost:5001/api/ai/health

---

## 📞 EMERGENCY NUMBERS (In-App)

- **Ambulance:** 102 / 108
- **Police:** 100
- **Fire:** 101
- **Women Helpline:** 181
- **Disaster Management:** 1078

---

## ✅ SUCCESS INDICATORS

Your application is running correctly when you see:

1. ✅ MongoDB connected
2. ✅ Blockchain network running on port 8545
3. ✅ Smart contracts deployed
4. ✅ Backend server running on port 5000
5. ✅ Frontend compiled successfully on port 3000
6. ✅ AI service running on port 5001
7. ✅ Socket.IO connections established
8. ✅ Admin login successful
9. ✅ Dashboard displays data
10. ✅ AI chatbot responds

---

## 🎉 CONGRATULATIONS!

Your **Blockchain Enabled Intelligent Hospital Bed and Blood Resource Management System** is now fully operational!

**Next Steps:**
1. Explore the admin dashboard
2. Create test users and staff
3. Test bed booking functionality
4. Test blood request system
5. Interact with AI chatbot
6. Monitor real-time updates

**For Development:**
- Check `server/` for backend code
- Check `client/src/` for frontend code
- Check `blockchain/contracts/` for smart contracts
- Check `ai-service/` for AI service code

---

**Happy Coding! 🚀**
