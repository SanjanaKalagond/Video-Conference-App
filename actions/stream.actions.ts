'use server';

import { currentUser } from '@clerk/nextjs/server';
import { StreamClient } from '@stream-io/node-sdk';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;

const DEFAULT_AVATAR = '/images/avatar3.png';

export const tokenProvider = async () => {
  const user = await currentUser();

  if (!user) throw new Error('User is not authenticated');
  if (!STREAM_API_KEY) throw new Error('Stream API key secret is missing');
  if (!STREAM_API_SECRET) throw new Error('Stream API secret is missing');

  const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);

  const displayName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    user.id;

  await streamClient.upsertUsers([
    {
      id: user.id,
      name: displayName,
      image: user.imageUrl || DEFAULT_AVATAR,
    },
  ]);

  const expirationTime = Math.floor(Date.now() / 1000) + 3600;
  const issuedAt = Math.floor(Date.now() / 1000) - 60;

  const token = streamClient.createToken(user.id, expirationTime, issuedAt);

  return token;
};
