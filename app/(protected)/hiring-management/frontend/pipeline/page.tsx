// 'use client';

import HiringPipelineTable from "./pipeline";

// import { useMemo, useState } from 'react';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { StageColumn } from '../stage/liststage';
// import { StageDetailPage } from '../stage/StageDetailPage';
// import { createStage, CreateStageData, fetchStages, moveCandidates, removeStage, updateStage, UpdateStageData } from '../services/stageService';
// import { Button } from '@/app/frontend/components/ui/button';
// import { ArrowLeft, Plus } from 'lucide-react';
// import { Candidate } from '../candidate/CandidateDetail';
// import StageDrawer from './stagedrawer';
// import { CandidatePipeline } from '../types/pipeline.types';
// import { CandidateStage, Stage } from '../types/stage.types';
// import { candidateService } from '../services/candidateService';
// import { toast } from 'sonner';
// import { Activity } from '../types/activity.types';
// import { jobService } from '../services/jobService';

// type RecruitmentKanbanProps = {
//   hiringPipelineId: string;
//   onGoBack?: () => void;
//   showBackButton?: boolean;
// }

// const RecruitmentKanban = ({ hiringPipelineId, onGoBack, showBackButton = true }: any) => {
//   const queryClient = useQueryClient();
//   const [selectedCandidate, setSelectedCandidate] = useState<CandidatePipeline | null>(null);
//   const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
//   const [deletingStageId, setDeletingStageId] = useState<string | null>(null);
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   const [editingStage, setEditingStage] = useState<Stage | null>(null);

//   // Lấy danh sách stages
//   const { data: stages = [], isLoading } = useQuery<Stage[]>({
//     queryKey: ['stages', hiringPipelineId],
//     queryFn: () => fetchStages(hiringPipelineId),
//   });

//   // Sort stages by order
//   const sortedStages = useMemo(() => {
//     return [...stages].sort((a, b) => (a.settings?.order || 0) - (b.settings?.order || 0));
//   }, [stages]);

//   // Fetch candidates (đảm bảo response khớp Candidate type với birthdate: string)
//   const { data: allCandidates = [] } = useQuery<CandidateStage[]>({
//     queryKey: ['candidates', hiringPipelineId],
//     queryFn: async () => {
//       const data = await candidateService.getList();
//       // Nếu API trả Date, convert thành string để khớp type
//       return data.map((c: any) => ({
//         ...c,
//         birthdate: c.birthdate ? new Date(c.birthdate).toISOString() : null,
//       }));
//     },
//   });
//   console.log(allCandidates);

//   // Filter candidates with no stage_id
//   const unassignedCandidates = useMemo(() => {
//     return allCandidates.filter(
//       (candidate) => !candidate.stage_id && candidate.pipeline_status !== 'reject'
//     );
//   }, [allCandidates]);

//   const deleteStageMutation = useMutation({
//     mutationFn: async (stageId: string) => {
//       await removeStage({ stageId });
//       return stageId;
//     },
//     onMutate: (stageId: string) => {
//       setDeletingStageId(stageId);
//     },
//     onSuccess: (stageId: string) => {
//       setDeletingStageId(null);
//       if (selectedStageId === stageId) {
//         setSelectedStageId(null);
//       }
//       queryClient.invalidateQueries({ queryKey: ['stages', hiringPipelineId] });
//     },
//     onError: () => {
//       setDeletingStageId(null);
//       // TODO: add toast notification if needed
//     },
//   });

//   // Mutations for create/update stage
//   const createStageMutation = useMutation({
//     mutationFn: createStage,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['stages', hiringPipelineId] });
//       setIsDrawerOpen(false);
//       setEditingStage(null);
//     },
//     onError: (error) => {
//       console.error('Error creating stage:', error);
//     },
//   });

//   const updateStageMutation = useMutation({
//     mutationFn: ({ id, data }: { id: string; data: UpdateStageData }) => updateStage(id, data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['stages', hiringPipelineId] });
//       setIsDrawerOpen(false);
//       setEditingStage(null);
//     },
//     onError: (error) => {
//       console.error('Error updating stage:', error);
//     },
//   });

//   const moveCandidatesMutation = useMutation({
//     mutationFn: moveCandidates,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['stages', hiringPipelineId] });
//       queryClient.invalidateQueries({ queryKey: ['candidates', hiringPipelineId] });
//     },
//     onError: (error) => {
//       console.error('Error moving candidates:', error);
//     },
//   });

//   // Handlers
//   const handleOpenCreateStage = () => {
//     setEditingStage(null);
//     setIsDrawerOpen(true);
//   };

//   const handleOpenEditStage = (stage: Stage) => {
//     setEditingStage(stage);
//     setIsDrawerOpen(true);
//   };

//   const handleCloseDrawer = () => {
//     setIsDrawerOpen(false);
//     setEditingStage(null);
//   };

//   const handleCreateStage = async (stageData: CreateStageData) => {
//     const newStage = await createStageMutation.mutateAsync({
//       ...stageData,
//       hiring_pipeline_id: hiringPipelineId,
//     });
//     // Clear selected candidate sau khi tạo stage thành công
//     setSelectedCandidate(null);
//     return newStage;
//   };

