import { Badge } from "@/app/frontend/components/ui/badge";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Activity as ActivityIcon,
  Loader2,
  Calendar,
  Link,
  MapPin,
  CalendarDays,
  CheckCircle,
  CheckSquare,
  RefreshCw,
  Eye,
  Edit,
  Trophy,
  XCircle,
  Clock as PendingIcon,
  Monitor,
} from "lucide-react";
import { Button } from "@/app/frontend/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/frontend/components/ui/select";
import activityService from "../services/activityService";
import { toast } from "sonner";

// Import ActivityDrawer để tái sử dụng
import ActivityDrawer from "../pipeline/activitydrawer";

// Types cho exam detail
type CauHoi = {
  id: number;
  noiDung: string;
  dapAn: string;
  dapAnDung: string;
  type: "text" | "multiple-choice" | "file" | "grid";
  file?: string;
  options?: string[];
};

type ExamDetail = {
  id: string;
  idexam: string;
  idNV: string;
  hoTen: string;
  email: string | null;
  phongBan: string | null;
  diemSo: number | null;
  soCauDung: number;
  noiDungBaiThi: CauHoi[];
  ngayThi: string;
  ngayNop: string;
  tenDeThi: string;
  ngayBatDauThi: string | null;
  checktudongtinhDiem: boolean;
  solanthi: number;
  reportCauHoi: string[];
};

// Interface theo backend API response
interface ActivityCandidate {
  candidate_name: string;
  candidate_id: string;
  candidate_email?: string; // Thêm email field
  stage_name: string;
  start_date: string;
  end_date: string;
  status: "in_progress" | "completed" | "cancelled";
  result?: string; // Thêm result field
  candidate_activity_id: string; // Thêm candidate_activity_id
  noteresult?: string; // Thêm noteresult field từ candidate_activity
  assignee: string;
  interview_date: string | null;
  interview_link: string | null;
  interview_location: string | null;
  interview_id: string | null;
  interview_confirmed: boolean;
  interview_type: string | null; // Thêm interview_type field
}

interface ActivityItem {
  id?: string;
  name: string;
  description: string;
  type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  exam_id?: string;
  participants?: string[];
  exam?: {
    id: string;
    title: string;
    code?: string;
    duration?: number;
    questionCount?: number;
    startDate?: string;
    endDate?: string;
    settings?: any;
  };
  exam_result?: {
    id: string;
    nhanVienId: string;
    idexam: string;
    diem?: number;
    soCauDung?: number;
    ngayVaoThi?: string;
    ngaynop?: string;
    solanthi?: number;
  };
  candidates: ActivityCandidate[];
}

interface ActivityResponse {
  success: boolean;
  data: ActivityItem[];
}

interface ActivityTabCandidateProps {
  candidateId: string;
}

