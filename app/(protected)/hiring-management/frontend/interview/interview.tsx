"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/app/frontend/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/frontend/components/ui/table";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/app/frontend/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/frontend/components/ui/select";
import { Input } from "@/app/frontend/components/ui/input";
import { Label } from "@/app/frontend/components/ui/label";
import { Checkbox } from "@/app/frontend/components/ui/checkbox";
import { Badge } from "@/app/frontend/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/frontend/components/ui/card";
import { toast } from "sonner";
import {
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Users,
  FileText,
  X,
  Check,
  Mail,
  Search,
  Calendar,
  Clock,
  User,
  Filter,
  RefreshCw
} from "lucide-react";
import axios from "axios";
import { InterviewDetailsPanel } from "./interviewdetailepanel";
import { InterviewStatusModal } from "./interviewstautsmodal";
// Interfaces
interface Interview {
  id: string;
  link: string;
  ngayPhongVan?: string | null;
  ngay?: any;
  linkExam?: string;
  idcandidate: string;
  isActive?: boolean;
  createdOn?: string;
  createdById?: string;
  updatedById?: string;
  type: 'interview' | 'test';
  testResult: any;
  reject_reason?: string | null; // Add reject_reason to Interview interface
  linkInterview?: string | null;
  danhSachBaiThi?: any[];
  activityName?: string | null; // Thêm activityName
  candidateActivity?: CandidateActivity; // Thêm candidateActivity
}
interface CandidateActivity {
  id: string;
  start_date: Date;
  end_date: Date;
  status: boolean;
  note?: string | null;
  assignee: string;
  stage_id: string;
  candidate_id: string;
  task_id: string;
  updatedById?: string; // Add this property
}
interface Candidate {
  id: string;
  full_name: string;
  email?: string | null;
  position?: string | null;
  experience?: string | null;
  pipeline_status?: string | null;
  reject_reason?: string | null; // Ensure reject_reason is included in the Candidate interface
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  totalQuestions?: number;
  questionCount?: number;
  code?: string;
  idLessonFile?: string | null;
  settings?: {
    solanThi?: number;
    solanvipham?: number;
    quydinhDiemThi?: number;
  };
}

