# PROJECT STRUCTURE — HealthWise AI Pro

## Blockchain-Enabled Intelligent Hospital Bed & Blood Resource Management System

**Tech Stack:** React 18 + Node.js/Express + MongoDB + Ethereum (Hardhat) + Python Flask  
**Ports:** Frontend `3000` | Backend `5000` | AI Service `5001` | Blockchain `8545`  
**Region:** Kurnool, Andhra Pradesh, India

---

## QUICK REFERENCE — How to Run

```
npm run dev          → Start backend (port 5000) + frontend (port 3000)
npm run dev:all      → Start backend + frontend + AI service (port 5001)
npm run seed         → Seed admin user into database
npm run blockchain   → Start local Hardhat blockchain node
npm run deploy-contracts → Deploy smart contracts
```

**Demo Logins:**
| Role  | Email                       | Password  |
|-------|-----------------------------|-----------|
| Admin | admin@hospital.com          | admin123  |
| Staff | drrajeshku0@hospital.com    | staff123  |
| User  | ravi.teja@gmail.com         | user123   |

---

## COMPLETE FILE MAP

> **Legend:**  
> 🟦 = BACKEND (server-side)  
> 🟩 = FRONTEND (client-side)  
> 🟪 = BLOCKCHAIN (smart contracts)  
> 🟧 = AI SERVICE (Python)  
> ⚙️ = CONFIG (project configuration)  
> 📄 = DOCS (documentation)  
> ⚠️ = POTENTIALLY UNNECESSARY (flagged for review below)

---

### ROOT FILES

```
PROJECT IMPPPP/
│
├── ⚙️ package.json              → Root project config. Defines all npm scripts (dev, build, seed, etc.)
│                                   and backend dependencies (express, mongoose, socket.io, web3, etc.)
│
├── ⚙️ package-lock.json         → Auto-generated dependency lock file (exact versions)
│
├── ⚙️ nodemon.json              → Nodemon config — watches server/ folder, restarts on .js/.json changes
│
├── ⚙️ .env                      → Environment variables (SECRET — contains DB URL, API keys, JWT secret)
│
├── ⚙️ .env.example              → Template showing what .env should contain (safe to share)
│
├── ⚙️ .gitignore                → Tells Git to ignore: node_modules, .env, __pycache__, client/build
│
├── 📄 README.md                  → Project overview, features, installation guide, tech stack
│
├── 📄 PRD.md                     → Product Requirements Document — full business requirements, user
│                                   personas, architecture, goals, KPIs, risk analysis
│
├── 📄 PROJECT_PROMPT.md          → Technical specification — database schemas, API endpoints, socket
│                                   events, blockchain flow, environment variables
│
├── 🟦 view-db.js                 → Dev utility — connects to MongoDB and prints all collections
│                                   (users, hospitals, beds, blood units, alerts, bookings, requests)
│
├── ⚠️ test_output.txt            → Debug leftover — contains raw Thesys API response from testing
│
└── 📁 node_modules/              → Auto-installed dependencies (ignored by Git)
```

---

### 🟦 BACKEND — `server/`

The Express.js backend API. Handles all business logic, database operations, authentication, and real-time events.

