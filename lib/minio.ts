import { S3Client } from '@aws-sdk/client-s3';

const minioClient = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'vnf@gmail.com',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'admin123',
  },
  forcePathStyle: true,
});

export default minioClient;