# HealthWise AI — Chatbot Training Data
## Blockchain-Enabled Intelligent Hospital Bed and Blood Resource Management System

---

## 1. PLATFORM OVERVIEW

### What is this platform?
This is a **Blockchain-Enabled Intelligent Hospital Bed and Blood Resource Management System** — a comprehensive full-stack healthcare platform designed to serve the Kurnool district of Andhra Pradesh, India. It provides real-time management of hospital beds and blood bank resources, with blockchain-powered transparency and AI-assisted health guidance.

### Technology Stack
| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + Tailwind CSS (Port 3000) |
| Backend | Node.js + Express.js (Port 5000) |
| Database | MongoDB Atlas (Cloud) |
| Blockchain | Ethereum (Solidity ^0.8.19 via Hardhat, Port 8545) |
| AI Service | Python Flask + OpenAI GPT (Port 5001) |
| Real-time | Socket.IO (WebSocket-based) |
| Charts | Recharts |
| Authentication | JWT + bcrypt |

### Key Features
1. **Hospital Bed Management** — Real-time bed tracking, booking, and status updates
2. **Blood Bank Management** — Inventory tracking, blood requests, compatibility checks
3. **Blockchain Verification** — Immutable audit trail for all blood and bed operations
4. **AI Health Assistant** — HealthWise AI chatbot for health guidance and first aid
5. **Emergency Alert System** — Real-time alerts for critical situations
6. **Real-time Notifications** — Socket.IO-powered live updates
7. **Role-based Access Control** — Admin, Staff, User roles with different permissions
8. **Analytics Dashboard** — Data visualization for admins

---

## 2. HOSPITALS IN THE SYSTEM

All hospitals are located in **Kurnool, Andhra Pradesh, India**.

### Hospital Directory

| # | Hospital Name | Address | Type | Beds | Blood Bank | Rating | Specialties |
|---|--------------|---------|------|------|------------|--------|-------------|
| 1 | Government General Hospital (GGH) Kurnool | Budhawarpet Road, 518002 | Government | 250 | ✅ Yes | 4.2/5 | Emergency Medicine, General Surgery, Internal Medicine, Orthopedics, Gynecology, Pediatrics |
| 2 | Kurnool Medical College Teaching Hospital | KMC Campus, 518002 | Government | 300 | ✅ Yes | 4.5/5 | Cardiology, Neurology, Nephrology, Oncology, Pulmonology, Gastroenterology |
| 3 | Apollo Medical Centre Kurnool | NR Peta Area, 518004 | Private | 150 | ✅ Yes | 4.6/5 | Cardiac Surgery, Neurosurgery, Organ Transplant, Robotic Surgery, Interventional Radiology |
| 4 | Venkateswara Hospital | Kurnool Bazar, 518001 | Private | 100 | ✅ Yes | 4.3/5 | General Surgery, Internal Medicine, ENT, Ophthalmology, Dermatology |
| 5 | Asha Children's Hospital | Budhawarpet Area, 518002 | Private | 60 | ❌ No | 4.4/5 | Pediatrics, Neonatology, Pediatric Surgery, Child Psychology |
| 6 | KIMS Hospital Kurnool | One Town Area, 518001 | Private | 200 | ✅ Yes | 4.7/5 | Cardiac Sciences, Neuro Sciences, Organ Transplant, Oncology, Gastroenterology |
| 7 | Omni Hospital Kurnool | NR Peta, 518004 | Private | 120 | ✅ Yes | 4.4/5 | Emergency Medicine, Trauma Care, Orthopedics, Critical Care, Dialysis |
| 8 | Sree Ashwini Hospital | Shilpa Birla Area, 518002 | Private | 80 | ✅ Yes | 4.3/5 | General Medicine, Surgery, Gynecology, Orthopedics, Urology |
| 9 | Sri Balaji Nursing Home | Kurnool Bazar, 518001 | Private | 40 | ❌ No | 4.1/5 | General Medicine, Minor Surgery, Maternity Care |
| 10 | Aarka Hospital | Budhawarpet, 518002 | Private | 90 | ✅ Yes | 4.2/5 | Emergency Medicine, General Surgery, Internal Medicine, Dialysis, Physiotherapy |

