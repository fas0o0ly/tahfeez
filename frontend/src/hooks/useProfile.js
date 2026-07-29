// src/hooks/useProfile.js
import { useState, useEffect, useCallback } from 'react';
import { userApi } from '../api/userApi';
import toast from 'react-hot-toast';

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await userApi.getProfile();
      setProfile(data.data.profile);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates) => {
    setSaving(true);
    try {
      const { data } = await userApi.updateProfile(updates);
      setProfile(data.data.profile);
      toast.success('Profile updated successfully');
      return true;
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    setSaving(true);
    try {
      const { data } = await userApi.uploadAvatar(formData);
      setProfile((prev) => ({ ...prev, avatar_url: data.data.avatar_url }));
      toast.success('Avatar updated');
      return data.data.avatar_url;
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to upload avatar';
      toast.error(message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const removeAvatar = async () => {
    setSaving(true);
    try {
      await userApi.removeAvatar();
      setProfile((prev) => ({ ...prev, avatar_url: null }));
      toast.success('Avatar removed');
    } catch (err) {
      toast.error('Failed to remove avatar');
    } finally {
      setSaving(false);
    }
  };

  return { profile, loading, saving, error, updateProfile, uploadAvatar, removeAvatar, refetch: fetchProfile };
};