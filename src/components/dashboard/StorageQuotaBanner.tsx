import { useEffect, useState } from 'react';

import { HardDrive, X } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { estimateOfflineStorageUsage } from '@/lib/offline/db';

const CHECK_INTERVAL_MS = 60_000;

/** Severity tiers, higher number = more severe. 0 means "not shown". */
function severityOf(percent: number | null): number {
  if (percent === null) return 0;
  if (percent >= 95) return 2;
  if (percent >= 80) return 1;
  return 0;
}

export const StorageQuotaBanner = () => {
  const [percent, setPercent] = useState<number | null>(null);
  const [dismissedSeverity, setDismissedSeverity] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      void estimateOfflineStorageUsage().then(est => {
        if (!cancelled) setPercent(est.percent);
      });
    };

    check();
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const severity = severityOf(percent);

  if (severity === 0) return null;
  if (dismissedSeverity !== null && severity <= dismissedSeverity) return null;

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex items-center gap-4 py-3 px-4">
        <div className="p-2 rounded-lg bg-destructive/10">
          <HardDrive className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1">
          <p className="text-md font-medium text-foreground">
            Device storage is running low ({percent}%)
          </p>
          <p className="text-sm text-muted-foreground">
            Sync pending uploads or free disk space so new recordings can be saved offline.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setDismissedSeverity(severity)}
        >
          <X className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  );
};
