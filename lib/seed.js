import { getPool } from './db.js';

const assets = [
  ['DR-09','Central Drainage Line','Drainage','Zone 3','Riverside Ward','Poor',62,96,92,'2026-03-07','Severe drainage blockage','5–10 days','Schedule drain cleaning within 24–48 hours',45000,{WaterLevel:68,FlowRate:44,Rainfall:42,Blockage:62}],
  ['BR-08','River Link Bridge','Bridge','Zone 2','East Connector','Poor',87,98,99,'2026-01-22','Structural deterioration','7–14 days','Immediate engineering inspection',350000,{Vibration:8.6,Load:84,Temperature:38,Humidity:73}],
  ['RD-24','Market Main Road','Road','Zone 3','Central Market','Poor',79,84,80,'2026-02-18','Major pothole formation','7–15 days','Road resurfacing inspection within 72 hours',280000,{TrafficLoad:88,Rainfall:72,CrackIndex:71,SurfaceTemp:47}],
  ['WP-14','Water Pipeline 14','Water System','Zone 4','North Residential','Fair',72,88,90,'2026-04-12','Pipeline leakage','10–20 days','Pressure test and joint inspection',210000,{Pressure:62,LeakIndex:68,Flow:74,AgeScore:81}],
  ['SL-44','Streetlight 44','Streetlight','Zone 1','Station Road','Fair',58,42,45,'2026-06-15','Electrical failure','15–30 days','Replace driver and inspect wiring',18000,{Voltage:191,Hours:9814,Fluctuation:64,PowerUse:71}],
  ['PB-05','Municipal Building 05','Public Building','Zone 1','Civic Center','Good',31,72,75,'2026-07-02','HVAC wear','30–60 days','Preventive HVAC service',65000,{Temperature:26,Humidity:57,EnergyLoad:63,Structural:24}],
  ['RD-11','University Road','Road','Zone 2','Academic District','Good',28,62,65,'2026-08-05','Surface wear','45–90 days','Routine inspection',95000,{TrafficLoad:54,Rainfall:35,CrackIndex:22,SurfaceTemp:41}],
  ['DR-12','South Drainage Network','Drainage','Zone 4','South Ward','Fair',49,78,81,'2026-05-18','Partial blockage','20–40 days','Schedule preventive cleaning',32000,{WaterLevel:51,FlowRate:58,Rainfall:42,Blockage:47}],
  ['SL-19','Streetlight 19','Streetlight','Zone 2','Park Avenue','Good',22,36,40,'2026-08-21','Lamp aging','60–90 days','Routine replacement cycle',12000,{Voltage:224,Hours:6640,Fluctuation:20,PowerUse:48}]
];

const complaints = [
  ['CMP-1039','RD-24','High','Road Damage','Large pothole causing traffic slowdown','2026-10-05','Citizen','citizen@example.com'],
  ['CMP-1040','DR-09','High','Drainage Blockage','Waterlogging after rainfall','2026-10-05','Citizen','citizen@example.com'],
  ['CMP-1041','SL-44','Medium','Broken Streetlight','Light flickering at night','2026-10-04','Citizen','citizen@example.com']
];

const tasks = [
  ['M-201','BR-08','Assigned','Team A','2026-10-07',350000,'Engineering inspection'],
  ['M-202','RD-24','In Progress','Team C','2026-10-06',280000,'Road resurfacing inspection']
];

