import { useState } from 'react';
import { useNavigate } from 'react-router';

import { Check, Minus, Pencil, Play, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { AssessmentSheet } from '@/components/dashboard/AssessmentSheet';
import { PendingUploadsCard } from '@/components/dashboard/PendingUploadsCard';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMutation } from '@/hooks/useMutation';
import { useQuery } from '@/hooks/useQuery';
import {
  deleteResearchSession,
  getResearchSession,
  getResearchSessions,
  type ResearchSessionSummary,
  type StimulusVersion,
} from '@/lib/api/research';
import { getPsychEvalOutcomeLabel } from '@/lib/assessments/outcomes';
import { formatDateShort } from '@/lib/utils';
import { useTestStore } from '@/stores/testStore';

/**
 * Badge labels for a session's ground truth. Prefers the multi-select outcome
 * codes and falls back to the superseded single-select field so sessions
 * labelled before the expanded set still show something.
 */
const sessionOutcomeLabels = (session: ResearchSessionSummary): string[] => {
  const codes = session.ground_truth?.outcome_codes;
  if (codes?.length) return codes.map(getPsychEvalOutcomeLabel);

  const legacy = session.ground_truth?.clinician_diagnosis;
  return legacy ? [getPsychEvalOutcomeLabel(legacy)] : [];
};

interface SessionRun {
  video_index: number;
  version: StimulusVersion;
  uploaded: boolean;
}

/** The session's planned runs, each flagged with whether its recording has landed. */
const sessionRuns = (session: ResearchSessionSummary): SessionRun[] =>
  (session.stimulus_versions ?? []).map((version, index) => ({
    video_index: index + 1,
    version,
    uploaded: session.uploaded_runs.some(run => run.video_index === index + 1),
  }));

/** A session that was created but abandoned before any recording was uploaded. */
const isPendingSession = (session: ResearchSessionSummary) => session.uploaded_runs.length === 0;

