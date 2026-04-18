import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import RoleSelection from './pages/RoleSelection';
import Layout from './components/Layout';
import UserHome from './pages/user/Home';
import SOS from './pages/user/SOS';
import DriverDashboard from './pages/driver/Dashboard';
import DriverRequests from './pages/driver/Requests';
import Profile from './pages/Profile';

function PrivateRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole?: 'USER' | 'DRIVER' }) {
  const { user, role, loading, needsRoleSelection } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (needsRoleSelection) return <Navigate to="/role-select" />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" />;

  return <>{children}</>;
}

function AppRoutes() {
  const { user, role, loading, needsRoleSelection } = useAuth();

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center text-white/50">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/role-select" element={<RoleSelection />} />
      
      <Route path="/" element={
        !user ? <Navigate to="/login" /> : 
        needsRoleSelection ? <Navigate to="/role-select" /> :
        <Navigate to={role === 'DRIVER' ? '/driver/dashboard' : '/home'} />
      } />

      <Route element={<Layout />}>
        {/* User Routes */}
        <Route path="/home" element={
          <PrivateRoute requiredRole="USER"><UserHome /></PrivateRoute>
        } />
        <Route path="/sos" element={
          <PrivateRoute requiredRole="USER"><SOS /></PrivateRoute>
        } />
        
        {/* Driver Routes */}
        <Route path="/driver/dashboard" element={
          <PrivateRoute requiredRole="DRIVER"><DriverDashboard /></PrivateRoute>
        } />
        <Route path="/driver/requests" element={
          <PrivateRoute requiredRole="DRIVER"><DriverRequests /></PrivateRoute>
        } />

        {/* Shared Routes */}
        <Route path="/profile" element={
          <PrivateRoute><Profile /></PrivateRoute>
        } />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#0d0f15]">
        <div 
            className="absolute top-[-20%] left-[-20%] w-[50vw] h-[70vh] rounded-[40%] orb-1 opacity-90 animate-blob" 
            style={{ transform: "rotate(30deg)" }} 
        />
        <div 
            className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[80vh] rounded-[45%] orb-2 opacity-90 animate-blob animation-delay-2000" 
            style={{ transform: "rotate(-15deg)" }} 
        />
        <div 
            className="absolute top-[15%] right-[25%] w-64 h-64 rounded-full orb-3 opacity-70 animate-blob animation-delay-4000" 
        />
      </div>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}


