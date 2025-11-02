'use client';

import { useMemo } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';

const MAX_VISIBLE_CAPTIONS = 4;

const CaptionsOverlay = () => {
  const { useCallClosedCaptions, useIsCallCaptioningInProgress } =
    useCallStateHooks();
  const captions = useCallClosedCaptions();
  const isCaptioning = useIsCallCaptioningInProgress();

  const visibleCaptions = useMemo(() => {
    if (!captions?.length) return [];
    return captions.slice(-MAX_VISIBLE_CAPTIONS);
  }, [captions]);

  if (!visibleCaptions.length && !isCaptioning) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[120px] md:bottom-[140px] mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 text-white">
      {visibleCaptions.map((caption) => {
        const speakerName =
          caption.user?.name ??
          caption.user?.id ??
          caption.speaker_id ??
          'Speaker';
        const key = `${caption.start_time}-${caption.end_time}-${caption.speaker_id}`;

        return (
          <div
            key={key}
            className="rounded-xl bg-black/70 px-4 py-2 shadow-lg backdrop-blur"
          >
            <p className="text-sm font-semibold text-emerald-200">
              {speakerName}
            </p>
            <p className="text-lg leading-snug">{caption.text}</p>
          </div>
        );
      })}

      {!isCaptioning && (
        <p className="text-center text-sm text-white/60">Captions inactive</p>
      )}
    </div>
  );
};

export default CaptionsOverlay;
