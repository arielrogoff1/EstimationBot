"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FileText, Image, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  file: File;
  preview: string;
  uploading: boolean;
  error?: string;
  planFileId?: string;
}

interface DropzoneProps {
  projectId: string;
  onFilesUploaded: (planFileIds: string[]) => void;
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/tiff": [".tif", ".tiff"],
  "image/webp": [".webp"],
};

export default function Dropzone({ projectId, onFilesUploaded }: DropzoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const uploadFile = useCallback(
    async (uploadedFile: UploadedFile, index: number) => {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, uploading: true } : f))
      );

      try {
        const formData = new FormData();
        formData.append("projectId", projectId);
        formData.append("file", uploadedFile.file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, uploading: false, planFileId: data.planFile.id }
              : f
          )
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, uploading: false, error: "Upload failed. Try again." }
              : f
          )
        );
      }
    },
    [projectId]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
        uploading: false,
      }));

      setFiles((prev) => {
        const updated = [...prev, ...newFiles];
        // Start uploading new files
        newFiles.forEach((f, i) => {
          const idx = prev.length + i;
          setTimeout(() => uploadFile({ ...f }, idx), 50);
        });
        return updated;
      });
    },
    [uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const completedIds = files
    .filter((f) => f.planFileId && !f.uploading)
    .map((f) => f.planFileId!);

  const allDone = files.length > 0 && files.every((f) => f.planFileId || f.error);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-foam-orange bg-orange-50 scale-[1.02]"
            : "border-slate-300 hover:border-foam-orange hover:bg-orange-50/30"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <CloudUpload className="w-8 h-8 text-slate-400" />
          </div>
          {isDragActive ? (
            <p className="text-foam-orange font-medium">Drop your plans here</p>
          ) : (
            <>
              <p className="font-medium text-slate-700">
                Drag & drop your plans here
              </p>
              <p className="text-sm text-slate-500">
                PDF, PNG, JPG, TIFF · Up to 50MB per file
              </p>
            </>
          )}
          <button
            type="button"
            className="mt-1 bg-foam-orange text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-foam-orange-dark transition-colors"
          >
            Browse Files
          </button>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                f.error
                  ? "border-red-200 bg-red-50"
                  : f.planFileId
                  ? "border-green-200 bg-green-50"
                  : "border-slate-200 bg-white"
              )}
            >
              {f.file.type === "application/pdf" ? (
                <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
              ) : f.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.preview}
                  alt=""
                  className="w-8 h-8 object-cover rounded flex-shrink-0"
                />
              ) : (
                <Image className="w-8 h-8 text-blue-500 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700 truncate">
                  {f.file.name}
                </div>
                <div className="text-xs text-slate-500">
                  {(f.file.size / 1024 / 1024).toFixed(1)} MB
                  {f.error && (
                    <span className="text-red-600 ml-2">{f.error}</span>
                  )}
                  {f.planFileId && !f.uploading && (
                    <span className="text-green-600 ml-2">Uploaded</span>
                  )}
                </div>
              </div>
              {f.uploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-foam-orange" />
              ) : (
                <button
                  onClick={() => removeFile(i)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Analyze button */}
      {allDone && completedIds.length > 0 && (
        <button
          onClick={() => onFilesUploaded(completedIds)}
          className="w-full bg-foam-orange text-white py-3 rounded-lg font-semibold hover:bg-foam-orange-dark transition-colors"
        >
          Analyze {completedIds.length} Plan{completedIds.length !== 1 ? "s" : ""} with AI →
        </button>
      )}
    </div>
  );
}
