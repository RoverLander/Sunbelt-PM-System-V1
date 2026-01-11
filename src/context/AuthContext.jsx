import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // Prevent double initialization
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        // Check for existing session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('Auth session check failed:', error.message);
          if (isMounted) setLoading(false);
          return;
        }

        if (data?.session?.user && isMounted) {
          fetchUserDetails(data.session.user.id);
        } else if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.warn('Auth init error:', err.message);
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // Set up auth state listener
    const { data } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event);

        if (session?.user && isMounted) {
          fetchUserDetails(session.user.id);
        } else if (isMounted && event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );
    subscriptionRef.current = data?.subscription;

    return () => {
      isMounted = false;
      initializingRef.current = false;
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  const fetchUserDetails = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) throw userError;

    setUser(userData);
    return userData;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
