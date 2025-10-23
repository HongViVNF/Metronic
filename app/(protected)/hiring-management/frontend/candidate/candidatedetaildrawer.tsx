"use client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/app/frontend/components/ui/drawer";
import { Button } from "@/app/frontend/components/ui/button";
import { Badge } from "@/app/frontend/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/frontend/components/ui/card";
import { Avatar, AvatarFallback } from "@/app/frontend/components/ui/avatar";
import {    
  ExternalLink,
  User,
  Mail,
  Calendar,
  Building,
  Star,
  Edit3
} from "lucide-react";

interface Candidate {
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
}

interface CandidateDetailDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  onEdit: (candidate: Candidate) => void;
  onViewCV: (cvLink: string) => void;
}

export default function CandidateDetailDrawer({
  isOpen,
  onOpenChange,
  candidate,
  onEdit,
  onViewCV,
}: CandidateDetailDrawerProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('vi-VN');
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'N/A';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'interview': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'hired': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (!candidate) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="fixed right-0 top-0 bottom-0 w-[800px] max-w-[100vw] p-6 bg-white rounded-l-xl shadow-xl flex flex-col overflow-y-auto max-h-screen">
        <DrawerHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <DrawerTitle className="flex items-center gap-3 text-xl">
            <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600">
              <AvatarFallback className="text-white font-bold">
                {getInitials(candidate.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-bold text-gray-900">{candidate.full_name}</div>
              <div className="text-sm text-gray-600">{candidate.position || 'Chưa có vị trí'}</div>
            </div>
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User size={18} className="text-blue-600" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium">{candidate.email || 'Chưa có'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Ngày sinh</div>
                    <div className="font-medium">{candidate.birthdate ? formatDate(candidate.birthdate) : 'Chưa có'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Giới tính</div>
                    <div className="font-medium">{candidate.gender || 'Chưa có'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building size={16} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Nguồn CV</div>
                    <div className="font-medium">{candidate.source || 'Chưa có'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star size={18} className="text-yellow-500" />
                Trạng thái & Đánh giá
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Trạng thái hiện tại</div>
                  <Badge className={getStatusBadgeColor(candidate.pipeline_status || 'pending')}>
                    {candidate.pipeline_status === 'pending' && 'Chờ xử lý'}
                    {candidate.pipeline_status === 'testing' && 'đang làm bài test'}
                    {candidate.pipeline_status === 'interviewing' && 'Đang phỏng vấn'}
                    {candidate.pipeline_status === 'rejected' && 'Từ chối'}
                    {!candidate.pipeline_status && 'Chờ xử lý'}
                  </Badge>
                </div>
                {candidate.fit_score && (
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">Điểm phù hợp</div>
                    <div className="text-2xl font-bold text-blue-600">{candidate.fit_score}%</div>
                  </div>
                )}
              </div>
              
              {candidate.experience && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Kinh nghiệm</div>
                  <div className="font-medium">{candidate.experience}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills & Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-700">Điểm mạnh</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  {candidate.strengths || 'Chưa có thông tin'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-700">Điểm cần cải thiện</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  {candidate.weaknesses || 'Chưa có thông tin'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Skills */}
          {candidate.skills && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kỹ năng</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{candidate.skills}</p>
              </CardContent>
            </Card>
          )}

          {/* CV Link */}
          {candidate.cv_link && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CV</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => onViewCV(candidate.cv_link!)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Xem CV
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <DrawerFooter className="bg-gray-50">
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onOpenChange(false);
                onEdit(candidate);
              }}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Edit3 size={16} className="mr-2" />
              Chỉnh sửa
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">Đóng</Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}