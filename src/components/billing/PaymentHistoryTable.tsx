import { useState } from 'react';

import { Download, Loader2, Receipt } from 'lucide-react';
import { toast } from 'sonner';

import { PaymentStatusBadge } from '@/components/billing/PaymentStatusBadge';
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
import { getPayments, getReceiptDownloadUrl } from '@/lib/api/billing';
import { formatCurrency, formatDateIndian } from '@/lib/utils';

export const PaymentHistoryTable = () => {
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);

  const {
    data: paymentsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payments'],
    queryFn: () => getPayments('all', 50),
    showErrorToast: true,
  });

  const payments = paymentsData?.payments || [];

  const handleDownloadReceipt = async (paymentId: string) => {
    setDownloadingReceiptId(paymentId);
    try {
      const downloadUrl = await getReceiptDownloadUrl(paymentId);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to download receipt:', error);
      toast.error('Failed to download receipt', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  if (error && !isLoading && payments.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <div className="flex justify-center items-center mb-4 w-16 h-16 rounded-full bg-destructive/10">
          <Receipt className="w-8 h-8 text-destructive" />
        </div>
        <p className="mb-4 text-center text-muted-foreground">Failed to load payment history</p>
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

  if (payments.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <div className="flex justify-center items-center mb-4 w-14 h-14 rounded-full bg-muted/50">
          <Receipt className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-center text-muted-foreground">No payments yet</p>
        <p className="mt-1 text-sm text-center text-muted-foreground">
          Payment history will appear here after you make payments
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
              Payment ID
            </TableHead>
            <TableHead className="px-4 h-10 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Invoice
            </TableHead>
            <TableHead className="px-4 h-10 text-xs font-semibold tracking-wide text-right uppercase text-muted-foreground">
              Amount
            </TableHead>
            <TableHead className="px-4 h-10 text-xs font-semibold tracking-wide text-center uppercase text-muted-foreground">
              Date
            </TableHead>
            <TableHead className="px-4 h-10 text-xs font-semibold tracking-wide text-center uppercase text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="px-4 h-10 text-xs font-semibold tracking-wide text-center uppercase text-muted-foreground">
              Receipt
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map(payment => (
            <TableRow key={payment.payment_id} className="border-b border-border/30 last:border-0">
              <TableCell className="px-4 py-3">
                <code className="px-2 py-1 font-mono text-xs rounded border bg-primary/5 text-primary border-primary/10">
                  {payment.payment_id.slice(0, 16)}...
                </code>
              </TableCell>
              <TableCell className="px-4 py-3 text-muted-foreground">
                {payment.invoice_id}
              </TableCell>
              <TableCell className="px-4 py-3 text-right">
                <span className="font-semibold">{formatCurrency(payment.amount_paid)}</span>
              </TableCell>
              <TableCell className="px-4 py-3 text-center text-muted-foreground">
                {formatDateIndian(payment.paid_at)}
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex justify-center">
                  <PaymentStatusBadge status={payment.status} />
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReceipt(payment.payment_id)}
                    disabled={downloadingReceiptId === payment.payment_id}
                    className="h-8 gap-1.5"
                  >
                    {downloadingReceiptId === payment.payment_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Receipt
                  </Button>
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
