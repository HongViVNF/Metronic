import { Input } from "@/app/frontend/components/ui/input";
import { Button } from "@/app/frontend/components/ui/button";
import { Badge } from "@/app/frontend/components/ui/badge";
import { Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/frontend/components/ui/select";

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  resultsCount: number;
  selectedCount: number;
  onBulkDelete: () => void;
  isDeleting: boolean;
  onAddNew: () => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export function SearchAndFilters({
  searchQuery,
  onSearchChange,
  onClearFilters,
  resultsCount,
  selectedCount,
  onBulkDelete,
  isDeleting,
  onAddNew,
  pageSize,
  onPageSizeChange,
}: SearchAndFiltersProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Quản lý Pipeline Tuyển dụng
          </h1>
          <p className="text-gray-600">
            Tổng cộng {resultsCount} pipeline
            {selectedCount > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedCount} được chọn)
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {selectedCount > 0 && (
            <Button
              onClick={onBulkDelete}
              variant="destructive"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              <span className="truncate">
                {isDeleting ? 'Đang xóa...' : `Xóa ${selectedCount} pipeline`}
              </span>
            </Button>
          )}
          <Button
            onClick={onAddNew}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <span>Thêm Pipeline</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Tìm kiếm theo tên hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-200"
            />
          </div>

          <div className="flex items-center gap-2 min-w-[120px]">
            <label htmlFor="pageSizeSelect" className="text-sm text-gray-600 whitespace-nowrap">
              Hiển thị:
            </label>
            <select
              id="pageSizeSelect"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-blue-200 bg-white text-sm"
              title="Số lượng mục hiển thị trên mỗi trang"
              aria-label="Số lượng mục hiển thị trên mỗi trang"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {searchQuery && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">Bộ lọc đang áp dụng:</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Tìm kiếm: {searchQuery}
              <button
                onClick={() => onSearchChange('')}
                className="ml-2 text-blue-500 hover:text-blue-700"
                aria-label="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700 text-sm h-6 px-2"
            >
              Xóa tất cả
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
