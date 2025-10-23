"use client";
import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/frontend/components/ui/table";
import { Button } from "@/app/frontend/components/ui/button";
import { Input } from "@/app/frontend/components/ui/input";
import { Badge } from "@/app/frontend/components/ui/badge";
import { 
  FileSpreadsheet, 
  Trash2, 
  Edit3, 
  ExternalLink,
  Star
} from "lucide-react";

interface ExcelCandidate {
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
  isNew?: boolean;
  isEdited?: boolean;
}

interface ExcelPreviewDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  excelData: ExcelCandidate[];
  onExcelDataChange: (data: ExcelCandidate[]) => void;
  onSave: (data: ExcelCandidate[]) => void;
  isSaving: boolean;
}

export default function ExcelPreviewDrawer({
  isOpen,
  onOpenChange,
  excelData,
  onExcelDataChange,
  onSave,
  isSaving,
}: ExcelPreviewDrawerProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const handleEditRow = (index: number, field: string, value: string) => {
    const updatedData = [...excelData];
    if (field === 'fit_score') {
      updatedData[index] = { ...updatedData[index], [field]: value ? Number(value) : null, isEdited: true };
    } else if (field === 'birthdate') {
      updatedData[index] = { ...updatedData[index], [field]: value ? new Date(value).toISOString() : null, isEdited: true };
    } else {
      updatedData[index] = { ...updatedData[index], [field]: value || null, isEdited: true };
    }
    onExcelDataChange(updatedData);
  };

  const handleDeleteRow = (index: number) => {
    const updatedData = excelData.filter((_, i) => i !== index);
    onExcelDataChange(updatedData);
  };

  const handleSave = () => {
    if (excelData.length === 0) {
      return;
    }
    onSave(excelData);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="fixed right-0 top-0 bottom-0 w-[800px] max-w-[100vw] p-6 bg-white rounded-l-xl shadow-xl flex flex-col overflow-y-auto max-h-screen">
        <DrawerHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <DrawerTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet size={24} className="text-green-600" />
            Xem Trước Dữ Liệu Excel ({excelData.length} ứng viên)
          </DrawerTitle>
          <DrawerDescription>
            Xem lại và chỉnh sửa dữ liệu trước khi lưu vào hệ thống
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead>Họ Tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead>Điểm số</TableHead>
                  <TableHead>CV</TableHead>
                  <TableHead>Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {excelData.map((item, index) => (
                  <TableRow key={index} className={item.isEdited ? "bg-yellow-50" : ""}>
                    <TableCell>
                      {editingRow === index ? (
                        <Input
                          value={item.full_name}
                          onChange={(e) => handleEditRow(index, 'full_name', e.target.value)}
                          className="w-full min-w-[150px]"
                        />
                      ) : (
                        <span className="font-medium">{item.full_name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRow === index ? (
                        <Input
                          type="email"
                          value={item.email || ""}
                          onChange={(e) => handleEditRow(index, 'email', e.target.value)}
                          className="w-full min-w-[200px]"
                        />
                      ) : (
                        item.email || "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRow === index ? (
                        <Input
                          value={item.position || ""}
                          onChange={(e) => handleEditRow(index, 'position', e.target.value)}
                          className="w-full min-w-[150px]"
                        />
                      ) : (
                        item.position || "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRow === index ? (
                        <Input
                          value={item.source || ""}
                          onChange={(e) => handleEditRow(index, 'source', e.target.value)}
                          className="w-full min-w-[120px]"
                        />
                      ) : (
                        <Badge variant="outline">{item.source || "-"}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRow === index ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.fit_score ?? ""}
                          onChange={(e) => handleEditRow(index, 'fit_score', e.target.value)}
                          className="w-full min-w-[80px]"
                        />
                      ) : (
                        item.fit_score ? (
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-500" />
                            <span className="font-semibold">{item.fit_score}%</span>
                          </div>
                        ) : "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRow === index ? (
                        <Input
                          type="url"
                          value={item.cv_link || ""}
                          onChange={(e) => handleEditRow(index, 'cv_link', e.target.value)}
                          className="w-full min-w-[150px]"
                          placeholder="https://..."
                        />
                      ) : (
                        item.cv_link ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(item.cv_link!, '_blank')}
                            className="text-blue-600 hover:bg-blue-50 p-1"
                          >
                            <ExternalLink size={12} />
                          </Button>
                        ) : "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editingRow === index ? (
                          <Button
                            size="sm"
                            onClick={() => setEditingRow(null)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Lưu
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingRow(index)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Edit3 size={12} />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRow(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <DrawerFooter className="bg-gray-50">
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || excelData.length === 0}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isSaving ? "Đang lưu..." : `Lưu ${excelData.length} ứng viên`}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">Hủy</Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}