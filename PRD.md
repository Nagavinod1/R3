# Product Requirements Document (PRD)

## Blockchain-Enabled Intelligent Hospital Bed and Blood Resource Management System

| Field | Detail |
|-------|--------|
| **Document Version** | 1.0 |
| **Date** | February 15, 2026 |
| **Product Name** | Hospital Bed & Blood Resource Management System |
| **Product Type** | Full-Stack Web Application |
| **Target Region** | Kurnool, Andhra Pradesh, India |
| **Status** | Development |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Goals](#3-product-vision--goals)
4. [Target Users & Personas](#4-target-users--personas)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [System Architecture](#7-system-architecture)
8. [Data Models](#8-data-models)
9. [API Specifications](#9-api-specifications)
10. [User Interface Requirements](#10-user-interface-requirements)
11. [Blockchain Integration](#11-blockchain-integration)
12. [AI/ML Features](#12-aiml-features)
13. [Real-Time Features](#13-real-time-features)
14. [Security Requirements](#14-security-requirements)
15. [Deployment & Infrastructure](#15-deployment--infrastructure)
16. [Success Metrics](#16-success-metrics)
17. [Risks & Mitigations](#17-risks--mitigations)
18. [Future Enhancements](#18-future-enhancements)
19. [Appendix](#19-appendix)

---

## 1. Executive Summary

This system is a **blockchain-enabled, AI-powered hospital management platform** designed to solve critical resource management challenges in the healthcare sector. It enables real-time tracking of hospital bed availability, blood bank inventory, and emergency situations across multiple hospitals in the Kurnool district of Andhra Pradesh, India.

The platform integrates:
- **MERN stack** (MongoDB, Express, React, Node.js) for core application functionality
- **Ethereum blockchain** (Hardhat/Solidity) for immutable audit trails on blood and bed operations
- **AI-powered health assistant** (Google Gemini via OpenRouter + Python Flask NLP) for first aid guidance and emergency severity detection
- **Real-time communication** (Socket.IO) for instant notifications and live resource updates

---

## 2. Problem Statement

### Current Challenges
1. **Lack of real-time bed availability information** — Patients and families waste critical time calling multiple hospitals to find available beds during emergencies.
2. **Blood bank inventory opacity** — Blood availability data is siloed per hospital with no centralized view, leading to delays in emergency blood procurement.
3. **No audit trail for critical operations** — Blood unit management and bed status changes lack tamper-proof records, risking accountability gaps.
4. **Delayed emergency response** — No automated system to detect emergency severity or provide immediate first aid guidance while waiting for medical help.
5. **Manual approval workflows** — Hospital and staff registrations rely on phone calls and paper forms with no digital workflow.
6. **No centralized alert system** — Blood shortages, bed shortages, and equipment failures are communicated ad-hoc without a structured alert mechanism.

### Impact
- Delayed patient admissions and treatment
- Preventable deaths due to blood unavailability
- Lack of accountability in resource management
- Inefficient healthcare resource utilization

---

## 3. Product Vision & Goals

### Vision
*To create a transparent, real-time, and intelligent hospital resource management ecosystem that saves lives through faster access to beds, blood, and emergency health guidance.*

### Goals

| # | Goal | Metric |
|---|------|--------|
| G1 | **Real-time resource visibility** | 100% of participating hospital beds and blood units tracked in real-time |
| G2 | **Blockchain-backed accountability** | All blood unit additions and bed status changes recorded on-chain |
| G3 | **Faster emergency response** | Reduce patient-to-bed matching time by 60% |
| G4 | **Centralized blood management** | Single view of blood availability across all hospitals by blood group |
| G5 | **AI-powered health guidance** | First aid and emergency severity detection available 24/7 |
| G6 | **Digital approval workflows** | Staff and hospital registrations processed within 24 hours |
| G7 | **Proactive alerts** | Auto-generated alerts for low blood stock and bed shortages |

---

## 4. Target Users & Personas

### Persona 1: System Administrator
- **Role:** `admin`
- **Description:** Hospital system administrator responsible for overall platform management
- **Key Needs:** Dashboard overview, approval workflows, analytics, blockchain verification
- **Access:** Full system access across all hospitals
- **Auto-created:** First admin seeded on system startup (`admin@hospital.com`)

### Persona 2: Blood Department Staff
- **Role:** `staff`
- **Description:** Hospital staff managing blood bank inventory and bed resources
- **Key Needs:** Blood unit CRUD, request processing, bed management, low stock alerts
- **Access:** Limited to assigned hospital's data only
- **Onboarding:** Requires admin approval after registration

### Persona 3: General User (Patient/Public)
- **Role:** `user`
- **Description:** Patient, family member, or general public seeking hospital resources
- **Key Needs:** Find available beds, check blood availability, request blood, get first aid guidance
- **Access:** Public resource viewing + personal request management
- **Onboarding:** Auto-approved on registration

---

## 5. Functional Requirements

### 5.1 Authentication & Authorization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | Users can register with name, email, password, phone, and optional role (user/staff) | P0 |
| FR-AUTH-02 | Users can log in with email/password and receive a JWT token (7-day expiry) | P0 |
| FR-AUTH-03 | Staff accounts require admin approval before access to protected features | P0 |
| FR-AUTH-04 | User accounts are auto-approved upon registration | P0 |
| FR-AUTH-05 | JWT token is validated on every protected API request via `Authorization: Bearer` header | P0 |
| FR-AUTH-06 | Role-based route access (admin, staff, user) with middleware enforcement | P0 |
| FR-AUTH-07 | Users can update their profile (name, phone, bloodGroup, address, emergencyContact) | P1 |
| FR-AUTH-08 | Users can change their password (requires current password verification) | P1 |
| FR-AUTH-09 | Admin can activate/deactivate user accounts | P1 |
| FR-AUTH-10 | Inactive accounts cannot log in | P0 |

### 5.2 Admin Module

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADM-01 | Dashboard displays: total users, total staff, total hospitals, active emergency alerts | P0 |
| FR-ADM-02 | Dashboard shows pending blood requests and bed booking counts | P0 |
| FR-ADM-03 | Dashboard includes visual charts (blood inventory by group, hospital distribution by district) using Recharts | P1 |
| FR-ADM-04 | Admin can view paginated user list with search (name/email) and filter (role, approval status) | P0 |
| FR-ADM-05 | Admin can approve/reject staff accounts with real-time notification to the user | P0 |
| FR-ADM-06 | Admin can activate/deactivate/delete user accounts | P0 |
| FR-ADM-07 | Admin can create staff accounts and assign them to hospitals | P1 |
| FR-ADM-08 | Admin can view and manage all registered hospitals (approved + pending) | P0 |
| FR-ADM-09 | Admin can approve/reject hospital registrations | P0 |
| FR-ADM-10 | Admin can view, acknowledge, and resolve emergency alerts | P0 |
| FR-ADM-11 | Admin can access blockchain verification panel (transaction list, verify by hash) | P1 |
| FR-ADM-12 | Admin can view all blood requests and bed bookings across the system | P1 |

### 5.3 Staff Module (Blood Department)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-STF-01 | Staff dashboard shows hospital-specific statistics (bed count, blood inventory, pending requests) | P0 |
| FR-STF-02 | Staff can add blood units with: bloodGroup, quantity, expiryDate, componentType, donorInfo, testResults | P0 |
| FR-STF-03 | Every blood unit addition is recorded on the Ethereum blockchain | P0 |
| FR-STF-04 | Staff can update blood unit status (available → reserved → used/expired/discarded) | P0 |
| FR-STF-05 | System auto-generates low stock alerts when blood group quantity falls below threshold (default: 5 units) | P1 |
| FR-STF-06 | Staff can view and process incoming blood requests (accept/reject with reason) | P0 |
| FR-STF-07 | Staff can add beds to their hospital with: bedNumber, ward, floor, type, equipment flags, price | P0 |
| FR-STF-08 | Staff can update bed status (available/occupied/reserved/maintenance/cleaning) | P0 |
| FR-STF-09 | Bed status changes are recorded on blockchain | P0 |
| FR-STF-10 | Staff can only see and manage data for their assigned hospital | P0 |

### 5.4 User Module

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-USR-01 | Users can view available beds across all approved hospitals, filtered by district, city, and bed type | P0 |
| FR-USR-02 | Available beds are grouped by hospital with hospital details (name, address, phone, rating) | P0 |
| FR-USR-03 | Users can view blood availability summary by blood group across all hospitals | P0 |
| FR-USR-04 | Users can reserve/book a bed with patient details (name, age, gender, phone, condition, diagnosis) | P0 |
| FR-USR-05 | Users can create blood requests with: bloodGroup, unitsRequired, requestType (emergency/normal/scheduled), patientInfo, reason | P0 |
| FR-USR-06 | Emergency blood requests auto-set priority to 1 (highest); scheduled = 4, normal = 3 | P1 |
| FR-USR-07 | Users can track all their blood requests and bed bookings in "My Requests" page | P0 |
| FR-USR-08 | Users receive real-time notifications when their request/booking status changes | P0 |
| FR-USR-09 | Users can interact with AI Health Chatbot for first aid guidance, symptom assessment, and emergency recommendations | P0 |
| FR-USR-10 | Users can update their profile with medical history and emergency contacts | P1 |

### 5.5 Hospital Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-HSP-01 | Hospitals can be registered with: name, registrationNumber, email, phone, address (with coordinates), type, specializations, facilities | P0 |
| FR-HSP-02 | Hospital registrations by non-admin users require admin approval | P0 |
| FR-HSP-03 | Admin-created hospitals are auto-approved and active | P0 |
| FR-HSP-04 | Hospital detail page shows bed statistics, available beds by type, and blood inventory | P0 |
| FR-HSP-05 | Public can search hospitals by city, district, state, name, blood bank availability, emergency availability | P0 |
| FR-HSP-06 | System supports nearby hospital search via geographic coordinates | P2 |
| FR-HSP-07 | Hospital bed counts auto-update when beds are added/removed/status-changed | P0 |

### 5.6 Emergency Alert System

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-EMR-01 | Staff/admin can create emergency alerts with: type, severity, title, description, affected resources | P0 |
| FR-EMR-02 | Alert types: blood_shortage, bed_shortage, equipment_failure, mass_casualty, critical_patient, outbreak | P0 |
| FR-EMR-03 | Alert severities: low, medium, high, critical | P0 |
| FR-EMR-04 | Alerts are broadcast to all connected users via Socket.IO in real-time | P0 |
| FR-EMR-05 | Admin can acknowledge and resolve alerts with timestamp tracking | P0 |
| FR-EMR-06 | System auto-generates alerts for low blood stock (below threshold) | P1 |

### 5.7 Blockchain Features

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-BLC-01 | Blood unit additions are recorded on Ethereum smart contract with: bloodUnitId, bloodGroup, quantity, hospitalId | P0 |
| FR-BLC-02 | Bed status changes are recorded on Ethereum smart contract with: bedId, hospitalId, isAvailable | P0 |
| FR-BLC-03 | Each entity maintains an on-chain transaction history with timestamps and data hashes | P0 |
| FR-BLC-04 | Admin can verify any transaction by hash against the blockchain | P1 |
| FR-BLC-05 | Transaction chain integrity can be verified (linked hashes) | P1 |
| FR-BLC-06 | Blockchain operations are non-blocking — core operations succeed even if blockchain is offline | P0 |
| FR-BLC-07 | Smart contract emits events for all state changes (BloodUnitRecorded, BedStatusUpdated, TransactionLogged) | P1 |

### 5.8 AI Health Assistant

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AI-01 | Chat interface accepts natural language health queries | P0 |
| FR-AI-02 | AI responses are generated via Google Gemini API with multi-model fallback | P0 |
| FR-AI-03 | Non-health queries are rejected with a friendly redirect message | P1 |
| FR-AI-04 | Emergency severity detection classifies symptoms into 5 levels: critical, severe, moderate, mild, low | P0 |
| FR-AI-05 | First aid guidance available for 18+ topics (burns, choking, bleeding, fractures, heart attack, stroke, etc.) | P0 |
| FR-AI-06 | Blood group compatibility information (donate to / receive from) available per group | P1 |
| FR-AI-07 | Triple fallback: Gemini API → Python NLP service → built-in keyword responses | P0 |
| FR-AI-08 | Floating AI assistant widget accessible from any page in the application | P1 |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-01 | API response time (non-AI) | < 500ms (95th percentile) |
| NFR-PERF-02 | AI chat response time | < 10 seconds |
| NFR-PERF-03 | WebSocket event delivery | < 200ms |
| NFR-PERF-04 | Dashboard page load | < 3 seconds |
| NFR-PERF-05 | Concurrent user support | 100+ simultaneous connections |

### 6.2 Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-REL-01 | System uptime | 99.5% |
| NFR-REL-02 | Database fallback | Auto-switch to in-memory MongoDB if primary DB fails |
| NFR-REL-03 | AI service fallback | 3-level fallback chain for uninterrupted service |
| NFR-REL-04 | Blockchain graceful degradation | Core features work without blockchain |

### 6.3 Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | Passwords hashed with bcrypt (salt rounds: 10) |
| NFR-SEC-02 | JWT tokens for stateless authentication |
| NFR-SEC-03 | Role-based access control on all protected endpoints |
| NFR-SEC-04 | Input validation on all mutation endpoints (express-validator) |
| NFR-SEC-05 | CORS configured for specific origins only |
| NFR-SEC-06 | Socket.IO authenticated with JWT |
| NFR-SEC-07 | Blood unit test results (HIV, HepB, HepC, Syphilis, Malaria) tracked for safety |

### 6.4 Scalability

| ID | Requirement |
|----|-------------|
| NFR-SCL-01 | MongoDB indexes on frequently queried fields |
| NFR-SCL-02 | Paginated API responses for list endpoints |
| NFR-SCL-03 | Socket.IO room-based messaging (not broadcast-all) |
| NFR-SCL-04 | Modular route/controller architecture for easy extension |

### 6.5 Usability

| ID | Requirement |
|----|-------------|
| NFR-USE-01 | Responsive design via Tailwind CSS (desktop + mobile) |
| NFR-USE-02 | Role-specific layouts with intuitive navigation |
| NFR-USE-03 | Toast notifications for user actions (react-hot-toast) |
| NFR-USE-04 | Loading states for async operations |
| NFR-USE-05 | Form validation with user-friendly error messages |

---

## 7. System Architecture

### 7.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                  │
│  React 18 + Tailwind CSS + Recharts                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │
│  │  Public     │  │  Admin     │  │  Staff     │  │  User        │   │
│  │  Pages      │  │  Module    │  │  Module    │  │  Module      │   │
│  └────────────┘  └────────────┘  └────────────┘  └──────────────┘   │
│  AuthContext | SocketContext | API Service Layer                      │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ HTTP (REST) + WebSocket (Socket.IO)
┌───────────────────────────▼──────────────────────────────────────────┐
│                         SERVER LAYER                                  │
│  Node.js + Express.js + Socket.IO                                    │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐                  │
│  │ Routes    │  │ Middleware   │  │ Socket        │                  │
│  │ (8 route  │  │ (auth, role, │  │ Handler       │                  │
│  │  files)   │  │  validate)   │  │ (real-time)   │                  │
│  └──────────┘  └──────────────┘  └───────────────┘                  │
└────────┬──────────────────┬────────────────────┬─────────────────────┘
         │                  │                    │
    ┌────▼────┐      ┌──────▼──────┐      ┌─────▼──────┐
    │ MongoDB │      │ Blockchain  │      │ AI Service │
    │         │      │ (Hardhat    │      │ (Flask +   │
    │ 8 models│      │  + Solidity)│      │  Gemini)   │
    └─────────┘      └─────────────┘      └────────────┘
```

### 7.2 Technology Stack Details

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Frontend Framework | React | 18.2.x | SPA with component architecture |
| CSS Framework | Tailwind CSS | 3.4.x | Utility-first responsive styling |
| Charts | Recharts | 2.10.x | Data visualization |
| Icons | React Icons | 5.0.x | UI iconography |
| Notifications | React Hot Toast | 2.4.x | Toast notifications |
| Routing | React Router DOM | 6.21.x | Client-side routing |
| HTTP Client | Axios | 1.6.x | API communication |
| Real-time Client | Socket.IO Client | 4.6.x | WebSocket communication |
| Backend Runtime | Node.js | 18+ | Server runtime |
| Backend Framework | Express.js | 4.18.x | REST API framework |
| Real-time Server | Socket.IO | 4.6.x | WebSocket server |
| Database | MongoDB | 8.x | Document database |
| ODM | Mongoose | 8.0.x | MongoDB object modeling |
| Authentication | jsonwebtoken | 9.0.x | JWT token generation/verification |
| Password Hashing | bcryptjs | 2.4.x | Secure password hashing |
| Validation | express-validator | 7.0.x | Input validation |
| Blockchain Framework | Hardhat | Latest | Ethereum development |
| Smart Contract Language | Solidity | 0.8.19 | Smart contract programming |
| Blockchain Client | Web3.js | 4.3.x | Ethereum interaction |
| AI Runtime | Python | 3.8+ | AI service runtime |
| AI Framework | Flask | 2.3.x | REST API for AI |
| AI Model | Google Gemini | Multiple | Natural language processing |
| AI Gateway | OpenRouter | API | Model access via API |

---

## 8. Data Models

### 8.1 Entity Relationship Diagram (Conceptual)

```
┌──────────────┐        ┌──────────────────┐        ┌────────────────┐
│   User       │───1:N──│  BloodRequest    │───N:1──│   Hospital     │
│              │        └──────────────────┘        │                │
│ (admin,      │                                    │ (name, address,│
│  staff, user)│───1:N──┌──────────────────┐───N:1──│  beds, blood)  │
│              │        │  BedBooking      │        │                │
└──────┬───────┘        └──────────────────┘        └────────┬───────┘
       │                        │                            │
       │                   ┌────▼────┐                  ┌────▼────┐
       │                   │   Bed   │                  │BloodUnit│
       │                   └─────────┘                  └─────────┘
       │                        │                            │
       │                   ┌────▼────────────────────────────▼────┐
       └───────────────────│     BlockchainTransaction            │
                           └──────────────────────────────────────┘
                                        │
                           ┌────────────▼──────────────┐
                           │    EmergencyAlert          │
                           └───────────────────────────┘
```

### 8.2 Model Field Summary

| Model | Key Fields | Relationships |
|-------|-----------|---------------|
| **User** | name, email, password, phone, role, bloodGroup, isApproved, isActive | → Hospital (staff assignment) |
| **Hospital** | name, registrationNumber, address, type, totalBeds, availableBeds, hasBloodBank | → User (admin), ← Bed, ← BloodUnit |
| **Bed** | bedNumber, ward, floor, type, status, isAvailable, equipment flags | → Hospital, → User (patient) |
| **BedBooking** | bookingType, status, patientDetails, dates, charges, paymentStatus | → Bed, → Hospital, → User |
| **BloodUnit** | bloodGroup, quantity, status, donorInfo, expiryDate, componentType, testResults | → Hospital, → User (addedBy) |
| **BloodRequest** | requestType, bloodGroup, unitsRequired, status, priority, patientInfo | → User (requestedBy), → Hospital |
| **BlockchainTransaction** | transactionType, transactionHash, blockNumber, dataHash | → Hospital, → User, refPath entity |
| **EmergencyAlert** | type, severity, title, status, affectedResources | → Hospital, → User (created/resolved by) |

---

## 9. API Specifications

### 9.1 API Overview

| Route Group | Base Path | # Endpoints | Auth Required |
|-------------|-----------|-------------|---------------|
| Authentication | `/api/auth` | 7 | Mixed |
| Admin | `/api/admin` | 14+ | Admin only |
| Blood | `/api/blood` | 8 | Mixed |
| Beds | `/api/beds` | 10 | Mixed |
| Hospitals | `/api/hospitals` | 7 | Mixed |
| Users | `/api/users` | 3 | Private |
| AI | `/api/ai` | 5 | Optional |
| Blockchain | `/api/blockchain` | 6 | Mixed |

### 9.2 Response Format

All API responses follow this standard format:

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### 9.3 Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

---

## 10. User Interface Requirements

### 10.1 Layout Structure

| Layout | Used By | Navigation Elements |
|--------|---------|-------------------|
| **PublicLayout** | Home, unauthenticated users | Top navbar with Login/Register |
| **AdminLayout** | Admin users | Left sidebar: Dashboard, Users, Staff, Hospitals, Alerts |
| **StaffLayout** | Staff users | Left sidebar: Dashboard, Blood Inventory, Blood Requests, Bed Management |
| **UserLayout** | Regular users | Left sidebar: Dashboard, Find Beds, Blood Availability, My Requests, AI Chatbot, Profile |

### 10.2 Key UI Components

| Component | Description |
|-----------|-------------|
| **FloatingAIAssistant** | Persistent floating chat button (bottom-right) opening AI health assistant dialog |
| **NotificationDropdown** | Bell icon in header with unread count badge and notification list dropdown |
| **Dashboard Cards** | Statistics displayed as cards with icons, counts, and trend indicators |
| **Data Tables** | Paginated, searchable, filterable tables for lists (users, beds, blood units, requests) |
| **Charts** | Recharts bar/pie/line charts for blood inventory, hospital distribution, analytics |
| **Modal Dialogs** | Confirmation dialogs for critical actions (approve, reject, delete) |
| **Toast Notifications** | Non-blocking success/error/info messages with icons and auto-dismiss |

### 10.3 Page Inventory

| Module | Pages | Count |
|--------|-------|-------|
| Public | Home | 1 |
| Auth | Login, Register | 2 |
| Admin | Dashboard, Users, Staff, Hospitals, Alerts, BedBookingManagement, BedManagement, BlockchainVerification, BloodManagement | 9 |
| Staff | Dashboard, BloodInventory, BloodRequests, StaffBedManagement | 4 |
| User | Dashboard, FindBeds, BloodAvailability, MyRequests, AIChatbot, Profile | 6 |
| **Total** | | **22** |

---

## 11. Blockchain Integration

### 11.1 Smart Contract Specification

| Property | Value |
|----------|-------|
| Contract Name | `HospitalManagement` |
| Solidity Version | ^0.8.19 |
| Network | Local Hardhat/Ganache (chainId: 31337) |
| Network URL | `http://127.0.0.1:8545` |

### 11.2 On-Chain Data

| Entity | Stored Fields | Trigger |
|--------|--------------|---------|
| Blood Unit | ID, bloodGroup, quantity, hospitalId, timestamp | On add/update via API |
| Bed Status | ID, hospitalId, isAvailable, timestamp | On status change via API |
| Transaction Record | entityId, entityType, action, timestamp, dataHash | On any entity operation |

### 11.3 Blockchain Service Architecture

```
Backend Server
     │
     ▼
BlockchainService (singleton)
     │
     ├── initialize() → Connect to Web3 provider, load contract
     ├── recordBloodUnit() → Call smart contract function
     ├── updateBedStatus() → Call smart contract function
     ├── verifyTransaction() → Verify tx hash on-chain
     ├── getTransactionReceipt() → Get block details
     └── generateHash() → SHA256 for data integrity
     │
     ▼
Ethereum Network (Hardhat/Ganache localhost:8545)
```

### 11.4 Graceful Degradation
- Blockchain operations are wrapped in try-catch
- If blockchain is unavailable, the operation proceeds without on-chain recording
- `blockchainTxHash` and `blockchainBlockNumber` fields are nullable on all models
- API responses include `blockchain` object indicating success/failure of chain recording

---

## 12. AI/ML Features

### 12.1 AI Architecture

```
                    User Message
                         │
                         ▼
              ┌─────────────────────┐
              │  Health Topic Check  │ ← Non-health queries rejected
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │  Google Gemini API   │ ← Primary (via direct API / OpenRouter)
              └──────────┬──────────┘
                         │ (if fails)
              ┌──────────▼──────────┐
              │  Python Flask NLP   │ ← Secondary (keyword + severity analysis)
              └──────────┬──────────┘
                         │ (if fails)
              ┌──────────▼──────────┐
              │  Built-in Fallback  │ ← Tertiary (static keyword responses)
              └─────────────────────┘
```

### 12.2 Emergency Severity Detection

The Python AI service implements a weighted symptom scoring system:

| Severity Level | Weight Range | Action |
|---------------|-------------|--------|
| **Critical** | 0.90 - 1.00 | IMMEDIATE EMERGENCY — Call 102/108 NOW |
| **Severe** | 0.70 - 0.85 | URGENT — Seek immediate medical attention |
| **Moderate** | 0.40 - 0.65 | Visit doctor within 24 hours |
| **Mild** | 0.10 - 0.35 | Monitor symptoms, home care advised |
| **Low** | 0.00 - 0.10 | Self-care recommended |

**Critical Symptoms (examples):** not breathing, no pulse, heart attack, stroke, severe bleeding, choking
**Severe Symptoms:** difficulty breathing, severe pain, high fever, broken bone, poisoning
**Moderate Symptoms:** fever, persistent pain, dizziness, vomiting, infection
**Mild Symptoms:** headache, cold, sore throat, minor cut, fatigue

### 12.3 First Aid Knowledge Base

Covers 18+ emergency scenarios:
- Burns, Choking, Severe Bleeding, Fractures
- Heart Attack, Stroke, Seizures, Poisoning
- Snake Bite, Drowning, Allergic Reactions
- Heatstroke, Hypothermia, Electric Shock
- Eye Injuries, Nosebleed, Sprains, Fainting

### 12.4 Blood Compatibility Engine

For each of the 8 blood groups (A+, A-, B+, B-, AB+, AB-, O+, O-):
- **Can donate to** list
- **Can receive from** list
- Special notes (e.g., O- is universal donor, AB+ is universal recipient)

---

## 13. Real-Time Features

### 13.1 Socket.IO Event Matrix

| Event | Emitter | Receiver | Payload |
|-------|---------|----------|---------|
| `newRegistration` | Server | Admin room | userId, name, email, role |
| `accountStatus` | Server | Specific user | isApproved |
| `bedUpdate` | Server | All | type, hospitalId, bedType |
| `bloodInventoryUpdate` | Server | All | type, bloodGroup, quantity, hospitalId |
| `bloodRequestUpdate` | Server | Requesting user | requestId, status |
| `bookingUpdate` | Server | Booking user | bookingId, status |
| `newEmergencyAlert` | Server | All | alertId, type, severity, title, description |
| `requestBedUpdate` | Client | Server | hospitalId |
| `requestBloodUpdate` | Client | Server | hospitalId |
| `emergencyAlert` | Client (staff/admin) | Server | alert data |
| `chatMessage` | Client | Server | message, context |
| `aiTyping` | Server | Requesting client | isTyping |
| `aiResponse` | Server | Requesting client | message, timestamp |

### 13.2 Room Architecture

```
Socket Rooms:
├── user_{userId}          ← Personal notifications
├── admin                   ← Admin-only events
├── staff                   ← Staff-only events
├── user                    ← User-only events
└── hospital_{hospitalId}   ← Hospital-specific events
```

---

## 14. Security Requirements

### 14.1 Authentication Flow

```
Register/Login → JWT Token Generated → Stored in localStorage
                                               │
                                               ▼
                                   Axios Interceptor adds
                                   "Authorization: Bearer {token}"
                                   to every API request
                                               │
                                               ▼
                                   Server middleware verifies:
                                   1. Token validity
                                   2. User exists & active
                                   3. Role authorization
                                   4. Approval status (staff)
```

### 14.2 Authorization Middleware Stack

```
protect          → Verify JWT, load user
authorize(roles) → Check user role matches allowed roles
checkApproval    → Verify staff is admin-approved
optionalAuth     → Load user if token exists, don't fail otherwise
```

### 14.3 Input Validation Rules

| Entity | Key Validations |
|--------|----------------|
| User Registration | Name 2-50 chars; valid email; password 6+ chars; 10-digit phone; valid role/bloodGroup |
| Blood Unit | Valid blood group; quantity ≥ 1; ISO8601 expiry date; valid component type |
| Blood Request | Valid blood group; units ≥ 1; reason 10+ chars; patient name required |
| Bed | Bed number required; valid type; numeric price |
| Bed Booking | Valid bed MongoDB ID; patient name required; valid booking type |
| Hospital | Name required ≤ 100 chars; valid email |

---

## 15. Deployment & Infrastructure

### 15.1 Development Environment

| Service | Port | Command |
|---------|------|---------|
| React Client | 3000 | `npm run client` |
| Node.js Server | 5000 | `npm run server` |
| Python AI Service | 5001 | `npm run ai-service` |
| Hardhat Blockchain | 8545 | `npm run blockchain` |
| MongoDB | 27017 | `mongod` |

### 15.2 Startup Sequence

1. Start MongoDB
2. Start Hardhat blockchain node
3. Deploy smart contracts (`npm run deploy-contracts`)
4. Start Python AI service
5. Start Node.js server (auto-seeds admin + sample data)
6. Start React client

### 15.3 NPM Scripts

```json
{
  "server": "nodemon server/index.js",
  "client": "npm start --prefix client",
  "dev": "concurrently server + client",
  "dev:all": "concurrently server + client + ai-service",
  "blockchain": "cd blockchain && npx hardhat node",
  "deploy-contracts": "cd blockchain && npx hardhat run scripts/deploy.js --network localhost",
  "ai-service": "cd ai-service && python app.py",
  "seed": "node server/utils/seedAdmin.js",
  "install-all": "npm install && cd client && npm install && cd ../blockchain && npm install"
}
```

---

## 16. Success Metrics

### 16.1 Key Performance Indicators (KPIs)

| KPI | Target | Measurement |
|-----|--------|-------------|
| **Bed search to booking time** | < 5 minutes | Time from search to confirmed booking |
| **Blood request fulfillment rate** | > 85% | Approved/fulfilled vs total requests |
| **Blockchain recording rate** | > 95% | Successful on-chain records vs total operations |
| **AI response accuracy** | > 80% | Relevant health responses vs total queries |
| **Average alert resolution time** | < 4 hours | Time from alert creation to resolution |
| **Staff approval turnaround** | < 24 hours | Time from registration to approval |
| **System uptime** | > 99.5% | Monthly availability |
| **Real-time notification delivery** | < 1 second | Socket event to toast display |

### 16.2 Usage Metrics

| Metric | Description |
|--------|-------------|
| DAU/MAU | Daily/Monthly Active Users |
| Beds managed | Total beds tracked across hospitals |
| Blood units tracked | Total blood units in inventory |
| Blockchain transactions | Total on-chain operations logged |
| AI chat sessions | Total chatbot conversations |
| Emergency alerts resolved | Total alerts processed |

---

## 17. Risks & Mitigations

| # | Risk | Impact | Probability | Mitigation |
|---|------|--------|-------------|------------|
| R1 | MongoDB connection failure | High | Medium | In-memory MongoDB fallback auto-enabled |
| R2 | Blockchain node unavailable | Medium | Medium | Non-blocking operations; graceful degradation |
| R3 | Gemini AI API rate limits/outage | Medium | High | Triple fallback: Gemini → Python NLP → static responses |
| R4 | JWT token theft | High | Low | 7-day expiry; HTTPS in production; token invalidation on password change |
| R5 | Data loss (in-memory DB mode) | High | Medium | Warning displayed; user prompted to configure persistent MongoDB |
| R6 | Smart contract bugs | High | Low | Solidity optimizer enabled; tested on local network before deployment |
| R7 | Socket.IO connection instability | Medium | Medium | Auto-reconnection (5 attempts, 1s delay); polling fallback |
| R8 | OpenRouter API key exposure | High | Medium | Environment variable storage; key rotation policy |

---

## 18. Future Enhancements

| Priority | Enhancement | Description |
|----------|------------|-------------|
| P1 | **Mobile App** | React Native app for patients and staff |
| P1 | **Email/SMS Notifications** | Nodemailer integration for critical alerts and request updates |
| P1 | **Production Blockchain** | Deploy to Ethereum testnet (Sepolia) or L2 (Polygon) |
| P2 | **ML-based Demand Prediction** | Predict blood demand and bed occupancy using historical data |
| P2 | **QR Code Check-in** | QR-based patient bed check-in/check-out |
| P2 | **Multi-language Support** | Telugu and Hindi translations for Andhra Pradesh users |
| P2 | **Advanced Analytics Dashboard** | Trend analysis, comparative hospital analytics, forecasting |
| P3 | **Telemedicine Integration** | Video consultation with doctors |
| P3 | **Insurance Processing** | Automated insurance claim filing |
| P3 | **Ambulance Tracking** | Real-time ambulance GPS tracking |
| P3 | **Blood Donor Matching** | Auto-match donors from user database for urgent requests |
| P3 | **ABHA Integration** | Integration with India's Ayushman Bharat Health Account |

---

## 19. Appendix

### 19.1 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | admin123 |

### 19.2 Seed Data Summary

- **10 Hospitals** from Kurnool, AP (mix of government and private)
- **Blood units** for 8 blood groups across hospitals with blood banks
- **Hospital beds** (emergency type) across wards
- **Staff users** assigned to respective hospitals

### 19.3 Blood Groups Supported

A+, A-, B+, B-, AB+, AB-, O+, O-

### 19.4 Bed Types Supported

General, Semi-Private, Private, ICU, NICU, PICU, CCU, Emergency, Maternity, Pediatric, Isolation

### 19.5 Indian Emergency Numbers

| Service | Number |
|---------|--------|
| Ambulance | 102 / 108 |
| Police | 100 |
| Fire | 101 |
| Women Helpline | 181 |
| Disaster Management | 1078 |

### 19.6 Environment Variables Reference

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/hospital-management
JWT_SECRET=<secret-key>
JWT_EXPIRE=7d
BLOCKCHAIN_NETWORK=http://127.0.0.1:8545
CONTRACT_ADDRESS=<deployed-address>
PYTHON_AI_URL=http://localhost:5001
GEMINI_API_KEY=<api-key>
OPENROUTER_API_KEY=<api-key>
```

---

*End of PRD Document*
