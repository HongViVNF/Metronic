import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import crypto from 'crypto';
import minioClient from '@/app/backend/lib/minio';

/**
 * Upload file buffer to MinIO/S3 and return the public URL
 * @param fileName Original file name
 * @param buffer File buffer
 * @param hash File hash for unique naming
 * @returns Public URL of uploaded file
 */
export async function uploadToS3(fileName: string, buffer: Buffer, hash: string): Promise<string> {
  const bucketName = process.env.MINIO_BUCKET_LEARNING;
  const fileExtension = fileName.split('.').pop();

  // Generate unique key with hash prefix
  const uniqueKey = `${Date.now()}-${hash.substring(0, 10)}-${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;

  try {
    // Use Upload class for better handling of large files and progress tracking
    const upload = new Upload({
      client: minioClient,
      params: {
        Bucket: bucketName,
        Key: `uploads/${uniqueKey}`,
        Body: buffer,
        ContentType: 'application/pdf',
        // Make file publicly accessible
        ACL: 'public-read',
      },
    });

    const result = await upload.done();

    if (!result.Location) {
      throw new Error('Upload completed but no location returned');
    }

    // Return the public URL
    return result.Location;
  } catch (error) {
    console.error('Error uploading to MinIO:', error);
    throw new Error(`Failed to upload file to MinIO: ${error.message}`);
  }
}

/**
 * Delete file from MinIO/S3 (for cleanup purposes)
 * @param fileUrl File URL to delete
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
  // Extract key from URL
  const urlParts = fileUrl.split('/');
  const key = urlParts.slice(-2).join('/'); // uploads/filename

  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await minioClient.send(new DeleteObjectCommand({
      Bucket: process.env.MINIO_BUCKET_LEARNING!,
      Key: key,
    }));
  } catch (error) {
    console.error('Error deleting from MinIO:', error);
    // Don't throw error for cleanup operations
  }
}
