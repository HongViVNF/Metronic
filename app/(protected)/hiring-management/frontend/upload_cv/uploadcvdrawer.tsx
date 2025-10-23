"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/frontend/components/ui/sheet";
import { Button } from "@/app/frontend/components/ui/button";
import { Input } from "@/app/frontend/components/ui/input";
import { Label } from "@/app/frontend/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/frontend/components/ui/select";
import DuplicateDetectionModal from "./DuplicateDetectionModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/frontend/components/ui/card";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// Interfaces
interface Job {
  id: string;
  title: string;
  descriptions?: string;
  created_at: string;
}

interface DuplicateCandidate {
  id: string;
  candidate_id: string;
  job_id: string;
  file_url: string | null;
  hash: string;
  status: string;
  fileName: string;
  existingCandidate: {
    id: string;
    full_name: string;
    email: string;
    cv_link: string | null;
    created_at: string;
    pipeline_status?: string;
    job_id?: string;
    stage_id?: string;
    fit_score?: number;
  };
  suggestedAction: "merge" | "replace" | "create_new" | "skip";
  reason: string;
  newData?: {
    full_name?: string;
    email?: string;
    birthdate?: string | null;
    gender?: string | null;
    position?: string;
    experience?: string;
    skills?: string;
    fit_score?: number;
    strengths?: string;
    weaknesses?: string;
    cv_summary?: string | null;
    evaluation?: string | null;
    pipeline_status?: string | null;
    stage_id?: string | null;
  };
}

interface NewCandidate {
  id: string;
  full_name: string;
  email: string;
  fit_score: number | null;
  fileName: string;
}

interface UploadResponse {
  success: boolean;
  data: {
    newCandidates: NewCandidate[];
    duplicates: DuplicateCandidate[];
    summary: {
      totalFiles: number;
      newFiles: number;
      duplicateFiles: number;
      processedSuccessfully: number;
    };
    errors?: {
      fileName: string;
      error: string;
    }[];
  };
}

interface UploadCVDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  jobId?: string; // Optional job ID to pre-select
}

