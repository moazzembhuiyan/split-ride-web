export interface UploadedFile {
  url: string;
  filename?: string;
  mimetype?: string;
  size?: number;
}

export type UploadResponse = UploadedFile;
export type UploadMultipleResponse = UploadedFile[];
