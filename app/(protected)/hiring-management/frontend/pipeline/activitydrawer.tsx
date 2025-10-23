"use client";

import { useState, useEffect } from "react";
import {
  X,
  Save,
  Phone,
  Mail,
  User,
  FileText,
  Search,
  Clock,
  Monitor,
  MapPin,
  Loader2,
  CheckSquare,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/app/frontend/components/ui/dialog";
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
import { Textarea } from "@/app/frontend/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/frontend/components/ui/card";
import { Badge } from "@/app/frontend/components/ui/badge";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/app/frontend/components/ui/button";
import TiptapEditor from "../components/TiptapEditor";
import activityService from "../services/activityService";

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

interface Candidate {
  id: string;
  full_name: string;
  email?: string | null;
}

interface Stage {
  id: string;
  name: string;
  candidates?: Candidate[];
}

interface Activity {
  id?: string;
  name: string;
  description?: string | null;
  type: string;
  start_date?: string | null;
  end_date?: string | null;
  status: boolean;
  assignee: string;
  participants?: string[]; // Thêm field participants
}

interface ActivityDrawerProps {
  stageId: any;
  stages: Stage[];
  onClose: () => void;
  onCreateActivity: (data: Activity) => Promise<any>;
  fetchAllCandidates: () => Promise<any>;
  selectedActivity?: Activity & {
    candidates?: {
      candidate_id: string;
      candidate_activity_id?: string;
      noteresult?: string;
    }[];
  };
  selectedActionType?: string;
  selectedCandidate?: Candidate;
}

interface FormData {
  id: string;
  name: string;
  description: string;
  type: string;
  start_date: string;
  end_date: string;
  status: boolean;
  assignee: string;
  participants: string[];
  selectedCandidates: string[];
  interview_date: string;
  interview_link: string;
  interview_type: string;
  location: string;
  test_id: string;
  send_email: boolean;
  template_id: string;
  noteresult: string;
  activity_status: string; // Thêm field để cập nhật status của candidate_activity
  result: string; // Thêm field result
}

const api = {
  getUserId: (): string => {
    const state = localStorage.getItem("ai.platform");
    return state ? JSON.parse(state)?.state?.user?.id : "";
  },
};

const ActivityDrawer = ({
  stageId,
  stages,
  onClose,
  onCreateActivity,
  fetchAllCandidates,
  selectedActivity,
  selectedActionType,
  selectedCandidate,
}: ActivityDrawerProps) => {
  const [formData, setFormData] = useState<FormData>({
    id: "",
    name: "",
    description: "",
    type: selectedActionType || "call",
    start_date: "",
    end_date: "",
    status: false,
    assignee: "",
    participants: [],
    selectedCandidates: selectedCandidate ? [selectedCandidate.id] : [],
    interview_date: "",
    interview_link: "",
    interview_type: "online",
    location: "",
    test_id: "",
    send_email: false,
    template_id: "",
    noteresult: "",
    activity_status: "in_progress", // Default status
    result: "pending", // Default result
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [tests, setTests] = useState<Exam[]>([]);
  const [users, setUsers] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const stage = stages.find((s) => s.id === stageId.stageId) || {
    name: "Unknown",
    candidates: [],
  };
  const [stageCandidates, setStageCandidates] = useState<Candidate[]>([]);

  // State for exam questions
  const [examQuestions, setExamQuestions] = useState<{
    singleChoice: any[];
    text: any[];
  }>({ singleChoice: [], text: [] });
  
  // State for email template selection
  const [isEmailTemplateModalOpen, setIsEmailTemplateModalOpen] = useState(false);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string>("");
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [searchAssignee, setSearchAssignee] = useState("");
  const [searchParticipants, setSearchParticipants] = useState("");

  useEffect(() => {
    const fetchExamQuestions = async () => {
      if (formData.test_id && formData.type === "test") {
        setIsLoadingQuestions(true);
        try {
          const response = await fetch(
            `/examhr/api/getexambyid/${formData.test_id}`
          );
          if (response.ok) {
            const data = await response.json();
            setExamQuestions(data.questions || { singleChoice: [], text: [] });
          } else {
            console.error("Failed to fetch exam questions");
            setExamQuestions({ singleChoice: [], text: [] });
          }
        } catch (error) {
          console.error("Error fetching exam questions:", error);
          setExamQuestions({ singleChoice: [], text: [] });
        } finally {
          setIsLoadingQuestions(false);
        }
      } else {
        setExamQuestions({ singleChoice: [], text: [] });
      }
    };

    fetchExamQuestions();
  }, [formData.test_id, formData.type]);

  // Populate form data from selectedActivity when editing
  useEffect(() => {
    if (selectedActivity?.id) {
      console.log(
        "Populating form data from selectedActivity:",
        selectedActivity
      );
      setFormData((prev) => ({
        ...prev,
        id: selectedActivity.id as string,
        name: selectedActivity.name || "",
        description: selectedActivity.description || "",
        type: selectedActivity.type || "call",
        status: selectedActivity.status || false,
        assignee: selectedActivity.assignee || "",
        participants: selectedActivity.participants || [],
        selectedCandidates:
          selectedActivity.candidates?.map((c) => c.candidate_id) || [],
        // Populate interview data
        interview_date: (selectedActivity as any)?.interview_date || "",
        interview_link: (selectedActivity as any)?.interview_link || "",
        location: (selectedActivity as any)?.interview_location || "",
        interview_confirmed:
          (selectedActivity as any)?.interview_confirmed || false,
        interview_type: (selectedActivity as any)?.interview_type || "online", // Sử dụng interview_type từ backend
        // Populate test data
        test_id:
          (selectedActivity as any).test_id ||
          (selectedActivity as any).exam_id ||
          "",
        // Populate noteresult, activity_status và result từ first candidate
        noteresult: selectedActivity.candidates?.[0]?.noteresult || "",
        activity_status: (selectedActivity.candidates?.[0] as any)?.status || "in_progress",
        result: (selectedActivity.candidates?.[0] as any)?.result || "pending",
      }));
    }
  }, [selectedActivity]);

  const fetchExams = async (): Promise<Exam[]> => {
    return await activityService.exam.getExams();
  };

  const fetchEmailTemplates = async () => {
    return await activityService.emailTemplate.getEmailTemplates();
  };

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: fetchEmailTemplates,
  });

  const sendEmail = async ({
    link,
    email,
    hoTen,
    startDate,
    endDate,
    examInfo,
    type,
    template_id,
  }: {
    link: string;
    email: string;
    hoTen: string;
    startDate?: string;
    endDate?: string;
    examInfo?: any;
    type: string;
    template_id?: string;
  }): Promise<void> => {
    await activityService.email.sendTemplateEmail({
      link,
      email,
      hoTen,
      startDate,
      endDate,
      examInfo,
      type,
      template_id,
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (fetchAllCandidates) {
          const candidates = await fetchAllCandidates();
          setStageCandidates(candidates.data || []);
          setAllCandidates(candidates.data || []);
        }
        const testsData = await fetchExams();
        setTests(testsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Lỗi khi tải dữ liệu đề thi hoặc ứng viên");
      }
    };
    loadData();
  }, [fetchAllCandidates, stages, stageId]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await activityService.user.getUsers();
        setUsers(data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  const createMultipleInterviews = async (data: {
    link: string;
    candidateIds: string[];
    type: "interview" | "test";
    ngayPhongVan?: string;
    linkInterview?: string;
    location?: string;
    candidateActivities: {
      candidate_id: string;
      candidate_activity_id: string | null;
    }[];
  }): Promise<any[]> => {
    return await activityService.interview.createMultipleInterviews(data);
  };

  const updateInterview = async (data: any): Promise<any> => {
    return await activityService.interview.updateInterview(data);
  };

  // Function to send email with selected template
  const handleSendEmailWithTemplate = async () => {
    if (!selectedEmailTemplate || !formData.test_id || formData.selectedCandidates.length === 0) {
      toast.error("Vui lòng chọn template email");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Gửi email cho từng candidate
      for (const candidateId of formData.selectedCandidates) {
        // Ưu tiên dùng selectedCandidate (edit mode), nếu không có thì tìm trong uniqueCandidates
        let candidate: Candidate | null = null;
        if (selectedCandidate?.id === candidateId) {
          candidate = selectedCandidate;
        } else {
          candidate = uniqueCandidates.find(c => c.id === candidateId) || null;
        }
        
        if (!candidate?.full_name) continue;

        const examLink = `${
          process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
        }/examhr/dethipublic/${formData.test_id}`;

        const test = tests.find(t => t.id === formData.test_id);
        
        // Tạo examInfo với đầy đủ thông tin
        const examInfo = test ? {
          title: test.title,
          code: test.code,
          duration: test.duration,
          questionCount: test.questionCount || test.totalQuestions,
          solanThi: test.settings?.solanThi,
          quydinhDiemThi: test.settings?.quydinhDiemThi,
          solanvipham: test.settings?.solanvipham, // Sửa từ maxViolations thành solanvipham
        } : undefined;

        // Lấy thời gian từ formData
        const emailStartDate = formData.start_date || undefined;
        const emailEndDate = formData.end_date || undefined;

        try {
          // Gửi email thông qua template service với đầy đủ thông tin
          await activityService.email.sendTemplateEmail({
            link: examLink,
            email: candidate.email || "",
            hoTen: candidate.full_name,
            startDate: emailStartDate,
            endDate: emailEndDate,
            examInfo: examInfo,
            type: "test",
            template_id: selectedEmailTemplate,
          });
        } catch (emailError) {
          console.error(`Error sending email to ${candidate.email}:`, emailError);
        }
      }

      toast.success("Đã gửi email thông báo đề thi thành công!");
      setIsEmailTemplateModalOpen(false);
      setSelectedEmailTemplate("");
    } catch (error) {
      console.error("Lỗi khi gửi email:", error);
      toast.error("Có lỗi xảy ra khi gửi email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!formData.name) {
      setError("Vui lòng nhập tên hoạt động");
      toast.error("Vui lòng nhập tên hoạt động");
      return;
    }
    if (formData.selectedCandidates.length === 0) {
      setError("Vui lòng chọn ít nhất một ứng viên");
      toast.error("Vui lòng chọn ít nhất một ứng viên");
      return;
    }
    if (
      formData.start_date &&
      formData.end_date &&
      new Date(formData.start_date) > new Date(formData.end_date)
    ) {
      setError("Ngày kết thúc phải sau ngày bắt đầu");
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }
    if (
      formData.type === "interview" &&
      (!formData.interview_date ||
        (formData.interview_type === "online" && !formData.interview_link) ||
        (formData.interview_type === "offline" && !formData.location))
    ) {
      const missingField =
        formData.interview_type === "online"
          ? "link phỏng vấn"
          : "địa điểm phỏng vấn";
      setError(`Vui lòng nhập ngày phỏng vấn và ${missingField}`);
      toast.error(`Vui lòng nhập ngày phỏng vấn và ${missingField}`);
      return;
    }

    setError("");
    setIsSubmitting(true);
    const activityData = {
      id: formData.id || undefined,
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      created_by: formData.id ? undefined : "current-user",
      updated_by: formData.id ? "current-user" : undefined,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      status: formData.status,
      assignee: formData.assignee,
      participants: formData.participants, // Thêm participants
      exam_id: formData.type === "test" ? formData.test_id : undefined,
      candidates: formData.selectedCandidates.map((candidateId) => ({
        candidate_id: candidateId,
        stage_id: stageId.stageId,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
        assignee: formData.assignee,
        // Thêm activity_status và result cho candidate_activity
        activity_status: formData.activity_status,
        result: formData.result,
      })),
      // Add noteresult for edit mode
      noteresult: formData.noteresult,
      // Thêm activity_status và result cho activity
      activity_status: formData.activity_status,
      result: formData.result,
    };
    try {
      const response = await onCreateActivity(activityData);

      // Nếu đang edit activity và có thay đổi activity_status hoặc result, cập nhật riêng
      if (formData.id && formData.selectedCandidates.length > 0) {
        const candidateId = formData.selectedCandidates[0];
        
        // Tìm candidate_activity_id từ selectedActivity
        const candidateActivity = (selectedActivity as any)?.candidates?.find(
          (c: any) => c.candidate_id === candidateId
        );
        
        if (candidateActivity?.candidate_activity_id) {
          try {
            // Update activity_status nếu khác "in_progress" (default)
            if (formData.activity_status && formData.activity_status !== "in_progress") {
              await activityService.activity.updateCandidateActivityStatus(
                formData.id,
                candidateId,
                formData.activity_status as 'in_progress' | 'completed' | 'cancelled'
              );
            }
            
            // Update result nếu khác "pending" (default)
            if (formData.result && formData.result !== "pending") {
              await activityService.activity.updateActivityResult(
                candidateActivity.candidate_activity_id,
                formData.result as 'pending' | 'pass' | 'fail'
              );
            }
            
            console.log("Successfully updated activity status and result");
          } catch (error) {
            console.error("Failed to update activity status/result:", error);
            // Không throw error để không block việc cập nhật activity chính
          }
        }
      }

      if (formData.type === "interview" || formData.type === "test") {
        const interviewLink =
          formData.type === "test"
            ? `${
                process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
              }/examhr/dethipublic/${formData.test_id}`
            : formData.interview_type === "online"
            ? formData.interview_link
            : `Phỏng vấn trực tiếp tại: ${formData.location}`;

        if (formData.id) {
          if (formData.selectedCandidates.length !== 1) {
            setError("Chỉ có thể cập nhật cho một ứng viên");
            toast.error("Chỉ có thể cập nhật cho một ứng viên");
            return;
          }
          await updateInterview({
            id: formData.id,
            link:
              formData.interview_type === "online"
                ? formData.interview_link
                : "",
            idcandidate: formData.selectedCandidates[0],
            type: formData.type,
            ngayPhongVan:
              formData.type === "interview" ? formData.interview_date : null,
            linkInterview:
              formData.type === "interview" &&
              formData.interview_type === "online"
                ? formData.interview_link
                : null,
            location:
              formData.type === "interview" &&
              formData.interview_type === "offline"
                ? formData.location
                : null,
          });
        } else {
          const candidateActivityIds =
            response?.candidates?.map((c:any) => ({
              candidate_id: c.candidate_id,
              candidate_activity_id: c.candidate_activity_id,
            })) || [];

          await createMultipleInterviews({
            link:
              formData.interview_type === "online"
                ? formData.interview_link
                : "",
            candidateIds: formData.selectedCandidates,
            type: formData.type as "interview" | "test",
            ngayPhongVan:
              formData.type === "interview"
                ? formData.interview_date
                : undefined,
            linkInterview:
              formData.type === "interview" &&
              formData.interview_type === "online"
                ? formData.interview_link
                : undefined,
            location:
              formData.type === "interview" &&
              formData.interview_type === "offline"
                ? formData.location
                : undefined,
            candidateActivities: candidateActivityIds,
          });
        }

        if (formData.send_email) {
          const candidateEmails = formData.selectedCandidates
            .map((candidateId) => {
              // Ưu tiên dùng selectedCandidate (edit mode)
              if (selectedCandidate?.id === candidateId) {
                return {
                  email: selectedCandidate.email || "",
                  full_name: selectedCandidate.full_name,
                };
              }
              // Nếu không có selectedCandidate, tìm trong uniqueCandidates
              const candidate = uniqueCandidates.find((c) => c.id === candidateId);
              return candidate ? {
                email: candidate.email || "",
                full_name: candidate.full_name,
              } : null;
            })
            .filter(Boolean); // Lọc bỏ null

          const exam: any =
            formData.type === "test"
              ? tests.find((t) => t.id === formData.test_id)
              : undefined;

          const examInfo = exam
            ? {
                title: exam.title,
                code: exam.code,
                duration: exam.duration,
                questionCount: exam.questionCount || exam.totalQuestions,
                solanThi: exam.settings?.solanThi,
                solanvipham: exam.settings?.solanvipham,
                quydinhDiemThi: exam.settings?.quydinhDiemThi,
              }
            : undefined;

          const emailStartDate =
            formData.type === "test" && exam?.startDate
              ? exam.startDate
              : formData.type === "interview"
              ? formData.interview_date
              : undefined;

          const emailEndDate =
            formData.type === "test" && exam?.endDate
              ? exam.endDate
              : undefined;

          for (const candidate of candidateEmails as Array<{email: string, full_name: string}>) {
            if (!candidate.email) {
              toast.warning(
                `Không tìm thấy email của ứng viên ${candidate.full_name}`,
                {
                  duration: 3000,
                  dismissible: true,
                }
              );
              continue;
            }

            try {
              await sendEmail({
                link: interviewLink,
                email: candidate.email,
                hoTen: candidate.full_name,
                startDate: emailStartDate,
                endDate: emailEndDate,
                examInfo: formData.type === "test" ? examInfo : undefined,
                type: formData.type,
                template_id: formData.template_id,
              });
            } catch (error) {
              console.error(
                `Failed to send email to ${candidate.email}:`,
                error
              );
              toast.warning(`Không thể gửi email tới ${candidate.full_name}`, {
                duration: 3000,
                dismissible: true,
              });
            }
          }
        }
      }
      toast.success(
        formData.id
          ? "Hoạt động đã được cập nhật thành công"
          : "Hoạt động đã được tạo thành công"
      );
      onClose();
    } catch (err) {
      setError(
        formData.id ? "Lỗi khi cập nhật hoạt động" : "Lỗi khi tạo hoạt động"
      );
      toast.error(
        formData.id ? "Lỗi khi cập nhật hoạt động" : "Lỗi khi tạo hoạt động"
      );
      console.error("Error processing activity:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCandidate = (candidateId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedCandidates: prev.selectedCandidates.includes(candidateId)
        ? prev.selectedCandidates.filter((id) => id !== candidateId)
        : [...prev.selectedCandidates, candidateId],
    }));
  };

  const toggleSelectAll = () => {
    const allCandidateIds = [...stageCandidates, ...allCandidates]
      .filter(
        (c) =>
          !searchTerm ||
          c.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((c) => c.id);
    setFormData((prev) => ({
      ...prev,
      selectedCandidates:
        prev.selectedCandidates.length === allCandidateIds.length
          ? []
          : allCandidateIds,
    }));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "interview":
        return <User className="w-4 h-4" />;
      case "test":
        return <FileText className="w-4 h-4" />;
      case "task":
        return <CheckSquare className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const mergedCandidates = [...stageCandidates, ...allCandidates];
  const uniqueCandidates = Array.from(
    new Map(mergedCandidates.map((c) => [c.id, c])).values()
  ).filter(
    (c) =>
      !searchTerm ||
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={true} onOpenChange={(open:any) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 border-0 shadow-2xl flex flex-col">
        {/* Modern Header - Fixed */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                {getActivityIcon(formData.type)}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white mb-1">
                  {formData.id ? "Chỉnh sửa hoạt động" : "Tạo hoạt động mới"}
                </DialogTitle>
                <p className="text-blue-100 text-sm">
                  Quản lý và theo dõi hoạt động tuyển dụng
                </p>
              </div>
            </div>
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2"
            >
              <X className="w-5 h-5" />
            </Button> */}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
          <div className="space-y-6">
            {/* Activity Type Selection - Hero Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  {getActivityIcon(formData.type)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Loại hoạt động
                  </h3>
                  <p className="text-gray-600">
                    Chọn loại hoạt động bạn muốn tạo
                  </p>
                </div>
              </div>
              <Select
                value={formData.type}
                onValueChange={(value:any) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-14 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white">
                  <SelectValue placeholder="Chọn loại hoạt động" />
                </SelectTrigger>
                <SelectContent className="bg-white border-0 shadow-xl">
                  <SelectItem value="call" className="hover:bg-blue-50">
                    <div className="flex items-center gap-3 py-2">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-semibold">Call</div>
                        <div className="text-sm text-gray-500">
                          Ghi chú cuộc gọi
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="email" className="hover:bg-green-50">
                    <div className="flex items-center gap-3 py-2">
                      <Mail className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-semibold">Email</div>
                        <div className="text-sm text-gray-500">
                          Gửi email thông báo
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="interview" className="hover:bg-purple-50">
                    <div className="flex items-center gap-3 py-2">
                      <User className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-semibold">Interview</div>
                        <div className="text-sm text-gray-500">
                          Lên lịch phỏng vấn
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="test" className="hover:bg-orange-50">
                    <div className="flex items-center gap-3 py-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="font-semibold">Test</div>
                        <div className="text-sm text-gray-500">
                          Bài thi đánh giá
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="task" className="hover:bg-pink-50">
                    <div className="flex items-center gap-3 py-2">
                      <CheckSquare className="w-5 h-5 text-pink-600" />
                      <div>
                        <div className="font-semibold">Task</div>
                        <div className="text-sm text-gray-500">
                          Nhiệm vụ và công việc
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    Thông tin cơ bản
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Tên hoạt động <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Nhập tên hoạt động"
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Người phụ trách <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.assignee}
                      onValueChange={(value:any) =>
                        setFormData((prev) => ({ ...prev, assignee: value }))
                      }
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white">
                        <SelectValue placeholder="Chọn người phụ trách" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-0 shadow-xl">
                        <div className="p-2 border-b border-gray-200">
                          <Input
                            placeholder="Tìm kiếm người phụ trách..."
                            value={searchAssignee}
                            onChange={(e) => setSearchAssignee(e.target.value)}
                            className="h-8 text-sm border-gray-300 focus:border-blue-500"
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        {users
                          .filter((user) =>
                            user.name.toLowerCase().includes(searchAssignee.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchAssignee.toLowerCase())
                          )
                          .map((user) => (
                            <SelectItem
                              key={user.id}
                              value={user.id}
                              className="hover:bg-blue-50"
                            >
                              <div className="flex items-center gap-3 py-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Người tham gia
                    </Label>
                    <Select
                      value=""
                      onValueChange={(value:any) => {
                        if (!formData.participants.includes(value)) {
                          setFormData((prev) => ({
                            ...prev,
                            participants: [...prev.participants, value],
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white">
                        <SelectValue placeholder="Chọn người tham gia" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-0 shadow-xl">
                        <div className="p-2 border-b border-gray-200">
                          <Input
                            placeholder="Tìm kiếm người tham gia..."
                            value={searchParticipants}
                            onChange={(e) => setSearchParticipants(e.target.value)}
                            className="h-8 text-sm border-gray-300 focus:border-blue-500"
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        {users
                          .filter(
                            (user) =>
                              !formData.participants.includes(user.id) &&
                              user.id !== formData.assignee &&
                              (user.name.toLowerCase().includes(searchParticipants.toLowerCase()) ||
                               user.email.toLowerCase().includes(searchParticipants.toLowerCase()))
                          )
                          .map((user) => (
                            <SelectItem
                              key={user.id}
                              value={user.id}
                              className="hover:bg-blue-50"
                            >
                              <div className="flex items-center gap-3 py-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {/* Hiển thị danh sách participants đã chọn */}
                    {formData.participants.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-sm text-gray-600">Đã chọn:</div>
                        <div className="flex flex-wrap gap-2">
                          {formData.participants.map((participantId) => {
                            const user = users.find(
                              (u) => u.id === participantId
                            );
                            return user ? (
                              <div
                                key={participantId}
                                className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                              >
                                <span>{user.name}</span>
                                <button
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      participants: prev.participants.filter(
                                        (id) => id !== participantId
                                      ),
                                    }))
                                  }
                                  className="text-green-600 hover:text-green-800"
                                >
                                  ×
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    Thời gian
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Ngày bắt đầu
                    </Label>
                    <Input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          start_date: e.target.value,
                        }))
                      }
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Ngày kết thúc
                    </Label>
                    <Input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          end_date: e.target.value,
                        }))
                      }
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  Mô tả chi tiết
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TiptapEditor
                  content={formData.description || ""}
                  onChange={(content) =>
                    setFormData((prev) => ({ ...prev, description: content }))
                  }
                  placeholder="Nhập mô tả chi tiết về hoạt động..."
                  readOnly={isSubmitting}
                />
              </CardContent>
            </Card>

            {/* Note Result - Only show when editing */}
            {selectedActivity?.id && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    Ghi chú kết quả
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Activity Status */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Trạng thái hoạt động
                    </Label>
                    <Select
                      value={formData.activity_status}
                      onValueChange={(value:any) =>
                        setFormData((prev) => ({
                          ...prev,
                          activity_status: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                        <SelectItem value="completed">Hoàn thành</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Result */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Kết quả
                    </Label>
                    <Select
                      value={formData.result}
                      onValueChange={(value:any) =>
                        setFormData((prev) => ({
                          ...prev,
                          result: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white">
                        <SelectValue placeholder="Chọn kết quả" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Đang chờ</SelectItem>
                        <SelectItem value="pass">Đạt</SelectItem>
                        <SelectItem value="fail">Không đạt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Note Result */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Ghi chú chi tiết
                    </Label>
                    <Textarea
                      value={formData.noteresult}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          noteresult: e.target.value,
                        }))
                      }
                      placeholder="Nhập ghi chú về kết quả hoạt động..."
                      className="min-h-24 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                      disabled={isSubmitting}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Ghi chú này sẽ được lưu cho từng ứng viên trong hoạt động
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Conditional Fields based on Activity Type */}
            {formData.type === "test" && (
              <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-50 to-red-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Cấu hình bài thi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={formData.test_id}
                    onValueChange={(value:any) =>
                      setFormData((prev) => ({ ...prev, test_id: value }))
                    }
                  >
                    <SelectTrigger className="h-14 border-orange-200 focus:border-orange-500 focus:ring-orange-500/20 bg-white">
                      <SelectValue placeholder="Chọn đề thi phù hợp" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-0 shadow-xl max-h-80">
                      {tests.map((test) => (
                        <SelectItem
                          key={test.id}
                          value={test.id}
                          className="hover:bg-orange-50 p-4"
                        >
                          <div className="flex flex-col gap-3 w-full">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-base">
                                  {test.title}
                                </div>
                                {test.description && (
                                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {test.description}
                                  </div>
                                )}
                              </div>
                              {test.code && (
                                <Badge className="bg-orange-100 text-orange-800 border-orange-200 ml-3">
                                  {test.code}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm">
                              {test.duration && (
                                <div className="flex items-center gap-1 text-orange-600">
                                  <Clock className="w-4 h-4" />
                                  <span>{test.duration} phút</span>
                                </div>
                              )}
                              {(test.questionCount || test.totalQuestions) && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <FileText className="w-4 h-4" />
                                  <span>
                                    {test.questionCount || test.totalQuestions}{" "}
                                    câu
                                  </span>
                                </div>
                              )}
                              {test.settings?.solanThi && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-xs">
                                    🔄
                                  </div>
                                  <span>{test.settings.solanThi} lần</span>
                                </div>
                              )}
                              {test.settings?.quydinhDiemThi && (
                                <div className="flex items-center gap-1 text-purple-600">
                                  <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center text-xs">
                                    🎯
                                  </div>
                                  <span>
                                    Điểm qua: {test.settings.quydinhDiemThi}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Send Email Button - Only show when editing */}
                  {selectedActivity?.id && formData.test_id && (
                    <Button
                      onClick={() => {
                        if (!formData.test_id || formData.selectedCandidates.length === 0) {
                          toast.error("Vui lòng chọn đề thi và ứng viên");
                          return;
                        }
                        setIsEmailTemplateModalOpen(true);
                      }}
                      disabled={isSubmitting || !formData.test_id || formData.selectedCandidates.length === 0}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Gửi email thông báo đề thi
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {formData.type === "interview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-purple-800">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      Ngày phỏng vấn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="datetime-local"
                      value={formData.interview_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          interview_date: e.target.value,
                        }))
                      }
                      className="h-12 border-purple-200 focus:border-purple-500 focus:ring-purple-500/20 bg-white"
                      required
                    />
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-indigo-800">
                      <Monitor className="w-5 h-5 text-indigo-600" />
                      Loại phỏng vấn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={formData.interview_type}
                      onValueChange={(value:any) =>
                        setFormData((prev) => ({
                          ...prev,
                          interview_type: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-12 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white">
                        <SelectValue placeholder="Chọn loại phỏng vấn" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-0 shadow-xl">
                        <SelectItem
                          value="online"
                          className="hover:bg-indigo-50"
                        >
                          <div className="flex items-center gap-3 py-2">
                            <Monitor className="w-5 h-5 text-indigo-600" />
                            <div>
                              <div className="font-medium">
                                Phỏng vấn Online
                              </div>
                              <div className="text-sm text-gray-500">
                                Google Meet / Zoom
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="offline"
                          className="hover:bg-indigo-50"
                        >
                          <div className="flex items-center gap-3 py-2">
                            <MapPin className="w-5 h-5 text-indigo-600" />
                            <div>
                              <div className="font-medium">
                                Phỏng vấn Trực tiếp
                              </div>
                              <div className="text-sm text-gray-500">
                                Tại văn phòng
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {formData.interview_type === "online" ? (
                  <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-teal-50 lg:col-span-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-green-800">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <Mail className="w-3 h-3 text-green-600" />
                        </div>
                        Link phỏng vấn
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input
                        type="url"
                        value={formData.interview_link}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            interview_link: e.target.value,
                          }))
                        }
                        placeholder="https://meet.google.com/abc-defg-hij"
                        className="h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 bg-white"
                        required
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="shadow-lg border-0 bg-gradient-to-r from-red-50 to-pink-50 lg:col-span-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-red-800">
                        <MapPin className="w-5 h-5 text-red-600" />
                        Địa điểm phỏng vấn
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        placeholder="Văn phòng Hà Nội, Tầng 5, Phòng họp A"
                        className="h-12 border-red-200 focus:border-red-500 focus:ring-red-500/20 bg-white"
                        required
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Email Notification */}
            {(formData.type === "interview" || formData.type === "test") && (
              <Card className="shadow-lg border-0 bg-gradient-to-r from-emerald-50 to-cyan-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <Mail className="w-5 h-5 text-emerald-600" />
                    Thông báo email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="send_email"
                      checked={formData.send_email}
                      onCheckedChange={(checked:any) => {
                        setFormData((prev) => ({
                          ...prev,
                          send_email: !!checked,
                          template_id: checked ? prev.template_id : "",
                        }));
                      }}
                      className="mt-1"
                    />
                    <div className="space-y-1 flex-1">
                      <Label
                        htmlFor="send_email"
                        className="text-base font-medium text-gray-900 cursor-pointer"
                      >
                        Gửi email thông báo tự động
                      </Label>
                      <p className="text-sm text-gray-600">
                        Email sẽ được gửi tới tất cả ứng viên được chọn sau khi
                        tạo hoạt động
                      </p>
                    </div>
                  </div>

                  {formData.send_email && (
                    <div className="pl-6 border-l-2 border-emerald-200">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Chọn mẫu email <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.template_id}
                        onValueChange={(value:any) =>
                          setFormData((prev) => ({
                            ...prev,
                            template_id: value,
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white">
                          <SelectValue placeholder="Chọn mẫu email phù hợp" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-0 shadow-xl">
                          {loadingTemplates ? (
                            <SelectItem disabled value="loading">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Đang tải...
                            </SelectItem>
                          ) : templates.filter((t) => t.type === formData.type)
                              .length === 0 ? (
                            <SelectItem disabled value="no-templates">
                              Không có mẫu phù hợp
                            </SelectItem>
                          ) : (
                            templates
                              .filter((t) => t.type === formData.type)
                              .map((template) => (
                                <SelectItem
                                  key={template.id}
                                  value={template.id}
                                  className="hover:bg-emerald-50"
                                >
                                  <div className="flex flex-col py-2">
                                    <span className="font-medium">
                                      {template.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {template.subject}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Preview Section */}
            {formData.type === "test" && formData.test_id && (
              <Card className="shadow-lg border-0 bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-indigo-800">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Xem trước đề thi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-6 bg-white rounded-xl shadow-sm border border-indigo-200">
                    <div className="font-mono text-sm text-indigo-600 break-all mb-4 p-3 bg-indigo-50 rounded-lg">
                      {`${
                        process.env.NEXT_PUBLIC_BASE_URL ||
                        window.location.origin
                      }/examhr/dethipublic/${formData.test_id}`}
                    </div>
                    {(() => {
                      const test = tests.find((t) => t.id === formData.test_id);
                      return (
                        test && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-indigo-600" />
                              <span className="font-semibold text-gray-900">
                                {test.title}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {test.code && (
                                <div className="flex items-center gap-2 text-sm bg-blue-100 px-3 py-2 rounded-lg">
                                  <span className="font-medium">📝</span>
                                  <span>{test.code}</span>
                                </div>
                              )}
                              {(test.questionCount || test.totalQuestions) && (
                                <div className="flex items-center gap-2 text-sm bg-green-100 px-3 py-2 rounded-lg">
                                  <FileText className="w-3 h-3" />
                                  <span>
                                    {test.questionCount || test.totalQuestions}{" "}
                                    câu
                                  </span>
                                </div>
                              )}
                              {test.duration && (
                                <div className="flex items-center gap-2 text-sm bg-orange-100 px-3 py-2 rounded-lg">
                                  <Clock className="w-3 h-3" />
                                  <span>{test.duration} phút</span>
                                </div>
                              )}
                              {test.settings?.quydinhDiemThi && (
                                <div className="flex items-center gap-2 text-sm bg-purple-100 px-3 py-2 rounded-lg">
                                  <CheckSquare className="w-3 h-3" />
                                  <span>
                                    Điểm qua: {test.settings.quydinhDiemThi}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.type === "interview" && formData.interview_date && (
              <Card className="shadow-lg border-0 bg-gradient-to-r from-teal-50 to-cyan-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-teal-800">
                    <Calendar className="w-5 h-5 text-teal-600" />
                    Xem trước lịch phỏng vấn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-6 bg-white rounded-xl shadow-sm border border-teal-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <span className="font-semibold text-gray-900">
                            {formData.interview_date
                              ? new Date(
                                  formData.interview_date
                                ).toLocaleString("vi-VN", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Chưa đặt lịch"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-teal-600" />
                          <span className="text-gray-700">
                            {formData.interview_type === "online"
                              ? "Phỏng vấn Online"
                              : "Phỏng vấn Trực tiếp"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {formData.interview_type === "online" ? (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                                <Mail className="w-3 h-3 text-teal-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                Link phỏng vấn
                              </span>
                            </div>
                            <div className="font-mono text-sm text-teal-600 break-all p-2 bg-teal-50 rounded">
                              {formData.interview_link || "Chưa nhập link"}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-4 h-4 text-teal-600" />
                              <span className="text-sm font-medium text-gray-700">
                                Địa điểm
                              </span>
                            </div>
                            <div className="text-sm text-teal-600 p-2 bg-teal-50 rounded">
                              {formData.location || "Chưa nhập địa điểm"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modern Footer - Fixed */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t flex-shrink-0">
          <div className="text-sm text-gray-600">
            {formData.selectedCandidates.length > 0 && (
              <div>
                <span>
                  Đã chọn {formData.selectedCandidates.length} ứng viên
                </span>
                <div className="mt-2 max-h-20 overflow-y-auto bg-gray-50 rounded p-2">
                  {formData.selectedCandidates
                    .map((candidateId) => {
                      // Ưu tiên hiển thị selectedCandidate nếu có (edit mode)
                      if (selectedCandidate?.id === candidateId) {
                        return selectedCandidate;
                      }
                      // Nếu không có selectedCandidate, tìm trong uniqueCandidates
                      return uniqueCandidates.find((c) => c.id === candidateId);
                    })
                    .filter(Boolean) // Lọc bỏ null nếu không tìm thấy
                    .map((candidate: any) => (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between py-1 text-xs"
                      >
                        <span className="truncate">{candidate.full_name}</span>
                        {candidate.email && (
                          <span className="text-gray-400 ml-2">
                            ({candidate.email})
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 h-11 border-gray-300 hover:bg-gray-50"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !formData.name ||
                formData.selectedCandidates.length === 0
              }
              className="px-6 py-2 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {formData.id ? "Cập nhật hoạt động" : "Tạo hoạt động"}
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
            <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError("")}
              className="text-white hover:bg-red-600 p-1 h-auto"
            >
              ×
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Email Template Selection Modal */}
      <Dialog open={isEmailTemplateModalOpen} onOpenChange={setIsEmailTemplateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogTitle className="text-xl font-semibold text-gray-900 mb-4">
            Chọn mẫu email thông báo
          </DialogTitle>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Chọn mẫu email phù hợp để gửi thông báo bài thi cho {formData.selectedCandidates.length} ứng viên đã chọn.
            </div>

            {/* Template Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Chọn mẫu email <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedEmailTemplate}
                onValueChange={setSelectedEmailTemplate}
              >
                <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white">
                  <SelectValue placeholder="Chọn mẫu email phù hợp" />
                </SelectTrigger>
                <SelectContent className="bg-white border-0 shadow-xl">
                  {loadingTemplates ? (
                    <SelectItem disabled value="loading">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Đang tải...
                    </SelectItem>
                  ) : templates.filter((t) => t.type === "test").length === 0 ? (
                    <SelectItem disabled value="no-templates">
                      Không có mẫu phù hợp
                    </SelectItem>
                  ) : (
                    templates
                      .filter((t) => t.type === "test")
                      .map((template) => (
                        <SelectItem
                          key={template.id}
                          value={template.id}
                          className="hover:bg-blue-50"
                        >
                          <div className="flex flex-col py-2">
                            <span className="font-medium">
                              {template.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {template.subject}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Candidates Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Ứng viên sẽ nhận email:
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {formData.selectedCandidates
                  .map((candidateId) => {
                    // Ưu tiên hiển thị selectedCandidate nếu có (edit mode)
                    if (selectedCandidate?.id === candidateId) {
                      return selectedCandidate;
                    }
                    // Nếu không có selectedCandidate, tìm trong uniqueCandidates
                    return uniqueCandidates.find((c) => c.id === candidateId);
                  })
                  .filter(Boolean)
                  .map((candidate: any) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between py-1 text-xs bg-white rounded px-2"
                    >
                      <span className="font-medium">{candidate.full_name}</span>
                      <span className="text-gray-500">{candidate.email || "Chưa có email"}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsEmailTemplateModalOpen(false);
                setSelectedEmailTemplate("");
              }}
              disabled={isSubmitting}
              className="px-6 py-2 h-11 border-gray-300 hover:bg-gray-50"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleSendEmailWithTemplate}
              disabled={isSubmitting || !selectedEmailTemplate}
              className="px-6 py-2 h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Xác nhận gửi email
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default ActivityDrawer;
