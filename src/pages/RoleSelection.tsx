import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { User as UserIcon, Car } from 'lucide-react';
import { cn } from '../lib/utils';
import { Navigate, useNavigate } from 'react-router-dom';

export default function RoleSelection() {
  const { user, needsRoleSelection, selectRole } = useAuth();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" />;
  if (!needsRoleSelection) return <Navigate to="/" />;

  const handleSelect = async (role: 'USER' | 'DRIVER') => {
    await selectRole(role);
    navigate(role === 'USER' ? '/home' : '/driver/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm glass rounded-[32px] p-8 relative z-10 flex flex-col items-center"
      >
        <h1 className="text-2xl font-bold mb-2 text-center text-glow">How will you use RoadSOS?</h1>
        <p className="text-white/80 text-center mb-8 text-sm">Select your role to get started.</p>

        <div className="w-full space-y-4">
          <button 
            onClick={() => handleSelect('USER')}
            className={cn(
              "w-full py-4 rounded-2xl font-semibold transition-all",
              "bg-[#242736] border border-[#cc6a53]/50 hover:bg-[#2c3042] text-white",
              "flex flex-col items-center justify-center gap-2",
              "shadow-[0_0_15px_rgba(204,106,83,0.3)]"
            )}
          >
            <UserIcon className="w-8 h-8 text-[#cc6a53]" />
            I Need Assistance
          </button>
          
          <button 
            onClick={() => handleSelect('DRIVER')}
            className={cn(
              "w-full py-4 rounded-2xl font-semibold transition-all bg-[#1a1c24]/80",
              "flex flex-col items-center justify-center gap-2 border border-white/5 hover:bg-[#2c3042]"
            )}
          >
            <Car className="w-8 h-8 text-[#7695db]" />
            I'm a Provider
          </button>
        </div>
      </motion.div>
    </div>
  );
}
