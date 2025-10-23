import React from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/app/frontend/components/ui/button';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  note: string;
  setNote: (val: string) => void;
  candidateName?: string;
  isPending?: boolean;
}

const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  note,
  setNote,
  candidateName,
  isPending = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Ghi chú ứng viên</h3>
            {candidateName && (
              <p className="text-sm text-gray-600 mt-1">Ứng viên: {candidateName}</p>
            )}
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:bg-red-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Textarea */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nội dung ghi chú
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       text-sm resize-none"
            rows={6}
            placeholder="Nhập ghi chú cho ứng viên..."
          />
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onSave}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
            disabled={isPending}
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Đang lưu...' : 'Lưu ghi chú'}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
          >
            Hủy
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;
