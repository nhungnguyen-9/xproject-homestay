import React, { useState, useRef, useMemo, useEffect } from 'react'
import { X, Upload, GripVertical, Loader2 } from 'lucide-react'
import { Button } from './button'
import { toast } from 'sonner'

/** Props cho Component Upload Ảnh — giao tiếp với server qua callback */
export interface ImageUploadProps {
  images: string[]
  onUpload: (files: File[]) => Promise<void>
  onRemove: (imageUrl: string) => Promise<void>
  onReorder: (images: string[]) => void
  maxImages?: number
  disabled?: boolean
}

/**
 * Component quản lý danh sách ảnh của Admin
 * - Hiển thị tối đa `maxImages` (mặc định 5).
 * - Chọn file → preview → nhấn nút "Tải lên" mới gọi API.
 * - Hỗ trợ kéo thả thay đổi thứ tự ảnh đã upload.
 */
export function ImageUpload({
  images,
  onUpload,
  onRemove,
  onReorder,
  maxImages = 5,
  disabled = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [removingUrl, setRemovingUrl] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  /** Blob URL preview cho ảnh pending — revoke khi thay đổi để tránh memory leak */
  const pendingPreviews = useMemo(
    () => pendingFiles.map(f => URL.createObjectURL(f)),
    [pendingFiles],
  )
  useEffect(() => {
    return () => pendingPreviews.forEach(url => URL.revokeObjectURL(url))
  }, [pendingPreviews])

  /** Chọn file → chỉ stage vào pending, KHÔNG gọi API */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remainingSlots = Math.max(0, maxImages - images.length - pendingFiles.length)
    const allowedFiles = files.slice(0, remainingSlots)

    // Validation: Định dạng và dung lượng (Max 2MB theo backend)
    const validFiles = allowedFiles.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      const isValidSize = file.size <= 2 * 1024 * 1024
      return isValidType && isValidSize
    })

    const rejectedCount = allowedFiles.length - validFiles.length
    if (rejectedCount > 0) {
      toast.error(`${rejectedCount} file bị bỏ qua (sai định dạng hoặc vượt 2MB)`)
    }

    if (validFiles.length > 0) {
      setPendingFiles(prev => [...prev, ...validFiles])
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /** Nhấn nút "Tải lên" → gọi API upload batch */
  const handleUploadClick = async () => {
    if (pendingFiles.length === 0) return
    setUploading(true)
    try {
      await onUpload(pendingFiles)
      setPendingFiles([])
    } finally {
      setUploading(false)
    }
  }

  /** Xoá file khỏi danh sách pending (trước khi upload) */
  const handleRemovePending = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  /** Xoá ảnh đã upload — gọi callback xoá trên server */
  const handleRemove = async (imageUrl: string) => {
    setRemovingUrl(imageUrl)
    try {
      await onRemove(imageUrl)
    } finally {
      setRemovingUrl(null)
    }
  }

  // Luồng xử lý Kéo/Thả ảnh đã upload để Reorder
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === targetIdx) return

    const newImages = [...images]
    const [movedImage] = newImages.splice(draggedIdx, 1)
    newImages.splice(targetIdx, 0, movedImage)

    onReorder(newImages)
    setDraggedIdx(null)
  }

  const isDisabled = disabled || uploading
  const totalUsed = images.length + pendingFiles.length

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {Array.from({ length: maxImages }).map((_, index) => {
          // Slot ảnh đã upload
          if (index < images.length) {
            const url = images[index]
            const isRemoving = url === removingUrl
            return (
              <div
                key={url}
                draggable={!isDisabled}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="group/slot relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg transition-all border-2 border-solid border-gray-200 bg-gray-50"
              >
                <div className="absolute left-1 top-1 z-10 cursor-grab rounded-md bg-black/40 p-1 text-white opacity-0 transition-opacity hover:bg-black/60 active:cursor-grabbing group-hover/slot:opacity-100">
                  <GripVertical size={14} />
                </div>
                <img src={url} alt={`Ảnh phòng ${index + 1}`} className="h-full w-full object-cover" />
                {isRemoving && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 size={24} className="animate-spin text-white" />
                  </div>
                )}
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={(e) => { e.stopPropagation(); handleRemove(url); }}
                  className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-transform hover:scale-110 disabled:opacity-50"
                  title="Xoá ảnh"
                >
                  <X size={14} />
                </button>
              </div>
            )
          }

          // Slot ảnh pending (chưa upload)
          const pendingIdx = index - images.length
          if (pendingIdx >= 0 && pendingIdx < pendingFiles.length) {
            return (
              <div
                key={`pending-${pendingIdx}`}
                className="group/slot relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg transition-all border-2 border-dashed border-nhacam-primary bg-nhacam-primary/5"
              >
                <img src={pendingPreviews[pendingIdx]} alt={`Preview ${pendingIdx + 1}`} className="h-full w-full object-cover opacity-80" />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => handleRemovePending(pendingIdx)}
                  className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-transform hover:scale-110 disabled:opacity-50"
                  title="Bỏ chọn"
                >
                  <X size={14} />
                </button>
                <span className="absolute bottom-1 left-1 rounded bg-nhacam-primary/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Chờ tải
                </span>
              </div>
            )
          }

          // Slot trống — nút thêm ảnh
          return (
            <div
              key={`empty-${index}`}
              onClick={() => !isDisabled && totalUsed < maxImages && fileInputRef.current?.click()}
              className={`relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg transition-all border-2 border-dashed border-gray-300 bg-white
                ${isDisabled || totalUsed >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-nhacam-primary hover:bg-gray-50'}
              `}
            >
              <div className="flex flex-col items-center text-gray-400">
                <Upload size={24} className="mb-2" />
                <span className="text-xs font-medium">Thêm ảnh</span>
              </div>
            </div>
          )
        })}
      </div>

      {pendingFiles.length > 0 && (
        <Button
          onClick={handleUploadClick}
          disabled={uploading}
          size="sm"
          className="w-fit"
        >
          {uploading
            ? <Loader2 className="mr-2 size-4 animate-spin" />
            : <Upload className="mr-2 size-4" />
          }
          Tải lên {pendingFiles.length} ảnh
        </Button>
      )}

      <p className="font-sans text-xs text-gray-500">
        Kéo thả ảnh để thay đổi thứ tự. Hỗ trợ JPG, PNG, WEBP (Tối đa 2MB/ảnh).
      </p>

      {/* Input File ẩn, được trigger khi click vào slot trống */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp"
        multiple
        disabled={isDisabled}
        className="hidden"
      />
    </div>
  )
}
