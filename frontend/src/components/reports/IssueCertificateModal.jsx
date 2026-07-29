import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { certificateApi } from '../../api/certificateApi';
import toast from 'react-hot-toast';

const CERT_TYPES = [
  { value: 'full_quran', label: 'Full Quran Completion' },
  { value: 'half_quran', label: 'Half Quran (15 Juz)' },
  { value: 'juz',        label: 'Juz Range' },
  { value: 'custom',     label: 'Custom Certificate' },
];

const GRADES = ['excellent', 'very_good', 'good', 'acceptable', 'weak'];

const IssueCertificateModal = ({ isOpen, onClose, studentId, onIssued }) => {
  const [form, setForm] = useState({
    certificate_type: 'custom',
    title: '',
    description: '',
    juz_from: '',
    juz_to: '',
    accuracy_grade: '',
    certificate_url: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.certificate_type) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        juz_from:        form.juz_from       ? parseInt(form.juz_from)  : null,
        juz_to:          form.juz_to         ? parseInt(form.juz_to)    : null,
        accuracy_grade:  form.accuracy_grade || null,
        description:     form.description    || null,
        certificate_url: form.certificate_url || null,
      };
      const res = await certificateApi.issueCertificate(studentId, payload);
      toast.success('Certificate issued');
      onIssued(res.data.data.certificate);
      onClose();
      setForm({ certificate_type: 'custom', title: '', description: '', juz_from: '', juz_to: '', accuracy_grade: '', certificate_url: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Issue Certificate" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select value={form.certificate_type} onChange={set('certificate_type')}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-forest-200">
            {CERT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
          <input type="text" value={form.title} onChange={set('title')} maxLength={200}
                 placeholder="e.g. Juz' Amma Completion Certificate"
                 className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2
                            focus:outline-none focus:ring-2 focus:ring-forest-200" />
        </div>

        {form.certificate_type === 'juz' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Juz From</label>
              <input type="number" min={1} max={30} value={form.juz_from} onChange={set('juz_from')}
                     className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2
                                focus:outline-none focus:ring-2 focus:ring-forest-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Juz To</label>
              <input type="number" min={1} max={30} value={form.juz_to} onChange={set('juz_to')}
                     className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2
                                focus:outline-none focus:ring-2 focus:ring-forest-200" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Accuracy Grade (optional)</label>
          <select value={form.accuracy_grade} onChange={set('accuracy_grade')}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-forest-200">
            <option value="">— Select grade —</option>
            {GRADES.map((g) => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
          <textarea value={form.description} onChange={set('description')} rows={2}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-forest-200 resize-none" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Certificate URL (optional)</label>
          <input type="url" value={form.certificate_url} onChange={set('certificate_url')}
                 placeholder="https://…"
                 className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2
                            focus:outline-none focus:ring-2 focus:ring-forest-200" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={saving}
                  disabled={!form.title.trim()} onClick={handleSubmit}>
            Issue Certificate
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default IssueCertificateModal;
