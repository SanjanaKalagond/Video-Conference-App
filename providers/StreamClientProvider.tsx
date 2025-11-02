'use client';

import { ReactNode, useEffect, useState } from 'react';
import { StreamVideoClient, StreamVideo, StreamCall, Call } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';

import { tokenProvider } from '@/actions/stream.actions';
import Loader from '@/components/Loader';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

// Default avatar if user has no image
const DEFAULT_AVATAR = '/images/avatar3.png';

interface StreamProviderProps {
  children: ReactNode;
  callId?: string; // optional, for instant or scheduled calls
}

const StreamVideoProvider = ({ children, callId }: StreamProviderProps) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [call, setCall] = useState<Call>();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!API_KEY) throw new Error('Stream API key is missing');

    const displayName =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.username ||
      user.primaryEmailAddress?.emailAddress ||
      user.id;

    const client = new StreamVideoClient({
      apiKey: API_KEY,
      user: {
        id: user.id,
        name: displayName,
        image: user.imageUrl || DEFAULT_AVATAR, // fallback for PiP
      },
      tokenProvider,
    });

    setVideoClient(client);

    if (callId) {
      const newCall = client.call('default', callId);
      newCall.join({ create: true });
      setCall(newCall);
    }
  }, [user, isLoaded, callId]);

  if (!videoClient) return <Loader />;

  return (
    <StreamVideo client={videoClient}>
      {call ? <StreamCall call={call}>{children}</StreamCall> : children}
    </StreamVideo>
  );
};

export default StreamVideoProvider;
