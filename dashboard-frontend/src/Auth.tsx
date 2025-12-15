import type { Session, User } from '@supabase/supabase-js';
import React, { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from './supabaseClient';

export type UserRole = 'comun' | 'gestor' | null;

// Create a context for authentication
const AuthContext = createContext<{
  session: Session | null;
  user: User | null;
  role: UserRole;
  loading: boolean;
  selectRole: (role: 'comun' | 'gestor', password?: string) => boolean;
  signOut: () => void;
}>({
  session: null,
  user: null,
  role: null,
  loading: true,
  selectRole: () => false,
  signOut: () => {},
});

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setData = async () => {
      // 1. Get Supabase session
      const { data: { session: supabaseSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting Supabase session:", error);
        setLoading(false);
        return;
      }
      
      setSession(supabaseSession);
      setUser(supabaseSession?.user ?? null);

      // 2. If a session exists, check for a stored role
      if (supabaseSession) {
        const storedRole = localStorage.getItem('userRole');
        if (storedRole === 'comun' || storedRole === 'gestor') {
          setRole(storedRole as UserRole);
        }
      } else {
        // If no session, clear the role
        localStorage.removeItem('userRole');
        setRole(null);
      }
      
      setLoading(false);
    };

    setData();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
      setSession(supabaseSession);
      setUser(supabaseSession?.user ?? null);
      setLoading(false);
      
      // If user signs out, clear the role from state and storage
      if (!supabaseSession) {
        localStorage.removeItem('userRole');
        setRole(null);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const selectRole = (selected: 'comun' | 'gestor', password?: string): boolean => {
    if (selected === 'comun') {
      localStorage.setItem('userRole', 'comun');
      setRole('comun');
      return true;
    }
    if (selected === 'gestor') {
      const GESTOR_PASS = 'adminfauna';
      if (password === GESTOR_PASS) {
        localStorage.setItem('userRole', 'gestor');
        setRole('gestor');
        return true;
      }
      return false; // Wrong password
    }
    return false;
  };

  const signOut = () => {
    localStorage.removeItem('userRole');
    setRole(null);
    supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    role,
    loading,
    selectRole,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};