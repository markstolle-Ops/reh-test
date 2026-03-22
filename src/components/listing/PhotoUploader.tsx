"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontalIcon, XIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoItem {
  id: string; // photo record ID (from DB)
  r2Url: string; // public URL
}

interface UploadingFile {
  name: string;
  progress: number; // 0-100
  error?: string;
}

interface PhotoUploaderProps {
  listingId: string;
  initialPhotos?: PhotoItem[];
  onPhotosChange?: (photos: PhotoItem[]) => void;
}

// ─── SortablePhoto ────────────────────────────────────────────────────────────

function SortablePhoto({ photo, onDelete }: { photo: PhotoItem; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.r2Url} alt="Listing photo" className="size-full object-cover" />
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute bottom-0 left-0 right-0 flex cursor-grab items-center justify-center bg-black/30 py-0.5 text-white active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripHorizontalIcon className="size-3" />
      </button>
      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete(photo.id)}
        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
        aria-label="Remove photo"
      >
        <XIcon className="size-3" />
      </button>
    </div>
  );
}

// ─── PhotoUploader ────────────────────────────────────────────────────────────

export function PhotoUploader({
  listingId,
  initialPhotos = [],
  onPhotosChange,
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);

  const sensors = useSensors(useSensor(PointerSensor));

  // ── Upload Flow ──────────────────────────────────────────────────────────

  const uploadFile = useCallback(
    async (file: File): Promise<void> => {
      const uploadEntry: UploadingFile = { name: file.name, progress: 0 };
      setUploading((prev) => [...prev, uploadEntry]);

      try {
        // 1. Get presigned URL from our API
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            listingId,
          }),
        });

        if (!presignRes.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { uploadUrl, key, publicUrl } = await presignRes.json();

        // Update progress to 10% after presign
        setUploading((prev) =>
          prev.map((u) => (u.name === file.name ? { ...u, progress: 10 } : u)),
        );

        // 2. PUT file directly to R2
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!putRes.ok) {
          throw new Error("Failed to upload file to storage");
        }

        // Update progress to 80% after upload
        setUploading((prev) =>
          prev.map((u) => (u.name === file.name ? { ...u, progress: 80 } : u)),
        );

        // 3. Register the photo record via PATCH listing
        const addRes = await fetch(`/api/listings/${listingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            addPhoto: { r2Key: key, r2Url: publicUrl },
          }),
        });

        if (!addRes.ok) {
          throw new Error("Failed to register photo with listing");
        }

        const { photo } = await addRes.json();

        // Update progress to 100% and add photo
        setUploading((prev) =>
          prev.map((u) => (u.name === file.name ? { ...u, progress: 100 } : u)),
        );

        const newPhotos = [...photos, { id: photo.id, r2Url: photo.r2Url }];
        setPhotos(newPhotos);
        onPhotosChange?.(newPhotos);

        // Remove from uploading after brief delay
        setTimeout(() => {
          setUploading((prev) => prev.filter((u) => u.name !== file.name));
        }, 500);
      } catch (err) {
        setUploading((prev) =>
          prev.map((u) =>
            u.name === file.name ? { ...u, error: (err as Error).message ?? "Upload failed" } : u,
          ),
        );
      }
    },
    [listingId, photos, onPhotosChange],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = 20 - photos.length;
      const toUpload = acceptedFiles.slice(0, remaining);
      toUpload.forEach(uploadFile);
    },
    [photos.length, uploadFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 20,
    maxSize: 20 * 1024 * 1024, // 20MB
    disabled: photos.length >= 20,
  });

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    async (photoId: string) => {
      try {
        const res = await fetch(`/api/listings/${listingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ removePhoto: photoId }),
        });
        if (!res.ok) throw new Error("Failed to remove photo");

        const newPhotos = photos.filter((p) => p.id !== photoId);
        setPhotos(newPhotos);
        onPhotosChange?.(newPhotos);
      } catch (err) {
        console.error("Delete photo failed:", err);
      }
    },
    [listingId, photos, onPhotosChange],
  );

  // ── Reorder ──────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);
      const reordered = arrayMove(photos, oldIndex, newIndex);

      setPhotos(reordered);
      onPhotosChange?.(reordered);

      try {
        await fetch(`/api/listings/${listingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reorderPhotos: reordered.map((p) => p.id),
          }),
        });
      } catch (err) {
        console.error("Reorder failed:", err);
        // Revert on failure
        setPhotos(photos);
        onPhotosChange?.(photos);
      }
    },
    [listingId, photos, onPhotosChange],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : photos.length >= 20
              ? "cursor-not-allowed border-muted-foreground/20 bg-muted/30"
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-1">
          <svg
            className="size-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {photos.length >= 20 ? (
            <p className="text-sm text-muted-foreground">Maximum 20 photos reached</p>
          ) : isDragActive ? (
            <p className="text-sm font-medium text-primary">Drop photos here...</p>
          ) : (
            <>
              <p className="text-sm font-medium">Drag &amp; drop photos or click to browse</p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP — max 20MB each — up to 20 photos
              </p>
            </>
          )}
        </div>
      </div>

      {/* Upload progress indicators */}
      {uploading.length > 0 && (
        <div className="space-y-1.5">
          {uploading.map((u) => (
            <div key={u.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate text-muted-foreground">{u.name}</span>
                {u.error ? (
                  <span className="text-destructive">{u.error}</span>
                ) : (
                  <span className="text-muted-foreground">{u.progress}%</span>
                )}
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${u.error ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo thumbnails with drag-to-reorder */}
      {photos.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={photos.map((p) => p.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-2">
              {photos.map((photo) => (
                <SortablePhoto key={photo.id} photo={photo} onDelete={handleDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <p className="text-xs text-muted-foreground">{photos.length}/20 photos — drag to reorder</p>
    </div>
  );
}
