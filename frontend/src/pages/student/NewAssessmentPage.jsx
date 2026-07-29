import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout';
import WordAlignmentResult from '../../components/assessment/WordAlignmentResult';
import Button from '../../components/common/Button';
import { Spinner } from '../../components/common/EmptyState';
import { useMemorizationRecorder } from '../../hooks/useMemorizationRecorder';
import { useSurahs } from '../../hooks/useQuran';
import toast from 'react-hot-toast';

const PHASE_LABEL = {
  recording:  'Recording — recite clearly',
  recorded:   'Recording ready — review and submit',
  uploading:  'Uploading recitation...',
  processing: 'Transcribing and checking your recitation...',
};

const scoreColor = (score) => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
};

const NewAssessmentPage = () => {
  const { surahs, loading: surahsLoading } = useSurahs();
  const {
    phase, assessment, errorMessage,
    startRecording, stopRecording, submit, reset,
    isIdle, isRecording, isRecorded, isBusy, isComplete, isError,
  } = useMemorizationRecorder();

  const [selectedSurahId, setSelectedSurahId] = useState('');
  const [selectedSurah, setSelectedSurah]     = useState(null);
  const [fromVerse, setFromVerse]             = useState(1);
  const [toVerse, setToVerse]                 = useState(1);

  const handleSurahChange = (surahId) => {
    const surah = surahs.find((s) => s.id === surahId);
    setSelectedSurahId(surahId);
    setSelectedSurah(surah || null);
    setFromVerse(1);
    setToVerse(Math.min(5, surah?.total_verses || 1));
  };

  const handleSubmit = () => {
    if (!selectedSurahId) { toast.error('Please select a surah'); return; }
    if (fromVerse > toVerse) { toast.error('Start verse must not exceed end verse'); return; }
    submit(selectedSurahId, fromVerse, toVerse);
  };

  return (
    <DashboardLayout title="New Assessment">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-2xl mx-auto"
      >
        <Link
          to="/student/assessments"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400
                     hover:text-forest-600 transition-colors mb-5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          My Assessments
        </Link>

        <AnimatePresence>
          {isIdle && (
            <motion.div
              key="setup"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-5"
            >
              <h2 className="font-display text-xl font-semibold text-forest-900 mb-1">
                New Recitation Assessment
              </h2>
              <p className="text-sm text-gray-400 mb-5">
                Checks whether you said the right words in the right order — not Tajweed or pronunciation.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Surah</label>
                {surahsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                    <Spinner size="sm" /> Loading surahs...
                  </div>
                ) : (
                  <select
                    value={selectedSurahId}
                    onChange={(e) => handleSurahChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400"
                  >
                    <option value="">— Choose a surah —</option>
                    {surahs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.surah_number}. {s.name_transliteration} ({s.name_arabic})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedSurah && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">From Verse</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedSurah.total_verses}
                      value={fromVerse}
                      onChange={(e) => setFromVerse(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">To Verse</label>
                    <input
                      type="number"
                      min={fromVerse}
                      max={selectedSurah.total_verses}
                      value={toVerse}
                      onChange={(e) => setToVerse(parseInt(e.target.value, 10) || fromVerse)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400"
                    />
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="full"
                onClick={startRecording}
                disabled={!selectedSurahId || surahsLoading}
              >
                Start Recording
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {(isRecording || isRecorded || isBusy || isComplete || isError) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <div className="flex items-center gap-3 mb-4">
              {isRecording && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full
                                   rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              )}
              {isBusy && <Spinner size="sm" />}
              <p className="text-sm font-medium text-gray-700">
                {isComplete ? 'Result' : isError ? 'Something went wrong' : PHASE_LABEL[phase]}
              </p>
            </div>

            {isComplete && assessment && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className={`text-3xl font-display font-bold ${scoreColor(assessment.overall_score)}`}>
                    {assessment.overall_score}
                    <span className="text-sm font-body font-normal text-gray-400">/100</span>
                  </p>
                </div>
                <WordAlignmentResult words={assessment.tajweed_feedback} />
              </>
            )}

            {isError && errorMessage && (
              <p className="text-sm text-red-500 mb-3">{errorMessage}</p>
            )}

            <div className="mt-5 flex gap-3">
              {isRecording && (
                <Button variant="danger" size="full" onClick={stopRecording}>
                  Stop Recording
                </Button>
              )}
              {isRecorded && (
                <>
                  <Button variant="secondary" size="md" onClick={reset}>
                    Re-record
                  </Button>
                  <Button variant="primary" size="full" onClick={handleSubmit}>
                    Submit for Checking
                  </Button>
                </>
              )}
              {isComplete && (
                <>
                  <Button variant="secondary" size="md" onClick={reset}>
                    New Check
                  </Button>
                  <Link to="/student/assessments" className="flex-1">
                    <Button variant="primary" size="full">View All Results</Button>
                  </Link>
                </>
              )}
              {isError && (
                <Button variant="secondary" size="full" onClick={reset}>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default NewAssessmentPage;
