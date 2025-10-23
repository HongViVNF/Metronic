"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePipelines } from "../hooks/usePipelines";
import { usePagination, getIndeterminateState } from "./utils";
import { HiringPipeline, PipelineFormData } from "./types";

// Components
import { PipelineTable } from "./PipelineTable";
import { Pagination } from "../components/Pagination";
import { PipelineForm } from "./PipelineForm";
import { BulkDeleteDialog } from "./BulkDeleteDialog";
import { SearchAndFilters } from "./SearchAndFilters";
import RecruitmentKanban from "./page";

export default function HiringPipelineTable() {
  const router = useRouter();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showKanban, setShowKanban] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<HiringPipeline | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Use the custom hook for data fetching and mutations
  const {
    pipelines,
    filteredPipelines,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedPipelineIds,
    setSelectedPipelineIds,
    createPipeline,
    updatePipeline,
    deletePipeline,
    bulkDeletePipelines,
    handleSelectPipeline,
    handleSelectAll,
  } = usePipelines();

  // Handle pagination
  const {
    currentItems: currentPagePipelines,
    totalPages,
    startIndex,
    endIndex,
  } = usePagination(filteredPipelines, pageSize, currentPage);

  // Calculate selection states
  const { isAllSelected, isIndeterminate } = getIndeterminateState(
    currentPagePipelines,
    selectedPipelineIds
  );

  // Handle form submission
  const handleSubmit = useCallback((formData: PipelineFormData) => {
    if (editingPipeline) {
      updatePipeline.mutate({ ...editingPipeline, ...formData });
    } else {
      createPipeline.mutate(formData);
    }
    setIsFormOpen(false);
    setEditingPipeline(null);
  }, [editingPipeline, updatePipeline, createPipeline]);

  // Handle pipeline edit
  const handleEdit = useCallback((pipeline: HiringPipeline) => {
    setEditingPipeline(pipeline);
    setIsFormOpen(true);
  }, []);

  // Handle pipeline deletion
  const handleDelete = useCallback((id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa pipeline này?")) {
      deletePipeline.mutate(id);
    }
  }, [deletePipeline]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    if (selectedPipelineIds.length === 0) return;
    setShowBulkDeleteConfirm(true);
  }, [selectedPipelineIds]);

  // Confirm bulk delete
  const confirmBulkDelete = useCallback(() => {
    bulkDeletePipelines.mutate(selectedPipelineIds);
    setShowBulkDeleteConfirm(false);
  }, [bulkDeletePipelines, selectedPipelineIds]);

  // Handle view pipeline
  const handleViewPipeline = useCallback((pipelineId: string) => {
    setShowKanban(pipelineId);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setCurrentPage(1);
  }, [setSearchQuery]);

  // Handle add new pipeline
  const handleAddNew = useCallback(() => {
    setEditingPipeline(null);
    setIsFormOpen(true);
  }, []);

  // Handle select all pipelines on current page
  const handleSelectAllPipelines = useCallback((checked: boolean) => {
    handleSelectAll(checked, currentPagePipelines);
  }, [currentPagePipelines, handleSelectAll]);

  // Show kanban view if pipeline is selected
  if (showKanban) {
    return (
      <div className="min-h-screen p-6">
        <RecruitmentKanban 
          hiringPipelineId={showKanban} 
       
          onGoBack={() => setShowKanban(null)} 
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-gray-600 mb-6">Không thể tải dữ liệu pipeline. Vui lòng thử lại sau.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="w-full mx-auto">
        {/* Search and Filters */}
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearFilters={handleClearFilters}
          resultsCount={filteredPipelines.length}
          selectedCount={selectedPipelineIds.length}
          onBulkDelete={handleBulkDelete}
          isDeleting={bulkDeletePipelines.isPending}
          onAddNew={handleAddNew}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
        />

        {/* Pipeline Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <PipelineTable
            pipelines={currentPagePipelines}
            selectedPipelineIds={selectedPipelineIds}
            onSelectPipeline={handleSelectPipeline}
            onSelectAll={handleSelectAllPipelines}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleViewPipeline}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPipelines.length}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              startIndex={startIndex}
              endIndex={endIndex}
            />
          )}
        </div>

        {/* Pipeline Form */}
        <PipelineForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleSubmit}
          initialData={
            editingPipeline
              ? {
                  ...editingPipeline,
                  descriptions: editingPipeline.descriptions ?? '', // ép null/undefined thành string rỗng
                }
              : undefined
          }
          isSubmitting={createPipeline.isPending || updatePipeline.isPending}
          title={editingPipeline ? 'Chỉnh sửa Pipeline' : 'Thêm Pipeline Mới'}
          description={
            editingPipeline
              ? 'Cập nhật thông tin pipeline tuyển dụng.'
              : 'Nhập thông tin để tạo pipeline tuyển dụng mới.'
          }
        />

        {/* Bulk Delete Confirmation */}
        <BulkDeleteDialog
          isOpen={showBulkDeleteConfirm}
          onOpenChange={setShowBulkDeleteConfirm}
          onConfirm={confirmBulkDelete}
          selectedPipelineIds={selectedPipelineIds}
          pipelines={pipelines}
          isDeleting={bulkDeletePipelines.isPending}
        />
      </div>
    </div>
  );
}
