import { useEffect, useRef, useState } from 'react';

import { AlertTriangle, CloudUpload, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { usePendingUploads } from '@/hooks/usePendingUploads';
import { queryClient } from '@/lib/react-query/queryClient';
import {
  deletePendingUpload,
  formatBytes,
  type PendingUploadMeta,
} from '@/lib/uploads/pendingUploads';

/**
 * Shows recordings saved on this device that have not reached the server yet.
 * They upload automatically in the background; this surfaces progress and gives
 * the researcher the only way to discard one (nothing is ever auto-deleted).
 */
export const PendingUploadsCard = () => {
  const { rows, isFlushing, activeId, activeProgress, flushNow } = usePendingUploads();
  const [rowToDiscard, setRowToDiscard] = useState<PendingUploadMeta | null>(null);

  // A shrinking queue means a recording just landed — refresh the session list
  // so its run count and status reflect the recovered upload.
  const previousCountRef = useRef(rows.length);
  useEffect(() => {
    if (rows.length < previousCountRef.current) {
      void queryClient.invalidateQueries({ queryKey: ['researchSessions'] });
    }
    previousCountRef.current = rows.length;
  }, [rows.length]);

  if (rows.length === 0) return null;

  const totalBytes = rows.reduce((sum, row) => sum + row.size_bytes, 0);
  const stuckCount = rows.filter(row => row.attempts > 0).length;

  const handleDiscard = async (row: PendingUploadMeta) => {
    try {
      await deletePendingUpload(row.id);
      toast.success('Recording discarded');
    } catch (error) {
      console.error('[PendingUploads] Discard failed', error);
      toast.error('Could not discard the recording');
    } finally {
      setRowToDiscard(null);
    }
  };

  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 py-4">
          <div className="flex gap-4 items-start justify-between">
            <div className="flex gap-3 items-start min-w-0">
              <div className="flex justify-center items-center mt-0.5 w-9 h-9 rounded-lg shrink-0 bg-primary/10">
                {isFlushing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : stuckCount > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <CloudUpload className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">
                  {rows.length} recording{rows.length > 1 ? 's' : ''} waiting to upload
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(totalBytes)} saved on this device.{' '}
                  {isFlushing
                    ? 'Uploading now…'
                    : 'Uploads resume automatically — keep this tab open.'}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={flushNow}
              disabled={isFlushing}
            >
              <RefreshCw className={`w-4 h-4 ${isFlushing ? 'animate-spin' : ''}`} />
              {isFlushing ? 'Uploading' : 'Retry now'}
            </Button>
          </div>

          <ul className="mt-4 space-y-2">
            {rows.map(row => {
              const isActive = row.id === activeId;
              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-card/50"
                >
                  <div className="flex gap-3 items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        <span className="capitalize">{row.patient_name || 'Unnamed child'}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · Video {row.video_index} · {formatBytes(row.size_bytes)}
                        </span>
                      </p>
                      {isActive ? (
                        <p className="text-xs text-primary">
                          Uploading
                          {activeProgress?.percent != null
                            ? ` · ${activeProgress.percent}%`
                            : ` · ${activeProgress ? formatBytes(activeProgress.loadedMb * 1024 * 1024) : '0 KB'} sent`}
                        </p>
                      ) : row.last_error ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {row.last_error} · {row.attempts} attempt
                          {row.attempts > 1 ? 's' : ''}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Queued</p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-destructive hover:text-destructive"
                      aria-label="Discard recording"
                      disabled={isActive}
                      onClick={() => setRowToDiscard(row)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  {isActive && activeProgress?.percent != null && (
                    <Progress value={activeProgress.percent} className="h-1.5" />
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!rowToDiscard}
        onOpenChange={open => {
          if (!open) setRowToDiscard(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this recording?</AlertDialogTitle>
            <AlertDialogDescription>
              This recording has never reached the server and cannot be recovered once discarded.
              The child would have to be recorded again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rowToDiscard) void handleDiscard(rowToDiscard);
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
