"""
AI Health Assistant Service
Flask-based REST API for health-related AI assistance
With Google Gemini AI Integration and Emergency Severity Detection
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import re
import json
import math
import requests

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])

# ============================================================================
# OPENAI AI INTEGRATION
# ============================================================================

# Initialize OpenAI configuration
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions"

# Available models (in order of preference)
AI_MODELS = [
    "gpt-4o-mini",
    "gpt-3.5-turbo"
]

if OPENAI_API_KEY:
    print("OpenAI client configured")
else:
    print("OpenAI API key is not configured; using fallback responses")

# System prompt for health assistant
HEALTH_ASSISTANT_PROMPT = """You are **HealthWise AI**, the intelligent health assistant for the **Blockchain-Enabled Intelligent Hospital Bed and Blood Resource Management System** — a full-stack healthcare platform serving the Kurnool district of Andhra Pradesh, India.

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
1. Government General Hospital (GGH) Kurnool — Budhawarpet Road, 518002 | Government | 250 beds | Blood Bank: Yes | Rating: 4.2
2. Kurnool Medical College Teaching Hospital — KMC Campus, 518002 | Government | 300 beds | Blood Bank: Yes | Rating: 4.5
3. Apollo Medical Centre Kurnool — NR Peta Area, 518004 | Private | 150 beds | Blood Bank: Yes | Rating: 4.6
4. Venkateswara Hospital — Kurnool Bazar, 518001 | Private | 100 beds | Blood Bank: Yes | Rating: 4.3
5. Asha Children's Hospital — Budhawarpet Area, 518002 | Private | 60 beds | No Blood Bank | Rating: 4.4
6. KIMS Hospital Kurnool — One Town Area, 518001 | Private | 200 beds | Blood Bank: Yes | Rating: 4.7
7. Omni Hospital Kurnool — NR Peta, 518004 | Private | 120 beds | Blood Bank: Yes | Rating: 4.4
8. Sree Ashwini Hospital — Shilpa Birla Area, 518002 | Private | 80 beds | Blood Bank: Yes | Rating: 4.3
9. Sri Balaji Nursing Home — Kurnool Bazar, 518001 | Private | 40 beds | No Blood Bank | Rating: 4.1
10. Aarka Hospital — Budhawarpet, 518002 | Private | 90 beds | Blood Bank: Yes | Rating: 4.2

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

Blood Group Compatibility:
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
1. Admin (admin@hospital.com): Full system management — approve hospitals/staff, manage users, view analytics, blockchain verification, emergency alerts
2. Staff (hospital employees): Manage blood inventory, process requests, manage beds for their assigned hospital. Requires admin approval.
3. User (patients/public): Search beds, check blood, book beds, request blood, use AI chatbot, manage profile. Auto-approved on registration.

=== EMERGENCY INFORMATION ===
Indian Emergency Numbers:
- Ambulance: 102 / 108
- Police: 100
- Fire: 101
- Women Helpline: 181
- Disaster Management: 1078

Emergency Severity Levels:
- CRITICAL (Score 90-100%): Not breathing, no pulse, heart attack, stroke, severe bleeding, choking — CALL 102/108 IMMEDIATELY
- SEVERE (Score 70-85%): Difficulty breathing, severe pain, high fever >103°F, head injury, broken bones, poisoning — URGENT medical attention
- MODERATE (Score 40-65%): Fever, persistent pain, dizziness, vomiting, diarrhea, infections, wounds — See doctor within 24 hours
- MILD (Score 10-35%): Headache, cold, sore throat, fatigue, minor cuts — Home care, monitor symptoms
- LOW (Score 0-10%): Minor discomfort — Self-care recommended

