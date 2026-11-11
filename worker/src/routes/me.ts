import { fetchAuthorProfile } from '../lib/author-profile.js';
import type { AccessUser, Env } from '../types.js';

export interface MePayload {
  email: string;
  name: string;
  avatar: string | null;
  authenticated: true;
}

export async function handleMe(user: AccessUser, _env: Env): Promise<Response> {
  const profile = await fetchAuthorProfile(user.email);
  const name = profile.name ?? user.name;
  return Response.json({
    email: user.email,
    name,
    avatar: profile.avatar,
    authenticated: true,
  } satisfies MePayload);
}
