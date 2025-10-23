import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/frontend/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/frontend/components/ui/dialog";
import { Button } from "@/app/frontend/components/ui/button";

interface Test {
  id: string;
  email: string;
  diemSo: number;
  soCauDung?: number;
  solanthi?: number;
  ngayThi?: string;
  ngayNop?: string;
  tenDeThi?: string;
  noiDungBaiThi?: Array<{
    noiDung: string;
    dapAnUngVien: string;
    dapAnDung: string;
    dungSai: boolean;
  }>;
  link?: string; // Thêm trường link để lấy exam title
}

interface InterviewDetailsPanelProps {
  danhSachBaiThi: Test[];
  candidate: any | undefined;
  getExamTitle: (link: string) => string;
}

export function InterviewDetailsPanel({ danhSachBaiThi, candidate, getExamTitle }: InterviewDetailsPanelProps) {
  // Nếu không có bài thi, trả về null
  if (!danhSachBaiThi || danhSachBaiThi.length === 0) return null;
  console.log("danh sách bài thi",danhSachBaiThi)
  return (
    <TableRow>
      <TableCell colSpan={10} className="p-0 bg-gray-50">
        <div className="p-6 border-t border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Chi tiết bài thi</h3>
            <p className="text-sm text-gray-600">Kết quả chi tiết của các bài thi</p>
          </div>
          
          <div className="bg-white rounded-[4px] border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vị trí tuyển dụng</TableHead>
                  <TableHead>Đề thi</TableHead>
                  <TableHead>Điểm số</TableHead>
                  <TableHead>Số câu đúng</TableHead>
                  <TableHead>Lần thi</TableHead>
                  <TableHead>Ngày thi</TableHead>
                  <TableHead>Ngày nộp</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSachBaiThi.map((baiThi) => (
                  <TableRow key={baiThi.id}>
                    <TableCell className="font-medium">{candidate?.full_name || 'Không xác định'}</TableCell>
                    <TableCell>{candidate?.email || 'Chưa có'}</TableCell>
                    <TableCell>{candidate?.position || 'Không xác định'}</TableCell>
                    <TableCell>{baiThi.tenDeThi}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-[4px] text-sm font-medium bg-blue-100 text-blue-800">
                        {baiThi.diemSo}
                      </span>
                    </TableCell>
                    <TableCell>{baiThi.soCauDung || "0"}</TableCell>
                    <TableCell>{baiThi.solanthi || 1}</TableCell>
                    <TableCell>
                      {baiThi.ngayThi ? new Date(baiThi.ngayThi).toLocaleString('vi-VN') : '-'}
                    </TableCell>
                    <TableCell>
                      {baiThi.ngayNop ? new Date(baiThi.ngayNop).toLocaleString('vi-VN') : '-'}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300">
                            Xem bài làm
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Chi tiết bài làm - {candidate?.full_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {baiThi.noiDungBaiThi?.map((cauHoi: any, index: number) => (
                              <div key={index} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                                <div className="mb-3">
                                  <p className="font-semibold text-gray-900">Câu hỏi {index + 1}:</p>
                                  <p className="mt-1 text-gray-700">{cauHoi.noiDung}</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="font-medium text-gray-700">Đáp án của ứng viên:</p>
                                    <p className="mt-1 p-2 bg-blue-50 rounded border">
                                      {cauHoi.dapAnUngVien || 'Chưa trả lời'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-700">Đáp án đúng:</p>
                                    <p className="mt-1 p-2 bg-green-50 rounded border">
                                      {cauHoi.dapAnDung || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="mt-3 text-right">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    cauHoi.dungSai 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {cauHoi.dungSai ? '✓ Đúng' : '✗ Sai'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}