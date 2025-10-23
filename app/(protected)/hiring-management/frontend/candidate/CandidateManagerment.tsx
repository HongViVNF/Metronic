"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import * as XLSX from 'xlsx';
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
import { Avatar, AvatarFallback } from "@/app/frontend/components/ui/avatar";
import { Checkbox } from "@/app/frontend/components/ui/checkbox";
import {
  Upload,
  Trash2,
  Edit3,
  Plus,
  Eye,
  ExternalLink,
  User,
  Mail,
  Phone,
  Briefcase,
  Star,
  Search,
  Filter,
  AlertTriangle,
  ChevronsRight,
  ChevronLeft,
  ChevronsLeft,
  AlertCircle,
  ChevronRight
} from "lucide-react";

import ExcelPreviewDrawer from "../components/excelreviewdrawer";
import CandidateFormDialog from "../components/candidateformdrawer";
import UploadCVDrawer from "../upload_cv/uploadcvdrawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/frontend/components/ui/select";
import CandidateDetailDrawer from "./candidatedetaildrawer";

// Import drawer components
// Interfaces
interface Candidate {
  id: string;
  full_name: string;
  email?: string | null;
  birthdate?: string | null;
  gender?: string | null;
  position?: string | null;
  experience?: string | null;
  source?: string | null;
  note?: string | null;
  evaluation?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  skills?: string | null;
  pipeline_status?: string | null;
  cv_link?: string | null;
  fit_score?: number | null;
  createdOn?: string;

  // Bổ sung từ backend
  reject_reason?: string | null;
  stage_name?: string | null;
  active_status?: boolean | null;
  activity_note?: string | null;
  activity_name?: string | null;
}

interface ExcelCandidate {
  full_name: string;
  email?: string | null;
  birthdate?: string | null;
  gender?: string | null;
  position?: string | null;
  experience?: string | null;
  note?: string | null;
  evaluation?: string | null;
  source?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  skills?: string | null;
  pipeline_status?: string | null;
  cv_link?: string | null;
  fit_score?: number | null;
  isNew?: boolean;
  isEdited?: boolean;
}

interface CandidateFormData {
  full_name: string;
  email: string;
  birthdate: string;
  gender: string;
  note: string;
  evaluation: string;
  position: string;
  experience: string;
  source: string;
  strengths: string;
  weaknesses: string;
  skills: string;
  pipeline_status: string;
  cv_link: string;
  fit_score: number | null;
}


