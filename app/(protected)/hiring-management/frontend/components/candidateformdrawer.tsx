"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/app/frontend/components/ui/dialog";
import { Button } from "@/app/frontend/components/ui/button";
import { Label } from "@/app/frontend/components/ui/label";
import { Input } from "@/app/frontend/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/frontend/components/ui/card";
import {
  User,
  Briefcase,
  Star,
  Mail,
  Calendar,
  MapPin,
  Calendar as CalendarIcon,
  X,
  Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/frontend/components/ui/select";
import React from "react";

interface Candidate {
  id: string;
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
  createdOn?: string;
}

interface CandidateFormData {
  full_name: string;
  email: string;
  birthdate: string;
  gender: string;
  position: string;
  experience: string;
  source: string;
  strengths: string;
  weaknesses: string;
  skills: string;
  note: string;
  evaluation: string;
  pipeline_status: string;
  cv_link: string;
  fit_score: number | null;
}

interface CandidateFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCandidate: Candidate | null;
  formData: CandidateFormData;
  onFormDataChange: (data: CandidateFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isCreating: boolean;
  isUpdating: boolean;
}

export default function CandidateFormDialog({
  isOpen,
  onOpenChange,
  selectedCandidate,
  formData,
  onFormDataChange,
  onSubmit,
  isCreating,
  isUpdating,
}: CandidateFormDialogProps) {
  const handleInputChange = (field: keyof CandidateFormData, value: string | number | null) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm border border-blue-100 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-6 mt-10 relative">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <User size={24} />
            {selectedCandidate ? "Chỉnh Sửa Ứng viên" : "Thêm Ứng viên Mới"}
          </DialogTitle>
          <DialogDescription className="text-blue-100 mt-2">
            {selectedCandidate ? "Cập nhật thông tin ứng viên để phù hợp với quy trình tuyển dụng." : "Thêm ứng viên mới vào hệ thống tuyển dụng."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <User size={20} className="text-blue-600" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700">Họ và Tên *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Nhập họ tên"
                    required
                    className="h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Nhập email"
                    className="h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="birthdate" className="text-sm font-semibold text-gray-700">Ngày Sinh</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={formData.birthdate ? formData.birthdate.split('T')[0] : ''}
                    onChange={(e) => handleInputChange('birthdate', e.target.value ? e.target.value + 'T00:00:00' : '')}
                    className="h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">Giới tính</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value:any) => handleInputChange('gender', value)}
                  >
                    <SelectTrigger className="w-full h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nam">Nam</SelectItem>
                      <SelectItem value="Nữ">Nữ</SelectItem>
                      <SelectItem value="Khác">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Briefcase size={20} className="text-green-600" />
                Thông tin nghề nghiệp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-semibold text-gray-700">Vị trí ứng tuyển</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="Nhập vị trí"
                    className="h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source" className="text-sm font-semibold text-gray-700">Nguồn CV</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    placeholder="Ví dụ: LinkedIn, TopCV"
                    className="h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-semibold text-gray-700">Kinh nghiệm</Label>
                  <Input
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    placeholder="Ví dụ: 3 năm"
                    className="h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pipeline_status" className="text-sm font-semibold text-gray-700">Trạng thái</Label>
                  <Select
                    value={formData.pipeline_status}
                    onValueChange={(value:any) => handleInputChange('pipeline_status', value)}
                  >
                    <SelectTrigger className="w-full h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Chờ xử lý</SelectItem>
                      <SelectItem value="interview">Đang xử lý</SelectItem>
                      <SelectItem value="hired">Đã tuyển</SelectItem>
                      <SelectItem value="rejected">Từ chối</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fit_score" className="text-sm font-semibold text-gray-700">Điểm phù hợp (%)</Label>
                  <Input
                    id="fit_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.fit_score || ""}
                    onChange={(e) => handleInputChange('fit_score', e.target.value ? Number(e.target.value) : null)}
                    placeholder="0-100"
                    className="h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cv_link" className="text-sm font-semibold text-gray-700">Link CV</Label>
                <Input
                  id="cv_link"
                  type="url"
                  value={formData.cv_link}
                  onChange={(e) => handleInputChange('cv_link', e.target.value)}
                  placeholder="https://..."
                  className="h-11 border-green-200 focus:border-green-400 focus:ring-green-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills and Assessment */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-100">
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Star size={20} className="text-yellow-500" />
                Kỹ năng & Đánh giá
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="skills" className="text-sm font-semibold text-gray-700">Kỹ năng</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                  placeholder="Ví dụ: React, Node.js, Python"
                  className="h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="strengths" className="text-sm font-semibold text-gray-700">Điểm mạnh</Label>
                  <Input
                    id="strengths"
                    value={formData.strengths}
                    onChange={(e) => handleInputChange('strengths', e.target.value)}
                    placeholder="Nhập điểm mạnh"
                    className="h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weaknesses" className="text-sm font-semibold text-gray-700">Điểm cần cải thiện</Label>
                  <Input
                    id="weaknesses"
                    value={formData.weaknesses}
                    onChange={(e) => handleInputChange('weaknesses', e.target.value)}
                    placeholder="Nhập điểm cần cải thiện"
                    className="h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter className="bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex gap-3 w-full">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isCreating || isUpdating}
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isCreating || isUpdating ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Đang xử lý...
                </>
              ) : (selectedCandidate ? "Cập Nhật Ứng viên" : "Tạo Ứng viên Mới")}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 font-semibold"
            >
              Hủy
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}