"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/app/frontend/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/app/frontend/components/ui/table";
import { Input } from "@/app/frontend/components/ui/input";
import { Badge } from "@/app/frontend/components/ui/badge";
import { Checkbox } from "@/app/frontend/components/ui/checkbox";
import {
    Trash2,
    Edit3,
    Plus,
    Search,
    Filter,
    AlertTriangle,
    ChevronsRight,
    ChevronRight,
    ChevronLeft,
    ChevronsLeft,
    Eye,
    Users,
    Activity as ActivityIcon,
    Calendar,
    FileText,
    Settings,
    X,
    RefreshCw,
    Download,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/app/frontend/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/frontend/components/ui/select";

// Interface
interface Activity {
    name: string;
    description?: string | null;
    type?: string | null;
    created_by?: string | null;
    updated_by?: string | null;
    created_at?: string;
    updated_at?: string;
    candidates?: Array<{
        candidate_name: string | null;
        stage_name: string | null;
        start_date: string;
        end_date: string;
        status: boolean;
        assignee: string;
    }>;
}

interface ActivityFormData {
    name: string;
    description: string;
    type: string;
}

export default function ActivityTable() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedActivityNames, setSelectedActivityNames] = useState<string[]>([]);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showCandidatesDialog, setShowCandidatesDialog] = useState<Activity | null>(null);
    const [filterType, setFilterType] = useState<string>('');

    const [formData, setFormData] = useState<ActivityFormData>({
        name: "",
        description: "",
        type: "",
    });

    // API Functions
    const fetchActivities = async (): Promise<Activity[]> => {
        const response = await axios.get("/recruitment/api/activities");
        return response.data.data || [];
    };

    const createActivity = async (data: Omit<Activity, "created_at" | "updated_at" | "created_by" | "updated_by" | "candidates">): Promise<Activity> => {
        const userId = getUserId();
        const response = await axios.post("/recruitment/api/activities", {
            ...data,
            created_by: userId,
            updated_by: userId,
        }, {
            headers: {
                "X-AI-Platform-UserId": userId,
            },
        });
        return response.data.activity;
    };

    const updateActivity = async (data: Activity): Promise<Activity> => {
        const userId = getUserId();
        const response = await axios.put("/recruitment/api/activities", {
            ...data,
            updated_by: userId,
        }, {
            headers: {
                "X-AI-Platform-UserId": userId,
            },
        });
        return response.data.activity;
    };

    const deleteActivity = async (name: string): Promise<void> => {
        await axios.delete("/recruitment/api/activities", {
            data: { name },
        });
    };

    const deleteActivities = async (names: string[]): Promise<void> => {
        const promises = names.map(name =>
            axios.delete("/recruitment/api/activities", {
                data: { name },
            })
        );
        await Promise.all(promises);
    };

    const getUserId = (): string => {
        if (typeof window !== "undefined") {
            const state = localStorage.getItem("ai.platform");
            return state ? JSON.parse(state)?.state?.user?.id : "";
        }
        return "";
    };

    // Queries and Mutations
    const {
        data: activities = [],
        isLoading,
        error,
    } = useQuery<Activity[]>({
        queryKey: ["activities"],
        queryFn: fetchActivities,
    });

    const createMutation = useMutation({
        mutationFn: createActivity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities"] });
            setIsFormOpen(false);
            resetFormData();
        },
        onError: (error) => {
            console.error("Create activity error:", error);
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateActivity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities"] });
            setIsFormOpen(false);
            setSelectedActivity(null);
            resetFormData();
        },
        onError: (error) => {
            console.error("Update activity error:", error);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteActivity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities"] });
        },
        onError: (error) => {
            console.error("Delete activity error:", error);
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: deleteActivities,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities"] });
            setSelectedActivityNames([]);
            setShowBulkDeleteConfirm(false);
        },
        onError: (error) => {
            console.error("Bulk delete activities error:", error);
        },
    });

    // Helper Functions
    const resetFormData = () => {
        setFormData({
            name: "",
            description: "",
            type: "",
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedActivity) {
            updateMutation.mutate({ ...selectedActivity, ...formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (activity: Activity) => {
        setSelectedActivity(activity);
        setFormData({
            name: activity.name,
            description: activity.description || "",
            type: activity.type || "",
        });
        setIsFormOpen(true);
    };

    const handleDelete = (name: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa hoạt động này?")) {
            deleteMutation.mutate(name);
        }
    };

    const handleBulkDelete = () => {
        if (selectedActivityNames.length === 0) return;
        setShowBulkDeleteConfirm(true);
    };

    const confirmBulkDelete = () => {
        bulkDeleteMutation.mutate(selectedActivityNames);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedActivityNames(filteredActivities.map(activity => activity.name));
        } else {
            setSelectedActivityNames([]);
        }
    };

    const handleSelectActivity = (activityName: string, checked: boolean) => {
        if (checked) {
            setSelectedActivityNames(prev => [...prev, activityName]);
        } else {
            setSelectedActivityNames(prev => prev.filter(name => name !== activityName));
        }
    };

    const handleViewCandidates = (activity: Activity) => {
        setShowCandidatesDialog(activity);
    };

    const goToFirstPage = () => {
        setCurrentPage(1);
        setSelectedActivityNames([]);
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            setSelectedActivityNames([]);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            setSelectedActivityNames([]);
        }
    };

    const goToLastPage = () => {
        setCurrentPage(totalPages);
        setSelectedActivityNames([]);
    };

    const goToPage = (page: number) => {
        setCurrentPage(page);
        setSelectedActivityNames([]);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1);
        setSelectedActivityNames([]);
    };

    // Filter data
    const filteredActivities = activities?.filter(activity => {
        const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.type?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = !filterType || filterType === 'all' || activity.type === filterType;

        return matchesSearch && matchesType;
    }) || [];

    const totalPages = Math.ceil(filteredActivities.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentPageActivities = filteredActivities.slice(startIndex, endIndex);

    const isAllSelected = currentPageActivities.length > 0 &&
        currentPageActivities.every(activity => selectedActivityNames.includes(activity.name));
    const isIndeterminate = selectedActivityNames.some(name =>
        currentPageActivities.some(activity => activity.name === name)
    ) && !isAllSelected;

    // Get unique activity types
    const activityTypes = Array.from(
        new Set(activities.map(a => a.type).filter(Boolean))
    );

    const getTypeColor = (type: string) => {
        const colors = {
            'Interview': 'bg-blue-100 text-blue-800 border-blue-200',
            'Assessment': 'bg-green-100 text-green-800 border-green-200',
            'Final Interview': 'bg-purple-100 text-purple-800 border-purple-200',
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusColor = (status: boolean) => {
        return status
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-yellow-100 text-yellow-800 border-yellow-200';
    };

    if (isLoading && !activities.length) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="text-red-500 text-center p-8">
            <div className="text-lg font-semibold">Lỗi khi tải dữ liệu</div>
            <div className="text-sm mt-2">Vui lòng thử lại sau</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-6">
            <div className="w-full mx-auto space-y-6">

                {/* Enhanced Header */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

                        {/* Title Section */}
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-md">
                                <ActivityIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Quản lý Hoạt động
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        <span className="font-medium">{filteredActivities.length}</span> hoạt động
                                    </div>
                                    {selectedActivityNames.length > 0 && (
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <Users className="w-4 h-4" />
                                            <span className="font-medium">{selectedActivityNames.length}</span> được chọn
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages || 1}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                            {selectedActivityNames.length > 0 && (
                                <Button
                                    onClick={handleBulkDelete}
                                    variant="destructive"
                                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-200 hover:shadow-xl"
                                    disabled={bulkDeleteMutation.isPending}
                                >
                                    <Trash2 size={16} />
                                    {bulkDeleteMutation.isPending ? 'Đang xóa...' : `Xóa ${selectedActivityNames.length} hoạt động`}
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 transition-all duration-200"
                            >
                                <Download size={16} />
                                Xuất dữ liệu
                            </Button>

                            <Button
                                onClick={() => {
                                    setSelectedActivity(null);
                                    resetFormData();
                                    setIsFormOpen(true);
                                }}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg transition-all duration-200 hover:shadow-xl"
                            >
                                <Plus size={16} />
                                Thêm Hoạt động
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Enhanced Search and Filters */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex flex-col lg:flex-row gap-4">

                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Tìm kiếm theo tên, mô tả hoặc loại hoạt động..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-200"
                            />
                            {searchQuery && (
                                <Button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={18} />
                                </Button>
                            )}
                        </div>

                        {/* Type Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <Select
                                value={filterType}
                                onValueChange={setFilterType}
                            >
                                <SelectTrigger className="px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white min-w-[160px] transition-all duration-200">
                                    <SelectValue placeholder="Tất cả loại" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">Tất cả loại</SelectItem>
                                    {activityTypes.map(type => (
                                        <SelectItem key={type} value={type ?? ''}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Page Size Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 whitespace-nowrap">Hiển thị:</span>
                            {/* <Select
                                value={pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white transition-all duration-200"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </Select> */}
                            <Select
                                value={String(pageSize)} // ✅ ép về string
                                onValueChange={(val:any) => handlePageSizeChange(Number(val))} // ✅ parse lại về number
                                >
                                <SelectTrigger className="px-4 py-3 border border-gray-200 rounded-xl bg-white">
                                    <SelectValue placeholder="Chọn số lượng" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>

                        </div>
                    </div>

                    {/* Active Filters */}
                    {(searchQuery || filterType) && (
                        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-gray-100">
                            <span className="text-sm font-medium text-gray-700">Bộ lọc đang áp dụng:</span>

                            {searchQuery && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 rounded-full">
                                    Tìm kiếm: {searchQuery}
                                    <Button
                                        onClick={() => setSearchQuery('')}
                                        className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        <X size={14} />
                                    </Button>
                                </Badge>
                            )}

                            {filterType && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 px-3 py-1 rounded-full">
                                    Loại: {filterType}
                                    <Button
                                        onClick={() => setFilterType('')}
                                        className="ml-2 text-green-600 hover:text-green-800 transition-colors"
                                    >
                                        <X size={14} />
                                    </Button>
                                </Badge>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterType('');
                                }}
                                className="text-gray-500 hover:text-gray-700 text-sm h-8 px-3 rounded-lg transition-all duration-200"
                            >
                                <RefreshCw size={14} className="mr-1" />
                                Xóa tất cả
                            </Button>
                        </div>
                    )}
                </div>

                {/* Enhanced Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-blue-100">
                                    <TableHead className="font-semibold text-gray-700 w-16 pl-6">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={handleSelectAll}
                                            className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                            {...(isIndeterminate && { 'data-state': 'indeterminate' })}
                                        />
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4">Tên Hoạt động</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Mô tả</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Loại</TableHead>
                                    {/* <TableHead className="font-semibold text-gray-700">Người tạo</TableHead> */}
                                    <TableHead className="font-semibold text-gray-700">Ngày tạo</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Ứng viên</TableHead>
                                    <TableHead className="font-semibold text-gray-700 text-center pr-6">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentPageActivities.map((activity, index) => (
                                    <TableRow
                                        key={activity.name}
                                        className={`
                      hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 
                      transition-all duration-200 border-b border-gray-100
                      ${selectedActivityNames.includes(activity.name)
                                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 shadow-sm'
                                                : ''
                                            }
                      ${index % 2 === 0 ? 'bg-gray-50/30' : ''}
                    `}
                                    >
                                        <TableCell className="py-4 pl-6">
                                            <Checkbox
                                                checked={selectedActivityNames.includes(activity.name)}
                                                onCheckedChange={(checked:any) => handleSelectActivity(activity.name, checked as boolean)}
                                                className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                            />
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="font-semibold text-gray-900 text-base">{activity.name}</div>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            <div className="text-gray-600 truncate" title={activity.description || ''}>
                                                {activity.description || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {activity.type ? (
                                                <Badge className={`${getTypeColor(activity.type)} font-medium px-3 py-1 rounded-full border`}>
                                                    {activity.type}
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        {/* <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                    {activity.created_by?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-gray-700">{activity.created_by || '-'}</span>
                                            </div>
                                        </TableCell> */}
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(activity.created_at || '').toLocaleDateString('vi-VN')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewCandidates(activity);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-3 py-1 h-auto rounded-lg transition-all duration-200 font-medium"
                                            >
                                                <Users className="w-4 h-4 mr-1" />
                                                {activity.candidates?.length || 0} ứng viên
                                            </Button>
                                        </TableCell>
                                        <TableCell className="pr-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(activity);
                                                    }}
                                                    className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 p-2 h-auto rounded-lg transition-all duration-200"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit3 size={16} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(activity.name);
                                                    }}
                                                    className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 h-auto rounded-lg transition-all duration-200"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Enhanced Empty States */}
                    {currentPageActivities.length === 0 && filteredActivities.length === 0 && (
                        <div className="text-center py-16 px-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ActivityIcon className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Không có hoạt động nào</h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                Bắt đầu bằng cách tạo hoạt động mới hoặc thử thay đổi bộ lọc tìm kiếm của bạn
                            </p>
                            <Button
                                onClick={() => {
                                    setSelectedActivity(null);
                                    resetFormData();
                                    setIsFormOpen(true);
                                }}
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Tạo hoạt động đầu tiên
                            </Button>
                        </div>
                    )}

                    {currentPageActivities.length === 0 && filteredActivities.length > 0 && (
                        <div className="text-center py-16 px-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-yellow-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Không có kết quả trong trang này</h3>
                            <p className="text-gray-500 mb-6">Thử chuyển về trang đầu hoặc điều chỉnh bộ lọc</p>
                            <Button
                                onClick={goToFirstPage}
                                variant="outline"
                                className="border-gray-200 hover:bg-gray-50"
                            >
                                <ChevronsLeft className="w-4 h-4 mr-2" />
                                Về trang đầu
                            </Button>
                        </div>
                    )}

                    {/* Enhanced Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 px-6 py-5">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-sm text-gray-600 font-medium">
                                    Hiển thị <span className="text-blue-600 font-semibold">{startIndex + 1}</span> - <span className="text-blue-600 font-semibold">{Math.min(endIndex, filteredActivities.length)}</span> của <span className="text-blue-600 font-semibold">{filteredActivities.length}</span> hoạt động
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goToFirstPage}
                                        disabled={currentPage === 1}
                                        className="p-2 border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200"
                                    >
                                        <ChevronsLeft size={16} />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goToPreviousPage}
                                        disabled={currentPage === 1}
                                        className="p-2 border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200"
                                    >
                                        <ChevronLeft size={16} />
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => goToPage(pageNum)}
                                                    className={`min-w-[40px] h-10 transition-all duration-200 ${currentPage === pageNum
                                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl'
                                                        : 'border-gray-200 hover:bg-white hover:shadow-sm'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goToNextPage}
                                        disabled={currentPage === totalPages}
                                        className="p-2 border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200"
                                    >
                                        <ChevronRight size={16} />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goToLastPage}
                                        disabled={currentPage === totalPages}
                                        className="p-2 border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200"
                                    >
                                        <ChevronsRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Enhanced Activity Form Dialog */}
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="sm:max-w-[500px] rounded-2xl border-0 shadow-2xl">
                        <DialogHeader className="pb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                    {selectedActivity ? <Edit3 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-gray-900">
                                        {selectedActivity ? 'Chỉnh sửa Hoạt động' : 'Thêm Hoạt động Mới'}
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-600 mt-1">
                                        {selectedActivity
                                            ? 'Cập nhật thông tin hoạt động hiện tại.'
                                            : 'Nhập thông tin để tạo hoạt động mới trong hệ thống.'}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Tên Hoạt động <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-200"
                                    placeholder="Nhập tên hoạt động..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Mô tả chi tiết</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full min-h-[120px] p-4 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none transition-all duration-200"
                                    placeholder="Mô tả chi tiết về hoạt động này..."
                                    rows={4}
                                />
                            </div>

                            <div className="space-y-2">
  <label className="block text-sm font-semibold text-gray-700">Loại hoạt động</label>
  <Select
    value={formData.type}
    onValueChange={(value:any) => setFormData({ ...formData, type: value })}
  >
    <SelectTrigger className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white transition-all duration-200">
      <SelectValue placeholder="Chọn loại hoạt động" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Interview">Phỏng vấn</SelectItem>
      <SelectItem value="Assessment">Đánh giá</SelectItem>
      <SelectItem value="FinalInterview">Phỏng vấn cuối</SelectItem>
      <SelectItem value="Test">Kiểm tra</SelectItem>
      <SelectItem value="Training">Đào tạo</SelectItem>
    </SelectContent>
  </Select>
</div>

                            <DialogFooter className="pt-6 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-6 py-2.5 h-auto border-gray-200 hover:bg-gray-50 transition-all duration-200"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="submit"
                                    className="px-6 py-2.5 h-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {createMutation.isPending || updateMutation.isPending ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            {selectedActivity ? <Edit3 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                            {selectedActivity ? 'Cập nhật' : 'Tạo mới'}
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Enhanced Candidates Dialog */}
                {showCandidatesDialog && (
                    <Dialog open={!!showCandidatesDialog} onOpenChange={() => setShowCandidatesDialog(null)}>
                        <DialogContent className="sm:max-w-2xl rounded-2xl border-0 shadow-2xl">
                            <DialogHeader className="pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-bold text-gray-900">
                                            Ứng viên: {showCandidatesDialog.name}
                                        </DialogTitle>
                                        <DialogDescription className="text-gray-600 mt-1">
                                            Danh sách {showCandidatesDialog.candidates?.length || 0} ứng viên tham gia hoạt động này.
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="max-h-96 overflow-y-auto">
                                {showCandidatesDialog.candidates && showCandidatesDialog.candidates.length > 0 ? (
                                    <div className="space-y-4">
                                        {showCandidatesDialog.candidates.map((candidate, index) => (
                                            <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                            {candidate.candidate_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-gray-900 text-lg mb-2">
                                                                {candidate.candidate_name || 'Chưa có tên'}
                                                            </h4>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <Settings className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-gray-600">Vòng:</span>
                                                                    <span className="font-medium">{candidate.stage_name || 'Chưa xác định'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-gray-600">Thời gian:</span>
                                                                    <span className="font-medium">{candidate.start_date} - {candidate.end_date}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Users className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-gray-600">Phụ trách:</span>
                                                                    <span className="font-medium">{candidate.assignee}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        <Badge className={`${getStatusColor(candidate.status)} font-medium px-3 py-1 rounded-full border`}>
                                                            {candidate.status ? 'Hoàn thành' : 'Đang thực hiện'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 text-lg font-medium">Chưa có ứng viên nào</p>
                                        <p className="text-gray-400 text-sm mt-1">Hoạt động này chưa có ứng viên tham gia</p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="pt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCandidatesDialog(null)}
                                    className="px-6 py-2.5 h-auto border-gray-200 hover:bg-gray-50 transition-all duration-200"
                                >
                                    Đóng
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
                {showBulkDeleteConfirm && (
                    <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
                        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
                            <DialogHeader className="pb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                                        <AlertTriangle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-bold text-gray-900">Xác nhận xóa</DialogTitle>
                                        <DialogDescription className="text-gray-600 mt-1">
                                            Hành động này không thể hoàn tác
                                        </DialogDescription>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
                                    <p className="text-red-800 font-medium">
                                        Bạn có chắc chắn muốn xóa <span className="font-bold">{selectedActivityNames.length} hoạt động</span> đã chọn?
                                        Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                                    </p>
                                </div>
                            </DialogHeader>

                            <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div className="text-sm font-semibold text-gray-700 mb-3">Hoạt động sẽ bị xóa:</div>
                                <ul className="space-y-2">
                                    {activities
                                        ?.filter(activity => selectedActivityNames.includes(activity.name))
                                        .map(activity => (
                                            <li key={activity.name} className="flex items-center gap-3 text-sm">
                                                <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                                                <span className="text-gray-700 font-medium">{activity.name}</span>
                                                <Badge className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                                                    {activity.candidates?.length || 0} ứng viên
                                                </Badge>
                                            </li>
                                        ))}
                                </ul>
                            </div>

                            <DialogFooter className="pt-6 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowBulkDeleteConfirm(false)}
                                    disabled={bulkDeleteMutation.isPending}
                                    className="px-6 py-2.5 h-auto border-gray-200 hover:bg-gray-50 transition-all duration-200"
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={confirmBulkDelete}
                                    disabled={bulkDeleteMutation.isPending}
                                    className="px-6 py-2.5 h-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    {bulkDeleteMutation.isPending ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Đang xóa...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Xác nhận xóa
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

            </div>
        </div>
    );
}