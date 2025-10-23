"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Flag, ListChecks, Users, FileCheck, MessageSquare, Briefcase, UserCheck, Star, X, Eye, Edit3, Trash2, AlertCircle, ArrowBigRightDash, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { fetchStagesByJobId, fetchStages } from "../services/stageService";
import pipelineService from "../services/pipelineService";
import { candidateService } from "../services/candidateService";
import { Stage } from "../types/stage.types";
import { Button } from "@/app/frontend/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/frontend/components/ui/table";
import { Checkbox } from "@/app/frontend/components/ui/checkbox";
import { Badge } from "@/app/frontend/components/ui/badge";
import { Candidate } from "../types/candidate.types";
import { toast } from "sonner";
import RejectModal from "../pipeline/rejectcandidatemodal";
import { Input } from "@/app/frontend/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/frontend/components/ui/select";
import ActivityDrawer from '../pipeline/activitydrawer';
import CandidateTableDetailModal from "../candidate/candidatetabledetailmodal";
import TiptapEditor from '../components/TiptapEditor';

interface PipelineStagesProps {
  onViewStage: (stage: Stage) => void;
  onViewCandidate?: (candidate: Candidate) => void;
  onEditCandidate?: (candidate: Candidate) => void;
  onDeleteCandidate?: (candidate: Candidate) => void;
  jobId: string;
}

