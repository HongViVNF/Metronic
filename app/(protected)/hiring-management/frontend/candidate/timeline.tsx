import React from 'react';
import { Clock, User, FileText, Calendar, Activity, Star } from 'lucide-react';
import { Badge } from '@/app/frontend/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  end_timestamp?: string;
  details?: any;
  status: string;
}

interface TimelineProps {
  candidateId: string;
  candidate: any;
}

const Timeline: React.FC<TimelineProps> = ({ candidateId, candidate }) => {
  // Fetch timeline for the candidate
  const { data: timelineData = [], isLoading: timelineLoading } = useQuery({
    queryKey: ['candidate-timeline', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      const response = await fetch(`/hiring-management/api/timeline?candidate_id=${candidateId}`);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      const result = await response.json();
      return result.timeline || [];
    },
    enabled: !!candidateId,
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'rounded-[4px] bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'interview': return 'rounded-[4px] bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'hired': return 'rounded-[4px] bg-green-100 text-green-800 hover:bg-green-200';
      case 'rejected': return 'rounded-[4px] bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'rounded-[4px] bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'application': return <User size={20} className="text-gray-700" />;
      case 'cv_upload': return <FileText size={20} className="text-gray-700" />;
      case 'interview': return <Calendar size={20} className="text-gray-700" />;
      case 'activity': return <Activity size={20} className="text-gray-700" />;
      case 'status': return <Star size={20} className="text-gray-700" />;
      default: return <Clock size={20} className="text-gray-700" />;
    }
  };

  if (timelineLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <div className="space-y-6">
          {/* Timeline Events */}
          {timelineData.length > 0 && timelineData.map((event: TimelineEvent, index: number) => (
            <div key={event.id || index} className="relative flex items-start gap-4">
              <div className="relative z-10 flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {getIcon(event.type)}
              </div>
              <div className="flex-1">
                <div className="flex flex-col">
                  {/* Thời gian hiển thị trên */}
                  <div className="text-sm font-medium text-gray-700">
                    {event.timestamp
                      ? `${new Date(event.timestamp).toLocaleDateString('vi-VN')} - ${new Date(event.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}`
                      : 'N/A'}
                  </div>
                  <h5 className="font-semibold text-gray-900 mt-1">
                    {event.title}
                    {event.type === 'interview' }
                  </h5>
                  {event.details?.fit_score && (
                    <p className="text-gray-700 text-sm mt-1">
                      <strong>Điểm phù hợp:</strong> {event.details.fit_score}%
                    </p>
                  )}
                  {event.details?.test_score && (
                    <div className="text-sm mt-1 space-y-1">
                      {event.details.test_start_time && (
                        <p className="text-gray-700">
                          <strong>Ngày thi:</strong> {new Date(event.details.test_start_time).toLocaleDateString('vi-VN')} lúc {new Date(event.details.test_start_time).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </p>
                      )}
                      {event.details.test_end_time && (
                        <p className="text-gray-700">
                          <strong>Ngày nộp:</strong> {new Date(event.details.test_end_time).toLocaleDateString('vi-VN')} lúc {new Date(event.details.test_end_time).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </p>
                      )}
                      <p className="text-gray-700">
                        <strong>Điểm số:</strong> {event.details.test_score}/10
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {/* Empty state when no timeline events */}
          {timelineData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Activity size={48} className="mx-auto mb-4 opacity-50" />
              <p>Chưa có hoạt động nào được ghi nhận</p>
              <p className="text-sm mt-2">Các hoạt động phỏng vấn và đánh giá sẽ hiển thị tại đây</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