export const Dashboard = () => {
  const navigate = useNavigate();
  const resetTestData = useTestStore(s => s.resetTestData);
  const setTestData = useTestStore(s => s.setTestData);
  const [groundTruthSession, setGroundTruthSession] = useState<ResearchSessionSummary | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<ResearchSessionSummary | null>(null);
  const [resumingId, setResumingId] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['researchSessions'],
    queryFn: getResearchSessions,
    showErrorToast: false,
    // Always refetch when landing here — a session may have completed, been
    // resumed, or had a recording recovered since this list was last fetched.
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => deleteResearchSession(sessionId),
    showSuccessToast: true,
    successMessage: 'Session deleted',
    invalidateQueries: ['researchSessions'],
    onSettled: () => setSessionToDelete(null),
  });

  const handleTakeTest = () => {
    navigate('/test/fillup');
  };

  /**
   * Rehydrate the test flow from an existing session and re-enter past fill-up,
   * capturing only the runs that are still missing. Full capture metadata is
   * fetched on demand so the dashboard list can stay lean.
   */
  const handleResume = async (session: ResearchSessionSummary, onlyIndex?: number) => {
    setResumingId(session.session_id);
    try {
      const detail = await getResearchSession(session.session_id);
      const { patient_info: patientInfo, metadata } = detail;

      if (!patientInfo?.name || !patientInfo.dob || !patientInfo.gender || !metadata) {
        toast.error('This session is missing intake data and cannot be resumed');
        return;
      }

      const runs = sessionRuns(detail);
      const queue = runs
        .filter(run => !run.uploaded && (onlyIndex === undefined || run.video_index === onlyIndex))
        .map(run => run.video_index);

      if (queue.length === 0) {
        toast.info('All videos for this session are already recorded');
        return;
      }

      resetTestData();
      setTestData({
        session_id: detail.session_id,
        patient_info: {
          name: patientInfo.name,
          dob: patientInfo.dob,
          gender: patientInfo.gender as 'male' | 'female' | 'other',
          guardian_phone: patientInfo.guardian_phone ?? '',
        },
        metadata,
        data_usage_consent: detail.data_usage_consent ?? true,
        stimulus_versions: detail.stimulus_versions ?? ['2'],
        video_count: detail.stimulus_versions?.length ?? 1,
        run_queue: queue,
        current_video_index: queue[0],
        questionnaire_completed: detail.has_questionnaire,
        uploaded_test_ids: [],
      });
      navigate('/test/instructions');
    } catch (error) {
      console.error('[Dashboard] Failed to resume session', error);
      toast.error(error instanceof Error ? error.message : 'Could not open this session');
    } finally {
      setResumingId(null);
    }
  };

  return (
    <>
      <title>Aignosis Research | Dashboard</title>
      <div className="flex flex-col space-y-8 grow">
        <PendingUploadsCard />
        <Card className="bg-linear-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6 py-3">
            <div className="flex gap-6 justify-between items-center">
              <div>
                <h2 className="mb-1 text-lg font-semibold text-foreground">
                  Start a research screening session
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose which stimulus videos to capture (a full run each), then complete one
                  questionnaire
                </p>
              </div>
              <Button onClick={handleTakeTest} size="lg" className="gap-2 shrink-0">
                <Play className="w-5 h-5 fill-current" />
                Start Session
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 gap-3.5">
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Research capture sessions for this account</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-11" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col justify-center items-center py-12 h-full">
                <p className="mb-1 text-base font-medium text-muted-foreground">No sessions yet</p>
                <p className="mb-6 text-sm text-muted-foreground/70">
                  Start your first research session to see it here
                </p>
                <Button onClick={handleTakeTest} className="gap-2">
                  <Play className="w-4 h-4" />
                  Start Session
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50 bg-muted/80">
                      <TableHead>Participant</TableHead>
                      <TableHead>Videos recorded</TableHead>
                      <TableHead>Questionnaire</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Ground Truth</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map(session => {
                      const runs = sessionRuns(session);
                      const missingRuns = runs.filter(run => !run.uploaded);
                      const isResuming = resumingId === session.session_id;

                      return (
                        <TableRow key={session.session_id}>
                          <TableCell className="font-medium capitalize">
                            {session.patient_info?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {runs.length === 0 ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                runs.map(run => (
                                  <Badge
                                    key={run.video_index}
                                    variant={run.uploaded ? 'secondary' : 'outline'}
                                    className={
                                      run.uploaded
                                        ? 'gap-1'
                                        : 'gap-1 text-muted-foreground border-dashed'
                                    }
                                  >
                                    {run.uploaded ? (
                                      <Check className="size-3" />
                                    ) : (
                                      <Minus className="size-3" />
                                    )}
                                    Video {run.version}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {session.has_questionnaire ? (
                              <Badge variant="secondary" className="gap-1">
                                <Check className="size-3" />
                                Recorded
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Not filled</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateShort(session.patient_info?.dob)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {sessionOutcomeLabels(session).length > 0 ? (
                                sessionOutcomeLabels(session).map(label => (
                                  <Badge key={label} variant="secondary">
                                    {label}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                              {(session.assessment_names?.length ?? 0) > 0 && (
                                <Badge variant="outline" className="font-normal">
                                  +{session.assessment_names?.length} assessment
                                  {session.assessment_names?.length === 1 ? '' : 's'}
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                aria-label="Edit ground truth and assessments"
                                onClick={() => setGroundTruthSession(session)}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 items-center">
                              {missingRuns.length > 0 &&
                                missingRuns.map(run => (
                                  <Button
                                    key={run.video_index}
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1.5 px-2 h-7"
                                    disabled={isResuming}
                                    onClick={() => void handleResume(session, run.video_index)}
                                  >
                                    <RotateCcw className="size-3.5" />
                                    Record video {run.version}
                                  </Button>
                                ))}

                              {isPendingSession(session) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-destructive hover:text-destructive"
                                  aria-label="Delete session"
                                  disabled={isResuming}
                                  onClick={() => setSessionToDelete(session)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              )}

                              {missingRuns.length === 0 && !isPendingSession(session) && (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog
          open={!!sessionToDelete}
          onOpenChange={open => {
            if (!open) setSessionToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this pending session?</AlertDialogTitle>
              <AlertDialogDescription>
                The session
                {sessionToDelete?.patient_info?.name ? (
                  <>
                    {' '}
                    for <span className="capitalize">{sessionToDelete.patient_info.name}</span>
                  </>
                ) : null}{' '}
                has no uploaded recordings and will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (sessionToDelete) deleteMutation.mutate(sessionToDelete.session_id);
                }}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {groundTruthSession && (
          <AssessmentSheet
            key={groundTruthSession.session_id}
            session={groundTruthSession}
            open={!!groundTruthSession}
            onOpenChange={open => {
              if (!open) setGroundTruthSession(null);
            }}
          />
        )}
      </div>
    </>
  );
};
