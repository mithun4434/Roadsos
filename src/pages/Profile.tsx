import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, Bell, CircleUserRound, ChevronDown, ChevronRight, Save, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Profile() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const [expandedSection, setExpandedSection] = useState<'prefs' | 'notifs' | null>(null);
  
  const [nameInput, setNameInput] = useState('');
  const [isSavingPref, setIsSavingPref] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);

  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  useEffect(() => {
     if (user) {
        setNameInput(user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
     }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSavePrefs = async () => {
     if (!import.meta.env.VITE_SUPABASE_URL || !user) return;
     setIsSavingPref(true);
     
     // Update auth metadata
     const { error: authErr } = await supabase.auth.updateUser({
        data: { name: nameInput, full_name: nameInput }
     });

     // Update public users table
     if (!authErr) {
        await supabase.from('users').update({ name: nameInput }).eq('id', user.id);
        setPrefSaved(true);
        setTimeout(() => setPrefSaved(false), 2000);
     }
     
     setIsSavingPref(false);
  };

  return (
    <div className="p-4 space-y-8 animate-in fade-in duration-500 pb-32">
      <div className="mt-8 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full glass flex items-center justify-center mb-4 overflow-hidden border-2 border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          {user?.user_metadata?.avatar_url ? (
             <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover"/>
          ) : (
             <CircleUserRound className="w-12 h-12 text-white/40" />
          )}
        </div>
        <h2 className="text-2xl font-bold">{nameInput || user?.email || 'Guest User'}</h2>
        <div className="mt-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold tracking-widest uppercase border border-white/20">
          {role}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest pl-2">Settings</h3>
        
        <div className="glass rounded-[24px] overflow-hidden border border-white/10 shadow-2xl">
          
          {/* Account Preferences */}
          <div 
            onClick={() => setExpandedSection(prev => prev === 'prefs' ? null : 'prefs')}
            className="p-4 flex items-center gap-4 border-b border-white/5 hover:bg-white/5 active:bg-white/10 cursor-pointer transition-colors"
          >
            <Settings className="w-5 h-5 text-white/70" />
            <span className="flex-1 font-medium">Account Preferences</span>
            {expandedSection === 'prefs' ? <ChevronDown className="w-5 h-5 text-white/40" /> : <ChevronRight className="w-5 h-5 text-white/40" />}
          </div>
          <AnimatePresence>
            {expandedSection === 'prefs' && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }} 
                 animate={{ height: 'auto', opacity: 1 }} 
                 exit={{ height: 0, opacity: 0 }}
                 className="overflow-hidden bg-black/20"
               >
                 <div className="p-4 space-y-4 border-b border-white/5 pb-6">
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/50 uppercase tracking-wider ml-1 font-semibold">Display Name</label>
                      <input 
                         type="text" 
                         value={nameInput}
                         onChange={(e) => setNameInput(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors shadow-inner"
                         placeholder="Your Name"
                      />
                    </div>
                    <button 
                       onClick={handleSavePrefs}
                       disabled={isSavingPref}
                       className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2 text-sm font-bold shadow-lg"
                    >
                       {isSavingPref ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 
                        prefSaved ? <><Check className="w-4 h-4 text-green-400" /> Saved</> : 
                        <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>

          {/* Notifications */}
          <div 
            onClick={() => setExpandedSection(prev => prev === 'notifs' ? null : 'notifs')}
            className="p-4 flex items-center gap-4 border-b border-white/5 hover:bg-white/5 active:bg-white/10 cursor-pointer transition-colors"
          >
            <Bell className="w-5 h-5 text-white/70" />
            <span className="flex-1 font-medium">Notifications</span>
            {expandedSection === 'notifs' ? <ChevronDown className="w-5 h-5 text-white/40" /> : <ChevronRight className="w-5 h-5 text-white/40" />}
          </div>
          <AnimatePresence>
            {expandedSection === 'notifs' && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }} 
                 animate={{ height: 'auto', opacity: 1 }} 
                 exit={{ height: 0, opacity: 0 }}
                 className="overflow-hidden bg-black/20"
               >
                 <div className="p-4 space-y-5 border-b border-white/5 pb-6">
                    <div className="flex items-center justify-between">
                       <div>
                         <span className="text-sm font-semibold text-white/90 block">Push Notifications</span>
                         <span className="text-xs text-white/40">Receive live alerts when drivers are en route</span>
                       </div>
                       <button 
                          onClick={() => setPushNotif(!pushNotif)}
                          className={`w-12 h-6 rounded-full transition-colors relative flex items-center flex-shrink-0 ${pushNotif ? 'bg-orange-500' : 'bg-white/20'}`}
                       >
                          <div className={`w-5 h-5 bg-white rounded-full absolute transform transition-transform ${pushNotif ? 'translate-x-6' : 'translate-x-1'}`} />
                       </button>
                    </div>
                    <div className="flex items-center justify-between">
                       <div>
                         <span className="text-sm font-semibold text-white/90 block">Email Alerts</span>
                         <span className="text-xs text-white/40">Receive receipts and summary updates</span>
                       </div>
                       <button 
                          onClick={() => setEmailNotif(!emailNotif)}
                          className={`w-12 h-6 rounded-full transition-colors relative flex items-center flex-shrink-0 ${emailNotif ? 'bg-orange-500' : 'bg-white/20'}`}
                       >
                          <div className={`w-5 h-5 bg-white rounded-full absolute transform transition-transform ${emailNotif ? 'translate-x-6' : 'translate-x-1'}`} />
                       </button>
                    </div>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>

          {/* Sign Out */}
          <div 
            onClick={handleSignOut}
            className="p-4 flex items-center gap-4 text-red-400 hover:bg-red-500/10 active:bg-red-500/20 cursor-pointer transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="flex-1 font-medium">Sign Out</span>
          </div>
        </div>
      </div>
    </div>
  );
}
