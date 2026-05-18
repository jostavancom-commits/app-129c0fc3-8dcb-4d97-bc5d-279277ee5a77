export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  // Optional: validate state against a cookie/session (omitted for brevity)

  const clientId = env.CF_ACCESS_CLIENT_ID;
  const clientSecret = env.CF_ACCESS_CLIENT_SECRET;
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN;
  const jwtSecret = env.JWT_SECRET;

  if (!clientId || !clientSecret || !teamDomain || !jwtSecret) {
    return new Response('Server misconfiguration', { status: 500 });
  }

  const redirectUri = `${url.origin}/api/auth/callback`;

  // Exchange code for tokens
  const tokenResp = await fetch(
    `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/get_token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    }
  );

  if (!tokenResp.ok) {
    const errorText = await tokenResp.text();
    return new Response(`Token exchange failed: ${errorText}`, {
      status: 502,
    });
  }

  const tokenData = await tokenResp.json();
  const idToken = tokenData.id_token;
  if (!idToken) {
    return new Response('Missing id_token in token response', { status: 502 });
  }

  // Verify id_token using JWT_SECRET (HS256)
  let payload;
  try {
    // Assuming jsonwebtoken is available via bundler
    const jwt = await import('jsonwebtoken');
    payload = jwt.verify(idToken, jwtSecret);
  } catch (err) {
    return new Response(`JWT verification failed: ${err.message}`, {
      status: 401,
    });
  }

  const { email, name, sub } = payload;
  if (!email) {
    return new Response('User email not found in token', { status: 400 });
  }

  // Store or update user in D1
  const stmt = env.DB.prepare(
    `INSERT INTO users (id, email, name, created_at)
     VALUES (?1, ?2, ?3, DATETIME('now'))
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email,
       name = excluded.name`
  );
  try {
    await stmt.bind(sub, email, name || '').run();
  } catch (dbErr) {
    return new Response(`Database error: ${dbErr.message}`, { status: 500 });
  }

  // Create a session JWT for our own app
  const sessionPayload = { sub, email, name };
  const jwt = await import('jsonwebtoken');
  const sessionToken = jwt.sign(sessionPayload, jwtSecret, { expiresIn: '7d' });

  // Set HttpOnly cookie and redirect to home
  const response = Response.redirect('/', 302);
  response.headers.set(
    'Set-Cookie',
    `session=${sessionToken}; HttpOnly; Path=/; SameSite=Strict; MaxAge=604800`
  );

  return response;
};