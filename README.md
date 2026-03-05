# Blockchain Enabled Intelligent Hospital Bed and Blood Resource Management System

A comprehensive full-stack real-time web application built with MERN stack, featuring blockchain integration for secure data management and AI-powered features for intelligent healthcare assistance.

## 🏥 Features

### Admin Module
- Dashboard with analytics (Total Users, Staff, Hospitals, Emergency Alerts)
- Blood request management from hospital staff
- Bed booking requests summary
- Visual analytics with charts
- Hospital and staff approval system
- Blockchain verification for bed & blood updates

### Blood Department Staff Module
- Blood inventory management
- Low stock warnings
- Blood unit CRUD operations with blockchain storage
- Blood request handling (Accept/Reject)
- Bed availability overview

### User Module
- View available beds (nearest hospitals)
- Blood availability by group
- Bed reservation system
- Blood request (Emergency/Normal)
- AI Chatbot for first aid guidance
- Emergency recommendations

## 🛠️ Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Charts:** Recharts
- **Blockchain:** Ethereum (Hardhat + Ganache)
- **AI:** Python (Flask + NLP)
- **Real-time:** Socket.IO

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- MongoDB
- Python 3.8+
- Ganache (for local blockchain)

### Setup

1. **Clone and install dependencies:**
```bash
npm run install-all
```

2. **Configure environment variables:**
```bash
# Edit .env file with your configurations
```

3. **Start MongoDB:**
```bash
mongod
```

4. **Start Blockchain (in separate terminal):**
```bash
npm run blockchain
```

5. **Deploy Smart Contracts:**
```bash
npm run deploy-contracts
```

6. **Start Python AI Service (in separate terminal):**
```bash
npm run python-ai
```

7. **Start the application:**
```bash
npm run dev
```

## 📁 Project Structure

```
├── server/                 # Backend Node.js
│   ├── config/            # Database & blockchain config
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Auth & validation middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── client/                 # Frontend React
│   ├── public/
│   └── src/
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       ├── context/       # React context
│       ├── hooks/         # Custom hooks
│       └── services/      # API services
├── blockchain/            # Smart contracts
│   ├── contracts/
│   └── scripts/
├── python-ai/             # AI microservice
│   ├── models/
│   └── services/
└── README.md
```

## 🔐 API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Admin
- GET `/api/admin/dashboard` - Get dashboard stats
- GET `/api/admin/users` - Get all users
- PUT `/api/admin/users/:id/approve` - Approve/reject user
- GET `/api/admin/hospitals` - Get all hospitals
- GET `/api/admin/staff` - Get all staff

### Blood Management
- GET `/api/blood/inventory` - Get blood inventory
- POST `/api/blood/add` - Add blood unit
- PUT `/api/blood/:id` - Update blood unit
- GET `/api/blood/requests` - Get blood requests
- POST `/api/blood/request` - Create blood request

### Bed Management
- GET `/api/beds` - Get all beds
- POST `/api/beds` - Add new bed
- PUT `/api/beds/:id` - Update bed status
- POST `/api/beds/reserve` - Reserve bed

### AI Services
- POST `/api/ai/chat` - AI chatbot
- GET `/api/ai/recommendations` - Emergency recommendations
- GET `/api/ai/predict-stock` - Predict low stock

## 🔗 Blockchain Features

- Blood unit transaction records
- Bed availability updates
- Tamper-proof history
- Hash-based verification

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
