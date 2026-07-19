import { AlertCircle, Gift } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@/hooks/useQuery';
import { getComplimentaryStatus } from '@/lib/api/screening';

const formatDeadline = (deadline: string | null): string => {
  if (!deadline) return '';
  try {
    const date = new Date(deadline);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

export const ComplimentaryBanner = () => {
  const { data: status, isLoading } = useQuery({
    queryKey: ['complimentaryStatus'],
    queryFn: getComplimentaryStatus,
    showErrorToast: false,
  });

  // Don't show anything while loading or if no status data
  if (isLoading || !status) return null;

  const { free_tests_remaining, deadline, is_expired } = status;

  // Show exhausted/expired banner
  if (is_expired || free_tests_remaining === 0) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-center gap-4 py-3 px-4">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {is_expired
                ? 'Your complimentary test period has ended'
                : 'All complimentary tests have been used'}
            </p>
            <p className="text-xs text-muted-foreground">
              Tests will now be billed according to your plan
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show active complimentary tests banner
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex items-center gap-4 py-3 px-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {free_tests_remaining} complimentary {free_tests_remaining === 1 ? 'test' : 'tests'}{' '}
            remaining
          </p>
          {deadline && (
            <p className="text-xs text-muted-foreground">Valid until {formatDeadline(deadline)}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
