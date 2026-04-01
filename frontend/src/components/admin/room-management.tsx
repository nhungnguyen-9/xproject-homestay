import React, { useState, useEffect, useCallback } from 'react';
import { ImageUpload } from '@/components/ui/image-upload';
import { Button } from '@/components/ui/button';
import * as roomService from '@/services/roomService';
import type { RoomDetail } from '@/types/room';
import { formatPrice } from '@/utils/helpers';
import { Loader2, ImageIcon, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

/** Nhãn tiếng Việt cho loại phòng */
const ROOM_TYPE_LABELS: Record<string, string> = {
  standard: 'Tiêu chuẩn',
  vip: 'VIP',
  supervip: 'Super VIP',
};

/**
 * Trang quản lý phòng — hiển thị danh sách phòng, upload/xoá/sắp xếp ảnh cho từng phòng
 */
export function RoomManagement() {
  const [rooms, setRooms] = useState<RoomDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await roomService.getAll();
      setRooms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  /** Cập nhật mảng images của 1 phòng trong state */
  const updateRoomImages = useCallback((roomId: string, images: string[]) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, images } : r));
  }, []);

  /** Upload ảnh — batch gửi nhiều file, response trả về { images } */
  const handleUpload = useCallback(async (roomId: string, files: File[]) => {
    try {
      const res = await roomService.uploadImages(roomId, files);
      updateRoomImages(roomId, res.images);
      toast.success(`Đã upload ${files.length} ảnh`);
    } catch (err) {
      toast.error(`Upload thất bại: ${err instanceof Error ? err.message : 'Lỗi'}`);
      throw err;
    }
  }, [updateRoomImages]);

  /** Xoá ảnh — gửi full imageUrl path trong body */
  const handleRemove = useCallback(async (roomId: string, displayUrl: string) => {
    // Chuyển URL tuyệt đối về path tương đối trước khi gửi lên server
    const imageUrl = displayUrl.replace(roomService.BACKEND_ORIGIN, '');
    try {
      const res = await roomService.deleteImage(roomId, imageUrl);
      updateRoomImages(roomId, res.images);
      toast.success('Đã xoá ảnh');
    } catch (err) {
      toast.error(`Xoá ảnh thất bại: ${err instanceof Error ? err.message : 'Lỗi'}`);
    }
  }, [updateRoomImages]);

  /** Sắp xếp lại ảnh — optimistic UI rồi đồng bộ server */
  const handleReorder = useCallback(async (roomId: string, newImages: string[]) => {
    // Chuyển URL tuyệt đối về path tương đối
    const relative = newImages.map(url => url.replace(roomService.BACKEND_ORIGIN, ''));
    // Cập nhật UI ngay (optimistic)
    updateRoomImages(roomId, relative);
    try {
      const res = await roomService.reorderImages(roomId, relative);
      updateRoomImages(roomId, res.images);
    } catch (err) {
      toast.error(`Sắp xếp ảnh thất bại: ${err instanceof Error ? err.message : 'Lỗi'}`);
      fetchRooms(); // Rollback bằng cách tải lại từ server
    }
  }, [updateRoomImages, fetchRooms]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchRooms}>
          <RefreshCw className="mr-2 size-4" /> Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Quản lý hình ảnh phòng</h2>
        <Button variant="outline" size="sm" onClick={fetchRooms}>
          <RefreshCw className="mr-2 size-4" /> Làm mới
        </Button>
      </div>

      {rooms.length === 0 ? (
        <p className="text-muted-foreground">Chưa có phòng nào trong hệ thống.</p>
      ) : (
        <div className="space-y-6">
          {rooms.map(room => (
            <RoomImageCard
              key={room.id}
              room={room}
              onUpload={(files) => handleUpload(room.id, files)}
              onRemove={(url) => handleRemove(room.id, url)}
              onReorder={(imgs) => handleReorder(room.id, imgs)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Card hiển thị thông tin phòng + grid upload ảnh */
function RoomImageCard({
  room,
  onUpload,
  onRemove,
  onReorder,
}: {
  room: RoomDetail;
  onUpload: (files: File[]) => Promise<void>;
  onRemove: (imageUrl: string) => Promise<void>;
  onReorder: (images: string[]) => void;
}) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-nhacam-primary/10">
          <ImageIcon className="size-5 text-nhacam-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{room.name}</h3>
          <p className="text-sm text-muted-foreground">
            {ROOM_TYPE_LABELS[room.type] || room.type} &middot; Tối đa {room.maxGuests} khách
            &middot; {formatPrice(room.hourlyRate)}/giờ
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {room.images.length}/5 ảnh
        </span>
      </div>

      <ImageUpload
        images={room.images.map(roomService.imageUrl)}
        onUpload={onUpload}
        onRemove={onRemove}
        onReorder={onReorder}
      />
    </div>
  );
}