export default function PipelineStages({ 
  onViewStage, 
  onViewCandidate, 
  onEditCandidate, 
  onDeleteCandidate, 
  jobId 
}: PipelineStagesProps) {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedCandidateForReject, setSelectedCandidateForReject] = useState<Candidate | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  // Search and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reject reason edit modal state
  const [isRejectReasonEditModalOpen, setIsRejectReasonEditModalOpen] = useState(false);
  const [editingCandidateForRejectReason, setEditingCandidateForRejectReason] = useState<Candidate | null>(null);
  const [rejectReasonContent, setRejectReasonContent] = useState('');

  // Note edit modal state
  const [isNoteEditModalOpen, setIsNoteEditModalOpen] = useState(false);
  const [editingCandidateForNote, setEditingCandidateForNote] = useState<Candidate | null>(null);
  const [noteContent, setNoteContent] = useState('');

  // Move candidate modal state
  const [isMoveCandidateModalOpen, setIsMoveCandidateModalOpen] = useState(false);
  const [movingCandidate, setMovingCandidate] = useState<Candidate | null>(null);
  const [selectedTargetStage, setSelectedTargetStage] = useState<string>('');

  // Activity drawer state
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);

  // Candidate detail modal state
  const [isCandidateDetailModalOpen, setIsCandidateDetailModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Fit score edit modal state
  const [isFitScoreEditModalOpen, setIsFitScoreEditModalOpen] = useState(false);
  const [editingCandidateForFitScore, setEditingCandidateForFitScore] = useState<Candidate | null>(null);
  const [fitScoreContent, setFitScoreContent] = useState('');

  const { data: stagesData, isLoading, error } = useQuery({
    queryKey: ["jobStages", jobId],
    queryFn: () => fetchStagesByJobId(jobId),
  });

  // Activities data is already included in stagesData from fetchStagesByJobId

  // Create filter buttons from actual stages
  const filterButtons = stagesData?.stages ? [
    { key: 'all', label: 'Tất cả', icon: Users },
    ...stagesData.stages.map((stage:any) => ({
      key: stage.id,
      label: stage.name || `Stage ${stage.id}`,
      icon: Users // You can customize icons based on stage type if needed
    }))
  ] : [{ key: 'all', label: 'Tất cả', icon: Users }];

  // Update query function to filter by stage ID instead of categories
  const { data: jobStagesData, isLoading: isCandidatesLoading } = useQuery({
    queryKey: ["jobStagesWithCandidates", jobId],
    queryFn: async (): Promise<Candidate[]> => {
      // Fetch stages with candidates for this job
      const response = await fetch(`/hiring-management/api/job/${jobId}/stages`);
      if (!response.ok) {
        throw new Error('Failed to fetch job stages with candidates');
      }
      const result = await response.json();
      const stages = result.stages || [];

      // Collect all candidates from all stages
      const allCandidates = stages.flatMap((stage: any) => 
        (stage.candidates || []).filter((candidate: any) => 
          candidate.stage_id === stage.id // Ensure candidate belongs to this stage
        )
      );

      // Remove duplicates based on candidate id (though unlikely to have duplicates now)
      const uniqueCandidates = Array.from(new Set(allCandidates.map((c:any) => c.id))).map(id => allCandidates.find((c:any) => c.id === id));

      return uniqueCandidates;
    },
    enabled: !!jobId,
  });

  const candidates = jobStagesData || [];

  // Client-side filtering based on selected stage and search query
  const filteredCandidates = selectedFilter === 'all' 
    ? candidates
        .map((candidate:any) => {
          // Find the stage for this candidate to get the order
          const candidateStage = stagesData?.stages?.find((stage:any) => stage.id === candidate.stage_id);
          const stageOrder = (candidateStage?.settings as any)?.order || 0;
          return { ...candidate, stageOrder };
        })
        .filter(candidate => {
          // Apply search filter
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          return (
            candidate.full_name?.toLowerCase().includes(query) ||
            candidate.email?.toLowerCase().includes(query) ||
            candidate.position?.toLowerCase().includes(query)
          );
        })
        .sort((a, b) => b.stageOrder - a.stageOrder) // Sort by stage order descending (highest first)
    : candidates
        .filter((candidate: any) => candidate.stage_id === selectedFilter)
        .filter(candidate => {
          // Apply search filter
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          return (
            candidate.full_name?.toLowerCase().includes(query) ||
            candidate.email?.toLowerCase().includes(query) ||
            candidate.position?.toLowerCase().includes(query)
          );
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

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'N/A';
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredCandidates.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(paginatedCandidates.map(c => c.id));
    } else {
      setSelectedCandidates([]);
    }
  };

  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidates(prev => [...prev, candidateId]);
    } else {
      setSelectedCandidates(prev => prev.filter(id => id !== candidateId));
    }
  };

  // Fit score update mutation
  const updateFitScoreMutation = useMutation({
    mutationFn: candidateService.updateFitScore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobStagesWithCandidates", jobId] });
      setIsFitScoreEditModalOpen(false);
      setEditingCandidateForFitScore(null);
      setFitScoreContent('');
      toast.success('Đã cập nhật điểm phù hợp');
    },
    onError: (error) => {
      console.error('Error updating fit score:', error);
      toast.error('Không thể cập nhật điểm phù hợp');
    },
  });

  // Note update mutation
  const updateNoteMutation = useMutation({
    mutationFn: candidateService.updateNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobStagesWithCandidates", jobId] });
      setIsNoteEditModalOpen(false);
      setEditingCandidateForNote(null);
      setNoteContent('');
      toast.success('Đã cập nhật ghi chú');
    },
    onError: (error) => {
      console.error('Error updating note:', error);
      toast.error('Không thể cập nhật ghi chú');
    },
  });

  // Reject reason update mutation
  const updateRejectReasonMutation = useMutation({
    mutationFn: async ({ id, reject_reason }: { id: string; reject_reason: string }) => {
      const response = await fetch(`/hiring-management/api/candidate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, reject_reason }),
      });
      if (!response.ok) {
        throw new Error('Failed to update reject reason');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobStagesWithCandidates", jobId] });
      setIsRejectReasonEditModalOpen(false);
      setEditingCandidateForRejectReason(null);
      setRejectReasonContent('');
      toast.success('Đã cập nhật lý do từ chối');
    },
    onError: (error) => {
      console.error('Error updating reject reason:', error);
      toast.error('Không thể cập nhật lý do từ chối');
    },
  });

  // Move candidate mutation
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
      queryClient.invalidateQueries({ queryKey: ["jobStagesWithCandidates", jobId] });
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

  // Handlers for fit score editing modal
  const handleOpenFitScoreEditModal = (candidate: Candidate) => {
    setEditingCandidateForFitScore(candidate);
    setFitScoreContent(candidate.fit_score?.toString() || '');
    setIsFitScoreEditModalOpen(true);
  };

  const handleSaveFitScore = () => {
    if (editingCandidateForFitScore) {
      const score = parseInt(fitScoreContent);
      if (isNaN(score) || score < 0 || score > 100) {
        toast.error('Điểm phù hợp phải là số từ 0 đến 100');
        return;
      }

      updateFitScoreMutation.mutate({
        id: editingCandidateForFitScore.id,
        fit_score: score,
      });
    }
  };

  const handleCancelFitScoreEdit = () => {
    setIsFitScoreEditModalOpen(false);
    setFitScoreContent('');
  };

  // Handlers for note editing
  const handleOpenNoteEdit = (candidate: Candidate) => {
    setEditingCandidateForNote(candidate);
    // Keep HTML content as-is for TiptapEditor
    setNoteContent(candidate.note || '');
    setIsNoteEditModalOpen(true);
  };

  const handleCloseNoteEditModal = () => {
    setIsNoteEditModalOpen(false);
    setNoteContent('');
    setEditingCandidateForNote(null);
  };

  const handleSaveNote = () => {
    if (editingCandidateForNote) {
      updateNoteMutation.mutate({
        id: editingCandidateForNote.id,
        note: noteContent.trim(),
      });
    }
  };

  // Handlers for reject reason editing
  const handleOpenRejectReasonEdit = (candidate: Candidate) => {
    setEditingCandidateForRejectReason(candidate);
    setRejectReasonContent(candidate.reject_reason || '');
    setIsRejectReasonEditModalOpen(true);
  };

  const handleCloseRejectReasonEditModal = () => {
    setIsRejectReasonEditModalOpen(false);
    setRejectReasonContent('');
    setEditingCandidateForRejectReason(null);
  };

  const handleSaveRejectReason = () => {
    if (editingCandidateForRejectReason) {
      updateRejectReasonMutation.mutate({
        id: editingCandidateForRejectReason.id,
        reject_reason: rejectReasonContent.trim(),
      });
    }
  };

  // Handlers for move candidate
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

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["jobStagesWithCandidates", jobId] });
      queryClient.invalidateQueries({ queryKey: ["activities", jobId] });

      return result;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  };
  const handleOpenMoveCandidateModal = (candidate: Candidate) => {
    setMovingCandidate(candidate);
    setSelectedTargetStage('');
    setIsMoveCandidateModalOpen(true);
  };

  const checkAllActivitiesCompleted = (candidateId: string, stageId: string): boolean => {
    if (!stagesData?.stages) return false;

    // Tìm stage hiện tại
    const currentStage = stagesData.stages.find((stage:any) => stage.id === stageId);
    if (!currentStage) return false;

    // Tìm candidate trong stage này
    const candidate = currentStage.candidates?.find((c:any) => c.id === candidateId);
    if (!candidate || !candidate.activities) return false;

    // Kiểm tra xem tất cả activities của candidate này đã hoàn thành chưa
    return candidate.activities.every((activity: any) => activity.status === true);
  };

  const handleCloseMoveCandidateModal = () => {
    setIsMoveCandidateModalOpen(false);
    setMovingCandidate(null);
    setSelectedTargetStage('');
  };

  const handleMoveCandidate = () => {
    if (movingCandidate && selectedTargetStage) {
      // Kiểm tra xem tất cả activities trong stage hiện tại đã hoàn thành chưa
      const currentStageId = movingCandidate.stage_id;
      if (!currentStageId) {
        toast.error('Không thể xác định stage hiện tại của ứng viên');
        return;
      }

      const allActivitiesCompleted = checkAllActivitiesCompleted(movingCandidate.id, currentStageId);

      if (!allActivitiesCompleted) {
        toast.error('Không thể di chuyển ứng viên. Tất cả hoạt động trong stage hiện tại phải hoàn thành trước!');
        return;
      }

      moveCandidateMutation.mutate({
        candidateId: movingCandidate.id,
        targetStageId: selectedTargetStage,
      });
    }
  };

  // Search and pagination handlers
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
    setSelectedCandidates([]); // Clear selections
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    setSelectedCandidates([]);
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
    setSelectedCandidates([]);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setSelectedCandidates([]);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setSelectedCandidates([]);
    }
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
    setSelectedCandidates([]);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setSelectedCandidates([]);
  };

  // Handler for viewing candidate details
  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsCandidateDetailModalOpen(true);
  };

  // Handler for editing candidate
  const handleEditCandidate = (candidate: Candidate) => {
    if (onEditCandidate) {
      onEditCandidate(candidate);
    } else {
      console.log('Edit candidate:', candidate);
      toast.info('Tính năng chỉnh sửa đang được phát triển');
    }
  };

  // Handler for reject candidate
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

  const hasRejectReason = filteredCandidates.some(
    candidate => candidate.reject_reason && candidate.reject_reason.trim() !== ''
  );

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
      // Invalidate queries để làm mới danh sách candidates
      queryClient.invalidateQueries({ queryKey: ["jobStagesWithCandidates", jobId] });
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

  const isAllSelected = paginatedCandidates.length > 0 &&
    paginatedCandidates.every(c => selectedCandidates.includes(c.id));
  const isIndeterminate = selectedCandidates.some(id =>
    paginatedCandidates.some(c => c.id === id)
  ) && !isAllSelected;
  if (isLoading || isCandidatesLoading) {
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
        <p>Đã xảy ra lỗi khi tải danh sách stage</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto py-6">

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="max-w-7xl mx-auto py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pipeline Ứng viên</h1>
              <p className="text-gray-600">Quản lý và theo dõi tiến trình tuyển dụng của các ứng viên</p>
            </div> */}

            <div className="flex flex-wrap gap-3">
              {filterButtons.map(button => {
                const Icon = button.icon;
                return (
                  <Button
                    key={button.key}
                    variant={selectedFilter === button.key ? "default" : "outline"}
                    onClick={() => setSelectedFilter(button.key)}
                    className={`flex items-center gap-2 transition-all duration-200 ${
                      selectedFilter === button.key
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md transform scale-105"
                        : "hover:bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    }`}
                    size="sm"
                  >
                    <Icon className="w-4 h-4" />
                    {button.label}
                    {button.key !== 'all' && (
                      <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                        {candidates.filter(c => c.stage_id === button.key).length}
                      </span>
                    )}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                onClick={() => setIsActivityDrawerOpen(true)}
                className="flex items-center gap-2 bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 text-orange-700 transition-all duration-200"
                size="sm"
              >
                <FileCheck className="w-4 h-4" />
                Tạo hoạt động
              </Button>
            </div>
          </div>
        </div>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Tìm kiếm theo tên, email, vị trí..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-200 rounded-lg shadow-sm"
              />
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 min-w-[120px]">
                <span className="text-sm text-gray-600 whitespace-nowrap">Hiển thị:</span>
                <Select 
                  value={pageSize.toString()} 
                  onValueChange={(value:any) => handlePageSizeChange(Number(value))}
                >
                  <SelectTrigger className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-blue-200 bg-white text-sm">
                    <SelectValue placeholder={pageSize.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </div>

          {/* Active Filters Display */}
          {(selectedFilter !== 'all' || searchQuery) && (
            <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-700">Bộ lọc đang áp dụng:</span>

              {searchQuery && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-sm font-medium">
                  <Search className="w-3 h-3 mr-1" />
                  Tìm kiếm: {searchQuery}
                  <button
                    onClick={() => handleSearchChange('')}
                    className="ml-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {selectedFilter !== 'all' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1 text-sm font-medium">
                  <ListChecks className="w-3 h-3 mr-1" />
                  Stage: {filterButtons.find(btn => btn.key === selectedFilter)?.label}
                  <button
                    onClick={() => setSelectedFilter('all')}
                    className="ml-2 text-green-500 hover:text-green-700 hover:bg-green-100 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleSearchChange('');
                  setSelectedFilter('all');
                }}
                className="text-gray-500 hover:text-gray-700 text-sm h-8 px-3 hover:bg-gray-100 rounded-lg"
              >
                Xóa tất cả
              </Button>
            </div>
          )}
        </div>

      {/* Main Table */}
      <div className="max-w-7xl mx-auto pb-8">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Danh sách Ứng viên</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredCandidates.length} ứng viên
                    {selectedFilter !== 'all' && (
                      <span> • {filterButtons.find(btn => btn.key === selectedFilter)?.label}</span>
                    )}
                    {filteredCandidates.length > 0 && (
                      <span className="text-blue-600 font-medium"> • Trang {currentPage} / {totalPages || 1}</span>
                    )}
                  </p>
                </div>
              </div>

              {selectedCandidates.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-blue-700">
                    Đã chọn {selectedCandidates.length} ứng viên
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCandidates([])}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    Bỏ chọn
                  </Button>
                </div>
              )}
            </div>
          </div>

        <div className="relative overflow-x-auto">
          <Table className="min-w-[1810px] w-full">
            <TableHeader>
              <TableRow className="bg-blue-50 hover:bg-blue-50">
                <TableHead className="sticky left-0 bg-blue-50 font-semibold text-gray-700 w-12 px-4">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className="border-gray-300"
                    data-state={isIndeterminate ? 'indeterminate' : undefined}
                  />
                </TableHead>
                <TableHead className="sticky left-12 bg-blue-50 font-semibold text-gray-700 w-40 px-4">Ứng viên</TableHead>
                <TableHead className="font-semibold text-gray-700 w-72 px-4">Email</TableHead>
                <TableHead className="font-semibold text-gray-700 w-40 px-4">Điểm phù hợp</TableHead>
                <TableHead className="font-semibold text-gray-700 w-40 px-4">Ghi chú</TableHead>
                {hasRejectReason && (
                  <TableHead className="font-semibold text-gray-700 w-80 px-4">Lý do từ chối</TableHead>
                )}
                <TableHead className="font-semibold text-gray-700 w-48 px-4">Trạng thái</TableHead>
                <TableHead className="font-semibold text-gray-700 w-64 px-4">Hoạt động gần nhất</TableHead>
                <TableHead className="bg-blue-50 sticky right-0 font-semibold text-gray-700 text-center w-32">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center gap-4">
                      <ListChecks className="w-16 h-16 opacity-50 text-gray-400" />
                      <div className="text-center">
                        <p className="text-lg font-medium mb-2">Không có ứng viên nào</p>
                        <p className="text-sm">
                          {filteredCandidates.length === 0
                            ? (selectedFilter === 'all' 
                                ? 'Chưa có ứng viên nào trong job này'
                                : `Không có ứng viên nào trong ${filterButtons.find(btn => btn.key === selectedFilter)?.label}`)
                            : `Không có ứng viên nào trong trang này. Tổng cộng ${filteredCandidates.length} ứng viên.`
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCandidates.map((candidate) => (
                  <TableRow
                    key={candidate.id}
                    className="hover:bg-blue-50/50 transition-colors duration-200"
                  >
                    <TableCell className="sticky left-0 bg-white px-4 p-3" style={{ boxShadow: '2px 0 4px -2px rgba(0,0,0,0.1)' }}>
                      <Checkbox
                        checked={selectedCandidates.includes(candidate.id)}
                        onCheckedChange={(checked:any) => handleSelectCandidate(candidate.id, checked as boolean)}
                        className="border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="sticky left-12 bg-white p-3 font-medium text-gray-900 whitespace-nowrap w-40" style={{ boxShadow: '2px 0 4px -2px rgba(0,0,0,0.1)' }}>
                      <div className="flex items-center gap-3">
                        {/* <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {getInitials(candidate.full_name)}
                          </AvatarFallback>
                        </Avatar> */}
                        <span>{candidate.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="text-sm text-gray-900 truncate max-w-[280px]" title={candidate.email || undefined}>
                        {candidate.email || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="p-3">
                    {candidate.fit_score !== null && candidate.fit_score !== undefined ? (
                        <div
                          className="cursor-pointer rounded p-1 transition-colors flex items-center gap-2"
                          onClick={() => handleOpenFitScoreEditModal(candidate)}
                        >
                          <Star size={14} className="text-yellow-500" />
                          <span className="font-semibold text-gray-900">{candidate.fit_score}%</span>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-yellow-50 rounded p-1 transition-colors text-gray-400 text-sm italic"
                          onClick={() => handleOpenFitScoreEditModal(candidate)}
                        >
                          Nhấn để thêm điểm...
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="p-3">
                      <div
                        className="cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors min-h-[32px] flex items-start"
                        onClick={() => handleOpenNoteEdit(candidate)}
                        title="Nhấn để chỉnh sửa ghi chú"
                      >
                        {candidate.note ? (
                          <div 
                            className="text-sm text-gray-900 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: candidate.note.replace(/\n/g, '<br/>') }}
                          />
                        ) : (
                          <span className="text-sm text-gray-400 italic">Nhấn để thêm ghi chú...</span>
                        )}
                      </div>
                    </TableCell>
                    {hasRejectReason && (
                      <TableCell className="p-3">
                        {candidate.pipeline_status === 'reject' && candidate.reject_reason ? (
                          <div
                            className="cursor-pointer hover:bg-red-50 rounded px-2 py-1 transition-colors"
                            onClick={() => handleOpenRejectReasonEdit(candidate)}
                            title="Nhấn để chỉnh sửa lý do từ chối"
                          >
                            <div className="flex items-start gap-2 text-red-600">
                              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{candidate.reject_reason}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="p-3">
                      <Badge 
                        className={`${getStatusBadgeColor(candidate.pipeline_status || 'pending')} justify-center`}
                      >
                        {candidate.pipeline_status === 'pending' && 'Chờ xử lý'}
                        {candidate.pipeline_status === 'interviewing' && 'Interview'}
                        {candidate.pipeline_status === 'testing' && 'Test'}
                        {candidate.pipeline_status === 'tested' && 'Tested'}
                        {candidate.pipeline_status === 'reject' && 'Từ chối'}
                        {candidate.pipeline_status === 'accepted_assessment' && 'Interviewed'}
                        {!candidate.pipeline_status && 'Chờ xử lý'}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 w-[160px]">
                      {candidate.activities && candidate.activities.length > 0 ? (
                        <ul className="space-y-1.5">
                          {candidate.activities.slice(0, 3).map((activity:any, index:any) => (
                            <li
                              key={index}
                              className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1.5 hover:bg-blue-100 transition-colors"
                            >
                              {activity.name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="sticky right-0 bg-white p-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCandidate(candidate)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCandidate(candidate)}
                          className="h-8 w-8 p-0 hover:bg-green-50 text-green-600"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button> */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectCandidate(candidate);
                          }}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 h-8 w-8"
                          title="Từ chối ứng viên"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenMoveCandidateModal(candidate)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"
                          title="Cập nhật trạng thái phỏng vấn"
                        >
                          <ArrowBigRightDash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-t px-8 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Hiển thị</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold">
                    {startIndex + 1} - {Math.min(endIndex, filteredCandidates.length)}
                  </span>
                  <span className="font-medium">của</span>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-semibold">
                    {filteredCandidates.length}
                  </span>
                  <span className="font-medium">ứng viên</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="p-2 h-9 w-9 hover:bg-blue-50 border-gray-300"
                    title="Trang đầu"
                  >
                    <ChevronsLeft size={16} />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="p-2 h-9 w-9 hover:bg-blue-50 border-gray-300"
                    title="Trang trước"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                </div>

                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className={`min-w-[40px] h-9 ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md'
                            : 'hover:bg-blue-50 border-gray-300'
                          } transition-all duration-200`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 h-9 w-9 hover:bg-blue-50 border-gray-300"
                    title="Trang sau"
                  >
                    <ChevronRight size={16} />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="p-2 h-9 w-9 hover:bg-blue-50 border-gray-300"
                    title="Trang cuối"
                  >
                    <ChevronsRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
      {/* Fit Score Edit Modal */}
      {isFitScoreEditModalOpen && editingCandidateForFitScore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa điểm phù hợp</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ứng viên: {editingCandidateForFitScore.full_name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelFitScoreEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điểm phù hợp (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={fitScoreContent}
                    onChange={(e) => setFitScoreContent(e.target.value)}
                    placeholder="Nhập điểm từ 0-100"
                    className="w-full"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Điểm số từ 0 đến 100, thể hiện mức độ phù hợp của ứng viên
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={handleCancelFitScoreEdit}
                disabled={updateFitScoreMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleSaveFitScore}
                disabled={updateFitScoreMutation.isPending}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {updateFitScoreMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang lưu...
                  </>
                ) : (
                  'Lưu điểm'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={handleCloseRejectModal}
        onReject={handleConfirmReject}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        isPending={rejectMutation.isPending}
      />

      {/* Note Edit Modal */}
      {isNoteEditModalOpen && editingCandidateForNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa ghi chú</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ứng viên: {editingCandidateForNote.full_name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseNoteEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <TiptapEditor
                    content={noteContent}
                    onChange={setNoteContent}
                    placeholder="Nhập ghi chú cho ứng viên..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Thêm ghi chú để theo dõi thông tin quan trọng về ứng viên
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={handleCloseNoteEditModal}
                disabled={updateNoteMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleSaveNote}
                disabled={updateNoteMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateNoteMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang lưu...
                  </>
                ) : (
                  'Lưu ghi chú'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Edit Modal */}
      {isRejectReasonEditModalOpen && editingCandidateForRejectReason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa lý do từ chối</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ứng viên: {editingCandidateForRejectReason.full_name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseRejectReasonEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do từ chối
                  </label>
                  <textarea
                    value={rejectReasonContent}
                    onChange={(e) => setRejectReasonContent(e.target.value)}
                    placeholder="Nhập lý do từ chối ứng viên..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Giải thích lý do từ chối để tham khảo sau này
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={handleCloseRejectReasonEditModal}
                disabled={updateRejectReasonMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleSaveRejectReason}
                disabled={updateRejectReasonMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {updateRejectReasonMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang lưu...
                  </>
                ) : (
                  'Lưu lý do'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Move Candidate Modal */}
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

      {/* Activity Drawer */}
      {isActivityDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40">
            <ActivityDrawer
              stageId={{ stageId: stagesData?.stages?.[0]?.id || '' }}
              stages={stagesData?.stages || []}
              onClose={() => setIsActivityDrawerOpen(false)}
              onCreateActivity={handleCreateActivity}
              fetchAllCandidates={async () => ({ data: candidates, success: true })}
            />
          </div>
        </>
      )}

      {/* Candidate Detail Modal */}
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
    </div>
  );
}
