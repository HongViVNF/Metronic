import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '@/lib/logger';

interface DuplicateProcessItem {
  candidateId: string;
  fileName: string;
  hash: string;
  newData?: {
    full_name?: string;
    email?: string;
    birthdate?: string;
    gender?: string;
    position?: string;
    experience?: string;
    skills?: string[];
    fit_score?: number;
    cv_summary?: string;
    evaluation?: string;
    strengths?: string[];
    weaknesses?: string[];
    cv_link?: string;
    pipeline_status?: string;
    stage_id?: string;
  };
  fileBuffer?: string; // base64 encoded
}

// Helper function to save file and return path
async function saveFile(fileName: string, buffer: Buffer, hash: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Create uploads directory if it doesn't exist
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Generate unique filename with hash prefix
  const fileExtension = path.extname(fileName);
  const newFileName = `${Date.now()}-${hash.substring(0, 10)}-${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
  const filePath = path.join(uploadDir, newFileName);
  
  // Save file
  await writeFile(filePath, buffer);
  
  return filePath;
}

// POST: Process duplicate CVs based on HR selection
export async function POST(request: NextRequest) {
  const requestId = crypto.randomBytes(8).toString('hex');
  logger.info('Process duplicates request started', { requestId, action: 'process_duplicates_start' });
  
  try {
    const body = await request.json();
    const { duplicates, mode, job_id } = body;

    logger.info('Processing duplicate request', { requestId, mode, jobId: job_id, duplicateCount: duplicates?.length });

    // Validate required fields
    if (!duplicates || !Array.isArray(duplicates) || duplicates.length === 0) {
      logger.warn('Validation failed: no duplicates provided', { requestId });
      return NextResponse.json(
        { success: false, message: 'Danh sách duplicates là bắt buộc' },
        { status: 400 }
      );
    }

    if (!mode || !['merge', 'replace', 'create_new'].includes(mode)) {
      logger.warn('Validation failed: invalid mode', { requestId, mode });
      return NextResponse.json(
        { success: false, message: 'Mode phải là merge, replace, hoặc create_new' },
        { status: 400 }
      );
    }

    // const results = [];
    // const errors = [];
    const results: {
      fileName: string;
      candidateId: string;
      mode: string;
      success: boolean;
      candidate: any;
    }[] = [];
    
    const errors: {
      fileName: string;
      error: string;
    }[] = [];    

    for (const duplicate of duplicates) {
      try {
        const { candidateId, fileName, hash, newData, fileBuffer } = duplicate as DuplicateProcessItem;

        // Validate duplicate item
        if (!candidateId) {
          errors.push({ fileName, error: 'candidateId là bắt buộc' });
          continue;
        }

        // Get existing candidate
        const existingCandidate = await prisma.candidate.findUnique({
          where: { id: candidateId },
          include: { 
            job: true,
            stage: true
          }
        });

        if (!existingCandidate) {
          errors.push({ fileName, error: 'Không tìm thấy candidate' });
          continue;
        }

        // Check if candidate is in default stage
        const isInDefaultStage = existingCandidate.stage &&
          String(existingCandidate.stage.isDefault) === "true" &&
          (existingCandidate.stage.hiring_pipeline_id === null || existingCandidate.stage.hiring_pipeline_id === undefined);

        // Validate mode based on candidate's stage
        if (!isInDefaultStage && (mode === 'replace' || mode === 'create_new')) {
          errors.push({ 
            fileName, 
            error: `Ứng viên "${existingCandidate.full_name}" đang ở trong quy trình phỏng vấn (${existingCandidate.stage?.name || 'Unknown stage'}). Chỉ cho phép mode "merge" để cập nhật thông tin bổ sung.`
          });
          continue;
        }

        let processedCandidate: any;

        logger.info('Starting mode processing', { requestId, fileName, mode, candidateId, stageName: existingCandidate.stage?.name, isDefault: existingCandidate.stage?.isDefault });

        switch (mode) {
          case 'merge':
            // Merge: Only update fields that are null/empty in existing candidate
            const mergeData: any = {};
            
            if (newData?.full_name && !existingCandidate.full_name) {
              mergeData.full_name = newData.full_name;
            }
            if (newData?.email && !existingCandidate.email) {
              mergeData.email = newData.email;
            }
            if (newData?.birthdate && !existingCandidate.birthdate) {
              const date = new Date(newData.birthdate);
              mergeData.birthdate = !isNaN(date.getTime()) ? date : null;
            }
            if (newData?.gender && !existingCandidate.gender) {
              mergeData.gender = newData.gender;
            }
            if (newData?.position && !existingCandidate.position) {
              mergeData.position = newData.position;
            }
            if (newData?.experience && !existingCandidate.experience) {
              mergeData.experience = newData.experience;
            }
            if (newData?.skills && !existingCandidate.skills) {
              mergeData.skills = Array.isArray(newData.skills) 
                ? newData.skills.join(', ') 
                : newData.skills;
            }
            // Note: address field not available in Candidate model
            if (newData?.fit_score && !existingCandidate.fit_score) {
              mergeData.fit_score = newData.fit_score;
            }
            if (newData?.cv_summary && !existingCandidate.cv_summary) {
              mergeData.cv_summary = newData.cv_summary;
            }
            if (newData?.evaluation && !existingCandidate.evaluation) {
              mergeData.evaluation = newData.evaluation;
            }
            if (newData?.strengths && !existingCandidate.strengths) {
              mergeData.strengths = Array.isArray(newData.strengths)
                ? newData.strengths.join(', ')
                : newData.strengths;
            }
            if (newData?.weaknesses && !existingCandidate.weaknesses) {
              mergeData.weaknesses = Array.isArray(newData.weaknesses)
                ? newData.weaknesses.join(', ')
                : newData.weaknesses;
            }
            if (newData?.pipeline_status && !existingCandidate.pipeline_status) {
              mergeData.pipeline_status = newData.pipeline_status;
            }
            if (newData?.stage_id && !existingCandidate.stage_id) {
              mergeData.stage_id = newData.stage_id;
            }

            // Update candidate if there's data to merge
            if (Object.keys(mergeData).length > 0) {
              processedCandidate = await prisma.candidate.update({
                where: { id: candidateId },
                data: mergeData
              });
            } else {
              processedCandidate = existingCandidate;
            }
            break;

          case 'replace':
            // Replace: Overwrite all data except id, email, created_at, job_id
            const replaceData: any = {
              full_name: newData?.full_name || existingCandidate.full_name,
              birthdate: newData?.birthdate && newData.birthdate.trim() !== '' 
                ? (() => {
                    const date = new Date(newData.birthdate);
                    return !isNaN(date.getTime()) ? date : null;
                  })() 
                : existingCandidate.birthdate,
              gender: newData?.gender || existingCandidate.gender,
              position: newData?.position || existingCandidate.position,
              experience: newData?.experience || existingCandidate.experience,
              skills: newData?.skills 
                ? (Array.isArray(newData.skills) ? newData.skills.join(', ') : newData.skills)
                : existingCandidate.skills,
              fit_score: newData?.fit_score || existingCandidate.fit_score,
              cv_summary: newData?.cv_summary || existingCandidate.cv_summary,
              evaluation: newData?.evaluation || existingCandidate.evaluation,
              strengths: newData?.strengths
                ? (Array.isArray(newData.strengths) ? newData.strengths.join(', ') : newData.strengths)
                : existingCandidate.strengths,
              weaknesses: newData?.weaknesses
                ? (Array.isArray(newData.weaknesses) ? newData.weaknesses.join(', ') : newData.weaknesses)
                : existingCandidate.weaknesses,
              pipeline_status: newData?.pipeline_status || existingCandidate.pipeline_status,
              stage_id: newData?.stage_id || existingCandidate.stage_id,
            };

            // Update CV link if new file provided
            if (fileBuffer && fileName && fileBuffer.trim() !== '') {
              const filePath = await saveFile(fileName, Buffer.from(fileBuffer!, 'base64'), hash);
              replaceData.cv_link = `/uploads/${path.basename(filePath)}`;
              
              // Update cv_upload record
              await prisma.cVUpload.updateMany({
                where: { candidate_id: candidateId },
                data: {
                  file_url: replaceData.cv_link,
                  hash: hash,
                  status: 'processed'
                }
              });
            }

            processedCandidate = await prisma.candidate.update({
              where: { id: candidateId },
              data: replaceData
            });
            break;

          case 'create_new':
            // Create New: Create a new candidate with same email but different ID
            const newCandidateData: any = {
              full_name: newData?.full_name || existingCandidate.full_name,
              email: existingCandidate.email,
              birthdate: newData?.birthdate && newData.birthdate.trim() !== '' 
                ? (() => {
                    const date = new Date(newData.birthdate);
                    return !isNaN(date.getTime()) ? date : null;
                  })() 
                : existingCandidate.birthdate,
              gender: newData?.gender || existingCandidate.gender,
              position: newData?.position || existingCandidate.position,
              experience: newData?.experience || existingCandidate.experience,
              skills: newData?.skills 
                ? (Array.isArray(newData.skills) ? newData.skills.join(', ') : newData.skills)
                : existingCandidate.skills,
              fit_score: newData?.fit_score || existingCandidate.fit_score,
              cv_summary: newData?.cv_summary || existingCandidate.cv_summary,
              evaluation: newData?.evaluation || existingCandidate.evaluation,
              strengths: newData?.strengths
                ? (Array.isArray(newData.strengths) ? newData.strengths.join(', ') : newData.strengths)
                : existingCandidate.strengths,
              weaknesses: newData?.weaknesses
                ? (Array.isArray(newData.weaknesses) ? newData.weaknesses.join(', ') : newData.weaknesses)
                : existingCandidate.weaknesses,
              pipeline_status: newData?.pipeline_status || 'pending',
              stage_id: newData?.stage_id || existingCandidate.stage_id,
              job_id: job_id || existingCandidate.job_id || '',
            };

            // Save new file if provided
            if (fileBuffer && fileName && fileBuffer.trim() !== '') {
              const filePath = await saveFile(fileName, Buffer.from(fileBuffer!, 'base64'), hash);
              newCandidateData.cv_link = `/uploads/${path.basename(filePath)}`;
            } else {
              newCandidateData.cv_link = existingCandidate.cv_link;
            }

            try {
              processedCandidate = await prisma.$transaction(async (tx) => {
                logger.info('Creating new candidate', { requestId, fileName, newCandidateData });
                const candidate = await tx.candidate.create({
                  data: newCandidateData
                });
                logger.info('Candidate created successfully', { requestId, candidateId: candidate.id });

                // Create new cv_upload record
                logger.info('Creating CV upload record', { requestId, candidateId: candidate.id, jobId: job_id || existingCandidate.job_id || '' });
                await tx.cVUpload.create({
                  data: {
                    candidate_id: candidate.id,
                    job_id: job_id || existingCandidate.job_id || '',
                    file_url: newCandidateData.cv_link,
                    hash: hash,
                    status: 'processed'
                  }
                });
                logger.info('CV upload record created successfully', { requestId, candidateId: candidate.id });

                return candidate;
              });
            } catch (txError: any) {
              logger.error('Transaction failed in create_new mode', { 
                requestId, 
                fileName, 
                error: txError.message, 
                code: txError.code,
                meta: txError.meta 
              });
              throw txError;
            }
            break;
        }

        results.push({
          fileName,
          candidateId: processedCandidate.id,
          mode,
          success: true,
          candidate: processedCandidate
        });

      } catch (error: any) {
        logger.error('Failed to process duplicate', { requestId, fileName: duplicate.fileName, error: error.message, stack: error.stack });
        errors.push({
          fileName: duplicate.fileName,
          error: error.message || 'Lỗi không xác định'
        });
      }
    }

    logger.info('Process duplicates completed', { 
      requestId, 
      action: 'process_duplicates_completed',
      processed: results.length,
      errors: errors.length,
      mode
    });

    return NextResponse.json({
      success: true,
      data: {
        processed: results,
        errors,
        summary: {
          totalProcessed: results.length,
          totalErrors: errors.length,
          mode
        }
      }
    });

  } catch (error: any) {
    logger.error('Process duplicates request failed', { requestId, action: 'process_duplicates_failed', error: error.message, stack: error.stack });
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi khi xử lý CV trùng lặp' },
      { status: 500 }
    );
  }
}