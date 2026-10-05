import crypto from 'node:crypto';
import { getPool } from '../../lib/db.js';
import { ensureDatabase } from '../../lib/seed.js';
import { fail, methodNotAllowed, setJson } from '../../lib/helpers.js';
import { createToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    await ensureDatabase();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) return setJson(res, 400, { error: 'Email and password are required.' });

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const [rows] = await getPool().query(
      'SELECT email, display_name, role FROM users WHERE email=? AND password_hash=? LIMIT 1',
      [email, hash]
    );
    if (!rows.length) return setJson(res, 401, { error: 'Invalid email or password.' });

    const user = { email: rows[0].email, name: rows[0].display_name, role: rows[0].role };
    setJson(res, 200, { ok: true, user, token: createToken(user) });
  } catch (error) {
    fail(res, error, 'Login service is unavailable.');
  }
}
