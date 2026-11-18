import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'node:crypto';

export const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'] as const;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_IMAGES_PER_VENUE = 10;

export interface SignedUploadParams {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  allowedFormats: string[];
  maxFileSizeBytes: number;
  uploadUrl: string;
}

export interface VerifiedCloudinaryAsset {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly cloudName?: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;
  private readonly configured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ||
      process.env.CLOUDINARY_CLOUD_NAME;
    this.apiKey =
      this.configService.get<string>('CLOUDINARY_API_KEY') ||
      process.env.CLOUDINARY_API_KEY;
    this.apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') ||
      process.env.CLOUDINARY_API_SECRET;

    this.configured = Boolean(
      this.cloudName?.trim() &&
        this.apiKey?.trim() &&
        this.apiSecret?.trim(),
    );

    if (this.configured) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
        secure: true,
      });
      this.logger.log('Cloudinary SDK configured successfully');
    } else {
      this.logger.warn(
        'Cloudinary environment variables are missing. Image uploads are disabled until configured.',
      );
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  getVenueFolder(ownerId: string, venueId: string): string {
    return `courtly/venues/${ownerId}/${venueId}`;
  }

  generateSignedUploadParams(ownerId: string, venueId: string): SignedUploadParams {
    if (!this.configured || !this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new ServiceUnavailableException(
        'Image upload service (Cloudinary) is currently unavailable. Please configure Cloudinary credentials.',
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = this.getVenueFolder(ownerId, venueId);
    const assetSlug = `img_${crypto.randomBytes(12).toString('hex')}`;
    const allowedFormatsStr = ALLOWED_IMAGE_FORMATS.join(',');

    const paramsToSign: Record<string, string | number> = {
      allowed_formats: allowedFormatsStr,
      folder,
      public_id: assetSlug,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.apiSecret,
    );

    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      timestamp,
      signature,
      folder,
      publicId: assetSlug,
      allowedFormats: [...ALLOWED_IMAGE_FORMATS],
      maxFileSizeBytes: MAX_IMAGE_BYTES,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
    };
  }

  async verifyUploadedAsset(
    publicId: string,
    ownerId: string,
    venueId: string,
  ): Promise<VerifiedCloudinaryAsset> {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Image upload service (Cloudinary) is currently unavailable.',
      );
    }

    const trimmedPublicId = publicId.trim();
    const expectedFolder = this.getVenueFolder(ownerId, venueId);
    const expectedPrefix = `${expectedFolder}/`;

    if (!trimmedPublicId.startsWith(expectedPrefix)) {
      throw new BadRequestException(
        'Invalid asset scope: image does not belong to this venue upload folder',
      );
    }

    if (trimmedPublicId.includes('..') || /^https?:\/\//i.test(trimmedPublicId)) {
      throw new BadRequestException(
        'Invalid publicId: arbitrary remote URLs and path traversal are not allowed',
      );
    }

    let resource: any;
    try {
      resource = await cloudinary.api.resource(trimmedPublicId, {
        resource_type: 'image',
      });
    } catch (error: any) {
      const httpCode = error?.error?.http_code || error?.http_code;
      if (httpCode === 404) {
        throw new BadRequestException(
          'Uploaded image asset could not be found on Cloudinary. Please upload again.',
        );
      }
      this.logger.error(
        `Cloudinary asset verification failed for ${trimmedPublicId}`,
        error,
      );
      throw new ServiceUnavailableException(
        'Unable to verify image with Cloudinary at this time. Please retry.',
      );
    }

    if (!resource || resource.resource_type !== 'image') {
      throw new BadRequestException(
        'Invalid media type: only image assets are permitted (videos are rejected)',
      );
    }

    const returnedPublicId = String(resource.public_id || '');
    if (!returnedPublicId.startsWith(expectedPrefix)) {
      throw new BadRequestException(
        'Cloudinary asset folder mismatch with venue ownership scope',
      );
    }

    const format = String(resource.format || '').toLowerCase();
    if (!(ALLOWED_IMAGE_FORMATS as readonly string[]).includes(format)) {
      throw new BadRequestException(
        `Unsupported image format "${format}". Allowed formats: JPEG, PNG, WebP.`,
      );
    }

    const bytes = Number(resource.bytes || 0);
    if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_IMAGE_BYTES) {
      throw new BadRequestException(
        `Image size (${bytes} bytes) exceeds maximum allowed limit of 8 MB`,
      );
    }

    const width = Number(resource.width || 0);
    const height = Number(resource.height || 0);
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      throw new BadRequestException(
        'Verified image has invalid dimensions',
      );
    }

    const secureUrl = String(resource.secure_url || '');
    if (!secureUrl.startsWith('https://')) {
      throw new BadRequestException('Verified asset is missing a secure HTTPS URL');
    }

    return {
      publicId: returnedPublicId,
      secureUrl,
      width,
      height,
      format,
      bytes,
    };
  }

  async deleteAsset(publicId: string): Promise<void> {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Image upload service (Cloudinary) is currently unavailable.',
      );
    }

    const maxRetries = 2;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'image',
          invalidate: true,
        });

        if (result?.result === 'ok' || result?.result === 'not found') {
          return;
        }

        lastError = new Error(
          `Unexpected Cloudinary destroy response: ${JSON.stringify(result)}`,
        );
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Cloudinary delete attempt ${attempt} failed for ${publicId}`,
        );
      }
    }

    this.logger.error(
      `Failed to delete Cloudinary asset ${publicId} after ${maxRetries} attempts`,
      lastError,
    );
    throw new ServiceUnavailableException(
      'Failed to delete image from storage provider. Please try again.',
    );
  }
}