export default function UploadCVDrawer({ isOpen, onClose, jobId }: UploadCVDrawerProps) {
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string>(jobId || "");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [newCandidates, setNewCandidates] = useState<NewCandidate[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<any>(null);
  const [uploadErrors, setUploadErrors] = useState<{ fileName: string; error: string }[]>([]);

  // Update selectedJobId when jobId prop changes
  useEffect(() => {
    if (jobId) {
      setSelectedJobId(jobId);
    }
  }, [jobId]);

  // Fetch jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: async () => {
      const response = await axios.get("/hiring-management/api/job");
      return response.data;
    },
  });

  // Upload CV mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ jobId, files }: { jobId: string; files: File[] }) => {
      const formData = new FormData();
      formData.append("job_id", jobId);
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await axios.post("/hiring-management/api/upload-cv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data as UploadResponse;
    },
    onSuccess: (data) => {
      setUploadSummary(data.data.summary);
      setNewCandidates(data.data.newCandidates);
      setDuplicates(data.data.duplicates);
      setUploadErrors(data.data.errors || []);
      
      // Show notification for errors
      if (data.data.errors && data.data.errors.length > 0) {
        toast.error(`Không thể xử lý ${data.data.errors.length} file CV. Vui lòng kiểm tra lại!`);
      }
      
      if (data.data.duplicates.length > 0) {
        setShowDuplicateModal(true);
      } else {
        // No duplicates, refresh candidates and close
        queryClient.invalidateQueries({ queryKey: ["candidates"] });
        handleClose();
      }
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      alert(error.response?.data?.message || "Lỗi khi upload CV");
    },
  });


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === "application/pdf");
    
    if (pdfFiles.length !== files.length) {
      alert("Chỉ chấp nhận file PDF");
      return;
    }
    
    // Add new files to existing files, avoiding duplicates by name
    setSelectedFiles(prev => {
      const existingNames = prev.map(f => f.name);
      const newFiles = pdfFiles.filter(file => !existingNames.includes(file.name));
      return [...prev, ...newFiles];
    });
    
    // Clear the input to allow selecting the same files again if needed
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (!selectedJobId) {
      alert("Vui lòng chọn Job Description");
      return;
    }
    
    if (selectedFiles.length === 0) {
      alert("Vui lòng chọn ít nhất một file CV");
      return;
    }

    uploadMutation.mutate({ jobId: selectedJobId, files: selectedFiles });
  };

  const handleProcessDuplicates = (mode: "merge" | "replace" | "create_new") => {
    // The modal handles the processing internally
    queryClient.invalidateQueries({ queryKey: ["candidates"] });
    setShowDuplicateModal(false);
    handleClose();
  };

  const handleSkipDuplicates = () => {
    // Just close modals and refresh - new candidates were already processed
    queryClient.invalidateQueries({ queryKey: ["candidates"] });
    setShowDuplicateModal(false);
    handleClose();
  };

  const handleClose = () => {
    setSelectedJobId(jobId || ""); // Reset to jobId prop or empty
    setSelectedFiles([]);
    setDuplicates([]);
    setNewCandidates([]);
    setShowDuplicateModal(false);
    setUploadSummary(null);
    setUploadErrors([]);
    onClose();
  };


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload & Xử lý CV
            </SheetTitle>
            <SheetDescription>
              Chọn Job Description và upload nhiều file CV để xử lý tự động
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="job-select">Job Description {jobId ? '' : '*'}</Label>
              <Select 
                value={selectedJobId} 
                onValueChange={setSelectedJobId}
                disabled={!!jobId} // Disable if jobId is provided
              >
                <SelectTrigger>
                  <SelectValue placeholder={jobId ? "Job đã được chọn" : "Chọn Job Description..."} />
                </SelectTrigger>
                <SelectContent>
                  {jobsLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải...
                      </div>
                    </SelectItem>
                  ) : (
                    jobs?.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{job.title}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {jobId && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Job đã được chọn tự động cho trang này
                </p>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="cv-files">File CV (PDF) *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Input
                  id="cv-files"
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-2">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("cv-files")?.click()}
                    >
                      Chọn file CV
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Chọn nhiều file PDF cùng lúc
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>File đã chọn ({selectedFiles.length})</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Summary */}
            {uploadSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Kết quả Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tổng file:</span>
                      <span className="ml-2 font-medium">{uploadSummary.totalFiles}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">File mới:</span>
                      <span className="ml-2 font-medium text-green-600">{uploadSummary.newFiles}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">File trùng:</span>
                      <span className="ml-2 font-medium text-orange-600">{uploadSummary.duplicateFiles}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Xử lý thành công:</span>
                      <span className="ml-2 font-medium text-blue-600">{uploadSummary.processedSuccessfully}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Errors */}
            {uploadErrors.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    File không thể xử lý ({uploadErrors.length})
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    Các file sau gặp lỗi khi đọc và xử lý. Vui lòng kiểm tra lại file và upload lại.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uploadErrors.map((error, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-200"
                      >
                        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-red-800 truncate">
                            {error.fileName}
                          </p>
                          <p className="text-sm text-red-600 mt-1">
                            {error.error}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>💡 Mẹo:</strong> Đảm bảo file PDF không bị hỏng, không được bảo vệ bằng mật khẩu, và có nội dung text có thể đọc được (không phải chỉ hình ảnh).
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUpload}
                disabled={!selectedJobId || selectedFiles.length === 0 || uploadMutation.isPending}
                className="flex-1"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Xử lý CV
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Hủy
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Duplicate Detection Modal */}
      <DuplicateDetectionModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        duplicates={duplicates}
        onSkip={handleSkipDuplicates}
        onProcess={handleProcessDuplicates}
      />
    </>
  );
}

