import crypto from 'node:crypto';

const secret = process.env.APP_SECRET || 'infraguard-hackathon-change-this-secret';

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

export function createToken(user) {
  const payload = b64url(JSON.stringify({
    sub: user.email,
    role: user.role,
    name: user.name,
    exp: Date.now() + 12 * 60 * 60 * 1000
  }));
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function requireAuth(req, res) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please sign in again.' });
    return null;
  }
  return user;
}
