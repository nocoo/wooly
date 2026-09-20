import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import { SignJWT } from 'jose';
import { authenticate, localRequest, verifyAccess } from '../src/auth.js';
import { createAccessJwtKit } from './access-jwt.js';
import { makeEnv, stubDb, TEST_AUD } from './env.js';

const ISSUER = 'https://nocoo.cloudflareaccess.com';
let kit: Awaited<ReturnType<typeof createAccessJwtKit>>;
beforeAll(async () => { kit = await createAccessJwtKit(); });

function prodEnv() {
  return makeEnv({
    DB: stubDb(),
    ENVIRONMENT: 'production',
    LOCAL_USER_EMAIL: '',
    ALLOW_RESET: 'false',
  });
}

function accessRequest(jwt: string, url = 'https://wooly.hexly.ai/api/session') {
  return new Request(url, {
    headers: { 'cf-access-jwt-assertion': jwt },
  });
}

describe('localRequest', () => {
  const env = { ENVIRONMENT: 'local' as const };

  it('allows loopback hosts in local and test environments', () => {
    for (const host of ['127.0.0.1', 'localhost', '[::1]']) {
      expect(localRequest(new Request(`http://${host}/api/session`), env)).toBe(
        true,
      );
      expect(
        localRequest(new Request(`http://${host}/api/session`), {
          ENVIRONMENT: 'test',
        }),
      ).toBe(true);
    }
  });

  it('allows loopback peer on loopback and wooly.dev.hexly.ai', () => {
    expect(
      localRequest(
        new Request('http://127.0.0.1', {
          headers: { 'cf-connecting-ip': '127.0.0.1' },
        }),
        env,
      ),
    ).toBe(true);
    expect(
      localRequest(
        new Request('https://wooly.dev.hexly.ai', {
          headers: { 'cf-connecting-ip': '127.0.0.1' },
        }),
        env,
      ),
    ).toBe(true);
  });

  it('rejects production, untrusted hosts, and non-loopback peers', () => {
    expect(
      localRequest(new Request('http://127.0.0.1'), {
        ENVIRONMENT: 'production',
      }),
    ).toBe(false);
    expect(
      localRequest(new Request('https://wooly.hexly.ai'), env),
    ).toBe(false);
    expect(
      localRequest(
        new Request('http://127.0.0.1', {
          headers: { 'cf-connecting-ip': '203.0.113.5' },
        }),
        env,
      ),
    ).toBe(false);
    expect(
      localRequest(new Request('https://wooly.dev.hexly.ai'), env),
    ).toBe(false);
    expect(
      localRequest(
        new Request('https://wooly.dev.hexly.ai', {
          headers: { 'cf-connecting-ip': '203.0.113.1' },
        }),
        env,
      ),
    ).toBe(false);
    expect(
      localRequest(
        new Request('https://wooly.dev.hexly.ai', {
          headers: { 'cf-connecting-ip': '127.0.0.1' },
        }),
        { ENVIRONMENT: 'production' },
      ),
    ).toBe(false);
  });
});

