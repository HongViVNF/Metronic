'use client';

import { useState, type MouseEvent } from 'react';
import { Stage } from '../types/stage.types';
import { CandidatePipeline } from '../types/pipeline.types';
import { Activity } from '../types/activity.types';
import { Edit, Plus, Trash2, X } from 'lucide-react';
import ActivityDrawer from '../pipeline/activitydrawer';
import { Button } from '@/app/frontend/components/ui/button';

interface StageColumnProps {
  stage: Stage;
  onSelectCandidate: (candidate: CandidatePipeline) => void;
  onViewStage: (stage: Stage) => void;
  onDeleteStage: (stageId: string) => void;
  onEditStage?: (stage: Stage) => void;
  selectedStageId?: string | null;
  deletingStageId?: string | null;
  isDeleting?: boolean;
  stages: Stage[];
  onCreateActivity: (data: Activity) => Promise<any>;
  fetchAllCandidates: () => Promise<any>;
}

export const StageColumn = ({
  stage,
  onSelectCandidate,
  onViewStage,
  onDeleteStage,
  onEditStage,
  deletingStageId,
  isDeleting,
  selectedStageId,
  stages,
  onCreateActivity,
  fetchAllCandidates,
}: StageColumnProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);

  const isSelected = stage.id === selectedStageId;
  const isDeletingStage = isDeleting && deletingStageId === stage.id;

  const getStageColor = (settings: Stage['settings']) => {
    const color = settings?.color || 'blue';
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 border-blue-300',
      green: 'bg-green-100 border-green-300',
      purple: 'bg-purple-100 border-purple-300',
      red: 'bg-red-100 border-red-300',
      yellow: 'bg-yellow-100 border-yellow-300',
      indigo: 'bg-indigo-100 border-indigo-300',
    };
    return colorMap[color] || colorMap.blue;
  };

  const getContainerBorderColor = (settings: Stage['settings']) => {
    const color = settings?.color || 'blue';
    const borderColorMap: Record<string, string> = {
      blue: 'border-blue-300',
      green: 'border-green-300',
      purple: 'border-purple-300',
      red: 'border-red-300',
      yellow: 'border-yellow-300',
      indigo: 'border-indigo-300',
    };
    return borderColorMap[color] || borderColorMap.blue;
  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isDeletingStage) return;
    setShowDeleteConfirm(stage.id);
  };

  return (
    <>
      <div
        onClick={() => onViewStage(stage)}
        className={`flex flex-col w-full max-w-[320px] h-[300px] rounded-2xl shadow-lg overflow-hidden border-2 cursor-pointer transition-transform hover:scale-105 ${
          isSelected ? 'ring-2 ring-offset-2 ring-blue-400' : ''
        } ${getContainerBorderColor(stage.settings)}`}
      >
        {/* Header */}
        <div
          className={`${getStageColor(stage.settings)} p-4 lg:p-5 flex flex-col gap-3 rounded-t-2xl h-full`}
        >
          {/* Top row: title + actions */}
          <div className="flex items-start justify-between">
            <h2
              className="font-bold text-lg text-black truncate"
              title={stage.name}
            >
              {stage.name}
            </h2>
            <div className="flex items-center gap-1 flex-shrink-0">
              {onEditStage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditStage(stage);
                  }}
                  className="p-1.5 lg:p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-all duration-200"
                  title="Chỉnh sửa stage"
                >
                  <Edit className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
              )}
              <button
                onClick={handleDeleteClick}
                className="p-1.5 lg:p-2 text-gray-400 hover:text-red-600 hover:bg-white/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Xóa stage"
                disabled={isDeletingStage}
              >
                {isDeletingStage ? (
                  <span className="text-xs font-medium">Đang xóa...</span>
                ) : (
                  <Trash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Candidates */}
          <div className="flex items-center gap-2">
            <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
              <span className="text-sm font-semibold text-black">
                {stage.candidates?.length || 0} ứng viên
              </span>
            </div>
          </div>

          {/* Description */}
          <p
            className="text-sm text-black line-clamp-4"
            title={stage.description}
          >
            {stage.description || 'Không có mô tả'}
          </p>

          {/* Action buttons */}
          {/* <div className="mt-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActivityDrawer(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-blue-700 text-sm rounded-xl hover:bg-white hover:shadow-md font-medium transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tạo hoạt động</span>
              <span className="sm:hidden">Tạo</span>
            </button>
          </div> */}
        </div>
      </div>

      {/* Modal xác nhận xóa */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Xác nhận xóa Stage</h3>
              <Button
                onClick={() => setShowDeleteConfirm(null)}
                variant="outline"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa stage <b>{stage.name}</b> không? Hành động này
              không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onDeleteStage(stage.id);
                  setShowDeleteConfirm(null);
                }}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
                disabled={isDeletingStage}
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Drawer with Backdrop */}
      {showActivityDrawer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          <ActivityDrawer
            stageId={{ stageId: stage.id }}
            stages={stages}
            onClose={() => setShowActivityDrawer(false)}
            onCreateActivity={onCreateActivity}
            fetchAllCandidates={fetchAllCandidates}
          />
        </div> 
      )}
    </>
  );
};