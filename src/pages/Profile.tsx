import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, Bell, CircleUserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="p-4 space-y-8 animate-in fade-in duration-500">
      <div className="mt-8 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full glass flex items-center justify-center mb-4 overflow-hidden">
          {user?.user_metadata?.avatar_url ? (
             <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover"/>
          ) : (
             <CircleUserRound className="w-12 h-12 text-white/40" />
          )}
        </div>
        <h2 className="text-2xl font-bold">{user?.user_metadata?.name || user?.email || 'Guest User'}</h2>
        <div className="mt-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold tracking-widest uppercase border border-white/20">
          {role}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest pl-2">Settings</h3>
        
        <div className="glass rounded-[24px] overflow-hidden">
          <div className="p-4 flex items-center gap-4 border-b border-white/10 active:bg-white/10 cursor-pointer">
            <Settings className="w-5 h-5 text-white/70" />
            <span className="flex-1">Account Preferences</span>
          </div>
          <div className="p-4 flex items-center gap-4 border-b border-white/10 active:bg-white/10 cursor-pointer">
            <Bell className="w-5 h-5 text-white/70" />
            <span className="flex-1">Notifications</span>
          </div>
          <div 
            onClick={handleSignOut}
            className="p-4 flex items-center gap-4 text-red-500 active:bg-white/10 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="flex-1">Sign Out</span>
          </div>
        </div>
      </div>
    </div>
  );
}
