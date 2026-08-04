import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/layout/DashboardLayout';
import WordAlignmentResult from '../../components/assessment/WordAlignmentResult';
import Button from '../../components/common/Button';
import { Spinner } from '../../components/common/EmptyState';
import { useMemorizationRecorder } from '../../hooks/useMemorizationRecorder';
import { useSurahs } from '../../hooks/useQuran';
import toast from 'react-hot-toast';

const scoreColor = (score) => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
};

const NewAssessmentPage = () => {
  const { t } = useTranslation();
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

  const PHASE_LABEL = {
    recording:  t('assess.new.phase.recording'),
    recorded:   t('assess.new.phase.recorded'),
    uploading:  t('assess.new.phase.uploading'),
    processing: t('assess.new.phase.processing'),
  };

  const handleSurahChange = (surahId) => {
    const surah = surahs.find((s) => s.id === surahId);
    setSelectedSurahId(surahId);
    setSelectedSurah(surah || null);
    setFromVerse(1);
    setToVerse(Math.min(5, surah?.total_verses || 1));
  };

  const handleSubmit = () => {
    if (!selectedSurahId) { toast.error(t('assess.new.selectSurahError')); return; }
    if (fromVerse > toVerse) { toast.error(t('assess.new.verseError')); return; }
    submit(selectedSurahId, fromVerse, toVerse);
  };

  return (
    <DashboardLayout title={t('assess.new.pageTitle')}>
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
          {t('assess.new.back')}
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
                {t('assess.new.setupTitle')}
              </h2>
              <p className="text-sm text-gray-400 mb-5">
                {t('assess.new.setupSubtitle')}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('assess.new.surahLabel')}</label>
                {surahsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                    <Spinner size="sm" /> {t('assess.new.loadingSurahs')}
                  </div>
                ) : (
                  <select
                    value={selectedSurahId}
                    onChange={(e) => handleSurahChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400"
                  >
                    <option value="">{t('assess.new.selectSurah')}</option>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('assess.new.fromVerse')}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('assess.new.toVerse')}</label>
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
                {t('assess.new.startRecording')}
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
                {isComplete ? t('assess.new.resultLabel') : isError ? t('assess.new.errorLabel') : PHASE_LABEL[phase]}
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
                  {t('assess.new.stopRecording')}
                </Button>
              )}
              {isRecorded && (
                <>
                  <Button variant="secondary" size="md" onClick={reset}>
                    {t('assess.new.reRecord')}
                  </Button>
                  <Button variant="primary" size="full" onClick={handleSubmit}>
                    {t('assess.new.submitBtn')}
                  </Button>
                </>
              )}
              {isComplete && (
                <>
                  <Button variant="secondary" size="md" onClick={reset}>
                    {t('assess.new.newCheck')}
                  </Button>
                  <Link to="/student/assessments" className="flex-1">
                    <Button variant="primary" size="full">{t('assess.new.viewAll')}</Button>
                  </Link>
                </>
              )}
              {isError && (
                <Button variant="secondary" size="full" onClick={reset}>
                  {t('assess.new.tryAgain')}
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
