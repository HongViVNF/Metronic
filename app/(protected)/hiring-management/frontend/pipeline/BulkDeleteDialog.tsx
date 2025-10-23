import { Button } from "@/app/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/frontend/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { HiringPipeline } from './types';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedPipelineIds: string[];
  pipelines: HiringPipeline[];
  isDeleting: boolean;
}

export function BulkDeleteDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  selectedPipelineIds,
  pipelines,
  isDeleting,
}: BulkDeleteDialogProps) {
  const selectedPipelines = pipelines.filter(pipeline => 
    selectedPipelineIds.includes(pipeline.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </div>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa{' '}
            <span className="font-semibold text-red-600">
              {selectedPipelineIds.length} pipeline
            </span>
            ? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        {selectedPipelines.length > 0 && (
          <div className="mt-4 max-h-48 overflow-y-auto bg-gray-50 rounded-md p-3">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Pipeline sẽ bị xóa:
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              {selectedPipelines.map((pipeline) => (
                <li 
                  key={pipeline.id} 
                  className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded"
                >
                  <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></span>
                  <span className="truncate">{pipeline.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="px-6"
          >
            Hủy bỏ
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-6 bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Đang xóa...
              </>
            ) : (
              'Xác nhận xóa'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