=== FIRST AID KNOWLEDGE ===
Burns: Cool under running water 10-20 min, don't apply ice/butter, cover with clean material. 3rd degree = EMERGENCY.
Choking: Encourage coughing. If can't breathe: Heimlich maneuver (fist above navel, upward thrusts). Unconscious = CPR + call 102.
Bleeding: Direct pressure with clean cloth, elevate, don't remove cloth, add more. Severe = tourniquet + call 102.
CPR (Adult): 30 compressions (center of chest, 2 inches deep, 100-120/min) + 2 rescue breaths. Don't stop until help arrives.
Heart Attack: Call 102/108, sit comfortably, loosen clothing, chew aspirin 325mg if available. Warning signs: crushing chest pressure, pain to arm/jaw/back.
Stroke: FAST method — Face drooping, Arm weakness, Speech difficulty, Time to call 102/108.
Fever: Paracetamol 500-1000mg every 6hrs, hydrate, rest, cool compress. Seek help if >103°F or lasts >3 days.
Fractures: Don't move the injury, apply ice wrapped in cloth, immobilize, seek medical help immediately.
Snake Bite: Keep calm, immobilize limb, don't cut/suck wound, remove jewelry, get to hospital ASAP.
Seizures: Clear area, don't restrain, don't put anything in mouth, turn on side, time it, call 102 if >5 min.
Poisoning: Call 102/108, don't induce vomiting unless told by doctor, save container/substance info.
Drowning: Remove from water, check breathing, CPR if needed, call 102/108.
Electric Shock: Don't touch person if still in contact with source, turn off power, CPR if needed.
Heatstroke: Move to shade, cool with water, fan, ice packs on neck/armpits, call 102 if temp >104°F.
Allergic Reaction (Anaphylaxis): Use EpiPen if available, call 102/108, lay flat with legs elevated.

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
2. If asked about non-health topics (politics, entertainment, coding, math, etc.), politely decline
3. Always recommend consulting a real doctor for serious conditions
4. For ANY emergency, ALWAYS provide emergency numbers: 102 (Ambulance), 108 (Emergency)
5. Be empathetic, professional, and reassuring
6. Keep responses concise but thorough
7. Use bullet points, bold text, and emojis for readability
8. When asked about hospitals, provide specific details from the hospital list above
9. When asked about blood compatibility, use the exact compatibility data above
10. You are an AI assistant — always include a disclaimer that users should consult real medical professionals
11. For questions about using the platform, provide clear step-by-step guidance
12. If a user describes severe symptoms, immediately recommend calling 102/108 before giving any other advice"""

def get_gemini_response(user_message, _conversation_history=None):
    """Get response from OpenAI with fallback models"""
    if not OPENAI_API_KEY:
        return {
            'success': False,
            'error': 'OPENAI_API_KEY not configured',
            'response': get_intelligent_fallback(user_message)
        }
    
    # Build the messages for OpenAI
    messages = [
        {"role": "system", "content": HEALTH_ASSISTANT_PROMPT},
        {"role": "user", "content": user_message}
    ]
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Try each model until one works
    last_error = None
    for model in AI_MODELS:
        try:
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": 1024,
                "temperature": 0.7
            }
            
            response = requests.post(
                OPENAI_BASE_URL,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result['choices'][0]['message']['content']
                return {
                    'success': True,
                    'response': ai_response,
                    'model': model
                }
            else:
                last_error = f"Status {response.status_code}: {response.text[:100]}"
                print(f"⚠️ Model {model} failed: {last_error}")
                if response.status_code in (400, 401, 403):
                    break
                continue
                
        except Exception as e:
            last_error = str(e)
            print(f"⚠️ Model {model} failed: {last_error[:100]}")
            continue
    
    # All models failed, use intelligent fallback
    print("❌ All OpenAI models failed. Using intelligent fallback.")
    return {
        'success': False,
        'error': last_error,
        'response': get_intelligent_fallback(user_message)
    }

def get_intelligent_fallback(message):
    """Intelligent fallback using the existing analyze_message function"""
    result = analyze_message(message)
    return result['response']

def get_fallback_response(_message):
    """Basic fallback response when Gemini is unavailable"""
    return f"""I apologize, but I'm having trouble connecting to my AI services right now.

For immediate help:
🚨 **Emergency Numbers:**
• Ambulance: 102 / 108
• Police: 100
• Fire: 101