export default function InterviewPage() {
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedNhanVienIds, setSelectedNhanVienIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableSearchTerm, setTableSearchTerm] = useState("");
  const [sendEmailOnSubmit, setSendEmailOnSubmit] = useState(false);
  const [selectedInterviewIds, setSelectedInterviewIds] = useState<string[]>([]);
  const [interviewType, setInterviewType] = useState<'interview' | 'test'>('test');
  const [ngayPhongVan, setNgayPhongVan] = useState<string>("");
  const [linkInterview, setLinkInterview] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null); // Add state here
  const [interviewConfirmations, setInterviewConfirmations] = useState<{ [key: string]: boolean }>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [interviewStatus, setInterviewStatus] = useState<'pass' | 'fail' | ''>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [selectedActivityName, setSelectedActivityName] = useState<string>("all");
  // Hàm lấy userId từ localStorage
  const getUserId = (): string => {
    const state = localStorage.getItem("ai.platform");
    return state ? JSON.parse(state)?.state?.user?.id : "";
  };

  // Fetch Interviews
  // Fetch Interviews
  const fetchInterviews = async (): Promise<Interview[]> => {
    console.log("voooooooooo");
    const userId = getUserId();
    const response = await fetch("/hiring-management/api/interview", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-AI-Platform-UserId": userId,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch interviews");
    const interviewsData = await response.json();

    const baiThiResponse = await fetch("/exam/api/listbaithi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AI-Platform-UserId": userId,
      },
      body: JSON.stringify({}),
    });
    console.log("baiThiResponse", baiThiResponse);
    if (!baiThiResponse.ok) throw new Error("Failed to fetch test results");
    const baiThiData = await baiThiResponse.json();
    const danhSachBaiThi = baiThiData.data.filter((baiThi: any) => baiThi.type === "candidate");

    const nhanViensPromise = queryClient.getQueryData<Candidate[]>(["nhanviens"]);
    const nhanViens = await (nhanViensPromise || fetchCandidate());

    const interviews = interviewsData.data.map((interview: any) => {
      const candidate = nhanViens?.find((nv) => nv.id === interview.idcandidate);
      const candidateEmail = candidate?.email;
      const testResult = danhSachBaiThi.find((baiThi: any) =>
        candidateEmail && baiThi.email === candidateEmail
      );
      const relatedTests = danhSachBaiThi.filter((baiThi: any) =>
        candidateEmail && baiThi.email === candidateEmail && baiThi.type === "candidate"
      );
      return {
        ...interview,
        testResult: testResult ? { score: testResult.diemSo } : undefined,
        danhSachBaiThi: relatedTests,
        activityName: interview.activityName || null, // Lấy từ API nếu có
        candidateActivity: interview.candidateActivity || null, // Lấy từ API nếu có
      };
    });
    return interviews;
  };

  // Fetch Candidates with specific fields and filter out accepted_assessment
  const fetchCandidate = async (): Promise<Candidate[]> => {
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
    return result.data;
  };

  const updateCandidateStatus = async (candidateId: string, newStatus: string, rejectReason?: string | null) => {
    const userId = getUserId();
    const candidate = nhanViens?.find((nv) => nv.id === candidateId);
    if (candidate && (candidate.pipeline_status !== newStatus || candidate.reject_reason !== rejectReason)) {
      try {
        await axios.put(
          "/hiring-management/api/candidate",
          {
            ...candidate,
            pipeline_status: newStatus,
            reject_reason: rejectReason || null, // Include reject_reason in the update payload
            updatedById: userId,
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-AI-Platform-UserId": userId,
            },
          }
        );
      } catch (error) {
        console.error(`Failed to update candidate ${candidate.full_name}:`, error);
        toast.error(`Không thể cập nhật trạng thái ứng viên ${candidate.full_name}`, {
          duration: 3000,
          dismissible: true,
        });
      }
    }
  };
  const updateCandidateActivityMutation = useMutation({
    mutationFn: async (candidateActivityData: CandidateActivity) => {
      const userId = getUserId();
      const response = await fetch("/hiring-management/api/activities-candidate", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-AI-Platform-UserId": userId },
        body: JSON.stringify({
          ...candidateActivityData,
          updatedById: userId, // Use the defined userId
        }),
      });
      if (!response.ok) throw new Error("Failed to update candidate activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("Cập nhật trạng thái hoạt động thành công", {
        duration: 3000,
        dismissible: true,
      });
    },
    onError: (error) => {
      console.error("Update Candidate Activity error:", error);
      toast.error("Không thể cập nhật trạng thái hoạt động", {
        duration: 3000,
        dismissible: true,
      });
    },
  });
  // Fetch Exams
  const fetchExams = async (): Promise<Exam[]> => {
    const res = await fetch("/examhr/api/exams");
    const data = await res.json();
    return data.exams || [];
  };

  // Send Email
  const sendEmail = async ({
    link,
    email,
    hoTen,
    startDate,
    endDate,
    examInfo,
    type,
  }: {
    link: string;
    email: string;
    hoTen: string;
    startDate?: string;
    endDate?: string;
    examInfo?: {
      title: string;
      code?: string;
      duration?: number;
      questionCount?: number;
      solanThi?: number;
      solanvipham?: number;
      quydinhDiemThi?: number;
    };
    type: string;
  }): Promise<void> => {
    const userId = getUserId();
    const response = await fetch("/api/emailtemplate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AI-Platform-UserId": userId,
      },
      body: JSON.stringify({
        link,
        email,
        hoTen,
        startDate,
        endDate,
        examInfo,
        type,
      }),
    });
    if (!response.ok) throw new Error(`Failed to send email to ${email}`);
  };

  // Create Multiple Interviews
  const createMultipleInterviews = async (data: { link: string; candidateIds: string[], type: 'interview' | 'test', ngayPhongVan?: string, linkInterview?: string }): Promise<Interview[]> => {
    const userId = getUserId();
    const interviews = await Promise.all(
      data.candidateIds.map(async (idNV) => {
        const response = await fetch("/hiring-management/api/interview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-AI-Platform-UserId": userId,
          },
          body: JSON.stringify({
            link: data.link,
            idNV,
            createdById: userId,
            type: data.type,
            ngayPhongVan: data.ngayPhongVan,
            linkInterview: data.linkInterview,
          }),
        });
        if (!response.ok) throw new Error(`Failed to create interview for candidate ${idNV}`);
        const result = await response.json();
        return result.data;
      })
    );
    return interviews;
  };

  // Update Interview
  const updateInterview = async (data: Interview): Promise<Interview> => {
    console.log('data,data', data)
    const userId = getUserId();
    const response = await fetch("/hiring-management/api/interview", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-AI-Platform-UserId": userId,
      },
      body: JSON.stringify({
        ...data,
        updatedById: userId,
        reject_reason: data.reject_reason || null,
      }),
    });
    if (!response.ok) throw new Error("Failed to update interview");
    const result = await response.json();
    return result.data;
  };

  // Delete Interview
  const deleteInterview = async (id: string): Promise<void> => {
    const userId = getUserId();
    const response = await fetch("/hiring-management/api/interview", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-AI-Platform-UserId": userId,
      },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) throw new Error("Failed to delete interview");
  };

  // Queries
  const {
    data: interviews,
    isLoading: isLoadingInterviews,
    error: interviewsError,
  } = useQuery<Interview[]>({
    queryKey: ["interviews"],
    queryFn: fetchInterviews,
  });

  const {
    data: nhanViens,
    isLoading: isLoadingNhanViens,
  } = useQuery<Candidate[]>({
    queryKey: ["nhanviens"],
    queryFn: fetchCandidate,
  });
  const uniquePositions = Array.from(
    new Set(nhanViens?.map(nv => nv.position).filter((pos): pos is string => pos != null && pos.trim() !== "") || [])
  );
  const {
    data: exams,
    isLoading: isLoadingExams,
  } = useQuery<Exam[]>({
    queryKey: ["exams"],
    queryFn: fetchExams,
  });

  // Mutations
  const emailMutation = useMutation({
    mutationFn: sendEmail,
    onSuccess: (_, variables) => {
      toast.success(`Email đã được gửi tới ${variables.email}`, {
        duration: 3000,
        dismissible: true,
      });
    },
    onError: (error, variables) => {
      console.error("Send Email error:", error);
      toast.error(`Không thể gửi email tới ${variables.email}`, {
        duration: 3000,
        dismissible: true,
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: createMultipleInterviews,
    onSuccess: async (createdInterviews) => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      setIsDrawerOpen(false);
      resetForm();
      toast.success(`Đã tạo thành công ${createdInterviews.length} cuộc phỏng vấn`, {
        duration: 3000,
        dismissible: true,
      });

      for (const interview of createdInterviews) {
        const candidate = nhanViens?.find(nv => nv.id === interview.idcandidate);
        if (candidate) {
          const newPipelineStatus = getPipelineStatus(interview, candidate);
          await updateCandidateStatus(
            interview.idcandidate,
            newPipelineStatus,
            interview.reject_reason || null
          ).catch(error => {
            console.error(`Failed to update candidate ${candidate.full_name}:`, error);
            toast.error(`Không thể cập nhật trạng thái ứng viên ${candidate.full_name}`, {
              duration: 3000,
              dismissible: true,
            });
          });
        }

        if (sendEmailOnSubmit && candidate?.email) {
          const examId = interview.type === 'test' ? interview.linkExam?.split("/").pop() : undefined;
          const exam = examId ? exams?.find(e => e.id === examId) : undefined;

          const examInfo = exam ? {
            title: exam.title,
            code: exam.code,
            duration: exam.duration,
          } : undefined;
          await emailMutation.mutateAsync({
            link: interview.type === 'interview' ? (interview.linkInterview || interview.linkExam || interview.link) : (interview.linkExam || interview.link),
            email: candidate.email,
            hoTen: candidate.full_name,
            startDate: interview.ngay || (exam as any)?.startDate || null,
            endDate: (exam as any)?.endDate || null,
            examInfo: interview.type === 'test' ? examInfo : undefined,
            type: interview.type
          }).catch(error => {
            console.error(`Failed to send email to ${candidate.email}:`, error);
            toast.warning(`Không thể gửi email tới ${candidate.full_name}`, {
              duration: 3000,
              dismissible: true,
            });
          });
        } else if (sendEmailOnSubmit) {
          toast.warning(`Không tìm thấy email của ứng viên ${candidate?.full_name || 'Không xác định'}`, {
            duration: 3000,
            dismissible: true,
          });
        }
      }
    },
    onError: (error) => {
      console.error("Create Interview error:", error);
      toast.error("Không thể tạo cuộc phỏng vấn", { duration: 3000, dismissible: true });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateInterview,
    onSuccess: async (updatedInterview) => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      setIsDrawerOpen(false);
      setIsStatusModalOpen(false);
      setSelectedInterview(null);
      resetForm();
      toast.success("Cuộc phỏng vấn được cập nhật thành công", {
        duration: 3000,
        dismissible: true,
      });
  
      const candidate = nhanViens?.find(nv => nv.id === updatedInterview.idcandidate);
      if (candidate) {
        const newPipelineStatus = interviewStatus === 'pass' ? 'accepted_assessment' :
          interviewStatus === 'fail' ? 'reject' :
            updatedInterview.type === 'test' ?
              (updatedInterview.testResult != null ? 'tested' : 'testing') :
              'interviewing';
        console.log("rejectReason",rejectReason)
        await updateCandidateStatus(
          updatedInterview.idcandidate,
          newPipelineStatus, // Only update pipeline_status for candidate
          rejectReason
        ).catch(error => {
          console.error(`Failed to update candidate ${candidate.full_name}:`, error);
          toast.error(`Không thể cập nhật trạng thái ứng viên ${candidate.full_name}`, {
            duration: 3000,
            dismissible: true,
          });
        });
  
        // if (updatedInterview.candidateActivity) {
        //   await updateCandidateActivityMutation.mutateAsync({
        //     ...updatedInterview.candidateActivity,
        //     status: interviewStatus === 'pass' || interviewStatus === 'fail',
        //     updatedById: getUserId(),
        //   }).catch(error => {
        //     console.error(`Failed to update candidate activity for ${candidate.full_name}:`, error);
        //     toast.error(`Không thể cập nhật trạng thái hoạt động cho ${candidate.full_name}`, {
        //       duration: 3000,
        //       dismissible: true,
        //     });
        //   });
        // }
      }
  
      if (sendEmailOnSubmit && candidate?.email) {
        const examId = updatedInterview.type === 'test' ? updatedInterview.link.split("/").pop() : undefined;
        const exam = examId ? exams?.find(e => e.id === examId) : undefined;
  
        const examInfo = exam ? {
          title: exam.title,
          code: exam.code,
          duration: exam.duration,
          questionCount: exam.questionCount || exam.totalQuestions,
          solanThi: exam.settings?.solanThi,
          solanvipham: exam.settings?.solanvipham,
          quydinhDiemThi: exam.settings?.quydinhDiemThi,
        } : undefined;
  
        await emailMutation.mutateAsync({
          link: updatedInterview.type === 'interview' ? (updatedInterview.linkInterview || updatedInterview.link) : updatedInterview.link,
          email: candidate.email,
          hoTen: candidate.full_name,
          startDate: updatedInterview.ngayPhongVan || (exam as any)?.startDate || null,
          endDate: (exam as any)?.endDate || null,
          type: updatedInterview.type,
          examInfo: updatedInterview.type === 'test' ? examInfo : undefined,
        }).catch(error => {
          console.error(`Failed to send email to ${candidate.email}:`, error);
          toast.warning(`Không thể gửi email tới ${candidate.full_name}`, {
            duration: 3000,
            dismissible: true,
          });
        });
      } else if (sendEmailOnSubmit) {
        toast.warning(`Không tìm thấy email của ứng viên ${candidate?.full_name || 'Không xác định'}`, {
          duration: 3000,
          dismissible: true,
        });
      }
      setIsStatusModalOpen(false);
      setInterviewStatus('');
      setRejectReason('');
    },
    onError: (error) => {
      console.error("Update Interview error:", error);
      toast.error("Không thể cập nhật cuộc phỏng vấn", { duration: 3000, dismissible: true });
    },
  });
  const uniqueActivityNames = Array.from(
    new Set(interviews?.map(interview => interview.activityName).filter((name): name is string => name != null && name.trim() !== "") || [])
  );

  const deleteMutation = useMutation({
    mutationFn: deleteInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("Cuộc phỏng vấn đã được xóa thành công", {
        duration: 3000,
        dismissible: true,
      });
    },
    onError: (error) => {
      console.error("Delete Interview error:", error);
      toast.error("Không thể xóa cuộc phỏng vấn", { duration: 3000, dismissible: true });
    },
  });

  const resetForm = () => {
    setSelectedExamId("");
    setSelectedNhanVienIds([]);
    setSearchTerm("");
    setSendEmailOnSubmit(false);
    setInterviewType('test');
    setNgayPhongVan("");
    setLinkInterview("");
    setSelectedPosition("");
  };

  const handleCandidateToggle = (candidateId: string) => {
    setSelectedNhanVienIds(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNhanVienIds.length === filteredCandidates.length) {
      setSelectedNhanVienIds([]);
    } else {
      setSelectedNhanVienIds(filteredCandidates.map(nv => nv.id));
    }
  };

  const handleSelectAllInterviews = () => {
    if (selectedInterviewIds.length === filteredInterviews.length) {
      setSelectedInterviewIds([]);
    } else {
      setSelectedInterviewIds(filteredInterviews?.map(interview => interview.id) || []);
    }
  };

  const handleInterviewToggle = (interviewId: string) => {
    setSelectedInterviewIds(prev =>
      prev.includes(interviewId)
        ? prev.filter(id => id !== interviewId)
        : [...prev, interviewId]
    );
  };

  const handleSendEmails = async () => {
    if (selectedInterviewIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một cuộc phỏng vấn để gửi email");
      return;
    }

    for (const interviewId of selectedInterviewIds) {
      const interview = interviews?.find(i => i.id === interviewId);
      if (interview) {
        const candidate = nhanViens?.find(nv => nv.id === interview.idcandidate);
        if (candidate?.email) {
          const examId = interview.type === 'test' ? interview.link.split("/").pop() : undefined;
          const exam = examId ? exams?.find(e => e.id === examId) : undefined;

          const examInfo = exam ? {
            title: exam.title,
            code: exam.code,
            duration: exam.duration,
            questionCount: exam.questionCount || exam.totalQuestions,
            solanThi: exam.settings?.solanThi,
          } : undefined;

          await emailMutation.mutateAsync({
            link: interview.type === 'interview' ? (interview.linkInterview || interview.link) : interview.link,
            email: candidate.email,
            hoTen: candidate.full_name,
            startDate: interview.ngayPhongVan || (exam as any)?.startDate || null,
            endDate: (exam as any)?.endDate || null,
            examInfo: interview.type === 'test' ? examInfo : undefined,
            type: interview.type
          });
        } else {
          toast.warning(`Không tìm thấy email của ứng viên ${candidate?.full_name || 'Không xác định'}`, {
            duration: 3000,
            dismissible: true,
          });
        }
      }
    }
  };
  const getPipelineStatus = (interview: Interview, candidate: Candidate | undefined) => {
    if (interview.type === 'test') {
      return interview.testResult != null ? 'tested' : 'testing';
    } else if (interview.type === 'interview') {
      return candidate?.pipeline_status === 'accepted_assessment' ? 'interviewed' : 'interviewing';
    }
    return candidate?.pipeline_status || 'unknown';
  };
  const removeCandidateFromSelection = (candidateId: string) => {
    setSelectedNhanVienIds(prev => prev.filter(id => id !== candidateId));
  };

  const filteredCandidates = nhanViens?.filter(nv =>
    (nv.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nv.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nv.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nv.experience?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nv.pipeline_status?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedPosition === "" || nv.position === selectedPosition)
  ) || [];

  // Helper function to get exam by link
  const getExamByLink = (link: string) => {
    console.log("dasdada")
    const linkParts = link.split('/');
    const examId = linkParts[linkParts.length - 1];
    return exams?.find(e => e.id === examId);
  };

  // Filter interviews based on search term
  const filteredInterviews = interviews?.filter(interview => {
    const candidate = nhanViens?.find(nv => nv.id === interview.idcandidate);
    const exam = interview.type === 'test' ? getExamByLink(interview.link) : undefined;
    const statusMatch = statusFilter === "all" ||
      (statusFilter === "tested" && interview.type === 'test' && interview.testResult) ||
      (statusFilter === "testing" && interview.type === 'test' && !interview.testResult) ||
      (statusFilter === "interviewed" && interview.type === 'interview' && candidate?.pipeline_status === 'accepted_assessment') ||
      (statusFilter === "interviewing" && interview.type === 'interview' && candidate?.pipeline_status !== 'accepted_assessment') ||
      (statusFilter === "rejected" && candidate?.pipeline_status === 'rejected');
    const activityMatch = selectedActivityName === "all" || interview.activityName === selectedActivityName;

    return (
      (candidate?.full_name.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
        candidate?.email?.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
        (exam?.title?.toLowerCase().includes(tableSearchTerm.toLowerCase()) || false) ||
        interview?.link?.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
        (interview.linkInterview?.toLowerCase().includes(tableSearchTerm.toLowerCase()) || false) ||
        (interview.activityName?.toLowerCase().includes(tableSearchTerm.toLowerCase()) || false)) &&
      statusMatch &&
      activityMatch
    );
  }) || [];
  // Add this helper function to determine interview status
  // Modified getInterviewStatus function to display reject_reason for rejected status
  const getInterviewStatus = (interview: Interview, candidate: Candidate | undefined) => {
    console.log("candidate?.pipeline_status",candidate?.pipeline_status)
    if (candidate?.pipeline_status === 'reject' && interview.type === 'interview' && interview.reject_reason) {
      return (
        <div className="flex flex-col items-center gap-1">
          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 rounded-[4px]">
            Rejected
          </Badge>
          {interview.reject_reason && (
            <span className="text-xs text-gray-600 max-w-[200px] truncate" title={interview.reject_reason}>
              Lý do: {interview.reject_reason}
            </span>
          )}
        </div>
      );
    }
    if (interview.type === 'test') {
      if (interview.testResult) {
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-[4px]">
            Tested
          </Badge>
        );
      }
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-[4px]">
          Testing
        </Badge>
      );
    } else if (interview.type === 'interview') {
      console.log("vooooooooooooooo")
      if (candidate?.pipeline_status === 'accepted_assessment') {
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 rounded-[4px]">
            Interviewed
          </Badge>
        );
      }
      return (
        <Badge variant="default" className="bg-orange-100 text-orange-800 hover:bg-orange-200 rounded-[4px]">
          Interviewing
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-[4px]">
        Unknown
      </Badge>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (interviewType === "test" && !selectedExamId) {
      toast.error("Vui lòng chọn đề thi");
      return;
    }

    if (interviewType === "interview" && (!ngayPhongVan || !linkInterview)) {
      toast.error("Vui lòng nhập ngày phỏng vấn và link phỏng vấn");
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const interviewLink = interviewType === "test" ? `${baseUrl}/exam/dethipublic/${selectedExamId}` : linkInterview;

    if (selectedInterview) {
      if (selectedNhanVienIds.length !== 1) {
        toast.error("Vui lòng chọn một ứng viên");
        return;
      }
      if (interviewType === "interview") {
        setIsStatusModalOpen(true); // Open modal for interview status
      } else {
        updateMutation.mutate({
          ...selectedInterview,
          link: interviewLink,
          idcandidate: selectedNhanVienIds[0],
          type: interviewType,
          ngayPhongVan: null,
          linkInterview: null,
          reject_reason: null,
        });
      }
    } else {
      if (selectedNhanVienIds.length === 0) {
        toast.error("Vui lòng chọn ít nhất một ứng viên");
        return;
      }
      createMutation.mutate({
        link: interviewLink,
        candidateIds: selectedNhanVienIds,
        type: interviewType,
        ngayPhongVan: interviewType === "interview" ? ngayPhongVan : undefined,
        linkInterview: interviewType === "interview" ? linkInterview : undefined,
      });
    }
  };
  const handleStatusModalSubmit = () => {
    if (!selectedInterview) return;

    updateMutation.mutate({
      ...selectedInterview,
      link: linkInterview,
      idcandidate: selectedNhanVienIds[0],
      type: interviewType,
      ngayPhongVan: ngayPhongVan,
      linkInterview: linkInterview,
      reject_reason: interviewStatus === 'fail' ? rejectReason : null, // Store reject_reason in Interview
    });

    // Update candidate activity status to completed (true) when interview is evaluated
    if (selectedInterview.candidateActivity) {
      updateCandidateActivityMutation.mutate({
        ...selectedInterview.candidateActivity,
        status: true, // Set status to true when interview is evaluated (pass/fail)
        updatedById: getUserId(),
      });
    }
  };
  const isEditAllowed = (interview: Interview, candidate: Candidate | undefined) => {
    if (interview.type === 'test' && interview.testResult != null) {
      return false; // Disable edit for 'tested'
    }
    if (interview.type === 'interview' && candidate?.pipeline_status === 'accepted_assessment') {
      return false; // Disable edit for 'interviewed'
    }
    return true; // Allow edit for 'testing' or 'interviewing'
  };
  const handleEdit = (interview: Interview) => {
    const candidate = nhanViens?.find(nv => nv.id === interview.idcandidate);
    if (!isEditAllowed(interview, candidate)) {
      toast.error(`Không thể chỉnh sửa vì đã hoàn thành  ${interview.type}`);
      return;
    }
    setSelectedInterview(interview);
    setSelectedNhanVienIds([interview.idcandidate]);
    setInterviewType(interview.type);
    setNgayPhongVan(interview.ngayPhongVan || "");
    setLinkInterview(interview.linkInterview || "");
    if (interview.type === 'test') {
      const linkParts = interview.link.split('/');
      const examId = linkParts[linkParts.length - 1];
      if (exams?.some(exam => exam.id === examId)) {
        setSelectedExamId(examId);
      }
    }
    setSendEmailOnSubmit(false);
    setInterviewConfirmations((prev) => ({
      ...prev,
      [interview.id]: interview.type === "interview" && candidate?.pipeline_status === "interviewed",
    }));
    setIsDrawerOpen(true);
  };

  // const handleDelete = (id: string) => {
  //   if (confirm("Bạn có chắc chắn muốn xóa cuộc phỏng vấn này?")) {
  //     deleteMutation.mutate(id);
  //   }
  // };
  const handleDelete = (id: string, activityName: string) => {
    const confirmMsg = `Bạn có chắc chắn muốn xóa cuộc phỏng vấn "${activityName}" không?`;
    if (confirm(confirmMsg)) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenCreateDrawer = () => {
    setSelectedInterview(null);
    resetForm();
    setIsDrawerOpen(true);
  };

  const getNhanVienName = (idNV: string) => {
    console.log("dadaddsada", idNV)
    const nhanVien = nhanViens?.find(nv => nv.id === idNV);
    console.log("nhanVien",nhanVien)
    return nhanVien ? nhanVien.full_name : "Không xác định";
  };

  const getNhanVienEmail = (idNV: string) => {
    const nhanVien = nhanViens?.find(nv => nv.id === idNV);
    return nhanVien?.email || "Chưa có email";
  };

  const getExamTitle = (link: string) => {
    const linkParts = link.split('/');
    const examId = linkParts[linkParts.length - 1];
    const exam = exams?.find(e => e.id === examId);
    return exam ? exam.title : "Không xác định";
  };

  const handleOpenLink = (link: string) => {
    if (!link || link.trim() === '' || link.trim() === 'http:' || !link.startsWith('http')) {
      toast.error('Link không hợp lệ hoặc chưa được thiết lập');
      return;
    }
    try {
      window.open(link, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error('Không thể mở link. Vui lòng kiểm tra lại URL.');
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["interviews"] });
    queryClient.invalidateQueries({ queryKey: ["nhanviens"] });
    queryClient.invalidateQueries({ queryKey: ["exams"] });
    toast.success("Đã làm mới dữ liệu");
  };

  // Fetch users để map assignee id sang tên
const { data: users = [] } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data || [];
  },
});

