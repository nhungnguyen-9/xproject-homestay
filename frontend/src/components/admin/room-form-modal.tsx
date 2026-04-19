import React, { useState, useEffect, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { RoomDetail, CreateRoomPayload } from '@/types/room';
import type { Branch } from '@/types/branch';
import * as branchService from '@/services/branchService';
import { Loader2, X } from 'lucide-react';

interface RoomFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: CreateRoomPayload) => Promise<void>;
    /** Khi truyền room, modal chuyển sang mode chỉnh sửa và pre-fill data */
    room?: RoomDetail | null;
}

interface FormErrors {
    name?: string;
    type?: string;
    perMinuteRate?: string;
}

const ROOM_TYPE_OPTIONS = [
    { value: 'standard', label: 'Tiêu chuẩn' },
    { value: 'vip', label: 'VIP' },
    { value: 'supervip', label: 'Super VIP' },
] as const;

/**
 * Modal tạo/sửa phòng — hỗ trợ cả mode tạo mới và chỉnh sửa.
 * Hiển thị validation errors inline cho từng field.
 */
export function RoomFormModal({ isOpen, onClose, onSuccess, room }: RoomFormModalProps) {
    const isEditMode = !!room;

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState<string>('');
    const [branchId, setBranchId] = useState<string>('');
    const [perMinuteRate, setPerMinuteRate] = useState<string>('');
    const [hourlyRate, setHourlyRate] = useState<string>('0');
    const [dailyRate, setDailyRate] = useState<string>('0');
    const [overnightRate, setOvernightRate] = useState<string>('0');
    const [extraHourRate, setExtraHourRate] = useState<string>('0');
    const [maxGuests, setMaxGuests] = useState<string>('2');
    const [description, setDescription] = useState('');
    const [amenities, setAmenities] = useState<string[]>([]);
    const [amenityInput, setAmenityInput] = useState('');

    // UI state
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);

    // Load branches on mount
    const loadBranches = useCallback(async () => {
        setLoadingBranches(true);
        try {
            const data = await branchService.getAll();
            setBranches(data);
        } catch {
            // Silently fail — branch dropdown will be empty
        } finally {
            setLoadingBranches(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadBranches();
        }
    }, [isOpen, loadBranches]);

    // Pre-fill data khi edit mode hoặc reset khi tạo mới
    useEffect(() => {
        if (isOpen) {
            if (room) {
                setName(room.name);
                setType(room.type);
                setBranchId(room.branchId || '');
                setPerMinuteRate(String(room.perMinuteRate));
                setHourlyRate(String(room.hourlyRate));
                setDailyRate(String(room.dailyRate));
                setOvernightRate(String(room.overnightRate));
                setExtraHourRate(String(room.extraHourRate));
                setMaxGuests(String(room.maxGuests));
                setDescription(room.description || '');
                setAmenities(room.amenities || []);
            } else {
                setName('');
                setType('');
                setBranchId('');
                setPerMinuteRate('');
                setHourlyRate('0');
                setDailyRate('0');
                setOvernightRate('0');
                setExtraHourRate('0');
                setMaxGuests('2');
                setDescription('');
                setAmenities([]);
            }
            setAmenityInput('');
            setErrors({});
            setSubmitting(false);
        }
    }, [isOpen, room]);

    /** Tính hourly equivalent từ perMinuteRate */
    const hourlyEquivalent = perMinuteRate ? Number(perMinuteRate) * 60 : 0;

    /** Validate required fields, trả về true nếu hợp lệ */
    function validate(): boolean {
        const newErrors: FormErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Tên phòng là bắt buộc';
        }

        if (!type) {
            newErrors.type = 'Loại phòng là bắt buộc';
        }

        const rateNum = Number(perMinuteRate);
        if (!perMinuteRate || isNaN(rateNum) || rateNum <= 0) {
            newErrors.perMinuteRate = 'Giá theo phút phải lớn hơn 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    /** Xử lý thêm amenity tag */
    function handleAmenityKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = amenityInput.trim();
            if (value && !amenities.includes(value)) {
                setAmenities((prev) => [...prev, value]);
            }
            setAmenityInput('');
        }
    }

    /** Xoá amenity tag */
    function removeAmenity(tag: string) {
        setAmenities((prev) => prev.filter((a) => a !== tag));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!validate()) return;

        const payload: CreateRoomPayload = {
            name: name.trim(),
            type: type as CreateRoomPayload['type'],
            branchId: (branchId && branchId !== 'none') ? branchId : null,
            description: description.trim() || null,
            images: room?.images || [],
            maxGuests: Number(maxGuests) || 2,
            amenities,
            perMinuteRate: Number(perMinuteRate),
            hourlyRate: Number(hourlyRate) || 0,
            dailyRate: Number(dailyRate) || 0,
            overnightRate: Number(overnightRate) || 0,
            extraHourRate: Number(extraHourRate) || 0,
        };

        setSubmitting(true);
        try {
            await onSuccess(payload);
            onClose();
        } catch {
            // Error handling is done by the parent component (toast)
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? 'Cập nhật thông tin phòng bên dưới.'
                            : 'Nhập thông tin phòng mới bên dưới.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tên phòng */}
                    <div className="space-y-1.5">
                        <Label htmlFor="room-name">
                            Tên phòng <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="room-name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                            }}
                            placeholder="Nhập tên phòng"
                            aria-invalid={!!errors.name}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name}</p>
                        )}
                    </div>

                    {/* Loại phòng */}
                    <div className="space-y-1.5">
                        <Label htmlFor="room-type">
                            Loại phòng <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={type}
                            onValueChange={(val) => {
                                setType(val);
                                if (errors.type) setErrors((prev) => ({ ...prev, type: undefined }));
                            }}
                        >
                            <SelectTrigger className="w-full" aria-invalid={!!errors.type}>
                                <SelectValue placeholder="Chọn loại phòng" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROOM_TYPE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.type && (
                            <p className="text-sm text-destructive">{errors.type}</p>
                        )}
                    </div>

                    {/* Chi nhánh */}
                    <div className="space-y-1.5">
                        <Label htmlFor="room-branch">Chi nhánh</Label>
                        <Select
                            value={branchId}
                            onValueChange={setBranchId}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={loadingBranches ? 'Đang tải...' : 'Chọn chi nhánh (không bắt buộc)'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Không chọn</SelectItem>
                                {branches.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Giá theo phút */}
                    <div className="space-y-1.5">
                        <Label htmlFor="room-per-minute-rate">
                            Giá theo phút (VNĐ) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="room-per-minute-rate"
                            type="number"
                            min="1"
                            value={perMinuteRate}
                            onChange={(e) => {
                                setPerMinuteRate(e.target.value);
                                if (errors.perMinuteRate) setErrors((prev) => ({ ...prev, perMinuteRate: undefined }));
                            }}
                            placeholder="Nhập giá theo phút"
                            aria-invalid={!!errors.perMinuteRate}
                        />
                        {errors.perMinuteRate && (
                            <p className="text-sm text-destructive">{errors.perMinuteRate}</p>
                        )}
                        {hourlyEquivalent > 0 && (
                            <p className="text-sm text-muted-foreground">
                                ≈ {hourlyEquivalent.toLocaleString('vi-VN')} đ/giờ
                            </p>
                        )}
                    </div>

                    {/* Giá theo giờ */}
                    <div className="space-y-1.5">
                        <Label htmlFor="room-hourly-rate">Giá theo giờ (VNĐ)</Label>
                        <Input
                            id="room-hourly-rate"
                            type="number"
                            min="0"
                            value={hourlyRate}
                            onChange={(e) => setHourlyRate(e.target.value)}
                            placeholder="0"
                        />
                    </div>

                    {/* Giá theo ngày */}
                    <div className="space-y-1.5">
                        <Label htmlFor="room-daily-rate">Giá theo ngày (VNĐ)</Label>
                        <Input
                            id="room-daily-rate"
                            type="number"
                            min="0"
                            value={dailyRate}
                            onChange={(e) => setDailyRate(e.target.value)}
                            placeholder="0"
                        />
                    </div>

                    {/* Giá qua đêm */}
                    <div className="space-y-1.5">
                        <Label htmlFor="room-overnight-rate">Giá qua đêm (VNĐ)</Label>
                        <Input
                            id="room-overnight-rate"
                            type="number"
                            min="0"
                            value={overnightRate}
                            onChange={(e) => setOvernightRate(e.target.value)}
                            placeholder="0"
                        />
                    </div>

                    {/* Số khách tối đa */}
                    <div className="space-y-1.5">
                        <Label htmlFor="room-max-guests">Số khách tối đa</Label>
                        <Input
                            id="room-max-guests"
                            type="number"
                            min="1"
                            value={maxGuests}
                            onChange={(e) => setMaxGuests(e.target.value)}
                            placeholder="2"
                        />
                    </div>

                    {/* Mô tả */}
                    <div className="space-y-1.5">
                        <Label htmlFor="room-description">Mô tả</Label>
                        <Textarea
                            id="room-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Nhập mô tả phòng (không bắt buộc)"
                            rows={3}
                        />
                    </div>

                    {/* Tiện nghi (tag input) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="room-amenities">Tiện nghi</Label>
                        <div className="flex flex-wrap gap-2">
                            {amenities.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-sm"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeAmenity(tag)}
                                        className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive"
                                        aria-label={`Xoá ${tag}`}
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <Input
                            id="room-amenities"
                            value={amenityInput}
                            onChange={(e) => setAmenityInput(e.target.value)}
                            onKeyDown={handleAmenityKeyDown}
                            placeholder="Nhập tiện nghi rồi nhấn Enter"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Huỷ
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {isEditMode ? 'Cập nhật' : 'Tạo phòng'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
