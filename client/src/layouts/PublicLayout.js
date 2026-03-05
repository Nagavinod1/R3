import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FiActivity, FiDroplet, FiGrid, FiShield, FiHeart, FiMenu, FiX } from 'react-icons/fi';
import FloatingAIAssistant from '../components/FloatingAIAssistant';

const PublicLayout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 lg:h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isScrolled 
                    ? 'bg-primary-600 shadow-lg shadow-primary-600/30' 
                    : 'bg-white/20 backdrop-blur-sm'
                }`}>
                  <FiHeart className={`text-xl lg:text-2xl transition-colors ${isScrolled ? 'text-white' : 'text-white'}`} />
                </div>
                <span className={`text-xl lg:text-2xl font-bold transition-colors ${
                  isScrolled ? 'text-gray-800' : 'text-white'
                }`}>
                  MY HEALTH CARE
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <a 
                href="#features" 
                className={`font-medium transition-colors ${
                  isScrolled ? 'text-gray-600 hover:text-primary-600' : 'text-white/80 hover:text-white'
                }`}
              >
                Features
              </a>
              <Link
                to="/login"
                className={`font-medium transition-colors ${
                  isScrolled ? 'text-gray-600 hover:text-primary-600' : 'text-white/80 hover:text-white'
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 ${
                  isScrolled 
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/30' 
                    : 'bg-white text-primary-600 hover:bg-gray-100 shadow-lg'
                }`}
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isScrolled ? 'text-gray-600' : 'text-white'
                }`}
              >
                {mobileMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-xl">
            <div className="px-4 py-4 space-y-3">
              <a 
                href="#features" 
                className="block py-2 text-gray-600 hover:text-primary-600 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <Link
                to="/login"
                className="block py-2 text-gray-600 hover:text-primary-600 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block w-full py-3 bg-primary-600 text-white text-center rounded-xl font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <Outlet />

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30">
                  <FiHeart className="text-white text-2xl" />
                </div>
                <span className="text-2xl font-bold text-white">MY HEALTH CARE</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                Blockchain-enabled intelligent hospital bed and blood resource management system. Transforming healthcare through technology.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Features</h4>
              <ul className="space-y-4">
                <li className="flex items-center space-x-3 group cursor-pointer">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <FiGrid className="text-blue-400" size={16} />
                  </div>
                  <span className="group-hover:text-white transition-colors">Bed Management</span>
                </li>
                <li className="flex items-center space-x-3 group cursor-pointer">
                  <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <FiDroplet className="text-red-400" size={16} />
                  </div>
                  <span className="group-hover:text-white transition-colors">Blood Bank</span>
                </li>
                <li className="flex items-center space-x-3 group cursor-pointer">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <FiShield className="text-purple-400" size={16} />
                  </div>
                  <span className="group-hover:text-white transition-colors">Blockchain Security</span>
                </li>
                <li className="flex items-center space-x-3 group cursor-pointer">
                  <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <FiActivity className="text-green-400" size={16} />
                  </div>
                  <span className="group-hover:text-white transition-colors">AI Assistant</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Quick Links</h4>
              <ul className="space-y-4">
                <li><Link to="/login" className="hover:text-white hover:translate-x-1 inline-block transition-all">→ Login</Link></li>
                <li><Link to="/register" className="hover:text-white hover:translate-x-1 inline-block transition-all">→ Register</Link></li>
                <li><a href="#features" className="hover:text-white hover:translate-x-1 inline-block transition-all">→ Features</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">→ Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all">→ Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Emergency Contact</h4>
              <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-2">24/7 Emergency Helpline</p>
                <p className="text-4xl font-bold text-red-400 mb-4">108</p>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center">
                    <span className="text-gray-500 mr-2">Blood Bank:</span>
                    <span className="text-white">1800-XXX-XXXX</span>
                  </p>
                  <p className="flex items-center">
                    <span className="text-gray-500 mr-2">Support:</span>
                    <span className="text-white">support@hms.com</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">&copy; 2024 MY HEALTH CARE. All rights reserved.</p>
              <p className="text-sm text-gray-500">Made with <FiHeart className="inline text-red-500" /> for better healthcare</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating AI Assistant */}
      <FloatingAIAssistant />
    </div>
  );
};

export default PublicLayout;
