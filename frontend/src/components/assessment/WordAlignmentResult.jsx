const STATUS_STYLE = {
  correct: 'text-forest-900',
  wrong:   'text-red-500 underline decoration-red-300',
  missing: 'text-red-500 line-through decoration-red-300',
  extra:   'text-amber-600',
};

const STATUS_LABEL = {
  correct: 'Correct',
  wrong:   'Wrong word',
  missing: 'Missing word',
  extra:   'Extra word (not in verse)',
};

// `words` is the per-word alignment array stored in tajweed_feedback for
// memorization-checker assessments: [{ reference_word, recognized_word, status }]
const WordAlignmentResult = ({ words = [] }) => {
  if (words.length === 0) return null;

  return (
    <div dir="rtl" className="font-arabic text-2xl leading-relaxed flex flex-wrap gap-2 justify-end">
      {words.map((w, idx) => (
        <span
          key={idx}
          title={STATUS_LABEL[w.status]}
          className={`${STATUS_STYLE[w.status] || 'text-gray-700'} cursor-default`}
        >
          {w.status === 'extra' ? w.recognized_word : w.reference_word}
        </span>
      ))}
    </div>
  );
};

export default WordAlignmentResult;
