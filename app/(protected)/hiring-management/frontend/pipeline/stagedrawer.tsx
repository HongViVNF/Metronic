import React, { useState, useEffect } from 'react';
import { X, Save, Users, Trash2 } from 'lucide-react';
import { Button } from '@/app/frontend/components/ui/button';
import { Input } from '@/app/frontend/components/ui/input';
import { Candidate, Stage } from '../types/stage.types';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

const fetchUser = async (email: string) => {
  const encodedEmail = btoa(email);
  const response = await fetch(`/api/users/${encodedEmail}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
};

interface StageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStage: (stageData: any) => Promise<any>;
  onUpdateStage: (stageData: any) => Promise<any>;
  onDeleteStage: (stageId: string) => Promise<void>;
  onUpdateCandidateStage: (data: { candidate: any; stageId: string | null }) => Promise<void>;
  allCandidates?: Candidate[];
  isCreating?: boolean;
  stage?: Stage | null;
  selectedCandidate?: any; // Thêm prop để tự động select candidate đã chọn
}

const StageDrawer: React.FC<StageDrawerProps> = ({
  isOpen,
  onClose,
  onCreateStage,
  onUpdateStage,
  onDeleteStage,
  onUpdateCandidateStage,
  allCandidates = [],
  isCreating = false,
  stage = null,
  selectedCandidate = null
}) => {
  const [formData, setFormData] = useState({
    id: stage?.id || '',
    name: stage?.name || '',
    description: stage?.description || '',
    color: stage?.settings?.color || 'blue',
    order: stage?.settings?.order || 0,
    selectedCandidates: stage?.candidates?.map(c => c.id) || []
  });
  const [selectAll, setSelectAll] = useState(false);
  const [error, setError] = useState('');
  const { data: session } = useSession();

  // Fetch current user data
  const { data: currentUser } = useQuery({
    queryKey: ["current-user", session?.user?.email],
    queryFn: () => fetchUser(session?.user?.email!),
    enabled: !!session?.user?.email,
  });

  // Get current user identifier (ID)
  const getCurrentUser = () => {
    return currentUser?.id || 'unknown-user';
  };
  useEffect(() => {
    if (stage) {
      setFormData({
        id: stage.id,
        name: stage.name,
        description: stage.description || '',
        color: stage.settings?.color || 'blue', // Use color from settings
        order: stage?.settings?.order || 0,
        selectedCandidates: stage.candidates ? stage.candidates.map(c => c.id) : []
      });
      setSelectAll(stage.candidates?.length === allCandidates.length);
    } else {
      // Khi tạo stage mới, nếu có selectedCandidate thì tự động select nó
      const initialSelectedCandidates = selectedCandidate ? [selectedCandidate.id] : [];
      setFormData({
        id: '',
        name: '',
        description: '',
        color: 'blue',
        order: 0,
        selectedCandidates: initialSelectedCandidates
      });
      setSelectAll(false);
    }
  }, [stage, allCandidates, selectedCandidate]);

  const colors = [
    { value: 'blue', label: 'Xanh dương', class: 'bg-blue-100 border-blue-300' },
    { value: 'green', label: 'Xanh lá', class: 'bg-green-100 border-green-300' },
    { value: 'purple', label: 'Tím', class: 'bg-purple-100 border-purple-300' },
    { value: 'red', label: 'Đỏ', class: 'bg-red-100 border-red-300' },
    { value: 'yellow', label: 'Vàng', class: 'bg-yellow-100 border-yellow-300' },
    { value: 'indigo', label: 'Chàm', class: 'bg-indigo-100 border-indigo-300' },
  ];

  const handleSelectAllChange = (checked:any) => {
    setSelectAll(checked);
    if (checked) {
      // Chỉ chọn những candidates đang hiển thị trong danh sách (sau khi filter)
      const visibleCandidates = allCandidates.filter(candidate => {
        if (stage) {
          // Edit: luôn hiện ứng viên đã có trong stage này
          const isInThisStage = formData.selectedCandidates.includes(candidate.id);
          // Nếu stage chưa có ứng viên thì chỉ hiện ứng viên chưa thuộc stage nào và không bị reject
          if (stage.candidates?.length === 0) {
            return (!candidate.stage_id || isInThisStage) && candidate.pipeline_status !== 'reject';
          }
          return (isInThisStage || !candidate.stage_id) && candidate.pipeline_status !== 'reject';
        } else {
          // Create stage: hiện ứng viên chưa thuộc stage nào, hoặc ứng viên đã được chọn từ trước
          const isSelectedCandidate = selectedCandidate && candidate.id === selectedCandidate.id;
          return (!candidate.stage_id && candidate.pipeline_status !== 'reject') || isSelectedCandidate;
        }
      });

      setFormData({
        ...formData,
        selectedCandidates: visibleCandidates.map(c => c.id)
      });
    } else {
      setFormData({
        ...formData,
        selectedCandidates: []
      });
    }
  };

  const handleCandidateToggle = (candidateId:any) => {
    const newSelected = formData.selectedCandidates.includes(candidateId)
      ? formData.selectedCandidates.filter(id => id !== candidateId)
      : [...formData.selectedCandidates, candidateId];

    setFormData({
      ...formData,
      selectedCandidates: newSelected
    });

    setSelectAll(newSelected.length === allCandidates.length);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên stage');
      return;
    }

    try {
      setError('');
      if (stage) {
        // Update existing stage
        const stageData = {
          id: formData.id,
          name: formData.name,
          description: formData.description,
          settings: {
            color: formData.color,
            order: formData.order // Include order in settings
          },
          updated_by: getCurrentUser()
        };
        await onUpdateStage(stageData);

        // Update candidates to new stage assignments
        const currentCandidateIds = stage.candidates ? stage.candidates.map(c => c.id) : [];
        const candidatesToAdd = formData.selectedCandidates.filter(id => !currentCandidateIds.includes(id));
        const candidatesToRemove = currentCandidateIds.filter(id => !formData.selectedCandidates.includes(id));

        // Add candidates to the stage
        for (const candidateId of candidatesToAdd) {
          const candidate = allCandidates.find(c => c.id === candidateId);
          if (candidate) {
            await onUpdateCandidateStage({
              candidate,
              stageId: formData.id
            });
          }
        }

        // Remove candidates from the stage by setting stage_id to null
        for (const candidateId of candidatesToRemove) {
          const candidate = allCandidates.find(c => c.id === candidateId);
          if (candidate) {
            await onUpdateCandidateStage({
              candidate,
              stageId: null
            });
          }
        }
      } else {
        // Create new stage
        const stageData = {
          name: formData.name,
          description: formData.description,
          settings: {
            color: formData.color,
            order: formData.order // Include order in settings
          },
          created_by: getCurrentUser(),
          updated_by: getCurrentUser()
        };
        const newStage = await onCreateStage(stageData);

        // Assign selected candidates to the new stage
        if (newStage && formData.selectedCandidates.length > 0) {
          for (const candidateId of formData.selectedCandidates) {
            const candidate = allCandidates.find(c => c.id === candidateId);
            if (candidate) {
              await onUpdateCandidateStage({
                candidate,
                stageId: newStage.id
              });
            }
          }
        }
      }

      // Reset form and close
      setFormData({
        id: '',
        name: '',
        description: '',
        color: 'blue',
        order: 0, // Reset order
        selectedCandidates: []
      });
      setSelectAll(false);
      onClose();
    } catch (error:any) {
      console.error('Error processing stage:', error);
      setError(error.message || 'Không thể lưu stage hoặc cập nhật ứng viên');
    }
  };

  const handleDelete = async () => {
    if (!stage) return;
    if (stage.candidates && stage.candidates.length > 0) {
      setError('Không thể xóa stage vì vẫn còn ứng viên');
      return;
    }
    if (!window.confirm('Bạn có chắc muốn xóa stage này?')) return;

    try {
      setError('');
      await onDeleteStage(stage.id);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error deleting stage:', error);
      setError('Không thể xóa stage. Vui lòng thử lại sau.');
    }
  };

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      color: 'blue',
      order: 0,
      selectedCandidates: []
    });
    setSelectAll(false);
    setError('');
  };

  // Handle drawer close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle error with proper type checking
  const handleError = (error: unknown) => {
    console.error('Error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Đã xảy ra lỗi không xác định';
    setError(errorMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-[700px] mx-auto">
          <div className="h-full flex flex-col bg-white shadow-xl">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {stage ? 'Chỉnh sửa Stage' : 'Tạo Stage Mới'}
                </h2>
                <Button
                  onClick={handleClose}
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:bg-red-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên stage *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ví dụ: Technical Interview"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Mô tả về stage này..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Màu sắc
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {colors.map(color => (
                        <label key={color.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="color"
                            value={color.value}
                            checked={formData.color === color.value}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-md border-2 text-center text-xs font-medium transition-all ${formData.color === color.value
                            ? `${color.class} ring-2 ring-offset-2 ring-blue-500`
                            : `${color.class} hover:ring-1 hover:ring-gray-300`
                            }`}>
                            {color.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thứ tự
                    </label>
                    <Input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>

                {allCandidates.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Chọn ứng viên ({formData.selectedCandidates.length})
                      </h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={(e) => handleSelectAllChange(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">Chọn tất cả</span>
                      </label>
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                      {allCandidates
                        .filter(candidate => {
                          if (stage) {
                            // Edit: luôn hiện ứng viên đã có trong stage này
                            const isInThisStage = formData.selectedCandidates.includes(candidate.id);
                            // Nếu stage chưa có ứng viên thì chỉ hiện ứng viên chưa thuộc stage nào và không bị reject
                            if (stage.candidates?.length === 0) {
                              return (!candidate.stage_id || isInThisStage) && candidate.pipeline_status !== 'reject';
                            }
                            return (isInThisStage || !candidate.stage_id) && candidate.pipeline_status !== 'reject';
                          } else {
                            // Create stage: hiện ứng viên chưa thuộc stage nào, hoặc ứng viên đã được chọn từ trước
                            const isSelectedCandidate = selectedCandidate && candidate.id === selectedCandidate.id;
                            return (!candidate.stage_id && candidate.pipeline_status !== 'reject') || isSelectedCandidate;
                          }
                        }).map(candidate => (
                          <label key={candidate.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                            <input
                              type="checkbox"
                              checked={formData.selectedCandidates.includes(candidate.id)}
                              onChange={() => handleCandidateToggle(candidate.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {candidate.full_name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {candidate.position} • {candidate.experience}
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {candidate.fit_score}%
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
                
              </div>
              

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isCreating || !formData.name.trim()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {stage ? 'Cập nhật Stage' : 'Tạo Stage'}
                    </>
                  )}
                </button>
                {stage && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={stage.candidates && stage.candidates.length > 0}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa Stage
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageDrawer;