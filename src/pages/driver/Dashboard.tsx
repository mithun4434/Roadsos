import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Power, MapPin, Navigation } from 'lucide-react';
import { cn, supabase } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({ today: 0, earnings: 0 });

  useEffect(() => {
    if (!user || !import.meta.env.VITE_SUPABASE_URL) return;
    
    // Fetch initial status
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('providers')
        .select('availability')
        .eq('user_id', user.id)
        .single();
      
      if (data) setIsOnline(data.availability);
      
      // Mock stats for demo
      setStats({ today: Math.floor(Math.random() * 5), earnings: Math.floor(Math.random() * 2000) });
    };
    fetchStatus();
  }, [user]);

  const toggleStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    
    if (user && import.meta.env.VITE_SUPABASE_URL) {
      await supabase
        .from('providers')
        .update({ availability: newStatus })
        .eq('user_id', user.id);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mt-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/60">Manage your availability</p>
        </div>
        <div className="w-12 h-12 rounded-full glass overflow-hidden border border-white/20">
          <img src={user?.user_metadata?.avatar_url || "https://picsum.photos/seed/driver/100/100"} alt="Profile" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Online Toggle */}
      <div className={cn(
        "glass-dark p-6 rounded-[32px] flex flex-col items-center justify-center py-12 transition-all duration-500",
        isOnline ? "shadow-[0_0_50px_rgba(34,197,94,0.15)] border border-green-500/30" : "border-white/5"
      )}>
        <button 
          onClick={toggleStatus}
          className={cn(
            "w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-500 border-4 mb-8",
            isOnline 
              ? "bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.4)]" 
              : "bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          )}
        >
          <Power className={cn("w-14 h-14", isOnline && "drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]")} />
        </button>
        <h2 className={cn(
            "text-2xl font-bold mb-2 tracking-wide text-glow",
            isOnline ? "text-green-400" : "text-white/80"
        )}>
          {isOnline ? 'ON DUTY' : 'OFF DUTY'}
        </h2>
        <p className="text-sm text-white/50">{isOnline ? 'Scanning for nearby emergencies...' : 'Go online to receive requests'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-5 rounded-[24px]">
           <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-2">Today's Jobs</p>
           <p className="text-3xl font-mono text-white text-glow">{stats.today}</p>
        </div>
        <div className="glass p-5 rounded-[24px]">
           <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-2">Earnings</p>
           <p className="text-3xl font-mono text-green-400 text-glow">₹{stats.earnings}</p>
        </div>
      </div>
    </div>
  );
}

