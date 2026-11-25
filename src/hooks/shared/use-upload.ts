"use client";

import { useMutation } from "@tanstack/react-query";
import { uploadService } from "@/services/upload.service";

export function useUploadSingle() {
  return useMutation({
    mutationFn: (file: File) => uploadService.uploadSingle(file),
  });
}

export function useUploadMultiple() {
  return useMutation({
    mutationFn: (files: File[]) => uploadService.uploadMultiple(files),
  });
}
