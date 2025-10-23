"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  Users,
  FileCheck,
  Briefcase,
  Star,
  X,
  Eye,
  Edit3,
  Trash2,
  Search,
  Mail,
  Clock,
  Plus,
  StickyNote,
  AlertCircle,
  Lock
} from "lucide-react";
import { fetchStagesByJobId } from "../services/stageService";
import { Stage } from "../types/stage.types";
import { Button } from "@/app/frontend/components/ui/button";
import { Badge } from "@/app/frontend/components/ui/badge";
import { Candidate } from "../types/candidate.types";
import { toast } from "sonner";
import RejectModal from "../pipeline/rejectcandidatemodal";
import { Input } from "@/app/frontend/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/frontend/components/ui/select";
import ActivityDrawer from '../pipeline/activitydrawer';
import CandidateTableDetailModal from "../candidate/candidatetabledetailmodal";
import NoteModal from "../pipeline/notemodal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/frontend/components/ui/dropdown-menu";
import { QuickActionMenu } from '../activites/quick-action-menu';
import { jobService } from '../services/jobService';

interface PipelineKanbanViewProps {
  onViewStage: (stage: Stage) => void;
  onViewCandidate?: (candidate: Candidate) => void;
  onEditCandidate?: (candidate: Candidate) => void;
  onDeleteCandidate?: (candidate: Candidate) => void;
  jobId: string;
}

// Candidate Card Component
interface CandidateCardProps {
  candidate: Candidate;
  onView: () => void;
  onEdit: () => void;
  onReject: () => void;
  onMove: (candidate: Candidate) => void;
  onCreateActivity: (candidate: Candidate) => void;
  onActionSelect: (actionType: string, candidate: Candidate) => void;
  onAddNote: (candidate: Candidate) => void;
}

