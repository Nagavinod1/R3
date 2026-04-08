import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import StaffLayout from './layouts/StaffLayout';
import UserLayout from './layouts/UserLayout';
import PublicLayout from './layouts/PublicLayout';

// Public Pages
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/Users';
import AdminStaff from './pages/admin/Staff';
import AdminHospitals from './pages/admin/Hospitals';
import AdminAlerts from './pages/admin/Alerts';
import AdminBedBookings from './pages/admin/BedBookingManagement';
import AdminBedManagement from './pages/admin/BedManagement';
import AdminBloodManagement from './pages/admin/BloodManagement';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffBloodInventory from './pages/staff/BloodInventory';
import StaffBloodRequests from './pages/staff/BloodRequests';
import StaffBedManagement from './pages/staff/StaffBedManagement';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import UserBeds from './pages/user/FindBeds';
import UserBlood from './pages/user/BloodAvailability';
import UserMyRequests from './pages/user/MyRequests';
import UserProfile from './pages/user/Profile';
import UserChatbot from './pages/user/AIChatbot';

// Loading Component
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="spinner mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = user?.role === 'admin' ? '/admin' : 
                        user?.role === 'staff' ? '/staff' : '/user';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (isAuthenticated) {
    const redirectPath = user?.role === 'admin' ? '/admin' : 
                        user?.role === 'staff' ? '/staff' : '/user';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
      </Route>
      
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="staff" element={<AdminStaff />} />
        <Route path="hospitals" element={<AdminHospitals />} />
        <Route path="alerts" element={<AdminAlerts />} />
        <Route path="bed-bookings" element={<AdminBedBookings />} />
        <Route path="beds" element={<AdminBedManagement />} />
        <Route path="blood" element={<AdminBloodManagement />} />
      </Route>

      {/* Staff Routes */}
      <Route path="/staff" element={
        <ProtectedRoute allowedRoles={['staff']}>
          <StaffLayout />
        </ProtectedRoute>
      }>
        <Route index element={<StaffDashboard />} />
        <Route path="inventory" element={<StaffBloodInventory />} />
        <Route path="requests" element={<StaffBloodRequests />} />
        <Route path="beds" element={<StaffBedManagement />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>

      {/* User Routes */}
      <Route path="/user" element={
        <ProtectedRoute allowedRoles={['user']}>
          <UserLayout />
        </ProtectedRoute>
      }>
        <Route index element={<UserDashboard />} />
        <Route path="beds" element={<UserBeds />} />
        <Route path="blood" element={<UserBlood />} />
        <Route path="my-requests" element={<UserMyRequests />} />
        <Route path="chatbot" element={<UserChatbot />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-300">404</h1>
            <p className="text-xl text-gray-600 mt-4">Page not found</p>
            <a href="/" className="btn-primary mt-6 inline-block">Go Home</a>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default App;
