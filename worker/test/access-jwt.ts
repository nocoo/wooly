import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { TEST_AUD } from './env.js';

const ISSUER = 'https://nocoo.cloudflareaccess.com';

export async function createAccessJwtKit() {
  const pair = await generateKeyPair('RS256');
  const publicJwk = await exportJWK(pair.publicKey);

  async function token(
    payload: Record<string, unknown> = {},
    issuer = ISSUER,
    audience = TEST_AUD,
  ): Promise<string> {
    return new SignJWT({
      email: 'Reader@Example.com',
      name: 'Reader',
      ...payload,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'local-key' })
      .setSubject(typeof payload.sub === 'string' ? payload.sub : 'access-user')
      .setIssuedAt()
      .setExpirationTime('5m')
      .setIssuer(issuer)
      .setAudience(audience)
      .sign(pair.privateKey);
  }

  function jwksResponse(): Response {
    return Response.json({
      keys: [{ ...publicJwk, kid: 'local-key', use: 'sig', alg: 'RS256' }],
    });
  }

  return { token, jwksResponse, privateKey: pair.privateKey };
}
