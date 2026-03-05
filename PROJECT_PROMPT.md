# Full Project Prompt: Blockchain-Enabled Intelligent Hospital Bed and Blood Resource Management System

> Use this prompt to recreate or extend this full-stack healthcare management system from scratch.

---

## PROJECT OVERVIEW

Build a **Blockchain-Enabled Intelligent Hospital Bed and Blood Resource Management System** — a comprehensive full-stack real-time web application for hospital resource management. The system manages hospital bed availability, blood bank inventory, emergency alerts, and provides AI-powered health assistance. All critical operations (blood unit management, bed status changes) are recorded on a local Ethereum blockchain for immutable audit trails. The application is region-focused on **Kurnool, Andhra Pradesh, India** and uses Indian emergency numbers (102/108 Ambulance, 100 Police, 101 Fire).

---

## TECH STACK

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Tailwind CSS, Recharts, React Icons, React Hot Toast |
| **Backend** | Node.js, Express.js, Socket.IO |
| **Database** | MongoDB (with Mongoose ODM), fallback to MongoDB In-Memory Server |
| **Blockchain** | Solidity ^0.8.19, Hardhat, Web3.js (Ethereum local network via Ganache/Hardhat) |
| **AI Service** | Python Flask, Google Gemini via OpenRouter API, NLP-based emergency severity detection |
| **Real-time** | Socket.IO (WebSocket + polling fallback) |
| **Auth** | JWT (JSON Web Tokens), bcryptjs password hashing |
| **Validation** | express-validator |

---

## ARCHITECTURE

```
┌───────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Tailwind)               │
│  Port: 3000                                                   │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐       │
│  │  Admin   │ │  Staff   │ │   User   │ │   Public    │       │
│  │  Layout  │ │  Layout  │ │  Layout  │ │   Layout    │       │
│  └─────────┘ └──────────┘ └──────────┘ └─────────────┘       │
│  Context: AuthContext, SocketContext                          │
│  Services: api.js (Axios with interceptors)                   │
│  Components: FloatingAIAssistant, NotificationDropdown        │
└──────────────────┬──────────────────────────┬─────────────────┘
                   │ REST API + WebSocket      │
┌──────────────────▼──────────────────────────▼─────────────────┐
│                    BACKEND (Node.js + Express)                 │
│  Port: 5000                                                   │
│  Routes: auth, admin, blood, bed, hospital, user, ai,         │
│          blockchain                                           │
│  Middleware: JWT auth, role authorization, approval check,     │
│              validation                                       │
│  Socket.IO: Real-time events (bed updates, blood inventory,   │
│             emergency alerts, booking status, notifications)   │
└────────┬──────────────────────┬────────────────┬──────────────┘
         │                      │                │
┌────────▼────────┐  ┌─────────▼──────┐  ┌──────▼───────────┐
│    MongoDB       │  │   Blockchain   │  │  AI Service      │
│    Database      │  │   (Hardhat/    │  │  (Python Flask)  │
│                  │  │    Ganache)    │  │  Port: 5001      │
│  8 Collections:  │  │  Solidity      │  │  Gemini AI via   │
│  User, Hospital, │  │  Smart         │  │  OpenRouter      │
│  Bed, BedBooking,│  │  Contract      │  │  Emergency       │
│  BloodUnit,      │  │                │  │  Severity        │
│  BloodRequest,   │  │  Records:      │  │  Detection       │
│  BlockchainTx,   │  │  - Blood units │  │                  │
│  EmergencyAlert  │  │  - Bed status  │  │  Fallback NLP    │
└──────────────────┘  └────────────────┘  └──────────────────┘
```

---

## USER ROLES & PERMISSIONS

### 1. Admin (`role: 'admin'`)
- Auto-seeded on startup: `admin@hospital.com` / `admin123`
- Full dashboard with analytics (total users, staff, hospitals, emergency alerts)
- View blood request & bed booking summaries
- Visual charts (Recharts) for blood inventory & hospital distribution
- Approve/reject hospital registrations
- Approve/reject staff accounts
- Manage users (activate/deactivate/delete)
- Create staff members and assign to hospitals
- Manage emergency alerts (view, acknowledge, resolve)
- Blockchain verification panel (view transactions, verify hashes)
- Blood & bed booking management oversight

