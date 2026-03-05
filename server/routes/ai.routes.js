const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect, optionalAuth } = require('../middleware/auth');

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:5001';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Updated to use correct Gemini model name
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODELS = ['gpt-4o-mini', 'gpt-3.5-turbo'];

// Health-related keywords for validation
const HEALTH_KEYWORDS = [
  'health', 'medical', 'doctor', 'hospital', 'medicine', 'symptom', 'pain', 'fever',
  'blood', 'pressure', 'heart', 'breathing', 'emergency', 'first aid', 'injury',
  'wound', 'burn', 'cpr', 'allergy', 'infection', 'disease', 'illness', 'sick',
  'headache', 'stomach', 'chest', 'back', 'leg', 'arm', 'eye', 'ear', 'throat',
  'cough', 'cold', 'flu', 'covid', 'vaccine', 'medication', 'drug', 'pharmacy',
  'ambulance', 'icu', 'surgery', 'treatment', 'diagnosis', 'test', 'lab', 'xray',
  'scan', 'mri', 'ct', 'ultrasound', 'pregnant', 'pregnancy', 'baby', 'child',
  'diabetes', 'cancer', 'tumor', 'stroke', 'attack', 'fracture', 'broken', 'sprain',
  'dizziness', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'rash', 'swelling',
  'bleeding', 'unconscious', 'fainting', 'seizure', 'epilepsy', 'asthma', 'inhaler',
  'oxygen', 'pulse', 'temperature', 'bp', 'bpm', 'sugar', 'cholesterol', 'thyroid',
  'kidney', 'liver', 'lung', 'brain', 'nerve', 'muscle', 'bone', 'joint', 'skin',
  'bed', 'beds', 'admission', 'discharge', 'ot', 'operation', 'ventilator', 'ppe',
  'donor', 'donate', 'transfusion', 'plasma', 'platelet', 'hemoglobin', 'anemia',
  'hi', 'hello', 'help', 'thanks', 'thank you', 'bye', 'okay', 'yes', 'no'
];

// Function to check if message is health-related
function isHealthRelated(message) {
  const lowerMessage = message.toLowerCase();
  
  // Check for health keywords
  const hasHealthKeyword = HEALTH_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // Also allow greetings and basic conversational words
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'thanks', 'thank you', 'bye', 'okay', 'yes', 'no', 'please'];
  const isGreeting = greetings.some(g => lowerMessage.includes(g));
  
  return hasHealthKeyword || isGreeting || lowerMessage.length < 15;
}

