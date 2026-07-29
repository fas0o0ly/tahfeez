import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { certificateApi } from '../../api/certificateApi';
import toast from 'react-hot-toast';

const AwardMedalModal = ({ isOpen, onClose, studentId, onAwarded }) => {
  const [types, setTypes]       = useState([]);
  const [typeId, setTypeId]     = useState('');
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    certificateApi.getAchievementTypes()
      .then((r) => setTypes(r.data.data.types || []))
      .catch(() => {});
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!typeId) return;
    setSaving(true);
    try {
      const res = await certificateApi.awardMedal(studentId, {
        achievement_type_id: typeId,
        notes: notes || null,
      });
      toast.success('Medal awarded');
      onAwarded(res.data.data.achievement);
      onClose();
      setTypeId(''); setNotes('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to award medal');
    } finally {
      setSaving(false);
    }
  };

  const selected = types.find((t) => t.id === typeId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Award Medal" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Medal Type</label>
          <select value={typeId} onChange={(e) => setTypeId(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-forest-200">
            <option value="">— Select medal —</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
            ))}
          </select>
        </div>

        {selected && (
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
            {selected.description}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                    maxLength={500}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-forest-200 resize-none" />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={saving}
                  disabled={!typeId} onClick={handleSubmit}>
            Award Medal
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AwardMedalModal;
