import React, { useState, useRef, useEffect, useCallback } from 'react';
import { aiAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  FiSend, FiMessageCircle, FiAlertTriangle, FiPhone, FiHeart,
  FiThermometer, FiDroplet, FiActivity, FiUser, FiCpu, FiMic, FiMicOff,
  FiVolume2, FiVolumeX, FiAlertCircle, FiExternalLink, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// HealthWise Thesys Widget Component
const HealthWiseWidget = () => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let iframeElement = null;

    const loadWidget = () => {
      if (containerRef.current && !isLoaded) {
        // Create iframe to embed the HealthWise chatbot
        iframeElement = document.createElement('iframe');
        iframeElement.src = 'https://console.thesys.dev/app/drRqD_xqSBJMLUD7j60i_';
        iframeElement.style.width = '100%';
        iframeElement.style.height = '100%';
        iframeElement.style.border = 'none';
        iframeElement.style.borderRadius = '0 0 16px 16px';
        iframeElement.title = 'HealthWise AI Assistant';
        iframeElement.allow = 'microphone; clipboard-write';
        
        iframeElement.onload = () => setIsLoaded(true);
        
        containerRef.current.appendChild(iframeElement);
      }
    };

    loadWidget();

    return () => {
      if (iframeElement && containerRef.current) {
        try { containerRef.current.removeChild(iframeElement); } catch (e) { /* ignore */ }
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full">
      {!isLoaded && (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping opacity-30"></div>
              <div className="relative w-16 h-16 rounded-full border-4 border-t-blue-600 border-r-blue-600 border-b-blue-200 border-l-blue-200 animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">Loading HealthWise AI...</p>
            <p className="text-gray-400 text-sm mt-1">Smart health guidance powered by advanced AI</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="flex-1" style={{ display: isLoaded ? 'block' : 'none' }} />
    </div>
  );
};

const AIChatbot = () => {
  const [activeTab, setActiveTab] = useState('healthwise'); // 'healthwise' or 'assistant'
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI Health Assistant with Voice Support. I can help you with:\n\n• First aid guidance for emergencies\n• Health-related questions\n• Finding nearby hospitals\n• Blood availability information\n• Emergency severity detection\n\n🎤 Click the microphone to use voice input!\n\nHow can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [severityAnalysis, setSeverityAnalysis] = useState(null);
  const [showSeverityPanel, setShowSeverityPanel] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const { user } = useAuth();

  const quickActions = [
    { icon: <FiAlertTriangle />, label: 'Emergency Help', message: 'I need emergency first aid help' },
    { icon: <FiThermometer />, label: 'Fever', message: 'What should I do for high fever?' },
    { icon: <FiHeart />, label: 'Chest Pain', message: 'I have chest pain, what should I do?' },
    { icon: <FiDroplet />, label: 'Bleeding', message: 'How to stop heavy bleeding?' },
    { icon: <FiActivity />, label: 'CPR Guide', message: 'How to perform CPR?' },
    { icon: <FiAlertCircle />, label: 'Check Severity', message: 'Analyze my symptoms for severity' }
  ];

  const emergencyResponses = {
    'emergency': {
      keywords: ['emergency', 'help', 'urgent', 'dying', 'unconscious', 'not breathing'],
      response: `🚨 **EMERGENCY RESPONSE**\n\n**Immediate Steps:**\n1. Call emergency services: **102** or **108**\n2. Stay calm and assess the situation\n3. Ensure your safety first\n4. If the person is unconscious, check for breathing\n5. Begin CPR if needed and you are trained\n\n**Emergency Numbers:**\n• Ambulance: 102/108\n• Police: 100\n• Fire: 101\n\nDo you need specific first aid instructions?`
    },
    'chest pain': {
      keywords: ['chest pain', 'heart attack', 'heart pain', 'cardiac'],
      response: `🫀 **CHEST PAIN EMERGENCY**\n\n**If you suspect a heart attack:**\n1. **Call 102/108 immediately**\n2. Have the person sit or lie down comfortably\n3. Loosen any tight clothing\n4. If prescribed, help them take aspirin (325mg) - chew, don't swallow\n5. Keep them calm and monitor breathing\n6. Be ready to perform CPR if they become unconscious\n\n**Warning Signs:**\n• Crushing pressure in chest\n• Pain spreading to arm, jaw, or back\n• Shortness of breath\n• Cold sweats\n• Nausea\n\n⚠️ Don't wait - every minute counts!`
    },
    'bleeding': {
      keywords: ['bleeding', 'blood', 'wound', 'cut', 'injury'],
      response: `🩹 **BLEEDING CONTROL**\n\n**For External Bleeding:**\n1. Apply direct pressure with clean cloth\n2. Keep the injured part elevated if possible\n3. Don't remove the cloth, add more if needed\n4. If blood soaks through, apply more pressure\n5. For severe bleeding, apply tourniquet above the wound\n\n**Signs of Severe Bleeding:**\n• Blood spurting from wound\n• Blood soaking through bandages\n• Dizziness or confusion\n• Pale, cool skin\n\n🚨 Call 102/108 for severe bleeding that won't stop!`
    },
    'cpr': {
      keywords: ['cpr', 'not breathing', 'cardiac arrest', 'unconscious'],
      response: `💓 **CPR GUIDE (Adult)**\n\n**Step 1: Check Response**\n• Tap shoulders and shout "Are you okay?"\n• Call 102/108 if no response\n\n**Step 2: Check Breathing**\n• Look for chest movement for 10 seconds\n• If not breathing or only gasping, start CPR\n\n**Step 3: Chest Compressions**\n• Place heel of hand on center of chest\n• Push hard and fast (2 inches deep)\n• Rate: 100-120 compressions/minute\n• Allow chest to fully rise between compressions\n\n**Step 4: Rescue Breaths (if trained)**\n• Tilt head back, lift chin\n• Pinch nose, give 2 breaths\n• Watch for chest rise\n• Continue 30:2 ratio\n\n⚠️ Don't stop until help arrives!`
    },
    'fever': {
      keywords: ['fever', 'temperature', 'hot', 'chills'],
      response: `🌡️ **FEVER MANAGEMENT**\n\n**For Adults:**\n• Take paracetamol (500-1000mg) every 6 hours\n• Stay hydrated - drink plenty of fluids\n• Rest and avoid strenuous activity\n• Use a cool compress on forehead\n• Wear light clothing\n\n**When to Seek Medical Help:**\n• Temperature above 103°F (39.4°C)\n• Fever lasting more than 3 days\n• Severe headache or neck stiffness\n• Difficulty breathing\n• Rash or confusion\n\n**For Children:**\n• Use age-appropriate dose of medication\n• Never give aspirin to children\n• Seek immediate help if under 3 months with fever`
    },
    'burns': {
      keywords: ['burn', 'fire', 'scalded', 'hot water'],
      response: `🔥 **BURN FIRST AID**\n\n**Immediate Steps:**\n1. Remove from heat source\n2. Cool burn under running water for 10-20 minutes\n3. Remove jewelry/clothing near burn (unless stuck)\n4. Cover with clean, non-fluffy material\n5. Don't apply ice, butter, or creams\n\n**Burn Severity:**\n• **1st Degree**: Red, no blisters - home treatment OK\n• **2nd Degree**: Blisters - may need medical care\n• **3rd Degree**: White/charred skin - **EMERGENCY**\n\n🚨 Seek immediate help for:\n• Burns larger than hand size\n• Burns on face, hands, feet, joints\n• Chemical or electrical burns\n• Difficulty breathing after burn`
    },
    'choking': {
      keywords: ['choking', 'cant breathe', 'something stuck', 'airway'],
      response: `😮 **CHOKING RESPONSE**\n\n**If Person CAN Cough:**\n• Encourage them to keep coughing\n• Don't interfere - coughing is effective\n\n**If Person CANNOT Cough or Breathe:**\n\n**Heimlich Maneuver:**\n1. Stand behind the person\n2. Make a fist with one hand\n3. Place fist above navel, below ribcage\n4. Grasp fist with other hand\n5. Give quick upward thrusts\n6. Repeat until object is expelled\n\n**For Unconscious Person:**\n• Call 102/108\n• Begin CPR\n• Check mouth before each breath\n\n🚨 Always seek medical evaluation after choking!`
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInputMessage(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable it in browser settings.');
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Toggle voice listening
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputMessage('');
      recognitionRef.current.start();
      setIsListening(true);
      toast.success('Listening... Speak now!');
    }
  }, [isListening]);

  // Text-to-speech function
  const speakText = useCallback((text) => {
    if (!voiceEnabled || !synthRef.current) return;

    synthRef.current.cancel();

    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/[•\-]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/[#]/g, '')
      .substring(0, 500);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [voiceEnabled]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Analyze severity
  const analyzeSeverity = async (text) => {
    try {
      const response = await aiAPI.analyzeSeverity({ description: text });
      if (response.data.success) {
        setSeverityAnalysis(response.data.data);
        setShowSeverityPanel(true);
        return response.data.data;
      }
    } catch (error) {
      console.error('Severity analysis error:', error);
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // Check for emergency keywords first
      const lowerMessage = currentMessage.toLowerCase();
      let botResponse = null;
      let shouldAnalyzeSeverity = false;
      let isNonHealthQuery = false;

      // Check if user wants severity analysis
      if (lowerMessage.includes('severity') || lowerMessage.includes('analyze') || 
          lowerMessage.includes('how serious') || lowerMessage.includes('emergency')) {
        shouldAnalyzeSeverity = true;
      }

      for (const [key, data] of Object.entries(emergencyResponses)) {
        if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
          botResponse = data.response;
          shouldAnalyzeSeverity = true;
          break;
        }
      }

      // Analyze severity if needed
      if (shouldAnalyzeSeverity) {
        const severityResult = await analyzeSeverity(currentMessage);
        if (severityResult && !botResponse) {
          const severityLevel = severityResult.severity_level;
          const severityEmojis = {
            critical: '🔴',
            severe: '🟠',
            moderate: '🟡',
            mild: '🔵',
            low: '🟢'
          };
          
          botResponse = `${severityEmojis[severityLevel] || '⚪'} **Severity Analysis: ${severityLevel.toUpperCase()}**\n\n`;
          botResponse += `**Severity Score:** ${severityResult.severity_score}%\n`;
          botResponse += `**Action Required:** ${severityResult.severity_info?.action || 'Monitor symptoms'}\n\n`;
          botResponse += `**Detected Symptoms:**\n`;
          severityResult.detected_symptoms?.forEach(s => {
            botResponse += `• ${s.symptom}\n`;
          });
          botResponse += `\n**Recommendations:**\n`;
          severityResult.recommendations?.slice(0, 4).forEach(r => {
            botResponse += `• ${r}\n`;
          });

          if (severityResult.requires_immediate_attention) {
            botResponse += `\n🚨 **This requires immediate medical attention!**\nCall 102 or 108 immediately.`;
          }
        }
      }

      if (!botResponse) {
        // Try to get AI response from server (Google Gemini)
        try {
          const response = await aiAPI.chat({ message: currentMessage });
          if (response.data.success) {
            botResponse = response.data.data.response;
            
            // Check if it's a non-health query warning
            if (response.data.data.isHealthRelated === false) {
              isNonHealthQuery = true;
              toast.error('⚠️ I can only answer health-related questions!', {
                duration: 4000,
                icon: '🏥'
              });
            }
          }
        } catch (error) {
          // Use fallback response
          botResponse = getFallbackResponse(lowerMessage);
        }
      }

      // Simulate typing delay
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: botResponse,
          timestamp: new Date(),
          isWarning: isNonHealthQuery
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);

        // Speak the response if voice is enabled
        if (voiceEnabled && !isNonHealthQuery) {
          speakText(botResponse);
        }
      }, 1000);

    } catch (error) {
      setIsTyping(false);
      toast.error('Failed to get response. Please try again.');
    }
  };

  const getFallbackResponse = (message) => {
    if (message.includes('blood') || message.includes('donate')) {
      return `🩸 **Blood Information**\n\nI can help you with blood-related queries:\n\n• Check blood availability in the "Blood Availability" section\n• Request blood through the system\n• Find nearest blood banks\n\nYour blood group: ${user?.bloodGroup || 'Not set'}\n\nWould you like me to help you find available blood or make a request?`;
    }

    if (message.includes('hospital') || message.includes('bed') || message.includes('admission')) {
      return `🏥 **Hospital Information**\n\nYou can:\n• Find available beds in the "Find Beds" section\n• Book a bed online\n• View nearby hospitals\n\nWould you like me to provide more details about finding hospital beds?`;
    }

    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return `Hello ${user?.name || 'there'}! 👋\n\nI'm here to help you with:\n• Emergency first aid guidance\n• Health questions\n• Hospital and bed information\n• Blood availability\n• 🎤 Voice commands - just click the mic!\n\nWhat can I help you with today?`;
    }

    if (message.includes('thank')) {
      return `You're welcome! 😊\n\nRemember, in case of emergency:\n• Call 102/108 for ambulance\n• Call 100 for police\n\nIs there anything else I can help you with?`;
    }

    return `I understand you're asking about: "${message}"\n\nI can best help you with:\n1. 🚨 Emergency first aid instructions\n2. 🏥 Finding hospital beds\n3. 🩸 Blood availability\n4. ❤️ General health guidance\n\nCould you please rephrase your question or select from the quick actions below?`;
  };

  const handleQuickAction = (message) => {
    setInputMessage(message);
    handleSendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSeverityColor = (level) => {
    const colors = {
      critical: 'bg-red-500',
      severe: 'bg-orange-500',
      moderate: 'bg-yellow-500',
      mild: 'bg-blue-500',
      low: 'bg-green-500'
    };
    return colors[level] || 'bg-gray-500';
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Header with Tabs */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-t-2xl text-white">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FiCpu className="text-2xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Health Assistant</h1>
                <p className="text-primary-200 text-sm">
                  {activeTab === 'healthwise' 
                    ? 'HealthWise AI — Smart Symptom Assessment' 
                    : 'Voice-Enabled | Emergency Detection | 24/7'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {activeTab === 'assistant' && (
                <>
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`p-2 rounded-lg transition-colors ${voiceEnabled ? 'bg-white/20' : 'bg-white/10'}`}
                    title={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
                  >
                    {voiceEnabled ? <FiVolume2 /> : <FiVolumeX />}
                  </button>
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30"
                      title="Stop speaking"
                    >
                      <FiVolumeX />
                    </button>
                  )}
                </>
              )}
              <a
                href="https://console.thesys.dev/app/drRqD_xqSBJMLUD7j60i_"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Open HealthWise in new tab"
              >
                <FiExternalLink />
              </a>
            </div>
          </div>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex px-4 pb-0 space-x-1">
          <button
            onClick={() => setActiveTab('healthwise')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-t-xl text-sm font-medium transition-all ${
              activeTab === 'healthwise'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <FiZap className={activeTab === 'healthwise' ? 'text-primary-600' : ''} />
            <span>HealthWise AI</span>
            <span className={`px-1.5 py-0.5 text-xs rounded-full ${
              activeTab === 'healthwise'
                ? 'bg-green-100 text-green-700'
                : 'bg-white/20 text-white/90'
            }`}>PRO</span>
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-t-xl text-sm font-medium transition-all ${
              activeTab === 'assistant'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <FiMessageCircle className={activeTab === 'assistant' ? 'text-primary-600' : ''} />
            <span>Quick Assistant</span>
          </button>
        </div>
      </div>

      {/* HealthWise Tab Content */}
      {activeTab === 'healthwise' && (
        <div className="flex-1 bg-white rounded-b-2xl overflow-hidden" style={{ minHeight: 0 }}>
          <HealthWiseWidget />
        </div>
      )}

      {/* Quick Assistant Tab Content */}
      {activeTab === 'assistant' && (
        <>
          {/* Severity Panel (collapsible) */}
          {showSeverityPanel && severityAnalysis && (
            <div className="bg-white border-b p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getSeverityColor(severityAnalysis.severity_level)}`}></div>
                  <span className="font-medium">
                    Severity: {severityAnalysis.severity_level?.toUpperCase()} ({severityAnalysis.severity_score}%)
                  </span>
                  {severityAnalysis.requires_immediate_attention && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full animate-pulse">
                      ⚠️ Immediate Attention Required
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowSeverityPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-gray-50 p-3 border-b overflow-x-auto">
            <div className="flex space-x-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputMessage(action.message);
                    setTimeout(() => handleSendMessage(), 100);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-full text-sm text-gray-700 hover:bg-primary-50 hover:border-primary-300 transition-colors whitespace-nowrap"
                >
                  <span className="text-primary-600">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' ? 'bg-primary-100' : message.isWarning ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    {message.type === 'user' ? (
                      <FiUser className="text-primary-600 text-sm" />
                    ) : message.isWarning ? (
                      <FiAlertTriangle className="text-yellow-600 text-sm" />
                    ) : (
                      <FiCpu className="text-green-600 text-sm" />
                    )}
                  </div>
                  <div className={`rounded-2xl p-4 ${
                    message.type === 'user' 
                      ? 'bg-primary-600 text-white rounded-br-none' 
                      : message.isWarning
                      ? 'bg-yellow-50 border-2 border-yellow-300 shadow-sm rounded-bl-none'
                      : 'bg-white shadow-sm rounded-bl-none'
                  }`}>
                    {message.isWarning && (
                      <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-yellow-200">
                        <FiAlertTriangle className="text-yellow-600" />
                        <span className="text-yellow-700 text-xs font-semibold">Health Topics Only</span>
                      </div>
                    )}
                    <div className={`whitespace-pre-wrap text-sm ${
                      message.type === 'user' ? 'text-white' : message.isWarning ? 'text-yellow-800' : 'text-gray-700'
                    }`}>
                      {message.content.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line.startsWith('**') && line.endsWith('**') ? (
                            <strong>{line.replace(/\*\*/g, '')}</strong>
                          ) : line.startsWith('•') ? (
                            <span className="block ml-2">{line}</span>
                          ) : (
                            line
                          )}
                          {i < message.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                    <p className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-primary-200' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCpu className="text-green-600 text-sm" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-none p-4 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Emergency Numbers Banner */}
          <div className="bg-red-50 border-t border-red-200 px-4 py-2">
            <div className="flex items-center justify-center space-x-6 text-sm">
              <span className="text-red-700 font-medium">Emergency:</span>
              <a href="tel:102" className="flex items-center space-x-1 text-red-600 hover:text-red-700">
                <FiPhone /> <span>102 (Ambulance)</span>
              </a>
              <a href="tel:108" className="flex items-center space-x-1 text-red-600 hover:text-red-700">
                <FiPhone /> <span>108 (Medical)</span>
              </a>
              <a href="tel:100" className="flex items-center space-x-1 text-red-600 hover:text-red-700">
                <FiPhone /> <span>100 (Police)</span>
              </a>
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white border-t p-4 rounded-b-2xl">
            <div className="flex items-center space-x-3">
              {/* Voice Input Button */}
              <button
                onClick={toggleListening}
                className={`p-3 rounded-xl transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-600'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <FiMicOff className="text-xl" /> : <FiMic className="text-xl" />}
              </button>

              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type or speak your health question..."
                className="flex-1 input-field resize-none"
                rows="1"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="btn-primary p-3 rounded-xl disabled:opacity-50"
              >
                <FiSend className="text-xl" />
              </button>
            </div>
            
            {/* Listening Indicator */}
            {isListening && (
              <div className="flex items-center justify-center py-2 mt-2">
                <div className="flex items-center space-x-3 px-4 py-2 bg-primary-100 rounded-full">
                  <div className="relative">
                    <FiMic className="text-primary-600" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  </div>
                  <span className="text-primary-700 text-sm font-medium">Listening...</span>
                  <div className="flex space-x-1">
                    <div className="w-1 h-3 bg-primary-400 rounded animate-pulse"></div>
                    <div className="w-1 h-4 bg-primary-500 rounded animate-pulse" style={{ animationDelay: '100ms' }}></div>
                    <div className="w-1 h-2 bg-primary-400 rounded animate-pulse" style={{ animationDelay: '200ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatbot;
