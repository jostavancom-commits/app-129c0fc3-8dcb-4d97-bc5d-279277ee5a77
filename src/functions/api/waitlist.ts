import type { APIContext } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

/**
 * POST /api/waitlist
 * Handles waitlist email submission.
 * Optional JWT authentication via Authorization: Bearer <token>.
 */
export const onRequestPost = async ({ request, env }: APIContext<Env>) => {
  // ---- Optional JWT verification ----
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    try {
      // Dynamically import to avoid hard dependency if not used
      const { verify } = await import('jsonwebtoken');
      verify(token, env.JWT_SECRET);
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ---- Parse request body ----
  let payload: { email?: string };
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { email } = payload;
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'A valid email address is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ---- Store email in D1 ----
  try {
    const stmt = env.DB.prepare(
      'INSERT INTO waitlist (email, created_at) VALUES (?, datetime(\'now\'))'
    );
    const result = await stmt.bind(email).run();
    return new Response(
      JSON.stringify({
        success: true,
        id: result.meta.last_row_id,
        message: 'Email added to waitlist',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Waitlist DB error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};