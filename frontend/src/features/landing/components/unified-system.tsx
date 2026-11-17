import { AvenraIcon } from '@/components/brand/avenra-logo';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { UNIFIED } from '../content';
import { Frame, SectionHeading } from './frame';

function Rich({ parts }: { parts: { text: string; strong?: boolean }[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.strong ? (
          <strong key={i} className='text-foreground font-medium'>
            {p.text}
          </strong>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

function OrbitIcon({
  icon,
  className,
  tone
}: {
  icon: keyof typeof Icons;
  className: string;
  tone: string;
}) {
  const Icon = Icons[icon];
  return (
    <div
      className={cn(
        'bg-background absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm',
        className
      )}
    >
      <Icon className={cn('size-5', tone)} />
    </div>
  );
}

/** Channels a client can answer through, orbiting the request. */
function RequestOrbit() {
  return (
    <div className='relative h-[300px] overflow-hidden'>
      <svg
        viewBox='0 0 600 300'
        preserveAspectRatio='none'
        className='absolute inset-0 size-full'
        aria-hidden
      >
        {[330, 260, 190, 120].map((r) => (
          <ellipse
            key={r}
            cx='300'
            cy='330'
            rx={r * 1.25}
            ry={r}
            fill='none'
            className='stroke-border'
            strokeDasharray='3 5'
          />
        ))}
      </svg>
      <OrbitIcon icon='mail' tone='text-orange-400' className='top-[14%] left-[35%]' />
      <OrbitIcon icon='fileTypePdf' tone='text-pink-500' className='top-[14%] left-[68%]' />
      <OrbitIcon icon='spreadsheet' tone='text-emerald-500' className='top-[37%] left-[14%]' />
      <OrbitIcon icon='upload' tone='text-orange-500' className='top-[47%] left-[27%]' />
      <OrbitIcon icon='messages' tone='text-foreground' className='top-[33%] left-[86%]' />
      <OrbitIcon icon='brandGoogleDrive' tone='text-amber-500' className='top-[53%] left-[73%]' />
      <OrbitIcon icon='folder' tone='text-sky-400' className='top-[80%] left-[22%]' />
      <OrbitIcon icon='brandDropbox' tone='text-blue-500' className='top-[82%] left-[80%]' />
      <div className='bg-background absolute top-[51%] left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-lg border px-4 py-2.5 shadow-sm'>
        <span className='flex size-6 items-center justify-center rounded-md border'>
          <AvenraIcon size={16} />
        </span>
        <span className='text-sm font-medium'>Send Request</span>
      </div>
    </div>
  );
}

/** Events leaving Avenra through signed webhooks and S3 export. */
function EventFlow() {
  const webhookTargets = [
    'work.completed',
    'answer_received',
    'request.expired',
    'Your CRM',
    'Your ERP'
  ];
  const exportTargets = ['Manifests', 'Archive', 'Data lake'];
  const ys = [8, 21, 34, 47, 60];
  const ys2 = [76, 89, 102];
  return (
    <div className='relative h-[300px]'>
      <svg
        viewBox='0 0 600 300'
        preserveAspectRatio='none'
        className='absolute inset-0 size-full'
        aria-hidden
      >
        <path d='M60 140 C 100 140, 100 95, 140 95' fill='none' className='stroke-border' />
        <path d='M60 160 C 100 160, 100 225, 140 225' fill='none' className='stroke-border' />
        <path d='M200 95 L 260 90' fill='none' className='landing-flow stroke-emerald-500' />
        <path d='M200 225 L 255 238' fill='none' className='landing-flow stroke-pink-500' />
        {ys.map((y) => (
          <path
            key={y}
            d={`M 360 90 C 420 90, 430 ${y * 2.4 + 12}, 500 ${y * 2.4 + 12}`}
            fill='none'
            className='stroke-border'
          />
        ))}
        {ys2.map((y) => (
          <path
            key={y}
            d={`M 360 238 C 420 238, 430 ${y * 2.4 + 12}, 500 ${y * 2.4 + 12}`}
            fill='none'
            className='stroke-border'
          />
        ))}
      </svg>
      <div className='bg-background absolute top-[47%] left-[1%] w-[62px] -translate-y-1/2 rounded-md border p-2'>
        <div className='flex gap-0.5'>
          <span className='size-1 rounded-full bg-red-500' />
          <span className='size-1 rounded-full bg-amber-500' />
          <span className='size-1 rounded-full bg-emerald-500' />
          <span className='text-muted-foreground ml-0.5 font-mono text-[6px]'>events</span>
        </div>
        <div className='bg-muted mt-2 h-1 w-full rounded' />
        <div className='bg-muted mt-1 h-1 w-2/3 rounded' />
      </div>
      <span className='bg-background text-muted-foreground absolute top-[31.5%] left-[23%] -translate-y-1/2 rounded-md border px-2 py-0.5 font-mono text-[11px]'>
        ›_ sign
      </span>
      <span className='bg-background text-muted-foreground absolute top-[75%] left-[23%] -translate-y-1/2 rounded-md border px-2 py-0.5 font-mono text-[11px]'>
        ⊕ s3
      </span>
      <div className='bg-background absolute top-[30%] left-[43%] flex -translate-y-1/2 items-center gap-2 rounded-md border px-3 py-1.5 text-sm'>
        <Icons.webhook className='size-4' /> Webhooks
      </div>
      <div className='bg-background absolute top-[79%] left-[42%] flex -translate-y-1/2 items-center gap-2 rounded-md border px-3 py-1.5 text-sm'>
        <Icons.cloudUpload className='size-4' /> S3 Export
      </div>
      {[
        ...webhookTargets.map((t, i) => ({ t, y: ys[i] })),
        ...exportTargets.map((t, i) => ({ t, y: ys2[i] }))
      ].map(({ t, y }) => (
        <div
          key={t}
          className='bg-background absolute right-[1%] w-[100px] -translate-y-1/2 truncate rounded-md border px-2 py-1 text-xs'
          style={{ top: `${((y * 2.4 + 12) / 300) * 100}%` }}
        >
          {t}
        </div>
      ))}
    </div>
  );
}

function PipelineDiagram() {
  const node = 'bg-background flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm';
  return (
    <div className='relative mx-auto h-[240px] w-full max-w-[300px]'>
      <svg viewBox='0 0 300 240' className='absolute inset-0 size-full' aria-hidden>
        <path d='M40 40 V 70 H 170' fill='none' className='stroke-border' />
        <path d='M200 85 V 112 H 30 V 135' fill='none' className='stroke-border' />
        <path d='M160 112 V 135' fill='none' className='stroke-border' />
        <path d='M30 165 V 195' fill='none' className='stroke-border' />
      </svg>
      <div className={cn(node, 'absolute top-0 left-0')}>
        <span className='flex size-8 items-center justify-center rounded-md border'>
          <Icons.kanban className='size-4' />
        </span>
        <span className='leading-tight'>
          Work
          <span className='text-muted-foreground block text-[10px]'>engagement</span>
        </span>
      </div>
      <div className={cn(node, 'absolute top-[52px] left-[170px] bg-foreground text-background')}>
        <Icons.send className='size-3.5' /> Request
      </div>
      <div className={cn(node, 'absolute top-[130px] left-0')}>
        <span className='flex size-8 items-center justify-center rounded-md border'>
          <Icons.user className='size-4' />
        </span>
        <span className='leading-tight'>
          Client
          <span className='text-muted-foreground block text-[10px]'>secure link</span>
        </span>
      </div>
      <div className={cn(node, 'absolute top-[130px] left-[140px]')}>
        <span className='flex size-8 items-center justify-center rounded-md border'>
          <Icons.listCheck className='size-4' />
        </span>
        <span className='leading-tight'>
          Rules
          <span className='text-muted-foreground block text-[10px]'>verification</span>
        </span>
      </div>
      <div className={cn(node, 'absolute top-[195px] left-0')}>
        <span className='flex size-8 items-center justify-center rounded-md border border-dashed'>
          <Icons.fingerprint className='size-4' />
        </span>
        Evidence
      </div>
    </div>
  );
}

function CompletenessCurve() {
  return (
    <div className='relative mx-auto h-[240px] w-full max-w-[320px]'>
      <svg viewBox='0 0 320 240' className='absolute inset-0 size-full' aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={30 + i * 36}
            y1='20'
            x2={30 + i * 36}
            y2='220'
            className='stroke-border'
          />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={`h${i}`}
            x1='30'
            y1={20 + i * 40}
            x2='318'
            y2={20 + i * 40}
            className='stroke-border'
          />
        ))}
        {['Day 0', '7', '14', '21'].map((t, i) => (
          <text key={t} x={30 + i * 96} y='14' className='fill-muted-foreground' fontSize='9'>
            {t}
          </text>
        ))}
        <path
          d='M 60 210 C 140 200, 130 60, 160 45 S 230 22, 262 20'
          fill='none'
          className='stroke-foreground'
          strokeWidth='1.5'
        />
        <line x1='60' y1='210' x2='120' y2='210' className='stroke-foreground' />
        <circle cx='120' cy='210' r='3' className='fill-foreground' />
        <line x1='170' y1='20' x2='262' y2='20' className='stroke-foreground' />
        <circle cx='170' cy='20' r='3' className='fill-foreground' />
        <circle cx='262' cy='20' r='6' className='fill-foreground' />
        <text x='30' y='214' className='fill-foreground' fontSize='11' fontWeight='600'>
          0%
        </text>
        <text x='272' y='24' className='fill-foreground' fontSize='11' fontWeight='600'>
          100%
        </text>
      </svg>
    </div>
  );
}

function TypingEditor() {
  return (
    <div className='bg-background/50 mr-[-1px] ml-auto h-[240px] w-full max-w-[400px] rounded-l-md border border-r-0'>
      <div className='flex gap-1 border-b px-3 py-2'>
        <span className='bg-foreground/70 size-1.5 rounded-full' />
        <span className='bg-foreground/70 size-1.5 rounded-full' />
        <span className='bg-foreground/70 size-1.5 rounded-full' />
      </div>
      <div className='space-y-2.5 px-10 py-6'>
        <div className='bg-muted h-0.5 w-5/6 rounded' />
        <div className='bg-muted h-0.5 w-2/5 rounded' />
        <div className='flex gap-2'>
          <div className='bg-muted h-0.5 w-10 rounded' />
          <div className='bg-muted h-0.5 w-10 rounded' />
        </div>
        <p className='flex items-center pt-4 font-mono text-[11px] text-emerald-500'>
          ✓ answer.accepted · sha256:5c5c…b33
        </p>
        <p className='flex items-center text-xl'>
          Every step on the record
          <span className='landing-caret bg-foreground ml-1 inline-block h-5 w-px' />
        </p>
        <div className='flex gap-2 pt-3'>
          <div className='bg-muted h-0.5 w-24 rounded' />
          <div className='bg-muted h-0.5 w-28 rounded' />
        </div>
        <div className='flex gap-2'>
          <div className='bg-muted h-0.5 w-14 rounded' />
          <div className='bg-muted h-0.5 w-20 rounded' />
        </div>
        <div className='flex gap-2'>
          <div className='bg-muted h-0.5 w-28 rounded' />
          <div className='bg-foreground/40 h-0.5 w-28 rounded' />
        </div>
      </div>
    </div>
  );
}

export function UnifiedSystem() {
  const [first, second, third] = UNIFIED.features;
  return (
    <Frame id='platform'>
      <div className='border-b px-6 py-12 md:px-10'>
        <SectionHeading title={UNIFIED.title} description={UNIFIED.description} />
      </div>
      <div className='grid border-b md:grid-cols-2'>
        <div className='border-b pt-11 md:border-r md:border-b-0'>
          <div className='space-y-3 px-6 md:px-8'>
            <h3 className='text-xl font-medium'>{UNIFIED.request.title}</h3>
            <p className='text-muted-foreground leading-relaxed'>{UNIFIED.request.description}</p>
          </div>
          <RequestOrbit />
        </div>
        <div className='pt-11'>
          <div className='space-y-3 px-6 md:px-8'>
            <h3 className='text-xl font-medium'>{UNIFIED.connect.title}</h3>
            <p className='text-muted-foreground leading-relaxed'>
              <Rich parts={UNIFIED.connect.description} />
            </p>
          </div>
          <div className='overflow-x-auto px-6 md:px-8'>
            <div className='min-w-[540px]'>
              <EventFlow />
            </div>
          </div>
        </div>
      </div>
      <div className='grid md:grid-cols-3'>
        {[
          { ...first, visual: <PipelineDiagram /> },
          { ...second, visual: <CompletenessCurve /> },
          { ...third, visual: <TypingEditor /> }
        ].map((feature, i) => (
          <div
            key={feature.title}
            className={cn('pt-11 pb-6', i < 2 && 'border-b md:border-r md:border-b-0')}
          >
            <div className='space-y-3 px-6 md:px-10'>
              <h3 className='text-xl font-medium'>{feature.title}</h3>
              <p className='text-muted-foreground leading-relaxed'>{feature.description}</p>
            </div>
            <div className={cn('mt-10', i === 2 ? 'pl-10' : 'px-6 md:px-10')}>{feature.visual}</div>
          </div>
        ))}
      </div>
    </Frame>
  );
}