### 2. Blood Department Staff (`role: 'staff'`)
- Requires admin approval before accessing features (`isApproved` check)
- Assigned to a specific hospital
- Blood inventory management (CRUD operations with blockchain recording)
- Low stock warnings (auto-generated alerts when inventory < threshold)
- Blood request handling (accept/reject with unit assignment)
- Bed management for their hospital (add beds, update status)
- View bed availability overview
- Profile management

### 3. User (`role: 'user'`)
- Auto-approved on registration
- View available beds across hospitals (filter by district, city, bed type)
- View blood availability by group
- Book/reserve hospital beds
- Create blood requests (Emergency/Normal/Scheduled with priority levels)
- Track request status ("My Requests" page)
- AI Health Chatbot for first aid guidance and emergency recommendations
- Profile management with medical history and emergency contacts
- Receive real-time notifications (approval status, request updates, alerts)

---

## DATABASE MODELS (MongoDB + Mongoose)

### User Model
```
- name (String, required, max 50)
- email (String, required, unique, lowercase)
- password (String, required, min 6, select: false)
- phone (String, required)
- role (enum: admin/staff/user, default: user)
- bloodGroup (enum: A+/A-/B+/B-/AB+/AB-/O+/O-, optional)
- address { street, city, district, state, pincode }
- hospital (ObjectId ref: Hospital) — for staff
- department (String)
- isApproved (Boolean, default: false)
- isActive (Boolean, default: true)
- profileImage (String)
- emergencyContact { name, phone, relation }
- medicalHistory [{ condition, date, notes }]
- notifications [{ message, type(info/warning/success/error), read, createdAt }]
- lastLogin (Date)
- resetPasswordToken, resetPasswordExpire
- timestamps: true
Methods: getSignedJwtToken(), matchPassword(), addNotification()
Pre-save hook: hash password with bcrypt (salt 10)
```

### Hospital Model
```
- name (String, required, max 100)
- registrationNumber (String, required, unique)
- email (String, required, unique, lowercase)
- phone (String, required)
- address { street, city, district, state, pincode, coordinates { latitude, longitude } }
- type (enum: government/private/semi-government)
- specializations [String]
- facilities [String]
- totalBeds (Number)
- availableBeds (Number)
- icuBeds { total, available }
- ventilators { total, available }
- hasBloodBank (Boolean)
- hasEmergency (Boolean)
- isApproved (Boolean, default: false)
- isActive (Boolean, default: true)
- rating (0-5)
- images [String]
- operatingHours { open, close }
- admin (ObjectId ref: User)
- staff [ObjectId ref: User]
- timestamps: true
Methods: updateBedCount()
```

### Bed Model
```
- bedNumber (String, required)
- hospital (ObjectId ref: Hospital, required)
- ward (String, required)
- floor (Number)
- type (enum: emergency, default: emergency)
- status (enum: available/occupied/reserved/maintenance/cleaning)
- isAvailable (Boolean)
- hasOxygen, hasVentilator, hasMonitor (Boolean)
- pricePerDay (Number)
- currentPatient (ObjectId ref: User)
- currentBooking (ObjectId ref: BedBooking)
- lastOccupied, lastCleaned (Date)
- blockchainTxHash (String), blockchainBlockNumber (Number)
- history [{ action, patient, performedBy, timestamp, notes, blockchainTxHash }]
Indexes: { hospital, bedNumber, ward } unique compound; { status, type, hospital }
Pre-save: sync isAvailable with status
Static methods: getBedStats(), getAvailableBedsByType()
```