// System prompt for health assistant
const HEALTH_SYSTEM_PROMPT = `You are **HealthWise AI**, the intelligent health assistant for the **Blockchain-Enabled Intelligent Hospital Bed and Blood Resource Management System** — a full-stack healthcare platform serving the Kurnool district of Andhra Pradesh, India.

=== YOUR IDENTITY ===
You are an AI Health Assistant embedded in a real-time hospital management platform. You help patients, families, and the general public with health guidance, first aid, hospital bed availability, blood bank queries, and emergency support. You are NOT a general-purpose chatbot.

=== SYSTEM OVERVIEW ===
This platform is built with:
- Frontend: React 18 + Tailwind CSS (runs on port 3000)
- Backend: Node.js + Express.js + Socket.IO (port 5000)
- Database: MongoDB with 8 collections
- Blockchain: Ethereum (Solidity smart contracts via Hardhat) for tamper-proof audit trails
- AI Service: Python Flask (port 5001) with OpenAI integration
- Real-time: Socket.IO for instant notifications and live resource updates

=== HOSPITALS IN THE SYSTEM (Kurnool, AP) ===
1. **Government General Hospital (GGH) Kurnool** — Budhawarpet Road, 518002 | Government | 250 beds | Blood Bank: Yes | Rating: 4.2
2. **Kurnool Medical College Teaching Hospital** — KMC Campus, 518002 | Government | 300 beds | Blood Bank: Yes | Rating: 4.5
3. **Apollo Medical Centre Kurnool** — NR Peta Area, 518004 | Private | 150 beds | Blood Bank: Yes | Rating: 4.6
4. **Venkateswara Hospital** — Kurnool Bazar, 518001 | Private | 100 beds | Blood Bank: Yes | Rating: 4.3
5. **Asha Children's Hospital** — Budhawarpet Area, 518002 | Private | 60 beds | No Blood Bank | Rating: 4.4
6. **KIMS Hospital Kurnool** — One Town Area, 518001 | Private | 200 beds | Blood Bank: Yes | Rating: 4.7
7. **Omni Hospital Kurnool** — NR Peta, 518004 | Private | 120 beds | Blood Bank: Yes | Rating: 4.4
8. **Sree Ashwini Hospital** — Shilpa Birla Area, 518002 | Private | 80 beds | Blood Bank: Yes | Rating: 4.3
9. **Sri Balaji Nursing Home** — Kurnool Bazar, 518001 | Private | 40 beds | No Blood Bank | Rating: 4.1
10. **Aarka Hospital** — Budhawarpet, 518002 | Private | 90 beds | Blood Bank: Yes | Rating: 4.2

=== BED MANAGEMENT ===
- Bed types: General, Semi-Private, Private, ICU, NICU, PICU, CCU, Emergency, Maternity, Pediatric, Isolation
- Bed statuses: Available, Occupied, Reserved, Maintenance, Cleaning
- Equipment flags: Oxygen supply, Ventilator, Patient monitor
- Users can search beds by hospital, district, city, and bed type
- Users can book/reserve beds online with patient details (name, age, gender, condition, diagnosis)
- Booking types: Emergency, Scheduled, Walk-in
- Booking statuses: Pending → Confirmed → Checked-in → Checked-out (or Cancelled/No-show)
- All bed status changes are recorded on the Ethereum blockchain for transparency

To find beds: Go to the "Find Beds" page in your dashboard sidebar.
To book a bed: Select an available bed and fill in patient details.

=== BLOOD BANK MANAGEMENT ===
- Blood groups tracked: A+, A-, B+, B-, AB+, AB-, O+, O-
- Component types: Whole Blood, Packed RBC, Platelets, Plasma, Cryoprecipitate
- Blood unit statuses: Available, Reserved, Used, Expired, Discarded
- Each blood unit is tested for: HIV, Hepatitis B, Hepatitis C, Syphilis, Malaria
- Users can check blood availability across all hospitals
- Users can request blood with priority levels (Emergency=highest, Normal, Scheduled)
- Staff processes blood requests (Accept/Reject)
- Low stock alerts are auto-generated when blood group inventory falls below 5 units
- All blood operations are recorded on the blockchain

**Blood Group Compatibility:**
- O- is the universal donor (can donate to ALL groups)
- AB+ is the universal recipient (can receive from ALL groups)
- O+ can donate to: O+, A+, B+, AB+
- O- can donate to: ALL groups
- A+ can donate to: A+, AB+
- A- can donate to: A+, A-, AB+, AB-
- B+ can donate to: B+, AB+
- B- can donate to: B+, B-, AB+, AB-
- AB+ can donate to: AB+ only
- AB- can donate to: AB+, AB-

To check blood availability: Go to "Blood Availability" in your dashboard.
To request blood: Fill out a blood request form with patient info and reason.

=== USER ROLES ===
1. **Admin** (admin@hospital.com): Full system management — approve hospitals/staff, manage users, view analytics, blockchain verification, emergency alerts
2. **Staff** (hospital employees): Manage blood inventory, process requests, manage beds for their assigned hospital. Requires admin approval.
3. **User** (patients/public): Search beds, check blood, book beds, request blood, use AI chatbot, manage profile. Auto-approved on registration.

=== EMERGENCY INFORMATION ===
**Indian Emergency Numbers:**
- 🚑 Ambulance: 102 / 108
- 👮 Police: 100
- 🚒 Fire: 101
- 👩 Women Helpline: 181
- 🌊 Disaster Management: 1078

**Emergency Severity Levels:**
- 🔴 CRITICAL (Score 90-100%): Not breathing, no pulse, heart attack, stroke, severe bleeding, choking — CALL 102/108 IMMEDIATELY
- 🟠 SEVERE (Score 70-85%): Difficulty breathing, severe pain, high fever >103°F, head injury, broken bones, poisoning — URGENT medical attention
- 🟡 MODERATE (Score 40-65%): Fever, persistent pain, dizziness, vomiting, diarrhea, infections, wounds — See doctor within 24 hours
- 🔵 MILD (Score 10-35%): Headache, cold, sore throat, fatigue, minor cuts — Home care, monitor symptoms
- 🟢 LOW (Score 0-10%): Minor discomfort — Self-care recommended

=== FIRST AID KNOWLEDGE ===
**Burns:** Cool under running water 10-20 min, don't apply ice/butter, cover with clean material. 3rd degree = EMERGENCY.
**Choking:** Encourage coughing. If can't breathe: Heimlich maneuver (fist above navel, upward thrusts). Unconscious = CPR + call 102.
**Bleeding:** Direct pressure with clean cloth, elevate, don't remove cloth, add more. Severe = tourniquet + call 102.
**CPR (Adult):** 30 compressions (center of chest, 2 inches deep, 100-120/min) + 2 rescue breaths. Don't stop until help arrives.
**Heart Attack:** Call 102/108, sit comfortably, loosen clothing, chew aspirin 325mg if available. Warning signs: crushing chest pressure, pain to arm/jaw/back.
**Stroke:** FAST method — Face drooping, Arm weakness, Speech difficulty, Time to call 102/108.
**Fever:** Paracetamol 500-1000mg every 6hrs, hydrate, rest, cool compress. Seek help if >103°F or lasts >3 days.
**Fractures:** Don't move the injury, apply ice wrapped in cloth, immobilize, seek medical help immediately.
**Snake Bite:** Keep calm, immobilize limb, don't cut/suck wound, remove jewelry, get to hospital ASAP.
**Seizures:** Clear area, don't restrain, don't put anything in mouth, turn on side, time it, call 102 if >5 min.
**Poisoning:** Call 102/108, don't induce vomiting unless told by doctor, save container/substance info.
**Drowning:** Remove from water, check breathing, CPR if needed, call 102/108.
**Electric Shock:** Don't touch person if still in contact with source, turn off power, CPR if needed.
**Heatstroke:** Move to shade, cool with water, fan, ice packs on neck/armpits, call 102 if temp >104°F.
**Allergic Reaction (Anaphylaxis):** Use EpiPen if available, call 102/108, lay flat with legs elevated.

=== PLATFORM FEATURES YOU CAN HELP WITH ===
- How to register/login (email + password, staff needs admin approval)
- How to find and book hospital beds
- How to check blood availability and request blood
- How to track request status in "My Requests" page
- How to update profile, medical history, and emergency contacts
- How the blockchain verification works (immutable audit trail for all blood & bed operations)
- Real-time notifications via Socket.IO
- Emergency alerts system

=== RESPONSE RULES ===
1. ONLY answer health-related questions, medical queries, hospital/bed/blood questions, first aid, emergencies, and questions about THIS platform
2. If asked about non-health topics (politics, entertainment, coding, math, etc.), politely decline: "I'm a health assistant and can only help with medical and hospital-related questions."
3. Always recommend consulting a real doctor for serious conditions
4. For ANY emergency, ALWAYS provide emergency numbers: 102 (Ambulance), 108 (Emergency)
5. Be empathetic, professional, and reassuring
6. Keep responses concise but thorough
7. Use bullet points, bold text, and emojis for readability
8. When asked about hospitals, provide specific details from the hospital list above
9. When asked about blood compatibility, use the exact compatibility data above
10. You are an AI assistant — always include a disclaimer that users should consult real medical professionals
11. For questions about using the platform, provide clear step-by-step guidance
12. If a user describes severe symptoms, immediately recommend calling 102/108 before giving any other advice`;

