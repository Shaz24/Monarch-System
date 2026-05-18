import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-pulse bg-white/5 border border-white/5 rounded-md ${className}`}
      {...props}
    />
  );
};

export const SkeletonText: React.FC<SkeletonProps & { width?: string; height?: string }> = ({
  width = 'w-full',
  height = 'h-4',
  className = '',
  ...props
}) => {
  return (
    <Skeleton
      className={`${width} ${height} ${className}`}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC<SkeletonProps & { height?: string }> = ({
  height = 'h-48',
  className = '',
  ...props
}) => {
  return (
    <Skeleton
      className={`w-full ${height} rounded-xl p-6 flex flex-col justify-between ${className}`}
      {...props}
    >
      <div className="space-y-3">
        <SkeletonText width="w-2/3" height="h-6" />
        <SkeletonText width="w-1/2" height="h-4" />
      </div>
      <div className="space-y-2">
        <SkeletonText width="w-full" height="h-3" />
        <SkeletonText width="w-4/5" height="h-3" />
      </div>
    </Skeleton>
  );
};

export const SkeletonRow: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <Skeleton
      className={`w-full h-16 rounded-lg p-4 flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      <div className="flex items-center gap-4 flex-1">
        <SkeletonText width="w-10" height="h-10" className="rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonText width="w-1/3" height="h-4" />
          <SkeletonText width="w-1/4" height="h-3" />
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <SkeletonText width="w-16" height="h-6" className="rounded" />
        <SkeletonText width="w-8" height="h-8" className="rounded-full" />
      </div>
    </Skeleton>
  );
};