Please try again in a moment, or contact the hospital directly for urgent matters."""

# ============================================================================
# DEEP LEARNING-BASED EMERGENCY SEVERITY DETECTION
# ============================================================================

class EmergencySeverityDetector:
    """
    Deep Learning-inspired Emergency Severity Detection System
    Uses weighted symptom analysis and pattern matching for severity classification
    """
    
    # Severity levels
    SEVERITY_LEVELS = {
        'critical': {'level': 5, 'color': 'red', 'action': 'IMMEDIATE EMERGENCY - Call 102/108 NOW'},
        'severe': {'level': 4, 'color': 'orange', 'action': 'URGENT - Seek immediate medical attention'},
        'moderate': {'level': 3, 'color': 'yellow', 'action': 'Visit doctor within 24 hours'},
        'mild': {'level': 2, 'color': 'blue', 'action': 'Monitor symptoms, home care advised'},
        'low': {'level': 1, 'color': 'green', 'action': 'Self-care recommended'}
    }
    
    # Symptom weights for severity calculation (simulating neural network weights)
    SYMPTOM_WEIGHTS = {
        # Critical symptoms (weight: 0.9-1.0)
        'not breathing': 1.0,
        'no pulse': 1.0,
        'unconscious': 0.95,
        'severe bleeding': 0.95,
        'chest pain': 0.9,
        'heart attack': 1.0,
        'stroke': 1.0,
        'choking': 0.95,
        'anaphylaxis': 0.95,
        'seizure': 0.85,
        
        # Severe symptoms (weight: 0.7-0.85)
        'difficulty breathing': 0.85,
        'severe pain': 0.8,
        'high fever': 0.75,
        'vomiting blood': 0.85,
        'head injury': 0.8,
        'broken bone': 0.75,
        'burns': 0.7,
        'poisoning': 0.85,
        'allergic reaction': 0.75,
        'confusion': 0.7,
        
        # Moderate symptoms (weight: 0.4-0.65)
        'fever': 0.5,
        'persistent pain': 0.55,
        'dizziness': 0.45,
        'nausea': 0.4,
        'vomiting': 0.5,
        'diarrhea': 0.45,
        'rash': 0.4,
        'swelling': 0.5,
        'infection': 0.55,
        'wound': 0.5,
        
        # Mild symptoms (weight: 0.1-0.35)
        'headache': 0.3,
        'cold': 0.2,
        'cough': 0.25,
        'sore throat': 0.2,
        'fatigue': 0.25,
        'mild pain': 0.3,
        'runny nose': 0.15,
        'sneezing': 0.1
    }
    
    # Vital signs thresholds
    VITAL_THRESHOLDS = {
        'temperature': {'critical_high': 104, 'severe_high': 102, 'normal_high': 99.5, 'normal_low': 97},
        'heart_rate': {'critical_high': 150, 'severe_high': 120, 'normal_high': 100, 'normal_low': 60, 'critical_low': 40},
        'blood_pressure_systolic': {'critical_high': 180, 'severe_high': 160, 'normal_high': 140, 'normal_low': 90, 'critical_low': 70},
        'oxygen_level': {'critical_low': 90, 'severe_low': 93, 'normal_low': 95}
    }
    
    def __init__(self):
        self.symptom_patterns = self._build_patterns()
    
    def _build_patterns(self):
        """Build regex patterns for symptom detection"""
        patterns = {}
        for symptom in self.SYMPTOM_WEIGHTS.keys():
            # Create flexible pattern that matches variations
            words = symptom.split()
            pattern = r'\b' + r'\s*'.join(words) + r'\b'
            patterns[symptom] = re.compile(pattern, re.IGNORECASE)
        return patterns
    
    def detect_symptoms(self, text):
        """Detect symptoms in text using pattern matching"""
        detected = []
        text_lower = text.lower()
        
        for symptom, pattern in self.symptom_patterns.items():
            if pattern.search(text_lower) or symptom in text_lower:
                detected.append({
                    'symptom': symptom,
                    'weight': self.SYMPTOM_WEIGHTS[symptom]
                })
        
        return detected
    
    def calculate_severity_score(self, symptoms, vitals=None):
        """
        Calculate severity score using weighted sum (simulating neural network output)
        Uses sigmoid activation for final score
        """
        if not symptoms:
            return 0.1
        
        # Weighted sum of symptoms
        total_weight = sum(s['weight'] for s in symptoms)
        max_weight = max(s['weight'] for s in symptoms)
        
        # Neural network-like calculation
        # Layer 1: Weighted average
        avg_weight = total_weight / len(symptoms) if symptoms else 0
        
        # Layer 2: Factor in max severity and symptom count
        symptom_count_factor = min(len(symptoms) / 5, 1.0)  # Cap at 5 symptoms
        
        # Layer 3: Combine features
        raw_score = (max_weight * 0.5) + (avg_weight * 0.3) + (symptom_count_factor * 0.2)
        
        # Add vital signs contribution if provided
        if vitals:
            vital_score = self._evaluate_vitals(vitals)
            raw_score = (raw_score * 0.7) + (vital_score * 0.3)
        
        # Sigmoid activation for final score (0-1)
        severity_score = 1 / (1 + math.exp(-10 * (raw_score - 0.5)))
        
        return severity_score
    
    def _evaluate_vitals(self, vitals):
        """Evaluate vital signs and return severity contribution"""
        score = 0
        checks = 0
        
        if 'temperature' in vitals:
            temp = vitals['temperature']
            thresholds = self.VITAL_THRESHOLDS['temperature']
            if temp >= thresholds['critical_high']:
                score += 1.0
            elif temp >= thresholds['severe_high']:
                score += 0.7
            elif temp >= thresholds['normal_high']:
                score += 0.3
            checks += 1
        
        if 'heart_rate' in vitals:
            hr = vitals['heart_rate']
            thresholds = self.VITAL_THRESHOLDS['heart_rate']
            if hr >= thresholds['critical_high'] or hr <= thresholds['critical_low']:
                score += 1.0
            elif hr >= thresholds['severe_high']:
                score += 0.7
            elif hr >= thresholds['normal_high'] or hr < thresholds['normal_low']:
                score += 0.3
            checks += 1
        
        if 'oxygen_level' in vitals:
            o2 = vitals['oxygen_level']
            thresholds = self.VITAL_THRESHOLDS['oxygen_level']
            if o2 <= thresholds['critical_low']:
                score += 1.0
            elif o2 <= thresholds['severe_low']:
                score += 0.7
            elif o2 < thresholds['normal_low']:
                score += 0.3
            checks += 1
        
        return score / checks if checks > 0 else 0
    
    def classify_severity(self, score):
        """Classify severity level based on score"""
        if score >= 0.8:
            return 'critical'
        elif score >= 0.6:
            return 'severe'
        elif score >= 0.4:
            return 'moderate'
        elif score >= 0.2:
            return 'mild'
        else:
            return 'low'
    
    def get_recommendations(self, severity_level, symptoms):
        """Get recommendations based on severity and symptoms"""
        base_recommendations = {
            'critical': [
                'Call emergency services (102/108) IMMEDIATELY',
                'Do not move the patient unless in danger',
                'Keep the patient calm and still',
                'Clear the airway if needed',
                'Begin CPR if no pulse/breathing'
            ],
            'severe': [
                'Seek immediate medical attention',
                'Go to nearest emergency room',
                'Call ahead to hospital if possible',
                'Keep monitoring vital signs',
                'Do not drive yourself - get help'
            ],
            'moderate': [
                'Visit a doctor within 24 hours',
                'Monitor symptoms closely',
                'Rest and stay hydrated',
                'Take prescribed medications',
                'Seek emergency care if symptoms worsen'
            ],
            'mild': [
                'Home care is usually sufficient',
                'Rest and stay hydrated',
                'Over-the-counter medications may help',
                'Monitor for any changes',
                'Consult doctor if symptoms persist beyond 3 days'
            ],
            'low': [
                'Self-care at home recommended',
                'Get adequate rest',
                'Stay hydrated',
                'Use home remedies as appropriate',
                'No immediate medical attention needed'
            ]
        }
        
        return base_recommendations.get(severity_level, base_recommendations['mild'])
    
    def analyze(self, text, vitals=None):
        """Main analysis function"""
        # Detect symptoms
        symptoms = self.detect_symptoms(text)
        
        # Calculate severity score
        score = self.calculate_severity_score(symptoms, vitals)
        
        # Classify severity
        severity_level = self.classify_severity(score)
        severity_info = self.SEVERITY_LEVELS[severity_level]
        
        # Get recommendations
        recommendations = self.get_recommendations(severity_level, symptoms)
        
        return {
            'severity_level': severity_level,
            'severity_score': round(score * 100, 1),
            'severity_info': severity_info,
            'detected_symptoms': symptoms,
            'recommendations': recommendations,
            'requires_immediate_attention': severity_level in ['critical', 'severe'],
            'emergency_numbers': {
                'ambulance': '102/108',
                'police': '100',
                'fire': '101'
            }
        }

# Initialize the severity detector
severity_detector = EmergencySeverityDetector()

# Health knowledge base for common queries
HEALTH_KNOWLEDGE = {
    'fever': {
        'symptoms': ['high temperature', 'chills', 'sweating', 'headache', 'muscle aches'],
        'recommendations': [
            'Take paracetamol (500-1000mg) every 6 hours',
            'Stay hydrated - drink plenty of fluids',
            'Rest and avoid strenuous activity',
            'Use a cool compress on forehead',
            'Wear light clothing'
        ],
        'warning_signs': [
            'Temperature above 103°F (39.4°C)',
            'Fever lasting more than 3 days',
            'Severe headache or neck stiffness',
            'Difficulty breathing',
            'Rash or confusion'
        ]
    },
    'headache': {
        'symptoms': ['throbbing pain', 'pressure', 'sensitivity to light', 'nausea'],
        'recommendations': [
            'Rest in a quiet, dark room',
            'Apply cold or warm compress',
            'Take over-the-counter pain relievers',
            'Stay hydrated',
            'Practice relaxation techniques'
        ],
        'warning_signs': [
            'Sudden severe headache',
            'Headache with fever and stiff neck',
            'Headache after head injury',
            'Vision changes or confusion',
            'Numbness or weakness'
        ]
    },
    'cold': {
        'symptoms': ['runny nose', 'sneezing', 'sore throat', 'mild cough', 'congestion'],
        'recommendations': [
            'Rest and sleep well',
            'Drink warm fluids like soup and tea',
            'Gargle with salt water for sore throat',
            'Use saline nasal drops',
            'Take vitamin C supplements'
        ],
        'warning_signs': [
            'Symptoms lasting more than 10 days',
            'High fever (above 101.3°F)',
            'Severe sinus pain',
            'Difficulty breathing',
            'Worsening symptoms after improvement'
        ]
    },
    'cough': {
        'symptoms': ['persistent cough', 'throat irritation', 'mucus production'],
        'recommendations': [
            'Stay hydrated',
            'Use honey for soothing (adults only)',
            'Try cough drops or lozenges',
            'Use a humidifier',
            'Avoid irritants like smoke'
        ],
        'warning_signs': [
            'Cough lasting more than 3 weeks',
            'Coughing up blood',
            'Difficulty breathing',
            'Chest pain',
            'Unexplained weight loss'
        ]
    },
    'stomach': {
        'symptoms': ['nausea', 'vomiting', 'diarrhea', 'cramps', 'bloating'],
        'recommendations': [
            'Stay hydrated with clear fluids',
            'Eat bland foods (BRAT diet)',
            'Avoid dairy and fatty foods',
            'Rest your stomach for a few hours',
            'Take ORS if dehydrated'
        ],
        'warning_signs': [
            'Blood in vomit or stool',
            'Severe abdominal pain',
            'High fever with stomach symptoms',
            'Signs of dehydration',
            'Symptoms lasting more than 48 hours'
        ]
    }
}

# Emergency responses
EMERGENCY_RESPONSES = {
    'heart_attack': {
        'keywords': ['chest pain', 'heart attack', 'cardiac', 'heart pain'],
        'response': '''🫀 **POSSIBLE HEART ATTACK**

**Call 102/108 IMMEDIATELY**

**While waiting for help:**
1. Have the person sit or lie down comfortably
2. Loosen any tight clothing
3. If prescribed, help them take aspirin (325mg) - chew, don't swallow
4. Keep them calm and monitor breathing
5. Be ready to perform CPR if they become unconscious

**Warning Signs:**
• Crushing pressure in chest
• Pain spreading to arm, jaw, or back
• Shortness of breath
• Cold sweats
• Nausea

⚠️ Don't wait - every minute counts!'''
    },
    'stroke': {
        'keywords': ['stroke', 'face drooping', 'slurred speech', 'arm weakness'],
        'response': '''🧠 **POSSIBLE STROKE - ACT F.A.S.T.**

**Call 102/108 IMMEDIATELY**

**F.A.S.T. Check:**
• **F**ace: Ask to smile. Is one side drooping?
• **A**rms: Ask to raise both arms. Does one drift down?
• **S**peech: Ask to repeat a phrase. Is it slurred?
• **T**ime: Note the time symptoms started

**While waiting:**
1. Keep the person lying down with head slightly elevated
2. Don't give food, water, or medication
3. Note the time symptoms began
4. Stay calm and reassure them

⚠️ Time is critical - brain cells die every minute!'''
    },
    'choking': {
        'keywords': ['choking', 'cant breathe', 'airway blocked'],
        'response': '''😮 **CHOKING EMERGENCY**

**If person CAN cough:** Encourage coughing

**If person CANNOT breathe or cough:**

**Heimlich Maneuver (Adults):**
1. Stand behind the person
2. Make a fist above their navel
3. Grasp fist with other hand
4. Give quick upward thrusts
5. Repeat until object comes out

**For Unconscious Person:**
• Call 102/108
• Begin CPR
• Check mouth before each breath

⚠️ Seek medical evaluation after choking!'''
    },
    'bleeding': {
        'keywords': ['bleeding', 'blood loss', 'wound', 'cut'],
        'response': '''🩹 **SEVERE BLEEDING**

**Immediate Steps:**
1. Apply direct pressure with clean cloth
2. Keep injured part elevated if possible
3. Don't remove the cloth - add more if needed
4. If blood soaks through, apply more pressure
5. For severe limb bleeding, apply tourniquet above wound

**Call 102/108 if:**
• Blood is spurting
• Bleeding won't stop after 10 minutes
• Person shows signs of shock (pale, cold, confused)

⚠️ Keep pressure until help arrives!'''
    },
    'burn': {
        'keywords': ['burn', 'scalded', 'fire', 'hot water'],
        'response': '''🔥 **BURN EMERGENCY**

**Immediate Steps:**
1. Remove from heat source
2. Cool burn under running water for 10-20 minutes
3. Remove jewelry/clothing near burn (unless stuck)
4. Cover with clean, non-fluffy material
5. DON'T apply ice, butter, or creams

**Burn Severity:**
• 1st Degree: Red, no blisters - home treatment OK
• 2nd Degree: Blisters - may need medical care
• 3rd Degree: White/charred - EMERGENCY

⚠️ Seek immediate help for burns on face, hands, feet, or joints'''
    }
}

# First aid tips
FIRST_AID_TIPS = [
    "Always call emergency services (102/108) for serious injuries",
    "Keep a first aid kit at home and learn how to use it",
    "Learn CPR - it can save lives",
    "Don't move someone with a suspected spine injury",
    "For burns, cool with water for at least 10 minutes",
    "Apply pressure to stop bleeding",
    "Keep the injured person calm and warm",
    "Don't give food or water to someone who may need surgery"
]


def analyze_message(message):
    """Analyze the user's message and generate appropriate response"""
    message_lower = message.lower()
    
    # Check for emergency keywords first
    for emergency_type, data in EMERGENCY_RESPONSES.items():
        if any(keyword in message_lower for keyword in data['keywords']):
            return {
                'type': 'emergency',
                'response': data['response'],
                'priority': 'high'
            }
    
    # Check for health topics
    for topic, info in HEALTH_KNOWLEDGE.items():
        if topic in message_lower or any(symptom in message_lower for symptom in info['symptoms']):
            response = f"📋 **About {topic.title()}**\n\n"
            response += "**Common Symptoms:**\n"
            for symptom in info['symptoms']:
                response += f"• {symptom}\n"
            response += "\n**Recommendations:**\n"
            for rec in info['recommendations']:
                response += f"• {rec}\n"
            response += "\n**⚠️ Seek medical help if you experience:**\n"
            for warning in info['warning_signs']:
                response += f"• {warning}\n"
            
            return {
                'type': 'health_info',
                'response': response,
                'priority': 'medium'
            }
    
    # Check for blood-related queries
    if any(word in message_lower for word in ['blood', 'donate', 'transfusion', 'blood group']):
        return {
            'type': 'blood_info',
            'response': '''🩸 **Blood Information**

I can help you with blood-related queries!

**Blood Groups:**
• A+ (universal plasma donor)
• A-, B+, B-, AB+, AB-
• O- (universal red cell donor)
• O+ (most common)

**You can:**
• Check blood availability in your area
• Request blood through the system
• Find nearest blood banks

Would you like specific help with blood availability or donation?''',
            'priority': 'low'
        }
    
    # Check for hospital/bed queries
    if any(word in message_lower for word in ['hospital', 'bed', 'admission', 'icu', 'room']):
        return {
            'type': 'hospital_info',
            'response': '''🏥 **Hospital Information**

I can help you find hospital resources!

**Available Services:**
• Find available hospital beds
• Book beds online
• Check ICU availability
• View hospital locations

**Bed Types:**
• General Ward
• ICU (Intensive Care Unit)
• Private Rooms
• Semi-Private Rooms

Would you like me to help you find available beds?''',
            'priority': 'low'
        }
    
    # Greeting responses
    if any(word in message_lower for word in ['hello', 'hi', 'hey', 'good morning', 'good evening']):
        return {
            'type': 'greeting',
            'response': '''Hello! 👋

I'm your AI Health Assistant. I can help you with:

• 🚨 Emergency first aid guidance
• 🏥 Finding hospital beds
• 🩸 Blood availability information
• ❤️ General health advice

What can I help you with today?''',
            'priority': 'low'
        }
    
    # Thank you response
    if any(word in message_lower for word in ['thank', 'thanks', 'helpful']):
        import random
        tip = random.choice(FIRST_AID_TIPS)
        return {
            'type': 'acknowledgment',
            'response': f'''You're welcome! 😊

**Health Tip:** {tip}

Remember emergency numbers:
• Ambulance: 102/108
• Police: 100
• Fire: 101

Is there anything else I can help you with?''',
            'priority': 'low'
        }
    
    # Default response
    return {
        'type': 'general',
        'response': f'''I understand you're asking about: "{message}"

I can best help you with:
1. 🚨 Emergency first aid instructions
2. 🏥 Finding hospital beds
3. 🩸 Blood availability
4. ❤️ General health guidance

Could you please tell me more about what you need help with?

**Quick Topics:**
• Type "fever" for fever management
• Type "headache" for headache relief
• Type "emergency" for emergency guidance
• Type "blood" for blood-related help''',
        'priority': 'low'
    }