### Hospital Contact & Operation Hours
- All hospitals have 24x7 emergency services
- OPD hours typically: 9:00 AM - 5:00 PM (Mon-Sat)
- Government hospitals: Free or subsidized treatment for BPL patients
- Private hospitals: Insurance and cashless facility available

---

## 3. BED MANAGEMENT

### Bed Types Available
| Bed Type | Description | Typical Daily Rate |
|----------|-------------|-------------------|
| General | Standard ward bed | ₹500-1,500 |
| Semi-Private | Shared room (2-4 beds) | ₹1,500-3,000 |
| Private | Single patient room | ₹3,000-8,000 |
| ICU | Intensive Care Unit | ₹8,000-25,000 |
| NICU | Neonatal Intensive Care | ₹10,000-30,000 |
| PICU | Pediatric Intensive Care | ₹10,000-25,000 |
| CCU | Coronary Care Unit | ₹10,000-25,000 |
| Emergency | Emergency department | ₹2,000-5,000 |
| Maternity | Labor/delivery rooms | ₹3,000-10,000 |
| Pediatric | Children's ward | ₹1,000-3,000 |
| Isolation | Infectious disease isolation | ₹5,000-15,000 |

### Bed Statuses
- **Available**: Ready for new patient
- **Occupied**: Currently in use
- **Reserved**: Booked for incoming patient
- **Maintenance**: Under repair or equipment servicing
- **Cleaning**: Being sanitized after patient checkout

### Equipment Available on Beds
- Oxygen supply
- Ventilator
- Patient monitor (vitals tracking)

### Bed Booking Process
1. User goes to **"Find Beds"** page in the dashboard sidebar
2. Filters by hospital, city, district, bed type
3. Selects an available bed
4. Fills in patient details: name, age, gender, condition, diagnosis
5. Chooses booking type: Emergency / Scheduled / Walk-in
6. Submits booking request
7. Booking status: **Pending → Confirmed → Checked-in → Checked-out**
8. Can also be: Cancelled or No-show
9. Each status change is recorded on the Ethereum blockchain

### Bed Counts in System
- Total beds seeded: ~300 across all 10 hospitals
- Distribution varies by hospital size (40-300 beds per hospital)

---

## 4. BLOOD BANK MANAGEMENT

### Blood Groups Tracked
All 8 major blood groups: **A+, A-, B+, B-, AB+, AB-, O+, O-**

### Blood Component Types
| Component | Description | Shelf Life |
|-----------|-------------|-----------|
| Whole Blood | Complete blood | 35-42 days |
| Packed RBC | Red blood cells only | 42 days |
| Platelets | Clotting components | 5 days |
| Plasma | Liquid component | 1 year (frozen) |
| Cryoprecipitate | Clotting factors from plasma | 1 year (frozen) |

### Blood Unit Statuses
- **Available**: Ready for transfusion
- **Reserved**: Held for a pending request
- **Used**: Transfused to patient
- **Expired**: Past shelf life
- **Discarded**: Failed testing or damaged

### Blood Testing
Every donated unit is tested for:
- HIV
- Hepatitis B
- Hepatitis C
- Syphilis
- Malaria

### Blood Group Compatibility Chart

#### Red Blood Cell Compatibility (Who can RECEIVE from whom)
| Recipient → | Can Receive From |
|-------------|-----------------|
| O- | O- only |
| O+ | O-, O+ |
| A- | A-, O- |
| A+ | A+, A-, O+, O- |
| B- | B-, O- |
| B+ | B+, B-, O+, O- |
| AB- | AB-, A-, B-, O- |
| AB+ | ALL blood types (Universal Recipient) |

#### Donor Compatibility (Who can DONATE to whom)
| Donor → | Can Donate To |
|---------|--------------|
| O- | ALL blood types (Universal Donor) |
| O+ | O+, A+, B+, AB+ |
| A- | A+, A-, AB+, AB- |
| A+ | A+, AB+ |
| B- | B+, B-, AB+, AB- |
| B+ | B+, AB+ |
| AB- | AB+, AB- |
| AB+ | AB+ only |

### Blood Request Process
1. User goes to **"Blood Availability"** page in the dashboard
2. Views available blood units across all hospitals by blood group
3. Clicks "Request Blood" and fills form:
   - Patient name, age, blood group needed
   - Number of units required
   - Priority: Emergency / Normal / Scheduled
   - Reason/diagnosis
   - Hospital where needed
