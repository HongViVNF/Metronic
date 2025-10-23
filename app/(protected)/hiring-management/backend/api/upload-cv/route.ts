import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';
import { processMultipleCVs } from '@/lib/geminiClient';
import { Candidate } from '@prisma/client';
import logger from '@/lib/logger';
import { uploadToS3 } from '@/lib/s3Upload';

// Helper function to generate SHA256 hash from file buffer
function generateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Helper function to generate smart suggestions for duplicates
function generateSmartSuggestion(existingCandidate: any, newJobId: string, newData?: any): { suggestedAction: string; reason: string } {
  // Status priority configuration - higher priority means more restrictive
  const statusPriorities = {
    // Priority 1: Active/final processes - should skip
    'hired': 1,
    'accepted': 1,
    'offer_accepted': 1,

    // Priority 2: Offer/decision pending - should skip to avoid confusion
    'offered': 2,
    'offer_pending': 2,
    'final_interview': 2,

    // Priority 3: Active interviews - should skip
    'interviewing': 3,
    'interview_scheduled': 3,
    'in_progress': 3,
    'technical_interview': 3,
    'hr_interview': 3,

    // Priority 4: Rejected/withdrawn - can merge or create new
    'rejected': 4,
    'declined': 4,
    'withdrawn': 4,
    'ghosted': 4,
    'not_interested': 4,

    // Priority 5: Early stages - can replace or create new
    'pending': 5,
    'applied': 5,
    'screening': 5,
    'reviewed': 5,
    'shortlisted': 5,
    'on_hold': 5,

    // Default priority for unknown statuses
    'unknown': 6
  };

  const status = (existingCandidate.pipeline_status || '').toLowerCase();
  const currentJobId = existingCandidate.job_id;
  const sameJob = currentJobId && newJobId && currentJobId === newJobId;

  // If newData has different status, consider it for better decision making
  const newStatus = newData?.pipeline_status ? (newData.pipeline_status || '').toLowerCase() : status;
  const effectiveStatus = newStatus !== status && newStatus ? newStatus : status;

  const statusPriority = statusPriorities[effectiveStatus as keyof typeof statusPriorities] || statusPriorities.unknown;

  // Priority 1: Final/accepted candidates - always skip
  if (statusPriority === 1) {
    return {
      suggestedAction: 'skip',
      reason: `Ứng viên đã được ${effectiveStatus === 'hired' ? 'tuyển dụng' : 'chấp nhận offer'}`
    };
  }

  // Priority 2: Offer pending - skip to avoid confusion
  if (statusPriority === 2) {
    return {
      suggestedAction: 'skip',
      reason: 'Ứng viên đang trong quá trình offer, không nên thay đổi dữ liệu'
    };
  }

  // Priority 3: Active interviews - skip
  if (statusPriority === 3) {
    return {
      suggestedAction: 'skip',
      reason: 'Ứng viên đang trong quá trình phỏng vấn'
    };
  }

  // Priority 4: Rejected/withdrawn candidates
  if (statusPriority === 4) {
    if (sameJob) {
      // Consider newData quality for better decision
      const existingScore = existingCandidate?.fit_score || 0;
      const newScore = newData?.fit_score || 0;
      if (newScore > existingScore * 1.2) { // 20% improvement threshold
        return {
          suggestedAction: 'replace',
          reason: `CV mới có điểm đánh giá cao hơn đáng kể (${newScore} vs ${existingScore}), nên thay thế`
        };
      }
      return {
        suggestedAction: 'merge',
        reason: `CV cũ đã ${effectiveStatus === 'rejected' ? 'bị từ chối' : 'rút lui'}, cùng vị trí - cập nhật thông tin mới`
      };
    } else {
      return {
        suggestedAction: 'create_new',
        reason: `CV cũ đã ${effectiveStatus === 'rejected' ? 'bị từ chối' : 'rút lui'}, khác vị trí - tạo hồ sơ mới`
      };
    }
  }

  // Priority 5: Early stages
  if (statusPriority === 5) {
    if (sameJob) {
      // Compare fit scores for better decision
      const existingScore = existingCandidate?.fit_score || 0;
      const newScore = newData?.fit_score || 0;
      if (newScore > existingScore) {
        return {
          suggestedAction: 'replace',
          reason: `CV mới có điểm đánh giá cao hơn (${newScore} vs ${existingScore}), nên thay thế`
        };
      }
      return {
        suggestedAction: 'merge',
        reason: 'Cùng vị trí, gộp thông tin để cập nhật dữ liệu'
      };
    } else {
      return {
        suggestedAction: 'create_new',
        reason: 'Email trùng nhưng khác vị trí - tạo hồ sơ riêng'
      };
    }
  }

  // Unknown status - fallback based on sameJob and score comparison
  if (sameJob) {
    const existingScore = existingCandidate?.fit_score || 0;
    const newScore = newData?.fit_score || 0;
    if (newScore > existingScore * 1.2) { // 20% improvement threshold
      return {
        suggestedAction: 'replace',
        reason: `CV mới có điểm đánh giá cao hơn đáng kể (${newScore} vs ${existingScore}), nên thay thế`
      };
    }
    return {
      suggestedAction: 'merge',
      reason: 'Cùng vị trí, gộp thông tin để cập nhật dữ liệu'
    };
  } else {
    return {
      suggestedAction: 'create_new',
      reason: 'Khác vị trí, tạo hồ sơ mới cho cơ hội khác'
    };
  }
}

