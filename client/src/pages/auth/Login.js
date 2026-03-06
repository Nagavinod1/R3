import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiActivity } from 'react-icons/fi';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('Login successful!');
      // Redirect based on role
      const redirectPath = result.user.role === 'admin' ? '/admin' :
                          result.user.role === 'staff' ? '/staff' : '/user';
      navigate(redirectPath);
    } else {
      toast.error(result.message || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <FiActivity className="text-primary-600 text-2xl" />
            </div>
            <span className="text-2xl font-bold text-white">HealthCare HMS</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Welcome Back</h2>
          <p className="text-gray-500 text-center mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FiEyeOff className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center"
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">Quick Demo Login</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Quick Login (Demo) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                const result = await login('admin@hospital.com', 'admin123');
                if (result.success) {
                  toast.success('Logged in as Admin!');
                  navigate('/admin');
                } else {
                  toast.error(result.message || 'Login failed');
                }
                setLoading(false);
              }}
              disabled={loading}
              className="btn-secondary py-2 text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                const result = await login('drrajeshku0@hospital.com', 'staff123');
                if (result.success) {
                  toast.success('Logged in as Staff!');
                  navigate('/staff');
                } else {
                  toast.error(result.message || 'Login failed');
                }
                setLoading(false);
              }}
              disabled={loading}
              className="btn-secondary py-2 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
            >
              👨‍⚕️ Staff
            </button>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                const result = await login('ravi.teja@gmail.com', 'user123');
                if (result.success) {
                  toast.success('Logged in as User!');
                  navigate('/user');
                } else {
                  toast.error(result.message || 'Login failed');
                }
                setLoading(false);
              }}
              disabled={loading}
              className="btn-secondary py-2 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
            >
              👤 User
            </button>
          </div>

          {/* Register Link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
