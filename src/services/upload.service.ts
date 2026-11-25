import { prowl } from "@/lib/api";
import type { ApiResponse } from "@/types/base";
import type { UploadMultipleResponse, UploadResponse } from "@/types/upload.types";

export const uploadService = {
  uploadSingle: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return prowl<ApiResponse<UploadResponse>>("/upload", { body: form });
  },

  uploadMultiple: (files: File[]) => {
    const form = new FormData();
    for (const file of files) {
      form.append("files", file);
    }
    return prowl<ApiResponse<UploadMultipleResponse>>("/upload/multiple", { body: form });
  },
};