```
server/
│
├── 🟦 index.js                   → MAIN ENTRY POINT — creates Express app + HTTP server + Socket.IO.
│                                   Loads all routes, connects to MongoDB, seeds data, initializes
│                                   blockchain. Runs on port 5000.
│
├── config/
│   ├── 🟦 database.js            → MongoDB connection. Tries configured URI first, falls back to
│   │                               in-memory MongoDB (MongoMemoryServer) if connection fails.
│   │
│   └── 🟦 blockchain.js          → Web3 blockchain service. Loads compiled contract ABI, connects
│                                   to Hardhat node, provides methods to record blood/bed changes
│                                   on-chain. Gracefully disabled if not configured.
│
├── middleware/
│   ├── 🟦 auth.js                → JWT authentication middleware:
│   │                               • protect — verifies Bearer token, attaches user to request
│   │                               • authorize — role-based access (admin, staff, user)
│   │                               • checkApproval — blocks unapproved staff
│   │                               • optionalAuth — allows anonymous access with optional user info
│   │
│   └── 🟦 validation.js          → Express-validator rules for:
│                                   • Registration (name, email, password, phone)
│                                   • Login (email, password)
│                                   • Blood units (blood group, quantity, expiry, component type)
│                                   • Blood requests (urgency, units needed)
│
├── models/                        → Mongoose schemas (MongoDB collections)
│   ├── 🟦 User.js                → User accounts — name, email, hashed password, role (admin/staff/
│   │                               user), blood group, phone, address, hospital assignment, approval
│   │                               status, notifications array. Methods: matchPassword(), getSignedJwtToken()
│   │
│   ├── 🟦 Hospital.js            → Hospital records — name, address (street/city/district/state/pincode),
│   │                               phone, email, type (government/private), beds count, facilities,
│   │                               specializations, blood bank flag, coordinates, ratings, active status
│   │
│   ├── 🟦 Bed.js                 → Hospital beds — bed number, ward, floor, type (General/ICU/Emergency/
│   │                               Pediatric/Maternity/Private/Semi-Private), status (available/occupied/
│   │                               maintenance/reserved), facilities (oxygen, ventilator, monitor, AC),
│   │                               price per day, linked hospital, blockchain tx hash, history array
│   │
│   ├── 🟦 BedBooking.js          → Bed reservations — patient name, phone, admission date, special
│   │                               requirements, insurance info, status flow (pending → approved →
│   │                               checked_in → checked_out / rejected / cancelled), linked bed/hospital/user
│   │
│   ├── 🟦 BloodUnit.js           → Blood inventory — blood group (A+/A-/B+/B-/AB+/AB-/O+/O-),
│   │                               component type (whole blood, packed RBC, platelets, plasma, cryo),
│   │                               collection/expiry dates, donor info, test results (HIV, Hepatitis,
│   │                               Malaria, Syphilis), status (available/reserved/used/expired),
│   │                               linked hospital, blockchain tx hash
│   │
│   ├── 🟦 BloodRequest.js        → Blood requests by users — blood group, units needed, urgency
│   │                               (normal/urgent/emergency), patient condition, request type
│   │                               (transfusion/surgery/emergency/other), status (pending/approved/
│   │                               rejected/fulfilled/cancelled), fulfillment tracking, linked hospital/user
│   │
│   ├── 🟦 EmergencyAlert.js      → System alerts — type (blood_shortage/bed_shortage/mass_casualty/
│   │                               equipment_failure/outbreak), severity (low/medium/high/critical),
│   │                               title, description, affected hospital, status (active/acknowledged/
│   │                               resolved), created/resolved by user references
│   │
│   └── 🟦 BlockchainTransaction.js → Blockchain audit records — transaction hash, block number, type
│                                     (blood_add/blood_update/blood_use/bed_status_change), related
│                                     entity ID, gas used, timestamp, status. Methods for chain
│                                     integrity verification.
│
├── routes/                        → Express route handlers (API endpoints)
│   ├── 🟦 auth.routes.js         → POST /api/auth/register — create account (auto-approve users)
│   │                               POST /api/auth/login — authenticate, return JWT token
│   │                               GET /api/auth/me — get current user profile
│   │                               PUT /api/auth/profile — update profile
│   │                               PUT /api/auth/change-password — change password
│   │                               GET /api/auth/notifications — get user notifications
│   │                               PUT /api/auth/notifications/:id/read — mark notification read
│   │
│   ├── 🟦 admin.routes.js        → GET /api/admin/dashboard — stats (users, hospitals, beds, blood)
│   │                               GET /api/admin/users — list all users with filters
│   │                               DELETE /api/admin/users/:id — remove user
│   │                               GET /api/admin/staff/pending — pending staff approvals
│   │                               PUT /api/admin/staff/:id/approve — approve staff
│   │                               PUT /api/admin/staff/:id/reject — reject staff
│   │                               CRUD operations for hospitals, beds, blood units, bookings
│   │
│   ├── 🟦 blood.routes.js        → GET /api/blood/inventory — blood units with filters
│   │                               POST /api/blood/units — add blood unit (staff/admin)
│   │                               POST /api/blood/requests — create blood request (user)
│   │                               PUT /api/blood/requests/:id/approve — approve request
│   │                               PUT /api/blood/requests/:id/fulfill — fulfill with units
│   │                               GET /api/blood/summary — aggregated stats by blood group
│   │                               GET /api/blood/low-stock — hospitals with low blood inventory
│   │
│   ├── 🟦 bed.routes.js          → GET /api/beds — all beds with filters (hospital, type, status)
│   │                               GET /api/beds/available — available beds only
│   │                               POST /api/beds — add new bed (staff/admin)
│   │                               PUT /api/beds/:id — update bed status
│   │                               POST /api/beds/book — book a bed (user)
│   │                               GET /api/beds/bookings — user's bed bookings
│   │                               PUT /api/beds/bookings/:id/approve — approve booking
│   │                               PUT /api/beds/bookings/:id/checkin — check in patient
│   │                               PUT /api/beds/bookings/:id/checkout — check out patient
│   │                               GET /api/beds/stats — bed statistics by type/hospital
│   │
│   ├── 🟦 hospital.routes.js     → GET /api/hospitals — list approved hospitals (with filters)
│   │                               GET /api/hospitals/:id — get hospital details
│   │                               GET /api/hospitals/nearby — hospitals by geo-coordinates
│   │
│   ├── 🟦 user.routes.js         → GET /api/users/dashboard — user's blood requests + bed bookings
│   │                               GET /api/users/blood-requests — user's blood request history
│   │                               GET /api/users/bed-bookings — user's bed booking history
│   │                               PUT /api/users/blood-requests/:id/cancel — cancel blood request
│   │                               PUT /api/users/bed-bookings/:id/cancel — cancel bed booking
│   │
│   ├── 🟦 ai.routes.js           → POST /api/ai/chat — AI chatbot with provider fallback chain:
│   │                               OpenAI GPT-4o-mini → Google Gemini → Python Flask AI → Built-in
│   │                               fallback. Health keyword validation, emergency severity detection,
│   │                               first-aid tips. Supports previous context for conversation memory.
│   │                               GET /api/ai/health-tips — returns random first aid tips
│   │                               POST /api/ai/emergency-check — classifies emergency severity
│   │
│   └── 🟦 blockchain.routes.js   → GET /api/blockchain/status — connection status
│                                   GET /api/blockchain/transactions — transaction history
│                                   GET /api/blockchain/transactions/:hash — lookup by hash
│                                   POST /api/blockchain/verify — verify chain integrity
│
├── socket/
│   └── 🟦 socketHandler.js       → WebSocket event handling via Socket.IO:
│                                   • On connect: authenticate JWT, join role-based rooms
│                                   • Events: bed-update, blood-update, emergency-alert,
│                                     booking-update, blood-request-update, notification
│                                   • Broadcasts updates to relevant rooms (admin/staff/user)
│
└── utils/                         → Seed scripts and utilities
    ├── 🟦 seedAdmin.js            → Creates default admin if none exists
    │                                (admin@hospital.com / admin123)
    │
    ├── 🟦 seedData.js             → Seeds hospitals (5 in Kurnool), beds (10 types per hospital),
    │                                blood units (all 8 groups), and sample blood requests.
    │                                Only runs if collections are empty.
    │
    ├── 🟦 seedDemoUsers.js        → Creates demo staff and user accounts for testing
    │
    └── 🟦 reseedAll.js            → FULL RESET — drops all collections and re-seeds everything
                                     from scratch. Run with: node server/utils/reseedAll.js
```