export async function createSchema(connection = getPool()) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (id BIGINT PRIMARY KEY AUTO_INCREMENT,email VARCHAR(190) NOT NULL UNIQUE,password_hash CHAR(64) NOT NULL,display_name VARCHAR(120) NOT NULL,role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS assets (id BIGINT PRIMARY KEY AUTO_INCREMENT,asset_code VARCHAR(40) NOT NULL UNIQUE,name VARCHAR(160) NOT NULL,type VARCHAR(80) NOT NULL,zone VARCHAR(80) NOT NULL,location VARCHAR(190) NOT NULL,condition_status VARCHAR(40) NOT NULL,risk_score INT NOT NULL,impact_score INT NOT NULL,criticality_score INT NOT NULL,last_maintenance DATE NULL,predicted_issue VARCHAR(255) NOT NULL,eta VARCHAR(80) NOT NULL,recommended_action VARCHAR(500) NOT NULL,estimated_cost DECIMAL(12,2) NOT NULL,sensor_data JSON NOT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX idx_assets_risk (risk_score),INDEX idx_assets_type (type),INDEX idx_assets_zone (zone)) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS complaints (id BIGINT PRIMARY KEY AUTO_INCREMENT,complaint_code VARCHAR(50) NOT NULL UNIQUE,asset_code VARCHAR(40) NOT NULL,severity VARCHAR(30) NOT NULL,issue_type VARCHAR(120) NOT NULL,description TEXT NOT NULL,complaint_date DATE NOT NULL,citizen_name VARCHAR(120) NULL,contact VARCHAR(190) NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT fk_complaint_asset FOREIGN KEY (asset_code) REFERENCES assets(asset_code) ON DELETE CASCADE,INDEX idx_complaints_asset (asset_code)) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS maintenance_tasks (id BIGINT PRIMARY KEY AUTO_INCREMENT,task_code VARCHAR(50) NOT NULL UNIQUE,asset_code VARCHAR(40) NOT NULL,status VARCHAR(40) NOT NULL,team VARCHAR(80) NULL,scheduled_date DATE NOT NULL,cost DECIMAL(12,2) NOT NULL,action VARCHAR(500) NOT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,CONSTRAINT fk_task_asset FOREIGN KEY (asset_code) REFERENCES assets(asset_code) ON DELETE CASCADE,INDEX idx_tasks_status (status),INDEX idx_tasks_asset (asset_code)) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS maintenance_history (id BIGINT PRIMARY KEY AUTO_INCREMENT,asset_code VARCHAR(40) NOT NULL,completed_date DATE NOT NULL,action VARCHAR(500) NOT NULL,cost DECIMAL(12,2) NOT NULL,risk_before INT NOT NULL,risk_after INT NOT NULL,estimated_savings DECIMAL(12,2) NOT NULL DEFAULT 0,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT fk_history_asset FOREIGN KEY (asset_code) REFERENCES assets(asset_code) ON DELETE CASCADE,INDEX idx_history_asset (asset_code)) ENGINE=InnoDB`
  ];
  for (const sql of statements) await connection.query(sql);
}

export async function seedDatabase(connection = getPool(), { force = false } = {}) {
  if (force) {
    await connection.query('SET FOREIGN_KEY_CHECKS=0');
    await connection.query('TRUNCATE TABLE maintenance_history');
    await connection.query('TRUNCATE TABLE maintenance_tasks');
    await connection.query('TRUNCATE TABLE complaints');
    await connection.query('TRUNCATE TABLE assets');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('SET FOREIGN_KEY_CHECKS=1');
  }
  await connection.query(`INSERT IGNORE INTO users(email,password_hash,display_name,role) VALUES ('admin@infraguard.ai','d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791','City Admin','ADMIN')`);
  const [countRows] = await connection.query('SELECT COUNT(*) AS count FROM assets');
  if (Number(countRows[0].count) === 0) for (const a of assets) await connection.query(`INSERT IGNORE INTO assets(asset_code,name,type,zone,location,condition_status,risk_score,impact_score,criticality_score,last_maintenance,predicted_issue,eta,recommended_action,estimated_cost,sensor_data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[...a.slice(0,14), JSON.stringify(a[14])]);
  const [complaintCount] = await connection.query('SELECT COUNT(*) AS count FROM complaints');
  if (Number(complaintCount[0].count) === 0) for (const c of complaints) await connection.query(`INSERT IGNORE INTO complaints(complaint_code,asset_code,severity,issue_type,description,complaint_date,citizen_name,contact) VALUES (?,?,?,?,?,?,?,?)`, c);
  const [taskCount] = await connection.query('SELECT COUNT(*) AS count FROM maintenance_tasks');
  if (Number(taskCount[0].count) === 0) for (const t of tasks) await connection.query(`INSERT IGNORE INTO maintenance_tasks(task_code,asset_code,status,team,scheduled_date,cost,action) VALUES (?,?,?,?,?,?,?)`, t);
}

let initPromise;
export function ensureDatabase() {
  if (!initPromise) {
    initPromise = (async () => { const pool = getPool(); await createSchema(pool); await seedDatabase(pool); })().catch(error => { initPromise = undefined; throw error; });
  }
  return initPromise;
}
