"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { cx } from "@/utils/cx";

export type BadgeColor = "gray" | "brand" | "error" | "warning" | "success" | "blue" | "indigo" | "purple" | "pink" | "orange";
export type BadgeSize = "sm" | "md" | "lg";
export type BadgeType = "pill" | "badge" | "modern";

const filledColors: Record<BadgeColor, { root: string; addon: string; addonButton: string }> = {
    gray: {
        root: "bg-utility-gray-50 text-utility-gray-700 ring-utility-gray-200",
        addon: "text-utility-gray-500",
        addonButton: "hover:bg-utility-gray-100 text-utility-gray-400 hover:text-utility-gray-500",
    },
    brand: {
        root: "bg-utility-brand-50 text-utility-brand-700 ring-utility-brand-200",
        addon: "text-utility-brand-500",
        addonButton: "hover:bg-utility-brand-100 text-utility-brand-400 hover:text-utility-brand-500",
    },
    error: {
        root: "bg-utility-error-50 text-utility-error-700 ring-utility-error-200",
        addon: "text-utility-error-500",
        addonButton: "hover:bg-utility-error-100 text-utility-error-400 hover:text-utility-error-500",
    },
    warning: {
        root: "bg-utility-warning-50 text-utility-warning-700 ring-utility-warning-200",
        addon: "text-utility-warning-500",
        addonButton: "hover:bg-utility-warning-100 text-utility-warning-400 hover:text-utility-warning-500",
    },
    success: {
        root: "bg-utility-success-50 text-utility-success-700 ring-utility-success-200",
        addon: "text-utility-success-500",
        addonButton: "hover:bg-utility-success-100 text-utility-success-400 hover:text-utility-success-500",
    },
    blue: {
        root: "bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200",
        addon: "text-utility-blue-500",
        addonButton: "hover:bg-utility-blue-100 text-utility-blue-400 hover:text-utility-blue-500",
    },
    indigo: {
        root: "bg-utility-indigo-50 text-utility-indigo-700 ring-utility-indigo-200",
        addon: "text-utility-indigo-500",
        addonButton: "hover:bg-utility-indigo-100 text-utility-indigo-400 hover:text-utility-indigo-500",
    },
    purple: {
        root: "bg-utility-purple-50 text-utility-purple-700 ring-utility-purple-200",
        addon: "text-utility-purple-500",
        addonButton: "hover:bg-utility-purple-100 text-utility-purple-400 hover:text-utility-purple-500",
    },
    pink: {
        root: "bg-utility-pink-50 text-utility-pink-700 ring-utility-pink-200",
        addon: "text-utility-pink-500",
        addonButton: "hover:bg-utility-pink-100 text-utility-pink-400 hover:text-utility-pink-500",
    },
    orange: {
        root: "bg-utility-orange-50 text-utility-orange-700 ring-utility-orange-200",
        addon: "text-utility-orange-500",
        addonButton: "hover:bg-utility-orange-100 text-utility-orange-400 hover:text-utility-orange-500",
    },
};

const typeStyles: Record<BadgeType, string> = {
    pill: "rounded-full ring-1 ring-inset",
    badge: "rounded-md ring-1 ring-inset",
    modern: "rounded-md ring-1 ring-inset shadow-xs",
};

const sizeStyles: Record<BadgeType, Record<BadgeSize, string>> = {
    pill: {
        sm: "py-0.5 px-2 text-xs font-medium",
        md: "py-0.5 px-2.5 text-sm font-medium",
        lg: "py-1 px-3 text-sm font-medium",
    },
    badge: {
        sm: "py-0.5 px-1.5 text-xs font-medium",
        md: "py-0.5 px-2 text-sm font-medium",
        lg: "py-1 px-2.5 text-sm font-medium rounded-lg",
    },
    modern: {
        sm: "py-0.5 px-1.5 text-xs font-medium",
        md: "py-0.5 px-2 text-sm font-medium",
        lg: "py-1 px-2.5 text-sm font-medium rounded-lg",
    },
};

interface BadgeProps {
    type?: BadgeType;
    size?: BadgeSize;
    color?: BadgeColor;
    children: ReactNode;
    className?: string;
    onRemove?: MouseEventHandler<HTMLButtonElement>;
}

export const Badge = ({ type = "pill", size = "md", color = "gray", children, className, onRemove }: BadgeProps) => {
    const colors = type === "modern" ? { root: "bg-primary text-secondary ring-primary", addon: filledColors[color].addon } : filledColors[color];

    return (
        <span className={cx("size-max flex items-center whitespace-nowrap", typeStyles[type], sizeStyles[type][size], colors.root, className)}>
            {children}
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className={cx(
                        "ml-1 flex cursor-pointer items-center justify-center p-0.5 transition duration-100 ease-linear",
                        filledColors[color].addonButton,
                        type === "pill" ? "rounded-full" : "rounded-[3px]",
                    )}
                >
                    <svg className="size-3 stroke-[3px]" viewBox="0 0 14 14" fill="none" stroke="currentColor">
                        <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            )}
        </span>
    );
};
