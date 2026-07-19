import { Calendar, Gift, Info } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@/hooks/useQuery';
import { getComplimentaryStatus } from '@/lib/api/screening';
import { formatDateIndian } from '@/lib/utils';

export const ComplimentaryStatusCard = () => {
  const { data: status, isLoading } = useQuery({
    queryKey: ['complimentaryStatus'],
    queryFn: getComplimentaryStatus,
    showErrorToast: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="w-full h-20" />
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const { free_tests_remaining, deadline, is_expired } = status;
  const isActive = !is_expired && free_tests_remaining > 0;

  if (!isActive) return null;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex">
          {/* Main content */}
          <div className="flex-1 p-4 py-2">
            <div className="flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Gift className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-2">
                <div>
                  <h3 className="font-medium text-foreground">Complimentary Tests</h3>
                  <p className="text-sm text-muted-foreground">
                    Free screenings to experience our service
                  </p>
                </div>
                <div className="flex gap-1.5 items-start text-sm text-muted-foreground">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <p>
                    Each test uses one credit. After credits expire or are used, tests are billed
                    per your plan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats sidebar */}
          <div className="flex gap-6 items-center px-6 border-l bg-muted/30">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{free_tests_remaining}</p>
              <p className="text-sm text-muted-foreground">remaining</p>
            </div>
            {deadline && (
              <div className="text-center">
                <div className="flex gap-1.5 justify-center items-center">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium text-foreground">{formatDateIndian(deadline)}</p>
                </div>
                <p className="text-sm text-muted-foreground">valid until</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
