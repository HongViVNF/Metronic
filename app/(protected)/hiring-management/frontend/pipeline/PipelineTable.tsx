import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/frontend/components/ui/table";
import { Button } from "@/app/frontend/components/ui/button";
import { Checkbox } from "@/app/frontend/components/ui/checkbox";
import { Edit3, Trash2, Eye } from "lucide-react";
import { HiringPipeline } from "./types";

interface PipelineTableProps {
  pipelines: HiringPipeline[];
  selectedPipelineIds: string[];
  onSelectPipeline: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (pipeline: HiringPipeline) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

export function PipelineTable({
  pipelines,
  selectedPipelineIds,
  onSelectPipeline,
  onSelectAll,
  onEdit,
  onDelete,
  onView,
  isAllSelected,
  isIndeterminate,
}: PipelineTableProps) {
  if (pipelines.length === 0) {
    return (
      <div className="text-center py-12 ">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có pipeline nào</h3>
        <p className="text-gray-500">Thêm pipeline mới hoặc thử thay đổi bộ lọc tìm kiếm</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto ">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <TableHead className="font-semibold text-gray-700 w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                className="border-gray-300"
                {...(isIndeterminate && { 'data-state': 'indeterminate' })}
              />
            </TableHead>
            <TableHead className="font-semibold text-gray-700">Tên Pipeline</TableHead>
            <TableHead className="font-semibold text-gray-700">Mô tả</TableHead>
            <TableHead className="font-semibold text-gray-700">Người tạo</TableHead>
            <TableHead className="font-semibold text-gray-700">Ngày tạo</TableHead>
            <TableHead className="font-semibold text-gray-700 text-center">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pipelines.map((pipeline) => (
            <TableRow
              key={pipeline.id}
              className={`hover:bg-blue-50/50 transition-colors duration-200 ${
                selectedPipelineIds.includes(pipeline.id) 
                  ? 'bg-blue-50 border-l-4 border-blue-500' 
                  : ''
              }`}
            >
              <TableCell 
                className="py-4"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={selectedPipelineIds.includes(pipeline.id)}
                  onCheckedChange={(checked:any) => onSelectPipeline(pipeline.id, checked as boolean)}
                  className="border-gray-300"
                />
              </TableCell>
              <TableCell 
                className="py-4 font-semibold text-gray-900 cursor-pointer"
                onClick={() => onView(pipeline.id)}
              >
                {pipeline.name}
              </TableCell>
              <TableCell 
                className="cursor-pointer"
                onClick={() => onView(pipeline.id)}
              >
                {pipeline.descriptions || '-'}
              </TableCell>
              <TableCell 
                className="cursor-pointer"
                onClick={() => onView(pipeline.id)}
              >
                {pipeline.created_by || '-'}
              </TableCell>
              <TableCell 
                className="cursor-pointer"
                onClick={() => onView(pipeline.id)}
              >
                {pipeline.created_at ? new Date(pipeline.created_at).toLocaleDateString() : '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(pipeline);
                    }}
                    className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1 h-auto"
                  >
                    <Edit3 size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(pipeline.id);
                    }}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 h-auto"
                  >
                    <Trash2 size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(pipeline.id);
                    }}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 h-auto"
                  >
                    <Eye size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
