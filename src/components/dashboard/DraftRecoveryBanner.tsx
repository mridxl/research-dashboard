import { useCallback, useEffect, useState } from 'react';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  deleteDraftRun,
  deleteDraftRunsOlderThan,
  type DraftRunMeta,
  getDraftRunMetasForUid,
} from '@/lib/offline/db';
import { getUidFromToken } from '@/lib/offline/jwt';
import { useAuthStore } from '@/stores/authStore';

const STALE_MS = 30_000;
const TTL_MS = 24 * 60 * 60 * 1000;
const REFRESH_INTERVAL_MS = 30_000;

/**
 * Surfaces MediaRecorder chunk journals left behind by a crash/reload during a
 * recording. Discard-only, matching core/dashboard: a partial recording can't
 * be resumed safely, so the researcher discards it and re-records the run.
 */
export const DraftRecoveryBanner = () => {
  const token = useAuthStore(s => s.token);
  const uid = getUidFromToken(token, true);
  const [drafts, setDrafts] = useState<DraftRunMeta[]>([]);

  const refresh = useCallback(async () => {
    if (!uid) {
      setDrafts([]);
      return;
    }
    try {
      await deleteDraftRunsOlderThan(TTL_MS);
    } catch {
      // non-critical
    }
    const list = await getDraftRunMetasForUid(uid);
    setDrafts(list.filter(d => Date.now() - d.updatedAt > STALE_MS && d.chunkCount > 0));
  }, [uid]);

  useEffect(() => {
    const run = () => {
      void refresh().catch(() => {
        // non-critical
      });
    };

    run();
    const interval = window.setInterval(run, REFRESH_INTERVAL_MS);
    const onFocus = () => run();
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  if (drafts.length === 0) return null;

  const discard = async (id: string) => {
    await deleteDraftRun(id);
    toast.success('Incomplete recording discarded');
    void refresh();
  };

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="flex flex-col gap-3 py-3 px-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-md font-medium text-foreground">
              Incomplete recording{drafts.length > 1 ? 's' : ''} found
            </p>
            <p className="text-sm text-muted-foreground">
              A previous recording was interrupted. Discard it and re-record that run — partial
              recordings cannot be resumed safely.
            </p>
          </div>
        </div>
        <ul className="space-y-2 pl-12">
          {drafts.map(d => (
            <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {d.patientName || 'Unknown participant'} · {d.chunkCount} chunk
                {d.chunkCount === 1 ? '' : 's'} · {new Date(d.updatedAt).toLocaleString()}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => void discard(d.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Discard
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
