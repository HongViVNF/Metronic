import React, { useState } from "react";
import {
  X,
  Calendar,
  MapPin,
  Star,
  Mail,
  Phone,
  User,
  FileText,
  AlertCircle,
  ExternalLink,
  Edit3,
  Trash2,
  StickyNote,
  Clock,
  Activity,
} from "lucide-react";
import { Button } from "@/app/frontend/components/ui/button";
import { Badge } from "@/app/frontend/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/frontend/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/frontend/components/ui/tabs";
import { fetchStages, moveCandidates } from "../services/stageService";
import Timeline from "./timeline";
import ActivityTabCandidate from "./activitytab";

interface CandidateTableDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any; // Sử dụng any để tương thích với interface trong candidatetable
  job?: {
    title: string;
  } | null;
}

const CandidateTableDetailModal: React.FC<CandidateTableDetailModalProps> = ({
  isOpen,
  onClose,
  candidate,
  job,
}) => {
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  // Always call hooks first
  // Fetch stages for the job
  const { data: jobStages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ["job-stages", candidate?.job_id || ""],
    queryFn: async () => {
      if (!candidate?.job_id) return [];
      const response = await fetch(
        `/hiring-management/api/job/${candidate.job_id}/stages`
      );
      if (!response.ok) throw new Error("Failed to fetch stages");
      const result = await response.json();
      return result.stages || [];
    },
    enabled: !!candidate?.job_id && isOpen,
  });

  // Mutation to update candidate stage
  const updateStageMutation = useMutation({
    mutationFn: ({
      candidateId,
      stageId,
    }: {
      candidateId: string;
      stageId: string;
    }) => moveCandidates({ candidateIds: [candidateId], stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({
        queryKey: ["candidates", candidate?.job_id],
      });
      setIsMoveModalOpen(false);
      setSelectedStageId("");
      toast.success("Đã di chuyển ứng viên thành công");
      onClose(); // Close detail modal after successful move
    },
    onError: (error) => {
      console.error("Error updating candidate stage:", error);
      toast.error("Không thể di chuyển ứng viên");
    },
  });

  // Early return after hooks
  if (!isOpen || !candidate) return null;

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "rounded-[4px] bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "interview":
        return "rounded-[4px] bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "hired":
        return "rounded-[4px] bg-green-100 text-green-800 hover:bg-green-200";
      case "rejected":
        return "rounded-[4px] bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "rounded-[4px] bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const handleMoveCandidate = () => {
    setIsMoveModalOpen(true);
  };

  const handleConfirmMove = () => {
    if (!selectedStageId) {
      toast.error("Vui lòng chọn stage");
      return;
    }

    updateStageMutation.mutate({
      candidateId: candidate.id,
      stageId: selectedStageId,
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={32} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {candidate.full_name}
                </h3>
                <p className="text-gray-600">
                  {candidate.position || "Chưa cập nhật vị trí"}
                </p>
                <div className="w-14 h-13 flex items-center justify-center rounded-full text-lg font-semibold bg-blue-100 text-blue-700">
                  {candidate.fit_score ? `${candidate.fit_score}%` : ""}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {candidate.cv_link && (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => window.open(candidate.cv_link, "_blank")}
                    className="flex items-center gap-2 bg-gray-500 text-white hover:bg-gray-600 hover:text-white"
                  >
                    <ExternalLink size={16} />
                    Xem CV
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleMoveCandidate}
                className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
              >
                Cập nhật trạng thái
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:bg-red-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex-shrink-0 border-b border-gray-200">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="activity">Hoạt động</TabsTrigger>
                <TabsTrigger value="note">Note</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <User size={20} />
                      Thông tin cơ bản
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-gray-500" />
                        <span className="text-gray-700">{candidate.email}</span>
                      </div>
                      {candidate.birthdate && (
                        <div className="flex items-center gap-3">
                          <Calendar size={16} className="text-gray-500" />
                          <span className="text-gray-700">
                            {new Date(candidate.birthdate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        </div>
                      )}
                      {candidate.experience && (
                        <div className="flex items-center gap-3">
                          <MapPin size={16} className="text-gray-500" />
                          <span className="text-gray-700">
                            {candidate.experience} năm kinh nghiệm
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Star size={16} className="text-gray-500" />
                        <span className="text-gray-700">
                          Điểm phù hợp:{" "}
                          {candidate.fit_score
                            ? `${candidate.fit_score}%`
                            : "Chưa có"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Trạng thái & Giai đoạn
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge
                          className={getStatusBadgeColor(
                            candidate.pipeline_status || "pending"
                          )}
                        >
                          {candidate.pipeline_status === "pending" &&
                            "Chờ xử lý"}
                          {candidate.pipeline_status === "interviewing" &&
                            "Interview"}
                          {candidate.pipeline_status === "testing" && "Test"}
                          {candidate.pipeline_status === "tested" && "Tested"}
                          {candidate.pipeline_status === "reject" && "Từ chối"}
                          {candidate.pipeline_status ===
                            "accepted_assessment" && "Interviewed"}
                          {!candidate.pipeline_status && "Chờ xử lý"}
                        </Badge>
                      </div>
                      {candidate.stage_name && (
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-gray-500" />
                          <span className="text-gray-700">
                            Giai đoạn: {candidate.stage_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {candidate.skills && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Kỹ năng
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills
                        .split(",")
                        .map((skill: string, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-blue-50 text-blue-700"
                          >
                            {skill.trim()}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {/* Strengths and Weaknesses */}
                {(candidate.strengths || candidate.weaknesses) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {candidate.strengths && (
                      <div className="space-y-3">
                        <h4 className="text-lg font-semibold text-green-700">
                          Điểm mạnh
                        </h4>
                        <p className="text-gray-700 bg-green-50 p-3 rounded-lg">
                          {candidate.strengths}
                        </p>
                      </div>
                    )}
                    {candidate.weaknesses && (
                      <div className="space-y-3">
                        <h4 className="text-lg font-semibold text-red-700">
                          Điểm cần cải thiện
                        </h4>
                        <p className="text-gray-700 bg-red-50 p-3 rounded-lg">
                          {candidate.weaknesses}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Evaluation */}
                {candidate.evaluation && (
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Đánh giá
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{candidate.evaluation}</p>
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Ngày tạo</p>
                    <p className="font-semibold text-gray-900">
                      {candidate.createdOn
                        ? new Date(candidate.createdOn).toLocaleDateString(
                            "vi-VN"
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Nguồn</p>
                    <p className="font-semibold text-gray-900">
                      {candidate.source || "N/A"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Vị trí</p>
                    <p className="font-semibold text-gray-900">
                      {candidate.job?.title || "N/A"}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-6 mt-0">
                <Timeline candidateId={candidate.id} candidate={candidate} />
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6 mt-0">
                <ActivityTabCandidate candidateId={candidate.id} />
              </TabsContent>

              {/* Note Tab */}
              <TabsContent value="note" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <StickyNote size={20} />
                    Ghi chú
                  </h4>

                  {candidate.note ? (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div
                        dangerouslySetInnerHTML={{ __html: candidate.note }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <StickyNote
                        size={48}
                        className="mx-auto mb-4 opacity-50"
                      />
                      <p>Chưa có ghi chú nào</p>
                    </div>
                  )}
                </div>

                {/* Reject Reason */}
                {candidate.pipeline_status === "reject" &&
                  candidate.reject_reason && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                        <AlertCircle size={20} />
                        Lý do từ chối
                      </h4>
                      <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                        <p className="text-red-800">
                          {candidate.reject_reason}
                        </p>
                      </div>
                    </div>
                  )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Move Candidate Modal */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Di chuyển ứng viên
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Chọn stage mới cho {candidate.full_name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMoveModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stage hiện tại:{" "}
                    <span className="font-normal">
                      {candidate.stage_name || "Chưa có"}
                    </span>
                  </label>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn stage mới
                  </label>
                  {stagesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <Select
                      value={selectedStageId}
                      onValueChange={setSelectedStageId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn stage mới..." />
                      </SelectTrigger>
                      <SelectContent>
                        {jobStages
                          .filter(
                            (stage: any) => stage.id !== candidate.stage_id
                          )
                          .map((stage: any) => (
                            <SelectItem key={stage.id} value={stage.id}>
                              {stage.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setIsMoveModalOpen(false)}
                disabled={updateStageMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleConfirmMove}
                disabled={updateStageMutation.isPending || !selectedStageId}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateStageMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang di chuyển...
                  </>
                ) : (
                  "Cập nhật trạng thái"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CandidateTableDetailModal;
