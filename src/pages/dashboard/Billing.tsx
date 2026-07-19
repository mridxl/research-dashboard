import { useSearchParams } from 'react-router';

import { FileText, Receipt } from 'lucide-react';

import { ComplimentaryStatusCard } from '@/components/billing/ComplimentaryStatusCard';
import { InvoicesTable } from '@/components/billing/InvoicesTable';
import { PaymentHistoryTable } from '@/components/billing/PaymentHistoryTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const VALID_TABS = ['invoices', 'payments'] as const;
type TabValue = (typeof VALID_TABS)[number];

export const Billing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabValue = VALID_TABS.includes(tabParam as TabValue)
    ? (tabParam as TabValue)
    : 'invoices';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <>
      <title>Aignosis | Billing</title>
      <div className="flex flex-col flex-1 gap-4">
        {/* Complimentary Tests Status */}
        <ComplimentaryStatusCard />

        <Card className="flex flex-col flex-1">
          <CardHeader className="shrink-0">
            <CardTitle className="text-lg 2xl:text-xl">Billing</CardTitle>
            <CardDescription className="mt-1 text-xs 2xl:text-sm">
              View invoices and payment history
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pt-0">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="flex flex-col flex-1"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="invoices" className="gap-1.5">
                  <FileText className="w-4 h-4" />
                  Invoices
                </TabsTrigger>
                <TabsTrigger value="payments" className="gap-1.5">
                  <Receipt className="w-4 h-4" />
                  Payment History
                </TabsTrigger>
              </TabsList>
              <TabsContent value="invoices" className="flex-1">
                <InvoicesTable />
              </TabsContent>
              <TabsContent value="payments" className="flex-1">
                <PaymentHistoryTable />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
