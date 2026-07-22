import { useCallback, useEffect, useRef, useState } from 'react';

import { CheckCircle2, Download, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getUidFromToken } from '@/lib/offline/jwt';
import {
  downloadOfflinePack,
  getOfflinePackStatus,
  type OfflineDownloadProgress,
} from '@/lib/offline/resourceCache';
import type { OfflinePackMeta } from '@/lib/offline/types';
import { useAuthStore } from '@/stores/authStore';

function formatReadySince(ts: number): string {
  try {
    const date = new Date(ts);
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    const time = date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    if (sameDay) return `Prepared today at ${time}`;
    return `Prepared ${date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })} at ${time}`;
  } catch {
    return '';
  }
}

function friendlyMissing(items: string[]): string {
  const map: Record<string, string> = {
    authentication: 'sign-in',
    'encryption key': 'security files',
    'face models': 'camera checks',
    'test instructions': 'test instructions',
    'test videos': 'stimulus videos',
  };
  return items.map(i => map[i] ?? i).join(', ');
}

function friendlyProgressLabel(progress: OfflineDownloadProgress): string {
  switch (progress.step) {
    case 'encryption':
      return 'Saving security files…';
    case 'faceModels':
      return 'Saving camera checks…';
    case 'testAssets':
      return 'Saving test instructions…';
    case 'stimulusVideos':
      return progress.label || 'Saving stimulus videos…';
    case 'done':
      return progress.percent >= 100 ? 'All set' : 'Finishing up…';
    default:
      return progress.label;
  }
}

export const OfflinePackCard = () => {
  const token = useAuthStore(s => s.token);
  const uid = getUidFromToken(token);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [meta, setMeta] = useState<OfflinePackMeta | null>(null);
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<OfflineDownloadProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const refreshStatus = useCallback(async () => {
    if (!uid) {
      if (!mountedRef.current) return;
      setMeta(null);
      setReady(false);
      setMissing(['authentication']);
      setIsLoadingStatus(false);
      return;
    }
    if (mountedRef.current) setIsLoadingStatus(true);
    try {
      const status = await getOfflinePackStatus(uid);
      if (!mountedRef.current) return;
      setMeta(status.meta);
      setReady(status.ready);
      setMissing(status.missing);
    } finally {
      if (mountedRef.current) setIsLoadingStatus(false);
    }
  }, [uid]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const startDownload = async () => {
    if (!uid) {
      toast.error('Please sign in first.');
      return;
    }
    if (!navigator.onLine) {
      toast.error('Connect to the internet to prepare this device.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsDownloading(true);
    setProgress({ step: 'encryption', label: 'Starting…', percent: 2 });

    try {
      const result = await downloadOfflinePack(uid, {
        signal: controller.signal,
        onProgress: p => {
          if (controller.signal.aborted) return;
          if (!mountedRef.current) return;
          setProgress(p);
        },
      });

      if (controller.signal.aborted) return;

      if (mountedRef.current) {
        setMeta(result.meta);
        setReady(result.ok);
        setMissing(result.ok ? [] : result.errors);
      }

      if (mountedRef.current) {
        if (result.ok) {
          toast.success('This device is ready for tests in low internet.');
        } else {
          toast.error('Something didn’t finish downloading. Stay online and try again.');
        }
      }
      await refreshStatus();
    } catch (err) {
      if (!mountedRef.current) {
        // Download was aborted implicitly by unmount cleanup or failed silently
        // after navigation — nothing to surface to a UI that no longer exists.
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        if (abortRef.current === controller) {
          toast.info('Download stopped');
        }
      } else {
        toast.error(
          err instanceof Error ? err.message : 'Couldn’t prepare this device. Please try again.'
        );
      }
    } finally {
      if (abortRef.current === controller) {
        if (mountedRef.current) {
          setIsDownloading(false);
          setProgress(null);
        }
        abortRef.current = null;
      }
    }
  };

  if (!uid) return null;

  const readySince = meta?.downloadedAt ? formatReadySince(meta.downloadedAt) : '';

  return (
    <Card className={`py-0 ${ready ? 'border-emerald-500/20' : ''}`}>
      <CardContent className="flex flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-md ${
              ready ? 'bg-emerald-500/10' : 'bg-primary/10'
            }`}
          >
            {ready ? (
              <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-primary" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-foreground">
                {ready ? 'Ready for tests in low internet' : 'Prepare for tests in low internet'}
              </h3>
              {ready && (
                <Badge className="gap-1 border-transparent bg-emerald-500/15 px-1.5 py-0 text-[11px] font-normal text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Ready
                </Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {ready
                ? readySince ||
                  'Tests keep working if the connection drops; recordings upload when you’re back online.'
                : 'One-time download (all four stimulus videos) so tests keep working when the connection drops.'}
            </p>
          </div>

          {isDownloading ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" size="sm" disabled className="gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Preparing…
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => abortRef.current?.abort()}
              >
                Stop
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => void startDownload()}
              disabled={!isOnline || isLoadingStatus}
              variant={ready ? 'outline' : 'default'}
              className="shrink-0 gap-2"
            >
              {isLoadingStatus ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : ready ? (
                <RefreshCw className="h-3.5 w-3.5" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {ready ? 'Update' : 'Prepare this device'}
            </Button>
          )}
        </div>

        {isDownloading && progress && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-foreground">{friendlyProgressLabel(progress)}</span>
              <span className="tabular-nums text-muted-foreground">{progress.percent}%</span>
            </div>
            <Progress value={progress.percent} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {progress.detail ? `${progress.detail} — keep this tab open.` : 'Keep this tab open.'}{' '}
              Videos can take a few minutes on a slow connection.
            </p>
          </div>
        )}

        {!isOnline && !ready && !isDownloading && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            You’re offline right now. Connect to the internet once to prepare this device.
          </p>
        )}

        {!ready && !isDownloading && !isLoadingStatus && missing.length > 0 && isOnline && (
          <p className="text-xs text-muted-foreground">
            Still to download: {friendlyMissing(missing)}.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
