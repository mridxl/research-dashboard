import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { FileText, Gift, RotateCcw, Search } from 'lucide-react';

import { StatusBadge } from '@/components/common/StatusBadge';
import { AssessmentHistoryFilters } from '@/components/dashboard/AssessmentHistoryFilters';
import { AssessmentInlineErrorBanner } from '@/components/dashboard/AssessmentInlineErrorBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import { getClinicTests, getDoctors } from '@/lib/api/dashboard';
import { getTestAdmins } from '@/lib/api/testAdmin';
import type { Assessment } from '@/lib/api/types';
import {
  formatDate,
  formatDateShort,
  getAssessmentProblemKind,
  getProcessingStep,
  isFailedStatus,
  isIncompleteVideoStatus,
  showsAssessmentErrorBanner,
} from '@/lib/utils';
import { formatDateForApi } from '@/lib/utils/formatDate';
import { useNotificationStore } from '@/stores/notificationStore';

const PAGE_SIZE = 20;

export const AssessmentHistory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]); // Cursor Stack
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined); // Current cursor
  const [doctorId, setDoctorId] = useState('');
  const [testAdminId, setTestAdminId] = useState('');
  const highlightedTestIds = useNotificationStore(state => state.highlightedTestIds);

  // Only apply date filter when both from and to are set (avoids duplicate fetch when picking range)
  const dateFrom = dateRange.from && dateRange.to ? formatDateForApi(dateRange.from) : '';
  const dateTo = dateRange.from && dateRange.to ? formatDateForApi(dateRange.to) : '';

  const resetPagination = () => {
    setCurrentPage(1);
    setCursorHistory([]);
    setCurrentCursor(undefined);
  };

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    // Only reset pagination when the *applied* date filter (both from and to) actually changes
    const prevFromApplied = dateRange.from && dateRange.to ? formatDateForApi(dateRange.from) : '';
    const prevToApplied = dateRange.from && dateRange.to ? formatDateForApi(dateRange.to) : '';
    const nextFromApplied = range.from && range.to ? formatDateForApi(range.from) : '';
    const nextToApplied = range.from && range.to ? formatDateForApi(range.to) : '';

    setDateRange(range);

    if (prevFromApplied !== nextFromApplied || prevToApplied !== nextToApplied) {
      resetPagination();
    }
  };

  const handleDoctorIdChange = (id: string) => {
    setDoctorId(id);
    resetPagination();
  };

  const handleTestAdminIdChange = (id: string) => {
    setTestAdminId(id);
    resetPagination();
  };

  // Fetch assessments using React Query
  const {
    data: assessmentsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'assessments',
      PAGE_SIZE,
      currentCursor,
      dateFrom || null,
      dateTo || null,
      doctorId || null,
      testAdminId || null,
    ],
    queryFn: () =>
      getClinicTests(
        PAGE_SIZE,
        currentCursor,
        true,
        dateFrom || undefined,
        dateTo || undefined,
        doctorId || undefined,
        testAdminId || undefined
      ),
    showErrorToast: true,
  });

  const assessments = assessmentsData?.items || [];
  const nextCursor = assessmentsData?.next_cursor || null;
  const hasMore = assessmentsData?.has_more || false;
  const totalCount = assessmentsData?.total_count;

  const startItem = (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = startItem + assessments.length - 1;

  const { data: doctorsList = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    showErrorToast: false,
  });

  const doctorMap = useMemo(() => {
    const map = new Map<string, string>();
    doctorsList.forEach(doctor => {
      if (doctor.id) {
        map.set(doctor.id, doctor.name || '');
      }
    });
    return map;
  }, [doctorsList]);

  const { data: testAdminsList = [] } = useQuery({
    queryKey: ['testAdmins'],
    queryFn: getTestAdmins,
    showErrorToast: false,
  });

  const testAdminMap = useMemo(() => {
    const map = new Map<string, string>();
    testAdminsList.forEach(admin => {
      if (admin.id) {
        map.set(admin.id, admin.name || '');
      }
    });
    return map;
  }, [testAdminsList]);

  const handleRetest = (assessment: Assessment) => {
    navigate('/test/fillup', {
      state: {
        prefill: {
          patientName: assessment.patient_info?.name || '',
          dateOfBirth: assessment.patient_info?.dob || '',
          patientGender: assessment.patient_info?.gender || '',
          guardianPhone: assessment.patient_info?.guardian_phone || '',
          doctorId: assessment.doctor_id || '',
        },
      },
    });
  };

  const handleNextPage = () => {
    if (nextCursor && hasMore && !isLoading) {
      if (currentCursor !== undefined) {
        setCursorHistory(prev => [...prev, currentCursor]);
      }
      setCurrentPage(prev => prev + 1);
      setCurrentCursor(nextCursor);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && cursorHistory.length > 0) {
      const previousCursor = cursorHistory[cursorHistory.length - 1];
      setCursorHistory(prev => prev.slice(0, -1));
      setCurrentPage(prev => prev - 1);
      setCurrentCursor(previousCursor);
    } else if (currentPage > 1) {
      setCurrentPage(1);
      setCursorHistory([]);
      setCurrentCursor(undefined);
    }
  };

  const getDoctorName = (doctorId: string) => {
    return doctorMap.get(doctorId) || doctorId;
  };

  const getTestAdminName = (testAdminId?: string) => {
    if (!testAdminId) return null;
    return testAdminMap.get(testAdminId) || testAdminId;
  };

  const filteredAssessments = assessments.filter(assessment => {
    const searchLower = searchTerm.toLowerCase();
    const id = assessment.id || '';
    return (
      id.toLowerCase().includes(searchLower) ||
      assessment.status?.toLowerCase().includes(searchLower) ||
      assessment.doctor_id?.toLowerCase().includes(searchLower) ||
      (assessment.test_admin_id &&
        getTestAdminName(assessment.test_admin_id)?.toLowerCase().includes(searchLower))
    );
  });

  if (error && !isLoading && assessments.length === 0) {
    return (
      <Card className="flex flex-col flex-1">
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
          <CardDescription>View and manage your assessment records</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 justify-center items-center py-12">
          <div className="flex justify-center items-center mb-4 w-16 h-16 rounded-full bg-destructive/10">
            <FileText className="w-8 h-8 text-destructive" />
          </div>
          <p className="mb-4 text-center text-muted-foreground">Failed to load assessments</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <title>Aignosis | Assessment History</title>
      <Card className="flex flex-col flex-1">
        <CardHeader className="shrink-0">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="min-w-0">
              <CardTitle className="text-lg 2xl:text-xl">Assessments</CardTitle>
              <CardDescription className="mt-1 text-xs 2xl:text-sm">
                {totalCount !== undefined ? (
                  <>
                    Showing {startItem}-{endItem} of{' '}
                    <span className="font-medium">{totalCount}</span> record
                    {totalCount !== 1 ? 's' : ''}
                  </>
                ) : (
                  <>
                    {assessments.length} record{assessments.length !== 1 ? 's' : ''} • Page{' '}
                    {currentPage}
                    {hasMore && <span className="text-primary/70"> • More available</span>}
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <AssessmentHistoryFilters
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                doctorId={doctorId}
                onDoctorIdChange={handleDoctorIdChange}
                testAdminId={testAdminId}
                onTestAdminIdChange={handleTestAdminIdChange}
                doctorsList={doctorsList}
                testAdminsList={testAdminsList}
              />
              <div className="relative w-40 lg:w-56 2xl:w-72">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-7 h-8 text-xs transition-colors lg:pl-8 2xl:pl-9 2xl:h-10 lg:text-sm bg-muted/30 border-border/50 focus:bg-background"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 pt-0 min-h-0">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="w-full rounded-lg h-13"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          ) : assessments.length === 0 ? (
            <div className="flex flex-col flex-1 justify-center items-center py-16">
              <div className="flex justify-center items-center mb-4 w-14 h-14 rounded-full bg-muted/50">
                <FileText className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-center text-muted-foreground">
                {searchTerm
                  ? 'No assessments found matching your search'
                  : dateFrom || dateTo || doctorId || testAdminId
                    ? 'No assessments match the current filters. Try adjusting them.'
                    : 'No assessments yet'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col flex-1 gap-4 min-h-0">
              <ScrollArea className="flex-1 rounded-lg border border-border/60 min-h-[60vh] max-h-[65vh]">
                <Table className="text-xs 2xl:text-sm">
                  <TableHeader className="sticky top-0 bg-muted/40">
                    <TableRow className="border-b hover:bg-transparent border-border/60">
                      <TableHead className="min-w-20 2xl:min-w-[140px] font-semibold text-xs uppercase tracking-wide text-muted-foreground h-8 2xl:h-11 px-2 2xl:px-4 text-center">
                        Patient's Name
                      </TableHead>
                      <TableHead className="w-[80px] 2xl:w-[110px] font-semibold text-xs uppercase tracking-wide text-muted-foreground h-8 2xl:h-11 px-1.5 2xl:px-4 text-center">
                        Status
                      </TableHead>
                      <TableHead className="w-[90px] 2xl:w-[110px] font-semibold text-xs uppercase tracking-wide text-muted-foreground h-8 2xl:h-11 px-1.5 2xl:px-4 text-center">
                        Report
                      </TableHead>
                      <TableHead className="w-[70px] 2xl:w-[100px] font-semibold text-xs uppercase tracking-wide text-muted-foreground h-8 2xl:h-11 px-2 2xl:px-4 text-center">
                        ID
                      </TableHead>
                      <TableHead className="min-w-[70px] 2xl:min-w-[100px] font-semibold text-xs uppercase tracking-wide text-muted-foreground h-8 2xl:h-11 px-2 2xl:px-4 text-center">
                        DOB
                      </TableHead>
                      <TableHead className="min-w-[50px] 2xl:min-w-20 font-semibold text-xs uppercase tracking-wide text-muted-foreground h-8 2xl:h-11 px-1.5 2xl:px-4 text-center">
                        Gender
                      </TableHead>
                      <TableHead className="min-w-[90px] 2xl:min-w-[150px] font-semibold text-xs uppercase tracking-wide text-muted-foreground h-8 2xl:h-11 px-2 2xl:px-4 text-center">
                        Created At
                      </TableHead>
                      <TableHead className="min-w-[85px] 2xl:min-w-[120px] font-semibold text-xs uppercase tracking-wide text-muted-foreground h-8 2xl:h-11 px-2 2xl:px-4 text-center">
                        Phone
                      </TableHead>
                      <TableHead className="min-w-[70px] 2xl:min-w-[140px] font-semibold text-xs uppercase tracking-wide text-muted-foreground h-8 2xl:h-11 px-2 2xl:px-4 text-center">
                        Doctor
                      </TableHead>
                      <TableHead className="min-w-[70px] 2xl:min-w-[140px] font-semibold text-xs uppercase tracking-wide text-muted-foreground h-8 2xl:h-11 px-2 2xl:px-4 text-center">
                        Test Admin
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.map(assessment => {
                      const id = assessment.id || '';
                      const isHighlighted = highlightedTestIds.includes(id);
                      const problemKind = getAssessmentProblemKind(assessment.status || '');
                      const hasInlineError =
                        showsAssessmentErrorBanner(assessment.status || '') &&
                        Boolean(assessment.error_message?.trim());
                      return (
                        <Fragment key={id}>
                          <TableRow
                            className={`${
                              problemKind === 'incomplete'
                                ? 'border-b-0 bg-amber-500/[0.035] hover:bg-amber-500/[0.06] [&>td:first-child]:border-l-[3px] [&>td:first-child]:border-l-amber-500/70 [&>td]:pt-3'
                                : problemKind === 'failed'
                                  ? 'border-b-0 bg-red-500/[0.035] hover:bg-red-500/[0.06] [&>td:first-child]:border-l-[3px] [&>td:first-child]:border-l-red-500/70 [&>td]:pt-3'
                                  : 'border-b'
                            } group border-border/30 last:border-0 transition-colors duration-500 ${
                              isHighlighted ? 'animate-shimmer' : ''
                            }`}
                          >
                            <TableCell className="px-2 2xl:px-4 py-2 2xl:py-3.5 capitalize font-medium truncate max-w-[90px] 2xl:max-w-none text-center text-xs 2xl:text-sm">
                              <div className="flex items-center justify-center gap-1.5">
                                {assessment.patient_info?.name || (
                                  <span className="text-muted-foreground/60">—</span>
                                )}
                                {assessment.billing?.is_free_test && (
                                  <Gift className="w-3.5 h-3.5 text-primary shrink-0" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-1.5 2xl:px-4 py-2 2xl:py-3.5">
                              <div className="flex justify-center">
                                <StatusBadge
                                  status={assessment.status}
                                  size="sm"
                                  processingStep={getProcessingStep(assessment.status)}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="px-1.5 2xl:px-4 py-2 2xl:py-3.5">
                              <div className="flex justify-center">
                                {assessment.status === 'REPORT_GENERATED' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="h-7 2xl:h-8 w-[72px] 2xl:w-[88px] text-xs 2xl:text-sm gap-1 hover:bg-primary/10 hover:text-primary"
                                  >
                                    <a
                                      href={`https://storage.googleapis.com/ast-reports/${assessment.pid}/${id}.pdf`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="View PDF report"
                                    >
                                      <FileText className="w-3 h-3 2xl:w-3.5 2xl:h-3.5" />
                                      <span className="hidden 2xl:inline">Report</span>
                                    </a>
                                  </Button>
                                ) : isFailedStatus(assessment.status) ||
                                  isIncompleteVideoStatus(assessment.status) ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRetest(assessment)}
                                    className="h-7 2xl:h-8 w-[72px] 2xl:w-[88px] text-xs 2xl:text-sm gap-1 hover:bg-primary/10 hover:text-primary"
                                    title="Retry this assessment with the same patient data"
                                  >
                                    <RotateCcw className="w-3 h-3 2xl:w-3.5 2xl:h-3.5" />
                                    <span className="hidden 2xl:inline">Retest</span>
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell
                              className="px-2 2xl:px-4 py-2 2xl:py-3.5 flex justify-center items-center"
                              title={id}
                            >
                              <code className="text-xs 2xl:text-sm font-mono bg-primary/5 text-primary px-1 2xl:px-2 py-0.5 2xl:py-1 rounded border border-primary/10">
                                {id.slice(0, 8)}...
                              </code>
                            </TableCell>
                            <TableCell className="px-2 2xl:px-4 py-2 2xl:py-3.5 text-muted-foreground whitespace-nowrap text-center text-xs 2xl:text-sm">
                              {formatDateShort(assessment.patient_info?.dob)}
                            </TableCell>
                            <TableCell className="px-1.5 2xl:px-4 py-2 2xl:py-3.5 capitalize text-muted-foreground text-center text-xs 2xl:text-sm">
                              {assessment.patient_info?.gender || (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </TableCell>
                            <TableCell className="px-2 2xl:px-4 py-2 2xl:py-3.5 text-muted-foreground whitespace-nowrap text-xs 2xl:text-sm text-center">
                              {formatDate(assessment.timestamps.created_at)}
                            </TableCell>
                            <TableCell className="px-2 2xl:px-4 py-2 2xl:py-3.5 text-muted-foreground font-mono text-xs 2xl:text-sm whitespace-nowrap text-center">
                              {assessment.patient_info?.guardian_phone || (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </TableCell>
                            <TableCell className="px-2 2xl:px-4 py-2 2xl:py-3.5 text-muted-foreground truncate max-w-20 2xl:max-w-none text-center text-xs 2xl:text-sm">
                              {getDoctorName(assessment.doctor_id)}
                            </TableCell>
                            <TableCell className="px-2 2xl:px-4 py-2 2xl:py-3.5 text-muted-foreground truncate max-w-20 2xl:max-w-none text-center text-xs 2xl:text-sm">
                              {getTestAdminName(assessment.test_admin_id) || (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                          {hasInlineError && assessment.error_message && (
                            <TableRow
                              className={`border-b border-border/30 last:border-0 [&>td:first-child]:border-l-[3px] ${
                                problemKind === 'incomplete'
                                  ? 'bg-amber-500/[0.035] hover:bg-amber-500/[0.06] [&>td:first-child]:border-l-amber-500/70'
                                  : 'bg-red-500/[0.035] hover:bg-red-500/[0.06] [&>td:first-child]:border-l-red-500/70'
                              }`}
                            >
                              <TableCell colSpan={10} className="p-0">
                                <AssessmentInlineErrorBanner
                                  message={assessment.error_message}
                                  variant={problemKind === 'incomplete' ? 'incomplete' : 'failure'}
                                />
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              <div className="flex flex-wrap gap-2 justify-between items-center pt-2 shrink-0">
                <p className="text-[11px] 2xl:text-sm text-muted-foreground">
                  {searchTerm ? (
                    <>
                      Showing{' '}
                      <span className="font-medium text-foreground">
                        {filteredAssessments.length}
                      </span>{' '}
                      of <span className="font-medium text-foreground">{assessments.length}</span>{' '}
                      filtered records
                    </>
                  ) : totalCount !== undefined ? (
                    <>
                      Page <span className="font-medium text-foreground ml-0.5">{currentPage}</span>
                      {' • '}
                      <span className="font-medium text-foreground mr-0.5">{totalCount}</span> total
                      records
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{assessments.length}</span>{' '}
                      records on this page
                    </>
                  )}
                </p>
                <Pagination className="justify-end mx-0 w-auto">
                  <PaginationContent className="gap-1 2xl:gap-2">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={handlePreviousPage}
                        className={
                          currentPage === 1 || isLoading
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                        aria-disabled={currentPage === 1 || isLoading}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <div className="flex justify-center items-center px-2 h-9 text-xs font-medium rounded-md min-w-9 2xl:min-w-12 2xl:h-10 2xl:px-3 bg-muted/50 2xl:text-sm">
                        {currentPage}
                      </div>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={handleNextPage}
                        className={
                          !hasMore || isLoading
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                        aria-disabled={!hasMore || isLoading}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