// Helper function to save buffer and return path
async function saveBuffer(fileName: string, buffer: Buffer, hash: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  // Create uploads directory if it doesn't exist
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Generate unique filename with hash prefix
  const fileExtension = path.extname(fileName);
  const newFileName = `${Date.now()}-${hash.substring(0, 10)}-${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
  const filePath = path.join(uploadDir, newFileName);

  // Save buffer
  await writeFile(filePath, buffer);

  return filePath;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomBytes(8).toString('hex');
  logger.info('Upload CV request started', { requestId, action: 'upload_cv_start' });
  logger.info('Request timestamp', { requestId, timestamp: new Date().toISOString() });
  
  try {
    const formData = await request.formData();
    const jobId = formData.get('job_id') as string;
    const files = formData.getAll('files') as File[];
    
    logger.info('Processing upload request', { requestId, jobId, fileCount: files.length });
    logger.info('Files received', { requestId, fileNames: files.map(f => f.name), fileSizes: files.map(f => `${f.name}:${f.size}bytes`) });

    // Validate required fields
    if (!jobId) {
      return NextResponse.json(
        { success: false, message: 'job_id là bắt buộc' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Cần ít nhất một file CV' },
        { status: 400 }
      );
    }

    // Validate job exists and get pipeline info in single query
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        descriptions: true,
        requirements: true,
        pipelineId: true
      }
    });

    if (!job) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy job' },
        { status: 404 }
      );
    }

    // Pre-fetch and sort stages if job has pipeline
    let sortedStages: any[] = [];
    if (job.pipelineId) {
      const stages = await prisma.stage.findMany({
        where: { hiring_pipeline_id: job.pipelineId },
        select: {
          id: true,
          name: true,
          settings: true,
          created_at: true,
        },
      });

      // Sort stages once outside the loop
      sortedStages = stages.sort((a, b) => {
        const orderA = (a.settings as any)?.order ?? Infinity;
        const orderB = (b.settings as any)?.order ?? Infinity;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    }

    // Fetch the default stage (isDefault=true and no pipeline)
    const defaultStage = await prisma.stage.findFirst({
      where: {
        isDefault: true,
        hiring_pipeline_id: null
      },
      select: {
        id: true,
        name: true
      }
    });

    // Process each file - create temp files for ALL files first
    logger.info('Starting file processing', { requestId });
    const fileProcessingResults = [];
interface DuplicateFile {
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
    created_at: Date;
    pipeline_status: string | null;
    job_id: string | null;
    stage_id: string | null;
    fit_score: number | null;
  };
  suggestedAction: string;
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
  fileBuffer?: Buffer;
}
    const duplicateFiles: DuplicateFile[] = [];
    
    const allFiles: {
      fileName: string;
      filePath: string;
      hash: string;
      isHashDuplicate: boolean;
      existingUpload?: any;
    }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      logger.info('Processing file', { requestId, fileIndex: i + 1, totalFiles: files.length, fileName: file.name });
      
      // Enhanced file validation
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json(
          { success: false, message: `File ${file.name} phải có định dạng PDF` },
          { status: 400 }
        );
      }
      
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { success: false, message: `File ${file.name} không phải là PDF hợp lệ` },
          { status: 400 }
        );
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return NextResponse.json(
          { success: false, message: `File ${file.name} quá lớn. Giới hạn tối đa là 10MB` },
          { status: 400 }
        );
      }

      // Generate hash from buffer (keep buffer in scope for hash calc only)
      const buffer = Buffer.from(await file.arrayBuffer());
      const hash = generateFileHash(buffer);

      // Check for hash duplicates in cv_uploads table with FOR UPDATE to prevent race conditions
      // Only check duplicates within the same job
      const existingUpload = await prisma.$transaction(async (tx) => {
        // First check if hash exists for this job
        const upload = await tx.cVUpload.findFirst({
          where: {
            hash,
            job_id: jobId // Only check duplicates within the same job
          },
          include: {
            candidate: {
              select: {
                id: true,
                full_name: true,
                email: true,
                cv_link: true,
                created_at: true,
                pipeline_status: true,
                job_id: true,
                stage_id: true,
                fit_score: true
              }
            }
          }
        });
        return upload;
      });

      // Create temp file for ALL files (will process Gemini regardless of hash duplicate)
      logger.info('File processed', { requestId, fileName: file.name, hash: hash.substring(0, 10), isDuplicate: !!existingUpload });
      const tempDir = path.join(process.cwd(), 'temp');
      if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true });
      }
      const tempFileName = `${Date.now()}-${hash.substring(0, 10)}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.name)}`;
      const tempFilePath = path.join(tempDir, tempFileName);
      await writeFile(tempFilePath, buffer);

      allFiles.push({
        fileName: file.name,
        filePath: tempFilePath,
        hash,
        isHashDuplicate: !!existingUpload,
        existingUpload
      });

      // If hash duplicate, add to duplicateFiles but will still process Gemini for newData
      if (existingUpload) {
        logger.info('Hash duplicate found', { requestId, fileName: file.name, hash: hash.substring(0, 10), existingCandidateId: existingUpload.candidate.id });
        
        const suggestion = generateSmartSuggestion(existingUpload.candidate, jobId);
        
        duplicateFiles.push({
          id: existingUpload.id,
          candidate_id: existingUpload.candidate.id,
          job_id: jobId,
          file_url: existingUpload.file_url,
          hash,
          status: existingUpload.status,
          fileName: file.name,
          existingCandidate: {
            id: existingUpload.candidate.id,
            full_name: existingUpload.candidate.full_name,
            email: existingUpload.candidate.email,
            cv_link: existingUpload.candidate.cv_link,
            created_at: existingUpload.candidate.created_at,
            pipeline_status: existingUpload.candidate.pipeline_status,
            job_id: existingUpload.candidate.job_id,
            stage_id: existingUpload.candidate.stage_id,
            fit_score: existingUpload.candidate.fit_score
          },
          suggestedAction: suggestion.suggestedAction,
          reason: suggestion.reason
        });
      }
    }

    // Process ALL files with Gemini for uniform newData
    logger.info('Processing summary', { requestId, totalFiles: allFiles.length, hashDuplicates: duplicateFiles.length });
    let newCandidates: (Candidate & { fileName: string })[] = [];
    let duplicates = [...duplicateFiles];
    let processedResults: any[] = [];
    
    try {
      // Use batch processing from geminiClient for ALL files
      const filePaths = allFiles.map(f => f.filePath);
      const jobRequirements = `${job.descriptions || ''}\n\n${job.requirements || ''}`.trim();
      
      logger.info('Starting Gemini processing', { requestId, fileCount: allFiles.length });
      logger.info('Job requirements', { requestId, jobRequirements: jobRequirements.substring(0, 100) });
      processedResults = await processMultipleCVs(filePaths, jobRequirements);
      logger.info('Gemini processing completed', { requestId, resultsCount: processedResults.length });
      
      // Validate Gemini results
      if (processedResults.length !== allFiles.length) {
        logger.error('Gemini returned incorrect number of results', { requestId, expected: allFiles.length, actual: processedResults.length });
        return NextResponse.json(
          { success: false, message: 'Lỗi xử lý CV: Số lượng kết quả không khớp' },
          { status: 500 }
        );
      }
      
      // Process results for each file
      for (let i = 0; i < processedResults.length; i++) {
        const result = processedResults[i];
        const fileInfo = allFiles[i];
        
        // Validate individual result
        if (!result || !result.parsedData || !result.parsedData.full_name) {
          logger.warn('Skipping invalid Gemini result', { requestId, fileName: fileInfo.fileName });
          continue;
        }
        
        try {
          // Check for existing email (applies to both hash duplicates and new files)
          // Only check duplicates within the same job
          const existingEmailCandidate = result.parsedData.email && result.parsedData.email.trim() !== '' 
            ? await prisma.candidate.findFirst({
                where: { 
                  email: result.parsedData.email,
                  job_id: jobId // Only check email duplicates within the same job
                },
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                  cv_link: true,
                  created_at: true,
                  pipeline_status: true,
                  job_id: true,
                  stage_id: true,
                  fit_score: true
                }
              })
            : null;

          // If email duplicate (different from hash duplicate), add to duplicates
          // Only check if this file is NOT already a hash duplicate
          if (!fileInfo.isHashDuplicate && existingEmailCandidate && result.parsedData.email) {
            logger.info('Email duplicate found', { requestId, fileName: fileInfo.fileName, email: result.parsedData.email, existingCandidateId: existingEmailCandidate.id, isHashDuplicate: fileInfo.isHashDuplicate });
            
            // Generate smart suggestion for email duplicate
            const suggestion = generateSmartSuggestion(existingEmailCandidate, jobId, {
              full_name: result.parsedData.full_name,
              email: result.parsedData.email,
              birthdate: result.parsedData.birthdate,
              gender: result.parsedData.gender,
              position: result.parsedData.position,
              experience: result.parsedData.experience?.toString(),
              skills: result.parsedData.skills?.join(', '),
              fit_score: result.scoreData.fit_score,
              strengths: result.scoreData.strengths?.join(', '),
              weaknesses: result.scoreData.weaknesses?.join(', '),
              cv_summary: result.parsedData.cv_summary || null,
              evaluation: result.scoreData.evaluation || null,
              pipeline_status: existingEmailCandidate.pipeline_status,
              stage_id: existingEmailCandidate.stage_id
            });
            duplicates.push({
              id: crypto.randomUUID(),
              candidate_id: existingEmailCandidate.id,
              job_id: jobId,
              file_url: null, // File not saved yet, will be set during processing
              hash: fileInfo.hash,
              status: 'pending',
              fileName: fileInfo.fileName,
              existingCandidate: existingEmailCandidate,
              newData: {
                full_name: result.parsedData.full_name,
                email: result.parsedData.email,
                birthdate: result.parsedData.birthdate,
                gender: result.parsedData.gender,
                position: result.parsedData.position,
                experience: result.parsedData.experience?.toString(),
                skills: result.parsedData.skills?.join(', '),
                fit_score: result.scoreData.fit_score,
                strengths: result.scoreData.strengths?.join(', '),
                weaknesses: result.scoreData.weaknesses?.join(', '),
                cv_summary: result.parsedData.cv_summary || null,
                evaluation: result.scoreData.evaluation || null,
                pipeline_status: existingEmailCandidate.pipeline_status,
                stage_id: existingEmailCandidate.stage_id
              },
              suggestedAction: suggestion.suggestedAction,
              reason: suggestion.reason
            });
            continue;
          }

          // Skip if this was a hash duplicate (already added to duplicates above)
          if (fileInfo.isHashDuplicate) {
            // Update the duplicate entry with newData for better comparison
            const duplicateIndex = duplicates.findIndex(d => d.hash === fileInfo.hash && d.fileName === fileInfo.fileName);
            if (duplicateIndex !== -1) {
              duplicates[duplicateIndex].newData = {
                full_name: result.parsedData.full_name,
                email: result.parsedData.email,
                birthdate: result.parsedData.birthdate,
                gender: result.parsedData.gender,
                position: result.parsedData.position,
                experience: result.parsedData.experience?.toString(),
                skills: result.parsedData.skills?.join(', '),
                fit_score: result.scoreData.fit_score,
                strengths: result.scoreData.strengths?.join(', '),
                weaknesses: result.scoreData.weaknesses?.join(', '),
                cv_summary: result.parsedData.cv_summary || null,
                evaluation: result.scoreData.evaluation || null,
                pipeline_status: duplicates[duplicateIndex].existingCandidate.pipeline_status,
                stage_id: duplicates[duplicateIndex].existingCandidate.stage_id
              };
              // Re-generate suggestion with newData for better accuracy
              const suggestion = generateSmartSuggestion(duplicates[duplicateIndex].existingCandidate, jobId, duplicates[duplicateIndex].newData);
              duplicates[duplicateIndex].suggestedAction = suggestion.suggestedAction;
              duplicates[duplicateIndex].reason = suggestion.reason;
            }
            continue;
          }

          // Tự động gán stage nếu job có pipeline
          // let stageId: string | null = null;
          // if (sortedStages.length > 0) {
          //   stageId = sortedStages[0].id as string;
          //   logger.info('Auto-assigned stage', { requestId, stageId, stageName: sortedStages[0].name, fileName: fileInfo.fileName });
          // }

          // Tự động gán stage mặc định không thuộc pipeline
          let stageId: string | null = null;
          let defaultStageName: string | undefined = undefined;
          if (defaultStage) {
            stageId = defaultStage.id;
            defaultStageName = defaultStage.name;
          }
          
          if (stageId) {
            logger.info('Auto-assigned default stage', { requestId, stageId, stageName: defaultStageName, fileName: fileInfo.fileName });
          } else {
            logger.warn('No default stage found', { requestId, fileName: fileInfo.fileName });
          }

          // Create candidate first (without file upload in transaction)
          const candidateData = {
            full_name: result.parsedData.full_name || 'Unknown',
            email: result.parsedData.email || '',
            birthdate: result.parsedData.birthdate && result.parsedData.birthdate.trim() !== ''
              ? (() => {
                  const date = new Date(result.parsedData.birthdate);
                  return !isNaN(date.getTime()) ? date : null;
                })()
              : null,
            gender: result.parsedData.gender || null,
            position: result.parsedData.position || null,
            experience: result.parsedData.experience?.toString() || null,
            skills: Array.isArray(result.parsedData.skills)
              ? result.parsedData.skills.join(', ')
              : result.parsedData.skills || null,
            fit_score: result.scoreData.fit_score || null,
            strengths: Array.isArray(result.scoreData.strengths)
              ? result.scoreData.strengths.join(', ')
              : result.scoreData.strengths || null,
            weaknesses: Array.isArray(result.scoreData.weaknesses)
              ? result.scoreData.weaknesses.join(', ')
              : result.scoreData.weaknesses || null,
            cv_summary: result.parsedData.cv_summary || null,
            evaluation: result.scoreData.evaluation || null,
            pipeline_status: 'pending',
            stage_id: stageId,
            job_id: jobId,
            cv_link: '' // Will be updated after file upload
          };

          const candidate = await prisma.candidate.create({
            data: candidateData
          });

          // Upload file to MinIO after candidate creation
          let fileUrl = '';
          try {
            const buffer = await readFile(fileInfo.filePath);
            fileUrl = await uploadToS3(fileInfo.fileName, buffer, fileInfo.hash);
            buffer.fill(0); // Clear buffer immediately
          } catch (uploadError:any) {
            logger.error('File upload failed, but candidate created', { requestId, candidateId: candidate.id, fileName: fileInfo.fileName, error: uploadError.message });
            // Continue with CV upload record creation even if file upload fails
          }

          // Update candidate with file URL and create CV upload record
          await prisma.$transaction(async (tx) => {
            // Update candidate with file URL
            await tx.candidate.update({
              where: { id: candidate.id },
              data: { cv_link: fileUrl }
            });

            // Create cv_upload record
            await tx.cVUpload.create({
              data: {
                candidate_id: candidate.id,
                job_id: jobId,
                file_url: fileUrl,
                hash: fileInfo.hash,
                status: 'processed'
              }
            });

            // Create corresponding nhanVien record (only if email doesn't exist)
            // const existingNhanVien = await tx.nhanVien.findUnique({
            //   where: { email: candidate.email }
            // });
            
            // if (!existingNhanVien) {
            //   await tx.nhanVien.create({
            //     data: {
            //       hoTen: candidate.full_name,
            //       ngaySinh: candidate.birthdate,
            //       email: candidate.email || null,
            //       type: "candidate"
            //     }
            //   });
            // }
          });

          logger.info('Candidate created', { requestId, candidateId: candidate.id, fileName: fileInfo.fileName, fullName: candidate.full_name });
          newCandidates.push({
            ...candidate,
            fileName: fileInfo.fileName
          });

        } catch (candidateError:any) {
          logger.error('Failed to create candidate', { requestId, fileName: fileInfo.fileName, error: candidateError.message });
          // Continue with other files even if one fails
        }
      }
      
    } catch (processingError) {
      console.error('Error processing CVs:', processingError);
      
      // Cleanup temp files on processing failure
      logger.info('Processing failed, cleaning up temp files', { requestId });
      try {
        const { unlink } = await import('fs/promises');
        for (const fileInfo of allFiles) {
          try {
            await unlink(fileInfo.filePath);
            logger.debug('Cleaned up temp file', { requestId, filePath: fileInfo.filePath });
          } catch (cleanupError:any) {
            logger.warn('Failed to cleanup temp file', { requestId, filePath: fileInfo.filePath, error: cleanupError.message });
          }
        }
      } catch (cleanupError:any) {
        logger.error('Error during temp file cleanup', { requestId, error: cleanupError.message });
      }
      
      return NextResponse.json(
        { success: false, message: 'Lỗi khi xử lý CV với Gemini' },
        { status: 500 }
      );
    }

    // Cleanup temp files after successful processing
    logger.info('Cleaning up temp files after successful processing', { requestId });
    try {
      const { unlink } = await import('fs/promises');
      for (const fileInfo of allFiles) {
        try {
          await unlink(fileInfo.filePath);
          logger.debug('Cleaned up temp file', { requestId, filePath: fileInfo.filePath });
        } catch (cleanupError:any) {
          logger.warn('Failed to cleanup temp file', { requestId, filePath: fileInfo.filePath, error: cleanupError.message });
        }
      }
    } catch (cleanupError:any) {
      logger.error('Error during temp file cleanup', { requestId, error: cleanupError.message });
    }

    // Return results
    logger.info('Upload CV completed', { requestId, action: 'upload_cv_completed', totalFiles: files.length, newCandidates: newCandidates.length, duplicates: duplicates.length });
    logger.info('Duplicate summary', { 
      requestId, 
      hashDuplicates: duplicateFiles.length,
      emailDuplicates: duplicates.length - duplicateFiles.length,
      totalDuplicates: duplicates.length 
    });
    logger.info('Final summary', { requestId, summary: { totalFiles: files.length, newFiles: allFiles.length - duplicates.length, duplicates: duplicates.length, processedSuccessfully: newCandidates.length } });
    logger.info('Request completed', { requestId, timestamp: new Date().toISOString() });
    
    return NextResponse.json({
      success: true,
      data: {
        newCandidates,
        duplicates: duplicates,
        summary: {
          totalFiles: files.length,
          newFiles: allFiles.length - duplicates.length,
          duplicateFiles: duplicates.length,
          processedSuccessfully: newCandidates.length
        }
      }
    });

  } catch (error: any) {
    logger.error('Upload CV request failed', { requestId, action: 'upload_cv_failed', error: error.message, stack: error.stack });
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khi upload CV' },
      { status: 500 }
    );
  }
}