### BedBooking Model
```
- bed (ObjectId ref: Bed, required)
- hospital (ObjectId ref: Hospital, required)
- patient (ObjectId ref: User, required)
- bookingType (enum: emergency/scheduled/walk-in)
- status (enum: pending/confirmed/checked-in/checked-out/cancelled/no-show)
- patientDetails { name, age, gender, phone, condition, diagnosis, referredBy }
- admissionDate, expectedDischargeDate, actualDischargeDate
- checkInTime, checkOutTime
- specialRequirements [String]
- attendingDoctor { name, specialization, phone }
- totalCharges (Number), paymentStatus (enum: pending/partial/paid/insurance)
- insuranceDetails { provider, policyNumber, coverageAmount }
- processedBy, approvedBy (ObjectId ref: User)
- blockchainTxHash (String)
- history [{ status, changedBy, timestamp, notes }]
Pre-save: auto-push status changes to history
```

### BloodUnit Model
```
- bloodGroup (enum: A+/A-/B+/B-/AB+/AB-/O+/O-, required)
- quantity (Number, min 1, required)
- hospital (ObjectId ref: Hospital, required)
- status (enum: available/reserved/used/expired/discarded)
- donorInfo { name, age, gender, phone, bloodDonationId }
- collectionDate (Date, required)
- expiryDate (Date, required)
- componentType (enum: whole_blood/packed_rbc/platelets/plasma/cryoprecipitate)
- storageLocation (String)
- testResults { hiv, hepatitisB, hepatitisC, syphilis, malaria, isCleared }
- addedBy (ObjectId ref: User, required)
- lastUpdatedBy (ObjectId ref: User)
- blockchainTxHash, blockchainBlockNumber
- notes (String)
- history [{ action, performedBy, timestamp, notes, blockchainTxHash }]
Static methods: getInventorySummary(hospitalId), getLowStockAlerts(threshold)
Instance method: isExpired()
```

### BloodRequest Model
```
- requestType (enum: emergency/normal/scheduled)
- bloodGroup (required)
- unitsRequired (Number, min 1)
- unitsApproved (Number)
- componentType (enum)
- requestedBy (ObjectId ref: User, required)
- patientInfo { name, age, gender, bloodGroup, condition, hospitalAdmissionId }
- hospital, targetHospital (ObjectId ref: Hospital)
- status (enum: pending/approved/partially_approved/rejected/fulfilled/cancelled)
- priority (1-5, where 1=highest)
- requiredBy (Date)
- reason (String, required, min 10 chars)
- medicalDocuments [{ name, url, uploadedAt }]
- processedBy (ObjectId ref: User), processedAt
- rejectionReason, notes
- fulfilledUnits [{ bloodUnit, quantity, assignedAt }]
- history [{ status, changedBy, timestamp, notes }]
```

### BlockchainTransaction Model
```
- transactionType (enum: blood_unit_add/blood_unit_update/blood_unit_use/bed_status_update/bed_booking/verification)
- entityType (enum: BloodUnit/Bed/BedBooking)
- entityId (ObjectId, refPath: entityType)
- transactionHash (String, required, unique)
- blockNumber (Number, required)
- blockHash, gasUsed, status (pending/confirmed/failed)
- data (Map of Mixed), dataHash, previousHash
- hospital (ObjectId ref: Hospital)
- performedBy (ObjectId ref: User)
- verifiedAt, notes
Static methods: getEntityHistory(), verifyChain()
```

### EmergencyAlert Model
```
- type (enum: blood_shortage/bed_shortage/equipment_failure/mass_casualty/critical_patient/outbreak/other)
- severity (enum: low/medium/high/critical)
- title, description (String, required)
- hospital (ObjectId ref: Hospital)
- affectedBloodGroups [String], affectedBedTypes [String]
- status (enum: active/acknowledged/resolved/escalated)
- createdBy, acknowledgedBy, resolvedBy (ObjectId ref: User)
- acknowledgedAt, resolvedAt (Date)
- autoGenerated (Boolean)
- targetAudience (enum: all/admin/staff/users)
- metadata (Map of Mixed)
Static methods: getActiveAlertCount(), getAlertsSummary()
```

---

## API ROUTES

