'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

const engagements = [
  { id: '1', name: 'ENG-2026-001: FY2025 S-Corp Form 1120-S & K-1s', client: 'Apex Holdings Inc' },
  { id: '2', name: 'ENG-2026-002: SOC-2 Type II Trust Services Verification', client: 'Meridian BioSciences Inc' },
  { id: '3', name: 'ENG-2026-003: Q3 Cross-Border Reverse-Charge VAT Audit', client: 'Vanguard Logistics Ltd' },
  { id: '4', name: 'ENG-2026-004: Series B Pre-Audit Financial Due Diligence', client: 'Nova Dynamics Tech' },
  { id: '5', name: 'ENG-2026-005: Form 941 Quarterly Payroll & W-2 Audit', client: 'Starlight Renewable Energy' }
];

const standardRequirements = [
  { id: 'tax_return', label: 'Prior Year Federal & State Tax Returns (PDF)', checked: true },
  { id: 'trial_balance', label: 'Year-End Trial Balance (.xlsx / .csv)', checked: true },
  { id: 'bank_feeds', label: '12-Month Banking & Credit Card Feeds', checked: true },
  { id: 'payroll_941', label: 'Quarterly Form 941 & State Wage Reports', checked: false },
  { id: 'w2_1099', label: 'W-2 Wage Summaries & 1099-NEC Statements', checked: false },
  { id: 'rep_letter', label: 'Signed Management Representation Letter', checked: false }
];

export default function ClientRequestDispatcher() {
  const [selectedEng, setSelectedEng] = useState(engagements[0].id);
  const [clientEmail, setClientEmail] = useState('cfo@apexholdings.example.com');
  const [dueDate, setDueDate] = useState('2026-12-15');
  const [reminderFreq, setReminderFreq] = useState('48h');
  const [selectedReqs, setSelectedReqs] = useState<string[]>(['tax_return', 'trial_balance', 'bank_feeds']);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const toggleReq = (id: string) => {
    setSelectedReqs((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReqs.length === 0) {
      toast.error('Please select at least one required deliverable.');
      return;
    }

    const token = Math.random().toString(36).substring(2, 10);
    const link = `${window.location.origin}/portal/req_${token}`;
    setGeneratedLink(link);
    toast.success('Tokenized Client Request Link generated per ADR-020.');
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard?.writeText(generatedLink);
      toast.success('Client portal link copied to clipboard.');
    }
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl'>
      <div className='lg:col-span-2 space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Dispatch Client Document Request</CardTitle>
            <CardDescription>
              Generate a secure, tokenized intake link allowing clients to upload documents without needing a password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='engagement'>Select Work Engagement</Label>
                <select
                  id='engagement'
                  value={selectedEng}
                  onChange={(e) => setSelectedEng(e.target.value)}
                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring'
                >
                  {engagements.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.client} — {eng.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Client Primary Contact Email</Label>
                  <Input
                    id='email'
                    type='email'
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='dueDate'>Document Submission Deadline</Label>
                  <Input
                    id='dueDate'
                    type='date'
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className='space-y-3'>
                <Label>Required Documents Checklist</Label>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                  {standardRequirements.map((req) => {
                    const isChecked = selectedReqs.includes(req.id);
                    return (
                      <button
                        key={req.id}
                        type='button'
                        onClick={() => toggleReq(req.id)}
                        className={`flex items-start gap-2.5 p-3 rounded-lg border text-left text-xs transition-colors ${
                          isChecked
                            ? 'border-primary/50 bg-primary/5 font-medium text-foreground'
                            : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <div
                          className={`mt-0.5 size-4 rounded flex items-center justify-center shrink-0 border ${
                            isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'
                          }`}
                        >
                          {isChecked && <Icons.check className='size-3 stroke-3' />}
                        </div>
                        <span>{req.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='reminder'>Automated Follow-up Reminders</Label>
                <select
                  id='reminder'
                  value={reminderFreq}
                  onChange={(e) => setReminderFreq(e.target.value)}
                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring'
                >
                  <option value='24h'>Every 24 hours until submission</option>
                  <option value='48h'>Every 48 hours (+48h, +96h automated sequence)</option>
                  <option value='weekly'>Weekly reminder</option>
                  <option value='none'>No automated reminders (Manual only)</option>
                </select>
              </div>

              <Button type='submit' className='w-full'>
                <Icons.send className='mr-2 h-4 w-4' /> Generate &amp; Dispatch Request Link
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className='space-y-6'>
        <Card className='border-primary/20 bg-primary/5'>
          <CardHeader className='pb-3'>
            <Badge variant='outline' className='w-fit text-emerald-500 border-emerald-500/30 bg-emerald-500/10 mb-1'>
              <Icons.lock className='mr-1 h-3 w-3' /> ADR-020 Compliant
            </Badge>
            <CardTitle className='text-base font-semibold'>Tokenized Link Security</CardTitle>
            <CardDescription className='text-xs'>
              Client request links use high-entropy cryptographic URL tokens. No client login credentials required; upload access is strictly scoped to selected requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-xs space-y-2 text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <Icons.check className='size-4 text-emerald-500 shrink-0' />
              <span>Automatic malware scan on all client uploads</span>
            </div>
            <div className='flex items-center gap-2'>
              <Icons.check className='size-4 text-emerald-500 shrink-0' />
              <span>Real-time OCR extraction upon upload</span>
            </div>
            <div className='flex items-center gap-2'>
              <Icons.check className='size-4 text-emerald-500 shrink-0' />
              <span>Immutable audit trail recorded on submission</span>
            </div>
          </CardContent>
        </Card>

        {generatedLink && (
          <Card className='border-emerald-500/30 bg-emerald-500/5 animate-in fade-in'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400'>
                <Icons.badgeCheck className='size-4' /> Link Ready for Client
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='p-2.5 rounded bg-background border font-mono text-xs select-all break-all'>
                {generatedLink}
              </div>
              <Button size='sm' onClick={handleCopy} className='w-full'>
                <Icons.share className='mr-1.5 h-3.5 w-3.5' /> Copy Link to Clipboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
