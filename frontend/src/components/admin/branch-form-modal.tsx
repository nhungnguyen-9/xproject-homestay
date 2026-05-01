import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Branch, CreateBranchPayload } from '@/types/branch';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import * as branchService from '@/services/branchService';

interface BranchFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: CreateBranchPayload) => Promise<Branch | void>;
    /** Khi truyền branch, modal chuyển sang mode chỉnh sửa và pre-fill data */
    branch?: Branch | null;
}

interface FormErrors {
    name?: string;
    address?: string;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Modal tạo/sửa chi nhánh — hỗ trợ upload ảnh, validation inline.
 */
export function BranchFormModal({ isOpen, onClose, onSuccess, branch }: BranchFormModalProps) {
    const isEditMode = !!branch;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [district, setDistrict] = useState('');
    const [phone, setPhone] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);

    // Ảnh đã upload (URLs từ server)
    const [existingImages, setExistingImages] = useState<string[]>([]);
    // Ảnh mới chưa upload (File objects)
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    /** Blob URL preview cho ảnh pending */
    const pendingPreviews = useMemo(
        () => pendingFiles.map(f => URL.createObjectURL(f)),
        [pendingFiles],
    );
    useEffect(() => {
        return () => pendingPreviews.forEach(url => URL.revokeObjectURL(url));
    }, [pendingPreviews]);

    // Pre-fill / reset khi modal mở
    useEffect(() => {
        if (isOpen) {
            if (branch) {
                setName(branch.name);
                setAddress(branch.address);
                setDistrict(branch.district || '');
                setPhone(branch.phone || '');
                setExistingImages(branch.images || []);
            } else {
                setName('');
                setAddress('');
                setDistrict('');
                setPhone('');
                setExistingImages([]);
            }
            setPendingFiles([]);
            setErrors({});
            setSubmitting(false);
        }
    }, [isOpen, branch]);

    const totalImages = existingImages.length + pendingFiles.length;

