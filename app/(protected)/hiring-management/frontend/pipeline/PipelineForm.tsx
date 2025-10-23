import { useState, useEffect } from 'react';
import { Button } from "@/app/frontend/components/ui/button";
import { Input } from "@/app/frontend/components/ui/input";
import { Textarea } from "@/app/frontend/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/frontend/components/ui/dialog";
import { PipelineFormData } from './types';

interface PipelineFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PipelineFormData) => void;
  initialData?: Partial<PipelineFormData>;
  isSubmitting: boolean;
  title: string;
  description: string;
}

export function PipelineForm({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting,
  title,
  description,
}: PipelineFormProps) {
  const [formData, setFormData] = useState<PipelineFormData>({
    name: '',
    descriptions: '',
    ...initialData
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        descriptions: initialData?.descriptions || '',
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên Pipeline <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Nhập tên pipeline"
              className="w-full"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <Textarea
              value={formData.descriptions}
              onChange={(e) => setFormData({ ...formData, descriptions: e.target.value })}
              placeholder="Nhập mô tả (tùy chọn)"
              className="w-full min-h-[100px]"
              disabled={isSubmitting}
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="px-6"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="px-6 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
