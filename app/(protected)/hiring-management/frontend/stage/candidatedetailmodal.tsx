import React from 'react';
import { X, Calendar, MapPin, Star, Mail, Phone, User, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/app/frontend/components/ui/button';
import { Badge } from '@/app/frontend/components/ui/badge';
import { CandidatePipeline } from '../types/pipeline.types';

interface CandidateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidatePipeline | null;
}

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  isOpen,
  onClose,
  candidate,
}) => {
  if (!isOpen || !candidate) return null;

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'rounded-[4px] bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'interview': return 'rounded-[4px] bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'hired': return 'rounded-[4px] bg-green-100 text-green-800 hover:bg-green-200';
      case 'rejected': return 'rounded-[4px] bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'rounded-[4px] bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{candidate.full_name}</h3>
              <p className="text-gray-600">{candidate.position || 'Chưa cập nhật vị trí'}</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:bg-red-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User size={20} />
                Thông tin cơ bản
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-500" />
                  <span className="text-gray-700">{candidate.email}</span>
                </div>
                {(candidate as any).phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-500" />
                    <span className="text-gray-700">{(candidate as any).phone}</span>
                  </div>
                )}
                {candidate.birthdate && (
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="text-gray-700">
                      {new Date(candidate.birthdate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
                {candidate.experience && (
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-gray-500" />
                    <span className="text-gray-700">{candidate.experience} năm kinh nghiệm</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Star size={20} />
                Đánh giá
              </h4>
              <div className="space-y-3">
                {candidate.fit_score && (
                  <div className="flex items-center gap-3">
                    <Star size={16} className="text-yellow-500" />
                    <span className="text-gray-700 font-semibold">{candidate.fit_score}% phù hợp</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Badge className={getStatusBadgeColor(candidate.pipeline_status || 'pending')}>
                    {candidate.pipeline_status === 'pending' && 'Chờ xử lý'}
                    {candidate.pipeline_status === 'interviewing' && 'Interview'}
                    {candidate.pipeline_status === 'testing' && 'Test'}
                    {candidate.pipeline_status === 'tested' && 'Tested'}
                    {candidate.pipeline_status === 'reject' && 'Từ chối'}
                    {candidate.pipeline_status === 'accepted_assessment' && 'Interviewed'}
                    {!candidate.pipeline_status && 'Chờ xử lý'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          {(candidate as any).skills && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Kỹ năng</h4>
              <div className="flex flex-wrap gap-2">
                {(candidate as any).skills.split(',').map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
                    {skill.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Strengths and Weaknesses */}
          {(candidate.strengths || candidate.weaknesses) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidate.strengths && (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-green-700">Điểm mạnh</h4>
                  <p className="text-gray-700 bg-green-50 p-3 rounded-lg">{candidate.strengths}</p>
                </div>
              )}
              {candidate.weaknesses && (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-red-700">Điểm cần cải thiện</h4>
                  <p className="text-gray-700 bg-red-50 p-3 rounded-lg">{candidate.weaknesses}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {candidate.note && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={20} />
                Ghi chú
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div dangerouslySetInnerHTML={{ __html: candidate.note }} />
              </div>
            </div>
          )}

          {/* Reject Reason */}
          {candidate.pipeline_status === 'reject' && candidate.reject_reason && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle size={20} />
                Lý do từ chối
              </h4>
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                <p className="text-red-800">{candidate.reject_reason}</p>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500">Ngày tạo</p>
              <p className="font-semibold text-gray-900">
                {new Date(candidate.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Nguồn</p>
              <p className="font-semibold text-gray-900">{candidate.source || 'N/A'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Vị trí ứng tuyển</p>
              <p className="font-semibold text-gray-900">{candidate.job?.title || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button onClick={onClose} variant="outline">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailModal;
