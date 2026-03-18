import React, { useState, useRef } from 'react'
import { X, Upload, GripVertical } from 'lucide-react'

// Props cho Component Upload Ảnh
export interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

/**
 * Component quản lý danh sách ảnh của Admin
 * - Hiển thị tối đa `maxImages` (mặc định 5).
 * - Hỗ trợ kéo thả thay đổi thứ tự.
 * - Cho phép thêm ảnh (hiển thị thông qua Blob URL mô phỏng local) & xóa ảnh.
 */
export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

  // Luồng xử lý khi người dùng chọn ảnh từ máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    // Giới hạn số lượng slot trống còn lại
    const remainingSlots = maxImages - images.length
    const allowedFiles = files.slice(0, remainingSlots)

    // Validation: Định dạng và dung lượng (Max 2MB)
    const validFiles = allowedFiles.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      const isValidSize = file.size <= 2 * 1024 * 1024 // 2MB restriction
      return isValidType && isValidSize
    })

    // Ở môi trường thực tế, ta sẽ gọi API upload image. 
    // Hiện tại dùng tạo ObjectURL để mock hiển thị nội bộ nhanh nhất.
    const newImageUrls = validFiles.map(file => URL.createObjectURL(file))
    onChange([...images, ...newImageUrls])
    
    // Reset input để chọn lại cùng file nếu muốn
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Xóa ảnh
  const handleRemove = (indexToRemove: number) => {
    onChange(images.filter((_, index) => index !== indexToRemove))
  }

  // Luồng xử lý Kéo/Thả ảnh để Reorder
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Cần ignore default behavior để nhận sự kiện drop
  }

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === targetIdx) return

    const newImages = [...images]
    const [movedImage] = newImages.splice(draggedIdx, 1)
    newImages.splice(targetIdx, 0, movedImage) // Di chuyển phần tử
    
    onChange(newImages)
    setDraggedIdx(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {/* Render 5 khung slot cố định chứa ảnh hoặc nút thêm ảnh */}
        {Array.from({ length: maxImages }).map((_, index) => {
          const imageUrl = images[index]
          
          return (
            <div 
              key={index}
              draggable={!!imageUrl}
              onDragStart={(e) => imageUrl && handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => !imageUrl && fileInputRef.current?.click()}
              className={`group/slot relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg transition-all border-2 
                ${imageUrl 
                    ? 'border-solid border-gray-200 bg-gray-50' 
                    : 'border-dashed border-gray-300 bg-white hover:border-nhacam-primary hover:bg-gray-50'
                }
              `}
            >
              {imageUrl ? (
                <>
                  {/* Handle kéo thả (Chỉ hiện khi hover qua slot có ảnh) */}
                  <div className="absolute left-1 top-1 z-10 cursor-grab rounded-md bg-black/40 p-1 text-white opacity-0 transition-opacity hover:bg-black/60 active:cursor-grabbing group-hover/slot:opacity-100">
                    <GripVertical size={14} />
                  </div>
                  <img src={imageUrl} alt={`Mô tả slot ảnh ${index}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                    className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-transform hover:scale-110"
                    title="Xóa ảnh"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Upload size={24} className="mb-2" />
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
      
      {/* Input File ẩn đi, được trigger do click vào box */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp"
        multiple
        className="hidden"
      />
    </div>
  )
}
