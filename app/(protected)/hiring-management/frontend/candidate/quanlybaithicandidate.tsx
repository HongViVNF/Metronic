'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/app/frontend/components/ui/drawer';
import { Button } from '@/app/frontend/components/ui/button';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Input } from '@/app/frontend/components/ui/input';
type CauHoi = {
  id: number;
  noiDung: string;
  dapAn: string;
  dapAnDung: string;
};

type BaiThi = {
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
  solanthi: number; // Added
  reportCauHoi: string[]; // Added
  ngayPhongVan?: string | null; // Added
  idInterview?: string | null; // Add idInterview to the interface
};

const fetchDanhSachBaiThi = async (): Promise<BaiThi[]> => {
  const state = localStorage.getItem('ai.platform');
  const userId = state ? JSON.parse(state)?.state?.user?.id : '';
  const res = await fetch('/exam/api/listbaithi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-AI-Platform-UserId': userId },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Lỗi khi lấy danh sách bài thi');
  const baiThiData = (await res.json()).data;

  // Fetch interview data
  const interviewRes = await fetch('/elearning/api/interview');
  if (!interviewRes.ok) throw new Error('Lỗi khi lấy dữ liệu phỏng vấn');
  const interviews = (await interviewRes.json()).data;

  // Map interviews to BaiThi by idNV
  const interviewMap = new Map<string, { id: string; ngay: string }>();
  interviews.forEach((interview: { id: string; idNV: string; ngay: string }) => {
    if (interview.idNV) {
      interviewMap.set(interview.idNV, { id: interview.id, ngay: interview.ngay });
    }
  });

  // Merge interview data with BaiThi
  return baiThiData.map((baiThi: BaiThi) => ({
    ...baiThi,
    ngayPhongVan: baiThi.idNV && interviewMap.get(baiThi.idNV)?.ngay || null,
    idInterview: baiThi.idNV && interviewMap.get(baiThi.idNV)?.id || null, // Add idInterview
  }));
};

