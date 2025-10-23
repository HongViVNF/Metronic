"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/app/frontend/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/frontend/components/ui/table";
import { Input } from "@/app/frontend/components/ui/input";
import { Badge } from "@/app/frontend/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/frontend/components/ui/tooltip";
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Briefcase,
  Calendar,
  User,
  AlertTriangle,
  Upload,
} from "lucide-react";
import JobFormDialog from "./jobformdrawer";
import UploadCVDrawer from "../upload_cv/uploadcvdrawer";
import { jobService, Job, JobFormData, JobUpdateData } from "../services/jobService";

// Function to fetch stages for a job
const fetchStagesByJobId = async (jobId: string) => {
  const response = await fetch(`/hiring-management/api/job/${jobId}/stages`);
  if (!response.ok) {
    throw new Error("Failed to fetch stages");
  }
  return response.json();
};

// Component for candidate count tooltip
const CandidateCountTooltip: React.FC<{ job: Job }> = ({ job }) => {
  const { data: stages } = useQuery({
    queryKey: ["jobStages", job.id],
    queryFn: () => fetchStagesByJobId(job.id),
    enabled: !!job.id,
  });

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-medium">Tổng số hồ sơ: {job.totalCandidates || 0}</div>
      {stages?.stages?.map((stage: any, index: number) => (
        <div key={stage.id} className="text-sm">
          {stage.name}: {job.stageCounts?.[index] || 0}
        </div>
      ))}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="font-medium cursor-help">
            {job?.totalCandidates || 0}
            {job?.stageCounts && job.stageCounts.some(count => count > 0) && (
              <span className="text-gray-500">
                /
                {job.stageCounts
                  .map((count) => (count === 0 || count === null ? "_" : count))
                  .join("/")}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface HiringPageProps {
  onJobSelect: (jobId: string) => void;
}

export default function HiringPage({ onJobSelect }: HiringPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isUploadCVDrawerOpen, setIsUploadCVDrawerOpen] = useState(false);

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    descriptions: "",
    requirements: "",
    status: "DRAFT",
    jobCode: "",
    startDate: null,
    endDate: null,
  });

  // API Functions
  const fetchJobs = () => jobService.getAll();
  const createJob = (data: JobFormData) => jobService.create(data);
  const updateJob = (data: JobUpdateData) => jobService.update(data);
  const deleteJob = (id: string) => jobService.delete(id);

  // Queries and Mutations
  const {
    data: jobs,
    isLoading,
    error,
  } = useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
  });

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setIsDrawerOpen(false);
      resetForm();
      toast.success("Job created successfully");
    },
    onError: (error) => {
      console.error("Create job error:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", selectedJob?.id] });
      queryClient.invalidateQueries({ queryKey: ["jobStages", selectedJob?.id] });
      setIsDrawerOpen(false);
      setSelectedJob(null);
      resetForm();
    },
    onError: (error) => {
      console.error("Update job error:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setShowDeleteConfirm(null);
    },
    onError: (error) => {
      console.error("Delete job error:", error);
    },
  });

  // Helper Functions
  const resetForm = () => {
    setSelectedJob(null);
    setFormData({
      title: "",
      descriptions: "",
      requirements: "",
      status: "DRAFT",
      jobCode: "",
      startDate: null,
      endDate: null,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jobCode) {
      // Handle validation error
      console.error("Job code is required");
      return;
    }
  
    if (selectedJob) {
      updateMutation.mutate({ 
        ...selectedJob, 
        ...formData,
        jobCode: formData.jobCode // Ensure jobCode is always a string
      });
    } else {
      createMutation.mutate({
        ...formData,
        jobCode: formData.jobCode // Ensure jobCode is always a string
      });
    }
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title || "",
      descriptions: job.descriptions || "",
      requirements: job.requirements || "",
      status: job.status || "DRAFT",
      jobCode: job.jobCode || "",
      startDate: job.startDate ? new Date(job.startDate) : null,
      endDate: job.endDate ? new Date(job.endDate) : null,
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent row click when clicking delete button
    setShowDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      deleteMutation.mutate(showDeleteConfirm);
      resetForm();
    }
  };

  const handleOpenCreateDrawer = () => {
    setSelectedJob(null);
    resetForm();
    setIsDrawerOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  // Filter data
  const filteredJobs = jobs?.filter(job =>
    job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.descriptions?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-500 text-center p-8">
      <div className="text-lg font-semibold">Lỗi khi tải dữ liệu</div>
      <div className="text-sm mt-2">Vui lòng thử lại sau</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Job</h1>
              <p className="text-gray-600">
                Tổng số job: {filteredJobs.length}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                onClick={() => setIsUploadCVDrawerOpen(true)}
                variant="outline"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-600 text-white hover:text-white"
              >
                <Upload size={16} />
                Upload CV
              </Button>
              <Button
                onClick={handleOpenCreateDrawer}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus size={16} />
                Thêm Job
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col lg:flex-row gap-4 ">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Tìm kiếm theo tên job, mô tả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-full table-auto border-collapse">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <TableHead className="px-4 py-3 font-semibold text-gray-700 text-left w-[120px]">Mã Job</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-gray-700 text-left w-[200px]">Tiêu đề</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-gray-700 text-left w-[120px]">Trạng thái</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-gray-700 text-left w-[150px]">Số lượng hồ sơ</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-gray-700 text-left w-[150px]">Ngày hiệu lực</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-gray-700 text-left w-[150px]">Người tạo</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-gray-700 text-left w-[120px]">Ngày tạo</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-gray-700 text-left max-w-[200px]">Mô tả</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-gray-700 text-left max-w-[200px]">Yêu cầu</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-gray-700 text-center w-[110px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow
                    key={job.id}
                    // className="hover:bg-blue-50/50 transition-colors duration-200 cursor-pointer"
                    onClick={() => onJobSelect(job.id)}
                  >
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{job.jobCode || 'N/A'}</div>
                    </TableCell>

                    <TableCell className="px-4 py-3 max-w-[200px]">
                      <div className="font-medium text-gray-900 truncate" title={job.title || 'Chưa có tiêu đề'}>
                        {job.title || 'Chưa có tiêu đề'}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      {job.status === "OPEN" && (
                        <Badge className="bg-green-500 text-white hover:bg-green-600 capitalize">
                          Open
                        </Badge>
                      )}

                      {job.status === "CLOSED" && (
                        <Badge className="bg-red-500 text-white hover:bg-red-600 capitalize">
                          Closed
                        </Badge>
                      )}

                      {job.status !== "OPEN" && job.status !== "CLOSED" && (
                        <Badge className="bg-yellow-400 text-white hover:bg-yellow-500 capitalize">
                          {job.status?.toLowerCase() || "unknown"}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3 whitespace-nowrap text-gray-600">
                      <CandidateCountTooltip job={job} />
                    </TableCell>

                    <TableCell className="px-4 py-3 whitespace-nowrap text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span>
                          {job.startDate && job.endDate
                            ? `${formatDate(job.startDate.toString())} - ${formatDate(job.endDate.toString())}`
                            : job.startDate
                            ? formatDate(job.startDate.toString())
                            : job.endDate
                            ? formatDate(job.endDate.toString())
                            : "N/A"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 whitespace-nowrap text-gray-600">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span>
                          {job.updatedBy?.name || job.updatedBy?.email || job.createdBy?.name || job.createdBy?.email || 'N/A'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 whitespace-nowrap text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{formatDate(job.created_at)}</span>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 max-w-[200px] break-words">
                      <p className="text-gray-600 truncate" title={stripHtml(job.descriptions || 'Chưa có mô tả')}>
                        {job.descriptions ? stripHtml(job.descriptions) : 'Chưa có mô tả'}
                      </p>
                    </TableCell>

                    <TableCell className="px-4 py-3 max-w-[200px] break-words">
                      <p className="text-gray-600 truncate" title={stripHtml(job.requirements || 'Chưa có mô tả')}>
                        {job.requirements ? stripHtml(job.requirements) : 'Chưa có mô tả'}
                      </p>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(job);
                          }}
                          className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1 h-auto"
                          aria-label={`Chỉnh sửa ${job.title}`}
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={14} />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(e, job.id);
                          }}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 h-auto"
                          aria-label={`Xóa ${job.title}`}
                          title="Xóa"
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

          {/* Empty State */}
          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có job nào</h3>
              <p className="text-gray-500">Thêm job mới hoặc thử thay đổi từ khóa tìm kiếm</p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-3">
                  Bạn có chắc chắn muốn xóa job này?
                </p>
                <p className="text-sm text-gray-500">
                  Hành động này không thể hoàn tác.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={deleteMutation.isPending}
                  className="px-6"
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="px-6 bg-red-600 hover:bg-red-700"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang xóa...
                    </>
                  ) : (
                    'Xác nhận xóa'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Job Form Dialog */}
        <JobFormDialog
          isOpen={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          selectedJob={selectedJob}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
          isCreating={createMutation.isPending}
          isUpdating={updateMutation.isPending}
        />

        <UploadCVDrawer
          isOpen={isUploadCVDrawerOpen}
          onClose={() => setIsUploadCVDrawerOpen(false)}
        />
      </div>
    </div>
  );
}
