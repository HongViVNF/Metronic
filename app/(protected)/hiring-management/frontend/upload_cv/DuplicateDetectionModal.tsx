"use client";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/frontend/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/app/frontend/components/ui/card";
import { Button } from "@/app/frontend/components/ui/button";
import { Badge } from "@/app/frontend/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/app/frontend/components/ui/radio-group";
import { Label } from "@/app/frontend/components/ui/label";
import { Separator } from "@/app/frontend/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/frontend/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/frontend/components/ui/table";
import {
  AlertTriangle,
  FileText,
  User,
  Mail,
  Calendar,
  ExternalLink,
  Users,
  AlertCircle,
  Loader2,
  Lightbulb,
  CheckCircle2,
  Edit3,
} from "lucide-react";

// Interfaces
interface DuplicateCandidate {
  id: string;
  candidate_id: string;
  job_id: string;
  file_url: string | null;
  hash: string;
  status: string;
  fileName: string;
  existingCandidate: {
    id: string;
    full_name: string;
    email: string;
    cv_link: string | null;
    created_at: string;
    pipeline_status?: string;
    job_id?: string;
    stage_id?: string;
    fit_score?: number;
  };
  suggestedAction: "merge" | "replace" | "create_new" | "skip";
  reason: string;
  newData?: {
    full_name?: string;
    email?: string;
    birthdate?: string | null;
    gender?: string | null;
    position?: string;
    experience?: string;
    skills?: string;
    fit_score?: number;
    strengths?: string;
    weaknesses?: string;
    cv_summary?: string | null;
    evaluation?: string | null;
    pipeline_status?: string | null;
    stage_id?: string | null;
  };
}

interface DuplicateDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicateCandidate[];
  onSkip: () => void;
  onProcess: (mode: "merge" | "replace" | "create_new") => void;
}

