import React, { useState, useRef } from 'react'
import { X, Upload, GripVertical, Loader2 } from 'lucide-react'

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
 * - Hỗ trợ kéo thả thay đổi thứ tự.
 * - Upload ảnh lên server và xoá ảnh qua callback.
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

  /** Xử lý khi người dùng chọn ảnh từ máy tính — gọi callback upload lên server */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remainingSlots = maxImages - images.length
    const allowedFiles = files.slice(0, remainingSlots)

    // Validation: Định dạng và dung lượng (Max 2MB theo backend)
    const validFiles = allowedFiles.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      const isValidSize = file.size <= 2 * 1024 * 1024
      return isValidType && isValidSize
    })

    if (validFiles.length > 0) {
      setUploading(true)
      try {
        await onUpload(validFiles)
      } finally {
        setUploading(false)
      }
    }

    // Reset input để chọn lại cùng file nếu muốn
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /** Xoá ảnh — gọi callback xoá trên server */
  const handleRemove = async (imageUrl: string) => {
    setRemovingUrl(imageUrl)
    try {
      await onRemove(imageUrl)
    } finally {
      setRemovingUrl(null)
    }
  }

  // Luồng xử lý Kéo/Thả ảnh để Reorder
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

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {/* Render slot cố định chứa ảnh hoặc nút thêm ảnh */}
        {Array.from({ length: maxImages }).map((_, index) => {
          const imageUrl = images[index]
          const isRemoving = imageUrl === removingUrl

          return (
            <div
              key={imageUrl || `empty-${index}`}
              draggable={!!imageUrl && !isDisabled}
              onDragStart={(e) => imageUrl && handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => !imageUrl && !isDisabled && fileInputRef.current?.click()}
              className={`group/slot relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg transition-all border-2
                ${imageUrl
                    ? 'border-solid border-gray-200 bg-gray-50'
                    : `border-dashed border-gray-300 bg-white ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-nhacam-primary hover:bg-gray-50'}`
                }
              `}
            >
              {imageUrl ? (
                <>
                  {/* Handle kéo thả */}
                  <div className="absolute left-1 top-1 z-10 cursor-grab rounded-md bg-black/40 p-1 text-white opacity-0 transition-opacity hover:bg-black/60 active:cursor-grabbing group-hover/slot:opacity-100">
                    <GripVertical size={14} />
                  </div>
                  <img src={imageUrl} alt={`Ảnh phòng ${index + 1}`} className="h-full w-full object-cover" />
                  {isRemoving && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 size={24} className="animate-spin text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={(e) => { e.stopPropagation(); handleRemove(imageUrl); }}
                    className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-transform hover:scale-110 disabled:opacity-50"
                    title="Xoá ảnh"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  {uploading && index === images.length ? (
                    <Loader2 size={24} className="mb-2 animate-spin" />
                  ) : (
                    <Upload size={24} className="mb-2" />
                  )}
                  <span className="text-xs font-medium">Thêm ảnh</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

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
