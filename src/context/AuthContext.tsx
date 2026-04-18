import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/utils';
import { User, Session } from '@supabase/supabase-js';

type AuthRole = 'USER' | 'DRIVER' | null;

interface AuthContextType {
  user: User | null;
  role: AuthRole;
  loading: boolean;
  needsRoleSelection: boolean;
  signInWithEmail: (email: string, password: string, isSignUp: boolean) => Promise<{error: any}>;
  signOut: () => Promise<void>;
  selectRole: (role: 'USER' | 'DRIVER') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AuthRole>(null);
  const [loading, setLoading] = useState(true);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session: Session | null) => {
    try {
      if (!session?.user) {
        setUser(null);
        setRole(null);
        setNeedsRoleSelection(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Fetch role from DB
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (error || !data) {
        // User exists in auth but not in strict typed users table, or role is null
        setNeedsRoleSelection(true);
        setRole(null);
      } else {
        setRole(data.role as AuthRole);
        setNeedsRoleSelection(false);
      }

      setUser(session.user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string, isSignUp: boolean) => {
    
    if (isSignUp) {
        const res = await supabase.auth.signUp({ email, password });
        if (!res.error && !res.data.session) {
           return { error: new Error("Account created! Please check your email inbox to verify it before signing in.") };
        }
        return { error: res.error };
    } else {
        const res = await supabase.auth.signInWithPassword({ email, password });
        return { error: res.error };
    }
  };
  
  const selectRole = async (selectedRole: 'USER' | 'DRIVER') => {
    if (!user) return;
    setLoading(true);
    try {
      // Upsert into users table
      const { error: userError } = await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        role: selectedRole
      });
      
      if (userError) {
          console.error("Error saving user profile:", userError);
          alert("Error saving profile. Permissions block or DB issue.");
          setLoading(false);
          return;
      }
      
      if (selectedRole === 'DRIVER') {
          // If driver, we must also create a provider record
          // Get a default service first if we don't have one
          const { data: svc } = await supabase.from('services').select('id').limit(1).single();
          
          const providerData: any = { user_id: user.id };
          if (svc) providerData.service_id = svc.id;

          const { error: provError } = await supabase.from('providers').upsert(
              providerData, 
              { onConflict: 'user_id' }
          );

          if (provError) {
             console.error("Error creating provider:", provError);
             alert("Error creating provider profile.");
             setLoading(false);
             return;
          }
      }

      setRole(selectedRole);
      setNeedsRoleSelection(false);
    } catch (e) {
      console.error(e);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, needsRoleSelection, signInWithEmail, signOut, selectRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

