import { HiringPipeline } from './types';

export const usePagination = <T>(items: T[], itemsPerPage: number, currentPage: number) => {
  const totalPages = Math.ceil(items.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const pages: number[] = [];
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return {
    currentItems,
    totalPages,
    startIndex,
    endIndex,
    getPageNumbers,
  };
};

export const getIndeterminateState = (
  currentPageItems: HiringPipeline[],
  selectedIds: string[]
) => {
  const currentPageIds = currentPageItems.map(item => item.id);
  const selectedCount = selectedIds.filter(id => currentPageIds.includes(id)).length;
  
  if (selectedCount === 0) return { isAllSelected: false, isIndeterminate: false };
  if (selectedCount === currentPageItems.length) return { isAllSelected: true, isIndeterminate: false };
  return { isAllSelected: false, isIndeterminate: true };
};
