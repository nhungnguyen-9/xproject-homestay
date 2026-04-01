import React, { useRef } from "react";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
    images: File[];
    onImagesChange: (images: File[]) => void;
    maxImages?: number;
}

/**
 * Component upload ảnh giấy tờ tuỳ thân (CMND/CCCD/Passport) — hỗ trợ kéo thả, xem trước và xoá ảnh
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
    images,
    onImagesChange,
    maxImages = 3,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter((file) =>
            ["image/jpeg", "image/png", "image/heic", "image/webp"].includes(
                file.type,
            ),
        );
        const newImages = [...images, ...validFiles].slice(0, maxImages);
        onImagesChange(newImages);
        if (inputRef.current) inputRef.current.value = "";
    };

    const removeImage = (index: number) => {
        onImagesChange(images.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-status-success-muted/30 transition-all duration-200"
                onClick={() => inputRef.current?.click()}
            >
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                    Kéo thả ảnh vào đây hoặc{" "}
                    <span className="text-primary font-medium hover:underline">
                        chọn file
                    </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC, WebP</p>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/heic,image/webp"
                multiple
                className="hidden"
                onChange={handleFileChange}
            />
            {images.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                    {images.map((file, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={URL.createObjectURL(file)}
                                alt={`ID ${index + 1}`}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 size-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                                type="button"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
