export function setJson(res, status, payload) {
  res.status(status).json(payload);
}

export function methodNotAllowed(res, methods) {
  res.setHeader('Allow', methods.join(', '));
  setJson(res, 405, { error: `Method not allowed. Use ${methods.join(', ')}.` });
}

export function fail(res, error, fallback = 'Server error') {
  console.error(error);
  const message = process.env.NODE_ENV === 'development' ? error.message : fallback;
  setJson(res, 500, { error: message });
}

export function clamp(value, min = 0, max = 99) {
  return Math.min(max, Math.max(min, Number(value)));
}

export function asObject(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

export function mapAsset(row) {
  return {
    id: row.asset_code,
    name: row.name,
    type: row.type,
    zone: row.zone,
    location: row.location,
    condition: row.condition_status,
    risk: Number(row.risk_score),
    impact: Number(row.impact_score),
    criticality: Number(row.criticality_score),
    last: row.last_maintenance,
    issue: row.predicted_issue,
    eta: row.eta,
    action: row.recommended_action,
    cost: Number(row.estimated_cost),
    sensors: asObject(row.sensor_data)
  };
}
