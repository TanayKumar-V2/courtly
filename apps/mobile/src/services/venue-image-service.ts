import { apiClient } from './api-client';
import {
  SignedUploadSignatureResponse,
  VenueImageItem,
} from '../types/venue';

export interface LocalImageFile {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export const venueImageService = {
  async getSignature(venueId: string): Promise<SignedUploadSignatureResponse> {
    return apiClient<SignedUploadSignatureResponse>(
      `/owner/venues/${venueId}/images/signature`,
      { method: 'POST' },
    );
  },

  async uploadDirectlyToCloudinary(
    file: LocalImageFile,
    signed: SignedUploadSignatureResponse,
    onProgress?: (percent: number) => void,
  ): Promise<{ publicId: string }> {
    const formData = new FormData();
    const mime = file.mimeType || 'image/jpeg';
    const name = file.fileName || `venue_${Date.now()}.jpg`;

    formData.append('file', {
      uri: file.uri,
      type: mime,
      name,
    } as any);
    formData.append('api_key', signed.apiKey);
    formData.append('timestamp', String(signed.timestamp));
    formData.append('signature', signed.signature);
    formData.append('folder', signed.folder);
    formData.append('public_id', signed.publicId);
    formData.append('allowed_formats', signed.allowedFormats.join(','));

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', signed.uploadUrl);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && parsed.public_id) {
            onProgress?.(100);
            resolve({ publicId: parsed.public_id });
          } else {
            const msg =
              parsed?.error?.message ||
              `Cloudinary upload failed (HTTP ${xhr.status})`;
            reject(new Error(msg));
          }
        } catch {
          reject(new Error(`Cloudinary upload failed (HTTP ${xhr.status})`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error while uploading photograph to Cloudinary'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Image upload timed out. Please retry.'));
      };

      xhr.timeout = 45000;
      xhr.send(formData);
    });
  },

  async registerVerifiedImage(
    venueId: string,
    publicId: string,
    isCover?: boolean,
  ): Promise<{ message: string; image: VenueImageItem }> {
    return apiClient(`/owner/venues/${venueId}/images`, {
      method: 'POST',
      body: JSON.stringify({ publicId, isCover }),
    });
  },

  async uploadAndRegisterImage(
    venueId: string,
    file: LocalImageFile,
    onProgress?: (percent: number) => void,
    isCover?: boolean,
  ): Promise<{ message: string; image: VenueImageItem }> {
    onProgress?.(5);
    const signed = await this.getSignature(venueId);
    onProgress?.(15);
    const uploaded = await this.uploadDirectlyToCloudinary(file, signed, (pct) => {
      onProgress?.(15 + Math.round(pct * 0.7));
    });
    onProgress?.(90);
    const registered = await this.registerVerifiedImage(
      venueId,
      uploaded.publicId,
      isCover,
    );
    onProgress?.(100);
    return registered;
  },

  async deleteImage(
    venueId: string,
    imageId: string,
  ): Promise<{ message: string; images: VenueImageItem[] }> {
    return apiClient(`/owner/venues/${venueId}/images/${imageId}`, {
      method: 'DELETE',
    });
  },

  async reorderImages(
    venueId: string,
    imageIds: string[],
  ): Promise<{ message: string; images: VenueImageItem[] }> {
    return apiClient(`/owner/venues/${venueId}/images/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ imageIds }),
    });
  },

  async setCoverImage(
    venueId: string,
    imageId: string,
  ): Promise<{ message: string; images: VenueImageItem[] }> {
    return apiClient(`/owner/venues/${venueId}/images/${imageId}/cover`, {
      method: 'PATCH',
    });
  },
};
