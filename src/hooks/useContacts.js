// ============================================================================
// useContacts Hook
// ============================================================================
// Fetches both logged-in users AND factory contacts for use in dropdowns.
// Factory contacts are people who can be selected but don't have login accounts.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

/**
 * Hook to fetch all contacts (users + factory contacts)
 * @param {boolean} autoFetch - Whether to fetch on mount (default: true)
 * @returns {object} - { contacts, users, factoryContacts, loading, error, refetch }
 */
export function useContacts(autoFetch = true) {
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [factoryContacts, setFactoryContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch logged-in users (PMs, Directors, VPs)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (usersError) throw usersError;

      // Fetch factory contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('factory_contacts')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (contactsError) throw contactsError;

      // Process users - add contact_type
      const processedUsers = (usersData || []).map(u => ({
        ...u,
        contact_type: 'user',
        display_role: u.role
      }));

      // Process factory contacts - add contact_type and normalize fields
      const processedContacts = (contactsData || []).map(c => ({
        ...c,
        contact_type: 'factory',
        role: c.department,
        display_role: `${c.role_code}-${c.factory_code}`
      }));

      setUsers(processedUsers);
      setFactoryContacts(processedContacts);
      
      // Combine: users first (grouped), then factory contacts (grouped by factory)
      setContacts([...processedUsers, ...processedContacts]);

    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchContacts();
    }
  }, [autoFetch, fetchContacts]);

  return {
    contacts,      // Combined list of all contacts
    users,         // Just logged-in users
    factoryContacts, // Just factory contacts
    loading,
    error,
    refetch: fetchContacts
  };
}

/**
 * Hook to fetch contacts filtered by factory
 * @param {string} factoryCode - Factory code (e.g., 'NWBS', 'WM-EAST')
 * @returns {object} - { contacts, loading, error, refetch }
 */
export function useFactoryContacts(factoryCode) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchContacts = useCallback(async () => {
    if (!factoryCode) {
      setContacts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('factory_contacts')
        .select('*')
        .eq('factory_code', factoryCode)
        .eq('is_active', true)
        .order('name');
      
      if (fetchError) throw fetchError;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching factory contacts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [factoryCode]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return { contacts, loading, error, refetch: fetchContacts };
}

/**
 * Hook to fetch contacts filtered by department/role
 * @param {string} roleCode - Role code (e.g., 'SALES', 'PURCH', 'ENG')
 * @returns {object} - { contacts, loading, error, refetch }
 */
export function useContactsByRole(roleCode) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchContacts = useCallback(async () => {
    if (!roleCode) {
      setContacts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('factory_contacts')
        .select('*')
        .eq('role_code', roleCode)
        .eq('is_active', true)
        .order('factory_code', { ascending: true })
        .order('name', { ascending: true });
      
      if (fetchError) throw fetchError;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts by role:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roleCode]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return { contacts, loading, error, refetch: fetchContacts };
}

export default useContacts;