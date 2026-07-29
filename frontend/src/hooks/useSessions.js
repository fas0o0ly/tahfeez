// src/hooks/useSessions.js
import { useState, useEffect, useCallback } from 'react';
import { sessionApi } from '../api/sessionApi';
import toast from 'react-hot-toast';

export const useSessions = (initialFilters = {}) => {
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1, limit: 20,
    type: '', status: '', gender: '', language: '',
    ...initialFilters,
  });

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const clean = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== null)
      );
      const { data } = await sessionApi.listSessions(clean);
      setSessions(data.data.sessions);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const updateFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const setPage = (page) =>
    setFilters((prev) => ({ ...prev, page }));

  return { sessions, pagination, loading, error, filters, updateFilter, setPage, refetch: fetchSessions };
};