// Function to call OpenAI API (PRIMARY)
async function callOpenAI(message, context = '') {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = context 
    ? `${HEALTH_SYSTEM_PROMPT}\n\nPrevious context: ${context}` 
    : HEALTH_SYSTEM_PROMPT;

  // Try each model in order
  for (const model of OPENAI_MODELS) {
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 1024,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          timeout: 30000
        }
      );

      if (response.data.choices && response.data.choices[0]?.message?.content) {
        console.log(`✅ OpenAI response received using model: ${model}`);
        return response.data.choices[0].message.content;
      }
    } catch (err) {
      console.error(`⚠️ OpenAI model ${model} failed:`, err.response?.data?.error?.message || err.message);
      continue;
    }
  }

  throw new Error('All OpenAI models failed');
}

// Function to call Google Gemini API (FALLBACK)
async function callGeminiAPI(message, context = '') {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const systemPrompt = context 
    ? `${HEALTH_SYSTEM_PROMPT}\n\nPrevious context: ${context}` 
    : HEALTH_SYSTEM_PROMPT;

  const response = await axios.post(
    `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ]
    },
    {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  if (response.data.candidates && response.data.candidates[0]?.content?.parts[0]?.text) {
    return response.data.candidates[0].content.parts[0].text;
  }
  
  throw new Error('Invalid response from Gemini API');
}

// @route   POST /api/ai/chat
// @desc    AI Chatbot for first aid, emergency handling
// @access  Public
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check if message is health-related
    const healthRelated = isHealthRelated(message);
    
    if (!healthRelated) {
      return res.json({
        success: true,
        data: {
          response: "⚠️ **I'm a Health Assistant**\n\nI can only help with health-related questions. I'm here to assist you with:\n\n• 🏥 First aid and emergency guidance\n• 💉 Blood donation and availability\n• 🛏️ Hospital bed information\n• 💊 General health queries\n• 🚑 Emergency response help\n\nPlease ask me something related to health or medical topics!",
          source: 'restriction',
          isHealthRelated: false,
          warning: 'This chatbot only handles health-related queries'
        }
      });
    }

    try {
      // Try OpenAI API first (PRIMARY)
      console.log('🤖 Calling OpenAI API...');
      const aiResponse = await callOpenAI(message, context);
      console.log('✅ OpenAI API response received');
      
      return res.json({
        success: true,
        data: {
          response: aiResponse,
          source: 'openai',
          isHealthRelated: true
        }
      });
    } catch (openaiError) {
      console.error('❌ OpenAI API error:', openaiError.message);
      
      // Try Google Gemini API as secondary
      try {
        console.log('🤖 Falling back to Gemini API...');
        const geminiResponse = await callGeminiAPI(message, context);
        console.log('✅ Gemini API response received');
        
        return res.json({
          success: true,
          data: {
            response: geminiResponse,
            source: 'gemini',
            isHealthRelated: true
          }
        });
      } catch (geminiError) {
        console.error('❌ Gemini API error:', geminiError.message);
        
        // Try Python AI service as tertiary backup
        try {
          const response = await axios.post(`${PYTHON_AI_URL}/chat`, {
            message,
            context,
            userId: req.user?._id
          }, { timeout: 10000 });

          return res.json({
            success: true,
            data: {
              ...response.data,
              source: 'python-ai'
            }
          });
        } catch (pythonError) {
          // Final fallback to built-in responses
          const fallbackResponse = getFallbackResponse(message);
          
          return res.json({
            success: true,
            data: {
              response: fallbackResponse,
              source: 'fallback',
              note: 'AI service temporarily unavailable. Using built-in responses.'
            }
          });
        }
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing chat request',
      error: error.message
    });
  }
});

// @route   POST /api/ai/emergency-recommendation
// @desc    Get emergency recommendations based on symptoms
// @access  Public
router.post('/emergency-recommendation', optionalAuth, async (req, res) => {
  try {
    const { symptoms, severity, location } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms are required'
      });
    }

    try {
      const response = await axios.post(`${PYTHON_AI_URL}/emergency-recommendation`, {
        symptoms,
        severity,
        location
      }, { timeout: 10000 });

      return res.json({
        success: true,
        data: response.data
      });
    } catch (aiError) {
      // Fallback recommendations
      const recommendations = getEmergencyRecommendations(symptoms, severity);
      
      return res.json({
        success: true,
        data: recommendations
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting recommendations',
      error: error.message
    });
  }
});

// @route   GET /api/ai/predict-stock
// @desc    Predict low blood stock
// @access  Staff/Admin
router.get('/predict-stock', protect, async (req, res) => {
  try {
    const BloodUnit = require('../models/BloodUnit');
    const BloodRequest = require('../models/BloodRequest');

    // Get current inventory
    const inventory = await BloodUnit.getInventorySummary();
    
    // Get recent request trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const requestTrends = await BloodRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $in: ['approved', 'fulfilled'] }
        }
      },
      {
        $group: {
          _id: '$bloodGroup',
          totalRequested: { $sum: '$unitsRequired' },
          requestCount: { $sum: 1 }
        }
      }
    ]);

    try {
      const response = await axios.post(`${PYTHON_AI_URL}/predict-stock`, {
        inventory,
        requestTrends
      }, { timeout: 10000 });

      return res.json({
        success: true,
        data: response.data
      });
    } catch (aiError) {
      // Simple prediction logic as fallback
      const predictions = predictLowStock(inventory, requestTrends);
      
      return res.json({
        success: true,
        data: predictions
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error predicting stock',
      error: error.message
    });
  }
});

// @route   POST /api/ai/priority-classification
// @desc    AI-based emergency priority classification
// @access  Private
router.post('/priority-classification', protect, async (req, res) => {
  try {
    const { patientInfo, condition, symptoms, vitalSigns } = req.body;

    try {
      const response = await axios.post(`${PYTHON_AI_URL}/priority-classification`, {
        patientInfo,
        condition,
        symptoms,
        vitalSigns
      }, { timeout: 10000 });

      return res.json({
        success: true,
        data: response.data
      });
    } catch (aiError) {
      // Fallback classification
      const classification = classifyPriority(condition, symptoms, vitalSigns);
      
      return res.json({
        success: true,
        data: classification
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error classifying priority',
      error: error.message
    });
  }
});

// @route   GET /api/ai/first-aid/:condition
// @desc    Get first aid instructions for a condition
// @access  Public
router.get('/first-aid/:condition', async (req, res) => {
  try {
    const { condition } = req.params;
    const instructions = getFirstAidInstructions(condition);

    res.json({
      success: true,
      data: instructions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching first aid instructions',
      error: error.message
    });
  }
});

// Fallback Functions
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  // Emergency keywords
  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
    return "For emergencies, please call your local emergency number immediately. If you're experiencing chest pain, difficulty breathing, or severe bleeding, seek immediate medical attention. Would you like me to help you find the nearest hospital?";
  }
  
  // First aid keywords
  if (lowerMessage.includes('first aid') || lowerMessage.includes('help')) {
    return "I can help with basic first aid guidance. Common situations include:\n• Cuts and wounds: Clean with water, apply pressure, bandage\n• Burns: Cool with running water for 10+ minutes\n• Choking: Perform back blows and abdominal thrusts\n• Fainting: Lay person flat, elevate legs\n\nWhat specific situation do you need help with?";
  }
  
  // Blood related
  if (lowerMessage.includes('blood') || lowerMessage.includes('donate')) {
    return "Blood donation is crucial for saving lives. To donate blood:\n• You must be 18-65 years old\n• Weight should be at least 50kg\n• Hemoglobin level should be adequate\n• No recent tattoos or surgeries\n\nWould you like to find a blood bank near you?";
  }
  
  // Hospital/bed related
  if (lowerMessage.includes('hospital') || lowerMessage.includes('bed')) {
    return "I can help you find available hospital beds. Please specify:\n• Your location or preferred area\n• Type of bed needed (General, ICU, Emergency)\n• Any specific requirements\n\nWould you like me to show available beds in your area?";
  }
  
  // Default response
  return "I'm your healthcare assistant. I can help you with:\n• First aid guidance\n• Finding nearby hospitals\n• Checking bed availability\n• Blood bank information\n• Emergency assistance\n\nHow can I assist you today?";
}

function getEmergencyRecommendations(symptoms, severity) {
  const recommendations = {
    priority: 'medium',
    action: 'consult',
    immediateSteps: [],
    warnings: [],
    suggestedSpecialty: 'General Medicine'
  };

  const symptomLower = symptoms.map(s => s.toLowerCase());

  // High priority symptoms
  if (symptomLower.includes('chest pain') || symptomLower.includes('difficulty breathing')) {
    recommendations.priority = 'critical';
    recommendations.action = 'emergency';
    recommendations.immediateSteps = [
      'Call emergency services immediately',
      'If chest pain: Have patient sit upright, loosen clothing',
      'If available, give aspirin (unless allergic)',
      'Stay calm and monitor breathing'
    ];
    recommendations.suggestedSpecialty = 'Cardiology/Emergency';
  }
  
  // Bleeding
  if (symptomLower.includes('bleeding') || symptomLower.includes('wound')) {
    recommendations.priority = severity === 'severe' ? 'high' : 'medium';
    recommendations.immediateSteps = [
      'Apply direct pressure with clean cloth',
      'Elevate the injured area if possible',
      'Do not remove embedded objects',
      'Seek medical attention for deep wounds'
    ];
    recommendations.suggestedSpecialty = 'Emergency/Surgery';
  }

  // Fever
  if (symptomLower.includes('fever') || symptomLower.includes('high temperature')) {
    recommendations.priority = severity === 'severe' ? 'high' : 'low';
    recommendations.immediateSteps = [
      'Take temperature reading',
      'Stay hydrated',
      'Rest in cool environment',
      'Take appropriate fever medication'
    ];
    recommendations.warnings = [
      'Seek immediate care if fever exceeds 103°F (39.4°C)',
      'Watch for signs of dehydration'
    ];
  }

  return recommendations;
}

function predictLowStock(inventory, requestTrends) {
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const predictions = [];

  bloodGroups.forEach(group => {
    const currentStock = inventory.find(i => i._id === group)?.totalUnits || 0;
    const trend = requestTrends.find(t => t._id === group);
    const avgDailyDemand = trend ? trend.totalRequested / 30 : 0.5;
    
    const daysUntilEmpty = currentStock > 0 ? Math.floor(currentStock / avgDailyDemand) : 0;
    
    predictions.push({
      bloodGroup: group,
      currentStock,
      avgDailyDemand: avgDailyDemand.toFixed(2),
      predictedDaysUntilLow: daysUntilEmpty,
      status: daysUntilEmpty < 7 ? 'critical' : daysUntilEmpty < 14 ? 'warning' : 'normal',
      recommendation: daysUntilEmpty < 7 
        ? 'Urgent: Organize blood donation drive'
        : daysUntilEmpty < 14 
        ? 'Consider restocking soon'
        : 'Stock levels adequate'
    });
  });

  return {
    predictions,
    summary: {
      critical: predictions.filter(p => p.status === 'critical').length,
      warning: predictions.filter(p => p.status === 'warning').length,
      normal: predictions.filter(p => p.status === 'normal').length
    }
  };
}

function classifyPriority(condition, symptoms, vitalSigns) {
  let priorityScore = 3; // Default medium priority

  // Critical conditions
  const criticalConditions = ['heart attack', 'stroke', 'severe bleeding', 'cardiac arrest', 'trauma'];
  if (criticalConditions.some(c => condition?.toLowerCase().includes(c))) {
    priorityScore = 1;
  }

  // Vital signs assessment
  if (vitalSigns) {
    if (vitalSigns.bloodPressure?.systolic > 180 || vitalSigns.bloodPressure?.systolic < 90) {
      priorityScore = Math.min(priorityScore, 1);
    }
    if (vitalSigns.heartRate > 150 || vitalSigns.heartRate < 40) {
      priorityScore = Math.min(priorityScore, 1);
    }
    if (vitalSigns.oxygenSaturation < 90) {
      priorityScore = Math.min(priorityScore, 1);
    }
  }

  const priorityLabels = {
    1: { level: 'Critical', color: 'red', action: 'Immediate attention required' },
    2: { level: 'High', color: 'orange', action: 'Urgent care needed within 30 minutes' },
    3: { level: 'Medium', color: 'yellow', action: 'Care needed within 1-2 hours' },
    4: { level: 'Low', color: 'green', action: 'Non-urgent, can wait' },
    5: { level: 'Minimal', color: 'blue', action: 'Scheduled appointment recommended' }
  };

  return {
    priority: priorityScore,
    ...priorityLabels[priorityScore],
    assessmentNote: 'This is an AI-assisted assessment. Always consult medical professionals for accurate diagnosis.'
  };
}

function getFirstAidInstructions(condition) {
  const instructions = {
    'burns': {
      title: 'Burns First Aid',
      steps: [
        'Cool the burn under cool (not cold) running water for at least 10 minutes',
        'Remove any jewelry or tight clothing near the burn',
        'Cover with a sterile, non-fluffy bandage or cling film',
        'Do not apply ice, butter, or ointments',
        'Take pain relievers if needed',
        'Seek medical attention for severe burns'
      ],
      warnings: ['Do not break blisters', 'Do not remove stuck clothing']
    },
    'choking': {
      title: 'Choking First Aid',
      steps: [
        'Encourage coughing if the person can still breathe',
        'Give up to 5 back blows between shoulder blades',
        'Give up to 5 abdominal thrusts (Heimlich maneuver)',
        'Alternate between back blows and abdominal thrusts',
        'Call emergency services if obstruction is not cleared'
      ],
      warnings: ['Do not give abdominal thrusts to infants or pregnant women']
    },
    'bleeding': {
      title: 'Bleeding First Aid',
      steps: [
        'Apply direct pressure with a clean cloth',
        'Keep the injured area elevated above heart level',
        'Add more cloth if blood soaks through',
        'Once bleeding stops, secure with bandage',
        'Seek medical attention for deep wounds'
      ],
      warnings: ['Do not remove embedded objects', 'Watch for signs of shock']
    },
    'fracture': {
      title: 'Fracture First Aid',
      steps: [
        'Keep the injured area still - do not move',
        'Apply ice pack wrapped in cloth to reduce swelling',
        'Immobilize the area with splint if trained',
        'Do not try to realign the bone',
        'Seek immediate medical attention'
      ],
      warnings: ['Do not move the person if spine injury is suspected']
    },
    'default': {
      title: 'General First Aid',
      steps: [
        'Stay calm and assess the situation',
        'Ensure the scene is safe',
        'Call emergency services if needed',
        'Provide basic care and comfort',
        'Monitor the person until help arrives'
      ],
      warnings: ['Do not move injured persons unless necessary']
    }
  };

  return instructions[condition.toLowerCase()] || instructions['default'];
}

// @route   POST /api/ai/severity-detection
// @desc    Deep Learning-Based Emergency Severity Detection
// @access  Public
router.post('/severity-detection', optionalAuth, async (req, res) => {
  try {
    const { description, symptoms, vitals } = req.body;

    if (!description && (!symptoms || symptoms.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symptom description or list of symptoms'
      });
    }

    try {
      const response = await axios.post(`${PYTHON_AI_URL}/api/ai/severity-detection`, {
        description,
        symptoms,
        vitals
      }, { timeout: 15000 });

      return res.json({
        success: true,
        data: response.data.data
      });
    } catch (aiError) {
      // Fallback severity detection
      const severityResult = fallbackSeverityDetection(description, symptoms);
      
      return res.json({
        success: true,
        data: severityResult
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analyzing severity',
      error: error.message
    });
  }
});

// @route   POST /api/ai/voice-process
// @desc    Process voice input and provide response
// @access  Public
router.post('/voice-process', optionalAuth, async (req, res) => {
  try {
    const { transcript, context } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: 'No transcript provided'
      });
    }

    try {
      const response = await axios.post(`${PYTHON_AI_URL}/api/ai/voice-process`, {
        transcript,
        context
      }, { timeout: 15000 });

      return res.json({
        success: true,
        data: response.data.data
      });
    } catch (aiError) {
      // Fallback to chat
      const chatResponse = getFallbackResponse(transcript);
      
      return res.json({
        success: true,
        data: {
          response: chatResponse,
          is_emergency: false,
          source: 'fallback'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing voice input',
      error: error.message
    });
  }
});

// @route   POST /api/ai/triage
// @desc    Emergency Triage System
// @access  Staff/Admin
router.post('/triage', protect, async (req, res) => {
  try {
    const { age, gender, symptoms, description, vitals, medical_history, allergies } = req.body;

    try {
      const response = await axios.post(`${PYTHON_AI_URL}/api/ai/triage`, {
        age,
        gender,
        symptoms,
        description,
        vitals,
        medical_history,
        allergies
      }, { timeout: 15000 });

      return res.json({
        success: true,
        data: response.data.data
      });
    } catch (aiError) {
      // Fallback triage
      const triageResult = fallbackTriage(symptoms, description, vitals);
      
      return res.json({
        success: true,
        data: triageResult
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error performing triage',
      error: error.message
    });
  }
});

// Fallback severity detection
function fallbackSeverityDetection(description, symptoms) {
  const emergencyKeywords = ['not breathing', 'unconscious', 'chest pain', 'severe bleeding', 
                           'heart attack', 'stroke', 'choking'];
  const severeKeywords = ['difficulty breathing', 'high fever', 'severe pain', 'head injury'];
  
  const text = (description || '') + ' ' + (symptoms || []).join(' ');
  const lowerText = text.toLowerCase();
  
  let severityLevel = 'low';
  let severityScore = 20;
  
  if (emergencyKeywords.some(k => lowerText.includes(k))) {
    severityLevel = 'critical';
    severityScore = 90;
  } else if (severeKeywords.some(k => lowerText.includes(k))) {
    severityLevel = 'severe';
    severityScore = 70;
  } else if (text.length > 50) {
    severityLevel = 'moderate';
    severityScore = 50;
  } else if (text.length > 20) {
    severityLevel = 'mild';
    severityScore = 30;
  }
  
  return {
    severity_level: severityLevel,
    severity_score: severityScore,
    severity_info: {
      level: severityLevel === 'critical' ? 5 : severityLevel === 'severe' ? 4 : 
             severityLevel === 'moderate' ? 3 : severityLevel === 'mild' ? 2 : 1,
      action: severityLevel === 'critical' ? 'IMMEDIATE EMERGENCY - Call 102/108 NOW' :
              severityLevel === 'severe' ? 'URGENT - Seek immediate medical attention' :
              'Monitor symptoms and consult doctor if needed'
    },
    detected_symptoms: [],
    recommendations: [
      'Seek appropriate medical attention',
      'Monitor your symptoms',
      'Stay hydrated',
      'Rest adequately'
    ],
    requires_immediate_attention: ['critical', 'severe'].includes(severityLevel),
    emergency_numbers: {
      ambulance: '102/108',
      police: '100',
      fire: '101'
    }
  };
}

// Fallback triage
function fallbackTriage(symptoms, description, vitals) {
  const severity = fallbackSeverityDetection(description, symptoms);
  
  const triageCategories = {
    critical: { category: 'RED', priority: 1, wait_time: 'Immediate' },
    severe: { category: 'ORANGE', priority: 2, wait_time: '< 15 minutes' },
    moderate: { category: 'YELLOW', priority: 3, wait_time: '< 60 minutes' },
    mild: { category: 'GREEN', priority: 4, wait_time: '< 2 hours' },
    low: { category: 'BLUE', priority: 5, wait_time: 'Non-urgent' }
  };
  
  const triage = triageCategories[severity.severity_level] || triageCategories.mild;
  
  return {
    triage_category: triage.category,
    priority_level: triage.priority,
    expected_wait_time: triage.wait_time,
    suggested_department: severity.severity_level === 'critical' ? 'Emergency/Trauma' : 'General OPD',
    severity_analysis: severity,
    timestamp: new Date().toISOString()
  };
}

module.exports = router;