describe('verifyAccess', () => {

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts RS256 tokens with trusted issuer, audience, expiry and identity', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => kit.jwksResponse()));
    const env = prodEnv();
    expect(await verifyAccess(accessRequest(await kit.token()), env)).toEqual({
      email: 'reader@example.com',
      name: 'Reader',
    });
    expect(
      await verifyAccess(accessRequest(await kit.token({ name: '' })), env),
    ).toEqual({ email: 'reader@example.com', name: 'reader' });
    expect(
      await verifyAccess(accessRequest(await kit.token({ name: 123 })), env),
    ).toEqual({ email: 'reader@example.com', name: 'reader' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects forged, expired, wrong-aud, wrong-issuer and invalid identity tokens', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => kit.jwksResponse()));
    const env = prodEnv();
    const expect401 = async (req: Request) => {
      const res = await verifyAccess(req, env);
      expect(res).toBeInstanceOf(Response);
      if (res instanceof Response) {
        expect(res.status).toBe(401);
      }
    };

    await expect401(
      accessRequest(
        await kit.token({}, 'https://wrong.cloudflareaccess.com'),
      ),
    );
    await expect401(accessRequest(await kit.token({}, ISSUER, 'wrong-app')));

    for (const payload of [{ email: 'bad' }, { email: 123 }, { email: null }]) {
      await expect401(accessRequest(await kit.token(payload)));
    }

    const signed = await kit.token();
    const pieces = signed.split('.');
    pieces[1] = btoa(
      JSON.stringify({
        email: 'evil@example.com',
        sub: 'evil',
        exp: Math.floor(Date.now() / 1000) + 100,
      }),
    );
    await expect401(accessRequest(pieces.join('.')));

    const expired = await new SignJWT({ email: 'reader@example.com' })
      .setProtectedHeader({ alg: 'RS256', kid: 'local-key' })
      .setSubject('access-user')
      .setIssuedAt(1)
      .setExpirationTime(2)
      .setIssuer(ISSUER)
      .setAudience(TEST_AUD)
      .sign(kit.privateKey);
    await expect401(accessRequest(expired));

    const noSubject = await new SignJWT({ email: 'reader@example.com' })
      .setProtectedHeader({ alg: 'RS256', kid: 'local-key' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .setIssuer(ISSUER)
      .setAudience(TEST_AUD)
      .sign(kit.privateKey);
    await expect401(accessRequest(noSubject));

    await expect401(accessRequest(await kit.token({ sub: '' })));
  });

  it('fails closed on missing token, missing config and broken JWKS', async () => {
    const env = prodEnv();
    const missing = await verifyAccess(
      new Request('https://wooly.hexly.ai/api/session'),
      env,
    );
    expect(missing).toBeInstanceOf(Response);
    if (missing instanceof Response) {
      expect(missing.status).toBe(401);
    }

    const unconfigured = await verifyAccess(accessRequest('token'), {
      ...env,
      CF_ACCESS_TEAM_DOMAIN: '',
      CF_ACCESS_AUD: '',
    });
    expect(unconfigured).toBeInstanceOf(Response);
    if (unconfigured instanceof Response) {
      expect(unconfigured.status).toBe(503);
    }

    const badTeam = await verifyAccess(accessRequest('token'), {
      ...env,
      CF_ACCESS_TEAM_DOMAIN: '../evil',
    });
    expect(badTeam).toBeInstanceOf(Response);
    if (badTeam instanceof Response) {
      expect(badTeam.status).toBe(503);
    }

    const noAud = await verifyAccess(accessRequest('token'), {
      ...env,
      CF_ACCESS_AUD: '',
    });
    expect(noAud).toBeInstanceOf(Response);
    if (noAud instanceof Response) {
      expect(noAud.status).toBe(503);
    }

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const offlineIssuer = 'https://offline.cloudflareaccess.com';
    const broken = await verifyAccess(accessRequest(await kit.token({}, offlineIssuer)), { ...env, CF_ACCESS_TEAM_DOMAIN: 'offline' });
    expect(broken).toBeInstanceOf(Response);
    if (broken instanceof Response) {
      expect(broken.status).toBe(401);
    }
  });
});

describe('authenticate', () => {

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses verified Access identity and ignores the email header', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => kit.jwksResponse()));
    const req = accessRequest(await kit.token());
    req.headers.set(
      'cf-access-authenticated-user-email',
      'attacker@example.com',
    );
    expect(await authenticate(req, prodEnv())).toEqual({
      email: 'reader@example.com',
      name: 'Reader',
    });
  });

  it('uses local identity only on trusted non-production hosts', async () => {
    const env = makeEnv({ DB: stubDb(), LOCAL_USER_EMAIL: 'Dev@Wooly.local' });
    expect(
      await authenticate(new Request('http://127.0.0.1/api/session'), env),
    ).toEqual({ email: 'dev@wooly.local', name: 'dev' });

    const denied = await authenticate(
      new Request('https://wooly.hexly.ai/api/session'),
      env,
    );
    expect(denied).toBeInstanceOf(Response);
    if (denied instanceof Response) {
      expect(denied.status).toBe(401);
    }
  });

  it('fails closed without an explicit local identity', async () => {
    for (const email of ['', 'invalid']) {
      const result = await authenticate(new Request('http://127.0.0.1/api/session'), makeEnv({ DB: stubDb(), LOCAL_USER_EMAIL: email }));
      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) expect(result.status).toBe(503);
    }
  });

  it('rejects unsafe requests without an Origin', async () => {
    const result = await authenticate(new Request('http://127.0.0.1/api/data', { method: 'PUT' }), makeEnv({ DB: stubDb() }));
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) expect(result.status).toBe(403);
  });

  it('rejects cross-origin mutations', async () => {
    const env = makeEnv({ DB: stubDb() });
    const crossOrigin = await authenticate(
      new Request('http://127.0.0.1/api/data', {
        method: 'PUT',
        headers: { origin: 'https://evil.example.com' },
      }),
      env,
    );
    expect(crossOrigin).toBeInstanceOf(Response);
    if (crossOrigin instanceof Response) {
      expect(crossOrigin.status).toBe(403);
    }

    const crossSite = await authenticate(
      new Request('http://127.0.0.1/api/data', {
        method: 'POST',
        headers: { origin: 'http://127.0.0.1', 'sec-fetch-site': 'cross-site' },
      }),
      env,
    );
    expect(crossSite).toBeInstanceOf(Response);
    if (crossSite instanceof Response) {
      expect(crossSite.status).toBe(403);
    }

    const ok = await authenticate(
      new Request('http://127.0.0.1/api/data', {
        method: 'PUT',
        headers: { origin: 'http://127.0.0.1' },
      }),
      env,
    );
    expect(ok).toEqual({ email: 'test@example.test', name: 'test' });
  });
});
