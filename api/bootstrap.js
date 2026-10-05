import { getPool } from '../lib/db.js';
import { ensureDatabase } from '../lib/seed.js';
import { fail, mapAsset, methodNotAllowed, setJson } from '../lib/helpers.js';
import { requireAuth } from '../lib/auth.js';

export async function getState() {
  await ensureDatabase();
  const pool = getPool();
  const [assetRows] = await pool.query(`SELECT asset_code,name,type,zone,location,condition_status,risk_score,impact_score,criticality_score,DATE_FORMAT(last_maintenance,'%Y-%m-%d') last_maintenance,predicted_issue,eta,recommended_action,estimated_cost,sensor_data FROM assets ORDER BY asset_code`);
  const [complaintRows] = await pool.query(`SELECT complaint_code,asset_code,severity,issue_type,description,DATE_FORMAT(complaint_date,'%Y-%m-%d') complaint_date,citizen_name,contact FROM complaints ORDER BY id DESC LIMIT 50`);
  const [taskRows] = await pool.query(`SELECT task_code,asset_code,status,team,DATE_FORMAT(scheduled_date,'%Y-%m-%d') scheduled_date,cost,action FROM maintenance_tasks ORDER BY id DESC`);
  const [historyRows] = await pool.query(`SELECT asset_code,DATE_FORMAT(completed_date,'%Y-%m-%d') completed_date,action,cost,risk_before,risk_after,estimated_savings FROM maintenance_history ORDER BY id DESC`);
  const [savingRows] = await pool.query('SELECT COALESCE(SUM(estimated_savings),0) AS saved FROM maintenance_history');

  return {
    assets: assetRows.map(mapAsset),
    complaints: complaintRows.map(c => ({ id:c.complaint_code, asset:c.asset_code, severity:c.severity, type:c.issue_type, description:c.description, date:c.complaint_date, name:c.citizen_name, contact:c.contact })),
    tasks: taskRows.map(t => ({ id:t.task_code, asset:t.asset_code, status:t.status, team:t.team, date:t.scheduled_date, cost:Number(t.cost), action:t.action })),
    history: historyRows.map(h => ({ asset:h.asset_code, date:h.completed_date, action:h.action, cost:Number(h.cost), before:Number(h.risk_before), after:Number(h.risk_after), savings:Number(h.estimated_savings) })),
    saved: Number(savingRows[0].saved || 0)
  };
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try { setJson(res, 200, await getState()); }
  catch (error) { fail(res, error, 'Could not load dashboard data.'); }
}