function CandidateCard({ candidate, onView, onEdit, onReject, onMove, onCreateActivity, onActionSelect, onAddNote }: CandidateCardProps): React.ReactElement {
  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-blue-100 text-blue-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'reject': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm truncate mb-1">
            {candidate.full_name || candidate.email}
          </h4>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Mail size={12} />
            <span className="truncate">{candidate.email}</span>
          </div>
        </div>
        <Badge className={`text-xs px-2 py-0.5 ${getStatusBadgeColor(candidate.pipeline_status || 'pending')}`}>
          {candidate.pipeline_status === 'pending' && 'Chờ xử lý'}
          {candidate.pipeline_status === 'interview' && 'Đang xử lý'}
          {candidate.pipeline_status === 'interviewing' && 'Interview'}
          {candidate.pipeline_status === 'testing' && 'Test'}
          {candidate.pipeline_status === 'tested' && 'Tested'}
          {candidate.pipeline_status === 'reject' && 'Từ chối'}
          {candidate.pipeline_status === 'rejected' && 'Từ chối'}
          {candidate.pipeline_status === 'accepted_assessment' && 'Interviewed'}
          {!candidate.pipeline_status && 'Chờ xử lý'}
        </Badge>
      </div>

      <div className="space-y-2 mb-3">
        {candidate.position && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Briefcase size={12} />
            <span className="truncate">{candidate.position}</span>
          </div>
        )}

        {candidate.fit_score && (
          <div className="flex items-center gap-2">
            <Star size={12} className="text-yellow-500" />
            <span className="text-xs font-medium text-gray-900">{candidate.fit_score}% phù hợp</span>
          </div>
        )}

        {candidate.created_at && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={12} />
            <span>{new Date(candidate.created_at).toLocaleDateString('vi-VN')}</span>
          </div>
        )}
        {candidate.reject_reason && (
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertCircle size={12} className="red-500" />
            <span>{candidate.reject_reason}</span>
          </div>
        )}

        {candidate.activities && candidate.activities.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Hoạt động gần nhất</div>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-2 top-0 bottom-0 w-px bg-blue-200"></div>

              <div className="space-y-1">
                {candidate.activities.slice(0, 3).map((activity, index) => (
                  <div
                    key={index}
                    className="relative flex items-start gap-3 text-xs"
                  >
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>

                    {/* Activity content */}
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="font-medium text-gray-900 truncate">{activity.name}</div>
                      {(activity.start_date || activity.end_date) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {activity.start_date && activity.end_date ? (() => {
                            const startDate = new Date(activity.start_date);
                            const endDate = new Date(activity.end_date);
                            const isSameDay = startDate.toDateString() === endDate.toDateString();

                            return (
                              <>
                                {startDate.toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                                {!isSameDay && ` - ${endDate.toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}`}
                                {isSameDay && ` - ${endDate.toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}`}
                              </>
                            );
                          })() : activity.start_date ? (
                            new Date(activity.start_date).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          ) : activity.end_date ? (
                            `Kết thúc: ${new Date(activity.end_date).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}`
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="h-7 w-7 p-0 hover:bg-blue-50 text-blue-600"
          title="Xem chi tiết"
        >
          <Eye size={14} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAddNote(candidate);
          }}
          className="h-7 w-7 p-0 hover:bg-green-50 text-green-600"
          title="Thêm ghi chú"
        >
          <StickyNote size={14} />
        </Button>

        <QuickActionMenu
          candidate={candidate}
          onActionSelect={onActionSelect}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-gray-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-4 h-4 flex items-center justify-center">⋯</div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {/* <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-blue-600"
            >
              <Edit3 size={14} className="mr-2" />
              Chỉnh sửa
            </DropdownMenuItem> */}
            <DropdownMenuItem
              onClick={(e:any) => {
                e.stopPropagation();
                onMove(candidate);
              }}
              className="text-orange-600"
            >
              <div className="w-4 h-4 mr-2">→</div>
              Di chuyển
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e:any) => {
                e.stopPropagation();
                onReject();
              }}
              className="text-red-600"
            >
              <Trash2 size={14} className="mr-2" />
              Từ chối
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Stage Column Component
interface StageColumnProps {
  stage: Stage & { candidates: Candidate[] };
  onViewStage: () => void;
  onViewCandidate: (candidate: Candidate) => void;
  onEditCandidate: (candidate: Candidate) => void;
  onRejectCandidate: (candidate: Candidate) => void;
  onMoveCandidate: (candidate: Candidate) => void;
  onCreateActivity: (candidate: Candidate) => void;
  onActionSelect: (actionType: string, candidate: Candidate) => void;
  onAddNote: (candidate: Candidate) => void;
}

function StageColumn({
  stage,
  onViewStage,
  onViewCandidate,
  onEditCandidate,
  onRejectCandidate,
  onMoveCandidate,
  onCreateActivity,
  onActionSelect,
  onAddNote
}: StageColumnProps) {
  return (
    <div className="flex-shrink-0 w-80 bg-gray-50 rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">{stage.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {stage.candidates?.length || 0}
          </Badge>
        </div>
        {stage.description && (
          <p className="text-xs text-gray-600 line-clamp-2">{stage.description}</p>
        )}
        {/* <Button
          variant="ghost"
          size="sm"
          onClick={onViewStage}
          className="w-full mt-2 text-xs h-7 hover:bg-gray-50"
        >
          Xem chi tiết
        </Button> */}
      </div>

      <div className="p-3 max-h-[600px] overflow-y-auto">
        {stage.candidates?.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onView={() => onViewCandidate(candidate)}
            onEdit={() => onEditCandidate(candidate)}
            onReject={() => onRejectCandidate(candidate)}
            onMove={onMoveCandidate}
            onCreateActivity={onCreateActivity}
            onActionSelect={onActionSelect}
            onAddNote={onAddNote}
          />
        ))}

        {(!stage.candidates || stage.candidates.length === 0) && (
          <div className="text-center py-8 text-gray-400">
            <Users size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có ứng viên</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelineKanbanView({
  onViewStage,
  onViewCandidate,
  onEditCandidate,
  onDeleteCandidate,
  jobId
}: PipelineKanbanViewProps) {
  const [selectedCandidateForReject, setSelectedCandidateForReject] = useState<Candidate | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedCandidateForNote, setSelectedCandidateForNote] = useState<Candidate | null>(null);
  const [noteText, setNoteText] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [isCandidateDetailModalOpen, setIsCandidateDetailModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isMoveCandidateModalOpen, setIsMoveCandidateModalOpen] = useState(false);
  const [movingCandidate, setMovingCandidate] = useState<Candidate | null>(null);
  const [selectedTargetStage, setSelectedTargetStage] = useState<string>('');
  const [selectedActionType, setSelectedActionType] = useState<string>('');

  const { data: stagesData, isLoading, error } = useQuery({
    queryKey: ["jobStages", jobId],
    queryFn: () => fetchStagesByJobId(jobId),
  });

  const filteredStages = stagesData?.stages?.map((stage:any) => ({
    ...stage,
    candidates: stage.candidates?.filter((candidate:any) => {
      // Loại bỏ ứng viên bị từ chối khỏi kanban
      if (candidate.pipeline_status === 'rejected' || candidate.pipeline_status === 'reject') {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        candidate.full_name?.toLowerCase().includes(query) ||
        candidate.email?.toLowerCase().includes(query) ||
        candidate.position?.toLowerCase().includes(query)
      );
    }) || []
  })) || [];

  const closeJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const jobData = await jobService.getJobById(jobId);
      return await jobService.update({
        ...jobData,
        status: 'CLOSED'
      });
    },
    onSuccess: () => {
      toast.success('Đã đóng job thành công');
    },
    onError: (error) => {
      console.error('Error closing job:', error);
      toast.error('Không thể đóng job. Vui lòng thử lại.');
    },
  });

  const moveCandidateMutation = useMutation({
    mutationFn: async ({ candidateId, targetStageId }: { candidateId: string; targetStageId: string }) => {
      const response = await fetch(`/hiring-management/api/candidate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: candidateId, stage_id: targetStageId }),
      });
      if (!response.ok) {
        throw new Error('Failed to move candidate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobStages", jobId] });
      setIsMoveCandidateModalOpen(false);
      setMovingCandidate(null);
      setSelectedTargetStage('');
      toast.success('Đã di chuyển ứng viên thành công');
    },
    onError: (error) => {
      console.error('Error moving candidate:', error);
      toast.error('Không thể di chuyển ứng viên');
    },
  });

  const handleCreateActivityForCandidate = (candidate: Candidate) => {
    // Open activity drawer for specific candidate
    setSelectedCandidate(candidate);
    setIsActivityDrawerOpen(true);
  };

  const handleActionSelect = (actionType: string, candidate: Candidate) => {
    // Set selected candidate and action type, then open ActivityDrawer
    setSelectedCandidate(candidate);
    setSelectedActionType(actionType);
    setIsActivityDrawerOpen(true);
  };

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsCandidateDetailModalOpen(true);
  };

  const handleEditCandidate = (candidate: Candidate) => {
    if (onEditCandidate) {
      onEditCandidate(candidate);
    } else {
      console.log('Edit candidate:', candidate);
      toast.info('Tính năng chỉnh sửa đang được phát triển');
    }
  };

  const handleRejectCandidate = (candidate: Candidate) => {
    setSelectedCandidateForReject(candidate);
    setIsRejectModalOpen(true);
  };

  const handleCloseRejectModal = () => {
    setIsRejectModalOpen(false);
    setRejectReason('');
    setSelectedCandidateForReject(null);
  };

  const handleConfirmReject = () => {
    if (!selectedCandidateForReject || !rejectReason.trim()) return;
    rejectMutation.mutate({
      candidateId: selectedCandidateForReject.id,
      rejectReason: rejectReason.trim()
    });
  };

  const handleOpenMoveCandidateModal = (candidate: Candidate) => {
    setMovingCandidate(candidate);
    setSelectedTargetStage('');
    setIsMoveCandidateModalOpen(true);
  };

  const handleCloseMoveCandidateModal = () => {
    setIsMoveCandidateModalOpen(false);
    setMovingCandidate(null);
    setSelectedTargetStage('');
  };

  const handleMoveCandidate = () => {
    if (movingCandidate && selectedTargetStage) {
      moveCandidateMutation.mutate({
        candidateId: movingCandidate.id,
        targetStageId: selectedTargetStage,
      });
    }
  };

  const handleCreateActivity = async (activityData: any) => {
    try {
      const response = await fetch('/hiring-management/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      if (!response.ok) {
        throw new Error('Failed to create activity');
      }

      const result = await response.json();

      queryClient.invalidateQueries({ queryKey: ["jobStages", jobId] });
      queryClient.invalidateQueries({ queryKey: ["activities", jobId] });

      return result;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  };

  const handleCloseJob = () => {
    if (window.confirm('Bạn có chắc chắn muốn đóng job này? Sau khi đóng, job sẽ không thể nhận thêm ứng viên mới.')) {
      closeJobMutation.mutate(jobId);
    }
  };

  const handleAddNote = (candidate: Candidate) => {
    setSelectedCandidateForNote(candidate);
    setNoteText(candidate.note || '');
    setIsNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setIsNoteModalOpen(false);
    setNoteText('');
    setSelectedCandidateForNote(null);
  };

  const handleSaveNote = async () => {
    if (!selectedCandidateForNote) return;

    try {
      const response = await fetch(`/hiring-management/api/candidate/${selectedCandidateForNote.id}/note`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: noteText.trim() || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      queryClient.invalidateQueries({ queryKey: ["jobStages", jobId] });
      setIsNoteModalOpen(false);
      setNoteText('');
      setSelectedCandidateForNote(null);
      toast.success('Đã lưu ghi chú thành công');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Không thể lưu ghi chú. Vui lòng thử lại.');
    }
  };

  const rejectMutation = useMutation({
    mutationFn: async ({ candidateId, rejectReason }: { candidateId: string; rejectReason: string }) => {
      const response = await fetch(`/hiring-management/api/candidate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: candidateId, pipeline_status: 'reject', reject_reason: rejectReason }),
      });
      if (!response.ok) {
        throw new Error('Failed to reject candidate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobStages", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobStages", jobId] });

      setIsRejectModalOpen(false);
      setRejectReason('');
      setSelectedCandidateForReject(null);
      toast.success('Đã từ chối ứng viên thành công');
    },
    onError: (error) => {
      console.error('Error rejecting candidate:', error);
      toast.error('Không thể từ chối ứng viên. Vui lòng thử lại.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-red-600">
        <AlertTriangle className="w-8 h-8 mb-2" />
        <p>Đã xảy ra lỗi khi tải pipeline</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pipeline Ứng viên</h1>
              <p className="text-gray-600">Quản lý và theo dõi tiến trình tuyển dụng của các ứng viên</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* <Button
                variant="outline"
                onClick={() => setIsActivityDrawerOpen(true)}
                className="flex items-center gap-2 bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 text-orange-700 transition-all duration-200"
                size="sm"
              >
                <FileCheck className="w-4 h-4" />
                Tạo hoạt động
              </Button> */}
              <Button
                variant="outline"
                onClick={handleCloseJob}
                disabled={closeJobMutation.isPending}
                className="flex items-center gap-2 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 text-red-700 transition-all duration-200"
                size="sm"
              >
                {closeJobMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700"></div>
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Đóng job
              </Button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Tìm kiếm theo tên, email, vị trí..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-200 rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto pb-8">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 p-6">
          <div className="flex gap-6 overflow-x-auto pb-4">
            {filteredStages.map((stage:any) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                onViewStage={() => onViewStage(stage)}
                onViewCandidate={handleViewCandidate}
                onEditCandidate={handleEditCandidate}
                onRejectCandidate={handleRejectCandidate}
                onMoveCandidate={handleOpenMoveCandidateModal}
                onCreateActivity={handleCreateActivityForCandidate}
                onActionSelect={handleActionSelect}
                onAddNote={handleAddNote}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Rejected Candidates Section */}
      <div className="max-w-full mx-auto pb-8 mt-8">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="bg-red-50 border-b border-red-100 p-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">Ứng viên bị từ chối</h3>
                <p className="text-sm text-red-600 mt-1">
                  Danh sách ứng viên đã bị loại khỏi quy trình tuyển dụng
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {(() => {
              const rejectedCandidates = stagesData?.stages?.flatMap((stage:any) =>
                stage.candidates?.filter((candidate:any) =>
                  candidate.pipeline_status === 'rejected' || candidate.pipeline_status === 'reject'
                ) || []
              ) || [];

              if (rejectedCandidates.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <X className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Không có ứng viên bị từ chối</h4>
                    <p className="text-gray-500">Chưa có ứng viên nào bị từ chối trong quy trình tuyển dụng này</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      Tổng cộng: <span className="font-semibold text-red-600">{rejectedCandidates.length}</span> ứng viên
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rejectedCandidates.map((candidate:any) => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        onView={() => handleViewCandidate(candidate)}
                        onEdit={() => handleEditCandidate(candidate)}
                        onReject={() => handleRejectCandidate(candidate)}
                        onMove={(candidate) => handleOpenMoveCandidateModal(candidate)}
                        onCreateActivity={(candidate) => handleCreateActivityForCandidate(candidate)}
                        onActionSelect={(actionType, candidate) => handleActionSelect(actionType, candidate)}
                        onAddNote={(candidate) => handleAddNote(candidate)}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={handleCloseRejectModal}
        onReject={handleConfirmReject}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        isPending={rejectMutation.isPending}
      />

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={handleCloseNoteModal}
        onSave={handleSaveNote}
        note={noteText}
        setNote={setNoteText}
        candidateName={selectedCandidateForNote?.full_name}
      />

      {isMoveCandidateModalOpen && movingCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Di chuyển ứng viên</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ứng viên: {movingCandidate.full_name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseMoveCandidateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn stage đích
                  </label>
                  <Select
                    value={selectedTargetStage}
                    onValueChange={setSelectedTargetStage}
                  >
                    <SelectTrigger className="w-full p-3">
                      <SelectValue placeholder="-- Chọn stage --" />
                    </SelectTrigger>
                    <SelectContent>
                      {stagesData?.stages
                        .filter((stage:any) => stage.id !== movingCandidate.stage_id)
                        .map((stage:any) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-5">
                    Chọn stage để di chuyển ứng viên đến
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={handleCloseMoveCandidateModal}
                disabled={moveCandidateMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleMoveCandidate}
                disabled={moveCandidateMutation.isPending || !selectedTargetStage}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {moveCandidateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang di chuyển...
                  </>
                ) : (
                  'Di chuyển'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isActivityDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40">
            <ActivityDrawer
              stageId={{ stageId: stagesData?.stages?.[0]?.id || '' }}
              stages={stagesData?.stages || []}
              onClose={() => {
                setIsActivityDrawerOpen(false);
                setSelectedActionType('');
                setSelectedCandidate(null);
              }}
              onCreateActivity={handleCreateActivity}
              fetchAllCandidates={async () => ({
                data: stagesData?.stages?.flatMap((stage:any) =>
                  stage.candidates?.map((candidate:any) => ({
                    id: candidate.id,
                    full_name: candidate.full_name,
                    email: candidate.email
                  })) || []
                ) || [],
                success: true
              })}
              selectedActionType={selectedActionType}
              selectedCandidate={selectedCandidate || undefined}
            />
          </div>
        </>
      )}

      {isCandidateDetailModalOpen && selectedCandidate && (
        <CandidateTableDetailModal
          isOpen={isCandidateDetailModalOpen}
          onClose={() => {
            setIsCandidateDetailModalOpen(false);
            setSelectedCandidate(null);
          }}
          candidate={selectedCandidate}
          job={null}
        />
      )}
    </div>
  );
}
