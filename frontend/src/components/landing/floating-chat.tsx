'use client';

import * as React from 'react';
import Image from 'next/image';

export function FloatingChat() {
  return (
    <div className='fixed bottom-6 right-6 z-50'>
      <button
        type='button'
        className='flex size-14 items-center justify-center rounded-full bg-black shadow-2xl border border-neutral-800 transition-all hover:scale-105 active:scale-95'
        aria-label='Chat with support'
      >
        <Image
          src='/chat-btn-crop.png'
          alt='Support Chat'
          width={54}
          height={54}
          className='rounded-full object-cover'
        />
      </button>
    </div>
  );
}
