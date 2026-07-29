// src/components/common/TeacherProfileModal.jsx
import { useEffect, useState } from 'react';
import Modal from './Modal';
import Badge from './Badge';
import Avatar from './Avatar';
import { Spinner } from './EmptyState';
import { sessionApi } from '../../api/sessionApi';

const TeacherProfileModal = ({ isOpen, onClose, sessionId }) => {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!isOpen || !sessionId) return;

    setLoading(true);
    setError(null);
    setTeacher(null);

    sessionApi.getSessionTeacherProfile(sessionId)
      .then(({ data }) => setTeacher(data.data.teacher))
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load teacher profile');
      })
      .finally(() => setLoading(false));
  }, [isOpen, sessionId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Teacher Profile" size="md">
      {loading && (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-gray-500 text-center py-6">{error}</p>
      )}

      {!loading && !error && teacher && (
        <div>
          <div className="flex items-center gap-4 mb-5">
            <Avatar src={teacher.avatar_url} name={teacher.full_name} size="lg" />
            <div>
              <p className="font-medium text-gray-800">{teacher.full_name}</p>
              {teacher.ijazah_verified && (
                <Badge variant="gold" className="mt-1">✓ Ijazah Verified</Badge>
              )}
            </div>
          </div>

          {teacher.bio && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Bio</p>
              <p className="text-sm text-gray-600 leading-relaxed">{teacher.bio}</p>
            </div>
          )}

          {teacher.qualifications && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Qualifications</p>
              <p className="text-sm text-gray-600 leading-relaxed">{teacher.qualifications}</p>
            </div>
          )}

          {teacher.specializations?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Specializations
              </p>
              <div className="flex flex-wrap gap-1.5">
                {teacher.specializations.map((s) => (
                  <Badge key={s} variant="teacher">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {teacher.years_experience && (
            <p className="text-sm text-gray-500">
              {teacher.years_experience} years of teaching experience
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default TeacherProfileModal;
