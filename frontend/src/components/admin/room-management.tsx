import React, { useState, useEffect, useCallback } from 'react';
import { ImageUpload } from '@/components/ui/image-upload';
import { Button } from '@/components/ui/button';
import * as roomService from '@/services/roomService';
import type { RoomDetail, CreateRoomPayload } from '@/types/room';
import { formatPrice } from '@/utils/helpers';
import { Loader2, ImageIcon, RefreshCw, Plus, Pencil, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { RoomFormModal } from './room-form-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Nhãn tiếng Việt cho loại phòng */
const ROOM_TYPE_LABELS: Record<string, string> = {
  standard: 'Tiêu chuẩn',
  vip: 'VIP',
  supervip: 'Super VIP',
};

/**
 * Trang quản lý phòng — hiển thị danh sách phòng, CRUD phòng, upload/xoá/sắp xếp ảnh cho từng phòng
 */
export function RoomManagement() {
  const [rooms, setRooms] = useState<RoomDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CRUD modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomDetail | null>(null);

  // Deactivate confirmation state
  const [confirmDeactivateRoom, setConfirmDeactivateRoom] = useState<RoomDetail | null>(null);

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

  /** Thay thế ảnh — chuyển URL tuyệt đối về tương đối rồi gọi API */
  const handleReplace = useCallback(async (roomId: string, displayUrl: string, newFile: File) => {
    const imageUrl = displayUrl.replace(roomService.BACKEND_ORIGIN, '');
    try {
      const res = await roomService.replaceImage(roomId, imageUrl, newFile);
      updateRoomImages(roomId, res.images);
      toast.success('Đã thay thế ảnh');
    } catch (err) {
      toast.error(`Thay thế ảnh thất bại: ${err instanceof Error ? err.message : 'Lỗi'}`);
      throw err;
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

  /** Mở modal tạo phòng mới */
  const handleOpenCreate = useCallback(() => {
    setEditingRoom(null);
    setModalOpen(true);
  }, []);

  /** Mở modal chỉnh sửa phòng */
  const handleOpenEdit = useCallback((room: RoomDetail) => {
    setEditingRoom(room);
    setModalOpen(true);
  }, []);

  /** Xử lý submit form (tạo mới hoặc cập nhật) */
  const handleFormSuccess = useCallback(async (data: CreateRoomPayload) => {
    try {
      if (editingRoom) {
        await roomService.update(editingRoom.id, data);
        toast.success('Cập nhật phòng thành công');
      } else {
        await roomService.create(data);
        toast.success('Tạo phòng mới thành công');
      }
      fetchRooms();
    } catch (err) {
      toast.error(
        editingRoom
          ? `Cập nhật thất bại: ${err instanceof Error ? err.message : 'Lỗi'}`
          : `Tạo phòng thất bại: ${err instanceof Error ? err.message : 'Lỗi'}`
      );
      throw err; // Re-throw để modal biết có lỗi
    }
  }, [editingRoom, fetchRooms]);

  /** Xử lý vô hiệu hóa phòng sau khi confirm */
  const handleConfirmDeactivate = useCallback(async () => {
    if (!confirmDeactivateRoom) return;
    try {
      await roomService.deactivate(confirmDeactivateRoom.id);
      toast.success(`Đã vô hiệu hóa phòng "${confirmDeactivateRoom.name}"`);
      fetchRooms();
    } catch (err) {
      toast.error(`Vô hiệu hóa thất bại: ${err instanceof Error ? err.message : 'Lỗi'}`);
    } finally {
      setConfirmDeactivateRoom(null);
    }
  }, [confirmDeactivateRoom, fetchRooms]);

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Quản lý phòng</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRooms}>
            <RefreshCw className="mr-2 size-4" /> Làm mới
          </Button>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-2 size-4" /> Thêm phòng
          </Button>
        </div>
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
              onReplace={(url, file) => handleReplace(room.id, url, file)}
              onEdit={() => handleOpenEdit(room)}
              onDeactivate={() => setConfirmDeactivateRoom(room)}
            />
          ))}
        </div>
      )}

      {/* Room Form Modal — tạo mới / chỉnh sửa */}
      <RoomFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleFormSuccess}
        room={editingRoom}
      />

      {/* Confirmation Dialog — vô hiệu hóa phòng */}
      <AlertDialog
        open={!!confirmDeactivateRoom}
        onOpenChange={(open) => { if (!open) setConfirmDeactivateRoom(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận vô hiệu hóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn vô hiệu hóa phòng &ldquo;{confirmDeactivateRoom?.name}&rdquo;?
              Phòng sẽ không còn hiển thị cho khách hàng nhưng dữ liệu vẫn được giữ lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Vô hiệu hóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Card hiển thị thông tin phòng + grid upload ảnh + nút Sửa/Vô hiệu hóa */
function RoomImageCard({
  room,
  onUpload,
  onRemove,
  onReorder,
  onReplace,
  onEdit,
  onDeactivate,
}: {
  room: RoomDetail;
  onUpload: (files: File[]) => Promise<void>;
  onRemove: (imageUrl: string) => Promise<void>;
  onReorder: (images: string[]) => void;
  onReplace: (imageUrl: string, newFile: File) => Promise<void>;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {room.images.length}/5 ảnh
          </span>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1 size-3.5" /> Sửa
          </Button>
          <Button variant="outline" size="sm" onClick={onDeactivate} className="text-destructive hover:text-destructive">
            <Ban className="mr-1 size-3.5" /> Vô hiệu hóa
          </Button>
        </div>
      </div>

      <ImageUpload
        images={room.images.map(roomService.imageUrl)}
        onUpload={onUpload}
        onRemove={onRemove}
        onReorder={onReorder}
        onReplace={onReplace}
      />
    </div>
  );
}