---

### 🟩 FRONTEND — `client/`

The React 18 single-page application. Uses Tailwind CSS for styling, React Router for navigation, and Socket.IO for real-time updates.

```
client/
│
├── ⚙️ package.json               → Frontend dependencies (react, router, axios, recharts, socket.io,
│                                   tailwind, react-icons, react-hot-toast, date-fns)
│                                   Proxy set to http://localhost:5000 for API calls
│
├── ⚙️ postcss.config.js          → PostCSS plugins: Tailwind CSS + Autoprefixer
│
├── ⚙️ tailwind.config.js         → Tailwind theme config: custom color palette (primary blue,
│                                   secondary green, danger red), responsive container
│
├── public/
│   └── 🟩 index.html              → HTML shell — loads Inter font, includes Thesys HealthWise AI
│                                    widget script (<script src="https://embed.thesys.dev/...">)
│
├── src/
│   ├── 🟩 index.js                → React entry point — wraps App with BrowserRouter, AuthProvider,
│   │                                SocketProvider, Toaster (notifications)
│   │
│   ├── 🟩 App.js                  → Route definitions using React Router v6:
│   │                                /              → PublicLayout > Home
│   │                                /login         → Login
│   │                                /register      → Register
│   │                                /admin/*       → AdminLayout > Admin pages (9 routes)
│   │                                /staff/*       → StaffLayout > Staff pages (5 routes)
│   │                                /user/*        → UserLayout > User pages (7 routes)
│   │
│   ├── 🟩 index.css               → Tailwind directives (@tailwind base/components/utilities)
│   │                                + custom scrollbar styles + animation keyframes
│   │
│   ├── services/
│   │   └── 🟩 api.js              → Axios HTTP client with:
│   │                                • Base URL detection (same origin in production)
│   │                                • JWT token auto-attach via interceptor
│   │                                • 401 response → clear token, redirect to login
│   │                                • Exports grouped API methods:
│   │                                  authAPI    — login, register, getProfile, updateProfile
│   │                                  bloodAPI   — getInventory, addUnit, createRequest, fulfill
│   │                                  bedAPI     — getBeds, bookBed, getBookings, approve, checkout
│   │                                  hospitalAPI — getHospitals, getHospitalDetails, getNearby
│   │                                  adminAPI   — getDashboard, getUsers, manageStaff, CRUD all
│   │                                  userAPI    — getDashboard, getBloodRequests, getBedBookings
│   │                                  aiAPI      — chat, getHealthTips, checkEmergency
│   │
│   ├── context/                   → React Context providers (global state)
│   │   ├── 🟩 AuthContext.js      → Authentication state:
│   │   │                            • Stores: user object, isAuthenticated, loading
│   │   │                            • Provides: login(), register(), logout(), updateUser()
│   │   │                            • On mount: checks localStorage token, fetches user profile
│   │   │
│   │   └── 🟩 SocketContext.js    → WebSocket state:
│   │                                • Connects Socket.IO when user is authenticated
│   │                                • Listens: emergency-alert, bed-update, blood-update,
│   │                                  booking-update, notification
│   │                                • Shows toast notifications on real-time events
│   │                                • Provides: socket instance, connected status
│   │
│   ├── components/                → Reusable components
│   │   ├── 🟩 FloatingAIAssistant.js → Floating chat bubble (bottom-right corner):
│   │   │                              • Toggle open/close chat window
│   │   │                              • Text + voice input (Web Speech API)
│   │   │                              • Quick action buttons (Emergency, Fever, CPR, Bleeding)
│   │   │                              • Emergency detection with red alert styling
│   │   │                              • Markdown response rendering
│   │   │                              • Available on ALL pages via layouts
│   │   │
│   │   └── 🟩 NotificationDropdown.js → Bell icon in header:
│   │                                    • Shows unread notification count badge
│   │                                    • Dropdown list of notifications (alerts, approvals, updates)
│   │                                    • Mark as read, mark all read
│   │                                    • Real-time updates via Socket.IO
│   │
│   ├── layouts/                   → Page wrapper components (sidebar + header + content area)
│   │   ├── 🟩 AdminLayout.js     → Admin shell — dark sidebar with 9 menu items:
│   │   │                           Dashboard, Users, Staff, Hospitals, Alerts,
│   │   │                           Bed Bookings, Beds, Blood, Blockchain Verification
│   │   │                           + Notification bell + AI assistant + Logout
│   │   │
│   │   ├── 🟩 StaffLayout.js     → Staff shell — sidebar with 5 items:
│   │   │                           Dashboard, Blood Inventory, Blood Requests,
│   │   │                           Bed Management, Profile
│   │   │
│   │   ├── 🟩 UserLayout.js      → User shell — red-themed sidebar with 6 items:
│   │   │                           Dashboard, Find Beds, Blood Availability,
│   │   │                           My Requests, AI Chatbot, Profile
│   │   │
│   │   └── 🟩 PublicLayout.js    → Public pages — responsive top navbar with scroll
│   │                               detection, Login/Register buttons, footer
│   │
│   └── pages/                     → All page components, grouped by user role
│
│       ├── auth/                  → Authentication pages
│       │   ├── 🟩 index.js        → Barrel export (Login, Register)
│       │   ├── 🟩 Login.js        → Login form — email, password, show/hide toggle,
│       │   │                        role-based redirect after login, error toasts
│       │   └── 🟩 Register.js     → Two-step registration — Step 1: name/email/password/role,
│       │                            Step 2: phone/blood group/address. Users auto-approved,
│       │                            staff requires admin approval
│       │
│       ├── public/                → Pages visible without login
│       │   ├── 🟩 index.js        → Barrel export (Home)
│       │   └── 🟩 Home.js         → Landing page — hero banner, 6 feature cards (Real-time
│       │                            Beds, Blood Bank, Emergency Alerts, AI Health Assistant,
│       │                            Blockchain Audit, Smart Analytics), animated statistics
│       │                            counter, testimonials, call-to-action, footer
│       │
│       ├── admin/                 → Admin-only pages (require admin role)
│       │   ├── 🟩 index.js              → Barrel export for all admin components
│       │   ├── 🟩 AdminDashboard.js      → Analytics overview — stat cards (users, hospitals,
│       │   │                               beds, blood), Pie chart (blood distribution),
│       │   │                               Bar chart (hospital distribution), pending approvals,
│       │   │                               recent requests, Socket.IO live updates
│       │   ├── 🟩 Users.js               → User management — list/search/delete users,
│       │   │                               view user detail modal, pagination
│       │   ├── 🟩 Staff.js               → Staff management — pending approvals list,
│       │   │                               approve/reject staff, active staff list
│       │   ├── 🟩 Hospitals.js           → Hospital CRUD — add/edit/delete hospitals,
│       │   │                               view details modal, filter by name
│       │   ├── 🟩 Alerts.js              → Emergency alerts — filter by status/type,
│       │   │                               acknowledge/resolve alerts, alert cards with
│       │   │                               severity color coding
│       │   ├── 🟩 BedBookingManagement.js → Bed booking requests — approve/reject bookings,
│       │   │                               filter by status, patient info display
│       │   ├── 🟩 BedManagement.js       → Bed inventory — add beds (ward, floor, type,
│       │   │                               price, facilities), filter by hospital/type/status,
│       │   │                               modal form for creation
│       │   ├── 🟩 BloodManagement.js     → Blood units — select hospital, view by group/status,
│       │   │                               add units (donor, dates, component type),
│       │   │                               low stock warnings
│       │   └── 🟩 BlockchainVerification.js → Blockchain explorer — transaction list, verify
│       │                                     hash, block number/status, search by hash
│       │
│       ├── staff/                 → Staff-only pages (require staff role)
│       │   ├── 🟩 index.js              → Barrel export for all staff components
│       │   ├── 🟩 StaffDashboard.js      → Staff overview — blood unit count, available beds,
│       │   │                               pending requests, blood distribution chart,
│       │   │                               low stock alerts, Socket.IO live updates
│       │   ├── 🟩 BloodInventory.js      → Blood management — select hospital, view/add units,
│       │   │                               filter, Pie chart, expiry tracking
│       │   ├── 🟩 BloodRequests.js       → Blood request handling — filter by status/group,
│       │   │                               approve/reject, assign blood units to fulfill
│       │   └── 🟩 StaffBedManagement.js  → Bed management for assigned hospital — add beds,
│       │                                   update status, checkin/checkout, grid/list views
│       │
│       └── user/                  → Regular user pages (require user role)
│           ├── 🟩 index.js               → Barrel export for all user components
│           ├── 🟩 UserDashboard.js        → User home — available beds summary, blood by group,
│           │                               nearby hospitals, recent requests, quick action cards
│           ├── 🟩 FindBeds.js             → Search & book beds — group by hospital, filter by
│           │                               type, booking modal (patient info, dates, requirements)
│           ├── 🟩 BloodAvailability.js    → Blood search — Bar chart by group, request modal
│           │                               (urgency, units, reason, hospital selection)
│           ├── 🟩 MyRequests.js           → Request history — tabs for blood requests & bed
│           │                               bookings, status timeline, cancel option
│           ├── 🟩 AIChatbot.js            → AI assistant page — two tabs:
│           │                               Tab 1: HealthWise (Thesys iframe widget)
│           │                               Tab 2: Quick Assistant (API-based chat with
│           │                               voice support and emergency detection)
│           └── 🟩 Profile.js              → Profile editor — name, email, phone, blood group,
│                                           address, password change, emergency contact
│
└── build/                         → Production build output (generated by `npm run build`)
    ├── ⚠️ index.html              → Compiled HTML
    ├── ⚠️ asset-manifest.json     → Build manifest
    └── ⚠️ static/                 → Compiled CSS/JS bundles (minified)
```

