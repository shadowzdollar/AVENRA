import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';

const verificationData = [
  {
    client: 'Apex Holdings Inc',
    document: 'Form 1120-S & Schedule K-1',
    fallback: 'AH',
    status: 'Rule Verified',
    statusVariant: 'outline' as const,
    colorClass: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
    time: '12m ago'
  },
  {
    client: 'Vanguard Logistics Ltd',
    document: 'Q3 Customs & Cross-Border VAT',
    fallback: 'VL',
    status: '100% Match',
    statusVariant: 'outline' as const,
    colorClass: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
    time: '34m ago'
  },
  {
    client: 'Meridian BioSciences',
    document: 'Form 941 Payroll Withholding',
    fallback: 'MB',
    status: 'Exception Flagged',
    statusVariant: 'outline' as const,
    colorClass: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    time: '1h ago'
  },
  {
    client: 'Starlight Renewable Energy',
    document: 'Banking Settlement & Feeds',
    fallback: 'SR',
    status: 'Auto-Extracted',
    statusVariant: 'outline' as const,
    colorClass: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
    time: '2h ago'
  },
  {
    client: 'Nova Dynamics Tech',
    document: 'Series B Capitalization Ledger',
    fallback: 'ND',
    status: 'Partner Approved',
    statusVariant: 'outline' as const,
    colorClass: 'text-purple-500 border-purple-500/30 bg-purple-500/10',
    time: '3h ago'
  }
];

export function RecentSales() {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Verifications</CardTitle>
        <CardDescription>148 documents verified in the last 24h.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {verificationData.map((item, index) => (
            <div key={index} className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-3 min-w-0'>
                <Avatar className='h-9 w-9 shrink-0 bg-primary/10 text-primary font-semibold text-xs'>
                  <AvatarFallback>{item.fallback}</AvatarFallback>
                </Avatar>
                <div className='space-y-0.5 truncate'>
                  <p className='text-sm font-medium leading-none truncate'>{item.client}</p>
                  <p className='text-xs text-muted-foreground truncate'>{item.document}</p>
                </div>
              </div>
              <div className='flex flex-col items-end gap-1 shrink-0'>
                <Badge variant={item.statusVariant} className={`text-[11px] font-mono ${item.colorClass}`}>
                  {item.status}
                </Badge>
                <span className='text-[10px] text-muted-foreground tabular-nums'>{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
