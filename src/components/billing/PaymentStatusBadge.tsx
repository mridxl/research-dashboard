import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { Payment } from '@/lib/api/types';

interface PaymentStatusBadgeProps {
  status: Payment['status'];
}

export const PaymentStatusBadge = ({ status }: PaymentStatusBadgeProps) => {
  const isSuccess = status === 'SUCCESS';

  return (
    <Badge
      className={`uppercase font-medium inline-flex items-center gap-1.5 px-2 py-0.5 ${
        isSuccess
          ? 'bg-emerald-500/90 hover:bg-emerald-500 text-white border-0'
          : 'bg-red-500/90 hover:bg-red-500 text-white border-0'
      }`}
    >
      {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {status}
    </Badge>
  );
};