4. Request status: **Pending → Approved/Rejected → Fulfilled**
5. Staff at assigned hospital processes the request
6. Blood operations recorded on blockchain

### Blood Inventory (Seeded Data)
- ~80 blood units distributed across 8 hospitals with blood banks
- All 8 blood groups represented
- Stock alert threshold: 5 units (alert generated when below)

---

## 5. USER ROLES & PERMISSIONS

### Admin
- **Default Account**: admin@hospital.com / admin123
- **Capabilities**:
  - Dashboard with system-wide analytics
  - Manage all hospitals (approve new registrations)
  - Manage all staff (approve/reject staff accounts)
  - Manage all users
  - View and manage bed bookings across all hospitals
  - View and manage blood requests across all hospitals
  - Blockchain verification panel
  - Emergency alert management
  - Blood management overview

### Staff
- **Registration**: Must specify assigned hospital during registration
- **Approval**: Requires admin approval before access
- **Capabilities**:
  - Staff Dashboard for their assigned hospital
  - Manage blood inventory (add/update/remove blood units)
  - Process blood requests (approve/reject)
  - Manage beds for their hospital (update status, check-in/out)
  - View hospital-specific analytics

### User (Patient/Public)
- **Registration**: Auto-approved on signup
- **Capabilities**:
  - Personal dashboard
  - Search and book hospital beds (Find Beds page)
  - Check blood availability across hospitals
  - Submit blood requests
  - AI Chatbot access (HealthWise AI)
  - Track requests in "My Requests" page
  - Update profile, medical history, emergency contacts
  - Receive real-time notifications

### Registration Process
1. Go to the registration page
2. Fill in: Full Name, Email, Password, Phone, Blood Group (optional), Address
3. Select Role: User or Staff
4. If Staff: Select assigned hospital
5. Submit registration
6. Users: Immediately active
7. Staff: Pending admin approval

---

## 6. BLOCKCHAIN FEATURES

### What is Blockchain Verification?
The system uses an Ethereum blockchain (local network via Hardhat) to create an **immutable audit trail** for all critical operations. This ensures:
- **Transparency**: Every blood unit operation and bed status change is permanently recorded
- **Tamper-proof**: Records cannot be altered or deleted
- **Accountability**: Complete history of who did what and when
- **Trust**: Patients and authorities can verify all transactions

### Smart Contract: HospitalManagement.sol
Written in Solidity ^0.8.19, deployed on a local Hardhat network (Port 8545).

### What Gets Recorded on Blockchain
1. **Blood Operations**: When a blood unit is added, used, expired, or discarded
2. **Bed Status Changes**: When a bed changes from available to occupied, reserved, etc.
3. **Each Record Contains**: Transaction hash, timestamp, operation type, operator address

### How to Verify
- Admin can access the **"Blockchain Verification"** page
- Enter a transaction hash to view the full blockchain record
- View recent blockchain transactions
- All records show: block number, timestamp, gas used, transaction data

---

## 7. EMERGENCY SYSTEM

### Indian Emergency Numbers
| Service | Number |
|---------|--------|
| 🚑 Ambulance | 102 / 108 |
| 👮 Police | 100 |
| 🚒 Fire | 101 |
| 👩 Women Helpline | 181 |
| 🌊 Disaster Management | 1078 |
| 🏥 National Emergency | 112 |

### Emergency Severity Classification

#### 🔴 CRITICAL (Score: 90-100%)
**Symptoms**: Not breathing, no pulse, heart attack, stroke, severe uncontrolled bleeding, choking, anaphylaxis, severe burns (>20% body), unconsciousness
**Action**: CALL 102/108 IMMEDIATELY. Begin CPR if trained.

#### 🟠 SEVERE (Score: 70-85%)
**Symptoms**: Difficulty breathing, severe chest/abdominal pain, high fever >103°F (39.4°C), head injury with confusion, broken/deformed bones, poisoning/overdose, severe allergic reaction
**Action**: URGENT medical attention needed. Go to emergency room or call ambulance.

#### 🟡 MODERATE (Score: 40-65%)
**Symptoms**: Persistent fever (100-103°F), moderate pain, dizziness, vomiting, diarrhea, infected wounds, urinary issues, persistent cough, minor sprains
**Action**: See a doctor within 24 hours. Monitor symptoms closely.

