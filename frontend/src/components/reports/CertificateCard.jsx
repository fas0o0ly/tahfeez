const TYPE_LABELS = {
  full_quran:  'Full Quran',
  half_quran:  'Half Quran',
  juz:         'Juz Certificate',
  custom:      'Certificate',
};

const GRADE_COLORS = {
  excellent: 'text-emerald-600',
  very_good: 'text-forest-600',
  good:      'text-blue-600',
  acceptable:'text-amber-600',
  weak:      'text-red-500',
};

const CertificateCard = ({ cert }) => (
  <div className="bg-gradient-to-br from-cream-50 to-white border border-gold-200
                  rounded-2xl p-5 flex flex-col gap-3 shadow-sm print:break-inside-avoid">
    {/* Header */}
    <div className="flex items-start justify-between gap-2">
      <div>
        <span className="text-xs font-semibold text-gold-600 uppercase tracking-wide">
          {TYPE_LABELS[cert.certificate_type] || 'Certificate'}
        </span>
        <p className="font-display font-semibold text-forest-900 mt-0.5 leading-tight">
          {cert.title}
        </p>
      </div>
      <span className="text-2xl flex-shrink-0">🎓</span>
    </div>

    {/* Meta */}
    <div className="space-y-1 text-xs text-gray-500">
      {cert.juz_from && cert.juz_to && (
        <p>Juz {cert.juz_from}–{cert.juz_to}</p>
      )}
      {cert.accuracy_grade && (
        <p className={`capitalize font-medium ${GRADE_COLORS[cert.accuracy_grade] || ''}`}>
          {cert.accuracy_grade.replace('_', ' ')}
        </p>
      )}
      {cert.description && (
        <p className="text-gray-400">{cert.description}</p>
      )}
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between pt-2 border-t border-gold-100">
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-forest-100 flex items-center justify-center text-[10px]">
          {cert.issued_by_name?.charAt(0)}
        </div>
        <span className="text-xs text-gray-400">{cert.issued_by_name}</span>
      </div>
      <span className="text-xs text-gray-400">
        {new Date(cert.issued_at).toLocaleDateString('en-MY', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
      </span>
    </div>

    {/* Download link */}
    {cert.certificate_url && (
      <a
        href={cert.certificate_url}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-forest-600 hover:text-forest-800 font-medium flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
               a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download Certificate
      </a>
    )}
  </div>
);

export default CertificateCard;
