# Blockchain-Enabled Intelligent Hospital Bed & Blood Resource Management System

A full-stack, real-time healthcare platform built with the **MERN stack**, **Ethereum blockchain** (Hardhat/Solidity), **AI-powered health assistant** (Google Gemini + Python Flask), and **Socket.IO** for live updates. Designed for managing hospital beds, blood bank inventory, and emergency alerts across multiple hospitals in Kurnool, Andhra Pradesh, India.

---

## Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Demo Credentials](#-demo-credentials)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Database Models](#-database-models)
- [Blockchain Integration](#-blockchain-integration)
- [AI Health Assistant](#-ai-health-assistant)
- [Real-Time Events (Socket.IO)](#-real-time-events-socketio)
- [Frontend Pages](#-frontend-pages)
- [Security](#-security)

---

## 🏥 Features

### Admin Module
- Dashboard with analytics (users, staff, hospitals, emergency alerts, blood/bed stats)
- Visual charts (blood inventory by group, hospital distribution) via Recharts
- User management — view, search, activate/deactivate, delete
- Staff approval workflow — approve/reject pending staff registrations
- Hospital CRUD — add, edit, approve, delete hospitals
- Emergency alert management — acknowledge and resolve alerts
- Bed booking management — approve/reject patient bookings
- Bed & blood inventory management across all hospitals
- Blockchain verification panel — transaction explorer, hash verification

### Staff Module (Blood Department)
- Hospital-specific dashboard with stats and low-stock alerts
- Blood inventory management — add units with donor info, test results, expiry dates
- Blood request handling — approve, reject, or fulfill with specific units
- Bed management — add beds, update status (available/occupied/maintenance/cleaning)
- Patient check-in/check-out workflow
- Blockchain recording of all blood and bed operations

### User Module (Patient/Public)
- Browse available beds across hospitals, filtered by type and location
- View blood availability summary by blood group
- Book beds with patient details, admission dates, insurance info
- Create blood requests (emergency/normal/scheduled) with priority levels
- Track all personal requests and bookings in "My Requests"
- AI Health Chatbot — first aid guidance, symptom assessment, emergency severity detection
- Profile management with emergency contacts and medical history

### Cross-Cutting
- Floating AI assistant accessible from every page (text + voice input)
- Real-time notifications via Socket.IO (bell icon with unread count)
- Emergency alert broadcasting to all connected users
- Blockchain audit trail for blood and bed operations
- In-memory MongoDB fallback when primary database is unavailable

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18.2, Tailwind CSS 3.4, React Router 6 | SPA with responsive UI |
| **Charts** | Recharts 2.10 | Data visualization (pie, bar, line) |
| **Icons** | React Icons 5.0 | UI iconography |
| **Notifications** | React Hot Toast 2.4 | Toast notifications |
| **Date Handling** | date-fns 3.0 | Date formatting & manipulation |
| **HTTP Client** | Axios 1.6 | API communication with JWT interceptor |
| **Real-time (Client)** | Socket.IO Client 4.6 | WebSocket communication |
| **Backend** | Node.js 18+, Express 4.18 | REST API server |
| **Database** | MongoDB 8.x, Mongoose 8.0 | Document database with ODM |
| **Authentication** | jsonwebtoken 9.0, bcryptjs 2.4 | JWT tokens + password hashing |
| **Validation** | express-validator 7.0 | Server-side input validation |
| **Real-time (Server)** | Socket.IO 4.6 | WebSocket server |
| **Blockchain** | Hardhat 2.28, Solidity 0.8.19, Web3.js 4.3 | Ethereum smart contracts |
| **AI Service** | Python 3.8+, Flask 2.3 | Health chatbot fallback service |
| **AI Models** | Google Gemini, OpenAI GPT-4o-mini | Natural language processing |
| **File Upload** | Multer 1.4 | Multipart file handling |
| **Email** | Nodemailer 6.9 | Email notifications (optional) |

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    CLIENT (React 18 SPA)                       │
│   Tailwind CSS · Recharts · React Router 6 · Socket.IO        │
│   AuthContext · SocketContext · Axios API Service               │
│   Port: 3000                                                    │
└───────────────┬───────────────────────────┬───────────────────┘
                │ REST API (HTTP)           │ WebSocket
┌───────────────▼───────────────────────────▼───────────────────┐
│                 SERVER (Express + Socket.IO)                    │
│   8 Route Files · JWT Auth · Role Middleware · Validators       │
│   Port: 5000                                                    │
└──────┬──────────────────┬──────────────────┬──────────────────┘
       │                  │                  │
  ┌────▼────┐       ┌─────▼──────┐     ┌────▼──────────────┐
  │ MongoDB │       │ Blockchain │     │  AI Service       │
  │         │       │ (Hardhat)  │     │  (Python Flask)   │
  │ 8 models│       │ Solidity   │     │  Gemini / OpenAI  │
  │ :27017  │       │ :8545      │     │  :5001            │
  └─────────┘       └────────────┘     └───────────────────┘
```

---

## 📦 Installation

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or Atlas — falls back to in-memory if unavailable)
- **Python** 3.8+ (for AI service)
- **npm** or **yarn**

### Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd "PROJECT IMPPPP"

# 2. Install all dependencies (root + client + blockchain)
npm run install-all

# 3. Install Python AI dependencies
cd ai-service
pip install -r requirements.txt
cd ..

# 4. Create environment file
# Copy .env.example to .env and configure values (see Environment Variables below)
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root with the following:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/hospital_blood_management

# JWT
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRE=30d

# Blockchain (optional — set ENABLE_BLOCKCHAIN=true to activate)
ENABLE_BLOCKCHAIN=false
BLOCKCHAIN_NETWORK=http://127.0.0.1:8545
CONTRACT_ADDRESS=          # Auto-populated by deploy script

# AI Service
PYTHON_AI_URL=http://localhost:5001
OPENAI_API_KEY=            # Optional — OpenAI GPT-4o-mini
GEMINI_API_KEY=            # Optional — Google Gemini

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🚀 Running the Application

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start backend (port 5000) + frontend (port 3000) |
| `npm run dev:all` | Start backend + frontend + AI service (port 5001) |
| `npm run server` | Start backend only |
| `npm run client` | Start frontend only |
| `npm run ai-service` | Start Python AI service only |
| `npm run blockchain` | Start local Hardhat blockchain node (port 8545) |
| `npm run deploy-contracts` | Deploy smart contracts to local Hardhat node |
| `npm run seed` | Seed admin user into database |
| `npm run build` | Build frontend for production |
| `npm run install-all` | Install dependencies for root, client, and blockchain |

### Recommended Startup Sequence

```bash
# Terminal 1 — Start MongoDB (if local)
mongod

# Terminal 2 — (Optional) Start blockchain
npm run blockchain
# Then in another terminal: npm run deploy-contracts

# Terminal 3 — Start everything
npm run dev:all
```

> **Note:** The server auto-seeds an admin user and sample data (hospitals, beds, blood units) on first startup if the database is empty.

---

## 👤 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | admin123 |
| Staff | drrajeshku0@hospital.com | staff123 |
| User | ravi.teja@gmail.com | user123 |

---

## 📁 Project Structure

```
PROJECT IMPPPP/
│
├── package.json                    # Root config — npm scripts & backend dependencies
├── nodemon.json                    # Watches server/ folder, restarts on changes
├── .env                            # Environment variables (not in git)
├── .env.example                    # Environment template
├── PRD.md                          # Product Requirements Document
├── PROJECT_STRUCTURE.md            # Detailed file-by-file documentation
├── README.md                       # This file
│
├── server/                         # 🟦 BACKEND — Express.js API
│   ├── index.js                    # Entry point — Express + Socket.IO + startup sequence
│   ├── config/
│   │   ├── database.js             # MongoDB connection (Atlas → in-memory fallback)
│   │   └── blockchain.js           # Web3 blockchain service (graceful degradation)
│   ├── middleware/
│   │   ├── auth.js                 # JWT protect, role authorize, approval check, optional auth
│   │   └── validation.js           # express-validator rules for all entities
│   ├── models/
│   │   ├── User.js                 # Users (admin/staff/user) with notifications
│   │   ├── Hospital.js             # Hospitals with geospatial coordinates
│   │   ├── Bed.js                  # Beds with equipment flags & status history
│   │   ├── BedBooking.js           # Bed reservations with patient details
│   │   ├── BloodUnit.js            # Blood inventory with donor/test info
│   │   ├── BloodRequest.js         # Blood requests with priority & fulfillment
│   │   ├── EmergencyAlert.js       # System alerts with severity levels
│   │   └── BlockchainTransaction.js # On-chain audit log with hash chain
│   ├── routes/
│   │   ├── auth.routes.js          # Register, login, profile (3 endpoints)
│   │   ├── admin.routes.js         # Dashboard, users, staff, hospitals, CRUD (14+ endpoints)
│   │   ├── blood.routes.js         # Inventory, add unit, requests, fulfill (8+ endpoints)
│   │   ├── bed.routes.js           # Beds, bookings, check-in/out, stats (10+ endpoints)
│   │   ├── hospital.routes.js      # List, nearby, details, register (4+ endpoints)
│   │   ├── user.routes.js          # User dashboard, requests, cancellations (5 endpoints)
│   │   ├── ai.routes.js            # Chat, health tips, emergency check (3+ endpoints)
│   │   └── blockchain.routes.js    # Status, transactions, verify, history (5 endpoints)
│   ├── socket/
│   │   └── socketHandler.js        # WebSocket events, room management, real-time broadcasts
│   └── utils/
│       ├── seedAdmin.js            # Creates default admin on startup
│       ├── seedData.js             # Seeds hospitals, beds, blood units
│       ├── seedDemoUsers.js        # Creates demo staff and user accounts
│       └── reseedAll.js            # Full database reset and re-seed
│
├── client/                         # 🟩 FRONTEND — React 18 SPA
│   ├── package.json                # Frontend dependencies (proxy → localhost:5000)
│   ├── postcss.config.js           # PostCSS: Tailwind + Autoprefixer
│   ├── tailwind.config.js          # Custom color palette & responsive config
│   ├── public/
│   │   └── index.html              # HTML shell with Inter font
│   └── src/
│       ├── index.js                # Entry — BrowserRouter, AuthProvider, SocketProvider
│       ├── App.js                  # Route definitions (22 routes)
│       ├── index.css               # Tailwind directives + custom animations
│       ├── services/
│       │   └── api.js              # Axios client with JWT interceptor & grouped API methods
│       ├── context/
│       │   ├── AuthContext.js      # Auth state: login, register, logout, token management
│       │   └── SocketContext.js    # Socket.IO connection & real-time event listeners
│       ├── components/
│       │   ├── FloatingAIAssistant.js  # Floating chat widget (text + voice + quick actions)
│       │   └── NotificationDropdown.js # Bell icon with notification list
│       ├── layouts/
│       │   ├── PublicLayout.js     # Navbar + footer for public pages
│       │   ├── AdminLayout.js      # Sidebar with 9 menu items
│       │   ├── StaffLayout.js      # Sidebar with 5 menu items
│       │   └── UserLayout.js       # Sidebar with 6 menu items
│       └── pages/
│           ├── auth/               # Login, Register
│           ├── public/             # Home (landing page)
│           ├── admin/              # 9 pages: Dashboard, Users, Staff, Hospitals, Alerts,
│           │                       #   BedBookings, BedManagement, BloodManagement, Blockchain
│           ├── staff/              # 4 pages: Dashboard, BloodInventory, BloodRequests, BedMgmt
│           └── user/               # 6 pages: Dashboard, FindBeds, BloodAvailability,
│                                   #   MyRequests, AIChatbot, Profile
│
├── blockchain/                     # 🟪 BLOCKCHAIN — Ethereum Smart Contracts
│   ├── package.json                # Hardhat 2.28 + toolbox
│   ├── hardhat.config.js           # Solidity 0.8.19, optimizer, localhost:8545
│   ├── contracts/
│   │   └── HospitalManagement.sol  # Blood unit & bed status recording, event emission
│   ├── scripts/
│   │   └── deploy.js               # Deploy contract, writes address to .env
│   └── artifacts/                  # Compiled ABI (auto-generated)
│
└── ai-service/                     # 🟧 AI SERVICE — Python Flask
    ├── app.py                      # Flask API (chat, emergency check, health tips)
    └── requirements.txt            # Flask, flask-cors, python-dotenv, google-genai
```

---

## 🔗 API Endpoints

### Authentication (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Register (users auto-approved, staff requires admin approval) |
| POST | `/api/auth/login` | Public | Login, returns JWT token |
| GET | `/api/auth/me` | Protected | Get current user profile |

### Admin (`/api/admin`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/dashboard` | Admin | Dashboard stats (users, hospitals, beds, blood, alerts) |
| GET | `/api/admin/users` | Admin | List all users (search, filter, paginate) |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |
| GET | `/api/admin/staff/pending` | Admin | List pending staff approvals |
| PUT | `/api/admin/staff/:id/approve` | Admin | Approve staff account |
| PUT | `/api/admin/staff/:id/reject` | Admin | Reject staff account |
| | | | *Plus CRUD for hospitals, beds, blood units, bookings* |

### Blood Management (`/api/blood`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/blood/inventory` | Staff/Admin | Blood units (filter: hospital, group, status) |
| GET | `/api/blood/summary` | Public | Aggregated stats by blood group |
| POST | `/api/blood/add` | Staff/Admin | Add blood unit (records to blockchain) |
| GET | `/api/blood/requests` | Staff/Admin | List blood requests |
| POST | `/api/blood/requests` | User | Create blood request |
| PUT | `/api/blood/requests/:id/approve` | Staff/Admin | Approve request |
| PUT | `/api/blood/requests/:id/fulfill` | Staff/Admin | Fulfill with specific blood units |
| GET | `/api/blood/low-stock` | Staff/Admin | Hospitals with low inventory |

### Bed Management (`/api/beds`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/beds` | Public | All beds (filter: hospital, type, status) |
| GET | `/api/beds/available` | Public | Available beds grouped by hospital |
| GET | `/api/beds/stats` | Public | Bed statistics |
| POST | `/api/beds` | Staff/Admin | Add new bed |
| PUT | `/api/beds/:id` | Staff/Admin | Update bed status (records to blockchain) |
| POST | `/api/beds/book` | User | Book a bed |
| GET | `/api/beds/bookings` | Protected | User's bed bookings |
| PUT | `/api/beds/bookings/:id/approve` | Staff/Admin | Approve booking |
| PUT | `/api/beds/bookings/:id/checkin` | Staff/Admin | Check in patient |
| PUT | `/api/beds/bookings/:id/checkout` | Staff/Admin | Check out patient |

### Hospitals (`/api/hospitals`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/hospitals` | Public | List approved hospitals (filter: city, district, blood bank) |
| GET | `/api/hospitals/nearby` | Public | Nearby hospitals by coordinates |
| GET | `/api/hospitals/:id` | Public | Hospital details + bed & blood stats |
| POST | `/api/hospitals` | Protected | Register new hospital |

### User (`/api/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/dashboard` | User | User's blood requests & bed bookings |
| GET | `/api/users/blood-requests` | User | Blood request history |
| GET | `/api/users/bed-bookings` | User | Bed booking history |
| PUT | `/api/users/blood-requests/:id/cancel` | User | Cancel blood request |
| PUT | `/api/users/bed-bookings/:id/cancel` | User | Cancel bed booking |

### AI Health Assistant (`/api/ai`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/chat` | Optional | AI health chatbot (multi-provider fallback) |
| GET | `/api/ai/health-tips` | Public | Random first aid tips |
| POST | `/api/ai/emergency-check` | Public | Classify emergency severity |

### Blockchain (`/api/blockchain`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/blockchain/status` | Public | Blockchain connection status |
| GET | `/api/blockchain/transactions` | Staff/Admin | Transaction history |
| GET | `/api/blockchain/verify/:transactionHash` | Public | Verify transaction by hash |
| GET | `/api/blockchain/history/:entityType/:entityId` | Staff/Admin | Entity blockchain history |
| POST | `/api/blockchain/record` | Admin | Manually record transaction |

### Health Check
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | Public | Server status + timestamp |

---

## 📊 Database Models

| Model | Collection | Key Fields |
|-------|-----------|------------|
| **User** | `users` | name, email, password (bcrypt), role (admin/staff/user), bloodGroup, hospital (ref), isApproved, isActive, notifications[], emergencyContact |
| **Hospital** | `hospitals` | name, registrationNumber, address (with geo coordinates), type (government/private), totalBeds, availableBeds, hasBloodBank, specializations[], rating |
| **Bed** | `beds` | bedNumber, hospital, ward, floor, type (11 types), status (5 states), hasOxygen/Ventilator/Monitor, pricePerDay, blockchainTxHash, history[] |
| **BedBooking** | `bedbookings` | bed, hospital, patient, bookingType, status (8 states), patientDetails, admissionDate, totalCharges, paymentStatus, insuranceDetails |
| **BloodUnit** | `bloodunits` | bloodGroup (8 types), quantity, componentType (5 types), donorInfo, expiryDate, testResults (HIV/HepB/HepC/Syphilis/Malaria), blockchainTxHash |
| **BloodRequest** | `bloodrequests` | requestType, bloodGroup, unitsRequired, priority (1-5), status (6 states), patientInfo, fulfilledUnits[] |
| **EmergencyAlert** | `emergencyalerts` | type (7 types), severity (4 levels), title, hospital, status (active/acknowledged/resolved), autoGenerated |
| **BlockchainTransaction** | `blockchaintransactions` | transactionType, entityType, transactionHash, blockNumber, dataHash, previousHash, status |

---

## ⛓️ Blockchain Integration

### Smart Contract: `HospitalManagement.sol`

- **Solidity** ^0.8.19 on local Hardhat network (chain ID 31337, port 8545)
- **Functions:**
  - `recordBloodUnit(bloodUnitId, bloodGroup, quantity, hospitalId)` — Immutable blood record
  - `updateBedStatus(bedId, hospitalId, isAvailable)` — Bed state on-chain
  - `getBloodUnit()` / `getBedStatus()` — Query on-chain data
  - `getEntityHistoryCount()` / `getEntityTransaction()` — Transaction audit trail
  - `generateHash()` — Keccak256 hash for data integrity
- **Events:** `BloodUnitRecorded`, `BedStatusUpdated`, `TransactionLogged`

### Graceful Degradation

- Blockchain is **optional** — controlled by `ENABLE_BLOCKCHAIN=true` in `.env`
- All core operations succeed even if blockchain is offline
- `blockchainTxHash` fields are nullable on Bed and BloodUnit models
- API responses include a `blockchain` object indicating recording success/failure

---

## 🤖 AI Health Assistant

### Provider Fallback Chain

```
User Message → Health Topic Validation
                    │
        ┌───────────▼───────────┐
        │  OpenAI GPT-4o-mini   │  ← Primary (if OPENAI_API_KEY set)
        └───────────┬───────────┘
                    │ (if fails)
        ┌───────────▼───────────┐
        │  Google Gemini        │  ← Secondary (if GEMINI_API_KEY set)
        └───────────┬───────────┘
                    │ (if fails)
        ┌───────────▼───────────┐
        │  Python Flask NLP     │  ← Tertiary (localhost:5001)
        └───────────┬───────────┘
                    │ (if fails)
        ┌───────────▼───────────┐
        │  Built-in Fallback    │  ← Static keyword-matched responses
        └───────────────────────┘
```

### Capabilities

- **Emergency Severity Detection** — Classifies symptoms into 5 levels: Critical (0.9–1.0), Severe (0.7–0.85), Moderate (0.4–0.65), Mild (0.1–0.35), Low (0.0–0.1)
- **First Aid Guidance** — 20+ emergency topics (burns, choking, bleeding, fractures, heart attack, stroke, seizures, poisoning, snake bite, drowning, etc.)
- **Blood Group Compatibility** — Donate-to / receive-from lookups for all 8 blood groups
- **Hospital Information** — 10 hospitals in Kurnool district with addresses, phone numbers, and specializations
- **Non-health Query Rejection** — Validates against 80+ health-related keywords; politely redirects off-topic queries
- **Floating Widget** — Available on every page with text input, voice input (Web Speech API), and quick action buttons

---

## 📡 Real-Time Events (Socket.IO)

### Room Architecture

| Room | Members | Purpose |
|------|---------|---------|
| `user_{userId}` | Individual user | Personal notifications |
| `admin` | All admin users | Admin-specific broadcasts |
| `staff` | All staff users | Staff-specific broadcasts |
| `user` | All regular users | User-specific broadcasts |
| `hospital_{hospitalId}` | Hospital staff | Hospital-scoped updates |

### Key Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `bedUpdate` | Server → All | Bed status changed |
| `bloodInventoryUpdate` | Server → All | Blood inventory modified |
| `newEmergencyAlert` | Server → All | Emergency alert created |
| `bookingUpdate` | Server → User | Booking status changed |
| `bloodRequestUpdate` | Server → User | Blood request status changed |
| `notification` | Server → User | Personal notification |
| `newRegistration` | Server → Admin | New user/staff registered |
| `accountStatus` | Server → User | Account approved/rejected |
| `requestBedUpdate` | Client → Server | Request bed stats |
| `requestBloodUpdate` | Client → Server | Request blood stats |
| `emergencyAlert` | Client → Server | Create emergency alert (staff/admin) |
| `chatMessage` | Client → Server | AI chat message |

---

## 🖥️ Frontend Pages (22 Total)

| Module | Route | Page |
|--------|-------|------|
| **Public** | `/` | Landing page with feature showcase & stats |
| **Auth** | `/login` | Email/password login with role-based redirect |
| **Auth** | `/register` | Two-step registration (user auto-approved, staff needs approval) |
| **Admin** | `/admin` | Analytics dashboard with charts & Socket.IO live updates |
| **Admin** | `/admin/users` | User management (search, filter, delete) |
| **Admin** | `/admin/staff` | Staff approval workflow |
| **Admin** | `/admin/hospitals` | Hospital CRUD management |
| **Admin** | `/admin/alerts` | Emergency alert management |
| **Admin** | `/admin/bed-bookings` | Bed booking request handling |
| **Admin** | `/admin/beds` | Bed inventory management |
| **Admin** | `/admin/blood` | Blood unit management |
| **Admin** | `/admin/blockchain` | Blockchain transaction explorer |
| **Staff** | `/staff` | Staff dashboard with hospital stats |
| **Staff** | `/staff/inventory` | Blood inventory for assigned hospital |
| **Staff** | `/staff/requests` | Blood request processing |
| **Staff** | `/staff/beds` | Bed management with check-in/out |
| **Staff** | `/staff/profile` | Profile editor |
| **User** | `/user` | User dashboard with quick actions |
| **User** | `/user/beds` | Browse & book available beds |
| **User** | `/user/blood` | Blood availability search & request |
| **User** | `/user/my-requests` | Blood request & bed booking history |
| **User** | `/user/chatbot` | AI health assistant (Gemini + quick assistant) |
| **User** | `/user/profile` | Profile with medical history |

---

## 🔒 Security

- **Password Hashing** — bcrypt with salt rounds (10)
- **JWT Authentication** — Stateless tokens with configurable expiry; stored in localStorage
- **Role-Based Access Control** — `protect` → `authorize(roles)` → `checkApproval` middleware chain
- **Input Validation** — express-validator on all mutation endpoints
- **CORS** — Configured for specific origins (`localhost:3000`, `localhost:3001`)
- **Socket.IO Auth** — JWT token verified on connection
- **Blood Safety** — Donor test results tracked (HIV, Hepatitis B/C, Syphilis, Malaria)
- **Staff Gating** — Staff accounts blocked until admin approval
- **Account Deactivation** — Inactive accounts cannot authenticate

---

## 📞 Emergency Numbers (India)

| Service | Number |
|---------|--------|
| Ambulance | 102 / 108 |
| Police | 100 |
| Fire | 101 |
| Women Helpline | 181 |
| Disaster Management | 1078 |

---

## 📄 License

MIT

## 📡 Real-time Features

- Live bed availability updates
- Real-time blood stock changes
- Emergency alert notifications
- Live request status updates

## 👥 Default Credentials

### Admin
- Email: admin@hospital.com
- Password: admin123

## 📄 License

MIT License
