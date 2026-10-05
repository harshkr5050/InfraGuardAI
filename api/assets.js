import { getPool } from '../lib/db.js';
import { ensureDatabase } from '../lib/seed.js';
import { fail, mapAsset, methodNotAllowed, setJson } from '../lib/helpers.js';
import { requireAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  try {
    await ensureDatabase();
    const pool = getPool();
    if (req.method === 'GET') {
      const [rows] = await pool.query(`SELECT asset_code,name,type,zone,location,condition_status,risk_score,impact_score,criticality_score,DATE_FORMAT(last_maintenance,'%Y-%m-%d') last_maintenance,predicted_issue,eta,recommended_action,estimated_cost,sensor_data FROM assets ORDER BY risk_score DESC`);
      return setJson(res, 200, rows.map(mapAsset));
    }
    if (req.method === 'POST') {
      const n = Date.now().toString().slice(-5);
      const body = req.body || {};
      const code = body.id || `RD-${n}`;
      const sensorData = body.sensors || { TrafficLoad:58, Rainfall:31, CrackIndex:37, SurfaceTemp:42 };
      await pool.query(
        `INSERT INTO assets(asset_code,name,type,zone,location,condition_status,risk_score,impact_score,criticality_score,last_maintenance,predicted_issue,eta,recommended_action,estimated_cost,sensor_data)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [code, body.name || 'New Demo Road', body.type || 'Road', body.zone || 'Zone 4', body.location || 'Expansion Corridor', body.condition || 'Fair', Number(body.risk ?? 43), Number(body.impact ?? 66), Number(body.criticality ?? 64), body.last || '2026-07-11', body.issue || 'Surface deterioration', body.eta || '30–45 days', body.action || 'Routine inspection and patching', Number(body.cost ?? 85000), JSON.stringify(sensorData)]
      );
      return setJson(res, 201, { ok:true, id:code });
    }
    return methodNotAllowed(res, ['GET','POST']);
  } catch (error) { fail(res, error, 'Could not update assets.'); }
}
