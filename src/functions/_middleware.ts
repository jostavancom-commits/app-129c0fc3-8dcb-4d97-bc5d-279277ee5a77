import * as jwt from 'jsonwebtoken';

export const onRequest = [
  async function middleware(context, next) {
    const { request, env } = context;
    const pathname = new URL(request.url).pathname;

    // Define which routes are considered protected.
    // Adjust these prefixes as needed for your application.
    const isProtected =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/api/protected');

    if (!isProtected) {
      return await next();
    }

    // Extract token from Authorization header or cookie.
    let token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) {
      const cookie = request.headers.get('Cookie');
      if (cookie) {
        const match = cookie.match(/(?:^|;)\s*token=([^;]+)/);
        if (match) token = match[1];
      }
    }

    if (!token) {
      return new Response('Unauthorized: Missing token', { status: 401 });
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      // Expect payload to contain a user identifier (e.g., sub or userId).
      const userId = typeof payload === 'object' && payload?.sub
        ? payload.sub
        : typeof payload === 'object' && payload?.userId
          ? payload.userId
          : null;

      if (!userId) {
        throw new Error('Invalid token payload');
      }

      // Fetch user details from D1.
      const { results } = await env.DB
        .prepare('SELECT id, email, name FROM users WHERE id = ?')
        .bind(userId)
        .all();

      if (results.length === 0) {
        return new Response('Unauthorized: User not found', { status: 401 });
      }

      const user = results[0];
      // Attach user info to the context for downstream handlers.
      context.user = user;

      // Proceed to the next handler.
      return await next();
    } catch (err) {
      console.error('Middleware auth error:', err);
      return new Response('Unauthorized: Invalid token', { status: 401 });
    }
  }
];