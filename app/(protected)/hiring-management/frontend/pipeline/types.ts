export interface HiringPipeline {
  id: string;
  name: string;
  descriptions?: string;
  isDefault?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
  stages?: { id: string; name: string }[];
}

export interface PipelineFormData {
  name: string;
  descriptions: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export interface PipelineTableProps {
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

export interface PipelineFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PipelineFormData) => void;
  initialData?: Partial<PipelineFormData>;
  isSubmitting: boolean;
  title: string;
  description: string;
}

export interface BulkDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedPipelineIds: string[];
  pipelines: HiringPipeline[];
  isDeleting: boolean;
}