@app.route('/api/ai/chat', methods=['POST'])
def chat():
    """Handle chat messages using Google Gemini AI"""
    try:
        data = request.get_json()
        message = data.get('message', '')
        user_id = data.get('userId', None)
        conversation_history = data.get('history', [])
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'Message is required'
            }), 400
        
        # Check for emergency keywords first - use severity detector
        message_lower = message.lower()
        emergency_keywords = ['heart attack', 'stroke', 'not breathing', 'unconscious', 
                           'severe bleeding', 'choking', 'dying', 'emergency']
        
        is_emergency = any(keyword in message_lower for keyword in emergency_keywords)
        
        # Use Gemini AI for response
        gemini_result = get_gemini_response(message, conversation_history)
        
        if gemini_result['success']:
            response_text = gemini_result['response']
        else:
            response_text = gemini_result['response']  # Fallback response
        
        # Determine priority based on content
        if is_emergency:
            priority = 'high'
            msg_type = 'emergency'
        elif any(word in message_lower for word in ['blood', 'donate', 'transfusion']):
            priority = 'medium'
            msg_type = 'blood_info'
        elif any(word in message_lower for word in ['bed', 'hospital', 'admission', 'icu']):
            priority = 'medium'
            msg_type = 'hospital_info'
        else:
            priority = 'low'
            msg_type = 'general'
        
        return jsonify({
            'success': True,
            'data': {
                'response': response_text,
                'type': msg_type,
                'priority': priority,
                'ai_provider': 'OpenAI',
                'ai_model': 'gpt-4o-mini',
                'timestamp': datetime.now().isoformat()
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/ai/emergency', methods=['POST'])
def emergency_guidance():
    """Get emergency guidance for specific situation"""
    try:
        data = request.get_json()
        emergency_type = data.get('type', '').lower()
        
        for etype, info in EMERGENCY_RESPONSES.items():
            if emergency_type in info['keywords'] or emergency_type == etype:
                return jsonify({
                    'success': True,
                    'data': {
                        'guidance': info['response'],
                        'type': etype,
                        'priority': 'high',
                        'emergency_numbers': {
                            'ambulance': '102/108',
                            'police': '100',
                            'fire': '101'
                        }
                    }
                })
        
        return jsonify({
            'success': False,
            'error': 'Emergency type not recognized',
            'available_types': list(EMERGENCY_RESPONSES.keys())
        }), 404
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/ai/first-aid-tips', methods=['GET'])
def get_first_aid_tips():
    """Get random first aid tips"""
    import random
    num_tips = request.args.get('count', 3, type=int)
    tips = random.sample(FIRST_AID_TIPS, min(num_tips, len(FIRST_AID_TIPS)))
    
    return jsonify({
        'success': True,
        'data': {
            'tips': tips
        }
    })


@app.route('/api/ai/health-info/<topic>', methods=['GET'])
def get_health_info(topic):
    """Get health information for a specific topic"""
    topic_lower = topic.lower()
    
    if topic_lower in HEALTH_KNOWLEDGE:
        info = HEALTH_KNOWLEDGE[topic_lower]
        return jsonify({
            'success': True,
            'data': {
                'topic': topic,
                'symptoms': info['symptoms'],
                'recommendations': info['recommendations'],
                'warning_signs': info['warning_signs']
            }
        })
    
    return jsonify({
        'success': False,
        'error': f'Topic "{topic}" not found',
        'available_topics': list(HEALTH_KNOWLEDGE.keys())
    }), 404


@app.route('/api/ai/recommend', methods=['POST'])
def recommend():
    """Get AI recommendations based on symptoms"""
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        
        if not symptoms:
            return jsonify({
                'success': False,
                'error': 'Symptoms are required'
            }), 400
        
        # Find matching health topics
        recommendations = []
        for topic, info in HEALTH_KNOWLEDGE.items():
            matches = [s for s in symptoms if any(s.lower() in symptom.lower() for symptom in info['symptoms'])]
            if matches:
                recommendations.append({
                    'topic': topic,
                    'matched_symptoms': matches,
                    'recommendations': info['recommendations'],
                    'warning_signs': info['warning_signs']
                })
        
        if recommendations:
            return jsonify({
                'success': True,
                'data': {
                    'recommendations': recommendations,
                    'note': 'This is AI-generated guidance. Please consult a doctor for proper diagnosis.'
                }
            })
        
        return jsonify({
            'success': True,
            'data': {
                'recommendations': [],
                'note': 'No specific recommendations found. Please consult a healthcare professional.',
                'general_advice': [
                    'Stay hydrated',
                    'Get adequate rest',
                    'Monitor your symptoms',
                    'Consult a doctor if symptoms persist'
                ]
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/ai/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'AI Health Assistant Service is running with OpenAI',
        'version': '3.0.0',
        'ai_provider': 'OpenAI',
        'ai_model': 'gpt-4o-mini',
        'features': ['openai-chat', 'emergency-detection', 'severity-analysis', 'voice-support'],
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/ai/severity-detection', methods=['POST'])
def detect_severity():
    """
    Deep Learning-Based Emergency Severity Detection
    Analyzes symptoms and vital signs to determine emergency severity level
    """
    try:
        data = request.get_json()
        description = data.get('description', '')
        symptoms = data.get('symptoms', [])
        vitals = data.get('vitals', None)
        
        if not description and not symptoms:
            return jsonify({
                'success': False,
                'error': 'Please provide symptom description or list of symptoms'
            }), 400
        
        # Combine description and symptoms for analysis
        analysis_text = description
        if symptoms:
            analysis_text += ' ' + ' '.join(symptoms)
        
        # Run severity detection
        result = severity_detector.analyze(analysis_text, vitals)
        
        return jsonify({
            'success': True,
            'data': result
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/ai/voice-process', methods=['POST'])
def process_voice():
    """
    Process voice input text and provide response
    This endpoint handles transcribed voice input
    """
    try:
        data = request.get_json()
        transcript = data.get('transcript', '')
        context = data.get('context', 'general')  # general, emergency, symptoms
        
        if not transcript:
            return jsonify({
                'success': False,
                'error': 'No transcript provided'
            }), 400
        
        # Detect if it's an emergency based on keywords
        emergency_keywords = ['help', 'emergency', 'dying', 'cant breathe', 'heart attack', 
                           'stroke', 'bleeding', 'unconscious', 'accident', 'pain']
        
        is_emergency = any(keyword in transcript.lower() for keyword in emergency_keywords)
        
        if is_emergency or context == 'emergency':
            # Run severity detection for emergency
            severity_result = severity_detector.analyze(transcript)
            
            # Generate voice-friendly response
            severity = severity_result['severity_level']
            if severity in ['critical', 'severe']:
                voice_response = f"This appears to be a {severity} emergency. I recommend calling 102 or 108 immediately for an ambulance. "
                voice_response += "Please stay calm and follow these steps: "
                for i, rec in enumerate(severity_result['recommendations'][:3], 1):
                    voice_response += f"{i}. {rec}. "
            else:
                voice_response = "Based on your description, this does not appear to be a critical emergency. "
                voice_response += "However, I recommend: "
                for i, rec in enumerate(severity_result['recommendations'][:3], 1):
                    voice_response += f"{i}. {rec}. "
            
            return jsonify({
                'success': True,
                'data': {
                    'response': voice_response,
                    'severity_analysis': severity_result,
                    'is_emergency': is_emergency,
                    'suggested_actions': severity_result['recommendations']
                }
            })
        
        # For non-emergency, use Gemini AI
        gemini_result = get_gemini_response(transcript)
        
        if gemini_result['success']:
            voice_response = gemini_result['response']
        else:
            voice_response = gemini_result['response']
        
        # Make response voice-friendly (remove markdown)
        voice_response = re.sub(r'\*\*([^*]+)\*\*', r'\1', voice_response)  # Remove bold
        voice_response = re.sub(r'\n+', '. ', voice_response)  # Replace newlines
        voice_response = re.sub(r'[•\-]', '', voice_response)  # Remove bullets
        voice_response = re.sub(r'\s+', ' ', voice_response)  # Clean whitespace
        
        return jsonify({
            'success': True,
            'data': {
                'response': voice_response,
                'original_response': gemini_result.get('response', voice_response),
                'type': 'gemini_response',
                'is_emergency': False,
                'ai_provider': 'OpenAI',
                'ai_model': 'gpt-4o-mini'
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/ai/triage', methods=['POST'])
def emergency_triage():
    """
    Emergency Triage System
    Classifies patients based on severity for hospital admission priority
    """
    try:
        data = request.get_json()
        
        patient_info = {
            'age': data.get('age'),
            'gender': data.get('gender'),
            'symptoms': data.get('symptoms', []),
            'description': data.get('description', ''),
            'vitals': data.get('vitals', {}),
            'medical_history': data.get('medical_history', []),
            'allergies': data.get('allergies', [])
        }
        
        # Analyze severity
        analysis_text = patient_info['description'] + ' ' + ' '.join(patient_info['symptoms'])
        severity_result = severity_detector.analyze(analysis_text, patient_info['vitals'])
        
        # Determine triage category (color-coded)
        triage_categories = {
            'critical': {'category': 'RED', 'priority': 1, 'wait_time': 'Immediate'},
            'severe': {'category': 'ORANGE', 'priority': 2, 'wait_time': '< 15 minutes'},
            'moderate': {'category': 'YELLOW', 'priority': 3, 'wait_time': '< 60 minutes'},
            'mild': {'category': 'GREEN', 'priority': 4, 'wait_time': '< 2 hours'},
            'low': {'category': 'BLUE', 'priority': 5, 'wait_time': 'Non-urgent'}
        }
        
        triage = triage_categories.get(severity_result['severity_level'], triage_categories['mild'])
        
        # Suggested department
        departments = {
            'critical': 'Emergency/Trauma',
            'severe': 'Emergency Room',
            'moderate': 'Urgent Care',
            'mild': 'General OPD',
            'low': 'General Consultation'
        }
        
        return jsonify({
            'success': True,
            'data': {
                'triage_category': triage['category'],
                'priority_level': triage['priority'],
                'expected_wait_time': triage['wait_time'],
                'suggested_department': departments.get(severity_result['severity_level']),
                'severity_analysis': severity_result,
                'patient_info': {
                    'age': patient_info['age'],
                    'gender': patient_info['gender']
                },
                'timestamp': datetime.now().isoformat()
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.environ.get('AI_SERVICE_PORT', 5001))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    
    print("🤖 AI Health Assistant Service v3.0 - Powered by OpenAI")
    print("🧠 AI Model: gpt-4o-mini")
    print("🌐 Provider: OpenAI")
    print(f"🚀 Starting on port {port}")
    print("")
    print("📚 Available endpoints:")
    print("   POST /api/ai/chat - Chat with OpenAI")
    print("   POST /api/ai/emergency - Emergency guidance")
    print("   POST /api/ai/severity-detection - Severity Detection")
    print("   POST /api/ai/voice-process - Voice Input Processing")
    print("   POST /api/ai/triage - Emergency Triage System")
    print("   GET  /api/ai/first-aid-tips - Get first aid tips")
    print("   GET  /api/ai/health-info/<topic> - Get health info")
    print("   POST /api/ai/recommend - Get recommendations")
    print("   GET  /api/ai/health - Health check")
    
    host = os.environ.get('AI_SERVICE_HOST', '127.0.0.1')
    app.run(host=host, port=port, debug=debug)



