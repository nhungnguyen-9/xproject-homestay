import React, { useState } from 'react'
import type { Room } from '../../types/schedule'
import { ImageUpload } from '../ui/image-upload'

// Dữ liệu mẫu (Mock data) hiển thị cho trang quản lý
const initialRooms: Room[] = [
  { id: '1', name: 'Phòng Cam 01', type: 'standard', images: [] },
  { id: '2', name: 'Phòng Cam 02', type: 'standard', images: [] },
  { id: '3', name: 'Phòng Cam 03', type: 'standard', images: [] },
  { id: '4', name: 'Phòng Family 01', type: 'vip', images: [] },
  { id: '5', name: 'Phòng Đôi 02', type: 'vip', images: [] }
]

export function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>(initialRooms)

  // Xử lý cập nhật danh sách ảnh cho một phòng cụ thể
  const handleImagesChange = (roomId: string, newImages: string[]) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, images: newImages } : r))
  }

  // Hàm xử lý khi ấn "Lưu thay đổi" (Sử dụng console & alert như Spec yêu cầu)
  const handleSave = () => {
    console.log("Dữ liệu lưu lên Server giả lập:", rooms)
    alert("Đã lưu cấu hình ảnh phòng thành công!")
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Quản lý Hình ảnh Phòng</h1>
          <p className="mt-1 font-sans text-sm text-gray-500">Tải lên hoặc kéo thả để sắp xếp, tối đa 5 ảnh đại diện cho mỗi phòng.</p>
        </div>
        <button 
          onClick={handleSave}
          className="rounded-lg bg-nhacam-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-nhacam-primary-hover hover:shadow-md"
        >
          Lưu thay đổi
        </button>
      </div>

      <div className="flex flex-col gap-8">
        {rooms.map(room => (
          <div key={room.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h2 className="font-sans text-lg font-bold text-gray-900">{room.name}</h2>
              <p className="text-sm text-gray-500">
                Phân loại: <span className="font-medium font-bold uppercase text-nhacam-secondary">{room.type}</span>
              </p>
            </div>
            
            <div className="p-6">
               {/* Gọi UI component quản lý riêng từng phòng */}
               <ImageUpload 
                 images={room.images || []} 
                 onChange={(newImages) => handleImagesChange(room.id, newImages)} 
               />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
