import { cx } from "@/utils/cx";

interface SkeletonProps {
    className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
    return <div className={cx("animate-pulse rounded-md bg-secondary_subtle", className)} />;
};

export const SkeletonText = ({ className }: SkeletonProps) => {
    return <div className={cx("h-4 w-3/4 animate-pulse rounded bg-secondary_subtle", className)} />;
};

export const SkeletonCircle = ({ className }: SkeletonProps) => {
    return <div className={cx("size-10 animate-pulse rounded-full bg-secondary_subtle", className)} />;
};
