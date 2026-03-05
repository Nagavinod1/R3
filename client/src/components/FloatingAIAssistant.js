import React, { useState, useRef, useEffect, useCallback } from 'react';
import { aiAPI } from '../services/api';
import { 
  FiMessageCircle, FiX, FiSend, FiMic, FiMicOff,
  FiVolume2, FiVolumeX, FiAlertTriangle, FiMinimize2
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const FloatingAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI Health Assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const quickActions = [
    { label: '🚨 Emergency', message: 'I need emergency help' },
    { label: '🌡️ Fever', message: 'What should I do for fever?' },
    { label: '💓 CPR Guide', message: 'How to perform CPR?' },
    { label: '🩸 Bleeding', message: 'How to stop bleeding?' },
  ];

  const emergencyResponses = {
    'emergency': {
      keywords: ['emergency', 'help', 'urgent', 'dying', 'unconscious'],
      response: `🚨 **EMERGENCY**\n\nCall **102** or **108** immediately!\n\n1. Stay calm\n2. Ensure safety\n3. Check breathing\n4. Begin CPR if needed`
    },
    'chest pain': {
      keywords: ['chest pain', 'heart attack', 'heart pain'],
      response: `🫀 **CHEST PAIN**\n\n1. Call 102/108 immediately\n2. Sit comfortably\n3. Loosen clothing\n4. Chew aspirin if available\n5. Stay calm`
    },
    'bleeding': {
      keywords: ['bleeding', 'blood', 'wound', 'cut'],
      response: `🩹 **BLEEDING**\n\n1. Apply direct pressure\n2. Elevate if possible\n3. Don't remove cloth\n4. Call 102/108 if severe`
    },
    'cpr': {
      keywords: ['cpr', 'not breathing', 'unconscious'],
      response: `💓 **CPR GUIDE**\n\n1. Check response\n2. Call 102/108\n3. 30 chest compressions\n4. 2 rescue breaths\n5. Repeat until help arrives`
    },
    'fever': {
      keywords: ['fever', 'temperature', 'hot'],
      response: `🌡️ **FEVER**\n\n1. Take paracetamol\n2. Stay hydrated\n3. Rest\n4. Cool compress\n5. Seek help if >103°F`
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

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }, [isListening]);

  const speakText = useCallback((text) => {
    if (!voiceEnabled || !synthRef.current) return;

    synthRef.current.cancel();
    const plainText = text.replace(/[*#_`]/g, '').replace(/\n/g, '. ');
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const findEmergencyResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    for (const [, data] of Object.entries(emergencyResponses)) {
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return data.response;
      }
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
      const emergencyResponse = findEmergencyResponse(currentMessage);
      
      let botResponse;
      if (emergencyResponse) {
        botResponse = emergencyResponse;
      } else {
        try {
          const response = await aiAPI.chat({ message: currentMessage });
          botResponse = response.data?.response || response.data?.message || 
            "I'm here to help with health questions. Try asking about first aid or symptoms.";
        } catch {
          botResponse = "I can help with health questions. Try asking about fever, bleeding, CPR, or emergencies.";
        }
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (voiceEnabled) {
        speakText(botResponse);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (message) => {
    setInputMessage(message);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-600 hover:bg-gray-700' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
        }`}
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
      >
        {isOpen ? (
          <FiX className="text-white text-2xl" />
        ) : (
          <FiMessageCircle className="text-white text-2xl" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FiMessageCircle className="text-xl" />
              </div>
              <div>
                <h3 className="font-semibold">AI Health Assistant</h3>
                <p className="text-xs text-blue-100">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
              >
                {voiceEnabled ? <FiVolume2 /> : <FiVolumeX />}
              </button>
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                  title="Stop speaking"
                >
                  <FiVolumeX />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <FiMinimize2 />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-2 bg-gray-50 border-b flex gap-2 overflow-x-auto">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action.message)}
                className="px-3 py-1 bg-white border rounded-full text-xs hover:bg-blue-50 hover:border-blue-300 whitespace-nowrap transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-white">
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleListening}
                className={`p-2 rounded-full transition-colors ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isListening ? <FiMicOff /> : <FiMic />}
              </button>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type or speak..."
                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSend />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIAssistant;
