import Badge from '../common/Badge';

const scoreColor = (score) => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
};

const statusVariant = {
  completed:  'success',
  pending:    'pending',
  processing: 'info',
  failed:     'error',
};

const AssessmentResultCard = ({ assessment, onClick, compact = false }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 shadow-card p-5
                  ${onClick ? 'cursor-pointer hover:border-forest-200 hover:shadow-md' : ''}
                  transition-all duration-200`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-arabic text-forest-900 text-lg leading-tight">
              {assessment.name_arabic}
            </span>
            <span className="text-xs text-gray-400">{assessment.name_transliteration}</span>
            <Badge variant={statusVariant[assessment.status] || 'info'}>
              {assessment.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-400">
            Verses {assessment.from_verse}–{assessment.to_verse}
            {' · '}
            {new Date(assessment.created_at).toLocaleDateString('en-MY', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
            {assessment.audio_duration_seconds > 0 && (
              <> · {Math.round(assessment.audio_duration_seconds)}s</>
            )}
          </p>
        </div>

        {assessment.overall_score !== null && assessment.overall_score !== undefined && (
          <div className={`text-3xl font-display font-bold flex-shrink-0 ${scoreColor(assessment.overall_score)}`}>
            {assessment.overall_score}
            <span className="text-sm font-body font-normal text-gray-400">/100</span>
          </div>
        )}
      </div>

      {assessment.teacher_review && !compact && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Teacher note</p>
          <p className="text-sm text-gray-600 line-clamp-2">{assessment.teacher_review}</p>
        </div>
      )}
    </div>
  );
};

export default AssessmentResultCard;
