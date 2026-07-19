import { useState } from 'react';

import { Gift } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@/hooks/useQuery';
import { getComplimentaryStatus } from '@/lib/api/screening';
import { cn, formatDateIndian } from '@/lib/utils';

export const ComplimentaryTestsIndicator = () => {
  const [open, setOpen] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ['complimentaryStatus'],
    queryFn: getComplimentaryStatus,
    showErrorToast: false,
  });

  // Don't render anything if there's no complimentary status or still loading
  if (isLoading) {
    return <Skeleton className="w-20 h-9 rounded-md" />;
  }

  if (!status) return null;

  const { free_tests_remaining, deadline, is_expired } = status;
  const isActive = !is_expired && free_tests_remaining > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            'gap-2 text-sm font-medium',
            isActive
              ? 'text-primary hover:text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Gift className="w-4 h-4" />
          <span>{free_tests_remaining}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <div className={cn('p-2 rounded-lg', isActive ? 'bg-primary/10' : 'bg-muted')}>
              <Gift
                className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-muted-foreground')}
              />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Complimentary Tests</h4>
              <p className="text-xs text-muted-foreground">Free screenings for your clinic</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {isActive ? (
              <>
                <p className="text-foreground">
                  You have{' '}
                  <span className="font-semibold text-primary">
                    {free_tests_remaining} complimentary{' '}
                    {free_tests_remaining === 1 ? 'test' : 'tests'}
                  </span>{' '}
                  remaining.
                </p>
                <p className="text-muted-foreground">
                  These are free screenings provided to help you experience our service at no cost.
                </p>
                {deadline && (
                  <p className="text-xs text-muted-foreground">
                    Valid until <span className="font-medium">{formatDateIndian(deadline)}</span>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-foreground">
                  {is_expired
                    ? 'Your complimentary test period has ended.'
                    : 'All complimentary tests have been used.'}
                </p>
                <p className="text-muted-foreground">
                  Tests will now be billed according to your plan.
                </p>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