---

### 🟪 BLOCKCHAIN — `blockchain/`

Ethereum smart contracts using Hardhat. Records blood unit and bed status changes on an immutable ledger.

```
blockchain/
│
├── ⚙️ package.json               → Hardhat + toolbox dependencies
│
├── ⚙️ hardhat.config.js          → Solidity 0.8.19 compiler config, localhost network (8545),
│                                   optimizer enabled (200 runs)
│
├── contracts/
│   └── 🟪 HospitalManagement.sol → Smart contract:
│                                   • addBloodUnit(group, quantity, hospitalId) — immutable record
│                                   • updateBedStatus(bedId, isAvailable) — bed state on-chain
│                                   • Events: BloodUnitAdded, BedStatusUpdated
│                                   • Owner-gated deployment
│
├── scripts/
│   └── 🟪 deploy.js              → Deploys contract to Hardhat node, writes contract address
│                                   back to root .env file
│
├── artifacts/                     → Auto-generated by Hardhat compiler
│   ├── build-info/
│   │   └── ⚠️ 2e3e3d41746da3bfaad67dfa0f53f67a.json → Build metadata
│   └── contracts/HospitalManagement.sol/
│       ├── 🟪 HospitalManagement.json     → Compiled ABI (used by backend blockchain.js)
│       └── ⚠️ HospitalManagement.dbg.json → Debug info
│
├── cache/
│   └── ⚠️ solidity-files-cache.json → Hardhat compiler cache
│
└── 📁 node_modules/              → Hardhat dependencies
```

