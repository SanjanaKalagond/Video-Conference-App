'use client';

import { useState } from 'react';
import { ClosedCaption } from 'lucide-react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

import { cn } from '@/lib/utils';

const ClosedCaptionsToggle = () => {
  const call = useCall();
  const { useIsCallCaptioningInProgress } = useCallStateHooks();
  const isCaptioning = useIsCallCaptioningInProgress();
  const [isPending, setIsPending] = useState(false);
  const disabled = !call || isPending;

  const handleToggle = async () => {
    if (!call) return;
    setIsPending(true);
    try {
      if (isCaptioning) {
        await call.stopClosedCaptions();
      } else {
        await call.startClosedCaptions({ language: 'en' });
      }
    } catch (error) {
      console.error('Failed to toggle closed captions', error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        'cursor-pointer rounded-2xl px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        isCaptioning ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#19232d] hover:bg-[#4c535b]',
      )}
    >
      <div className="flex items-center gap-2 text-white">
        <ClosedCaption size={18} />
        <span className="text-sm font-medium">
          {isCaptioning ? 'Captions on' : 'Captions off'}
        </span>
      </div>
    </button>
  );
};

export default ClosedCaptionsToggle;
