// src/components/common/SessionCard.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Badge from './Badge';
import Avatar from './Avatar';

const statusVariant = {
  draft:      'info',
  scheduled:  'pending',
  live:       'success',
  completed:  'info',
  cancelled:  'error',
};

const typeLabel = {
  one_on_one: 'One-on-One',
  group:      'Group',
  open:       'Open',
};

const SessionCard = ({ session, to, action, index = 0, onViewTeacher }) => {
  const enrolledCount = parseInt(session.enrolled_count ?? 0, 10);
  const spotsLeft = session.max_students - enrolledCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover
                 transition-all duration-200 overflow-hidden"
    >
      {/* Status bar */}
      <div className={`h-1 w-full ${
        session.status === 'live'      ? 'bg-emerald-400' :
        session.status === 'scheduled' ? 'bg-amber-400'   :
        session.status === 'draft'     ? 'bg-gray-300'    :
        session.status === 'cancelled' ? 'bg-red-400'     :
        'bg-blue-300'
      }`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-forest-900 text-base leading-tight truncate">
              {session.title}
            </h3>
            {session.description && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                {session.description}
              </p>
            )}
          </div>
          <Badge variant={statusVariant[session.status]}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </Badge>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-xs bg-forest-50 text-forest-600 px-2.5 py-1 rounded-full capitalize">
            {typeLabel[session.session_type] || session.session_type}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize">
            {session.session_language}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize">
            {session.session_gender}
          </span>
          {(session.age_range_min || session.age_range_max) && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              Age {session.age_range_min ?? '?'}–{session.age_range_max ?? '?'}
            </span>
          )}
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(session.scheduled_at).toLocaleDateString('en-MY', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
          })}
          <span className="text-gray-300 mx-1">·</span>
          {session.duration_minutes} min
          {session.session_days?.length > 0 && (
            <>
              <span className="text-gray-300 mx-1">·</span>
              {session.session_days.map((d) => d.slice(0, 3)).join(', ')}
            </>
          )}
        </div>

        {/* Teacher + capacity row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {session.teacher_name ? (
              onViewTeacher ? (
                <button
                  type="button"
                  onClick={() => onViewTeacher(session)}
                  className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                >
                  <Avatar src={session.teacher_avatar} name={session.teacher_name} size="xs" />
                  <span className="text-xs text-gray-500 underline-offset-2 hover:underline">
                    {session.teacher_name}
                  </span>
                  {session.teacher_ijazah_verified && (
                    <span className="text-xs text-gold-600">✓</span>
                  )}
                </button>
              ) : (
                <>
                  <Avatar src={session.teacher_avatar} name={session.teacher_name} size="xs" />
                  <span className="text-xs text-gray-500">{session.teacher_name}</span>
                  {session.teacher_ijazah_verified && (
                    <span className="text-xs text-gold-600">✓</span>
                  )}
                </>
              )
            ) : (
              <span className="text-xs text-gray-400 italic">No teacher assigned</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">
              {enrolledCount}/{session.max_students}
            </span>
            {spotsLeft <= 3 && spotsLeft > 0 && (
              <span className="text-xs text-amber-600 font-medium">
                {spotsLeft} left
              </span>
            )}
            {spotsLeft <= 0 && (
              <Badge variant="error">Full</Badge>
            )}
          </div>
        </div>

        {/* Enrollment status for students */}
        {session.my_enrollment_status && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <Badge variant={
              session.my_enrollment_status === 'approved'  ? 'success' :
              session.my_enrollment_status === 'pending'   ? 'pending' :
              session.my_enrollment_status === 'rejected'  ? 'error'   : 'info'
            }>
              Your status: {session.my_enrollment_status}
            </Badge>
          </div>
        )}

        {/* Footer actions */}
        {(to || action) && (
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-end gap-2">
            {action}
            {to && (
              <Link
                to={to}
                className="text-xs font-medium text-forest-600 hover:text-forest-800
                           transition-colors px-3 py-1.5 rounded-lg hover:bg-forest-50"
              >
                View details →
              </Link>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SessionCard;