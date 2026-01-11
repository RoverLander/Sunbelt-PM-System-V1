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

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Check active session - wrap in try/catch for web container compatibility
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('Auth session check failed (expected in web containers):', error.message);
          if (isMounted) setLoading(false);
          return;
        }

        if (data?.session?.user && isMounted) {
          fetchUserDetails(data.session.user.id);
        } else if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.warn('Auth init error (expected in web containers):', err.message);
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes - wrap in try/catch
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          // Ignore TOKEN_REFRESHED events which cause navigation errors
          if (event === 'TOKEN_REFRESHED') return;

          if (session?.user && isMounted) {
            fetchUserDetails(session.user.id);
          } else if (isMounted) {
            setUser(null);
            setLoading(false);
          }
        }
      );
      subscriptionRef.current = data?.subscription;
    } catch (err) {
      console.warn('Auth state change listener failed:', err.message);
    }

    return () => {
      isMounted = false;
      try {
        subscriptionRef.current?.unsubscribe();
      } catch {
        // Ignore unsubscribe errors
      }
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