import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
    const steps = [
        { num: 1, label: "Chọn phòng" },
        { num: 2, label: "Thông tin" },
        { num: 3, label: "Thanh toán" },
    ];

    return (
        <div className="flex items-center gap-1">
            {steps.map((step, idx) => (
                <React.Fragment key={step.num}>
                    <div className="flex items-center gap-1.5">
                        <div
                            className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                currentStep >= step.num
                                    ? "bg-rose-400 text-white"
                                    : "bg-gray-200 text-gray-500",
                            )}
                        >
                            {currentStep > step.num ? (
                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            ) : (
                                step.num
                            )}
                        </div>
                        <span
                            className={cn(
                                "text-xs font-medium hidden md:block",
                                currentStep >= step.num ? "text-rose-500" : "text-gray-400",
                            )}
                        >
                            {step.label}
                        </span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div
                            className={cn(
                                "w-6 h-0.5 mx-1",
                                currentStep > step.num ? "bg-rose-400" : "bg-gray-200",
                            )}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