export default function CandidateManagerment() {
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExcelPreviewOpen, setIsExcelPreviewOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isUploadCVDrawerOpen, setIsUploadCVDrawerOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Bulk delete states
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<CandidateFormData>({
    full_name: "",
    email: "",
    birthdate: "",
    gender: "",
    position: "",
    experience: "",
    source: "",
    note: "",
    evaluation: "",
    strengths: "",
    weaknesses: "",
    skills: "",
    pipeline_status: "pending",
    cv_link: "",
    fit_score: null,
  });

  const [excelData, setExcelData] = useState<ExcelCandidate[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Thay đổi từ: const [pageSize] = useState(10);
  const [positionFilter, setPositionFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  // API Functions
  const getUserId = (): string => {
    if (typeof window !== "undefined") {
      const state = localStorage.getItem("ai.platform");
      return state ? JSON.parse(state)?.state?.user?.id : "";
    }
    return "";
  };

  const fetchCandidates = async (): Promise<Candidate[]> => {
    const userId = getUserId();
    const response = await fetch("/hiring-management/api/candidate", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-AI-Platform-UserId": userId,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch candidates");
    const result = await response.json();
    return result.data || [];
  };


  const createCandidate = async (data: Omit<Candidate, 'id' | 'createdOn'>): Promise<Candidate> => {
    const userId = getUserId();
    const response = await axios.post("/hiring-management/api/candidate", {
      ...data,
      createdById: userId
    }, {
      headers: {
        "X-AI-Platform-UserId": userId,
      },
    });
    return response.data.data;
  };

  const updateCandidate = async (data: Candidate): Promise<Candidate> => {
    const userId = getUserId();
    const response = await axios.put("/hiring-management/api/candidate", {
      ...data,
      updatedById: userId
    }, {
      headers: {
        "X-AI-Platform-UserId": userId,
      },
    });
    return response.data.data;
  };

  const deleteCandidate = async (id: string): Promise<void> => {
    const userId = getUserId();
    await axios.delete("/hiring-management/api/candidate", {
      data: { id },
      headers: {
        "X-AI-Platform-UserId": userId,
      },
    });
  };

  // New bulk delete function
  const deleteCandidates = async (ids: string[]): Promise<void> => {
    const userId = getUserId();
    const promises = ids.map(id =>
      axios.delete("/hiring-management/api/candidate", {
        data: { id },
        headers: {
          "X-AI-Platform-UserId": userId,
        },
      })
    );
    await Promise.all(promises);
  };

  const createMultipleCandidates = async (data: ExcelCandidate[]): Promise<void> => {
    const promises = data.map(item => {
      const payload = {
        full_name: item.full_name,
        email: item.email,
        birthdate: item.birthdate,
        gender: item.gender,
        position: item.position,
        experience: item.experience,
        source: item.source,
        strengths: item.strengths,
        weaknesses: item.weaknesses,
        skills: item.skills,
        pipeline_status: item.pipeline_status,
        cv_link: item.cv_link,
        fit_score: item.fit_score,
      };
      return axios.post("/hiring-management/api/candidate", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
    await Promise.all(promises);
  };

  // Queries and Mutations
  const {
    data: candidates,
    isLoading,
    error,
  } = useQuery<Candidate[]>({
    queryKey: ["candidates"],
    queryFn: fetchCandidates,
  });

  const createMutation = useMutation({
    mutationFn: createCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.refetchQueries({ queryKey: ["candidates"] });
      setIsDrawerOpen(false);
      resetFormData();
    },
    onError: (error) => {
      console.error("Create candidate error:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.refetchQueries({ queryKey: ["candidates"] });
      setIsDrawerOpen(false);
      setSelectedCandidate(null);
      resetFormData();
    },
    onError: (error) => {
      console.error("Update candidate error:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.refetchQueries({ queryKey: ["candidates"] });
    },
    onError: (error) => {
      console.error("Delete candidate error:", error);
    },
  });

  // New bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: deleteCandidates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.refetchQueries({ queryKey: ["candidates"] });
      setSelectedCandidateIds([]);
      setShowBulkDeleteConfirm(false);
    },
    onError: (error) => {
      console.error("Bulk delete candidates error:", error);
    },
  });

  const createMultipleMutation = useMutation({
    mutationFn: createMultipleCandidates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.refetchQueries({ queryKey: ["candidates"] });
      setIsExcelPreviewOpen(false);
      setExcelData([]);
    },
    onError: (error) => {
      console.error("Create multiple candidates error:", error);
    },
  });

  // Helper Functions
  const resetFormData = () => {
    setFormData({
      full_name: "",
      email: "",
      birthdate: "",
      gender: "",
      note: "",
      evaluation: "",
      position: "",
      experience: "",
      source: "",
      strengths: "",
      weaknesses: "",
      skills: "",
      pipeline_status: "pending",
      cv_link: "",
      fit_score: null,
    });
  };
  const goToFirstPage = () => {
    setCurrentPage(1);
    setSelectedCandidateIds([]);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setSelectedCandidateIds([]);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setSelectedCandidateIds([]);
    }
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
    setSelectedCandidateIds([]);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setSelectedCandidateIds([]);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    setSelectedCandidateIds([]);
  };
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    setSelectedCandidateIds([]);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    setSelectedCandidateIds([]);
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidateIds(filteredCandidates.map(candidate => candidate.id));
    } else {
      setSelectedCandidateIds([]);
    }
  };

  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidateIds(prev => [...prev, candidateId]);
    } else {
      setSelectedCandidateIds(prev => prev.filter(id => id !== candidateId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedCandidateIds.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedCandidateIds);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        let targetSheetName = workbook.SheetNames.find(name =>
          name.toLowerCase().includes('danh sach cv') ||
          name.toLowerCase().includes('danh sách cv') ||
          name.toLowerCase().includes('cv') ||
          name === 'Danh sach CV'
        ) || workbook.SheetNames[0];

        const worksheet = workbook.Sheets[targetSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          return;
        }

        const headers = jsonData[0] as string[];
        const mappedData: ExcelCandidate[] = [];

        const getColumnIndex = (possibleNames: string[]) => {
          return possibleNames
            .map(name => headers.findIndex(h =>
              h && h.toLowerCase().trim().includes(name.toLowerCase().trim())
            ))
            .find(index => index !== -1) || -1;
        };

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row.some(cell => cell !== null && cell !== undefined && cell !== "")) {
            const candidate: ExcelCandidate = {
              full_name: row[getColumnIndex(["Họ và tên", "Họ tên", "Name", "Ho va ten"])]?.toString() || "",
              source: row[getColumnIndex(["Nguồn CV", "Chức vụ", "Chuc vu", "Source"])]?.toString() || null,
              position: row[getColumnIndex(["Tên vị trí", "Ten vi tri", "Vị trí", "Vi tri", "Position"])]?.toString() || null,
              email: row[getColumnIndex(["Email", "E-mail", "Mail"])]?.toString() || null,
              birthdate: row[getColumnIndex(["Ngày sinh", "Ngay sinh", "Birth date", "DOB"])]?.toString() || null,
              gender: row[getColumnIndex(["Giới tính", "Gender"])]?.toString() || null,
              pipeline_status: row[getColumnIndex(["Tình trạng", "Pipeline status", "Status"])]?.toString() || "pending",
              fit_score: row[getColumnIndex(["Mức độ phù hợp", "Fit score"])] ? Number(row[getColumnIndex(["Mức độ phù hợp", "Fit score"])]) * 100 || null : null,
              experience: row[getColumnIndex(["Năm kinh nghiệm", "Experience"])]?.toString() || null,
              cv_link: row[getColumnIndex(["CV link", "CV"])]?.toString() || null,
              strengths: row[getColumnIndex(["Điểm phù hợp", "Strengths"])]?.toString() || null,
              weaknesses: row[getColumnIndex(["Điểm không phù hợp", "Weaknesses"])]?.toString() || null,
              skills: row[getColumnIndex(["Kỹ năng", "Skills"])]?.toString() || null,
              isNew: true,
            };

            if (!candidate.full_name) {
              console.warn(`Skipping row ${i}: Missing full_name`);
              continue;
            }

            if (candidate.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) {
              console.warn(`Skipping row ${i}: Invalid email format`);
              continue;
            }

            if (candidate.birthdate) {
              const parsedDate = new Date(candidate.birthdate);
              candidate.birthdate = isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
            }

            mappedData.push(candidate);
          }
        }

        if (mappedData.length === 0) {
          return;
        }
        console.log("Excel data data", mappedData)
        setExcelData(mappedData);
        setIsExcelPreviewOpen(true);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCandidate) {
      updateMutation.mutate({ ...selectedCandidate, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setFormData({
      full_name: candidate.full_name || "",
      email: candidate.email || "",
      birthdate: candidate.birthdate?.split('T')[0] || "",
      gender: candidate.gender || "",
      note: candidate.note || "",
      evaluation: candidate.evaluation || "",
      position: candidate.position || "",
      experience: candidate.experience || "",
      source: candidate.source || "",
      strengths: candidate.strengths || "",
      weaknesses: candidate.weaknesses || "",
      skills: candidate.skills || "",
      pipeline_status: candidate.pipeline_status || "pending",
      cv_link: candidate.cv_link || "",
      fit_score: candidate.fit_score || null,
    });
    setIsDrawerOpen(true);
  };

  const handleViewDetail = (candidate: Candidate) => {
    setViewingCandidate(candidate);
    setIsDetailDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa ứng viên này?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenCreateDrawer = () => {
    setSelectedCandidate(null);
    resetFormData();
    setIsDrawerOpen(true);
  };

  const handleViewCV = (cvLink: string) => {
    if (cvLink) {
      window.open(cvLink, '_blank');
    }
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

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'N/A';
  };

  // Filter data
  const filteredCandidates = candidates?.filter(candidate => {
    const matchesSearch = candidate.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.position?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.pipeline_status === statusFilter;
    const matchesPosition = positionFilter === 'all' || ((candidate as any).job?.title || candidate.position) === positionFilter;
    
    // Score filter logic
    let matchesScore = true;
    if (scoreFilter !== 'all') {
        const score = candidate.fit_score;
        switch (scoreFilter) {
            case 'high':
            matchesScore = score != null && score >= 80;
            break;
            case 'medium':
            matchesScore = score != null && score >= 60 && score < 80;
            break;
            case 'low':
            matchesScore = score != null && score < 60;
            break;
            case 'no-score':
            matchesScore = score == null || score === 0;
            break;
        }
    }
    
    return matchesSearch && matchesStatus && matchesPosition && matchesScore;
  }) || [];
  const totalPages = Math.ceil(filteredCandidates.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageCandidates = filteredCandidates.slice(startIndex, endIndex);

  // Check if all candidates are selected
  const isAllSelected = currentPageCandidates.length > 0 &&
    currentPageCandidates.every(candidate => selectedCandidateIds.includes(candidate.id));
  const isIndeterminate = selectedCandidateIds.some(id =>
    currentPageCandidates.some(candidate => candidate.id === id)
  ) && !isAllSelected;

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
  const getUniquePositions = () => {
    if (!candidates) return [];
    const positions = candidates
      .map(candidate => (candidate as any).job?.title || candidate.position)
      .filter((position, index, array) => position && array.indexOf(position) === index)
      .sort();
    return positions;
  };

  // 4. Thêm handler cho position filter
  const handlePositionFilterChange = (value: string) => {
    setPositionFilter(value);
    setCurrentPage(1);
    setSelectedCandidateIds([]);
  };

  // Handler cho score filter
  const handleScoreFilterChange = (value: string) => {
    setScoreFilter(value);
    setCurrentPage(1);
    setSelectedCandidateIds([]);
  };
  console.log("filteredCandidates",filteredCandidates)
  const hasRejectReason = filteredCandidates.some(
    candidate => candidate.reject_reason && candidate.reject_reason.trim() !== ''
  );
  console.log("dsaddads",hasRejectReason)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Ứng viên</h1>
              <p className="text-gray-600">
                Tổng cộng {filteredCandidates.length} ứng viên
                {selectedCandidateIds.length > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({selectedCandidateIds.length} được chọn)
                  </span>
                )}
                <span className="ml-2 text-gray-500">
                  • Trang {currentPage} / {totalPages || 1}
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {selectedCandidateIds.length > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 size={16} />
                  {bulkDeleteMutation.isPending ? 'Đang xóa...' : `Xóa ${selectedCandidateIds.length} ứng viên`}
                </Button>
              )}
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
              />
              <Button
                onClick={() => document.getElementById('excel-upload')?.click()}
                variant="outline"
                className="flex items-center gap-2 hover:bg-blue-50 border-blue-200"
              >
                <Upload size={16} />
                Import Excel
              </Button>
              <Button
                onClick={() => setIsUploadCVDrawerOpen(true)}
                variant="outline"
                className="flex items-center gap-2 hover:bg-green-50 border-green-200 text-green-700"
              >
                <Upload size={16} />
                Upload CV
              </Button>
              <Button
                onClick={handleOpenCreateDrawer}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus size={16} />
                Thêm Ứng viên
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Tìm kiếm theo tên, email, vị trí..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              {/* Status Filter */}
                <div className="relative min-w-[160px]">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} />
                    <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                        <SelectTrigger className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-blue-200 bg-white text-sm">
                        <SelectValue placeholder="Tất cả trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="pending">Chờ xử lý</SelectItem>
                        <SelectItem value="interview">Phỏng vấn</SelectItem>
                        <SelectItem value="hired">Đã tuyển</SelectItem>
                        <SelectItem value="rejected">Từ chối</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Position Filter */}
                <div className="relative w-[170px]">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} />

                    <Select value={positionFilter} onValueChange={handlePositionFilterChange}>
                        <SelectTrigger className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-blue-200 bg-white text-sm">
                        <SelectValue placeholder="Tất cả vị trí" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">Tất cả vị trí</SelectItem>
                        {getUniquePositions().map((position) => (
                            <SelectItem key={position} value={position}>
                            {position}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Score Filter */}
                <div className="relative w-[170px]">
                    <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} />

                    <Select value={scoreFilter} onValueChange={handleScoreFilterChange}>
                        <SelectTrigger className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-blue-200 bg-white text-sm">
                        <SelectValue placeholder="Tất cả điểm" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">Tất cả điểm</SelectItem>
                        <SelectItem value="high">Cao (≥80)</SelectItem>
                        <SelectItem value="medium">Trung bình (60-79)</SelectItem>
                        <SelectItem value="low">Thấp (0-59)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Score Filter */}
                <div className="relative w-[170px]">
                    <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} />

                    <Select value={scoreFilter} onValueChange={handleScoreFilterChange}>
                        <SelectTrigger className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-blue-200 bg-white text-sm">
                        <SelectValue placeholder="Tất cả điểm" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">Tất cả điểm</SelectItem>
                        <SelectItem value="high">Cao (≥80)</SelectItem>
                        <SelectItem value="medium">Trung bình (60-79)</SelectItem>
                        <SelectItem value="low">Thấp (&lt;60)</SelectItem>
                        <SelectItem value="no-score">Chưa có điểm</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Page Size Selector */}
                <div className="flex items-center gap-2 min-w-[120px]">
                    <span className="text-sm text-gray-600 whitespace-nowrap">Hiển thị:</span>

                    <Select value={String(pageSize)} onValueChange={(val:any) => handlePageSizeChange(Number(val))}>
                        <SelectTrigger className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-blue-200 bg-white text-sm">
                        <SelectValue placeholder="Chọn số lượng" />
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
          </div>

          {/* Active Filters Display */}
          {(statusFilter !== 'all' || positionFilter !== 'all' || scoreFilter !== 'all' || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Bộ lọc đang áp dụng:</span>

              {searchQuery && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Tìm kiếm: {searchQuery}
                  <button
                    onClick={() => handleSearchChange('')}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {statusFilter !== 'all' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Trạng thái: {statusFilter === 'pending' && 'Chờ xử lý'}
                  {statusFilter === 'interview' && 'Phỏng vấn'}
                  {statusFilter === 'hired' && 'Đã tuyển'}
                  {statusFilter === 'rejected' && 'Từ chối'}
                  <button
                    onClick={() => handleStatusFilterChange('all')}
                    className="ml-2 text-green-500 hover:text-green-700"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {positionFilter !== 'all' && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Vị trí: {positionFilter}
                  <button
                    onClick={() => handlePositionFilterChange('all')}
                    className="ml-2 text-purple-500 hover:text-purple-700"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {scoreFilter !== 'all' && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Điểm: {scoreFilter === 'high' && 'Cao (≥80)'}
                  {scoreFilter === 'medium' && 'Trung bình (60-79)'}
                  {scoreFilter === 'low' && 'Thấp (<60)'}
                  {scoreFilter === 'no-score' && 'Chưa có điểm'}
                  <button
                    onClick={() => handleScoreFilterChange('all')}
                    className="ml-2 text-orange-500 hover:text-orange-700"
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
                  handleStatusFilterChange('all');
                  handlePositionFilterChange('all');
                  handleScoreFilterChange('all');
                }}
                className="text-gray-500 hover:text-gray-700 text-sm h-6 px-2"
              >
                Xóa tất cả
              </Button>
            </div>
          )}
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="sticky left-0 bg-blue-50 font-semibold text-gray-700 w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      className="border-gray-300"
                      {...(isIndeterminate && { 'data-state': 'indeterminate' })}
                    />
                  </TableHead>
                  <TableHead className="sticky left-8 bg-blue-50 font-semibold text-gray-700 w-[160px]">Ứng viên</TableHead>
                  <TableHead className="font-semibold text-gray-700 w-[160px]">Vị trí</TableHead>
                  <TableHead className="font-semibold text-gray-700 w-[160px]">Nguồn</TableHead>
                  <TableHead className="font-semibold text-gray-700 w-[160px]">Trạng thái</TableHead>
                  {hasRejectReason && (
                    <TableHead className="font-semibold text-gray-700 w-[160px]">Lý do từ chối</TableHead>
                  )}
                  <TableHead className="font-semibold text-gray-700 w-[160px]">Vòng phỏng vấn</TableHead>
                  <TableHead className="font-semibold text-gray-700 w-[160px]">Ghi chú</TableHead>
                  <TableHead className="font-semibold text-gray-700 w-[160px]">Hoạt động</TableHead>
                  <TableHead className="font-semibold text-gray-700 w-[160px]">Kỹ năng</TableHead>
                  <TableHead className="font-semibold text-gray-700 w-[160px]">Điểm mạnh</TableHead>
                  <TableHead className="font-semibold text-gray-700 w-[160px]">Điểm yếu</TableHead>
                  <TableHead className="font-semibold text-gray-700 w-[160px]">Đánh giá</TableHead>
                  <TableHead className="font-semibold text-gray-700 w-[160px]">Điểm phù hợp</TableHead>   
                  <TableHead className="font-semibold text-gray-700">CV</TableHead>
                  <TableHead className="sticky right-0 bg-blue-50 font-semibold text-gray-700 text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageCandidates.map((candidate) => (
                  <TableRow
                    key={candidate.id}
                    className={`hover:bg-blue-50/50 transition-colors duration-200 ${selectedCandidateIds.includes(candidate.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                  >
                    <TableCell className="sticky left-0 bg-white py-4 ">
                      <Checkbox
                        checked={selectedCandidateIds.includes(candidate.id)}
                        onCheckedChange={(checked:any) => handleSelectCandidate(candidate.id, checked as boolean)}
                        className="border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="sticky left-8 bg-white py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600">
                          <AvatarFallback className="text-white font-semibold">
                            {getInitials(candidate.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-gray-900">{candidate.full_name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail size={12} />
                            {candidate.email || 'Chưa có email'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-[160px]">
                        <Briefcase size={14} className="text-gray-400" />
                        <span className="font-medium">{(candidate as any).job?.title || candidate.position || '-'}</span>
                      </div>
                      {candidate.experience && (
                        <div className="text-xs text-gray-500 mt-1">
                          Kinh nghiệm: {candidate.experience}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className= "w-[160px]">
                      <Badge variant="outline" className="bg-gray-50 rounded-[4px]">
                        {candidate.source || 'Chưa xác định'}
                      </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-[160px]">
                        <Badge className={getStatusBadgeColor(candidate.pipeline_status || 'pending')}>
                          {candidate.pipeline_status === 'pending' && 'Chờ xử lý'}
                          {candidate.pipeline_status === 'interviewing' && 'Interview'}
                          {candidate.pipeline_status === 'testing' && 'Test'}
                          {candidate.pipeline_status === 'tested' && 'Tested'}
                          {candidate.pipeline_status === 'reject' && 'Từ chối'}
                          {candidate.pipeline_status === 'accepted_assessment' && 'Interviewed'}
                          {!candidate.pipeline_status && 'Chờ xử lý'}
                        </Badge>
                      </div>
                    </TableCell>
                    {hasRejectReason && (
                      <TableCell>
                        <div className="w-[160px]">
                        {candidate.pipeline_status === 'reject' && candidate.reject_reason ? (
                          <div className="flex items-center gap-2 text-red-600 w-[160px]">
                            <AlertCircle size={14} />
                            <span className="text-sm">{candidate.reject_reason}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="w-[160px]">
                      <Badge className={getStatusBadgeColor(candidate.pipeline_status || 'pending')}>
                        {/* {candidate.pipeline_status === 'pending' && candidate.stage_name}

                        {(candidate.pipeline_status === 'interviewing' || candidate.pipeline_status === 'testing' || candidate.pipeline_status === 'tested') && 'Assessment'}
                        {!candidate.pipeline_status && candidate.stage_name} */}
                        {candidate.stage_name}
                      </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-[160px]">
                      {candidate.note ? (
                        <div className="flex items-center gap-2 w-[160px]">
                          <span className="text-gray-600">{candidate.note}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-[160px]">
                      {candidate.activity_name ? (
                        <div className="w-[160px]">
                          <div className="font-medium text-gray-900">{candidate.activity_name}</div>
                          {candidate.activity_note && (
                            <div className="text-sm text-gray-500">{candidate.activity_note}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Chưa có hoạt động</span>
                      )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-[160px]">
                      {candidate.skills ? (
                        <div className="flex items-center gap-2 ">
                          <span className="text-gray-600 line-clamp-2">{candidate.skills}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-[160px]">
                      {candidate.strengths ? (
                        <div className="flex items-center gap-2 ">
                          <span className="text-gray-600 line-clamp-2">{candidate.strengths}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-[160px]">
                      {candidate.weaknesses ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 line-clamp-2">{candidate.weaknesses}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-[160px]">
                      {candidate.evaluation ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 line-clamp-2">{candidate.evaluation}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-[160px]">
                      {candidate.fit_score ? (
                        <div className="flex items-center gap-2">
                          <Star size={14} className="text-yellow-500" />
                          <span className="font-semibold text-gray-900">{candidate.fit_score}%</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {candidate.cv_link ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewCV(candidate.cv_link!)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 h-auto"
                        >
                          <ExternalLink size={14} />
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">Chưa có</span>
                      )}
                    </TableCell>
                    <TableCell className="sticky right-0 bg-white">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetail(candidate)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 h-auto"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(candidate)}
                          className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1 h-auto"
                        >
                          <Edit3 size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(candidate.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 h-auto"
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
          {currentPageCandidates.length === 0 && filteredCandidates.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có ứng viên nào</h3>
              <p className="text-gray-500">Thêm ứng viên mới hoặc thử thay đổi bộ lọc tìm kiếm</p>
            </div>
          )}

          {currentPageCandidates.length === 0 && filteredCandidates.length > 0 && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có ứng viên nào trong trang này</h3>
              <p className="text-gray-500">Thử chuyển về trang đầu hoặc thay đổi bộ lọc</p>
              <Button
                onClick={goToFirstPage}
                variant="outline"
                className="mt-4"
              >
                Về trang đầu
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white border-t px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredCandidates.length)} của {filteredCandidates.length} ứng viên
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="p-2"
                  >
                    <ChevronsLeft size={16} />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="p-2"
                  >
                    <ChevronLeft size={16} />
                  </Button>

                  <div className="flex items-center gap-1">
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
                          className={`min-w-[36px] ${currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-blue-50'
                            }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2"
                  >
                    <ChevronRight size={16} />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="p-2"
                  >
                    <ChevronsRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
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
                  Bạn có chắc chắn muốn xóa <span className="font-semibold text-red-600">{selectedCandidateIds.length} ứng viên</span> đã chọn?
                </p>
                <p className="text-sm text-gray-500">
                  Hành động này không thể hoàn tác. Tất cả thông tin liên quan đến các ứng viên này sẽ bị xóa vĩnh viễn.
                </p>

                {/* Show selected candidates names */}
                <div className="mt-4 max-h-32 overflow-y-auto bg-gray-50 rounded-md p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Ứng viên sẽ bị xóa:</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {candidates
                      ?.filter(candidate => selectedCandidateIds.includes(candidate.id))
                      .map(candidate => (
                        <li key={candidate.id} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></span>
                          {candidate.full_name}
                          {candidate.position && (
                            <span className="text-gray-400">- {candidate.position}</span>
                          )}
                        </li>
                      ))
                    }
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={bulkDeleteMutation.isPending}
                  className="px-6"
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="px-6 bg-red-600 hover:bg-red-700"
                >
                  {bulkDeleteMutation.isPending ? (
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

        {/* Drawer Components */}
        <CandidateDetailDrawer
          isOpen={isDetailDrawerOpen}
          onOpenChange={setIsDetailDrawerOpen}
          candidate={viewingCandidate}
          onEdit={handleEdit}
          onViewCV={handleViewCV}
        />

        <ExcelPreviewDrawer
          isOpen={isExcelPreviewOpen}
          onOpenChange={setIsExcelPreviewOpen}
          excelData={excelData}
          onExcelDataChange={setExcelData}
          onSave={createMultipleMutation.mutate}
          isSaving={createMultipleMutation.isPending}
        />

        <CandidateFormDialog
          isOpen={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          selectedCandidate={selectedCandidate}
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