export default function ActivityTabCandidate({
  candidateId,
}: ActivityTabCandidateProps) {
  // States cho exam detail modal
  const [selectedExamDetail, setSelectedExamDetail] =
    useState<ExamDetail | null>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  // States cho chấm điểm
  const [diemCauHoi, setDiemCauHoi] = useState<{ [key: number]: number }>({});
  const [tickCauHoi, setTickCauHoi] = useState<{
    [key: number]: "dung" | "sai" | null;
  }>({});
  const [chamDiemMode, setChamDiemMode] = useState<"tick" | "manual">("manual");
  const [isEditing, setIsEditing] = useState(false);

  // States cho edit noteresult
  const [editingNoteResult, setEditingNoteResult] = useState<{
    candidateActivityId: string;
    value: string;
  } | null>(null);

  // States cho ActivityDrawer edit modal
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedActivityForEdit, setSelectedActivityForEdit] =
    useState<ActivityItem | null>(null);

  const queryClient = useQueryClient();

  // Mutations for grading
  const saveExamMutation = useMutation({
    mutationFn: async (examData: {
      idexam: string;
      email: string;
      hoTen: string;
      phongBan: string;
      diem: number;
      soCauDung: number;
      cauHoi: any[];
      ngayNop: string;
    }) => {
      const response = await fetch("/examhr/api/saveexam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Lỗi khi cập nhật bài thi");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["candidate-activities", candidateId],
      });
      toast.success(
        "Cập nhật điểm thành công! Vui lòng làm mới trang để xem kết quả.",
        {
          duration: 5000,
          dismissible: true,
        }
      );
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi cập nhật điểm: ${error.message}`, {
        duration: 3000,
        dismissible: true,
      });
    },
  });

  const sendCertificateMutation = useMutation({
    mutationFn: async (certificateData: {
      email: string;
      recipientName: string;
      score: number;
      examId: string;
      title: string;
    }) => {
      const response = await fetch("/api/sendcertificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(certificateData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Lỗi khi gửi chứng nhận");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Gửi chứng nhận thành công!", {
        duration: 3000,
        dismissible: true,
      });
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi gửi chứng nhận: ${error.message}`, {
        duration: 3000,
        dismissible: true,
      });
    },
  });

  // Mutation for updating activity
  const updateActivityMutation = useMutation({
    mutationFn: async (activityData: {
      id: string;
      name: string;
      description: string;
      // note?: string; // TODO: Enable sau khi chạy migration
      type: string;
      participants: string[];
      interview_date?: string;
      interview_link?: string;
      interview_location?: string;
      interview_confirmed?: boolean;
      updated_by?: string; // Thêm updated_by field
    }) => {
      const response = await fetch("/hiring-management/api/activities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...activityData,
          updated_by: activityData.updated_by || "current-user", // Đảm bảo có updated_by
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Lỗi khi cập nhật hoạt động");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["candidate-activities", candidateId],
      });
      toast.success("Cập nhật hoạt động thành công!", {
        duration: 3000,
        dismissible: true,
      });
      closeEditModal();
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi cập nhật hoạt động: ${error.message}`, {
        duration: 3000,
        dismissible: true,
      });
    },
  });

  // Mutation for updating activity result
  const updateActivityResultMutation = useMutation({
    mutationFn: async (resultData: {
      candidate_activity_id: string;
      result: "pending" | "pass" | "fail";
    }) => {
      const response = await fetch("/hiring-management/api/activities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_activity_id: resultData.candidate_activity_id,
          result: resultData.result,
          updated_by: "current-user", // You might want to get from auth
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Lỗi khi cập nhật kết quả hoạt động"
        );
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["candidate-activities", candidateId],
      });
      toast.success("Cập nhật kết quả thành công!", {
        duration: 3000,
        dismissible: true,
      });
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi cập nhật kết quả: ${error.message}`, {
        duration: 3000,
        dismissible: true,
      });
    },
  });

  // Mutation for updating candidate activity status
  const updateActivityStatusMutation = useMutation({
    mutationFn: async (statusData: {
      candidate_activity_id: string;
      status: "in_progress" | "completed" | "cancelled";
    }) => {
      const response = await fetch("/hiring-management/api/activities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_activity_id: statusData.candidate_activity_id,
          status: statusData.status,
          updated_by: "current-user", // You might want to get from auth
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Lỗi khi cập nhật trạng thái hoạt động"
        );
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["candidate-activities", candidateId],
      });
      toast.success("Cập nhật trạng thái thành công!", {
        duration: 3000,
        dismissible: true,
      });
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi cập nhật trạng thái: ${error.message}`, {
        duration: 3000,
        dismissible: true,
      });
    },
  });

  // Mutation for updating noteresult
  const updateNoteResultMutation = useMutation({
    mutationFn: async (noteData: {
      candidate_activity_id: string;
      noteresult: string;
    }) => {
      const response = await fetch("/hiring-management/api/activities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_activity_id: noteData.candidate_activity_id,
          noteresult: noteData.noteresult,
          updated_by: "current-user", // You might want to get from auth
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Lỗi khi cập nhật ghi chú");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["candidate-activities", candidateId],
      });
      toast.success("Cập nhật ghi chú thành công!", {
        duration: 3000,
        dismissible: true,
      });
      setEditingNoteResult(null); // Reset editing state
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi cập nhật ghi chú: ${error.message}`, {
        duration: 3000,
        dismissible: true,
      });
    },
  });
  const {
    data: activityResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["candidate-activities", candidateId],
    queryFn: async (): Promise<ActivityResponse> => {
      const response = await fetch(
        `/hiring-management/api/activities?candidate_id=${candidateId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }
      return response.json();
    },
    enabled: !!candidateId,
    refetchInterval: 30000, // Auto refresh mỗi 30 giây
    refetchOnWindowFocus: true,
  });

  const activities = activityResponse?.data || [];

  // Fetch users để map assignee id sang tên
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      return await activityService.user.getUsers();
    },
  });

  // Fetch thông tin candidate được chọn từ activities data
  const getSelectedCandidateInfo = () => {
    if (activities.length > 0) {
      // Tìm candidate info từ activities đầu tiên có candidate này
      const candidateFromActivity = activities.find(activity => 
        activity.candidates?.some(c => c.candidate_id === candidateId)
      )?.candidates?.find(c => c.candidate_id === candidateId);
      
      if (candidateFromActivity) {
        return {
          id: candidateId,
          full_name: candidateFromActivity.candidate_name || "Current Candidate",
          email: candidateFromActivity.candidate_email || "", // Có thể lấy từ nơi khác nếu có
        };
      }
    }
    
    return {
      id: candidateId,
      full_name: "Current Candidate",
      email: "",
    };
  };

  const selectedCandidateInfo = getSelectedCandidateInfo();

  // Tạo map từ user id sang tên
  const userNameMap:any = users.reduce(
    (map, user) => ({ ...map, [user.id]: user.name }),
    {}
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4 text-blue-600" />;
      case "email":
        return <Mail className="h-4 w-4 text-green-600" />;
      case "interview":
        return <User className="h-4 w-4 text-purple-600" />;
      case "test":
        return <FileText className="h-4 w-4 text-orange-600" />;
      case "task":
        return <CheckSquare className="h-4 w-4 text-indigo-600" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityTypeName = (type: string) => {
    switch (type) {
      case "call":
        return "Call";
      case "email":
        return "Email";
      case "interview":
        return "Interview";
      case "test":
        return "Test";
      case "task":
        return "Task";
      default:
        return type;
    }
  };

  const getStatusBadge = (
    status: "in_progress" | "completed" | "cancelled"
  ) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 text-xs">
            Hoàn thành
          </Badge>
        );
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 text-xs">Hủy</Badge>;
      case "in_progress":
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
            Đang thực hiện
          </Badge>
        );
    }
  };

  const getResultBadge = (result?: string) => {
    switch (result) {
      case "pass":
        return (
          <Badge className="bg-green-100 text-green-800 text-xs flex items-center gap-1">
            <Trophy className="h-3 w-3" /> Đậu
          </Badge>
        );
      case "fail":
        return (
          <Badge className="bg-red-100 text-red-800 text-xs flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Rớt
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 text-xs flex items-center gap-1">
            <PendingIcon className="h-3 w-3" /> Đang chờ
          </Badge>
        );
    }
  };

  const handleUpdateActivityResult = (
    candidateActivityId: string,
    result: "pending" | "pass" | "fail"
  ) => {
    updateActivityResultMutation.mutate({
      candidate_activity_id: candidateActivityId,
      result,
    });
  };

  const handleToggleActivityStatus = (
    candidateActivityId: string,
    newStatus: "in_progress" | "completed" | "cancelled"
  ) => {
    updateActivityStatusMutation.mutate({
      candidate_activity_id: candidateActivityId,
      status: newStatus,
    });
  };

  const handleEditNoteResult = (
    candidateActivityId: string,
    currentValue: string
  ) => {
    setEditingNoteResult({ candidateActivityId, value: currentValue || "" });
  };

  const handleSaveNoteResult = () => {
    if (!editingNoteResult) return;

    updateNoteResultMutation.mutate({
      candidate_activity_id: editingNoteResult.candidateActivityId,
      noteresult: editingNoteResult.value,
    });
  };

  const handleCancelNoteResultEdit = () => {
    setEditingNoteResult(null);
  };

  const getFileNameFromUrl = (url: string | undefined) => {
    if (!url) return "Không có file";
    const parts = url.split("/");
    return parts[parts.length - 1] || "Không có file";
  };

  const calculateTongDiem = () => {
    if (!selectedExamDetail) return 0;
    if (chamDiemMode === "tick") {
      const soCau = selectedExamDetail.noiDungBaiThi.length;
      const diemMoiCau = soCau > 0 ? 10 / soCau : 0;
      const soCauDung = Object.values(tickCauHoi).filter(
        (tick) => tick === "dung"
      ).length;
      return (soCauDung * diemMoiCau).toFixed(2);
    }
    return Object.values(diemCauHoi)
      .reduce((sum, diem) => sum + (diem || 0), 0)
      .toFixed(2);
  };

  const calculateSoCauDung = () => {
    if (!selectedExamDetail) return 0;
    if (chamDiemMode === "tick") {
      return Object.values(tickCauHoi).filter((tick) => tick === "dung").length;
    }
    return Object.values(diemCauHoi).filter((diem) => diem > 0).length;
  };

  const handleDiemCauHoiChange = (cauHoiId: number, diem: number) => {
    if (diem > 10 || diem < 0) {
      toast.error("Điểm mỗi câu phải từ 0 đến 10!", {
        duration: 3000,
        dismissible: true,
      });
      return;
    }
    setDiemCauHoi((prev) => ({ ...prev, [cauHoiId]: diem }));
  };

  const handleTickCauHoi = (cauHoiId: number, type: "dung" | "sai") => {
    setTickCauHoi((prev) => {
      const current = prev[cauHoiId];
      if (current === type) {
        return { ...prev, [cauHoiId]: null };
      }
      return { ...prev, [cauHoiId]: type };
    });
  };

  const calculateThoiGianLam = (ngayThi: string, ngayNop: string): string => {
    const start = new Date(ngayThi).getTime();
    const end = new Date(ngayNop).getTime();
    const diffInMinutes = (end - start) / 1000 / 60;
    return diffInMinutes.toFixed(2);
  };

  const handleOpenExamDetail = async (examId: string, candidateId: string) => {
    try {
      const response = await fetch(
        `/examhr/api/getbaithi?examId=${examId}&candidateId=${candidateId}`
      );
      if (!response.ok) throw new Error("Không thể tải chi tiết bài thi");
      const data = await response.json();
      setSelectedExamDetail(data);

      // Initialize grading states based on existing data
      const soCau = data.noiDungBaiThi.length;
      const diemMoiCau =
        soCau > 0 && data.diemSo ? data.diemSo / data.soCauDung : 0;

      const newDiemCauHoi: { [key: number]: number } = {};
      const newTickCauHoi: { [key: number]: "dung" | "sai" | null } = {};

      if (data.diemSo !== null && data.soCauDung > 0) {
        data.noiDungBaiThi.forEach((cauHoi: CauHoi) => {
          let isCorrect = false;
          if (cauHoi.type === "multiple-choice") {
            const selectedAnswers =
              cauHoi.dapAn?.split(",").map((s) => s.trim()) || [];
            const correctAnswers =
              cauHoi.dapAnDung?.split(",").map((s) => s.trim()) || [];
            isCorrect =
              selectedAnswers.length === correctAnswers.length &&
              selectedAnswers.every((ans) => correctAnswers.includes(ans)) &&
              correctAnswers.every((ans) => selectedAnswers.includes(ans));
          } else if (cauHoi.type === "text") {
            isCorrect = cauHoi.dapAn === cauHoi.dapAnDung;
          }

          newDiemCauHoi[cauHoi.id] = isCorrect
            ? Number(diemMoiCau.toFixed(2))
            : 0;
          newTickCauHoi[cauHoi.id] = isCorrect ? "dung" : "sai";
        });
      }

      setDiemCauHoi(newDiemCauHoi);
      setTickCauHoi(newTickCauHoi);
      setChamDiemMode("tick");
      setIsEditing(data.diemSo === null || data.diemSo === 0); // Chỉ edit nếu chưa có điểm
      setIsExamModalOpen(true);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết bài thi:", error);
    }
  };

  const handleSaveDiem = async () => {
    if (!selectedExamDetail) {
      toast.error("Không có bài thi được chọn!", {
        duration: 3000,
        dismissible: true,
      });
      return;
    }

    const tongDiem = Number(calculateTongDiem());
    const soCauDung = calculateSoCauDung();

    if (tongDiem < 0 || tongDiem > 100) {
      toast.error("Tổng điểm không hợp lệ (phải từ 0 đến 100)!", {
        duration: 3000,
        dismissible: true,
      });
      return;
    }

    try {
      await saveExamMutation.mutateAsync({
        idexam: selectedExamDetail.idexam,
        email: selectedExamDetail.email || "",
        hoTen: selectedExamDetail.hoTen,
        phongBan: selectedExamDetail.phongBan || "",
        diem: tongDiem,
        soCauDung: soCauDung,
        cauHoi: selectedExamDetail.noiDungBaiThi,
        ngayNop: selectedExamDetail.ngayNop,
      });

      if (selectedExamDetail.email) {
        await sendCertificateMutation.mutateAsync({
          email: selectedExamDetail.email,
          recipientName: selectedExamDetail.hoTen,
          score: tongDiem,
          examId: selectedExamDetail.idexam,
          title: selectedExamDetail.tenDeThi,
        });
      } else {
        toast.success(
          "Cập nhật điểm thành công, nhưng không có email để gửi chứng nhận!",
          {
            duration: 3000,
            dismissible: true,
          }
        );
      }

      closeExamModal();
    } catch (error: any) {
      // Lỗi được xử lý bởi onError của mutation
    }
  };

  const closeExamModal = () => {
    setIsExamModalOpen(false);
    setSelectedExamDetail(null);
    setDiemCauHoi({});
    setTickCauHoi({});
    setChamDiemMode("manual");
    setIsEditing(false);
  };

  const closeEditModal = () => {
    setIsEditDrawerOpen(false);
    setSelectedActivityForEdit(null);
  };

  const handleEditActivity = (activity: ActivityItem) => {
    setSelectedActivityForEdit(activity);
    setIsEditDrawerOpen(true);
  };

  const handleSaveActivity = () => {
    // ActivityDrawer sẽ handle save logic
    closeEditModal();
  };

  useEffect(() => {
    if (
      selectedExamDetail &&
      chamDiemMode === "tick" &&
      (isEditing ||
        selectedExamDetail.diemSo === null ||
        selectedExamDetail.diemSo === 0)
    ) {
      const soCau = selectedExamDetail.noiDungBaiThi.length;
      const diemMoiCau = soCau > 0 ? 10 / soCau : 0;
      const newDiemCauHoi: { [key: number]: number } = {};
      Object.entries(tickCauHoi).forEach(([cauHoiId, tick]) => {
        newDiemCauHoi[Number(cauHoiId)] =
          tick === "dung" ? Number(diemMoiCau.toFixed(2)) : 0;
      });
      setDiemCauHoi(newDiemCauHoi);
    }
  }, [selectedExamDetail, chamDiemMode, tickCauHoi, isEditing]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} tuần trước`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} tháng trước`;

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} năm trước`;
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Hoạt động của ứng viên</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-8 w-8 mr-2" />
              Có lỗi xảy ra khi tải dữ liệu
            </div>
          )}

          {!isLoading && !error && activities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ActivityIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Chưa có hoạt động nào</p>
            </div>
          )}

          {/* Flatten activities: hiển thị mỗi activity */}
          {!isLoading && !error && activities.length > 0 && (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Activity Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {activity.name}
                          </h4>
                          {activity.candidates?.length > 0 &&
                            (() => {
                              const { start_date, end_date } =
                                activity.candidates[0];
                              const hasStartDate =
                                start_date &&
                                new Date(start_date).getTime() > 0;
                              const hasEndDate =
                                end_date && new Date(end_date).getTime() > 0;

                              if (!hasStartDate && !hasEndDate) return null;

                              return (
                                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                                  {hasStartDate && (
                                    <div>
                                      {new Date(start_date).toLocaleString(
                                        "vi-VN"
                                      )}
                                    </div>
                                  )}
                                  {hasStartDate && hasEndDate && <span>-</span>}
                                  {hasEndDate && (
                                    <div>
                                      {new Date(end_date).toLocaleString(
                                        "vi-VN"
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          {activity.description && (
                            <div
                              className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-1 [&_p]:last:mb-0 [&_strong]:font-semibold [&_em]:italic"
                              dangerouslySetInnerHTML={{
                                __html: activity.description,
                              }}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            {getActivityTypeName(activity.type)}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditActivity(activity)}
                            className="h-6 w-6 p-0 bg-blue-50 hover:bg-blue-100"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Candidates - chỉ hiển thị candidate hiện tại */}
                  {activity.candidates && activity.candidates.length > 0 && (
                    <div className="ml-7 space-y-2 ">
                      {activity.candidates
                        .filter((cand) => cand.candidate_id === candidateId)
                        .map((candidate, cIndex) => (
                          <div
                            key={`candidate-${
                              candidate.candidate_id || cIndex
                            }`}
                            className="bg-gray-50 rounded-md p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 ">
                                  <span className="font-medium text-sm">
                                    {candidate.candidate_name}
                                  </span>
                                  <Select
                                    value={candidate.status}
                                    onValueChange={(value:any) =>
                                      handleToggleActivityStatus(
                                        candidate.candidate_activity_id,
                                        value as
                                          | "in_progress"
                                          | "completed"
                                          | "cancelled"
                                      )
                                    }
                                    disabled={
                                      updateActivityStatusMutation.isPending
                                    }
                                  >
                                    <SelectTrigger
                                      className={`h-6 text-xs px-2 w-37 border-0 ${
                                        candidate.status === "in_progress"
                                          ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                          : candidate.status === "completed"
                                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                                          : "bg-red-50 text-red-700 hover:bg-red-100"
                                      }`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-0 shadow-xl">
                                      <SelectItem
                                        value="in_progress"
                                        className="text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                      >
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3 text-yellow-600" />
                                          Đang thực hiện
                                        </div>
                                      </SelectItem>
                                      <SelectItem
                                        value="completed"
                                        className="text-xs bg-green-50 text-green-700 hover:bg-green-100"
                                      >
                                        <div className="flex items-center gap-1">
                                          <CheckCircle className="h-3 w-3 text-green-600" />
                                          Hoàn thành
                                        </div>
                                      </SelectItem>
                                      <SelectItem
                                        value="cancelled"
                                        className="text-xs bg-red-50 text-red-700 hover:bg-red-100"
                                      >
                                        <div className="flex items-center gap-1">
                                          <XCircle className="h-3 w-3 text-red-600" />
                                          Hủy
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Select
                                    value={candidate.result || "pending"}
                                    onValueChange={(value:any) =>
                                      handleUpdateActivityResult(
                                        candidate.candidate_activity_id,
                                        value as "pending" | "pass" | "fail"
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-5 w-32 text-xs border-gray-200">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-0 shadow-xl">
                                      <SelectItem
                                        value="pending"
                                        className="text-xs"
                                      >
                                        <div className="flex items-center gap-1">
                                          <PendingIcon className="h-3 w-3" />
                                          Đang chờ
                                        </div>
                                      </SelectItem>
                                      <SelectItem
                                        value="pass"
                                        className="text-xs"
                                      >
                                        <div className="flex items-center gap-1">
                                          <Trophy className="h-3 w-3" />
                                          Đậu
                                        </div>
                                      </SelectItem>
                                      <SelectItem
                                        value="fail"
                                        className="text-xs"
                                      >
                                        <div className="flex items-center gap-1">
                                          <XCircle className="h-3 w-3" />
                                          Rớt
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {candidate.stage_name && (
                                  <div className="text-xs text-gray-600">
                                    Stage: {candidate.stage_name}
                                  </div>
                                )}
                                {candidate.assignee && (
                                  <div className="text-xs text-gray-600">
                                    Người phụ trách:{" "}
                                    {userNameMap[candidate.assignee] ||
                                      candidate.assignee}
                                  </div>
                                )}
                                {activity.participants &&
                                  activity.participants.length > 0 && (
                                    <div className="text-xs text-gray-600">
                                      Người tham gia:{" "}
                                      {activity.participants
                                        .map((id) => userNameMap[id] || id)
                                        .join(", ")}
                                    </div>
                                  )}
                                {candidate.interview_date && (
                                  <div className="text-xs text-gray-600 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Phỏng vấn:{" "}
                                    {new Date(
                                      candidate.interview_date
                                    ).toLocaleString("vi-VN")}
                                  </div>
                                )}
                                {candidate.interview_link && (
                                  <div className="text-xs text-blue-600 flex items-center gap-1">
                                    <Link className="h-3 w-3" />
                                    <a
                                      href={candidate.interview_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      {candidate.interview_link}
                                    </a>
                                  </div>
                                )}
                                {candidate.interview_location && (
                                  <div className="text-xs text-gray-600 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    Địa điểm: {candidate.interview_location}
                                  </div>
                                )}
                                {/* Note Result Section - Editable */}
                                <div className="mt-2">
                                  {editingNoteResult?.candidateActivityId ===
                                  candidate.candidate_activity_id ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <strong className="text-gray-700 text-xs">
                                          Ghi chú:
                                        </strong>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleSaveNoteResult}
                                          disabled={
                                            updateNoteResultMutation.isPending
                                          }
                                          className="h-6 px-2 text-xs"
                                        >
                                          {updateNoteResultMutation.isPending ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            "Lưu"
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={handleCancelNoteResultEdit}
                                          className="h-6 px-2 text-xs text-gray-500"
                                        >
                                          Hủy
                                        </Button>
                                      </div>
                                      <textarea
                                        value={editingNoteResult.value}
                                        onChange={(e) =>
                                          setEditingNoteResult({
                                            ...editingNoteResult,
                                            value: e.target.value,
                                          })
                                        }
                                        placeholder="Nhập ghi chú cho ứng viên trong hoạt động này..."
                                        className="w-full p-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        rows={3}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-start gap-2">
                                      {candidate.noteresult ? (
                                        <div className="text-xs text-gray-600 flex-1">
                                          <strong className="text-gray-700">
                                            Ghi chú:
                                          </strong>{" "}
                                          {candidate.noteresult}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-gray-400 italic flex-1">
                                          Chưa có ghi chú
                                        </div>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleEditNoteResult(
                                            candidate.candidate_activity_id,
                                            candidate.noteresult || ""
                                          )
                                        }
                                        className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                                        title="Chỉnh sửa ghi chú"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Exam Section - Conditional display */}
                  {activity.type === "test" &&
                    activity.exam &&
                    (activity.exam_result ? (
                      /* Exam Result - chỉ hiển thị khi có kết quả thi */
                      <div className="ml-7 mt-2 border-t border-gray-100 pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">
                              Kết quả bài thi
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleOpenExamDetail(
                                activity.exam?.id || "",
                                candidateId
                              )
                            }
                            className="h-6 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Xem chi tiết
                          </Button>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          {activity.exam_result.diem !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Điểm số:</span>
                              <span className="text-green-600 font-semibold">
                                {activity.exam_result.diem.toFixed(1)}
                              </span>
                            </div>
                          )}
                          {activity.exam_result.soCauDung !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Câu đúng:</span>
                              <span>{activity.exam_result.soCauDung}</span>
                            </div>
                          )}
                          {activity.exam_result.solanthi !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Lần thi:</span>
                              <span>{activity.exam_result.solanthi}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Kết quả:</span>
                            <span
                              className={`font-semibold ${
                                activity.exam_result.diem !== undefined &&
                                activity.exam?.settings?.quydinhDiemThi !==
                                  undefined
                                  ? activity.exam_result.diem >=
                                    activity.exam.settings.quydinhDiemThi
                                    ? "text-green-600"
                                    : "text-red-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {activity.exam_result.diem !== undefined &&
                              activity.exam?.settings?.quydinhDiemThi !==
                                undefined
                                ? activity.exam_result.diem >=
                                  activity.exam.settings.quydinhDiemThi
                                  ? "Đậu"
                                  : "Rớt"
                                : "N/A"}
                            </span>
                          </div>
                          {activity.exam_result.ngayVaoThi && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Bắt đầu:{" "}
                                {new Date(
                                  activity.exam_result.ngayVaoThi
                                ).toLocaleString("vi-VN")}
                              </span>
                            </div>
                          )}
                          {activity.exam_result.ngaynop && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              <span>
                                Nộp bài:{" "}
                                {new Date(
                                  activity.exam_result.ngaynop
                                ).toLocaleString("vi-VN")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Exam Information - hiển thị khi chưa thi */
                      <div className="ml-7 mt-2 border-t border-gray-100 pt-2">
                        <div className="flex items-center gap-2 mb-2 text-orange-800">
                          <FileText className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">
                            Thông tin bài thi
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Tên đề:</span>
                            <span className="font-semibold">
                              {activity.exam.title}
                            </span>
                            {activity.exam.code && (
                              <Badge className="bg-orange-100 text-orange-800 text-xs ml-1">
                                {activity.exam.code}
                              </Badge>
                            )}
                          </div>
                          {activity.exam.duration && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              <span>
                                Thời gian: {activity.exam.duration} phút
                              </span>
                            </div>
                          )}
                          {activity.exam.questionCount && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-3 h-3" />
                              <span>Số câu: {activity.exam.questionCount}</span>
                            </div>
                          )}
                          {activity.exam.startDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Bắt đầu:{" "}
                                {new Date(
                                  activity.exam.startDate
                                ).toLocaleString("vi-VN")}
                              </span>
                            </div>
                          )}
                          {activity.exam.endDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Kết thúc:{" "}
                                {new Date(activity.exam.endDate).toLocaleString(
                                  "vi-VN"
                                )}
                              </span>
                            </div>
                          )}
                          {activity.exam.settings?.quydinhDiemThi && (
                            <div className="flex items-center gap-2">
                              <CheckSquare className="w-3 h-3 text-purple-600" />
                              <span className="text-purple-700 font-medium">
                                Điểm qua môn:{" "}
                                {activity.exam.settings.quydinhDiemThi}
                              </span>
                            </div>
                          )}
                          <div className="mt-2 p-2 bg-orange-50 rounded text-xs font-mono text-orange-600 break-all">
                            {`${
                              process.env.NEXT_PUBLIC_BASE_URL ||
                              window.location.origin
                            }/examhr/dethipublic/${activity.exam.id}`}
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* Activity Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(activity.created_at)}
                      </span>
                      {activity.created_by && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {userNameMap[activity.created_by] ||
                            activity.created_by}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exam Detail Modal */}
      {isExamModalOpen && selectedExamDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Chi tiết bài thi của {selectedExamDetail.hoTen}
            </h2>
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <p className="text-lg font-semibold text-gray-700">
                Tên đề thi: {selectedExamDetail.tenDeThi}
              </p>
              <p className="text-lg font-semibold text-gray-700">
                Số câu đúng (hiện tại): {selectedExamDetail.soCauDung || 0} /{" "}
                {selectedExamDetail.noiDungBaiThi.length}
              </p>
              <p className="text-lg font-semibold text-gray-700">
                Điểm số (hiện tại): {selectedExamDetail.diemSo ?? "Chưa chấm"}
              </p>
              <p className="text-lg font-semibold text-gray-700">
                Lần thi: {selectedExamDetail.solanthi}
              </p>
              <p className="text-lg font-semibold text-gray-700">
                Báo cáo:{" "}
                {selectedExamDetail.reportCauHoi.length > 0
                  ? `Có (${selectedExamDetail.reportCauHoi.length} câu)`
                  : "Không"}
              </p>
              <p className="text-lg font-semibold text-gray-700">
                Thời gian làm bài:{" "}
                {calculateThoiGianLam(
                  selectedExamDetail.ngayThi,
                  selectedExamDetail.ngayNop
                )}{" "}
                phút
              </p>
              {(isEditing || selectedExamDetail.diemSo === null) && (
                <div className="mt-4">
                  <label className="block text-lg font-semibold text-gray-700 mb-2">
                    Chế độ chấm điểm:
                  </label>
                  <select
                    value={chamDiemMode}
                    onChange={(e) =>
                      setChamDiemMode(e.target.value as "tick" | "manual")
                    }
                    className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Chọn chế độ chấm điểm"
                  >
                    <option value="manual">Nhập điểm thủ công</option>
                    <option value="tick">Tick đúng/sai</option>
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-6">
              {selectedExamDetail?.noiDungBaiThi.map((cauHoi, index) => (
                <div
                  key={index}
                  className={`border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
                    selectedExamDetail.reportCauHoi.includes(String(cauHoi.id))
                      ? "bg-yellow-100 border-yellow-300"
                      : "bg-white"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-lg text-gray-800">
                      Câu {index + 1}: {cauHoi.noiDung} ({cauHoi.type})
                    </p>
                    {selectedExamDetail.reportCauHoi.includes(
                      String(cauHoi.id)
                    ) && (
                      <span className="text-yellow-600 font-medium">
                        Đã báo cáo
                      </span>
                    )}
                  </div>
                  {cauHoi.type === "multiple-choice" && (
                    <>
                      <p className="mt-2">
                        Đáp án chọn:{" "}
                        <span
                          className={`font-medium ${
                            cauHoi.dapAn
                              ?.split(",")
                              .map((s) => s.trim())
                              .every((ans) =>
                                cauHoi.dapAnDung
                                  ?.split(",")
                                  .map((s) => s.trim())
                                  .includes(ans)
                              ) &&
                            cauHoi.dapAnDung
                              ?.split(",")
                              .map((s) => s.trim())
                              .every((ans) =>
                                cauHoi.dapAn
                                  ?.split(",")
                                  .map((s) => s.trim())
                                  .includes(ans)
                              )
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {cauHoi.dapAn || "Không có đáp án"}
                        </span>
                      </p>
                      <p>
                        Đáp án đúng:{" "}
                        <span className="font-medium text-green-600">
                          {cauHoi.dapAnDung || "Không có đáp án"}
                        </span>
                      </p>
                    </>
                  )}
                  {cauHoi.type === "file" && (
                    <>
                      <p className="mt-2">
                        File nộp:{" "}
                        <a
                          href={cauHoi.dapAn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {getFileNameFromUrl(cauHoi.file)}
                        </a>
                      </p>
                      <p>
                        Đáp án đúng:{" "}
                        <span className="font-medium text-green-600">
                          Được chấm thủ công
                        </span>
                      </p>
                    </>
                  )}
                  {cauHoi.type === "text" && (
                    <>
                      <p className="mt-2">
                        Đáp án chọn:{" "}
                        <span
                          className={`font-medium ${
                            cauHoi.dapAn === cauHoi.dapAnDung
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {cauHoi.dapAn || "Không có đáp án"}
                        </span>
                      </p>
                      <p>
                        Đáp án đúng:{" "}
                        <span className="font-medium text-green-600">
                          {cauHoi.dapAnDung || "Không có đáp án"}
                        </span>
                      </p>
                    </>
                  )}
                  {cauHoi.type === "grid" && (
                    <>
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-2"></th>
                              {(() => {
                                // Extract unique column options from answers
                                const allAnswers = [
                                  ...(cauHoi.dapAn
                                    ?.split(",")
                                    .map((s) => s.trim()) || []),
                                  ...(cauHoi.dapAnDung
                                    ?.split(",")
                                    .map((s) => s.trim()) || []),
                                ];
                                const columns = new Set<string>();
                                allAnswers.forEach((answer) => {
                                  const parts = answer.split("_");
                                  if (parts.length === 2) {
                                    columns.add(parts[1]);
                                  }
                                });
                                return Array.from(columns).map((col, idx) => (
                                  <th
                                    key={idx}
                                    className="border border-gray-300 p-2 text-center font-semibold"
                                  >
                                    {col}
                                  </th>
                                ));
                              })()}
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              // Extract unique row labels from answers
                              const allAnswers = [
                                ...(cauHoi.dapAn
                                  ?.split(",")
                                  .map((s) => s.trim()) || []),
                                ...(cauHoi.dapAnDung
                                  ?.split(",")
                                  .map((s) => s.trim()) || []),
                              ];
                              const rowsSet = new Set<string>();
                              allAnswers.forEach((answer) => {
                                const parts = answer.split("_");
                                if (parts.length === 2) {
                                  rowsSet.add(parts[0]);
                                }
                              });
                              const rows = Array.from(rowsSet).sort();

                              // Extract columns
                              const columnsSet = new Set<string>();
                              allAnswers.forEach((answer) => {
                                const parts = answer.split("_");
                                if (parts.length === 2) {
                                  columnsSet.add(parts[1]);
                                }
                              });
                              const columns = Array.from(columnsSet);

                              const selectedAnswers =
                                cauHoi.dapAn?.split(",").map((s) => s.trim()) ||
                                [];
                              const correctAnswers =
                                cauHoi.dapAnDung
                                  ?.split(",")
                                  .map((s) => s.trim()) || [];

                              return rows.map((row, rowIdx) => (
                                <tr key={rowIdx}>
                                  <td className="border border-gray-300 p-2 font-medium">
                                    {row}
                                  </td>
                                  {columns.map((col, colIdx) => {
                                    const cellKey = `${row}_${col}`;
                                    const isSelected =
                                      selectedAnswers.includes(cellKey);
                                    const isCorrect =
                                      correctAnswers.includes(cellKey);
                                    const bgColor = isCorrect
                                      ? "bg-green-100"
                                      : isSelected
                                      ? "bg-red-100"
                                      : "bg-white";

                                    return (
                                      <td
                                        key={colIdx}
                                        className={`border border-gray-300 p-2 text-center ${bgColor}`}
                                      >
                                        {isCorrect && isSelected ? (
                                          <span className="text-lg">✓✓</span>
                                        ) : isCorrect ? (
                                          <span className="text-lg">✓</span>
                                        ) : isSelected ? (
                                          <span className="text-lg">✗</span>
                                        ) : null}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 text-sm">
                        <p>
                          <span className="inline-block w-4 h-4 bg-green-100 border border-gray-300 mr-2">
                            ✓✓
                          </span>
                          Đáp án đúng đã chọn
                          <span className="inline-block w-4 h-4 bg-green-100 border border-gray-300 mr-2 ml-4">
                            ✓
                          </span>
                          Đáp án đúng chưa chọn
                          <span className="inline-block w-4 h-4 bg-red-100 border border-gray-300 mr-2 ml-4">
                            ✗
                          </span>
                          Đáp án sai đã chọn
                        </p>
                      </div>
                    </>
                  )}
                  {isEditing && (
                    <>
                      {chamDiemMode === "manual" ? (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Điểm câu {index + 1}:
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={diemCauHoi[cauHoi.id] || ""}
                            onChange={(e) =>
                              handleDiemCauHoiChange(
                                cauHoi.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="mt-1 border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập điểm (0-10)"
                          />
                        </div>
                      ) : (
                        <div className="mt-3 flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={tickCauHoi[cauHoi.id] === "dung"}
                              onChange={() =>
                                handleTickCauHoi(cauHoi.id, "dung")
                              }
                              className="mr-2"
                            />
                            Đúng
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={tickCauHoi[cauHoi.id] === "sai"}
                              onChange={() =>
                                handleTickCauHoi(cauHoi.id, "sai")
                              }
                              className="mr-2"
                            />
                            Sai
                          </label>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            {isEditing && (
              <div className="mt-8 bg-blue-50 p-4 rounded-lg">
                <p className="text-xl font-bold text-blue-800">
                  Tổng điểm: {Number(calculateTongDiem()).toFixed(2)}
                </p>
                <p className="text-xl font-bold text-blue-800">
                  Số câu đúng: {calculateSoCauDung()} /{" "}
                  {selectedExamDetail.noiDungBaiThi.length}
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-4 mt-6">
              {isEditing && (
                <button
                  onClick={handleSaveDiem}
                  className={`relative bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors ${
                    saveExamMutation.isPending ||
                    sendCertificateMutation.isPending
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={
                    saveExamMutation.isPending ||
                    sendCertificateMutation.isPending
                  }
                >
                  {saveExamMutation.isPending ||
                  sendCertificateMutation.isPending ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Đang lưu...
                    </span>
                  ) : (
                    "Lưu điểm"
                  )}
                </button>
              )}
              <button
                onClick={closeExamModal}
                className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Activity Modal */}
      {isEditDrawerOpen && selectedActivityForEdit && (
        <ActivityDrawer
          stageId={{ stageId: "default" }}
          stages={[]}
          onClose={closeEditModal}
          onCreateActivity={async (data: any) => {
            // Handle update logic for activity edit
            if (selectedActivityForEdit?.id) {
              await updateActivityMutation.mutateAsync({
                id: selectedActivityForEdit.id,
                name: data.name,
                description: data.description || "",
                // note: data.note || '', // TODO: Enable sau khi chạy migration
                type: data.type || selectedActivityForEdit.type,
                participants: data.participants || [],
                updated_by: "current-user", // Thêm updated_by
              });
              
              // Update activity_status và result nếu có thay đổi
              if (selectedActivityForEdit.candidates?.[0]?.candidate_activity_id) {
                try {
                  // Update noteresult
                  await activityService.activity.updateNoteResult(
                    selectedActivityForEdit.candidates[0].candidate_activity_id,
                    data.noteresult || ""
                  );
                  
                  // Update status nếu có thay đổi
                  if (data.activity_status && data.activity_status !== "none") {
                    await activityService.activity.updateCandidateActivityStatus(
                      selectedActivityForEdit.id,
                      candidateId,
                      data.activity_status
                    );
                  }
                  
                  // Update result nếu có thay đổi
                  if (data.result && data.result !== "none") {
                    await activityService.activity.updateActivityResult(
                      selectedActivityForEdit.candidates[0].candidate_activity_id,
                      data.result
                    );
                  }
                  
                  console.log("Successfully updated activity status and result");
                } catch (error) {
                  console.error("Failed to update activity status/result:", error);
                  throw error; // Re-throw to show error to user
                }
              }
            }
          }}
          fetchAllCandidates={async () => ({ data: [] })}
          selectedActivity={
            {
              id: selectedActivityForEdit.id,
              name: selectedActivityForEdit.name,
              description: selectedActivityForEdit.description,
              // note: selectedActivityForEdit.note || '', // TODO: Enable sau khi chạy migration
              type: selectedActivityForEdit.type,
              start_date: null,
              end_date: null,
              status: selectedActivityForEdit.candidates?.[0]?.status || true,
              assignee:
                selectedActivityForEdit.candidates?.[0]?.assignee ||
                selectedActivityForEdit.created_by,
              participants: selectedActivityForEdit.participants,
              candidates: selectedActivityForEdit.candidates?.map(c => ({
                candidate_id: c.candidate_id,
                candidate_activity_id: c.candidate_activity_id,
                noteresult: c.noteresult,
                status: c.status, // Thêm status của candidate_activity
                result: c.result, // Thêm result của candidate_activity
              })) || [],
              // Thêm thông tin interview hiện tại
              interview_date: selectedActivityForEdit.candidates?.[0]
                ?.interview_date
                ? new Date(selectedActivityForEdit.candidates[0].interview_date)
                    .toISOString()
                    .slice(0, 16)
                : "",
              interview_link:
                selectedActivityForEdit.candidates?.[0]?.interview_link || "",
              interview_location:
                selectedActivityForEdit.candidates?.[0]?.interview_location ||
                "",
              interview_confirmed:
                selectedActivityForEdit.candidates?.[0]?.interview_confirmed ||
                false,
              interview_type: selectedActivityForEdit.candidates?.[0]
                ?.interview_link
                ? "online"
                : selectedActivityForEdit.candidates?.[0]?.interview_location
                ? "offline"
                : "online",
              test_id:
                selectedActivityForEdit.exam_id ||
                selectedActivityForEdit.exam?.id ||
                "",
            } as any
          }
          selectedActionType={selectedActivityForEdit.type}
          selectedCandidate={{
            id: candidateId,
            full_name: selectedCandidateInfo.full_name,
            email: selectedCandidateInfo.email
          }}
        />
      )}
    </div>
  );
}