### Auth Routes (`/api/auth`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register (user auto-approved, staff needs approval) |
| POST | `/login` | Public | Login with JWT token generation |
| GET | `/me` | Private | Get current user profile |
| PUT | `/profile` | Private | Update name, phone, bloodGroup, address, emergencyContact |
| PUT | `/password` | Private | Change password |
| GET | `/notifications` | Private | Get user notifications |
| PUT | `/notifications/read` | Private | Mark all notifications as read |

### Admin Routes (`/api/admin`) — Admin only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Full dashboard stats, blood inventory, hospital distribution, recent requests, pending approvals |
| GET | `/users` | Paginated user list with search & filter (role, isApproved) |
| PUT | `/users/:id/approve` | Approve/reject user with notification push |
| PUT | `/users/:id/status` | Activate/deactivate user |
| DELETE | `/users/:id` | Delete user |
| GET | `/staff` | List staff with filter/search |
| POST | `/staff` | Create staff with hospital assignment |
| GET | `/hospitals` | List all hospitals (including unapproved) |
| PUT | `/hospitals/:id/approve` | Approve/reject hospital |
| GET | `/alerts` | Get emergency alerts with filters |
| PUT | `/alerts/:id/resolve` | Resolve emergency alert |
| GET | `/analytics/blood` | Blood analytics data |
| GET | `/analytics/hospitals` | Hospital analytics data |
| GET | `/blood-requests` | All blood requests |
| GET | `/bed-bookings` | All bed bookings |

### Blood Routes (`/api/blood`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/inventory` | Private | Blood inventory (staff sees own hospital only) |
| GET | `/summary` | Public | Blood group summary for dashboard |
| POST | `/add` | Staff/Admin | Add blood unit with blockchain recording |
| PUT | `/:id` | Staff/Admin | Update blood unit status |
| GET | `/requests` | Private | Blood requests (role-filtered) |
| POST | `/request` | User | Create blood request (auto-priority by type) |
| PUT | `/requests/:id/process` | Staff | Accept/reject blood request |
| GET | `/low-stock` | Staff/Admin | Get low stock alerts |

### Bed Routes (`/api/beds`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Get beds with filters (hospitalId, type, status) |
| GET | `/available` | Public | Available beds grouped by hospital |
| GET | `/stats` | Public | Bed statistics |
| POST | `/` | Staff/Admin | Add bed with blockchain recording |
| PUT | `/:id` | Staff/Admin | Update bed status with blockchain + hospital count sync |
| DELETE | `/:id` | Staff/Admin | Delete bed |
| POST | `/reserve` | User | Reserve/book a bed |
| GET | `/bookings` | Private | Get bookings (role-filtered) |
| PUT | `/bookings/:id/process` | Staff/Admin | Process booking (confirm/reject) |

### Hospital Routes (`/api/hospitals`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List approved hospitals with filters |
| GET | `/nearby` | Public | Nearby hospitals (coordinate-based) |
| GET | `/:id` | Public | Hospital detail with bed stats & blood inventory |
| POST | `/` | Private | Register hospital (admin auto-approves) |
| PUT | `/:id` | Staff/Admin | Update hospital details |
| DELETE | `/:id` | Admin | Delete hospital |

### AI Routes (`/api/ai`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/chat` | Public (optional auth) | AI chat — tries Google Gemini API → Python AI service → built-in fallback |
| POST | `/emergency-check` | Public | Emergency severity analysis |
| GET | `/health-tips` | Public | Daily health tips |
| GET | `/blood-info/:bloodGroup` | Public | Blood group compatibility info |

### Blockchain Routes (`/api/blockchain`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/status` | Public | Blockchain connection status |
| GET | `/transactions` | Staff/Admin | List blockchain transactions |
| GET | `/verify/:transactionHash` | Public | Verify transaction on-chain |
| GET | `/history/:entityType/:entityId` | Staff/Admin | Entity blockchain history |
| POST | `/record` | Admin | Manual transaction recording |
| GET | `/stats` | Admin | Blockchain statistics |

---

## SMART CONTRACT (Solidity)

**File:** `blockchain/contracts/HospitalManagement.sol`
**Solidity Version:** ^0.8.19

