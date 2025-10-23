"use client";

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Button } from "@/app/frontend/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/frontend/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/frontend/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { jobService, JobStatus } from "../services/jobService";
import { AlertTriangle, ArrowLeft, User, FileText, Calendar, Hash, FileText as DescriptionIcon, Pencil, Users, Briefcase, Clock, MapPin, DollarSign, ListChecks } from "lucide-react";
import { Badge } from "@/app/frontend/components/ui/badge";
import JobTable from './jobtable';
import pipelineService from '../services/pipelineService';
import Overview from './Overview';
import PipelineKanbanView from '../stage/PipelineKanbanView';
import { StageDetailPage } from '../stage/StageDetailPage';
import { Stage } from '../types/stage.types';
import CandidateTable from '../candidate/candidatetable';
import ActivityTab from './ActivityTab';


export default function JobPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  
  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return null;
      const jobData = await jobService.getJobById(selectedJobId);
      return jobData;
    },
    enabled: !!selectedJobId,
  });

  const InfoRow = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-2 text-sm">
      <div className="flex items-center gap-1 text-gray-500">
        {icon}
        <span className="font-medium">{label}:</span>
      </div>
      <div className="ml-1">{children}</div>
    </div>
  );

  // Fetch pipeline data
  const { data: pipeline, isLoading: isLoadingPipeline }:any = useQuery({
    queryKey: ["pipeline", job?.pipelineId],
    queryFn: async () => {
      if (!job?.pipelineId) return null;
      console.log('Fetching pipeline with ID:', job.pipelineId);
      const result = await pipelineService.getPipelineById(job.pipelineId);
      console.log('Fetched pipeline:', result);
      return result;
    },
    enabled: !!job?.pipelineId,
  });

  // Invalidate jobStages cache when job pipeline changes
  useEffect(() => {
    if (job?.pipelineId && selectedJobId) {
      queryClient.invalidateQueries({ queryKey: ["jobStages", selectedJobId] });
    }
  }, [job?.pipelineId, selectedJobId, queryClient]);

  const handleBackToList = () => {
    setSelectedJobId(null);
  };

  const handleViewStage = (stage: Stage) => {
    setSelectedStage(stage);
  };

  // Job List View
  if (!selectedJobId) {
    return (
        <JobTable onJobSelect={setSelectedJobId} />
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-600">
        <AlertTriangle className="w-12 h-12 mb-2" />
        <p>Đã xảy ra lỗi khi tải thông tin công việc</p>
        <Button 
          onClick={handleBackToList}
          className="flex items-center gap-2"
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      </div>
    );
  }

  // Job Detail View
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="space-y-6 max-w-8xl mx-auto">
        <div className="flex items-center justify-between gap-4 mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Button>
          
          {/* <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Tạo ngày: </span>
            <span>{job?.created_at ? new Date(job.created_at).toLocaleDateString("vi-VN") : 'Chưa có'}</span>
            <span className="hidden sm:inline">•</span>
            <span>Cập nhật: {job?.updated_at ? new Date(job.updated_at).toLocaleDateString("vi-VN") : 'Chưa có'}</span>
          </div> */}
        </div>
    
        <Card className="border-0">
          <CardHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold">{job?.title}</h1>
                  {job?.endDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Hạn nộp: {new Date(job.endDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {/* Badge trạng thái */}
                  <Badge
                    className={`text-sm py-1.5 px-4 font-semibold rounded-md
                      ${job?.status === "DRAFT" ? "bg-yellow-500 text-white hover:bg-yellow-500 hover:text-white"
                      : job?.status === "OPEN" ? "bg-green-500 text-white hover:bg-green-500 hover:text-white"
                      : job?.status === "CLOSED" ? "bg-red-500 text-white hover:bg-red-500 hover:text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800"}`}
                  >
                    {job?.status === "DRAFT"
                      ? "Bản nháp"
                      : job?.status === "OPEN"
                      ? "Đang tuyển dụng"
                      : "Đã đóng"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
    
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 max-w-sm mb-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  Tổng quan
                </TabsTrigger>
                <TabsTrigger value="candidates" className="flex items-center gap-2">
                  Ứng viên
                </TabsTrigger>
                <TabsTrigger value="pipeline" className="flex items-center gap-2">
                  Pipeline
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  Hoạt động
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Overview job={job} pipeline={pipeline} isLoadingPipeline={isLoadingPipeline} />
              </TabsContent>
              <TabsContent value="candidates">
                {selectedJobId && <CandidateTable jobId={selectedJobId} />}
              </TabsContent>
              <TabsContent value="pipeline" className="mt-6">
                {selectedJobId && (
                  selectedStage ? (
                    <div className="space-y-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStage(null)}
                        className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                      >
                        <ArrowLeft size={16} />
                        Quay lại danh sách Stage
                      </Button>
                      <StageDetailPage
                        stage={selectedStage}
                        onSelectCandidate={() => {}}
                        hiringPipelineId={job?.pipelineId}
                        jobId={selectedJobId || undefined}
                      />
                    </div>
                  ) : (
                    <PipelineKanbanView jobId={selectedJobId} onViewStage={handleViewStage} />
                  )
                )}
              </TabsContent>
              <TabsContent value="activity" className="mt-6">
                {selectedJobId && <ActivityTab jobId={selectedJobId} />}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
