import { AlertCircle, CheckCircle2, Loader2, VideoOff } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG = {
  processing: {
    label: 'Processing',
    badgeClass: 'bg-blue-500/90 hover:bg-blue-500 text-white border-0',
    icon: Loader2,
    iconClass: 'text-blue-400',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-emerald-500/90 hover:bg-emerald-500 text-white border-0',
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
  },
  failed: {
    label: 'Failed',
    badgeClass: 'bg-red-500/90 hover:bg-red-500 text-white border-0',
    icon: AlertCircle,
    iconClass: 'text-red-400',
  },
  incomplete: {
    label: 'Incomplete video',
    badgeClass: 'bg-amber-500/90 hover:bg-amber-500 text-white border-0',
    icon: VideoOff,
    iconClass: 'text-amber-400',
  },
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'default';
  processingStep?: { current: number; total: number };
}

export const StatusBadge = ({ status, size = 'default', processingStep }: StatusBadgeProps) => {
  const statusUpper = status?.toUpperCase() || 'UNKNOWN';

  let category: 'processing' | 'completed' | 'failed' | 'incomplete';
  const statusLower = status?.toLowerCase() || '';

  if (statusUpper === 'INCOMPLETE_VIDEO') {
    category = 'incomplete';
  } else if (statusLower.includes('failed') || statusLower.includes('error')) {
    category = 'failed';
  } else if (statusLower === 'report_generated') {
    category = 'completed';
  } else {
    category = 'processing';
  }

  const categoryConfig = CATEGORY_CONFIG[category];
  const Icon = categoryConfig.icon;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 2xl:px-3 py-0.5 2xl:py-1 text-[10px] 2xl:text-xs rounded-md 2xl:rounded-[12px]'
      : 'px-3 py-1 rounded-[12px]';

  const badge = (
    <Badge
      className={cn(
        'uppercase font-medium cursor-default inline-flex items-center justify-center gap-1.5 w-36', // Fixed width 144px
        categoryConfig.badgeClass,
        sizeClasses
      )}
    >
      {category === 'processing' && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
      <span>{categoryConfig.label}</span>
      {category === 'processing' && processingStep && (
        <span className="opacity-80 ml-0.5">
          ({processingStep.current}/{processingStep.total})
        </span>
      )}
      {category === 'completed' && <CheckCircle2 className="w-3 h-3 shrink-0" />}
      {category === 'failed' && <AlertCircle className="w-3 h-3 shrink-0" />}
      {category === 'incomplete' && <VideoOff className="w-3 h-3 shrink-0" />}
    </Badge>
  );

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{badge}</HoverCardTrigger>
      <HoverCardContent
        className="w-56 2xl:w-64 p-0 overflow-hidden"
        side="top"
        align="center"
        sideOffset={6}
      >
        <div className="p-2.5 2xl:p-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center justify-center w-7 h-7 2xl:w-8 2xl:h-8 rounded-md',
                category === 'processing' && 'bg-blue-500/10',
                category === 'completed' && 'bg-emerald-500/10',
                category === 'failed' && 'bg-red-500/10',
                category === 'incomplete' && 'bg-amber-500/10'
              )}
            >
              <Icon
                className={cn(
                  'w-3.5 h-3.5 2xl:w-4 2xl:h-4',
                  categoryConfig.iconClass,
                  category === 'processing' && 'animate-spin'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] 2xl:text-sm font-medium text-foreground">
                {categoryConfig.label}
              </p>
              <p className="text-[11px] 2xl:text-xs text-muted-foreground font-mono truncate">
                {statusUpper}
              </p>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
