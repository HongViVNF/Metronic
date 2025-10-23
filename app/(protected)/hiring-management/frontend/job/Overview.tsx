"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader } from "@/app/frontend/components/ui/card";
import { Badge } from "@/app/frontend/components/ui/badge";
import { Briefcase, Calendar, Clock, Hash, ListChecks, Users, FileText, ListChecks as RequirementsIcon, Edit3 } from "lucide-react";
import { Button } from "@/app/frontend/components/ui/button";
import { Job, JobFormData, jobService, JobUpdateData } from "../services/jobService"; 
import { useState } from "react";
import { JobStatus } from "@prisma/client";
import JobFormDrawer from "./jobformdrawer";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HiringPipeline } from '../types/pipeline.types';

interface InfoRowProps {
  icon: React.ReactNode;
  label: string | React.ReactNode;
  children: React.ReactNode;
}

interface OverviewProps {
  job: Job | null;
  pipeline: HiringPipeline | null | undefined;
  isLoadingPipeline: boolean;
}

const InfoRow = ({ icon, label, children }: InfoRowProps) => (
  <div className="flex items-start gap-2 text-sm">
    <div className="flex items-center gap-1 text-gray-500">
      {icon}
      <span className="font-medium">{label}:</span>
    </div>
    <div className="ml-1">{children}</div>
  </div>
);