    function validate(): boolean {
        const newErrors: FormErrors = {};
        if (!name.trim()) newErrors.name = 'Tên chi nhánh là bắt buộc';
        if (!address.trim()) newErrors.address = 'Địa chỉ là bắt buộc';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    /** Chọn file mới */
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remaining = MAX_IMAGES - totalImages;
        const allowed = files.slice(0, remaining);

        const valid = allowed.filter(f => {
            const okType = ALLOWED_TYPES.includes(f.type);
            const okSize = f.size <= MAX_FILE_SIZE;
            return okType && okSize;
        });

        const rejected = allowed.length - valid.length;
        if (rejected > 0) {
            toast.error(`${rejected} file bị bỏ qua (sai định dạng hoặc vượt 5MB)`);
        }

        if (valid.length > 0) {
            setPendingFiles(prev => [...prev, ...valid]);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    /** Xoá ảnh pending */
    function removePending(index: number) {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    }

    /** Xoá ảnh đã upload (chỉ khi edit mode) */
    async function removeExisting(imageUrl: string) {
        if (!branch) return;
        try {
            const relativePath = imageUrl.replace(branchService.BACKEND_ORIGIN, '');
            const res = await branchService.deleteImage(branch.id, relativePath);
            setExistingImages(res.images);
            toast.success('Đã xoá ảnh');
        } catch (err) {
            toast.error(`Xoá ảnh thất bại: ${err instanceof Error ? err.message : 'Lỗi'}`);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        const payload: CreateBranchPayload = {
            name: name.trim(),
            address: address.trim(),
            ...(district.trim() && { district: district.trim() }),
            ...(phone.trim() && { phone: phone.trim() }),
        };

        setSubmitting(true);
        try {
            const result = await onSuccess(payload);

            // Upload ảnh pending nếu có
            if (pendingFiles.length > 0) {
                const branchId = isEditMode ? branch!.id : (result as Branch)?.id;
                if (branchId) {
                    try {
                        await branchService.uploadImages(branchId, pendingFiles);
                        toast.success(`Đã upload ${pendingFiles.length} ảnh`);
                    } catch (err) {
                        toast.error(`Upload ảnh thất bại: ${err instanceof Error ? err.message : 'Lỗi'}`);
                    }
                }
            }

            onClose();
        } catch {
            // Error handled by parent
        } finally {
            setSubmitting(false);
        }
    }

    /** Upload ảnh pending cho chi nhánh đang edit */
    async function handleUploadPending() {
        if (!branch || pendingFiles.length === 0) return;
        setUploadingImages(true);
        try {
            const res = await branchService.uploadImages(branch.id, pendingFiles);
            setExistingImages(res.images);
            setPendingFiles([]);
            toast.success(`Đã upload ${pendingFiles.length} ảnh`);
        } catch (err) {
            toast.error(`Upload thất bại: ${err instanceof Error ? err.message : 'Lỗi'}`);
        } finally {
            setUploadingImages(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? 'Cập nhật thông tin chi nhánh bên dưới.'
                            : 'Nhập thông tin chi nhánh mới bên dưới.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tên chi nhánh */}
                    <div className="space-y-1.5">
                        <Label htmlFor="branch-name">
                            Tên chi nhánh <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="branch-name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                            }}
                            placeholder="Nhập tên chi nhánh"
                            aria-invalid={!!errors.name}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    {/* Địa chỉ */}
                    <div className="space-y-1.5">
                        <Label htmlFor="branch-address">
                            Địa chỉ <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="branch-address"
                            value={address}
                            onChange={(e) => {
                                setAddress(e.target.value);
                                if (errors.address) setErrors(prev => ({ ...prev, address: undefined }));
                            }}
                            placeholder="Nhập địa chỉ chi nhánh"
                            aria-invalid={!!errors.address}
                        />
                        {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                    </div>

                    {/* Quận/huyện */}
                    <div className="space-y-1.5">
                        <Label htmlFor="branch-district">Quận/huyện</Label>
                        <Input
                            id="branch-district"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            placeholder="Nhập quận/huyện (không bắt buộc)"
                        />
                    </div>

                    {/* Số điện thoại */}
                    <div className="space-y-1.5">
                        <Label htmlFor="branch-phone">Số điện thoại</Label>
                        <Input
                            id="branch-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Nhập số điện thoại (không bắt buộc)"
                        />
                    </div>

                    {/* Hình ảnh */}
                    <div className="space-y-2">
                        <Label>Hình ảnh chi nhánh</Label>
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                            {/* Ảnh đã upload */}
                            {existingImages.map((img) => {
                                const displayUrl = branchService.imageUrl(img);
                                return (
                                    <div key={img} className="group relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
                                        <img src={displayUrl} alt="Ảnh chi nhánh" className="h-full w-full object-cover" />
                                        {isEditMode && (
                                            <button
                                                type="button"
                                                onClick={() => removeExisting(displayUrl)}
                                                className="absolute right-1 top-1 z-10 flex size-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-transform hover:scale-110"
                                                title="Xoá ảnh"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Ảnh pending */}
                            {pendingFiles.map((_, idx) => (
                                <div key={`pending-${idx}`} className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-nhacam-primary bg-nhacam-primary/5">
                                    <img src={pendingPreviews[idx]} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover opacity-80" />
                                    <button
                                        type="button"
                                        onClick={() => removePending(idx)}
                                        className="absolute right-1 top-1 z-10 flex size-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-transform hover:scale-110"
                                        title="Bỏ chọn"
                                    >
                                        <X size={14} />
                                    </button>
                                    <span className="absolute bottom-1 left-1 rounded bg-nhacam-primary/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                        Chờ tải
                                    </span>
                                </div>
                            ))}

                            {/* Nút thêm ảnh */}
                            {totalImages < MAX_IMAGES && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white transition-all hover:border-nhacam-primary hover:bg-gray-50"
                                >
                                    <Upload size={20} className="mb-1 text-gray-400" />
                                    <span className="text-xs font-medium text-gray-400">Thêm ảnh</span>
                                </div>
                            )}
                        </div>

                        {/* Nút upload ảnh pending (chỉ hiện khi edit mode và có ảnh chờ) */}
                        {isEditMode && pendingFiles.length > 0 && (
                            <Button
                                type="button"
                                onClick={handleUploadPending}
                                disabled={uploadingImages}
                                size="sm"
                                className="w-fit"
                            >
                                {uploadingImages
                                    ? <Loader2 className="mr-2 size-4 animate-spin" />
                                    : <Upload className="mr-2 size-4" />
                                }
                                Tải lên {pendingFiles.length} ảnh
                            </Button>
                        )}

                        <p className="text-xs text-gray-500">
                            Tối đa {MAX_IMAGES} ảnh. Hỗ trợ JPG, PNG, WEBP (tối đa 5MB/ảnh).
                            {!isEditMode && pendingFiles.length > 0 && (
                                <span className="ml-1 text-nhacam-primary">Ảnh sẽ được upload sau khi tạo chi nhánh.</span>
                            )}
                        </p>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                            Huỷ
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {isEditMode ? 'Cập nhật' : 'Tạo chi nhánh'}
                        </Button>
                    </DialogFooter>
                </form>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                />
            </DialogContent>
        </Dialog>
    );
}
