import { useState } from 'react';

import { CreditCard, Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { InvoiceStatusBadge } from '@/components/billing/InvoiceStatusBadge';
import { Button } from '@/components/ui/button';
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
import { useRazorpay } from '@/hooks/useRazorpay';
import { getInvoiceDownloadUrl, getInvoices } from '@/lib/api/billing';
import type { Invoice } from '@/lib/api/types';
import { formatBillingPeriod, formatCurrency, formatDateIndian } from '@/lib/utils';

export const InvoicesTable = () => {
  const { initiatePayment, isLoading: isPaymentLoading } = useRazorpay();
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  const {
    data: invoicesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getInvoices('all', 50),
    showErrorToast: true,
  });

  const invoices = invoicesData?.invoices || [];

  const handlePayNow = async (invoice: Invoice) => {
    setPayingInvoiceId(invoice.invoice_id);
    try {
      await initiatePayment(invoice.invoice_id, () => {
        refetch();
      });
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    setDownloadingInvoiceId(invoiceId);
    try {
      const downloadUrl = await getInvoiceDownloadUrl(invoiceId);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  if (error && !isLoading && invoices.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <div className="flex justify-center items-center mb-4 w-16 h-16 rounded-full bg-destructive/10">
          <FileText className="w-8 h-8 text-destructive" />
        </div>
        <p className="mb-4 text-center text-muted-foreground">Failed to load invoices</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="w-full rounded-lg h-13" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <div className="flex justify-center items-center mb-4 w-14 h-14 rounded-full bg-muted/50">
          <FileText className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-center text-muted-foreground">No invoices yet</p>
        <p className="mt-1 text-sm text-center text-muted-foreground">
          Invoices will appear here once tests are conducted
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="rounded-lg border border-border/60">
      <Table className="text-sm">
        <TableHeader className="sticky top-0 bg-muted/40">
          <TableRow className="border-b hover:bg-transparent border-border/60">
            <TableHead className="px-4 h-10 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Billing Period
            </TableHead>
            <TableHead className="px-4 h-10 text-xs font-semibold tracking-wide text-center uppercase text-muted-foreground">
              Tests
            </TableHead>
            <TableHead className="px-4 h-10 text-xs font-semibold tracking-wide text-right uppercase text-muted-foreground">
              Amount
            </TableHead>
            <TableHead className="px-4 h-10 text-xs font-semibold tracking-wide text-center uppercase text-muted-foreground">
              Due Date
            </TableHead>
            <TableHead className="px-4 h-10 text-xs font-semibold tracking-wide text-center uppercase text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="px-4 h-10 text-xs font-semibold tracking-wide text-center uppercase text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map(invoice => (
            <TableRow key={invoice.invoice_id} className="border-b border-border/30 last:border-0">
              <TableCell className="px-4 py-3">
                <span className="font-medium">{formatBillingPeriod(invoice.month)}</span>
              </TableCell>
              <TableCell className="px-4 py-3 text-center">
                <span className="font-medium">{invoice.num_tests_billed}</span>
              </TableCell>
              <TableCell className="px-4 py-3 text-right">
                <span className="font-semibold">{formatCurrency(invoice.total_amount)}</span>
              </TableCell>
              <TableCell className="px-4 py-3 text-center text-muted-foreground">
                {formatDateIndian(invoice.due_date)}
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex justify-center">
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadInvoice(invoice.invoice_id)}
                    disabled={downloadingInvoiceId === invoice.invoice_id}
                    className="h-8 gap-1.5"
                  >
                    {downloadingInvoiceId === invoice.invoice_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Invoice
                  </Button>
                  {(invoice.status === 'PENDING' || invoice.status === 'OVERDUE') && (
                    <Button
                      size="sm"
                      onClick={() => handlePayNow(invoice)}
                      disabled={isPaymentLoading && payingInvoiceId === invoice.invoice_id}
                      className="h-8 gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      {isPaymentLoading && payingInvoiceId === invoice.invoice_id
                        ? 'Processing...'
                        : 'Pay Now'}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
