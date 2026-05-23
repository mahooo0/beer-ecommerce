"use client";

import { type FC, type ReactNode, useState } from "react";
import { cx } from "@/utils/cx";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface AvatarProps {
    size?: AvatarSize;
    className?: string;
    src?: string | null;
    alt?: string;
    contrastBorder?: boolean;
    status?: "online" | "offline";
    initials?: string;
    placeholderIcon?: FC<{ className?: string }>;
    placeholder?: ReactNode;
}

const styles = {
    xs: { root: "size-6 outline-[0.5px] -outline-offset-[0.5px]", initials: "text-xs font-semibold", icon: "size-4" },
    sm: { root: "size-8 outline-[0.75px] -outline-offset-[0.75px]", initials: "text-sm font-semibold", icon: "size-5" },
    md: { root: "size-10 outline-1 -outline-offset-1", initials: "text-md font-semibold", icon: "size-6" },
    lg: { root: "size-12 outline-1 -outline-offset-1", initials: "text-lg font-semibold", icon: "size-7" },
    xl: { root: "size-14 outline-1 -outline-offset-1", initials: "text-xl font-semibold", icon: "size-8" },
    "2xl": { root: "size-16 outline-1 -outline-offset-1", initials: "text-display-xs font-semibold", icon: "size-8" },
};

export const Avatar = ({
    contrastBorder = true,
    size = "md",
    src,
    alt,
    initials,
    placeholder,
    placeholderIcon: PlaceholderIcon,
    status,
    className,
}: AvatarProps) => {
    const [isFailed, setIsFailed] = useState(false);

    const renderMainContent = () => {
        if (src && !isFailed) {
            return <img className="size-full rounded-full object-cover" src={src} alt={alt} onError={() => setIsFailed(true)} />;
        }
        if (initials) {
            return <span className={cx("text-quaternary", styles[size].initials)}>{initials}</span>;
        }
        if (PlaceholderIcon) {
            return <PlaceholderIcon className={cx("text-fg-quaternary", styles[size].icon)} />;
        }
        return (
            placeholder || (
                <svg className={cx("text-fg-quaternary", styles[size].icon)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        );
    };

    return (
        <div
            className={cx(
                "relative inline-flex shrink-0 items-center justify-center rounded-full bg-avatar-bg outline-transparent",
                contrastBorder && "outline outline-avatar-contrast-border",
                styles[size].root,
                className,
            )}
        >
            {renderMainContent()}
            {status && (
                <span
                    className={cx(
                        "absolute right-0 bottom-0 block rounded-full ring-2 ring-white",
                        size === "xs" ? "size-1.5" : size === "sm" ? "size-2" : "size-2.5",
                        status === "online" ? "bg-utility-success-500" : "bg-utility-gray-300",
                    )}
                />
            )}
        </div>
    );
};
