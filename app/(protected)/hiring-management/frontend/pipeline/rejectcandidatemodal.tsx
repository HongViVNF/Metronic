import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/app/frontend/components/ui/button';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: () => void;
  rejectReason: string;
  setRejectReason: (val: string) => void;
  isPending: boolean;
}

const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  onReject,
  rejectReason,
  setRejectReason,
  isPending,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Từ chối ứng viên</h3>
          <Button
            onClick={() => {
              onClose();
              setRejectReason('');
            }}
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
            Lý do từ chối *
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md 
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       text-sm"
            rows={4}
            placeholder="Nhập lý do từ chối..."
          />
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => {
              if (!rejectReason.trim()) {
                alert('Vui lòng nhập lý do từ chối');
                return;
              }
              onReject();
            }}
            variant="destructive"
            className="flex-1 flex items-center justify-center gap-2"
            disabled={isPending}
          >
            Xác nhận
          </Button>
          <Button
            onClick={() => {
              onClose();
              setRejectReason('');
            }}
            variant="outline"
          >
            Hủy
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;
