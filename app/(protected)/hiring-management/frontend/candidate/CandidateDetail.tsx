"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/app/frontend/components/ui/button";
import { Badge } from "@/app/frontend/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/frontend/components/ui/card";
import { Avatar, AvatarFallback } from "@/app/frontend/components/ui/avatar";
import { 
  ArrowLeft, 
  ExternalLink, 
  User, 
  Mail, 
  Calendar, 
  Briefcase, 
  Star, 
  Edit3,
  ChevronLeft,
  AlertTriangle,
  FileText,
  MapPin,
  Phone,
  GraduationCap,
  Clock,
  Loader2,
  Save,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { candidateService } from "../services/candidateService";
import { useQueryClient } from "@tanstack/react-query";
import TiptapEditor from "../components/TiptapEditor";

export interface Candidate {
  id: string;
  full_name: string;
  email?: string | null;
  birthdate?: string | null;
  gender?: string | null;
  position?: string | null;
  experience?: string | null;
  source?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  skills?: string | null;
  pipeline_status?: string | null;
  cv_link?: string | null;
  fit_score?: number | null;
  createdOn?: string;
  reject_reason?: string | null;
  note?: string | null;
  cv_summary?: string | null;
  evaluation?: string | null;
  job?: {
    title: string;
  } | null;
  stage?: {
    id: string;
    name: string;
  } | null;
}

interface CandidateDetailProps {
  candidateId: string;
  onBack: () => void;
  className?: string;
}

export function CandidateDetail({ candidateId, onBack, className = '' }: CandidateDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSaveNote = async () => {
    if (!candidate || isSaving) return;
    
    setIsSaving(true);
    try {
      const data = await candidateService.updateNote({
        id: candidate.id,
        note: noteContent
      });
  
      setCandidate(prev => prev ? { ...prev, note: data.data.note } : null);
      toast.success('Đã lưu ghi chú thành công');
      setIsEditingNote(false);

      // Invalidate the candidates query cache so the table shows updated data
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    } catch (error) {
      console.error('Lỗi khi lưu ghi chú:', error);
      toast.error('Không thể lưu ghi chú');
    } finally {
      setIsSaving(false);
    }
  };

  // Update note content when candidate data changes
  useEffect(() => {
    if (candidate) {
      setNoteContent(candidate.note || '');
    }
  }, [candidate]);

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!candidateId) return;
      
      try {
        setIsLoading(true);
        const data = await candidateService.getById(candidateId);
        setCandidate(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching candidate:", err);
        setError(err instanceof Error ? err.message : "Failed to load candidate data");
        toast.error("Không thể tải thông tin ứng viên");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Chưa cập nhật";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, "d '-' M '-' yyyy", { locale: vi });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusBadgeColor = (status: string | null | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    switch(status.toLowerCase()) {
      case 'applied':
        return "bg-blue-100 text-blue-800";
      case 'screening':
        return "bg-yellow-100 text-yellow-800";
      case 'interview':
        return "bg-purple-100 text-purple-800";
      case 'offer':
        return "bg-green-100 text-green-800";
      case 'hired':
        return "bg-green-500 text-white";
      case 'rejected':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string | null | undefined) => {
    if (!status) return "Chưa cập nhật";
    
    switch(status.toLowerCase()) {
      case 'applied':
        return "Đã ứng tuyển";
      case 'screening':
        return "Đang sàng lọc";
      case 'interview':
        return "Phỏng vấn";
      case 'offer':
        return "Đề xuất";
      case 'hired':
        return "Đã tuyển dụng";
      case 'rejected':
        return "Đã từ chối";
      default:
        return status;
    }
  };

  const handleViewCV = (cvLink: string) => {
    if (!cvLink) return;
    window.open(cvLink, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Đang tải thông tin ứng viên...</p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Không thể tải thông tin ứng viên</h3>
        <p className="text-gray-600 mb-4">{error || "Không tìm thấy thông tin ứng viên"}</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>  
      <div className="flex items-center mb-6 justify-end gap-2">
        {/* <Button variant="outline" onClick={() => router.push(`/hiring-management/candidate/edit/${candidate.id}`)}>
          <Edit3 className="h-4 w-4 mr-2" />
          Chỉnh sửa
        </Button> */}
        
        {candidate.cv_link && (
          <Button variant="outline" onClick={() => handleViewCV(candidate.cv_link!)}>
            <FileText className="h-4 w-4 mr-2" />
            Xem CV
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border-0 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 pb-6 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl">
                {getInitials(candidate.full_name || '')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{candidate.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">{candidate.position || candidate.job?.title || 'Chưa cập nhật'}</span>
                {candidate.fit_score !== undefined && candidate.fit_score !== null && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span>Điểm phù hợp: {candidate.fit_score}%</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
          <Badge
    className={`px-3 py-1 text-sm font-medium ${getStatusBadgeColor(candidate.pipeline_status)} hover:bg-inherit hover:text-inherit`}
  >
    {getStatusText(candidate.pipeline_status)}
  </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin cá nhân */}
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Thông tin cá nhân
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm leading-none">{candidate.email || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Ngày sinh</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm leading-none">{formatDate(candidate.birthdate)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Giới tính</p>
                    <span className="text-sm leading-none">{candidate.gender || 'Chưa cập nhật'}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Kinh nghiệm</p>
                    <span className="text-sm leading-none">{candidate.experience || 'Chưa cập nhật'}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Nguồn ứng viên</p>
                    <span className="text-sm leading-none">{candidate.source || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kỹ năng */}
            {candidate.skills && (
              <Card className="border-0 shadow-none">
                <CardContent className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    Kỹ năng
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.split(',').map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-sm font-normal">
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tóm tắt CV */}
            {candidate.cv_summary && (
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Tóm tắt CV
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-line">{candidate.cv_summary}</p>
                </div>
              </CardContent>
            </Card>
          )}

            {/* Ghi chú */}
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Ghi chú
                  </h3>
                  {!isEditingNote && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingNote(true)}
                      className="h-8 px-2 text-xs"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1" />
                      Chỉnh sửa
                    </Button>
                  )}
                </div>
                
                {isEditingNote ? (
                  <div className="space-y-2">
                    <TiptapEditor
                      content={noteContent}
                      onChange={setNoteContent}
                      placeholder="Thêm ghi chú về ứng viên..."
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingNote(false);
                          setNoteContent(candidate.note || '');
                        }}
                        disabled={isSaving}
                      >
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveNote}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Lưu ghi chú
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="prose prose-sm max-w-none min-h-[120px] max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-md"
                    onClick={() => setIsEditingNote(true)}
                  >
                    {candidate.note ? (
                      <div dangerouslySetInnerHTML={{ __html: candidate.note }} />
                    ) : (
                      <p className="text-gray-400 italic">Nhấn để thêm ghi chú...</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card> 
          </div>

          <div className="space-y-6">
            {/* Điểm mạnh & Điểm yếu */}
            {(candidate.strengths || candidate.weaknesses) && (
              <div className="flex flex-col gap-6">
                {candidate.strengths && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-green-700">Điểm mạnh</h3>
                        <Card className="border border-green-100 bg-green-50 rounded-lg">
                        <CardContent className="p-4">
                            <p className="text-sm text-gray-700">{candidate.strengths}</p>
                        </CardContent>
                        </Card>
                    </div>
                )}

                {candidate.weaknesses && (
                  <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-red-700">Điểm yếu</h3>
                      <Card className="border border-red-100 bg-red-50 rounded-lg">
                      <CardContent className="p-4">
                          <p className="text-sm text-gray-700">{candidate.weaknesses}</p>
                      </CardContent>
                      </Card>
                  </div>
                )}
              </div>
            )}

            {/* Đánh giá */}
            {candidate.evaluation && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-700">Đánh giá</h3>
                <Card className="border border-blue-100 bg-blue-50 rounded-lg">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{candidate.evaluation}</p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Lịch sử ứng tuyển */}
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Lịch sử ứng tuyển
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mt-1.5"></div>
                      <div className="w-px h-full bg-gray-200 my-1"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Đã ứng tuyển</p>
                      <p className="text-xs text-gray-500">{formatDate(candidate.createdOn)}</p>
                      {candidate.job?.title && (
                        <p className="text-xs mt-1">Vị trí: {candidate.job.title}</p>
                      )}
                    </div>
                  </div>
                  
                  {candidate.pipeline_status && (
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 mt-1.5"></div>
                        <div className="w-px h-full bg-gray-200 my-1"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {getStatusText(candidate.pipeline_status)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {candidate.stage?.name || 'Đang cập nhật'}
                        </p>
                        {candidate.reject_reason && (
                          <div className="mt-1 text-xs">
                            <p className="font-medium">Lý do từ chối:</p>
                            <p className="text-gray-600">{candidate.reject_reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
