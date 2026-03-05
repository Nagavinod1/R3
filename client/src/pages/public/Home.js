import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiGrid, FiDroplet, FiShield, FiActivity, FiCpu, 
  FiClock, FiCheckCircle, FiUsers, FiHeart, FiArrowRight,
  FiPhone, FiMail, FiMapPin, FiStar, FiZap, FiAward
} from 'react-icons/fi';

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [counters, setCounters] = useState({ hospitals: 0, beds: 0, blood: 0, patients: 0 });

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3000);

    // Animate counters
    const duration = 2000;
    const targets = { hospitals: 50, beds: 1000, blood: 5000, patients: 10000 };
    const steps = 60;
    const increment = duration / steps;
    let step = 0;

    const counterInterval = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounters({
        hospitals: Math.floor(targets.hospitals * progress),
        beds: Math.floor(targets.beds * progress),
        blood: Math.floor(targets.blood * progress),
        patients: Math.floor(targets.patients * progress)
      });
      if (step >= steps) clearInterval(counterInterval);
    }, increment);

    return () => {
      clearInterval(interval);
      clearInterval(counterInterval);
    };
  }, []);

  const features = [
    {
      icon: FiGrid,
      title: 'Real-time Bed Management',
      description: 'Track and book hospital beds across multiple facilities with live availability updates and instant notifications.',
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      icon: FiDroplet,
      title: 'Blood Bank Integration',
      description: 'Complete blood inventory management with donation tracking, emergency requests, and compatibility matching.',
      color: 'from-red-500 to-red-600',
      bgLight: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      icon: FiShield,
      title: 'Blockchain Security',
      description: 'All transactions are secured using blockchain technology for tamper-proof, transparent medical records.',
      color: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      icon: FiCpu,
      title: 'AI-Powered Assistant',
      description: 'Get instant first aid guidance, emergency recommendations, symptom analysis, and health tips powered by Gemini AI.',
      color: 'from-green-500 to-green-600',
      bgLight: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      icon: FiZap,
      title: 'Real-time Updates',
      description: 'Live notifications and updates for bed availability, blood stock levels, and emergency alerts via WebSocket.',
      color: 'from-orange-500 to-orange-600',
      bgLight: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      icon: FiUsers,
      title: 'Multi-Role Access',
      description: 'Separate dashboards for administrators, hospital staff, and patients with customized role-based access.',
      color: 'from-indigo-500 to-indigo-600',
      bgLight: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    }
  ];

  const stats = [
    { value: counters.hospitals, suffix: '+', label: 'Hospitals', icon: FiActivity, color: 'text-blue-500', bg: 'bg-blue-100' },
    { value: counters.beds, suffix: '+', label: 'Beds Available', icon: FiGrid, color: 'text-green-500', bg: 'bg-green-100' },
    { value: counters.blood, suffix: '+', label: 'Blood Units', icon: FiDroplet, color: 'text-red-500', bg: 'bg-red-100' },
    { value: counters.patients, suffix: '+', label: 'Patients Served', icon: FiUsers, color: 'text-purple-500', bg: 'bg-purple-100' }
  ];

  const testimonials = [
    {
      name: 'Dr. Rajesh Kumar',
      role: 'Chief Medical Officer',
      hospital: 'City General Hospital',
      content: 'This platform has revolutionized how we manage our hospital resources. The real-time bed tracking is a game changer.',
      rating: 5
    },
    {
      name: 'Priya Sharma',
      role: 'Patient',
      hospital: 'Delhi',
      content: 'Found an emergency bed for my father within minutes. The AI assistant provided critical first aid guidance while we waited.',
      rating: 5
    },
    {
      name: 'Amit Patel',
      role: 'Blood Bank Manager',
      hospital: 'Apollo Healthcare',
      content: 'Managing blood inventory has never been easier. The blockchain verification adds an extra layer of trust.',
      rating: 5
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-3xl"></div>
          
          {/* Floating Icons */}
          <div className="absolute top-32 right-20 animate-bounce" style={{animationDuration: '3s'}}>
            <FiHeart className="text-white/20 text-6xl" />
          </div>
          <div className="absolute bottom-40 left-20 animate-bounce" style={{animationDuration: '4s', animationDelay: '0.5s'}}>
            <FiDroplet className="text-white/20 text-5xl" />
          </div>
          <div className="absolute top-40 left-1/3 animate-bounce" style={{animationDuration: '3.5s', animationDelay: '1s'}}>
            <FiShield className="text-white/20 text-4xl" />
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}>
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6 border border-white/20">
                <FiZap className="mr-2 text-yellow-300" />
                <span>Powered by Blockchain & AI Technology</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Smart Healthcare
                <span className="block bg-gradient-to-r from-primary-200 to-white bg-clip-text text-transparent">
                  Management System
                </span>
              </h1>
              
              <p className="text-xl text-primary-100 mb-8 leading-relaxed">
                Intelligent Hospital Bed and Blood Resource Management powered by 
                cutting-edge blockchain technology, real-time updates, and AI-driven healthcare assistance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/register" 
                  className="group inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Get Started Free
                  <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-white transition-all duration-300"
                >
                  Sign In
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 mt-10 pt-10 border-t border-white/20">
                <div className="flex items-center">
                  <FiShield className="text-green-400 mr-2" />
                  <span className="text-sm text-primary-200">HIPAA Compliant</span>
                </div>
                <div className="flex items-center">
                  <FiCheckCircle className="text-green-400 mr-2" />
                  <span className="text-sm text-primary-200">24/7 Support</span>
                </div>
                <div className="flex items-center">
                  <FiAward className="text-yellow-400 mr-2" />
                  <span className="text-sm text-primary-200">ISO Certified</span>
                </div>
              </div>
            </div>

            {/* Hero Image/Card */}
            <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
              <div className="relative">
                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Live Dashboard Preview</h3>
                    <span className="flex items-center text-green-400 text-sm">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                      Live
                    </span>
                  </div>
                  
                  {/* Mini Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 rounded-xl p-4">
                      <FiGrid className="text-blue-300 mb-2" />
                      <p className="text-2xl font-bold">847</p>
                      <p className="text-xs text-primary-200">Beds Available</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <FiDroplet className="text-red-300 mb-2" />
                      <p className="text-2xl font-bold">2,341</p>
                      <p className="text-xs text-primary-200">Blood Units</p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-3">
                    <p className="text-sm text-primary-200 mb-2">Recent Activity</p>
                    <div className="flex items-center bg-white/5 rounded-lg p-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                        <FiCheckCircle className="text-green-400 text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">Bed booked at City Hospital</p>
                        <p className="text-xs text-primary-300">2 mins ago</p>
                      </div>
                    </div>
                    <div className="flex items-center bg-white/5 rounded-lg p-3">
                      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mr-3">
                        <FiDroplet className="text-red-400 text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">Blood request fulfilled</p>
                        <p className="text-xs text-primary-300">5 mins ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
              >
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <stat.icon className={`${stat.color} text-2xl`} />
                </div>
                <div className="text-4xl font-bold text-gray-800 mb-1">
                  {stat.value.toLocaleString()}{stat.suffix}
                </div>
                <div className="text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-primary-100 text-primary-600 rounded-full text-sm font-medium mb-4">
              Features
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A comprehensive suite of tools designed to modernize healthcare resource management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`group relative bg-white rounded-2xl p-8 border-2 transition-all duration-500 cursor-pointer
                  ${activeFeature === index 
                    ? 'border-primary-500 shadow-2xl scale-105' 
                    : 'border-gray-100 hover:border-primary-200 hover:shadow-xl'
                  }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                
                {/* Decorative Element */}
                <div className={`absolute top-4 right-4 w-20 h-20 ${feature.bgLight} rounded-full opacity-50 blur-2xl transition-opacity duration-300 ${activeFeature === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-green-100 text-green-600 rounded-full text-sm font-medium mb-4">
              Simple Process
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">Get started in just three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200"></div>
            
            {[
              { step: 1, title: 'Create Account', desc: 'Register as a patient, staff member, or administrator in under 2 minutes', icon: FiUsers, color: 'from-blue-500 to-blue-600' },
              { step: 2, title: 'Search & Find', desc: 'Browse available beds or blood units across all connected hospitals', icon: FiGrid, color: 'from-purple-500 to-purple-600' },
              { step: 3, title: 'Book & Track', desc: 'Reserve resources instantly and track your requests in real-time', icon: FiCheckCircle, color: 'from-green-500 to-green-600' }
            ].map((item, index) => (
              <div key={index} className="relative text-center group">
                <div className={`w-20 h-20 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="text-white text-3xl" />
                </div>
                <div className="absolute -top-2 left-1/2 transform translate-x-6 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-gray-600">See what our users have to say</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role} • {testimonial.hospital}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connected Hospitals */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-4">
              Our Network
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              Partner Hospitals
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connected hospitals providing real-time bed and blood availability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'City General Hospital', location: 'Mumbai', beds: 250, blood: true, emergency: true, rating: 4.8 },
              { name: 'Apollo Healthcare', location: 'Delhi', beds: 180, blood: true, emergency: true, rating: 4.9 },
              { name: 'LifeLine Medical', location: 'Bangalore', beds: 150, blood: true, emergency: false, rating: 4.7 },
              { name: 'Medicare Hospital', location: 'Chennai', beds: 200, blood: true, emergency: true, rating: 4.6 },
              { name: 'Care Plus Hospital', location: 'Pune', beds: 120, blood: false, emergency: true, rating: 4.5 },
              { name: 'Unity Health Center', location: 'Hyderabad', beds: 100, blood: true, emergency: false, rating: 4.8 }
            ].map((hospital, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-1">
                <div className="h-2 bg-gradient-to-r from-primary-500 to-primary-600"></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-primary-600 transition-colors">{hospital.name}</h3>
                      <p className="text-gray-500 text-sm flex items-center mt-1">
                        <FiMapPin className="mr-1" /> {hospital.location}
                      </p>
                    </div>
                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                      <FiStar className="text-yellow-500 fill-current mr-1 text-sm" />
                      <span className="text-sm font-medium text-yellow-700">{hospital.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {hospital.emergency && (
                      <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                        24/7 Emergency
                      </span>
                    )}
                    {hospital.blood && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">
                        Blood Bank
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <FiGrid className="mr-1 text-blue-500" />
                      <span>{hospital.beds} Beds</span>
                    </div>
                    <Link 
                      to="/login" 
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform"
                    >
                      View Details <FiArrowRight className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-800"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur rounded-2xl mb-8">
            <FiHeart className="text-5xl text-white" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Healthcare?
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Join thousands of hospitals and patients already using our platform for efficient healthcare management.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register" 
              className="group inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              <FiCheckCircle className="mr-2" />
              Get Started Free
              <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/login" 
              className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              <FiPhone className="mr-2" />
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Info Bar */}
      <section className="py-8 bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center">
                <FiPhone className="mr-2 text-primary-400" />
                <span>Emergency: <strong>108</strong></span>
              </div>
              <div className="flex items-center">
                <FiMail className="mr-2 text-primary-400" />
                <span>support@healthcarehms.com</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <FiClock className="mr-1" />
              <span>24/7 Support Available</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
