'use client';

import { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

type ExceptionItem = {
  id: string;
  workTitle: string;
  client: string;
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
  description: string;
  detectedRule: string;
  sourceDoc: string;
  createdAt: string;
  assignee?: string;
};

const initialExceptions: ExceptionItem[] = [
  {
    id: 'exc_001_withholding_discrepancy',
    workTitle: 'ENG-2026-001: FY2025 S-Corp Form 1120-S & K-1s',
    client: 'Apex Holdings Inc',
    type: 'INCONSISTENT_INFORMATION',
    severity: 'HIGH',
    status: 'OPEN',
    description: 'Box 12 deferral ($4,200) does not match Schedule C Line 31 deduction. Variance of $1,450 detected across attached schedules.',
    detectedRule: 'RULE-TAX-018: Withholding Ledger Parity',
    sourceDoc: 'Form-1040-2025.pdf (Page 2)',
    createdAt: '15 minutes ago',
    assignee: 'Unassigned'
  },
  {
    id: 'exc_002_customs_vat_mismatch',
    workTitle: 'ENG-2026-003: Q3 Cross-Border Reverse-Charge VAT Audit',
    client: 'Vanguard Logistics Ltd',
    type: 'HUMAN_REQUIRED',
    severity: 'HIGH',
    status: 'IN_PROGRESS',
    description: 'Customs MRN document declares €41,200 CIF value, while SAP general ledger reverse-charge entry reflects €38,900. Requires customs broker validation.',
    detectedRule: 'RULE-VAT-042: Cross-Border Tariff Cross-Check',
    sourceDoc: 'Customs_MRN_82910.pdf',
    createdAt: '1 hour ago',
    assignee: 'Sarah Jenkins, CPA'
  },
  {
    id: 'exc_003_rd_wage_unverified',
    workTitle: 'ENG-2026-007: Section 41 R&D Tax Credit Substantiation',
    client: 'Quantum Robotics Corp',
    type: 'INCONSISTENT_INFORMATION',
    severity: 'MEDIUM',
    status: 'OPEN',
    description: 'Contractor engineer hours lack contemporaneous task logging required under Four-Part Test regulation.',
    detectedRule: 'RULE-RND-004: Direct Wage Contemporaneous Test',
    sourceDoc: 'Engineering_Timesheets_Q3.xlsx',
    createdAt: '3 hours ago',
    assignee: 'Unassigned'
  },
  {
    id: 'exc_004_signature_missing',
    workTitle: 'ENG-2026-008: Annual Statutory Financial Audit FY2025',
    client: 'Northwind Health Systems',
    type: 'REQUEST_EXPIRED_INCOMPLETE',
    severity: 'LOW',
    status: 'RESOLVED',
    description: 'Digital signature on Board of Directors representation letter was pending verification. Resubmitted with DocuSign certificate.',
    detectedRule: 'RULE-AUD-009: Representation Letter Authenticity',
    sourceDoc: 'Management_Rep_Letter_Signed.pdf',
    createdAt: 'Yesterday',
    assignee: 'David Chen, Partner'
  }
];

export default function IconsViewPage() {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>(initialExceptions);
  const [activeTab, setActiveTab] = useState<'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('all');
  const [search, setSearch] = useState('');

  const filteredExceptions = exceptions.filter((item) => {
    const matchesTab = activeTab === 'all' || item.status === activeTab;
    const matchesSearch =
      item.client.toLowerCase().includes(search.toLowerCase()) ||
      item.workTitle.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.detectedRule.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleAssignToMe = (id: string) => {
    setExceptions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'IN_PROGRESS', assignee: 'Me (Current Auditor)' } : item
      )
    );
    toast.success('Exception assigned to you for investigation.');
  };

  const handleResolve = (id: string) => {
    setExceptions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'RESOLVED' } : item))
    );
    toast.success('Exception marked as RESOLVED and audit trail logged.');
  };

  const handleSendLink = (client: string) => {
    toast.success(`Client clarification link dispatched to ${client}.`);
  };

  return (
    <PageContainer
      pageTitle='Exception Queue'
      pageDescription='Autonomous exception triage: review discrepancies, inspect failed deterministic rules, and sign off with human review.'
    >
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value='all'>All ({exceptions.length})</TabsTrigger>
              <TabsTrigger value='OPEN'>
                Open ({exceptions.filter((e) => e.status === 'OPEN').length})
              </TabsTrigger>
              <TabsTrigger value='IN_PROGRESS'>
                In Progress ({exceptions.filter((e) => e.status === 'IN_PROGRESS').length})
              </TabsTrigger>
              <TabsTrigger value='RESOLVED'>
                Resolved ({exceptions.filter((e) => e.status === 'RESOLVED').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Input
            placeholder='Search client, rule, or issue...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='max-w-xs'
          />
        </div>

        <div className='grid grid-cols-1 gap-4'>
          {filteredExceptions.length === 0 ? (
            <Card className='p-12 text-center text-muted-foreground'>
              <Icons.check className='size-12 mx-auto mb-3 text-emerald-500 opacity-80' />
              <p className='text-base font-semibold'>No exceptions in this view</p>
              <p className='text-sm text-muted-foreground'>
                All automated rule checks passed with 100% confidence.
              </p>
            </Card>
          ) : (
            filteredExceptions.map((item) => (
              <Card key={item.id} className='overflow-hidden border-l-4' style={{
                borderLeftColor: item.severity === 'HIGH' ? '#ef4444' : item.severity === 'MEDIUM' ? '#f59e0b' : '#3b82f6'
              }}>
                <CardHeader className='pb-3'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className={`font-mono text-xs ${
                          item.severity === 'HIGH'
                            ? 'text-red-600 border-red-500/30 bg-red-500/10'
                            : item.severity === 'MEDIUM'
                              ? 'text-amber-600 border-amber-500/30 bg-amber-500/10'
                              : 'text-blue-600 border-blue-500/30 bg-blue-500/10'
                        }`}
                      >
                        {item.severity} SEVERITY
                      </Badge>
                      <Badge variant='secondary' className='text-xs font-mono'>
                        {item.type}
                      </Badge>
                      <Badge
                        variant='outline'
                        className={`text-xs ${
                          item.status === 'RESOLVED'
                            ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
                            : item.status === 'IN_PROGRESS'
                              ? 'text-blue-500 border-blue-500/30 bg-blue-500/10'
                              : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <span className='text-xs text-muted-foreground tabular-nums'>{item.createdAt}</span>
                  </div>

                  <CardTitle className='text-base font-semibold mt-2'>
                    {item.client} — <span className='text-muted-foreground font-normal'>{item.workTitle}</span>
                  </CardTitle>
                  <CardDescription className='text-sm text-foreground/90 font-sans mt-1'>
                    {item.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className='pt-0'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg mb-4'>
                    <div>
                      <span className='font-semibold text-foreground'>Violated Rule:</span> {item.detectedRule}
                    </div>
                    <div>
                      <span className='font-semibold text-foreground'>Source Document:</span> {item.sourceDoc}
                    </div>
                    <div>
                      <span className='font-semibold text-foreground'>Assigned Reviewer:</span> {item.assignee || 'Unassigned'}
                    </div>
                  </div>

                  <div className='flex flex-wrap items-center justify-end gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleSendLink(item.client)}
                    >
                      <Icons.send className='mr-1.5 h-3.5 w-3.5' /> Ask Client
                    </Button>
                    {item.status !== 'RESOLVED' && item.assignee !== 'Me (Current Auditor)' && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleAssignToMe(item.id)}
                      >
                        <Icons.user className='mr-1.5 h-3.5 w-3.5' /> Assign to Me
                      </Button>
                    )}
                    {item.status !== 'RESOLVED' && (
                      <Button
                        size='sm'
                        className='bg-emerald-600 hover:bg-emerald-700 text-white'
                        onClick={() => handleResolve(item.id)}
                      >
                        <Icons.check className='mr-1.5 h-3.5 w-3.5' /> Resolve Exception
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
}
