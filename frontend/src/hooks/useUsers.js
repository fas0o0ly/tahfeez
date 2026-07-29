// src/hooks/useUsers.js
import { useState, useEffect, useCallback } from 'react';
import { userApi } from '../api/userApi';
import toast from 'react-hot-toast';

export const useUsers = (initialFilters = {}) => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    role: '',
    status: '',
    search: '',
    ...initialFilters,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Strip empty filter values before sending
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== null)
      );
      const { data } = await userApi.listUsers(cleanFilters);
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const setPage = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await userApi.updateUserStatus(userId, status);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status } : u))
      );
      toast.success(`User ${status} successfully`);
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
      return false;
    }
  };

  return {
    users,
    pagination,
    loading,
    error,
    filters,
    updateFilter,
    setPage,
    updateUserStatus,
    refetch: fetchUsers,
  };
};