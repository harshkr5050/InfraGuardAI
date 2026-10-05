import { getPool } from '../lib/db.js';
import { ensureDatabase } from '../lib/seed.js';
import { fail, methodNotAllowed, setJson } from '../lib/helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    await ensureDatabase();
    await getPool().query('SELECT 1');
    setJson(res, 200, { ok: true, database: 'connected', service: 'InfraGuard AI API' });
  } catch (error) {
    fail(res, error, 'Database is not connected. Check DATABASE_URL.');
  }
}