export default function Overview({ job, pipeline, isLoadingPipeline }: OverviewProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    title: job?.title || "",
    descriptions: job?.descriptions || "",
    requirements: job?.requirements || "",
    status: job?.status || "DRAFT",
    jobCode: job?.jobCode || "",
    startDate: job?.startDate ? new Date(job.startDate) : null,
    endDate: job?.endDate ? new Date(job.endDate) : null,
    pipelineId: job?.pipelineId || null,
  });
  
  const queryClient = useQueryClient();

  const updateJob = async (data: JobUpdateData) => {
    if (!job) return;
    return jobService.update({ ...data, id: job.id });
  };

  const updateMutation = {
    isPending: false,
    mutate: async (data: JobUpdateData) => {
      try {
        const updatedJob = await updateJob(data);
        toast.success("Cập nhật công việc thành công");
        
        // Invalidate both the jobs list and the specific job query
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["jobs"] }),
          queryClient.invalidateQueries({ queryKey: ["job", job?.id] })
        ]);
        
        // Update the local job data if needed
        if (updatedJob) {
          // Update the job data in the parent component if needed
          // This depends on how the job data is being passed down
        }
        
        setIsDrawerOpen(false);
      } catch (error) {
        console.error("Update job error:", error);
        toast.error("Có lỗi xảy ra khi cập nhật công việc");
      }
    },
  };

  const handleEdit = (job: Job | null) => {
    if (!job) return;
    setFormData({
      title: job.title || "",
      descriptions: job.descriptions || "",
      requirements: job.requirements || "",
      status: job.status || "DRAFT",
      jobCode: job.jobCode || "",
      startDate: job.startDate ? new Date(job.startDate) : null,
      endDate: job.endDate ? new Date(job.endDate) : null,
      pipelineId: job.pipelineId || null,
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    
    // Prepare update data with required fields
    const updateData: JobUpdateData = {
      id: job.id,
      title: formData.title,
      descriptions: formData.descriptions || null,
      requirements: formData.requirements || null,
      status: formData.status,
      jobCode: formData.jobCode || "", // Ensure jobCode is always a string
      pipelineId: formData.pipelineId || null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null
    };
    
    updateMutation.mutate(updateData);
  };

  return (
    <div className="space-y-6">
      <Card className="hover:shadow-md transition-shadow bg-white border border-gray-100">
        <CardHeader className="border-b border-gray-100 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2 text-blue-800">
              <Briefcase className="h-5 w-5" />
              THÔNG TIN CÔNG VIỆC
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(job);
              }}
              disabled={!job}
              title="Chỉnh sửa thông tin công việc"
            >
              <Edit3 className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Left column */}
          <div className="space-y-4">
            <InfoRow icon={<Hash className="h-4 w-4 text-blue-600" />} label={<span className="font-semibold text-gray-900">Mã công việc</span>}>
              <span className="font-semibold text-gray-900">{job?.jobCode || "Chưa có"}</span>
            </InfoRow>

            <InfoRow
              icon={<Clock className="h-4 w-4 text-blue-600" />}
              label={<span className="font-semibold text-gray-900">Trạng thái</span>}
            >
              <Badge
                className={`font-bold text-xs 
                  ${job?.status === "DRAFT" ? "bg-yellow-500 text-white hover:bg-yellow-500 hover:text-white" 
                  : job?.status === "OPEN" ? "bg-green-500 text-white hover:bg-green-500 hover:text-white"
                  : job?.status === "CLOSED" ? "bg-red-500 text-white hover:bg-red-500 hover:text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800"}`}
              >
                {job?.status === "DRAFT"
                  ? "Bản nháp"
                  : job?.status === "OPEN"
                  ? "Đang tuyển"
                  : "Đã đóng"}
              </Badge>
            </InfoRow>

            <InfoRow icon={<Users className="h-4 w-4 text-blue-600 " />} label={<span className="font-semibold text-gray-900">Số hồ sơ</span>}>
              <div className="font-semibold text-gray-900">
                {job?.totalCandidates || 0}              
                <span className="font-normal"> ứng viên</span>
              </div>
            </InfoRow>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <InfoRow icon={<Calendar className="h-4 w-4 text-blue-600" />} label={<span className="font-semibold text-gray-900">Thời hạn</span>}>
              {job?.startDate ? (
                <span className="font-semibold text-gray-900">{new Date(job.startDate).toLocaleDateString("vi-VN")}</span>
              ) : (
                <span className="text-muted-foreground">Chưa có</span>
              )}
              {job?.endDate && (
                <>
                  <span className="text-muted-foreground"> - </span>
                  <span className="font-semibold text-gray-900">{new Date(job.endDate).toLocaleDateString("vi-VN")}</span>
                </>
              )}
            </InfoRow>

            <InfoRow icon={<ListChecks className="h-4 w-4 text-blue-600" />} label={<span className="font-semibold text-gray-900">Loại tuyển dụng</span>}>
              {isLoadingPipeline ? (
                <span className="text-muted-foreground text-sm">Đang tải...</span>
              ) : pipeline?.name ? (
                <span className="font-semibold text-gray-900">{pipeline.name}</span>
              ) : (
                <span className="text-muted-foreground text-sm">Chưa chọn</span>
              )}
            </InfoRow>
          </div>
        </CardContent>
      </Card>

      {/* Description & Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <h3 className="text-md font-semibold flex items-center gap-2 text-green-700">
              <FileText className="h-5 w-5" />
              Mô tả
            </h3>
          </CardHeader>
          <CardContent>
            <div
              className="prose max-w-none text-sm text-gray-700"
              dangerouslySetInnerHTML={{
                __html:
                  job?.descriptions ||
                  '<p class="text-muted-foreground">Chưa có mô tả</p>',
              }}
            />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <h3 className="text-md font-semibold flex items-center gap-2 text-orange-600">
              <RequirementsIcon className="h-5 w-5" />
              Yêu cầu
            </h3>
          </CardHeader>
          <CardContent>
            <div
              className="prose max-w-none text-sm text-gray-700"
              dangerouslySetInnerHTML={{
                __html:
                  job?.requirements ||
                  '<p class="text-muted-foreground">Chưa có yêu cầu</p>',
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Job Form Drawer */}
      <JobFormDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        selectedJob={job}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        isCreating={false}
        isUpdating={updateMutation.isPending}
      />
    </div>
  );
}