export default function DuplicateDetectionModal({
  isOpen,
  onClose,
  duplicates,
  onSkip,
  onProcess,
}: DuplicateDetectionModalProps) {
  const queryClient = useQueryClient();
  const [selectedMode, setSelectedMode] = useState<"merge" | "replace" | "create_new">("merge");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [individualActions, setIndividualActions] = useState<Record<string, "merge" | "replace" | "create_new" | "skip">>({}); 
  const [useSmartSuggestions, setUseSmartSuggestions] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Process duplicates mutation
  const processMutation = useMutation({
    mutationFn: async ({ duplicates, mode }: { duplicates: any[]; mode: string }) => {
      const response = await axios.post("/hiring-management/api/process", {
        duplicates,
        mode,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      setShowConfirmModal(false);
      onClose();
    },
    onError: (error: any) => {
      console.error("Process error:", error);
      alert(error.response?.data?.message || "Lỗi khi xử lý CV trùng lặp");
    },
  });

  const handleProcessDuplicates = () => {
    // Check if any individual actions are set
    const hasIndividualActions = Object.keys(individualActions).length > 0;
    if (!hasIndividualActions && !selectedMode) {
      alert("Vui lòng chọn phương thức xử lý hoặc thiết lập hành động cho từng CV");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmProcessDuplicates = () => {
    // Group duplicates by their individual actions
    const actionGroups: Record<string, any[]> = {
      merge: [],
      replace: [],
      create_new: [],
      skip: []
    };

    duplicates.forEach(duplicate => {
      const action = individualActions[duplicate.id] || duplicate.suggestedAction;
      if (action !== 'skip') {
        actionGroups[action].push({
          candidateId: duplicate.existingCandidate.id,
          fileName: duplicate.fileName,
          hash: duplicate.hash,
        });
      }
    });

    // Process each group separately
    const processPromises: Promise<any>[] = [];
    
    if (actionGroups.merge.length > 0) {
      processPromises.push(
        processMutation.mutateAsync({ duplicates: actionGroups.merge, mode: 'merge' })
      );
    }
    
    if (actionGroups.replace.length > 0) {
      processPromises.push(
        processMutation.mutateAsync({ duplicates: actionGroups.replace, mode: 'replace' })
      );
    }
    
    if (actionGroups.create_new.length > 0) {
      processPromises.push(
        processMutation.mutateAsync({ duplicates: actionGroups.create_new, mode: 'create_new' })
      );
    }

    // Execute all processes
    Promise.all(processPromises).then(() => {
      onProcess('merge'); // Use merge as default for mixed processing
    }).catch((error) => {
      console.error('Error processing duplicates:', error);
    });
  };

  const getModeDescription = (mode: string) => {
    switch (mode) {
      case "merge":
        return "Gộp dữ liệu mới vào hồ sơ cũ (không ghi đè thông tin đã có)";
      case "replace":
        return "Ghi đè toàn bộ hồ sơ cũ bằng dữ liệu mới";
      case "create_new":
        return "Tạo ứng viên mới song song (cùng email nhưng khác ID)";
      default:
        return "";
    }
  };

  const handleClose = () => {
    setSelectedMode("merge");
    setShowConfirmModal(false);
    setIndividualActions({});
    setUseSmartSuggestions(true);
    onClose();
  };

  // Initialize individual actions with smart suggestions
  React.useEffect(() => {
    if (duplicates.length > 0 && useSmartSuggestions) {
      const initialActions: Record<string, "merge" | "replace" | "create_new" | "skip"> = {};
      duplicates.forEach(duplicate => {
        initialActions[duplicate.id] = duplicate.suggestedAction as "merge" | "replace" | "create_new" | "skip";
      });
      setIndividualActions(initialActions);
    }
  }, [duplicates, useSmartSuggestions]);

  // Group duplicates by suggested action
  const groupedDuplicates = React.useMemo(() => {
    const groups = {
      skip: duplicates.filter(d => d.suggestedAction === 'skip'),
      merge: duplicates.filter(d => d.suggestedAction === 'merge'),
      replace: duplicates.filter(d => d.suggestedAction === 'replace'),
      create_new: duplicates.filter(d => d.suggestedAction === 'create_new')
    };
    return groups;
  }, [duplicates]);

  // Set initial active tab to the first non-empty group
  React.useEffect(() => {
    if (duplicates.length > 0) {
      const firstNonEmptyGroup = Object.entries(groupedDuplicates).find(([_, items]) => items.length > 0)?.[0];
      if (firstNonEmptyGroup) {
        setActiveTab(firstNonEmptyGroup);
      }
    }
  }, [duplicates, groupedDuplicates]);

  const handleIndividualActionChange = (duplicateId: string, action: "merge" | "replace" | "create_new" | "skip") => {
    setIndividualActions(prev => ({
      ...prev,
      [duplicateId]: action
    }));
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'skip': return 'text-gray-600 bg-gray-100';
      case 'merge': return 'text-blue-600 bg-blue-100';
      case 'replace': return 'text-orange-600 bg-orange-100';
      case 'create_new': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Render table for each tab
  const renderDuplicateTable = (duplicatesList: DuplicateCandidate[], suggestedAction: string) => {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="h-[400px] overflow-y-auto">
          <div className="overflow-x-auto">
        <Table>
        <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
            <TableRow>
            <TableHead className="w-[200px] sticky top-0 bg-white z-10">Tên file</TableHead>
            <TableHead className="sticky top-0 bg-white z-10">Ứng viên hiện tại</TableHead>
            <TableHead className="sticky top-0 bg-white z-10">CV mới</TableHead>
            <TableHead className="sticky top-0 bg-white z-10">Email</TableHead>
            <TableHead className="sticky top-0 bg-white z-10">Trạng thái</TableHead>
            <TableHead className="sticky top-0 bg-white z-10">Lý do gợi ý</TableHead>
            <TableHead className="w-[150px] sticky top-0 bg-white z-10">Hành động</TableHead>
            <TableHead className="w-[100px] sticky top-0 bg-white z-10">CV cũ</TableHead>
            <TableHead className="w-[100px] sticky top-0 bg-white z-10">CV mới</TableHead>
            </TableRow>
        </TableHeader>
          <TableBody>
            {duplicatesList.map((duplicate) => {
              const currentAction = individualActions[duplicate.id] || duplicate.suggestedAction;
              return (
                <TableRow key={duplicate.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-sm">{duplicate.fileName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 w-[100px]">
                      <div className="font-medium">{duplicate.existingCandidate.full_name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(duplicate.existingCandidate.created_at).toLocaleDateString('vi-VN')}
                      </div>
                      {duplicate.existingCandidate.fit_score && (
                        <div className="text-xs text-blue-600">
                          Score: {duplicate.existingCandidate.fit_score}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {duplicate.newData && (
                      <div className="space-y-1">
                        <div className="font-medium">{duplicate.newData.full_name || 'N/A'}</div>
                        {duplicate.newData.fit_score && (
                          <div className="text-xs text-green-600">
                            Score: {duplicate.newData.fit_score}
                            {duplicate.existingCandidate.fit_score && (
                              <span className={`ml-1 ${
                                duplicate.newData.fit_score > duplicate.existingCandidate.fit_score 
                                  ? 'text-green-600' 
                                  : duplicate.newData.fit_score < duplicate.existingCandidate.fit_score 
                                  ? 'text-red-600' 
                                  : 'text-gray-600'
                              }`}>
                                ({duplicate.newData.fit_score > duplicate.existingCandidate.fit_score ? '+' : ''}
                                {(duplicate.newData.fit_score - duplicate.existingCandidate.fit_score).toFixed(1)})
                              </span>
                            )}
                          </div>
                        )}
                        {duplicate.newData.position && (
                          <div className="text-xs text-gray-500">
                            {duplicate.newData.position}
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{duplicate.existingCandidate.email}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {duplicate.existingCandidate.pipeline_status || 'pending'}
                      </Badge>
                      {duplicate.newData?.pipeline_status && duplicate.newData.pipeline_status !== duplicate.existingCandidate.pipeline_status && (
                        <Badge variant="outline" className="text-xs bg-green-50">
                          New: {duplicate.newData.pipeline_status}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 w-[100px]">{duplicate.reason}</div>
                  </TableCell>
                  <TableCell>
                  <RadioGroup 
                    value={currentAction} 
                    onValueChange={(value:any) => handleIndividualActionChange(duplicate.id, value as any)}
                  >
                    <div className="space-y-1">
                      {["skip", "merge", "replace", "create_new"].map((action) => (
                        <div key={action} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={action}
                            id={`${action}-${duplicate.id}`}
                            className="h-3 w-3 border border-gray-400 rounded-full data-[state=checked]:bg-gray-700 data-[state=checked]:scale-75 focus:outline-none focus:ring-0"
                          />
                          <Label htmlFor={`${action}-${duplicate.id}`} className="text-xs cursor-pointer capitalize">
                            {action.replace("_", " ")}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                  </TableCell>
                  <TableCell>
                    {duplicate.existingCandidate.cv_link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(duplicate.existingCandidate.cv_link!, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {duplicate.file_url && duplicate.file_url !== 'null' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(duplicate.file_url!, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
        </div>
      </div>
    );
  };



  return (
    <>
      {/* Duplicate Detection Modal */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-7xl h-[950px] overflow-auto">
          <DialogHeader className="sticky top-0 bg-white">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Phát hiện CV trùng lặp
            </DialogTitle>
            <DialogDescription>
              Tìm thấy {duplicates.length} CV trùng lặp. Vui lòng chọn cách xử lý.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header with Smart Suggestions Toggle */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Danh sách CV trùng lặp ({duplicates.length})
              </h4>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <Label className="text-sm font-medium">Gợi ý thông minh</Label>
                <input
                  type="checkbox"
                  id="smart-suggestions-toggle"
                  checked={useSmartSuggestions}
                  onChange={(e) => setUseSmartSuggestions(e.target.checked)}
                  className="rounded"
                  aria-label="Bật/tắt gợi ý thông minh"
                />
              </div>
            </div>

            {/* Tabbed Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="skip" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Skip ({groupedDuplicates.skip.length})
                </TabsTrigger>
                <TabsTrigger value="merge" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Merge ({groupedDuplicates.merge.length})
                </TabsTrigger>
                <TabsTrigger value="replace" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Replace ({groupedDuplicates.replace.length})
                </TabsTrigger>
                <TabsTrigger value="create_new" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Create New ({groupedDuplicates.create_new.length})
                </TabsTrigger>
              </TabsList>

              {/* Skip Tab */}
              <TabsContent value="skip" className="mt-4">
                {groupedDuplicates.skip.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Các CV được gợi ý <strong>bỏ qua</strong> - thường do đang trong quá trình tuyển dụng hoặc đã được tuyển
                      </p>
                    </div>
                    {renderDuplicateTable(groupedDuplicates.skip, 'skip')}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Không có CV nào được gợi ý bỏ qua
                  </div>
                )}
              </TabsContent>

              {/* Merge Tab */}
              <TabsContent value="merge" className="mt-4">
                {groupedDuplicates.merge.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-700 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Các CV được gợi ý <strong>gộp dữ liệu</strong> - cập nhật thông tin mới vào hồ sơ cũ
                      </p>
                    </div>
                    {renderDuplicateTable(groupedDuplicates.merge, 'merge')}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Không có CV nào được gợi ý gộp dữ liệu
                  </div>
                )}
              </TabsContent>

              {/* Replace Tab */}
              <TabsContent value="replace" className="mt-4">
                {groupedDuplicates.replace.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-sm text-orange-700 flex items-center gap-2">
                        <Edit3 className="h-4 w-4" />
                        Các CV được gợi ý <strong>ghi đè</strong> - thay thế hoàn toàn dữ liệu cũ
                      </p>
                    </div>
                    {renderDuplicateTable(groupedDuplicates.replace, 'replace')}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Không có CV nào được gợi ý ghi đè
                  </div>
                )}
              </TabsContent>

              {/* Create New Tab */}
              <TabsContent value="create_new" className="mt-4">
                {groupedDuplicates.create_new.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Các CV được gợi ý <strong>tạo hồ sơ mới</strong> - tạo ứng viên riêng biệt
                      </p>
                    </div>
                    {renderDuplicateTable(groupedDuplicates.create_new, 'create_new')}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Không có CV nào được gợi ý tạo mới
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Batch Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Hành động hàng loạt (tùy chọn)</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const actions: Record<string, "merge" | "replace" | "create_new" | "skip"> = {};
                    duplicates.forEach(duplicate => {
                      actions[duplicate.id] = duplicate.suggestedAction as "merge" | "replace" | "create_new" | "skip";
                    });
                    setIndividualActions(actions);
                  }}
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Áp dụng tất cả gợi ý
                </Button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Áp dụng cùng một hành động cho tất cả CV:</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const actions: Record<string, "merge" | "replace" | "create_new" | "skip"> = {};
                      duplicates.forEach(duplicate => { actions[duplicate.id] = 'merge'; });
                      setIndividualActions(actions);
                    }}
                  >
                    Tất cả Merge
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const actions: Record<string, "merge" | "replace" | "create_new" | "skip"> = {};
                      duplicates.forEach(duplicate => { actions[duplicate.id] = 'replace'; });
                      setIndividualActions(actions);
                    }}
                  >
                    Tất cả Replace
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const actions: Record<string, "merge" | "replace" | "create_new" | "skip"> = {};
                      duplicates.forEach(duplicate => { actions[duplicate.id] = 'skip'; });
                      setIndividualActions(actions);
                    }}
                  >
                    Tất cả Skip
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onSkip}>
              Bỏ qua tất cả CV trùng
            </Button>
            <Button onClick={handleProcessDuplicates}>
              Xử lý theo lựa chọn ({Object.keys(individualActions).length}/{duplicates.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Xác nhận xử lý
            </DialogTitle>
            {/* <DialogDescription>
              {Object.keys(individualActions).length > 0 ? (
                <div>
                  Bạn có chắc chắn muốn xử lý {duplicates.length} CV trùng lặp theo các hành động đã chọn?
                  <div className="mt-2 space-y-1 text-sm">
                    {Object.entries(
                      duplicates.reduce((acc, dup) => {
                        const action = individualActions[dup.id] || dup.suggestedAction;
                        acc[action] = (acc[action] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([action, count]) => (
                      <div key={action} className="flex justify-between">
                        <span className="capitalize">{action.replace('_', ' ')}: </span>
                        <span className="font-medium">{count} CV</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  Bạn có chắc chắn muốn xử lý {duplicates.length} CV trùng lặp bằng phương thức{" "}
                  <span className="font-medium">
                    {selectedMode === "merge" && "Merge (Gộp dữ liệu)"}
                    {selectedMode === "replace" && "Replace (Ghi đè)"}
                    {selectedMode === "create_new" && "Create New (Tạo mới)"}
                  </span>
                  ?
                </div>
              )}
            </DialogDescription> */}
            <DialogDescription>
  {Object.keys(individualActions).length > 0 ? (
    <div>
      Bạn có chắc chắn muốn xử lý {duplicates.length} CV trùng lặp theo các hành động đã chọn?
      <div className="mt-2 space-y-4 text-sm">
        {Object.entries(
          duplicates.reduce((acc, dup) => {
            const action = individualActions[dup.id] || dup.suggestedAction;
            acc[action] = (acc[action] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([action, count]) => (
          <div key={action} className="space-y-1">
            <div className="flex justify-between font-semibold capitalize">
              <span>{action.replace('_', ' ')}:</span>
              <span>{count} CV</span>
            </div>
            <p className="text-gray-600">{getModeDescription(action)}</p>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div>
      Bạn có chắc chắn muốn xử lý {duplicates.length} CV trùng lặp bằng phương thức{" "}
      <span className="font-medium">
        {selectedMode === "merge" && "Merge (Gộp dữ liệu)"}
        {selectedMode === "replace" && "Replace (Ghi đè)"}
        {selectedMode === "create_new" && "Create New (Tạo mới)"}
      </span>
      ?
      <div className="mt-2 text-sm text-gray-600">
        {getModeDescription(selectedMode)}
      </div>
    </div>
  )}
</DialogDescription>
          </DialogHeader>
          
          {/* <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              {getModeDescription(selectedMode)}
            </p>
          </div> */}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Hủy
            </Button>
            <Button 
              onClick={confirmProcessDuplicates}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