// Tạo map từ user id sang tên
const userNameMap = users.reduce((acc: any, user: any) => {
  acc[user.id] = user.name;
  return acc;
}, {} as Record<string, string>);

  useEffect(() => {
    if (interviews && nhanViens) {
      interviews.forEach((interview) => {
        if (interview.type === "test" && (interview.testResult?.score !== undefined || interview.testResult)) {
          const candidate = nhanViens.find((nv) => nv.id === interview.idcandidate);
          if (candidate && candidate.pipeline_status !== "tested" ) {
            // updateCandidateStatus(interview.idcandidate, "tested");
            if (interview.candidateActivity) {
              updateCandidateActivityMutation.mutate({
                ...interview.candidateActivity,
                status: true,
              });
            }
          }
        }
      });
    }
  }, [interviews, nhanViens]);

  if (isLoadingInterviews || isLoadingNhanViens || isLoadingExams) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (interviewsError) {
    return <div className="text-red-500 text-center">Error: {(interviewsError as Error).message}</div>;
  }
  return (
    <div className="p-6 max-w-10xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý phỏng vấn</h1>
            <p className="text-gray-600">Tạo và quản lý các cuộc phỏng vấn ứng viên</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Làm mới
            </Button>
            <Button
              onClick={handleSendEmails}
              disabled={selectedInterviewIds.length === 0 || emailMutation.isPending}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Mail size={16} />
              Gửi Email ({selectedInterviewIds.length})
            </Button>
            <Button onClick={handleOpenCreateDrawer} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus size={16} />
              Tạo đề phỏng vấn
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng phỏng vấn</p>
                  <p className="text-2xl font-bold text-gray-900">{interviews?.length || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {interviews?.filter(i => i.isActive !== false).length || 0}
                  </p>
                </div>
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ứng viên</p>
                  <p className="text-2xl font-bold text-gray-900">{nhanViens?.length || 0}</p>
                </div>
                <User className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Đề thi</p>
                  <p className="text-2xl font-bold text-gray-900">{exams?.length || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm theo tên ứng viên, email, đề thi, hoạt động..."
                    value={tableSearchTerm}
                    onChange={(e) => setTableSearchTerm(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedActivityName} onValueChange={setSelectedActivityName}>
                  <SelectTrigger className="h-12 text-base w-48">
                    <SelectValue placeholder="Lọc theo hoạt động" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả hoạt động</SelectItem>
                    {uniqueActivityNames.map((activity) => (
                      <SelectItem key={activity} value={activity}>
                        {activity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 text-base w-48">
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="tested">Tested</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="interviewed">Interviewed</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 h-12 px-4"
                >
                  <Filter size={16} />
                  Bộ lọc
                </Button>
              </div>
            </div>
            {tableSearchTerm && (
              <div className="mt-3 text-sm text-gray-600">
                Tìm thấy <strong>{filteredInterviews.length}</strong> kết quả cho {tableSearchTerm}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={selectedInterviewIds.length === filteredInterviews.length && filteredInterviews.length > 0}
                      onCheckedChange={handleSelectAllInterviews}
                    />
                  </TableHead>
                  <TableHead className="text-left font-semibold text-gray-700">Ứng viên</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700">Email</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700">Loại</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700">Đề thi/Link</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Ngày phỏng vấn</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Người phụ trách</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Ngày tạo</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Hoạt động</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Trạng thái</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Kết quả</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>

                {filteredInterviews?.map((interview) => {
                  const candidate = nhanViens?.find((nv) => nv.id === interview.idcandidate);
                  return (
                    <React.Fragment key={interview.id}>
                      <TableRow className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedInterviewIds.includes(interview.id)}
                            onCheckedChange={() => handleInterviewToggle(interview.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users size={16} className="text-blue-600" />
                            </div>
                            <span>{getNhanVienName(interview.idcandidate)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" />
                            <span className="text-sm">{getNhanVienEmail(interview.idcandidate)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          <Badge variant="outline" className="text-sm rounded-[4px]">
                            {interview.type === "interview" ? "Phỏng vấn" : "Bài thi"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {interview.type === "test" ? (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <FileText size={16} className="text-green-600" />
                              </div>
                              <div className="max-w-xs">
                                <div className="font-medium text-sm">{getExamTitle(interview.link)}</div>
                                {(() => {
                                  const exam = getExamByLink(interview.link);
                                  return exam && (
                                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                                      <div className="flex items-center gap-3">
                                        {exam.code && (
                                          <span className="flex items-center gap-1 bg-blue-100 px-2 py-0.5 rounded text-blue-700">
                                            📝 {exam.code}
                                          </span>
                                        )}
                                        {(exam.questionCount || exam.totalQuestions) && (
                                          <span className="flex items-center gap-1">
                                            <FileText size={12} />
                                            {exam.questionCount || exam.totalQuestions} câu
                                          </span>
                                        )}
                                        {exam.duration && (
                                          <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {exam.duration}p
                                          </span>
                                        )}
                                      </div>
                                      {exam.settings && (
                                        <div className="flex items-center gap-2 text-xs">
                                          {exam.settings.solanThi && (
                                            <span className="bg-orange-100 px-1.5 py-0.5 rounded text-orange-700">
                                              {exam.settings.solanThi} lần thi
                                            </span>
                                          )}
                                          {exam.settings.quydinhDiemThi && (
                                            <span className="bg-green-100 px-1.5 py-0.5 rounded text-green-700">
                                              Điểm qua: {exam.settings.quydinhDiemThi}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenLink(interview.linkInterview || interview.link)}
                              className="p-2 h-auto text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <ExternalLink size={16} className="mr-1" />
                              Mở link phỏng vấn
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-gray-600">
                          <div className="flex items-center justify-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="text-sm">
                              {interview.ngayPhongVan
                                ? new Date(interview.ngayPhongVan.replace('Z', '')).toLocaleString("vi-VN", {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                                : "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-gray-600">
                        <span className="text-sm">{interview.candidateActivity?.assignee ? userNameMap[interview.candidateActivity.assignee] || interview.candidateActivity.assignee : "-"}</span>
                        </TableCell>
                        <TableCell className="text-center text-gray-600">
                          <div className="flex items-center justify-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="text-sm">
                              {interview.createdOn
                                ? new Date(interview.createdOn).toLocaleDateString("vi-VN")
                                : "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-gray-600">
                          <span className="text-sm">{interview.activityName || "-"}</span>
                        </TableCell>
                        <TableCell className="text-center">{getInterviewStatus(interview, candidate)}</TableCell>
                        <TableCell
                          className="text-center cursor-pointer"
                          onClick={() => setExpandedRowId(interview.id === expandedRowId ? null : interview.id)}
                        >
                          {interview.testResult ? (
                            <div className="text-sm text-gray-600">
                              {interview.testResult.score !== undefined ? `${interview.testResult.score}` : "Có kết quả"}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(interview)}
                              className="hover:bg-blue-50 hover:border-blue-300 flex items-center gap-1"
                            >
                              <Edit3 size={14} />
                              Sửa
                            </Button>
                            {/* <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(interview.id)}
                              className="hover:bg-red-600 flex items-center gap-1"
                            >
                              <Trash2 size={14} />
                              Xóa
                            </Button> */}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(interview.id, interview.activityName || "Không rõ")}
                              className="hover:bg-red-600 flex items-center gap-1"
                            >
                              <Trash2 size={14} />
                              Xóa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRowId === interview.id && <InterviewDetailsPanel candidate={candidate} danhSachBaiThi={interview.danhSachBaiThi || []} getExamTitle={getExamTitle} />}
                    </React.Fragment>
                  );
                })}
                {filteredInterviews?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3 text-gray-500">
                        {tableSearchTerm ? (
                          <>
                            <Search className="w-12 h-12 text-gray-300" />
                            <p className="text-lg font-medium">Không tìm thấy kết quả</p>
                            <p className="text-sm">Thử thay đổi từ khóa tìm kiếm</p>
                          </>
                        ) : (
                          <>
                            <Users className="w-12 h-12 text-gray-300" />
                            <p className="text-lg font-medium">Chưa có cuộc phỏng vấn nào</p>
                            <p className="text-sm">Nhấn Tạo cuộc phỏng vấn để bắt đầu</p>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="fixed right-0 top-0 bottom-0 w-[900px] max-w-[100vw] p-0 bg-white rounded-l-xl shadow-2xl flex flex-col overflow-hidden">
          <DrawerHeader className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
            <DrawerTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {selectedInterview ? (
                <>
                  <Edit3 size={24} className="text-blue-600" />
                  Chỉnh sửa cuộc phỏng vấn
                </>
              ) : (
                <>
                  <Plus size={24} className="text-blue-600" />
                  Tạo cuộc phỏng vấn mới
                </>
              )}
            </DrawerTitle>
            <DrawerDescription className="text-gray-600 mt-2">
              {selectedInterview
                ? "Cập nhật thông tin cuộc phỏng vấn cho ứng viên."
                : "Chọn loại, đề thi hoặc link và ứng viên để tạo cuộc phỏng vấn mới."}
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSubmit} className="flex flex-col h-[calc(100vh-120px)]">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Interview Type Selection */}
              <Card className="border-2 border-blue-100">
                <CardHeader className="bg-blue-50 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    Loại phỏng vấn *
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Select value={interviewType} onValueChange={(value: 'interview' | 'test') => setInterviewType(value)}>
                    <SelectTrigger className="h-14 text-base">
                      <SelectValue placeholder="Chọn loại phỏng vấn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interview">Phỏng vấn trực tiếp</SelectItem>
                      <SelectItem value="test">Bài thi</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Conditional Fields based on Interview Type */}
              {interviewType === 'test' ? (
                <Card className="border-2 border-blue-100">
                  <CardHeader className="bg-blue-50 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText size={20} className="text-blue-600" />
                      Chọn đề thi *
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                      <SelectTrigger className="h-14 text-base">
                        <SelectValue placeholder="Chọn đề thi phù hợp" />
                      </SelectTrigger>
                      <SelectContent>
                        {exams?.map((exam) => (
                          <SelectItem key={exam.id} value={exam.id}>
                            <div className="flex flex-col py-3 gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-base text-gray-900">{exam.title}</span>
                                {exam.code && (
                                  <Badge variant="outline" className="text-xs">
                                    📝 {exam.code}
                                  </Badge>
                                )}
                              </div>
                              {exam.description && (
                                <span className="text-sm text-gray-600 line-clamp-2">{exam.description}</span>
                              )}
                              <div className="flex flex-wrap gap-2 text-sm">
                                {exam.duration && (
                                  <span className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded text-blue-700">
                                    <Clock size={14} />
                                    {exam.duration} phút
                                  </span>
                                )}
                                {(exam.questionCount || exam.totalQuestions) && (
                                  <span className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded text-green-700">
                                    <FileText size={14} />
                                    {exam.questionCount || exam.totalQuestions} câu
                                  </span>
                                )}
                                {exam.settings?.solanThi && (
                                  <span className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded text-orange-700">
                                    🔄 {exam.settings.solanThi} lần
                                  </span>
                                )}
                                {exam.settings?.quydinhDiemThi && (
                                  <span className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded text-purple-700">
                                    🎯 Qua: {exam.settings.quydinhDiemThi}
                                  </span>
                                )}
                              </div>
                              {exam.settings?.solanvipham && (
                                <div className="text-xs text-red-600">
                                  ⚠️ Tối đa {exam.settings.solanvipham} lần vi phạm
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="border-2 border-blue-100">
                    <CardHeader className="bg-blue-50 pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar size={20} className="text-blue-600" />
                        Ngày phỏng vấn *
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Input
                        type="datetime-local"
                        value={ngayPhongVan}
                        onChange={(e) => setNgayPhongVan(e.target.value)}
                        className="h-14 text-base"
                      />
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-blue-100">
                    <CardHeader className="bg-blue-50 pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ExternalLink size={20} className="text-blue-600" />
                        Link phỏng vấn *
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Input
                        type="text"
                        placeholder="Nhập link phỏng vấn (ví dụ: Zoom, Google Meet)"
                        value={linkInterview}
                        onChange={(e) => setLinkInterview(e.target.value)}
                        className="h-14 text-base"
                      />
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Email Options */}
              <Card className="border-2 border-green-100">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="sendEmail"
                      checked={sendEmailOnSubmit}
                      onCheckedChange={(checked: any) => setSendEmailOnSubmit(!!checked)}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="sendEmail" className="text-base font-medium text-gray-900 cursor-pointer">
                        Gửi email thông báo cho ứng viên
                      </Label>
                      <p className="text-sm text-gray-600">
                        Email sẽ được gửi tự động sau khi {selectedInterview ? "cập nhật" : "tạo"} cuộc phỏng vấn
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Candidates Display */}
              {selectedNhanVienIds.length > 0 && (
                <Card className="border-2 border-purple-100">
                  <CardHeader className="bg-purple-50 pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users size={20} className="text-purple-600" />
                      Ứng viên đã chọn ({selectedNhanVienIds.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-3">
                      {selectedNhanVienIds.map(id => {
                        const candidate = nhanViens?.find(nv => nv.id === id);
                        return (
                          <Badge key={id} variant="secondary" className="flex items-center gap-2 px-4 py-2 text-sm">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <User size={12} className="text-purple-600" />
                            </div>
                            <span className="font-medium">{candidate?.full_name || 'Unknown'}</span>
                            <Button
                              type="button"
                              onClick={() => removeCandidateFromSelection(id)}
                              className="ml-1 hover:bg-gray-300 rounded-full p-1 transition-colors"
                            >
                              <X size={14} />
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Search and Select Candidates */}
              <Card className="border-2 border-orange-100">
                <CardHeader className="bg-orange-50 pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users size={20} className="text-orange-600" />
                    {selectedInterview ? "Chọn ứng viên *" : "Chọn ứng viên * (có thể chọn nhiều)"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Search and Position Filter */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        placeholder="Tìm kiếm ứng viên theo tên, email, chức vụ, kinh nghiệm hoặc trạng thái..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 text-base"
                      />
                    </div>
                    <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                      <SelectTrigger className="h-12 text-base w-full sm:w-48">
                        <SelectValue placeholder="Lọc theo vị trí" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả vị trí</SelectItem>
                        {uniquePositions.map((position) => (
                          <SelectItem key={position} value={position}>
                            {position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select All Button */}
                  {!selectedInterview && filteredCandidates.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">
                        Hiển thị {filteredCandidates.length} ứng viên
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="flex items-center gap-2"
                      >
                        <Check size={14} />
                        {selectedNhanVienIds.length === filteredCandidates.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </Button>
                    </div>
                  )}

                  {/* Candidates List */}
                  <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                    {filteredCandidates.map((nhanVien) => (
                      <div
                        key={nhanVien.id}
                        className="flex items-center space-x-4 p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <Checkbox
                          id={nhanVien.id}
                          checked={selectedNhanVienIds.includes(nhanVien.id)}
                          onCheckedChange={() => {
                            if (selectedInterview) {
                              setSelectedNhanVienIds([nhanVien.id]);
                            } else {
                              handleCandidateToggle(nhanVien.id);
                            }
                          }}
                          className="w-5 h-5"
                        />
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {nhanVien.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 text-base">
                              {nhanVien.full_name}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {nhanVien.email && (
                              <Badge variant="outline" className="text-xs">
                                <Mail size={10} className="mr-1" />
                                {nhanVien.email}
                              </Badge>
                            )}
                            {nhanVien.position && (
                              <Badge variant="outline" className="text-xs">
                                <User size={10} className="mr-1" />
                                {nhanVien.position}
                              </Badge>
                            )}
                            {nhanVien.experience && (
                              <Badge variant="outline" className="text-xs">
                                🏢 {nhanVien.experience}
                              </Badge>
                            )}
                            {nhanVien.pipeline_status && (
                              <Badge variant="outline" className="text-xs">
                                📈 {nhanVien.pipeline_status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredCandidates.length === 0 && (
                      <div className="p-12 text-center text-gray-500">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-lg font-medium mb-1">
                          {searchTerm || selectedPosition ? 'Không tìm thấy ứng viên phù hợp' : 'Không có ứng viên nào'}
                        </p>
                        {(searchTerm || selectedPosition) && (
                          <p className="text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preview Link */}
              {(interviewType === 'test' && selectedExamId) || (interviewType === 'interview' && linkInterview) ? (
                <Card className="border-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-indigo-800">
                      <ExternalLink size={20} />
                      Xem trước link phỏng vấn
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="p-4 bg-white border border-indigo-200 rounded-lg shadow-sm">
                      <div className="font-mono text-sm text-indigo-600 break-all mb-3">
                        {interviewType === 'test' ?
                          `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/exam/dethipublic/${selectedExamId}` :
                          linkInterview}
                      </div>
                      <div className="space-y-2">
                        {interviewType === 'test' ? (
                          <>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FileText size={14} />
                              <span>Đề thi: <strong>{getExamTitle(`/exam/dethipublic/${selectedExamId}`)}</strong></span>
                            </div>
                            {(() => {
                              const exam = exams?.find(e => e.id === selectedExamId);
                              return exam && (
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {exam.code && (
                                    <div className="flex items-center gap-1 text-blue-600">
                                      📝 <span>Mã: {exam.code}</span>
                                    </div>
                                  )}
                                  {(exam.questionCount || exam.totalQuestions) && (
                                    <div className="flex items-center gap-1 text-green-600">
                                      <FileText size={12} />
                                      <span>{exam.questionCount || exam.totalQuestions} câu hỏi</span>
                                    </div>
                                  )}
                                  {exam.duration && (
                                    <div className="flex items-center gap-1 text-orange-600">
                                      <Clock size={12} />
                                      <span>{exam.duration} phút</span>
                                    </div>
                                  )}
                                  {exam.settings?.solanThi && (
                                    <div className="flex items-center gap-1 text-purple-600">
                                      🔄 <span>{exam.settings.solanThi} lần thi</span>
                                    </div>
                                  )}
                                  {exam.settings?.quydinhDiemThi && (
                                    <div className="flex items-center gap-1 text-teal-600">
                                      🎯 <span>Điểm qua: {exam.settings.quydinhDiemThi}</span>
                                    </div>
                                  )}
                                  {exam.settings?.solanvipham && (
                                    <div className="flex items-center gap-1 text-red-600">
                                      ⚠️ <span>Vi phạm: {exam.settings.solanvipham}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={14} />
                            <span>Ngày phỏng vấn: <strong>{ngayPhongVan
                              ? new Date(ngayPhongVan.replace('Z', '')).toLocaleString('vi-VN',
                                {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'
                            }</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!selectedInterview && selectedNhanVienIds.length > 0 && (
                      <div className="mt-4 p-3 bg-indigo-100 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-indigo-800">
                          <Users size={14} />
                          <span>Sẽ tạo <strong>{selectedNhanVienIds.length}</strong> cuộc {interviewType === 'interview' ? 'phỏng vấn' : 'bài thi'} với {interviewType === 'interview' ? 'link này' : 'đề thi này'}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}
              {selectedInterview && interviewType === "interview" && (
                <Card className="border-2 border-green-100">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="confirmInterviewed"
                        checked={interviewConfirmations[selectedInterview.id] || false}
                        onCheckedChange={(checked: any) =>
                          setInterviewConfirmations((prev: any) => ({
                            ...prev,
                            [selectedInterview.id]: !!checked,
                          }))
                        }
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="confirmInterviewed" className="text-base font-medium text-gray-900 cursor-pointer">
                          Xác nhận phỏng vấn hoàn thành
                        </Label>
                        <p className="text-sm text-gray-600">
                          Đánh dấu ứng viên đã hoàn thành phỏng vấn (trạng thái sẽ chuyển thành interviewed).
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <DrawerFooter className="border-t bg-gray-50 p-6">
              <div className="flex flex-col gap-4">
                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending ||
                      updateMutation.isPending ||
                      (interviewType === 'test' && !selectedExamId) ||
                      (interviewType === 'interview' && (!ngayPhongVan || !linkInterview)) ||
                      selectedNhanVienIds.length === 0
                    }
                    className="flex-1 h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang xử lý...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {selectedInterview ? <Edit3 size={18} /> : <Plus size={18} />}
                        {selectedInterview ? `Cập nhật ${interviewType === 'interview' ? 'phỏng vấn' : 'bài thi'}` : `Tạo ${selectedNhanVienIds.length || 0} cuộc ${interviewType === 'interview' ? 'phỏng vấn' : 'bài thi'}`}
                      </div>
                    )}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" className="flex-1 sm:flex-none h-14 text-base font-semibold">
                      Hủy bỏ
                    </Button>
                  </DrawerClose>
                </div>

                {/* Summary */}
                {((interviewType === 'test' && selectedExamId) || (interviewType === 'interview' && ngayPhongVan && linkInterview)) && selectedNhanVienIds.length > 0 && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-blue-800">
                      {interviewType === 'test' ? (
                        <div className="flex items-center gap-2">
                          <FileText size={16} />
                          <span><strong>{getExamTitle(`/exam/dethipublic/${selectedExamId}`)}</strong></span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ExternalLink size={16} />
                          <span><strong>Phỏng vấn trực tiếp</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        <span><strong>{selectedNhanVienIds.length}</strong> ứng viên</span>
                      </div>
                      {sendEmailOnSubmit && (
                        <div className="flex items-center gap-2">
                          <Mail size={16} />
                          <span>Gửi email tự động</span>
                        </div>
                      )}
                      {interviewType === 'interview' && (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span><strong>{ngayPhongVan ? new Date(ngayPhongVan).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
      <InterviewStatusModal
        isOpen={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        interviewStatus={interviewStatus}
        setInterviewStatus={setInterviewStatus}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        onSubmit={handleStatusModalSubmit}
      />
    </div>
  );
}