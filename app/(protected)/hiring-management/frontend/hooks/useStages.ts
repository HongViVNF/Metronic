import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Stage } from '../types/stage.types';

const API_BASE = '/hiring-management/api/stage';

export const useStages = () => {
  const queryClient = useQueryClient();

  // States
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch all stages
  const { data: stages = [], isLoading, error } = useQuery<Stage[]>({
    queryKey: ['stages'],
    queryFn: async () => {
      const response = await axios.get(API_BASE);
      return response.data || [];
    },
  });

  // Filter stages by search query
  const filteredStages = useMemo(() => {
    if (!searchQuery.trim()) return stages;
    const query = searchQuery.toLowerCase();
    return stages.filter(stage =>
      stage.name.toLowerCase().includes(query) ||
      stage.description?.toLowerCase().includes(query)
    );
  }, [stages, searchQuery]);

  // Paginate stages
  const paginatedStages = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStages.slice(startIndex, startIndex + pageSize);
  }, [filteredStages, currentPage, pageSize]);

  // Mutations
  const createStage = useMutation({
    mutationFn: async (data: Omit<Stage, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await axios.post(API_BASE, data);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stages'] }),
  });

  const updateStage = useMutation({
    mutationFn: async (data: Stage) => {
      const response = await axios.put(API_BASE, data);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stages'] }),
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(API_BASE, { data: { id } });
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      setSelectedStageIds(prev => prev.filter(pid => pid !== deletedId));
    },
  });

  const bulkDeleteStages = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => axios.delete(API_BASE, { data: { id } })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      setSelectedStageIds([]);
    },
  });

  // Handle selection
  const handleSelectStage = useCallback((stageId: string, checked: boolean) => {
    setSelectedStageIds(prev =>
      checked ? [...prev, stageId] : prev.filter(id => id !== stageId)
    );
  }, []);

  const handleSelectAll = useCallback((checked: boolean, currentPageStages: Stage[]) => {
    if (checked) {
      const newSelectedIds = [...new Set([...selectedStageIds, ...currentPageStages.map(s => s.id)])];
      setSelectedStageIds(newSelectedIds);
    } else {
      const currentPageIds = currentPageStages.map(s => s.id);
      setSelectedStageIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    }
  }, [selectedStageIds]);

  return {
    stages,
    filteredStages,
    paginatedStages,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    selectedStageIds,
    setSelectedStageIds,
    createStage,
    updateStage,
    deleteStage,
    bulkDeleteStages,
    handleSelectStage,
    handleSelectAll,
  };
};
