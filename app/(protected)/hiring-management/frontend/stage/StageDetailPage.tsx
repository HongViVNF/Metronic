'use client';

import { Stage } from '../types/stage.types';
import { CandidatePipeline } from '../types/pipeline.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/frontend/components/ui/table';
import { Button } from '@/app/frontend/components/ui/button';
import { AlertCircle, Calendar, Edit3, Eye, MapPin, Search, Star, Trash2, Users, X } from 'lucide-react';
import { Checkbox } from '@/app/frontend/components/ui/checkbox';
import { useMemo, useState } from 'react';
import { Badge } from '@/app/frontend/components/ui/badge';
import { Pagination } from '../components/Pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/frontend/components/ui/select';
import { Input } from '@/app/frontend/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/frontend/components/ui/tooltip';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/frontend/components/ui/dialog';
import { fetchStages, moveCandidates } from '../services/stageService';
import RejectModal from '../pipeline/rejectcandidatemodal';
import CandidateDetailModal from './candidatedetailmodal';
import { Activity } from '../types/activity.types';
import ActivityDrawer from '../pipeline/activitydrawer';

interface StageDetailPageProps {
  stage: Stage;
  onSelectCandidate: (candidate: CandidatePipeline) => void;
  hiringPipelineId?: string;
  jobId?: string;
}