---

### 🟧 AI SERVICE — `ai-service/`

Optional Python Flask microservice for AI chat (fallback when OpenAI/Gemini keys aren't configured).

```
ai-service/
│
├── 🟧 app.py                     → Flask API on port 5001:
│                                   • POST /api/v1/chat — AI health chat (Gemini/OpenAI/fallback)
│                                   • POST /api/v1/emergency-check — classify emergency severity
│                                   • GET /api/v1/health-tips — random first-aid tips
│                                   • Health keyword validation, CORS for localhost:3000
│
├── 🟧 requirements.txt           → Python deps: Flask 2.3.3, flask-cors, python-dotenv, google-genai
│
└── ⚠️ __pycache__/               → Python bytecode cache (auto-generated)
    └── app.cpython-310.pyc
```

---

## ⚠️ FILES POTENTIALLY NOT NEEDED

These files are **not required** for the project to function. Review before removing:

| # | File/Folder | Why it may be unnecessary | Safe to delete? |
|---|-------------|--------------------------|-----------------|
| 1 | **`test_output.txt`** (root) | Debug leftover from Thesys API testing. Contains raw HTML-entity-encoded JSON response. Not used by any code. | ✅ Yes — safe |
| 2 | **`client/build/`** (entire folder) | Old production build output. Gets regenerated every time you run `npm run build`. Already in `.gitignore`. | ✅ Yes — safe (regenerated on build) |
| 3 | **`ai-service/__pycache__/`** | Python bytecode cache. Auto-regenerated when app.py runs. Already in `.gitignore`. | ✅ Yes — safe (auto-regenerated) |
| 4 | **`blockchain/cache/`** | Hardhat compiler cache (`solidity-files-cache.json`). Regenerated on `npx hardhat compile`. | ✅ Yes — safe (auto-regenerated) |
| 5 | **`blockchain/artifacts/build-info/`** | Hardhat build metadata. Regenerated on compile. The `contracts/` subfolder IS needed (contains ABI). | ✅ Yes — safe (auto-regenerated) |
| 6 | **`blockchain/artifacts/contracts/.../HospitalManagement.dbg.json`** | Debug symbols for smart contract. Only the `HospitalManagement.json` (ABI) is needed by the backend. | ✅ Yes — safe |
| 7 | **`PRD.md`** | Product Requirements Document — useful for documentation but not used by any running code. Keep if you want project documentation. | 🟡 Optional — docs only |
| 8 | **`PROJECT_PROMPT.md`** | Technical specification — same as above, not used by code, useful as reference. | 🟡 Optional — docs only |
| 9 | **`view-db.js`** (root) | Developer utility to inspect database. Not part of the app, but handy for debugging. | 🟡 Optional — dev tool |

---

## DATA FLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                     👤 USER (Browser)                        │
│                    http://localhost:3000                      │
└──────────────┬──────────────────────────────┬────────────────┘
               │ HTTP (REST API)              │ WebSocket
               ▼                              ▼
┌──────────────────────────────┐  ┌────────────────────────────┐
│   🟦 Express Backend          │  │   🟦 Socket.IO Server       │
│   http://localhost:5000       │  │   (same port 5000)          │
│                               │  │                             │
│  Routes:                      │  │  Events:                    │
│   /api/auth/*                 │  │   bed-update                │
│   /api/admin/*                │  │   blood-update              │
│   /api/blood/*                │  │   emergency-alert           │
│   /api/beds/*                 │  │   booking-update            │
│   /api/hospitals/*            │  │   notification              │
│   /api/users/*                │  └────────────────────────────┘
│   /api/ai/*                   │
│   /api/blockchain/*           │
└──────┬─────────────┬─────────┘
       │             │
       ▼             ▼
┌────────────┐  ┌──────────────┐  ┌────────────────────────────┐
│  MongoDB   │  │  🟪 Hardhat   │  │  🟧 Python AI Service      │
│  Database  │  │  Blockchain   │  │  http://localhost:5001      │
│            │  │  :8545        │  │  (fallback AI provider)     │
└────────────┘  └──────────────┘  └────────────────────────────┘
```

---

## DATABASE COLLECTIONS (MongoDB)

| Collection | Model | Purpose |
|-----------|-------|---------|
| `users` | User.js | All user accounts (admin, staff, patients) |
| `hospitals` | Hospital.js | Registered hospitals |
| `beds` | Bed.js | Individual bed records per hospital |
| `bedbookings` | BedBooking.js | Patient bed reservations |
| `bloodunits` | BloodUnit.js | Blood inventory per hospital |
| `bloodrequests` | BloodRequest.js | User blood requests |
| `emergencyalerts` | EmergencyAlert.js | System emergency alerts |
| `blockchaintransactions` | BlockchainTransaction.js | On-chain activity log |

---

## USER ROLE ACCESS MAP

| Page / Feature | Admin | Staff | User | Public |
|---------------|:-----:|:-----:|:----:|:------:|
| Landing Page (Home) | — | — | — | ✅ |
| Login / Register | — | — | — | ✅ |
| Admin Dashboard | ✅ | — | — | — |
| Manage Users | ✅ | — | — | — |
| Manage Staff | ✅ | — | — | — |
| Manage Hospitals | ✅ | — | — | — |
| Emergency Alerts | ✅ | — | — | — |
| Bed Booking Management | ✅ | — | — | — |
| Bed Management | ✅ | ✅ | — | — |
| Blood Management | ✅ | ✅ | — | — |
| Blockchain Verification | ✅ | — | — | — |
| Staff Dashboard | — | ✅ | — | — |
| Blood Inventory | — | ✅ | — | — |
| Blood Requests (handle) | — | ✅ | — | — |
| User Dashboard | — | — | ✅ | — |
| Find Beds | — | — | ✅ | — |
| Blood Availability | — | — | ✅ | — |
| My Requests | — | — | ✅ | — |
| AI Chatbot | — | — | ✅ | — |
| Profile | — | ✅ | ✅ | — |
| Floating AI Assistant | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | — |

---

## TOTAL FILE COUNT SUMMARY

| Category | Count | Description |
|----------|-------|-------------|
| 🟦 Backend | **24 files** | Server entry, configs, models, routes, socket, utils |
| 🟩 Frontend | **33 files** | React app, components, contexts, layouts, pages, services |
| 🟪 Blockchain | **4 files** | Contract, deploy script, config, compiled ABI |
| 🟧 AI Service | **2 files** | Flask app + requirements |
| ⚙️ Config | **10 files** | package.json (×3), .env, .env.example, .gitignore, nodemon, postcss, tailwind, hardhat |
| 📄 Documentation | **3 files** | README, PRD, PROJECT_PROMPT |
| ⚠️ Removable | **~9 items** | test_output.txt, build/, __pycache__, cache/, dbg.json, build-info/ |
| **TOTAL** | **~76 files** | (excluding node_modules) |
