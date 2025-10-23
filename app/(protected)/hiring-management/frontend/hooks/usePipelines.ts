import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { HiringPipeline, PipelineFormData } from '../pipeline/types';

const API_BASE = '/hiring-management/api/hiringpipeline';

export const usePipelines = () => {
  const queryClient = useQueryClient();
  const [selectedPipelineIds, setSelectedPipelineIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all pipelines
  const { data: pipelines = [], isLoading, error } = useQuery<HiringPipeline[]>({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const response = await axios.get(API_BASE);
      return response.data || [];
    },
  });

  // Filter pipelines based on search query
  const filteredPipelines = useMemo(() => {
    if (!searchQuery.trim()) return pipelines;
    const query = searchQuery.toLowerCase();
    return pipelines.filter(
      (pipeline) =>
        pipeline.name.toLowerCase().includes(query) ||
        pipeline.descriptions?.toLowerCase().includes(query) ||
        false
    );
  }, [pipelines, searchQuery]);

  // Create pipeline mutation
  const createPipeline = useMutation({
    mutationFn: async (data: Omit<HiringPipeline, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await axios.post(API_BASE, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });

  // Update pipeline mutation
  const updatePipeline = useMutation({
    mutationFn: async (data: HiringPipeline) => {
      const response = await axios.put(API_BASE, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });

  // Delete pipeline mutation
  const deletePipeline = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(API_BASE, { data: { id } });
      return id; // Return the id to use in onSuccess
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      setSelectedPipelineIds(prev => prev.filter(pid => pid !== deletedId));
    },
  });

  // Bulk delete pipelines
  const bulkDeletePipelines = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map(id => 
          axios.delete(API_BASE, { data: { id } })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      setSelectedPipelineIds([]);
    },
  });

  // Handle pipeline selection
  const handleSelectPipeline = useCallback((pipelineId: string, checked: boolean) => {
    setSelectedPipelineIds(prev => 
      checked 
        ? [...prev, pipelineId] 
        : prev.filter(id => id !== pipelineId)
    );
  }, []);

  // Handle select all pipelines
  const handleSelectAll = useCallback((checked: boolean, currentPagePipelines: HiringPipeline[]) => {
    if (checked) {
      const newSelectedIds = [...new Set([...selectedPipelineIds, ...currentPagePipelines.map(p => p.id)])];
      setSelectedPipelineIds(newSelectedIds);
    } else {
      const currentPageIds = currentPagePipelines.map(p => p.id);
      setSelectedPipelineIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    }
  }, [selectedPipelineIds]);

  return {
    pipelines,
    filteredPipelines,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedPipelineIds,
    setSelectedPipelineIds,
    createPipeline,
    updatePipeline,
    deletePipeline,
    bulkDeletePipelines,
    handleSelectPipeline,
    handleSelectAll,
  };
};
