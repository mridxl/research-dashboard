import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Inline copy shown below an assessment row when status has details (failure or incomplete recording). */
export function AssessmentInlineErrorBanner({
  message,
  variant = 'failure',
}: {
  message: string;
  variant?: 'failure' | 'incomplete';
}) {
  const isIncomplete = variant === 'incomplete';

  return (
    <div className="px-3 2xl:px-4 pb-2.5 2xl:pb-3">
      <div
        className={cn(
          'flex items-start gap-2 rounded-md border px-3 py-2 shadow-sm',
          isIncomplete
            ? 'border-amber-500/25 bg-amber-500/10 shadow-amber-950/10'
            : 'border-red-500/20 bg-red-500/10 shadow-red-950/10'
        )}
      >
        <AlertCircle
          className={cn(
            'w-3.5 h-3.5 2xl:w-4 2xl:h-4 shrink-0 mt-0.5',
            isIncomplete ? 'text-amber-400' : 'text-red-400'
          )}
        />
        <div className="min-w-0">
          <p
            className={cn(
              'mb-0.5 text-[10px] 2xl:text-xs font-semibold uppercase tracking-wide',
              isIncomplete ? 'text-amber-400' : 'text-red-400'
            )}
          >
            {isIncomplete ? 'Recording incomplete' : 'Failure reason'}
          </p>
          <p
            className={cn(
              'text-xs 2xl:text-sm leading-relaxed wrap-break-word',
              isIncomplete ? 'text-amber-100' : 'text-red-200'
            )}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