### Structures
- **BloodUnit:** bloodUnitId, bloodGroup, quantity, hospitalId, timestamp, exists
- **BedStatus:** bedId, hospitalId, isAvailable, timestamp, exists
- **TransactionRecord:** entityId, entityType, action, timestamp, dataHash

### Functions
- `recordBloodUnit(bloodUnitId, bloodGroup, quantity, hospitalId)` → records/updates blood unit
- `updateBedStatus(bedId, hospitalId, isAvailable)` → records/updates bed status
- `getBloodUnit(bloodUnitId)` → view blood unit details
- `getBedStatus(bedId)` → view bed status
- `getEntityHistoryCount(entityId)` → count of history records
- `getEntityHistoryItem(entityId, index)` → specific history item
- `getTotalBloodUnits()` / `getTotalBeds()` → total counts
- `generateHash(id, group, quantity)` → keccak256 hash for data integrity
- `verifyData(bloodUnitId, bloodGroup, quantity)` → verify data against stored hash

### Events
- `BloodUnitRecorded`, `BedStatusUpdated`, `TransactionLogged`

---

## AI SERVICE (Python Flask)

**File:** `ai-service/app.py` | **Port:** 5001

### Features
1. **Google Gemini AI via OpenRouter** — multi-model fallback (gemini-2.0-flash → gemini-flash-1.5 → gemini-pro-1.5 → gemini-pro)
2. **Emergency Severity Detection System** — weighted symptom analysis (critical 0.9-1.0, severe 0.7-0.85, moderate 0.4-0.65, mild 0.1-0.35)
3. **Intelligent Fallback NLP** — keyword-based health topic routing when AI APIs fail
4. **First Aid Knowledge Base** — detailed procedures for burns, choking, bleeding, fractures, heart attack, stroke, seizure, poisoning, snake bite, drowning, allergic reactions, heatstroke, hypothermia, electric shock, eye injuries, nosebleed, sprains, fainting
5. **Blood Group Compatibility Engine** — donation/receiving compatibility info
6. **Nearby Hospital Recommendations** — distance calculation (Haversine formula) from Kurnool hospitals
7. **Health Tips System** — category-based health tips

### Endpoints
- `POST /chat` — AI chat with Gemini + fallback
- `POST /analyze-severity` — Emergency severity classification
- `GET /first-aid/<topic>` — First aid guidance by topic
- `GET /blood-compatibility/<bloodGroup>` — Blood type compatibility
- `GET /nearby-hospitals` — Hospitals with distance (lat/lng based)
- `GET /health-tips` — Random health tips by category
- `GET /health` — Service health check

---

## REAL-TIME FEATURES (Socket.IO)

### Socket Authentication
- JWT token passed in `socket.handshake.auth.token`
- Users join: personal room (`user_{id}`), role room (`admin`/`staff`/`user`), hospital room (`hospital_{id}`)

### Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `newRegistration` | Server → Admin | New user/staff registered |
| `accountStatus` | Server → User | Account approved/rejected |
| `bedUpdate` | Server → All | Bed availability changed |
| `bloodInventoryUpdate` | Server → All | Blood stock changed |
| `bloodRequestUpdate` | Server → User | Blood request status changed |
| `bookingUpdate` | Server → User | Bed booking status changed |
| `newEmergencyAlert` | Server → All | New emergency alert created |
| `requestBedUpdate` | Client → Server | Request bed stats for hospital |
| `requestBloodUpdate` | Client → Server | Request blood inventory for hospital |
| `emergencyAlert` | Client → Server | Staff/admin creates emergency alert |
| `chatMessage` | Client → Server | AI chat via socket |
| `aiTyping` / `aiResponse` | Server → Client | AI chat response |
| `subscribe` / `unsubscribe` | Client → Server | Channel subscription management |

---

## FRONTEND PAGES & COMPONENTS

