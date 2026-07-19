import { useState } from 'react';
import { useNavigate } from 'react-router';

import { Pencil, Play } from 'lucide-react';

import { GroundTruthDialog } from '@/components/dashboard/GroundTruthDialog';
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
import { useQuery } from '@/hooks/useQuery';
import { getResearchSessions, type ResearchSessionSummary } from '@/lib/api/research';
import { formatDateShort } from '@/lib/utils';

const DIAGNOSIS_LABELS: Record<string, string> = {
  autistic: 'Autistic',
  not_autistic: 'Not autistic',
  uncertain: 'Uncertain',
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [groundTruthSession, setGroundTruthSession] = useState<ResearchSessionSummary | null>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['researchSessions'],
    queryFn: getResearchSessions,
    showErrorToast: false,
  });

  const handleTakeTest = () => {
    navigate('/test/fillup');
  };

  return (
    <>
      <title>Aignosis Research | Dashboard</title>
      <div className="flex flex-col space-y-8 grow">
        <Card className="bg-linear-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6 py-3">
            <div className="flex gap-6 justify-between items-center">
              <div>
                <h2 className="mb-1 text-lg font-semibold text-foreground">
                  Start a research screening session
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose one or two complete video capture runs, then complete one questionnaire
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
                      <TableHead>Status</TableHead>
                      <TableHead>Video Runs</TableHead>
                      <TableHead>Session ID</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Ground Truth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map(session => (
                      <TableRow key={session.session_id}>
                        <TableCell className="font-medium capitalize">
                          {session.patient_info?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>{session.status || '—'}</TableCell>
                        <TableCell>
                          {session.uploaded_test_ids?.length || 0} / {session.video_count || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {session.session_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateShort(session.patient_info?.dob)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {session.ground_truth?.clinician_diagnosis ? (
                              <Badge variant="secondary">
                                {DIAGNOSIS_LABELS[session.ground_truth.clinician_diagnosis] ??
                                  session.ground_truth.clinician_diagnosis}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label="Edit ground truth"
                              onClick={() => setGroundTruthSession(session)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {groundTruthSession && (
          <GroundTruthDialog
            sessionId={groundTruthSession.session_id}
            participantName={groundTruthSession.patient_info?.name}
            initial={groundTruthSession.ground_truth}
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
