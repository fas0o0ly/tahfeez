// src/hooks/useFormError.js
import { useState } from 'react';

// Parses axios errors into a human-readable string
export const useFormError = () => {
  const [error, setError] = useState(null);

  const parseError = (err) => {
    if (err?.response?.data?.errors?.length) {
      // Validation errors array — show first one
      setError(err.response.data.errors[0].message);
    } else if (err?.response?.data?.message) {
      setError(err.response.data.message);
    } else if (err?.message) {
      setError(err.message);
    } else {
      setError('Something went wrong. Please try again.');
    }
  };

  const clearError = () => setError(null);

  return { error, parseError, clearError, setError };
};