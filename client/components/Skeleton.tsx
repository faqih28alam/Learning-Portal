interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div
            className={`bg-stone-200 rounded-lg animate-pulse ${className}`}
            aria-hidden="true"
        />
    );
}

// Pre-built skeleton layouts
export function QuestionCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
                <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
            </div>
        </div>
    );
}

export function SubmissionCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
        </div>
    );
}

export function QuestionDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-36 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>
        </div>
    );
}