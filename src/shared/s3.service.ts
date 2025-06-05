import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { lookup } from 'mime-types';

@Injectable()
export class S3Service {
  private readonly s3: AWS.S3;
  private readonly bucket: string;

  constructor() {
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error(
        'AWS_S3_BUCKET_NAME is not defined in environment variables',
      );
    }
    if (!process.env.AWS_REGION) {
      throw new Error('AWS_REGION is not defined in environment variables');
    }

    AWS.config.update({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    this.bucket = process.env.AWS_S3_BUCKET_NAME;
    this.s3 = new AWS.S3();
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    folder = 'images',
  ): Promise<string> {
    try {
      const key = `${folder}/${uuidv4()}-${originalName}`;

      await this.s3
        .putObject({
          Bucket: this.bucket,
          Key: key,
          Body: fileBuffer,
          // ACL: 'public-read',
          ContentType: this.getMimeType(originalName),
        })
        .promise();

      return `https://${this.bucket}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Failed to upload file to S3:', error);
      throw error;
    }
  }

  async deleteFileFromS3(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl.includes(this.bucket)) return;

      const key = decodeURIComponent(
        fileUrl.split(`${this.bucket}.s3.amazonaws.com/`)[1],
      );

      if (!key) return;

      await this.s3
        .deleteObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
    } catch (error) {
      console.error('Failed to delete file from S3:', error);
      throw error;
    }
  }

  private getMimeType(filename: string): string {
    const mime = lookup(filename);
    if (typeof mime === 'string') {
      return mime;
    }
    return 'application/octet-stream';
  }
}