//   const handleUpdateStage = async (stageData: UpdateStageData & { id: string }) => {
//     await updateStageMutation.mutateAsync({
//       id: stageData.id,
//       data: {
//         name: stageData.name,
//         description: stageData.description,
//         settings: stageData.settings,
//         updated_by: stageData.updated_by,
//         order: stageData.order,
//       },
//     });
//   };

//   const handleUpdateCandidateStage = async ({ candidate, stageId }: { candidate: Candidate; stageId: string | null }) => {
//     await moveCandidatesMutation.mutateAsync({
//       candidateIds: [candidate.id],
//       stageId: stageId || '',
//     });
//   };

//   const handleCreateActivity = async (data: Activity) => {
//     // Placeholder for activity creation
//     console.log('Creating activity:', data);
//     toast.info('Chức năng tạo hoạt động đang được phát triển');
//     // TODO: Implement activity creation API
//     return { candidates: [] };
//   };

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
//         </div>
//       </div>
//     );
//   }

//   // Kanban view
//   return (
//     <div className="w-full ">
//       <div className="max-w-full mx-auto px-6 py-8 ">
//         {showBackButton && onGoBack && (
//           <Button
//             onClick={onGoBack}
//             className="mb-4 bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
//           >
//             <ArrowLeft size={16} />
//             Go Back
//           </Button>
//         )}
//         <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
//           <div className="flex-1 min-w-0">
//             <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent mb-2">
//               Recruitment Pipeline
//             </h1>
//             <p className="text-gray-600 text-lg">Quản lý quy trình tuyển dụng với Kanban Board</p>
//           </div>
//           <div className="flex items-center gap-3 flex-shrink-0">
//             <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200">
//               <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//               <span className="text-sm text-gray-600 font-medium">{sortedStages.length} stages</span>
//             </div>
//             <button
//               type="button"
//               onClick={handleOpenCreateStage}
//               className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
//             >
//               <Plus className="w-5 h-5" />
//               <span className="hidden sm:inline">Tạo Stage Mới</span>
//               <span className="sm:hidden">Stage</span>
//             </button>
//           </div>
//         </div>

//         {/* Kanban grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//           {/* Unassigned Candidates Column */}
//           {/* {unassignedCandidates.length > 0 && (
//             <div className="w-full">
//               <div className="border-2 border-dashed border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm p-4">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     Ứng viên chưa phân stage ({unassignedCandidates.length})
//                   </h3>
//                 </div>
//                 <div className="max-h-[400px] overflow-y-auto">
//                   {unassignedCandidates.map((candidate) => (
//                     <div
//                       key={candidate.id}
//                       className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
//                       onClick={() => setSelectedCandidate(candidate as CandidatePipeline)} // Cast nếu cần
//                     >
//                       <div className="flex-1 min-w-0">
//                         <div className="font-medium text-sm text-gray-900 truncate">{candidate.full_name}</div>
//                         <div className="text-xs text-gray-500 truncate">
//                           {candidate.position} • {candidate.experience}
//                         </div>
//                       </div>
//                       <div className="flex-shrink-0 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
//                         {candidate.fit_score}%
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )} */}

//           {/* Stage Columns */}
//           {sortedStages.map((stage) => (
//             <StageColumn
//               key={stage.id}
//               stage={stage}
//               selectedStageId={selectedStageId}
//               deletingStageId={deletingStageId}
//               isDeleting={deleteStageMutation.isPending}
//               onDeleteStage={(stageId) => deleteStageMutation.mutate(stageId)}
//               onViewStage={(stage) => {
//                 setSelectedStageId(stage.id);
//               }}
//               onSelectCandidate={setSelectedCandidate}
//               onEditStage={handleOpenEditStage}
//               stages={stages}
//               onCreateActivity={handleCreateActivity}
//               fetchAllCandidates={() => Promise.resolve({ data: allCandidates })}
//             />
//           ))}

//           {/* Add new stage button (hiển thị cùng layout) */}
//           {sortedStages.length < 12 && (
//             <div className="w-full">
//               <button
//                 onClick={handleOpenCreateStage}
//                 className="w-full border-2 border-dashed border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-blue-600 min-h-[220px]"
//               >
//                 <div className="w-10 h-10 rounded-full bg-gray-100 hover:bg-blue-100 flex items-center justify-center transition-colors duration-200">
//                   <Plus className="w-5 h-5" />
//                 </div>
//                 <div className="text-center">
//                   <p className="text-sm font-medium">Thêm Stage</p>
//                   <p className="text-xs">Tạo giai đoạn mới</p>
//                 </div>
//               </button>
//             </div>
//           )}
//         </div>

//         {/* StageDrawer */}
//         <StageDrawer
//           isOpen={isDrawerOpen}
//           onClose={handleCloseDrawer}
//           onCreateStage={handleCreateStage}
//           onUpdateStage={handleUpdateStage}
//           onDeleteStage={async (stageId) => {
//             try {
//               await deleteStageMutation.mutateAsync(stageId);
//             } catch (error) {
//               console.error('Error deleting stage:', error);
//               throw error; // Re-throw to let the StageDrawer handle the error
//             }
//           }}
//           onUpdateCandidateStage={handleUpdateCandidateStage}
//           allCandidates={allCandidates}
//           isCreating={createStageMutation.isPending}
//           stage={editingStage}
//           selectedCandidate={selectedCandidate}
//         />
//       </div>
//     </div>
//   );
// };

// export default RecruitmentKanban;

export default function PipelinePage() {
  return <HiringPipelineTable />;
}