const deleteBaiThi = async (id: string): Promise<void> => {
  const res = await fetch('/exam/api/listbaithi', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Lỗi khi xóa bài thi');
};

const submitExam = async (examData: {
  idexam: string;
  email: string;
  hoTen: string;
  phongBan: string;
  diem: number;
  soCauDung: number;
  cauHoi: any[];
  ngayNop: string;
}) => {
  const response = await fetch('/exam/api/saveexam', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(examData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Lỗi khi cập nhật bài thi');
  }
  return response.json();
};

const sendCertificateViaApi = async (certificateData: {
  email: string;
  recipientName: string;
  score: number;
  examId: string;
  title: string;
}) => {
  const response = await fetch('/api/sendcertificate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(certificateData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Lỗi khi gửi chứng nhận qua API');
  }
  return response.json();
};
const sendInterviewEmail = async (data: {
  email: string;
  schedule: string;
}) => {
  const response = await fetch('/api/sendinterview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Lỗi khi gửi email phỏng vấn');
  }
  return response.json();
};
export default function QuanLyBaiThi() {
  const [selectedBaiThi, setSelectedBaiThi] = useState<BaiThi | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'uncharged' | 'reported'>('all'); // Added 'reported'
  const [diemCauHoi, setDiemCauHoi] = useState<{ [key: number]: number }>({});
  const [tickCauHoi, setTickCauHoi] = useState<{ [key: number]: 'dung' | 'sai' | null }>({});
  const [chamDiemMode, setChamDiemMode] = useState<'tick' | 'manual'>('manual');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<BaiThi | null>(null);
  
  const handleOpenDrawer = (baiThi: BaiThi) => {
    setCurrentCandidate(baiThi);
    setIsDrawerOpen(true);
  };
  const sendEmailMutation:any = useMutation({
    mutationFn: sendInterviewEmail,
    onSuccess: () => {
      toast.success('Gửi email phỏng vấn thành công!');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi gửi email: ${error.message}`);
    },
  });
  const handleScheduleInterview = async () => {
    if (!currentCandidate || !selectedDate || !danhSachBaiThi) return;

    try {
      // Find interview data from danhSachBaiThi
      const interviewData = danhSachBaiThi.find(
        (baiThi: BaiThi) => baiThi.idNV === currentCandidate.idNV
      );
      console.log("dsdadadasda", interviewData)
      const interviewId = interviewData?.idInterview; // Use idInterview from BaiThi  
      if (!interviewId) {
        throw new Error('Không tìm thấy ID phỏng vấn');
      }

      // Schedule interview using interview ID
      const interviewResponse = await fetch('/elearning/api/interview', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: interviewId, // Use interview ID
          idNV: currentCandidate.idNV,
          ngay: selectedDate,
        }),
      });

      if (!interviewResponse.ok) {
        throw new Error('Lỗi khi thiết lập lịch phỏng vấn');
      }

      // Send email if checkbox is checked
      const sendMail = (document.getElementById('sendMail') as HTMLInputElement)?.checked;
      if (sendMail) {
        await sendEmailMutation.mutateAsync({
          email: currentCandidate.email,
          schedule: selectedDate,
        });
      }

      toast.success('Thiết lập phỏng vấn thành công');
      queryClient.invalidateQueries({ queryKey: ['danhSachBaiThi'] });
      setIsDrawerOpen(false);
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };
  const queryClient = useQueryClient();

  const { data: danhSachBaiThi, isLoading, error } = useQuery({
    queryKey: ['danhSachBaiThi'],
    queryFn: async () => {
      const all = await fetchDanhSachBaiThi();
      return all.filter((baiThi: any) => baiThi.type === 'candidate'); // 👈 lọc candidate
    },
    refetchInterval: 1000,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBaiThi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['danhSachBaiThi'] });
      toast.success('Xóa bài thi thành công!', {
        duration: 3000,
        dismissible: true,
      });
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi xóa bài thi: ${error.message}`, {
        duration: 3000,
        dismissible: true,
      });
    },
  });

  const saveExamMutation = useMutation({
    mutationFn: submitExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['danhSachBaiThi'] });
    },
    onError: (error: Error) => {
      toast.error(`Lỗi khi cập nhật điểm: ${error.message}`, {
        duration: 3000,
        dismissible: true,
      });
    },
  });

  const sendCertificateMutation = useMutation({
    mutationFn: sendCertificateViaApi,
    onSuccess: () => {
      toast.success('Gửi chứng nhận thành công!', {
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

  const handleDeleteBaiThi = (id: string, hoTen: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bài thi của ${hoTen}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const calculateThoiGianLam = (ngayThi: string, ngayNop: string): string => {
    const start = new Date(ngayThi).getTime();
    const end = new Date(ngayNop).getTime();
    const diffInMinutes = (end - start) / 1000 / 60;
    return diffInMinutes.toFixed(2);
  };

  const handleDiemCauHoiChange = (cauHoiId: number, diem: number) => {
    if (diem > 10 || diem < 0) {
      toast.error('Điểm mỗi câu phải từ 0 đến 10!', {
        duration: 3000,
        dismissible: true,
      });
      return;
    }
    setDiemCauHoi((prev) => ({ ...prev, [cauHoiId]: diem }));
  };

  const handleTickCauHoi = (cauHoiId: number, type: 'dung' | 'sai') => {
    setTickCauHoi((prev) => {
      const current = prev[cauHoiId];
      if (current === type) {
        return { ...prev, [cauHoiId]: null }; // Bỏ tick nếu đã chọn
      }
      return { ...prev, [cauHoiId]: type };
    });
  };

  const calculateTongDiem = () => {
    if (!selectedBaiThi) return 0;
    if (chamDiemMode === 'tick') {
      const soCau = selectedBaiThi.noiDungBaiThi.length;
      const diemMoiCau = soCau > 0 ? 10 / soCau : 0;
      const soCauDung = Object.values(tickCauHoi).filter((tick) => tick === 'dung').length;
      return (soCauDung * diemMoiCau).toFixed(2);
    }
    return Object.values(diemCauHoi).reduce((sum, diem) => sum + (diem || 0), 0).toFixed(2);
  };

  const calculateSoCauDung = () => {
    if (!selectedBaiThi) return 0;
    if (chamDiemMode === 'tick') {
      return Object.values(tickCauHoi).filter((tick) => tick === 'dung').length;
    }
    return Object.values(diemCauHoi).filter((diem) => diem > 0).length;
  };

  const handleSaveDiem = async () => {
    if (!selectedBaiThi) {
      toast.error('Không có bài thi được chọn!', {
        duration: 3000,
        dismissible: true,
      });
      return;
    }

    const tongDiem = Number(calculateTongDiem());
    const soCauDung = calculateSoCauDung();

    if (tongDiem < 0 || tongDiem > 100) {
      toast.error('Tổng điểm không hợp lệ (phải từ 0 đến 100)!', {
        duration: 3000,
        dismissible: true,
      });
      return;
    }

    try {
      await saveExamMutation.mutateAsync({
        idexam: selectedBaiThi.idexam,
        email: selectedBaiThi.email || '',
        hoTen: selectedBaiThi.hoTen,
        phongBan: selectedBaiThi.phongBan || '',
        diem: tongDiem,
        soCauDung: soCauDung,
        cauHoi: selectedBaiThi.noiDungBaiThi,
        ngayNop: selectedBaiThi.ngayNop,
      });

      if (selectedBaiThi.email) {
        await sendCertificateMutation.mutateAsync({
          email: selectedBaiThi.email,
          recipientName: selectedBaiThi.hoTen,
          score: tongDiem,
          examId: selectedBaiThi.idexam,
          title: selectedBaiThi.tenDeThi,
        });
      } else {
        toast.success('Cập nhật điểm thành công, nhưng không có email để gửi chứng nhận!', {
          duration: 3000,
          dismissible: true,
        });
      }

      closeModal();
    } catch (error: any) {
      // Lỗi được xử lý bởi onError của mutation
    }
  };

  const handleDownloadExcel = async () => {
    if (!danhSachBaiThi || !selectedDate) {
      toast.error('Vui lòng chọn ngày thi trước khi tải!', {
        duration: 3000,
        dismissible: true,
      });
      return;
    }

    let filteredData = danhSachBaiThi.filter(
      (baiThi) => new Date(baiThi.ngayThi).toDateString() === selectedDate
    );

    if (selectedExam) {
      filteredData = filteredData.filter((baiThi) => baiThi.tenDeThi === selectedExam);
    }

    if (filterMode === 'reported') {
      filteredData = filteredData.filter((baiThi) => baiThi.reportCauHoi.length > 0);
    }

    if (filteredData.length === 0) {
      toast.error('Không có dữ liệu để tải cho ngày và đề thi này!', {
        duration: 3000,
        dismissible: true,
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('DanhSachBaiThi');

    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 10 },
      { header: 'Họ và Tên', key: 'hoTen', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Vị trí ứng tuyển', key: 'phongBan', width: 20 },
      { header: 'Tên Đề Thi', key: 'tenDeThi', width: 25 },
      { header: 'Điểm Số', key: 'diemSo', width: 15 },
      { header: 'Số Câu Đúng', key: 'soCauDung', width: 15 },
      { header: 'Lần Thi', key: 'solanthi', width: 10 }, // Added
      { header: 'Báo Cáo', key: 'reportCauHoi', width: 15 }, // Added
      { header: 'Ngày Thi', key: 'ngayThi', width: 15 },
      { header: 'Ngày Nộp', key: 'ngayNop', width: 15 },
      { header: 'Thời Gian Làm (phút)', key: 'thoiGianLam', width: 20 },
      { header: 'Ngày Phỏng Vấn', key: 'ngayPhongVan', width: 15 }, // Added  
    ];

    filteredData.forEach((baiThi, index) => {
      worksheet.addRow({
        stt: index + 1,
        hoTen: baiThi.hoTen,
        email: baiThi.email || 'Không có email',
        phongBan: baiThi.phongBan || 'Không có phòng ban',
        tenDeThi: baiThi.tenDeThi || 'Không có tên đề',
        diemSo: baiThi.diemSo ?? 'Chưa chấm',
        soCauDung: `${baiThi?.soCauDung ?? ''} / ${baiThi?.noiDungBaiThi?.length ?? ''}`,
        solanthi: baiThi.solanthi, // Added
        reportCauHoi: baiThi.reportCauHoi.length > 0 ? 'Có' : 'Không', // Added
        ngayThi: new Date(baiThi.ngayThi).toLocaleDateString('vi-VN'),
        ngayNop: new Date(baiThi.ngayNop).toLocaleDateString('vi-VN'),
        thoiGianLam: calculateThoiGianLam(baiThi.ngayThi, baiThi.ngayNop),
        ngayPhongVan: baiThi.ngayPhongVan ? new Date(baiThi.ngayPhongVan).toLocaleDateString('vi-VN') : 'Chưa thiết lập', // Added
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const fileName = selectedExam
      ? `DanhSachBaiThi_${new Date(selectedDate).toISOString().split('T')[0]}_${selectedExam.replace(/\s+/g, '_')}.xlsx`
      : `DanhSachBaiThi_${new Date(selectedDate).toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
  };

  const openModal = (baiThi: BaiThi) => {
    setSelectedBaiThi(baiThi);
    setDiemCauHoi({});
    setTickCauHoi({});
    setChamDiemMode('manual');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (baiThi: BaiThi) => {
    setSelectedBaiThi(baiThi);
    const soCau = baiThi.noiDungBaiThi.length;
    const diemMoiCau = soCau > 0 && baiThi.diemSo ? (baiThi.diemSo / baiThi.soCauDung) / 10 : 0;

    const newDiemCauHoi: { [key: number]: number } = {};
    const newTickCauHoi: { [key: number]: 'dung' | 'sai' | null } = {};

    if (baiThi.diemSo !== null && baiThi.soCauDung > 0) {
      baiThi.noiDungBaiThi.forEach((cauHoi, index) => {
        if (cauHoi.dapAn === cauHoi.dapAnDung) {
          newDiemCauHoi[cauHoi.id] = Number(diemMoiCau.toFixed(2));
          newTickCauHoi[cauHoi.id] = 'dung';
        } else {
          newDiemCauHoi[cauHoi.id] = 0;
          newTickCauHoi[cauHoi.id] = 'sai';
        }
      });
    }
    console.log(baiThi)
    setDiemCauHoi(newDiemCauHoi);
    setTickCauHoi(newTickCauHoi);
    setChamDiemMode('tick');
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBaiThi(null);
    setDiemCauHoi({});
    setTickCauHoi({});
    setChamDiemMode('manual');
    setIsEditing(false);
  };

  useEffect(() => {
    if (selectedBaiThi && chamDiemMode === 'tick' && (isEditing || (selectedBaiThi.diemSo === null || selectedBaiThi.diemSo === 0))) {
      const soCau = selectedBaiThi.noiDungBaiThi.length;
      const diemMoiCau = soCau > 0 ? 10 / soCau : 0;
      const newDiemCauHoi: { [key: number]: number } = {};
      Object.entries(tickCauHoi).forEach(([cauHoiId, tick]) => {
        newDiemCauHoi[Number(cauHoiId)] = tick === 'dung' ? Number(diemMoiCau.toFixed(2)) : 0;
      });
      setDiemCauHoi(newDiemCauHoi);
    }
  }, [selectedBaiThi, chamDiemMode, tickCauHoi, isEditing]);

  const filteredBaiThi = danhSachBaiThi?.filter((baiThi) => {
    if (filterMode === 'uncharged') {
      return !baiThi.checktudongtinhDiem && (baiThi.diemSo === null || baiThi.diemSo === 0);
    }
    if (filterMode === 'reported') {
      return baiThi.reportCauHoi.length > 0;
    }
    return true;
  });

  if (isLoading) return <p className="text-center text-gray-500">Đang tải...</p>;
  if (error) return <p className="text-center text-red-500">Lỗi: {(error as Error).message}</p>;

  const groupedByDate = filteredBaiThi?.reduce((acc: { [key: string]: BaiThi[] }, baiThi) => {
    const dateKey = new Date(baiThi.ngayThi).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(baiThi);
    return acc;
  }, {});

  const uniqueExams = Array.from(new Set(danhSachBaiThi?.map((baiThi) => baiThi.tenDeThi))).sort();

  return (
    <div className="container mx-auto p-4 max-w-7xl">

      <div className="mb-6 flex items-center space-x-4 flex-wrap">
        <label htmlFor="filterMode" className="text-md font-semibold text-gray-700">
          Chế độ hiển thị:
        </label>
        <select
          id="filterMode"
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value as 'all' | 'uncharged' | 'reported')}
          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả bài thi</option>
          <option value="uncharged">Bài thi chưa chấm</option>
          <option value="reported">Bài thi có báo cáo</option>
        </select>

        <label htmlFor="dateSelect" className="text-md font-semibold text-gray-700">
          Chọn ngày thi:
        </label>
        <select
          id="dateSelect"
          value={selectedDate || ''}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>
            -- Chọn ngày --
          </option>
          {Object.keys(groupedByDate || {}).map((dateKey, index) => (
            <option key={index} value={dateKey}>
              {new Date(dateKey).toLocaleDateString('vi-VN')}
            </option>
          ))}
        </select>

        <label htmlFor="examSelect" className="text-md font-semibold text-gray-700">
          Chọn đề thi:
        </label>
        <select
          id="examSelect"
          value={selectedExam || ''}
          onChange={(e) => setSelectedExam(e.target.value || null)}
          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Tất cả đề thi --</option>
          {uniqueExams.map((exam, index) => (
            <option key={index} value={exam}>
              {exam}
            </option>
          ))}
        </select>

        <button
          onClick={handleDownloadExcel}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          disabled={!selectedDate}
        >
          Tải Excel
        </button>
      </div>

      {isModalOpen && selectedBaiThi && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {isEditing
                ? `Chỉnh sửa điểm bài thi của ${selectedBaiThi.hoTen}`
                : selectedBaiThi.diemSo !== null && selectedBaiThi.diemSo > 0
                  ? `Xem chi tiết bài thi của ${selectedBaiThi.hoTen}`
                  : `Chấm điểm bài thi của ${selectedBaiThi.hoTen}`}
            </h2>
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <p className="text-lg font-semibold text-gray-700">
                Tên đề thi: {selectedBaiThi.tenDeThi}
              </p>
              <p className="text-lg font-semibold text-gray-700">
                Số câu đúng (hiện tại): {selectedBaiThi.soCauDung} / {selectedBaiThi.noiDungBaiThi.length}
              </p>
              <p className="text-lg font-semibold text-gray-700">
                Điểm số (hiện tại): {selectedBaiThi.diemSo ?? 'Chưa chấm'}
              </p>
              <p className="text-lg font-semibold text-gray-700">
                Lần thi: {selectedBaiThi.solanthi}
              </p>
              <p className="text-lg font-semibold text-gray-700">
                Báo cáo: {selectedBaiThi.reportCauHoi.length > 0 ? `Có (${selectedBaiThi.reportCauHoi.length} câu)` : 'Không'}
              </p>
              <p className="text-lg font-semibold text-gray-700">
                Thời gian làm bài: {calculateThoiGianLam(selectedBaiThi.ngayThi, selectedBaiThi.ngayNop)} phút
              </p>
              {(isEditing || (selectedBaiThi.diemSo === null || selectedBaiThi.diemSo === 0)) && (
                <div className="mt-4">
                  <label htmlFor="chamDiemMode" className="text-lg font-semibold text-gray-700">
                    Chế độ chấm điểm:
                  </label>
                  <select
                    id="chamDiemMode"
                    value={chamDiemMode}
                    onChange={(e) => setChamDiemMode(e.target.value as 'tick' | 'manual')}
                    className="ml-2 border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="manual">Nhập điểm thủ công</option>
                    <option value="tick">Tick đúng/sai</option>
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-6">
              {selectedBaiThi.noiDungBaiThi.map((cauHoi, index) => (
                <div
                  key={index}
                  className={`border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${selectedBaiThi.reportCauHoi.includes(String(cauHoi.id)) ? 'bg-yellow-100 border-yellow-300' : 'bg-white'
                    }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-lg text-gray-800">
                      Câu {index + 1}: {cauHoi.noiDung}
                    </p>
                    {selectedBaiThi.reportCauHoi.includes(String(cauHoi.id)) && (
                      <span className="text-yellow-600 font-medium">Đã báo cáo</span>
                    )}
                  </div>
                  <p className="mt-2">
                    Đáp án chọn:{' '}
                    <span
                      className={`font-medium ${cauHoi.dapAn === cauHoi.dapAnDung ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {cauHoi.dapAn || 'Không có đáp án'}
                    </span>
                  </p>
                  <p>
                    Đáp án đúng:{' '}
                    <span className="font-medium text-green-600">
                      {cauHoi.dapAnDung || 'Không có đáp án'}
                    </span>
                  </p>
                  {(isEditing || (selectedBaiThi.diemSo === null || selectedBaiThi.diemSo === 0)) && (
                    <>
                      {chamDiemMode === 'manual' ? (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Điểm câu {index + 1}:
                          </label>
                          <input
                            type="number"
                            value={diemCauHoi[cauHoi.id] ?? ''}
                            onChange={(e) => handleDiemCauHoiChange(cauHoi.id, Number(e.target.value))}
                            className="mt-1 border border-gray-300 p-2 rounded-md w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập điểm"
                            min="0"
                            max="10"
                            step="0.01"
                          />
                        </div>
                      ) : (
                        <div className="mt-3 flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={tickCauHoi[cauHoi.id] === 'dung'}
                              onChange={() => handleTickCauHoi(cauHoi.id, 'dung')}
                              className="mr-2"
                            />
                            Đúng
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={tickCauHoi[cauHoi.id] === 'sai'}
                              onChange={() => handleTickCauHoi(cauHoi.id, 'sai')}
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
            {(isEditing || (selectedBaiThi.diemSo === null || selectedBaiThi.diemSo === 0)) && (
              <div className="mt-8 bg-blue-50 p-4 rounded-lg">
                <p className="text-xl font-bold text-blue-800">
                  Tổng điểm: {Number(calculateTongDiem()).toFixed(2)}
                </p>
                <p className="text-xl font-bold text-blue-800">
                  Số câu đúng: {calculateSoCauDung()} / {selectedBaiThi.noiDungBaiThi.length}
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-4 mt-6">
              {(isEditing || (selectedBaiThi.diemSo === null || selectedBaiThi.diemSo === 0)) && (
                <button
                  onClick={handleSaveDiem}
                  className={`relative bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors ${saveExamMutation.isPending || sendCertificateMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  disabled={saveExamMutation.isPending || sendCertificateMutation.isPending}
                >
                  {saveExamMutation.isPending || sendCertificateMutation.isPending ? (
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
                    'Lưu điểm'
                  )}
                </button>
              )}
              <button
                onClick={closeModal}
                className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {groupedByDate ? (
        Object.keys(groupedByDate).map((dateKey, index) => {
          const filteredBaiThiByDate = selectedExam
            ? groupedByDate[dateKey].filter((baiThi) => baiThi.tenDeThi === selectedExam)
            : groupedByDate[dateKey];

          if (filteredBaiThiByDate.length === 0) return null;

          return (
            <div key={index} className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-semibold text-gray-800">
                  Ngày thi: {new Date(dateKey).toLocaleDateString('vi-VN')}
                </h2>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="border-collapse border border-gray-200 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 p-3 text-left text-gray-700">STT</th>
                      <th className="border border-gray-200 p-3 text-left text-gray-700">Họ và Tên</th>
                      <th className="border border-gray-200 p-3 text-left text-gray-700">Email</th>
                      <th className="border border-gray-200 p-3 text-left text-gray-700">Vị trí ứng tuyển</th>
                      <th className="border border-gray-200 p-3 text-left text-gray-700">Tên Đề Thi</th>
                      <th className="border border-gray-200 p-3 text-left text-gray-700">Điểm Số</th>
                      <th className="border border-gray-200 p-3 text-left text-gray-700">Số Câu Đúng</th>
                      <th className="border border-gray-200 p-3 text-left text-gray-700">Lần Thi</th>
                      <th className="border border-gray-200 p-3 text-left text-gray-700">Báo Cáo</th>
                      <th className="border border-gray-200 p-3 text-left text-gray-700">Ngày Thi</th>
                      <th className="border border-gray-200 p-3 text-left text-gray-700">Ngày Nộp</th>
                      <th className="border border-gray-200 p-3 text-left text-gray-700">Thời Gian Làm (phút)</th>
                      <th className="border border-gray-200 p-3 text-left text-gray-700">Ngày Phỏng Vấn</th> {/* Added */}
                      <th className="border border-gray-200 p-3 text-left text-gray-700">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBaiThiByDate.map((baiThi, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-3 text-center">{idx + 1}</td>
                        <td className="border border-gray-200 p-3">{baiThi.hoTen}</td>
                        <td className="border border-gray-200 p-3">{baiThi.email || 'Không có email'}</td>
                        <td className="border border-gray-200 p-3">{baiThi.phongBan || 'Không có phòng ban'}</td>
                        <td className="border border-gray-200 p-3">{baiThi.tenDeThi || 'Không có tên đề'}</td>
                        <td className="border border-gray-200 p-3 text-center">{baiThi?.diemSo?.toFixed(1) ?? 'Chưa chấm'}</td>
                        <td className="border border-gray-200 p-3 text-center">
                          {baiThi?.soCauDung ?? ''} / {baiThi?.noiDungBaiThi?.length ?? ''}
                        </td>
                        <td className="border border-gray-200 p-3 text-center">{baiThi.solanthi}</td>
                        <td className="border border-gray-200 p-3 text-center">
                          {baiThi.reportCauHoi.length > 0 ? 'Có' : 'Không'}
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          {new Date(baiThi.ngayThi).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          {new Date(baiThi.ngayNop).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          {calculateThoiGianLam(baiThi.ngayThi, baiThi.ngayNop)}
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          {baiThi.ngayPhongVan
                          ? (() => {
                            const d = new Date(baiThi.ngayPhongVan);
                            const year = d.getUTCFullYear();
                            const month = String(d.getUTCMonth() + 1).padStart(2, "0");
                            const day = String(d.getUTCDate()).padStart(2, "0");
                            const hours = String(d.getUTCHours()).padStart(2, "0");
                            const minutes = String(d.getUTCMinutes()).padStart(2, "0");
                            return `${day}-${month}-${year} ${hours}:${minutes}`;
                          })()
                          : 'Chưa thiết lập'}
                        </td>
                        <td className="border border-gray-200 p-3 text-center">
                          <div className="flex justify-center space-x-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openModal(baiThi)}
                                className="text-blue-600 hover:text-blue-800 text-lg"
                                title="Xem chi tiết"
                              >
                                👁️
                              </button>
                              {baiThi.diemSo !== null && baiThi.diemSo > 0 && (
                                <button
                                  onClick={() => openEditModal(baiThi)}
                                  className="text-yellow-600 hover:text-yellow-800 text-lg"
                                  title="Chỉnh sửa"
                                >
                                  ✏️
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteBaiThi(baiThi.id, baiThi.hoTen)}
                                className="text-red-600 hover:text-red-800 text-lg"
                                title="Xóa"
                              >
                                🗑️
                              </button>
                              <button
                                onClick={() => handleOpenDrawer(baiThi)}
                                className="text-green-600 hover:text-green-800 text-lg"
                                title="Thiết lập phỏng vấn"
                              >
                                📅
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent className="fixed right-0 top-0 bottom-0 w-[800px] max-w-[100vw] p-6 bg-white rounded-l-xl shadow-xl flex flex-col overflow-y-auto max-h-screen">
                  <DrawerHeader className="border-b">
                    <DrawerTitle className="text-xl">
                      Thiết lập phỏng vấn - {currentCandidate?.hoTen}
                    </DrawerTitle>
                    <DrawerDescription>Chọn thời gian & gửi mail cho ứng viên</DrawerDescription>
                  </DrawerHeader>

                  <div className="flex-1 space-y-4 py-4">
                    <label className="block font-semibold">Chọn thời gian phỏng vấn</label>
                    <Input
                      type="datetime-local"
                      value={selectedDate || ""}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border border-gray-300 rounded p-2 w-full"
                    />

                    <label className="flex items-center space-x-2 mt-2">
                      <input type="checkbox" defaultChecked id="sendMail" className="h-4 w-4" />
                      <span>Gửi email thông báo</span>
                    </label>
                  </div>

                  <DrawerFooter className="border-t mt-auto pt-4 flex justify-end space-x-3">
                    <DrawerClose asChild>
                      <Button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
                        Hủy
                      </Button>
                    </DrawerClose>
                    <Button
                      onClick={handleScheduleInterview}
                      className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Lưu lịch phỏng vấn
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
          );
        })
      ) : (
        <p className="text-center text-gray-500">Không có dữ liệu bài thi.</p>
      )}
    </div>
  );
}