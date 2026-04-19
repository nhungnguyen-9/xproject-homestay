import { useState, useEffect, useCallback } from 'react';
import { ImageUpload } from '@/components/ui/image-upload';
import { Button } from '@/components/ui/button';
import * as branchService from '@/services/branchService';
import type { Branch, CreateBranchPayload } from '@/types/branch';
import { BranchFormModal } from './branch-form-modal';
import { Loader2, RefreshCw, Plus, Pencil, Trash2, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
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

/**
 * Trang quản lý chi nhánh — hiển thị danh sách chi nhánh, tạo mới, chỉnh sửa, xoá và quản lý ảnh.
 */
export function BranchManagement() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [confirmDeleteBranch, setConfirmDeleteBranch] = useState<Branch | null>(null);

    const fetchBranches = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await branchService.getAll();
            setBranches(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tải danh sách chi nhánh');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBranches(); }, [fetchBranches]);

    const handleOpenCreate = useCallback(() => {
        setEditingBranch(null);
        setModalOpen(true);
    }, []);

    const handleOpenEdit = useCallback((branch: Branch) => {
        setEditingBranch(branch);
        setModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalOpen(false);
        setEditingBranch(null);
    }, []);

    const handleFormSuccess = useCallback(async (data: CreateBranchPayload) => {
        try {
            let result: Branch | undefined;
            if (editingBranch) {
                await branchService.update(editingBranch.id, data);
                toast.success('Cập nhật chi nhánh thành công');
            } else {
                result = await branchService.create(data);
                toast.success('Tạo chi nhánh thành công');
            }
            await fetchBranches();
            return result;
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
            throw err;
        }
    }, [editingBranch, fetchBranches]);

    /** Xoá chi nhánh sau khi confirm */
    const handleConfirmDelete = useCallback(async () => {
        if (!confirmDeleteBranch) return;
        try {
            await branchService.remove(confirmDeleteBranch.id);
            toast.success(`Đã xoá chi nhánh "${confirmDeleteBranch.name}"`);
            await fetchBranches();
        } catch (err) {
            toast.error(`Xoá thất bại: ${err instanceof Error ? err.message : 'Lỗi'}`);
        } finally {
            setConfirmDeleteBranch(null);
        }
    }, [confirmDeleteBranch, fetchBranches]);

    const updateBranchImages = useCallback((branchId: string, images: string[]) => {
        setBranches(prev => prev.map(b => b.id === branchId ? { ...b, images } : b));
    }, []);

    const handleUpload = useCallback(async (branchId: string, files: File[]) => {
        try {
            const res = await branchService.uploadImages(branchId, files);
            updateBranchImages(branchId, res.images);
            toast.success(`Đã upload ${files.length} ảnh`);
        } catch (err) {
            toast.error(`Upload thất bại: ${err instanceof Error ? err.message : 'Lỗi'}`);
            throw err;
        }
    }, [updateBranchImages]);

    const handleRemoveImage = useCallback(async (branchId: string, displayUrl: string) => {
        const imageUrl = displayUrl.replace(branchService.BACKEND_ORIGIN, '');
        try {
            const res = await branchService.deleteImage(branchId, imageUrl);
            updateBranchImages(branchId, res.images);
            toast.success('Đã xoá ảnh');
        } catch (err) {
            toast.error(`Xoá ảnh thất bại: ${err instanceof Error ? err.message : 'Lỗi'}`);
        }
    }, [updateBranchImages]);

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
                <Button variant="outline" onClick={fetchBranches}>
                    <RefreshCw className="mr-2 size-4" /> Thử lại
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Quản lý chi nhánh</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchBranches}>
                        <RefreshCw className="mr-2 size-4" /> Làm mới
                    </Button>
                    <Button size="sm" onClick={handleOpenCreate}>
                        <Plus className="mr-2 size-4" /> Thêm chi nhánh
                    </Button>
                </div>
            </div>

            {branches.length === 0 ? (
                <p className="text-muted-foreground">Chưa có chi nhánh nào trong hệ thống.</p>
            ) : (
                <div className="space-y-6">
                    {branches.map((branch) => (
                        <BranchCard
                            key={branch.id}
                            branch={branch}
                            onEdit={() => handleOpenEdit(branch)}
                            onDelete={() => setConfirmDeleteBranch(branch)}
                            onUpload={(files) => handleUpload(branch.id, files)}
                            onRemoveImage={(url) => handleRemoveImage(branch.id, url)}
                        />
                    ))}
                </div>
            )}

            <BranchFormModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                onSuccess={handleFormSuccess}
                branch={editingBranch}
            />

            {/* Confirmation Dialog — xoá chi nhánh */}
            <AlertDialog
                open={!!confirmDeleteBranch}
                onOpenChange={(open) => { if (!open) setConfirmDeleteBranch(null); }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xoá chi nhánh</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xoá chi nhánh &ldquo;{confirmDeleteBranch?.name}&rdquo;?
                            Thao tác này không thể hoàn tác. Các phòng thuộc chi nhánh này sẽ không còn liên kết.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Huỷ</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Xoá chi nhánh
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

/** Card hiển thị thông tin chi nhánh + upload ảnh */
function BranchCard({
    branch,
    onEdit,
    onDelete,
    onUpload,
    onRemoveImage,
}: {
    branch: Branch;
    onEdit: () => void;
    onDelete: () => void;
    onUpload: (files: File[]) => Promise<void>;
    onRemoveImage: (imageUrl: string) => Promise<void>;
}) {
    return (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-nhacam-primary/10">
                        <MapPin className="size-5 text-nhacam-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">{branch.name}</h3>
                        <p className="text-sm text-muted-foreground">{branch.address}</p>
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                            {branch.district && <span>{branch.district}</span>}
                            {branch.phone && (
                                <span className="flex items-center gap-1">
                                    <Phone className="size-3" />
                                    {branch.phone}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {(branch.images || []).length}/5 ảnh
                    </span>
                    <Button variant="outline" size="sm" onClick={onEdit}>
                        <Pencil className="mr-1 size-3.5" /> Sửa
                    </Button>
                    <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
                        <Trash2 className="mr-1 size-3.5" /> Xoá
                    </Button>
                </div>
            </div>

            <ImageUpload
                images={(branch.images || []).map(branchService.imageUrl)}
                onUpload={onUpload}
                onRemove={onRemoveImage}
                onReorder={() => { }}
            />
        </div>
    );
}
