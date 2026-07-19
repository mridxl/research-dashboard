import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { Invoice } from '@/lib/api/types';

const statusConfig = {
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-500/90 hover:bg-amber-500 text-white border-0',
    icon: Clock,
  },
  PAID: {
    label: 'Paid',
    className: 'bg-emerald-500/90 hover:bg-emerald-500 text-white border-0',
    icon: CheckCircle2,
  },
  OVERDUE: {
    label: 'Overdue',
    className: 'bg-red-500/90 hover:bg-red-500 text-white border-0',
    icon: AlertCircle,
  },
} as const;

interface InvoiceStatusBadgeProps {
  status: Invoice['status'];
}

export const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps) => {
  const { label, className, icon: Icon } = statusConfig[status];

  return (
    <Badge
      className={`${className} uppercase font-medium inline-flex items-center gap-1.5 px-2 py-0.5`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
};