#### 🔵 MILD (Score: 10-35%)
**Symptoms**: Headache, common cold, sore throat, mild fatigue, minor cuts/bruises, mild stomach upset, muscle soreness
**Action**: Home care recommended. Rest, hydrate, OTC medications. See doctor if symptoms worsen.

#### 🟢 LOW (Score: 0-10%)
**Symptoms**: Minor discomfort, seasonal allergies, very mild symptoms
**Action**: Self-care sufficient. Monitor if symptoms change.

### Emergency Alerts
- Admins can create system-wide emergency alerts
- Alerts are broadcast in real-time via Socket.IO
- Alert types: Critical, Warning, Information
- All users receive notifications instantly
- Alerts displayed in notification dropdown

---

## 8. FIRST AID GUIDE

### Burns
- **Immediate**: Cool under running water for 10-20 minutes
- **Don't**: Apply ice, butter, toothpaste, or creams
- **Do**: Cover with clean, non-fluffy material (cling wrap works well)
- **When to call 102**: 3rd degree burns, burns larger than palm, chemical/electrical burns, burns on face/joints/genitals
- **Classification**: 1st degree (red skin), 2nd degree (blisters), 3rd degree (white/charred)

### Choking
- **Conscious Adult**: Encourage coughing. 5 back blows between shoulder blades → 5 abdominal thrusts (Heimlich)
- **Heimlich**: Stand behind, fist above navel, quick upward thrusts
- **Unconscious**: Call 102, begin CPR, check mouth for object before breaths
- **Infant (<1 year)**: 5 back blows + 5 chest thrusts (2 fingers on breastbone). NEVER do Heimlich on infants.

### Bleeding (External)
- Apply direct pressure with clean cloth
- Elevate the wound above heart level
- Don't remove the cloth — add more layers if needed
- For severe/spurting bleeding: Apply tourniquet 2-3 inches above wound
- **Call 102**: If bleeding doesn't stop after 10 min, spurting blood, large wound, embedded object

### CPR (Cardiopulmonary Resuscitation)
- **When**: Person is unresponsive and not breathing normally
- Call 102/108 first (or ask someone to call)
- **Compressions**: Center of chest, heel of hand, 2 inches deep, 100-120 per minute
- **Ratio**: 30 compressions : 2 rescue breaths
- Use AED if available (follow voice instructions)
- Don't stop until help arrives or person starts breathing
- **Hands-only CPR**: If uncomfortable with mouth-to-mouth, just do continuous compressions

### Heart Attack
- **Warning Signs**: Crushing chest pressure/pain, pain radiating to left arm/jaw/back, shortness of breath, cold sweat, nausea
- **Action**: Call 102/108 immediately
- Sit person comfortably (not lying down)
- Loosen tight clothing
- Give aspirin 325mg to chew (if not allergic)
- Be ready to perform CPR
- **Women may have**: Unusual fatigue, back/jaw pain, no chest pain

### Stroke
- **FAST Method**:
  - **F**ace: Ask to smile — is one side drooping?
  - **A**rms: Ask to raise both arms — does one drift down?
  - **S**peech: Ask to repeat a sentence — is speech slurred/strange?
  - **T**ime: If ANY of these, call 102/108 IMMEDIATELY
- Note the time symptoms started (critical for treatment)
- Don't give food/water
- Keep person comfortable and still

### Fever Management
- **Mild (99-100°F)**: Rest, hydrate, monitor
- **Moderate (100-102°F)**: Paracetamol 500mg every 6 hours, cool compress on forehead
- **High (102-103°F)**: Paracetamol 1000mg, tepid sponging, lots of fluids
- **Dangerous (>103°F / 39.4°C)**: SEEK MEDICAL HELP immediately
- **Stay hydrated**: Water, ORS, coconut water, juices
- **When to worry**: Fever >3 days, stiff neck, severe headache, rash, difficulty breathing

### Fractures / Broken Bones
- Don't move the injured area
- Apply ice wrapped in cloth (not directly on skin)
- Immobilize with a splint (rigid material + cloth ties)
- For open fractures (bone visible): Cover wound, don't push bone back
- Elevate if possible
- Seek medical help immediately