export const StageDetailPage = ({ stage, onSelectCandidate, hiringPipelineId, jobId }: StageDetailPageProps) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetStageId, setTargetStageId] = useState<string>('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedCandidateForReject, setSelectedCandidateForReject] = useState<CandidatePipeline | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCandidateForDetail, setSelectedCandidateForDetail] = useState<CandidatePipeline | null>(null);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);

  // Fetch available stages using React Query
  const { data: availableStages = [], isLoading: isStagesLoading, error: stagesError } = useQuery({
    queryKey: ['stages', hiringPipelineId],
    queryFn: () => fetchStages(hiringPipelineId || ''),
    enabled: !!hiringPipelineId, // Chỉ fetch nếu có hiring_pipeline_id
  });

  // Fetch stage with candidates
  const { data: stageWithCandidates, isLoading: isStageLoading } = useQuery({
    queryKey: ['stage', stage.id, jobId],
    queryFn: async () => {
      const url = jobId 
        ? `/hiring-management/api/stages/${stage.id}/candidates?jobId=${jobId}`
        : `/hiring-management/api/stages/${stage.id}/candidates`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch stage candidates');
      }
      return response.json();
    },
    enabled: !!stage.id,
  });

  const moveMutation = useMutation({
    mutationFn: ({ candidateIds, targetStageId }: { candidateIds: string[]; targetStageId: string }) =>
      moveCandidates({ candidateIds, stageId: targetStageId }),
    onSuccess: () => {
      // Invalidate query để làm mới stage hiện tại
      queryClient.invalidateQueries({ queryKey: ['stage', stage.id] });
      if (hiringPipelineId) {
        queryClient.invalidateQueries({ queryKey: ['stages', hiringPipelineId] });
      }
      if (jobId) {
        queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      }
      setSelectedIds([]);
      setTargetStageId('');
    },
    onError: (error) => {
      console.error('Error moving candidates:', error);
      // Có thể thêm toast notification ở đây
    },
  });
  
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
      // Invalidate query để làm mới stage hiện tại
      queryClient.invalidateQueries({ queryKey: ['stage', stage.id] });
      if (hiringPipelineId) {
        queryClient.invalidateQueries({ queryKey: ['stages', hiringPipelineId] });
      }
      if (jobId) {
        queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      }
      setIsRejectModalOpen(false);
      setRejectReason('');
      setSelectedCandidateForReject(null);
    },
    onError: (error) => {
      console.error('Error rejecting candidate:', error);
    },
  });

  const filteredCandidates = (stageWithCandidates?.candidates || stage?.candidates || []).filter((candidate:any) => {
    const matchesSearch = 
      candidate.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      candidate.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      candidate.position?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || candidate.pipeline_status === statusFilter;
    const matchesPosition = positionFilter === 'all' || ((candidate as any).job?.title || candidate.position) === positionFilter;
    
    let matchesScore = true;
    if (scoreFilter !== 'all') {
      const score = candidate.fit_score ?? 0;
      switch (scoreFilter) {
        case 'high': matchesScore = score >= 80; break;
        case 'medium': matchesScore = score >= 60 && score < 80; break;
        case 'low': matchesScore = score < 60; break;
        case 'no-score': matchesScore = score === 0; break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPosition && matchesScore;
  }) || [];

  // Pagination calculations
  const totalItems = filteredCandidates.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex);

  const hasRejectReason = filteredCandidates.some(
    (candidate:any) => candidate.reject_reason && candidate.reject_reason.trim() !== ''
  );

  // Selection logic
  const allFilteredIds = useMemo(() => filteredCandidates.map((c:any) => c.id), [filteredCandidates]);
  const selectedCount = selectedIds.length;
  const isSelected = (id: string) => selectedIds.includes(id);
  const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every((id:any) => isSelected(id));
  const isIndeterminate = selectedCount > 0 && selectedCount < allFilteredIds.length;

  const handleSelectCandidate = (id: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...new Set([...prev, id])] : prev.filter((s:any) => s !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? [...allFilteredIds] : []);
  };

  const handleMoveCandidates = () => {
    if (!targetStageId || selectedIds.length === 0) return;
    moveMutation.mutate({ candidateIds: selectedIds, targetStageId });
  };

  const handleConfirmMove = () => {
    handleMoveCandidates();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'rounded-[4px] bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'interview': return 'rounded-[4px] bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'hired': return 'rounded-[4px] bg-green-100 text-green-800 hover:bg-green-200';
      case 'rejected': return 'rounded-[4px] bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'rounded-[4px] bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPositionFilter('all');
    setScoreFilter('all');
    setCurrentPage(1);
  };

  const handleRejectCandidate = (candidate: CandidatePipeline) => {
    setSelectedCandidateForReject(candidate);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedCandidateForReject || !rejectReason.trim()) return;
    rejectMutation.mutate({
      candidateId: selectedCandidateForReject.id,
      rejectReason: rejectReason.trim()
    });
  };

  const handleCloseRejectModal = () => {
    setIsRejectModalOpen(false);
    setRejectReason('');
    setSelectedCandidateForReject(null);
  };

  const handleShowCandidateDetail = (candidate: CandidatePipeline) => {
    setSelectedCandidateForDetail(candidate);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedCandidateForDetail(null);
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

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['stage', stage.id] });
      if (hiringPipelineId) {
        queryClient.invalidateQueries({ queryKey: ['stages', hiringPipelineId] });
      }

      return result;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  };

  const handleFetchAllCandidates = async () => {
    // Return the same data that's already fetched for the stage
    return {
      data: stageWithCandidates?.candidates || [],
      success: true
    };
  };
  console.log("stageWithCandidates",stageWithCandidates)

  // Get unique positions for filter options
  const positionOptions: string[] = Array.from(
    new Set((stageWithCandidates?.candidates || stage?.candidates || [])
      .map((candidate:any) => candidate.position || 'Unknown')
      .filter((position:any): position is string => Boolean(position)))
  );

  // Define status options
  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'interview', label: 'Interview' },
    { value: 'testing', label: 'Test' },
    { value: 'tested', label: 'Tested' },
    { value: 'reject', label: 'Từ chối' },
    { value: 'accepted_assessment', label: 'Interviewed' },
  ];

  // Define score filter options
  const scoreOptions = [
    { value: 'all', label: 'Tất cả điểm' },
    { value: 'high', label: 'Cao (≥80)' },
    { value: 'medium', label: 'Trung bình (60-79)' },
    { value: 'low', label: 'Thấp (<60)' },
    { value: 'no-score', label: 'Không có điểm' },
  ];

  const targetStageOptions = availableStages.filter(s => s.id !== stage.id);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header: Title + Candidate Count */}
        <div className="flex items-center justify-between mb-4">
          {/* Left: Title + Candidate Count */}
          <div className="flex items-center gap-3">
            <h2
              className="text-2xl font-semibold text-blue-700 truncate"
              title={stage.name}
            >
              {stage.name}
            </h2>
            <span className="inline-flex items-center gap-1 text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
              <Users size={16} />
              {stageWithCandidates?.candidates?.length || stage.candidates?.length || 0} ứng viên
              {selectedCount > 0 && (
                <span className="ml-2 bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs">
                  {selectedCount} đã chọn
                </span>
              )}
            </span>
          </div>

          {/* Right: Create Activity Button */}
          <button
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg shadow"
            onClick={() => setIsActivityDrawerOpen(true)}
          >
            + Tạo hoạt động
          </button>
        </div>
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Select
              value={targetStageId}
              onValueChange={setTargetStageId}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Chọn stage đích" />
              </SelectTrigger>
              <SelectContent>
                {targetStageOptions.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  disabled={!targetStageId || moveMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {moveMutation.isPending ? 'Đang di chuyển...' : 'Di chuyển'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Xác nhận di chuyển</DialogTitle>
                  <DialogDescription>
                    Bạn có muốn di chuyển {selectedCount} ứng viên sang stage {targetStageOptions.find(s => s.id === targetStageId)?.name}?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={moveMutation.isPending}
                    >
                      Hủy
                    </Button>
                  </DialogTrigger>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      onClick={handleConfirmMove}
                      disabled={moveMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {moveMutation.isPending ? 'Đang di chuyển...' : 'Di chuyển'}
                    </Button>
                  </DialogTrigger>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Body: Left description / Right metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left: Description */}
          <div>
            {stage.description && (
              <p className="text-gray-700 leading-relaxed">{stage.description}</p>
            )}
          </div>

          {/* Right: Metadata */}
          <div className="flex flex-col items-start gap-2 text-sm text-gray-600">
            {stage.created_at && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-500" />
                <span>
                  <span className="font-medium">Tạo ngày:</span>{" "}
                  {new Date(stage.created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
            )}
            {stage.updated_at && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-indigo-500" />
                <span>
                  <span className="font-medium">Cập nhật:</span>{" "}
                  {new Date(stage.updated_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Tìm kiếm theo tên, email hoặc vị trí..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={positionFilter}
                onValueChange={setPositionFilter}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Vị trí" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vị trí</SelectItem>
                  {positionOptions.map(position => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={scoreFilter}
                onValueChange={setScoreFilter}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Điểm phù hợp" />
                </SelectTrigger>
                <SelectContent>
                  {scoreOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 min-w-[120px]">
              <label htmlFor="pageSizeSelect" className="text-sm text-gray-600 whitespace-nowrap">
                Hiển thị:
              </label>
              <select
                id="pageSizeSelect"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-blue-200 bg-white text-sm"
                title="Số lượng mục hiển thị trên mỗi trang"
                aria-label="Số lượng mục hiển thị trên mỗi trang"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || statusFilter !== 'all' || positionFilter !== 'all' || scoreFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Bộ lọc đang áp dụng:</span>
              {searchQuery && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Tìm kiếm: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Trạng thái: {statusOptions.find(opt => opt.value === statusFilter)?.label}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                    aria-label="Xóa bộ lọc trạng thái"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              )}
              {positionFilter !== 'all' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Vị trí: {positionFilter}
                  <button
                    onClick={() => setPositionFilter('all')}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                    aria-label="Xóa bộ lọc vị trí"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              )}
              {scoreFilter !== 'all' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Điểm: {scoreOptions.find(opt => opt.value === scoreFilter)?.label}
                  <button
                    onClick={() => setScoreFilter('all')}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                    aria-label="Xóa bộ lọc điểm"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-gray-700 text-sm h-6 px-2"
              >
                Xóa tất cả
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="relative overflow-x-auto">
          <Table className="min-w-[2400px] w-full">
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
                <TableHead className="sticky left-8 bg-blue-50 font-semibold text-gray-700 w-64 px-4">
                  Ứng viên
                </TableHead>
                <TableHead className="font-semibold text-gray-700 w-72 px-4">Email</TableHead>
                <TableHead className="font-semibold text-gray-700 w-40 px-4">Ngày sinh</TableHead>
                <TableHead className="font-semibold text-gray-700 w-32 px-4">Giới tính</TableHead>
                <TableHead className="font-semibold text-gray-700 w-72 px-4">Vị trí</TableHead>
                <TableHead className="font-semibold text-gray-700 w-64 px-4">Kinh nghiệm</TableHead>
                <TableHead className="font-semibold text-gray-700 w-80 px-4">Điểm mạnh</TableHead>
                <TableHead className="font-semibold text-gray-700 w-80 px-4">Điểm yếu</TableHead>
                <TableHead className="font-semibold text-gray-700 w-40 px-4">Điểm phù hợp</TableHead>
                <TableHead className="font-semibold text-gray-700 w-80 px-4">Ghi chú</TableHead>
                {hasRejectReason && (
                  <TableHead className="font-semibold text-gray-700 w-80 px-4">Lý do từ chối</TableHead>
                )}
                <TableHead className="font-semibold text-gray-700 w-80 px-4">Hoạt động gần nhất</TableHead>
                <TableHead className="font-semibold text-gray-700 w-40 px-4">Ngày tạo</TableHead>
                <TableHead className="font-semibold text-gray-700 w-48 px-4">Trạng thái</TableHead>
                <TableHead className="sticky right-0 bg-blue-50 font-semibold text-gray-700 text-center w-40 ">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCandidates.map((candidate:any) => (
                <TableRow
                  key={candidate.id}
                  className="hover:bg-blue-50/50 transition-colors duration-200 cursor-pointer"
                  // onClick={() => handleShowCandidateDetail(candidate)}
                >
                  <TableCell className="sticky left-0 bg-white px-4 p-3" style={{ boxShadow: '2px 0 4px -2px rgba(0,0,0,0.1)' }}>
                    <Checkbox
                      checked={isSelected(candidate.id)}
                      onCheckedChange={(checked:any) => handleSelectCandidate(candidate.id, checked as boolean)}
                      className="border-gray-300"
                    />
                  </TableCell>
                  <TableCell className="sticky left-8 bg-white p-3 font-medium text-gray-900 whitespace-nowrap" style={{ boxShadow: '2px 0 4px -2px rgba(0,0,0,0.1)' }}>
                    {candidate.full_name}
                  </TableCell>
                  <TableCell className="p-3">
                    <div className="text-sm text-gray-900 truncate max-w-[280px]" title={candidate.email}>
                      {candidate.email}
                    </div>
                  </TableCell>
                  <TableCell className="p-3">
                    <div className="text-sm text-gray-900 whitespace-nowrap">
                      {candidate.birthdate  ? new Date(candidate.birthdate).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="p-3">
                    <div className="text-sm text-gray-900">
                      {candidate.gender === 'male' ? 'Nam' : candidate.gender === 'female' ? 'Nữ' : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="p-3">
                    <div className="text-sm font-medium text-gray-900">
                      {candidate.job?.title || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="p-3">
                    {candidate.experience ? (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-yellow-500 flex-shrink-0" />
                        <span className="text-sm text-gray-900 line-clamp-2">{candidate.experience}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>

                  <TableCell className="p-3">
                    {candidate.strengths ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="text-sm text-gray-700 line-clamp-3 transition-all cursor-help"
                            dangerouslySetInnerHTML={{ __html: candidate.strengths }} 
                          />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px] p-3" side="top" align="start">
                          <div className="text-sm" dangerouslySetInnerHTML={{ __html: candidate.strengths }} />
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="p-3">
                    {candidate.weaknesses ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="text-sm text-gray-700 line-clamp-3 transition-all cursor-help"
                            dangerouslySetInnerHTML={{ __html: candidate.weaknesses }} 
                          />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px] p-3" side="top" align="start">
                          <div className="text-sm" dangerouslySetInnerHTML={{ __html: candidate.weaknesses }} />
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>

                  <TableCell className="p-3">
                    {candidate.fit_score ? (
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-yellow-500 flex-shrink-0" />
                        <span className="font-semibold text-gray-900">{candidate.fit_score}%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="p-3">
                    {candidate.note ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="text-sm text-gray-600 line-clamp-3 hover:line-clamp-none transition-all cursor-help"
                            dangerouslySetInnerHTML={{ __html: candidate.note }} 
                          />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px] p-3" side="top" align="start">
                          <div className="text-sm" dangerouslySetInnerHTML={{ __html: candidate.note }} />
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                  {hasRejectReason && (
                    <TableCell className="p-3">
                      {candidate.pipeline_status === 'reject' && candidate.reject_reason ? (
                        <div className="flex items-start gap-2 text-red-600">
                          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{candidate.reject_reason}</span>
                        </div> 
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="p-3">
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
                       
                  <TableCell className="p-3 whitespace-nowrap text-sm text-gray-600">
                    {new Date(candidate.created_at).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className="p-3">
                    <Badge 
                      className={`${getStatusBadgeColor(candidate.pipeline_status || 'pending')} w-full justify-center`}
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
                  <TableCell className="sticky right-0 bg-white z-20 p-2" style={{ boxShadow: '-2px 0 4px -2px rgba(0,0,0,0.1)' }}>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowCandidateDetail(candidate);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 h-8 w-8"
                        title="Xem chi tiết"
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          // handleEdit(candidate);
                        }}
                        className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1.5 h-8 w-8"
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={14} />
                      </Button>
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
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        startIndex={startIndex}
        endIndex={endIndex}
      />

      {/* Reject Modal */}
      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={handleCloseRejectModal}
        onReject={handleConfirmReject}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        isPending={rejectMutation.isPending}
      />

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        candidate={selectedCandidateForDetail}
      />

      {/* Activity Drawer */}
      {isActivityDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40">
            <ActivityDrawer
              stageId={{ stageId: stage.id }}
              stages={availableStages}
              onClose={() => setIsActivityDrawerOpen(false)}
              onCreateActivity={handleCreateActivity}
              fetchAllCandidates={handleFetchAllCandidates}
            />
          </div>
        </>
      )}
    </>
  );
};