### Layouts (4 distinct layouts with sidebars/navigation)
- **PublicLayout** — Landing page header/footer
- **AdminLayout** — Admin sidebar with dashboard, users, staff, hospitals, alerts
- **StaffLayout** — Staff sidebar with dashboard, blood inventory, blood requests, bed management
- **UserLayout** — User sidebar with dashboard, find beds, blood availability, my requests, AI chatbot, profile

### Admin Pages
- **AdminDashboard** — Stats cards, charts (Recharts), recent requests, pending approvals
- **Users** — User table with search, filter, approve/reject/delete actions
- **Staff** — Staff management with hospital assignment
- **Hospitals** — Hospital list with approval workflow
- **Alerts** — Emergency alert management
- **BedBookingManagement** — Overview of all bed bookings
- **BedManagement** — Admin bed overview across hospitals
- **BlockchainVerification** — Transaction verification panel
- **BloodManagement** — Admin blood inventory overview

### Staff Pages
- **StaffDashboard** — Hospital-specific stats
- **BloodInventory** — Add/update/delete blood units with blockchain
- **BloodRequests** — Process incoming blood requests
- **StaffBedManagement** — Manage beds for assigned hospital

### User Pages
- **UserDashboard** — Personal overview, quick actions
- **FindBeds** — Search available beds with hospital filtering
- **BloodAvailability** — View blood stock across hospitals
- **MyRequests** — Track blood requests and bed bookings
- **AIChatbot** — Chat interface with AI health assistant
- **Profile** — Edit personal info, medical history, emergency contacts

### Shared Components
- **FloatingAIAssistant** — Floating chat widget available on all pages
- **NotificationDropdown** — Real-time notification bell with dropdown

---

## SEED DATA

On first startup, the system auto-seeds:
- **1 Admin user:** `admin@hospital.com` / `admin123`
- **10 Hospitals** from Kurnool, AP (GGH Kurnool, KMC Teaching Hospital, Apollo, Venkateswara, Asha Children's, KIMS, Omni, Sree Ashwini, Deccan, Raghavendra)
- **Blood units** across all 8 blood groups for each hospital with blood bank
- **Bed entries** for each hospital (emergency type, various wards)
- **Staff users** assigned to hospitals

---

## ENVIRONMENT VARIABLES (.env)

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/hospital-management

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Blockchain
BLOCKCHAIN_NETWORK=http://127.0.0.1:8545
CONTRACT_ADDRESS=<deployed-contract-address>

# AI Service
PYTHON_AI_URL=http://localhost:5001
GEMINI_API_KEY=<your-gemini-api-key>

# OpenRouter (used by Python AI service)
OPENROUTER_API_KEY=<your-openrouter-api-key>
```

---

## HOW TO RUN

```bash
# 1. Install all dependencies
npm run install-all

# 2. Start MongoDB
mongod

# 3. Start Hardhat blockchain node (terminal 1)
npm run blockchain

# 4. Deploy smart contracts (terminal 2)
npm run deploy-contracts

# 5. Start AI service (terminal 3)
npm run ai-service

# 6. Start server + client (terminal 4)
npm run dev

# OR start everything together:
npm run dev:all
```

**Default ports:** Client: 3000 | Server: 5000 | AI Service: 5001 | Blockchain: 8545

---

## KEY IMPLEMENTATION PATTERNS

1. **Blockchain recording is non-blocking** — operations succeed even if blockchain fails; result stored if available
2. **MongoDB fallback** — uses `mongodb-memory-server` if MongoDB connection fails (data lost on restart)
3. **AI triple fallback** — Google Gemini API → Python Flask AI → built-in keyword responses
4. **Role-based data filtering** — Staff sees only their hospital's data; Users see only their own requests
5. **Socket.IO room architecture** — Personal rooms, role rooms, hospital rooms for targeted notifications
6. **Auto-seeding** — Admin user and sample data created on first startup
7. **Request validation** — express-validator middleware on all mutation endpoints
8. **Approval workflow** — Staff and hospitals require admin approval; users auto-approved
9. **History tracking** — All entities maintain a history array with timestamps, user refs, and blockchain hashes
10. **Emergency priority** — Blood requests auto-set priority based on type (emergency=1, normal=3, scheduled=4)