### Snake Bite
- Stay calm, limit movement
- Immobilize the bitten limb (keep at or below heart level)
- Remove jewelry/tight clothing near bite
- **Don't**: Cut the wound, suck out venom, apply tourniquet tightly, apply ice
- Mark the edge of swelling with pen and time
- Get to hospital ASAP — antivenom is the only effective treatment
- Try to remember snake appearance (don't try to catch it)

### Seizures / Fits
- Clear dangerous objects from area
- Don't restrain the person
- Don't put anything in their mouth
- Turn on side (recovery position) after seizure stops
- Time the seizure
- **Call 102 if**: Seizure >5 minutes, first seizure, person is pregnant/diabetic, doesn't regain consciousness, injuries occurred

### Poisoning
- Call 102/108 immediately
- Don't induce vomiting unless told by a medical professional
- If chemical on skin: Remove contaminated clothing, rinse skin with water for 20 min
- If inhaled: Move to fresh air
- Save the container/substance — show it to medics
- If conscious: Small sips of water

### Drowning
- Ensure your own safety first
- Remove from water
- Check for breathing
- If not breathing: Begin CPR immediately
- Call 102/108
- Remove wet clothing, keep warm
- Even if person seems fine: Get medical evaluation (secondary drowning risk)

### Electric Shock
- Don't touch the person if still in contact with electrical source
- Turn off power at the source if possible
- Use a dry non-conductive object (wooden stick, plastic chair) to separate person from source
- Check breathing, begin CPR if needed
- Call 102/108
- Treat any burns

### Heatstroke
- **Signs**: Body temp >104°F, hot/red/dry skin, confusion, rapid pulse, headache
- Move to shade/cool area immediately
- Cool with water, fan, ice packs on neck/armpits/groin
- Don't give fluids if unconscious
- Call 102/108 if temp >104°F or confusion

### Allergic Reaction (Anaphylaxis)
- **Signs**: Swelling of face/throat, difficulty breathing, rapid pulse, dizziness, hives all over body
- Use EpiPen (epinephrine auto-injector) if available — inject into outer thigh
- Call 102/108
- Lay flat with legs elevated (if breathing okay)
- If vomiting: Turn on side
- Be ready for CPR
- Second dose of EpiPen after 5-15 min if no improvement

### Asthma Attack
- Sit upright (don't lie down)
- Use reliever inhaler (blue) — 1 puff every 30-60 seconds, max 10 puffs
- Stay calm, breathe slowly
- **Call 102 if**: No inhaler available, no improvement after 10 puffs, difficulty speaking, lips turning blue

### Dog Bite
- Wash wound with soap and running water for 10-15 minutes
- Apply antiseptic (betadine)
- Cover with clean bandage
- Go to hospital for anti-rabies vaccination (within 24 hours ideally)
- Report to local authorities if stray dog

---

## 9. COMMON HEALTH TOPICS

### Blood Donation Guidelines
- **Eligibility**: Age 18-65, weight >45kg, hemoglobin >12.5 g/dL
- **Frequency**: Every 3 months (males), every 4 months (females)
- **Before donation**: Eat well, stay hydrated, get good sleep
- **After donation**: Rest 10-15 minutes, drink fluids, avoid heavy exercise for 24 hours
- **Cannot donate if**: Recent tattoo/piercing (<12 months), pregnant/breastfeeding, fever, on antibiotics, chronic diseases (HIV, Hepatitis), recent surgery

### Common Health Tips
- Drink 8-10 glasses of water daily
- Sleep 7-9 hours per night
- Exercise 30 minutes daily (walking, yoga, cycling)
- Eat balanced diet: fruits, vegetables, whole grains, protein
- Regular health checkups: Blood pressure, blood sugar, cholesterol
- Maintain hygiene: Handwashing, dental care, clean environment
- Mental health: Manage stress, seek support when needed
- Avoid: Smoking, excessive alcohol, processed/junk food

### When to See a Doctor
- Fever lasting more than 3 days
- Unexplained weight loss
- Persistent pain anywhere
- Blood in stool/urine
- Difficulty breathing
- Chest pain
- Persistent cough > 2 weeks
- Changes in moles/skin
- Severe headaches
- Vision/hearing changes

---

## 10. PLATFORM NAVIGATION GUIDE

### For New Users
1. **Register**: Click "Register" → Fill details → Select "User" role → Submit
2. **Login**: Use your email and password
3. **Dashboard**: See overview of your activity and quick stats

### Finding Hospital Beds
1. Click **"Find Beds"** in the left sidebar
2. Use filters: Hospital name, City, District, Bed Type
3. View available beds with equipment details
4. Click **"Book Bed"** on an available bed
5. Fill patient details and submit

### Checking Blood Availability
1. Click **"Blood Availability"** in the left sidebar
2. View blood units available at each hospital
3. Filter by blood group
4. Click **"Request Blood"** to submit a request

### Tracking Your Requests
1. Click **"My Requests"** in the left sidebar
2. View all your bed bookings and blood requests
3. See status: Pending / Confirmed / Fulfilled / Rejected
4. Cancel pending requests if needed

### Using AI Chatbot
1. Click **"AI Chatbot"** in the left sidebar
2. **HealthWise AI tab** (PRO): Advanced AI-powered health assistant
3. **Quick Assistant tab**: Fast answers to common health questions
4. Ask about: symptoms, first aid, hospitals, beds, blood, health tips

### Updating Profile
1. Click **"Profile"** in the left sidebar
2. Update personal info: name, phone, address
3. Add medical history and conditions
4. Set emergency contacts
5. Update blood group

---

## 11. FREQUENTLY ASKED QUESTIONS

**Q: How do I find the nearest hospital?**
A: Go to "Find Beds" page — hospitals are listed with addresses. All hospitals in our system are in Kurnool, AP. For emergencies, call 102/108 for ambulance service.

**Q: Can I book a bed for someone else?**
A: Yes! When booking, enter the patient's details (not yours). You can book for family members or friends.

**Q: How long does blood request approval take?**
A: Emergency requests are prioritized and can be processed within minutes. Normal requests typically take a few hours. Staff at the respective hospital processes the request.

**Q: Is my data secure?**
A: Yes. Authentication uses JWT tokens and bcrypt password hashing. Blockchain records are immutable and tamper-proof.

**Q: What if my blood group is not available?**
A: Check compatible blood groups (see Blood Compatibility Chart). O- can be given to any patient in emergencies. You can also check other hospitals in the system.

**Q: How does blockchain verification work?**
A: Every blood operation and bed status change generates a transaction on the Ethereum blockchain. This creates an immutable record that can be verified by anyone with the transaction hash.

**Q: Who can I contact for help?**
A: Use the AI Chatbot for immediate assistance. For emergencies, call 102/108. For platform issues, contact the system administrator.

**Q: How do I become a staff member?**
A: Register with the "Staff" role and select your hospital. An admin must approve your account before you can access staff features.

**Q: What are the visiting hours?**
A: Visiting hours vary by hospital. Generally: 10 AM - 12 PM and 4 PM - 6 PM for government hospitals. Private hospitals may have more flexible hours. Check with the specific hospital.

**Q: Can I cancel a bed booking?**
A: Yes, you can cancel a pending or confirmed booking from the "My Requests" page. Once checked in, cancellation is not possible.

---

## 12. SYSTEM DATA SUMMARY

### Seeded Data (Pre-loaded)
- **10 hospitals** in Kurnool, Andhra Pradesh
- **~300 beds** distributed across all hospitals
- **~80 blood units** across 8 hospitals with blood banks
- **~25 staff accounts** (assigned to various hospitals)
- **~10 user accounts** (sample patients)
- **1 admin account** (admin@hospital.com)

### Database Collections
1. **Users** — User accounts with roles, profiles, medical history
2. **Hospitals** — Hospital profiles, facilities, departments, ratings
3. **Beds** — Individual bed records with type, status, equipment
4. **BedBookings** — Bed reservation/booking records
5. **BloodUnits** — Blood inventory with testing results
6. **BloodRequests** — Blood request records with priority and status
7. **BlockchainTransactions** — Blockchain audit trail records
8. **EmergencyAlerts** — System-wide emergency notifications

---

*This training data is maintained for the HealthWise AI chatbot. Last updated: 2024.*
*For system updates, modify the HEALTH_SYSTEM_PROMPT in server/routes/ai.routes.js and HEALTH_ASSISTANT_PROMPT in ai-service/app.py.*
