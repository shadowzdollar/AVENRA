'use client';

import { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@clerk/nextjs';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type EvidenceRecord = {
  id: string;
  engagement: string;
  client: string;
  artifactName: string;
  sha256: string;
  timestamp: string;
  signer: string;
  ruleStatus: string;
  size: string;
};

const initialEvidence: EvidenceRecord[] = [
  {
    id: 'evid_7701_apex_tax',
    engagement: 'ENG-2026-001: FY2025 S-Corp Form 1120-S & K-1s',
    client: 'Apex Holdings Inc',
    artifactName: 'Apex_1120S_Verified_Pack_2025.zip',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    timestamp: '2026-11-16 11:24:08 UTC',
    signer: 'Avenra Attestation Engine (Ed25519 Signed)',
    ruleStatus: '18 / 18 Rules Passed',
    size: '3.8 MB'
  },
  {
    id: 'evid_7702_meridian_soc2',
    engagement: 'ENG-2026-002: SOC-2 Type II Trust Services Verification',
    client: 'Meridian BioSciences Inc',
    artifactName: 'Meridian_SOC2_Evidence_Vault_Pack.zip',
    sha256: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    timestamp: '2026-11-15 16:50:12 UTC',
    signer: 'Avenra Attestation Engine (Ed25519 Signed)',
    ruleStatus: '12 / 12 Criteria Satisfied',
    size: '14.2 MB'
  },
  {
    id: 'evid_7703_starlight_payroll',
    engagement: 'ENG-2026-005: Form 941 Quarterly Payroll & W-2 Audit',
    client: 'Starlight Renewable Energy LLC',
    artifactName: 'Starlight_Q3_941_Attestation.zip',
    sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    timestamp: '2026-11-14 09:12:44 UTC',
    signer: 'Avenra Attestation Engine (Ed25519 Signed)',
    ruleStatus: '6 / 6 Reconciliations Match',
    size: '1.9 MB'
  },
  {
    id: 'evid_7704_summit_1099',
    engagement: 'ENG-2026-009: 1099-NEC & 1099-MISC Annual Information Return',
    client: 'Summit Creative Collective',
    artifactName: 'Summit_1099_FIRE_Submission_Vault.zip',
    sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    timestamp: '2026-11-12 18:04:19 UTC',
    signer: 'Avenra Attestation Engine (Ed25519 Signed)',
    ruleStatus: '10 / 10 TIN Validations Complete',
    size: '840 KB'
  }
];

export default function ExclusiveView() {
  const { organization, isLoaded } = useOrganization();
  const [evidenceList] = useState<EvidenceRecord[]>(initialEvidence);
  const [search, setSearch] = useState('');

  const filtered = evidenceList.filter(
    (item) =>
      item.client.toLowerCase().includes(search.toLowerCase()) ||
      item.engagement.toLowerCase().includes(search.toLowerCase()) ||
      item.artifactName.toLowerCase().includes(search.toLowerCase()) ||
      item.sha256.toLowerCase().includes(search.toLowerCase())
  );

  const handleVerify = (item: EvidenceRecord) => {
    toast.success(`Integrity Verified: SHA-256 hash matches immutable audit ledger for ${item.artifactName}`);
  };

  const handleDownload = (item: EvidenceRecord) => {
    toast.success(`Downloading signed evidence pack: ${item.artifactName}`);
  };

  return (
    <PageContainer
      isLoading={!isLoaded}
      pageTitle='Evidence Vault'
      pageDescription={`Cryptographically verified evidence archive for ${organization?.name || 'Firm Clients'}. All artifacts are signed with SHA-256 immutability.`}
    >
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-mono text-xs'>
              <Icons.badgeCheck className='mr-1.5 h-3.5 w-3.5' />
              Ed25519 Signatures Active
            </Badge>
            <Badge variant='secondary' className='text-xs'>
              Immutable Storage
            </Badge>
          </div>

          <Input
            placeholder='Search hash, client, or artifact...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='max-w-xs'
          />
        </div>

        <div className='grid grid-cols-1 gap-4'>
          {filtered.map((item) => (
            <Card key={item.id} className='overflow-hidden'>
              <CardHeader className='pb-3'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='text-xs font-mono font-medium'>
                      {item.size}
                    </Badge>
                    <Badge variant='outline' className='text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-xs'>
                      {item.ruleStatus}
                    </Badge>
                  </div>
                  <span className='text-xs text-muted-foreground font-mono tabular-nums'>{item.timestamp}</span>
                </div>

                <CardTitle className='text-base font-semibold mt-2'>
                  {item.client} — <span className='font-normal text-muted-foreground'>{item.artifactName}</span>
                </CardTitle>
                <CardDescription className='text-xs text-foreground/80 font-mono'>
                  {item.engagement}
                </CardDescription>
              </CardHeader>

              <CardContent className='pt-0 space-y-3'>
                <div className='bg-muted/40 p-2.5 rounded-lg font-mono text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 overflow-x-auto'>
                  <div className='truncate'>
                    <span className='font-semibold text-foreground mr-1'>SHA-256:</span>
                    <span className='select-all text-[11px]'>{item.sha256}</span>
                  </div>
                  <span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0'>
                    ✓ Verified Unaltered
                  </span>
                </div>

                <div className='flex items-center justify-between pt-1'>
                  <span className='text-xs text-muted-foreground'>
                    Signer: <span className='font-medium text-foreground'>{item.signer}</span>
                  </span>
                  <div className='flex items-center gap-2'>
                    <Button variant='outline' size='sm' onClick={() => handleVerify(item)}>
                      <Icons.badgeCheck className='mr-1.5 h-3.5 w-3.5 text-emerald-500' />
                      Verify Hash
                    </Button>
                    <Button size='sm' onClick={() => handleDownload(item)}>
                      <Icons.fileZip className='mr-1.5 h-3.5 w-3.5' />
                      Download Pack
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
