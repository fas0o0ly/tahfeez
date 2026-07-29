import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { assessmentApi } from '../../api/assessmentApi';
import toast from 'react-hot-toast';

const TeacherReviewModal = ({ isOpen, onClose, assessment, onReviewSubmitted }) => {
  const [reviewText, setReviewText] = useState(assessment?.teacher_review || '');
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async () => {
    if (!reviewText.trim()) return;
    setLoading(true);
    try {
      await assessmentApi.submitReview(assessment.id, reviewText.trim());
      toast.success('Review submitted');
      onReviewSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Teacher Review" size="md">
      {assessment && (
        <>
          {/* Assessment info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="font-arabic text-forest-900 text-lg">{assessment.name_arabic}</p>
            <p className="text-xs text-gray-400 mt-1">
              {assessment.name_transliteration}
              {' · '}Verses {assessment.from_verse}–{assessment.to_verse}
              {assessment.overall_score !== null && ` · Score: ${assessment.overall_score}/100`}
            </p>
          </div>

          {/* Audio player */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Student Recitation</p>
            {assessment.audio_url && assessment.audio_url !== 'unavailable' ? (
              <audio
                controls
                src={assessment.audio_url}
                className="w-full h-10 rounded-lg"
                style={{ accentColor: '#2d6a4f' }}
              >
                Your browser does not support audio playback.
              </audio>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50
                              border border-gray-200 text-sm text-gray-400">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                No audio recording available
              </div>
            )}
          </div>
        </>
      )}

      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        rows={5}
        maxLength={2000}
        placeholder="Provide feedback on this recitation — pronunciation tips, tajweed corrections, encouragement..."
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                   focus:outline-none focus:ring-2 focus:ring-forest-200
                   focus:border-forest-400 resize-none mb-1"
      />
      <p className="text-xs text-gray-400 text-right mb-4">{reviewText.length}/2000</p>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          size="sm"
          loading={loading}
          disabled={!reviewText.trim()}
          onClick={handleSubmit}
        >
          Submit Review
        </Button>
      </div>
    </Modal>
  );
};

export default TeacherReviewModal;
