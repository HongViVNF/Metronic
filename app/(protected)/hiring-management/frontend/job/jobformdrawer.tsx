"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/frontend/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/frontend/components/ui/card";
import { Input } from "@/app/frontend/components/ui/input";
import { Label } from "@/app/frontend/components/ui/label";
import { Textarea } from "@/app/frontend/components/ui/textarea";
import { Button } from "@/app/frontend/components/ui/button";
import { Briefcase, FileText, X, Loader2, ChevronDown } from "lucide-react";
import TiptapEditor from "../components/TiptapEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/frontend/components/ui/select";
import { Job, JobFormData } from "../services/jobService";
import { useQuery } from "@tanstack/react-query";
import pipelineService from "../services/pipelineService";
import { JobStatus } from "@prisma/client";
import React from "react";

type ExtendedJobFormData = JobFormData & {
  id?: string;
  jobCode?: string | null;
};

interface JobFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedJob: Job | null;
  formData: ExtendedJobFormData;
  onFormDataChange: (data: ExtendedJobFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isCreating: boolean;
  isUpdating: boolean;
}

export default function JobFormDialog({
  isOpen,
  onOpenChange,
  selectedJob,
  formData,
  onFormDataChange,
  onSubmit,
  isCreating,
  isUpdating,
}: JobFormDialogProps) {
  // Fetch pipelines for the dropdown
  const { data: pipelines, isLoading: isPipelinesLoading } = useQuery<Array<{ id: string; name: string; isDefault?: boolean }>>({
    queryKey: ['pipelines'],
    queryFn: () => pipelineService.getPipelines(),
  });

  // Set default pipeline when pipelines are loaded (for new job)
  React.useEffect(() => {
    if (pipelines && pipelines.length > 0 && !formData.pipelineId && !selectedJob) {
      const defaultPipeline = pipelines.find(p => p.isDefault) || pipelines[0];
      onFormDataChange({
        ...formData,
        pipelineId: defaultPipeline?.id || null,
      });
    }
  }, [pipelines, formData, onFormDataChange, selectedJob]);

  // Set default pipeline when pipelines are loaded and formData.pipelineId is still null/undefined (for editing job)
  React.useEffect(() => {
    if (pipelines && pipelines.length > 0 && !formData.pipelineId && selectedJob && !selectedJob.pipelineId) {
      const defaultPipeline = pipelines.find(p => p.isDefault) || pipelines[0];
      onFormDataChange({
        ...formData,
        pipelineId: defaultPipeline?.id || null,
      });
    }
  }, [pipelines, formData.pipelineId, selectedJob, onFormDataChange]);

  // Update form data when selectedJob changes (for editing job)
  React.useEffect(() => {
    if (selectedJob) {
      onFormDataChange({
        title: selectedJob.title || '',
        jobCode: selectedJob.jobCode || '',
        descriptions: selectedJob.descriptions || null,
        requirements: selectedJob.requirements || null,
        status: selectedJob.status || JobStatus.DRAFT,
        pipelineId: selectedJob.pipelineId, // Keep existing pipelineId, don't change it
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
      });
    }
  }, [selectedJob, onFormDataChange]);

  const handleInputChange = (field: keyof JobFormData, value: string | JobStatus | Date | null) => {
    if ((field === 'startDate' || field === 'endDate') && typeof value === 'string') {
      onFormDataChange({
        ...formData,
        [field]: value ? new Date(value) : null,
      });
    } else {
      onFormDataChange({ ...formData, [field]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm border border-blue-100 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-6 mt-10">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Briefcase size={24} />
            {selectedJob ? 'Chỉnh Sửa Job' : 'Thêm Job Mới'}
          </DialogTitle>
          <DialogDescription className="text-blue-100 mt-2">
            {selectedJob ? 'Cập nhật thông tin job để phù hợp với nhu cầu tuyển dụng.' : 'Tạo job mới để bắt đầu quá trình tuyển dụng.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className=" space-y-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <FileText size={20} className="text-blue-600" />
                Thông tin Job
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Pipeline Field - Only show for new jobs */}
              {!selectedJob && (
                <div className="space-y-2">
                  <Label htmlFor="pipelineId" className="text-sm font-semibold text-gray-700">
                    Pipeline tuyển dụng *
                  </Label>
                  <Select
                    value={formData.pipelineId || (pipelines && pipelines.length > 0 ? (pipelines.find(p => p.isDefault)?.id || pipelines[0].id) : '')}
                    onValueChange={(value: string) => handleInputChange('pipelineId', value)}
                    disabled={!pipelines || pipelines.length === 0}
                  >
                    <SelectTrigger id="pipelineId" className="w-full h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                      <SelectValue placeholder={isPipelinesLoading ? 'Đang tải...' : 'Chọn pipeline'} />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelines?.map((pipeline) => (
                        <SelectItem key={pipeline.id} value={pipeline.id}>
                          {pipeline.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Show current pipeline for existing jobs (read-only) */}
              {selectedJob && selectedJob.pipelineId && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Pipeline tuyển dụng
                  </Label>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      {pipelines?.find(p => p.id === selectedJob.pipelineId)?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Pipeline không thể thay đổi sau khi tạo job
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Job Code */}
                <div className="space-y-2">
                  <Label htmlFor="jobCode" className="text-sm font-semibold text-gray-700">
                    Mã Job *
                  </Label>
                  <Input
                    id="jobCode"
                    value={formData.jobCode || ''}
                    onChange={(e) => handleInputChange('jobCode', e.target.value)}
                    placeholder="Ví dụ: JOB-001"
                    required
                    className="h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>

                {/* Job Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                    Tiêu đề Job *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ví dụ: Senior Frontend Developer"
                    required
                    className="h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-semibold text-gray-700">
                    Ngày bắt đầu
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    className="h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-semibold text-gray-700">
                    Ngày kết thúc
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    className="h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                    Trạng thái
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: JobStatus) => handleInputChange('status', value)}
                  >
                    <SelectTrigger id="status" className="w-full h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Bản nháp</SelectItem>
                      <SelectItem value="OPEN">Đang tuyển dụng</SelectItem>
                      <SelectItem value="CLOSED">Đã đóng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-2">
                <Label htmlFor="descriptions" className="text-sm font-semibold text-gray-700">
                  Mô tả Job
                </Label>
                <div className="border border-blue-200 rounded-lg overflow-hidden">
                  <TiptapEditor
                    content={formData.descriptions || ''}
                    onChange={(content) => handleInputChange('descriptions', content)}
                    placeholder="Mô tả chi tiết về vị trí công việc và quyền lợi..."
                  />
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-sm font-semibold text-gray-700">
                  Yêu cầu ứng viên
                </Label>
                <div className="border border-blue-200 rounded-lg overflow-hidden">
                  <TiptapEditor
                    content={formData.requirements || ''}
                    onChange={(content) => handleInputChange('requirements', content)}
                    placeholder="Mô tả chi tiết về yêu cầu công việc"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter className="bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex gap-3 w-full">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isCreating || isUpdating || !formData.title.trim() || !formData.jobCode?.trim() || (!selectedJob && !formData.pipelineId)}
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isCreating || isUpdating ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Đang xử lý...
                </>
              ) : selectedJob ? 'Cập Nhật Job' : 'Tạo Job Mới'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 border-gray-300 hover:bg-gray-100 font-semibold"
            >
              Hủy
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}