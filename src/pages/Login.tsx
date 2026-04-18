import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, Mail, Lock, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, needsRoleSelection, signInWithEmail, role } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (user && !needsRoleSelection) {
    return <Navigate to={role === 'DRIVER' ? '/driver/dashboard' : '/home'} />;
  }
  
  if (user && needsRoleSelection) {
    return <Navigate to="/role-select" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setErrorMsg('');
    setLoading(true);

    const { error } = await signInWithEmail(email, password, isSignUp);
    if (error) {
       let msg = error.message;
       if (error.message.toLowerCase().includes('rate limit')) {
           msg = "Email rate limit exceeded! If you are the developer, go to your Supabase Dashboard -> Authentication -> Providers -> Email, and toggle OFF 'Confirm Email' to disable limits for testing.";
       }
       setErrorMsg(msg);
       setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass rounded-[32px] p-8 relative z-10 flex flex-col items-center shadow-2xl"
      >
        <div className="w-20 h-20 rounded-full glass-dark flex items-center justify-center mb-6 border border-white/5 shadow-inner">
          <Wrench className="w-10 h-10 text-[#cc6a53] drop-shadow-[0_0_10px_rgba(204,106,83,0.6)]" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-glow text-white">RoadSOS</h1>
        <p className="text-white/60 text-center mb-8 text-sm">Emergency roadside assistance, just a tap away.</p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-3">
             <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input 
                   type="email" 
                   value={email}
                   onChange={e => setEmail(e.target.value)}
                   placeholder="Email address"
                   className="w-full bg-[#1a1c24]/80 border-none rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#7695db]/50 transition-all font-medium"
                   required
                />
             </div>
             <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input 
                   type="password" 
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   placeholder="Password"
                   className="w-full bg-[#1a1c24]/80 border-none rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#7695db]/50 transition-all font-medium"
                   required
                />
             </div>
          </div>

          <AnimatePresence>
            {errorMsg && (
                <motion.p 
                   initial={{ opacity: 0, height: 0 }} 
                   animate={{ opacity: 1, height: 'auto' }}
                   className="text-red-400 text-xs font-semibold text-center mt-2 bg-red-500/10 py-2 rounded-lg border border-red-500/20"
                >
                    {errorMsg}
                </motion.p>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 mt-4",
              "bg-[#242736] border border-white/5 text-white/90 hover:bg-[#2c3042] disabled:opacity-50",
              "shadow-lg"
            )}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-white/50 text-sm mt-6 mb-2">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
        </p>
        <button 
            onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
            className="text-white text-sm font-semibold hover:text-[#7695db] transition-colors underline decoration-white/20 underline-offset-4"
        >
            {isSignUp ? 'Sign In instead' : 'Create an Account'}
        </button>

      </motion.div>
    </div>
  );
}


