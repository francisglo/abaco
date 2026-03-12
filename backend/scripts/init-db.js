/**
 * Script para crear la estructura de base de datos
 * Ejecutar: node scripts/init-db.js
 */

import database from '../src/config/database.js';

const schema = `
-- ===== USUARIOS =====
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(30) UNIQUE,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'operator',
  phone VARCHAR(20),
  zone_id INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- ===== ZONAS TERRITORIALES =====
CREATE TABLE IF NOT EXISTS zones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  priority INTEGER DEFAULT 3,
  manager VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zones_priority ON zones(priority);

-- ===== VOTANTES =====
CREATE TABLE IF NOT EXISTS voters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  dni VARCHAR(20) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  address VARCHAR(255),
  zone_id INTEGER REFERENCES zones(id),
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voters_zone ON voters(zone_id);
CREATE INDEX idx_voters_status ON voters(status);
CREATE INDEX idx_voters_priority ON voters(priority);
CREATE INDEX idx_voters_dni ON voters(dni);

-- ===== TAREAS =====
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  assigned_to INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  type VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ===== LOGS DE AUDITORÍA =====
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ===== CATEGORÍAS =====
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== VARIABLES DE ANÁLISIS =====
CREATE TABLE IF NOT EXISTS variables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  type VARCHAR(20),
  data_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== VALIDACIONES =====
CREATE TABLE IF NOT EXISTS validation_rules (
  id SERIAL PRIMARY KEY,
  field VARCHAR(50) NOT NULL,
  rule TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== COPIAS DE SEGURIDAD =====
CREATE TABLE IF NOT EXISTS backups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20),
  size VARCHAR(50),
  status VARCHAR(20),
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backups_created ON backups(created_at);

-- ===== SOLICITUDES CIUDADANAS =====
CREATE TABLE IF NOT EXISTS citizen_requests (
  id SERIAL PRIMARY KEY,
  request_type VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  citizen_name VARCHAR(100) NOT NULL,
  citizen_phone VARCHAR(20),
  citizen_email VARCHAR(100),
  zone_id INTEGER REFERENCES zones(id),
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  assigned_to INTEGER REFERENCES users(id),
  urgency INTEGER DEFAULT 3,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  resolution_date DATE,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_citizen_requests_zone ON citizen_requests(zone_id);
CREATE INDEX idx_citizen_requests_status ON citizen_requests(status);
CREATE INDEX idx_citizen_requests_priority ON citizen_requests(priority);
CREATE INDEX idx_citizen_requests_assigned_to ON citizen_requests(assigned_to);

-- ===== SEGUIMIENTO CASOS =====
CREATE TABLE IF NOT EXISTS case_tracking (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES citizen_requests(id),
  activity VARCHAR(100),
  description TEXT,
  status_before VARCHAR(20),
  status_after VARCHAR(20),
  modified_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_case_tracking_request ON case_tracking(request_id);

-- ===== EVENTOS TERRITORIALES =====
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50),
  zone_id INTEGER REFERENCES zones(id),
  location VARCHAR(255),
  event_date DATE NOT NULL,
  event_time TIME,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  organizer_id INTEGER REFERENCES users(id),
  expected_attendees INTEGER,
  actual_attendees INTEGER,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status VARCHAR(20) DEFAULT 'scheduled',
  report TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_zone ON events(zone_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_type ON events(event_type);

-- ===== ACTIVIDADES Y SEGUIMIENTO =====
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  activity_type VARCHAR(50),
  description TEXT,
  assigned_to INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  scheduled_date DATE,
  completion_date DATE,
  progress_percent INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_event ON activities(event_id);
CREATE INDEX idx_activities_assigned_to ON activities(assigned_to);
CREATE INDEX idx_activities_status ON activities(status);

-- ===== VOLUNTARIOS =====
CREATE TABLE IF NOT EXISTS volunteers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  skill_area VARCHAR(100),
  availability VARCHAR(50),
  zone_id INTEGER REFERENCES zones(id),
  organization VARCHAR(100),
  start_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  hours_contributed INTEGER DEFAULT 0,
  certification BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_volunteers_zone ON volunteers(zone_id);
CREATE INDEX idx_volunteers_status ON volunteers(status);
CREATE INDEX idx_volunteers_skill ON volunteers(skill_area);

-- ===== ASIGNACIÓN DE VOLUNTARIOS =====
CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id SERIAL PRIMARY KEY,
  volunteer_id INTEGER REFERENCES volunteers(id),
  activity_id INTEGER REFERENCES activities(id),
  assigned_date DATE,
  completion_date DATE,
  hours_worked DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'assigned',
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_volunteer_assignments_volunteer ON volunteer_assignments(volunteer_id);
CREATE INDEX idx_volunteer_assignments_activity ON volunteer_assignments(activity_id);

-- ===== REPORTES DE CAMPO =====
CREATE TABLE IF NOT EXISTS field_reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER REFERENCES users(id),
  zone_id INTEGER REFERENCES zones(id),
  report_date DATE NOT NULL,
  report_type VARCHAR(50),
  title VARCHAR(255),
  observations TEXT,
  findings JSONB,
  photos_count INTEGER DEFAULT 0,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status VARCHAR(20) DEFAULT 'submitted',
  reviewer_id INTEGER REFERENCES users(id),
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_field_reports_zone ON field_reports(zone_id);
CREATE INDEX idx_field_reports_date ON field_reports(report_date);
CREATE INDEX idx_field_reports_reporter ON field_reports(reporter_id);

-- ===== METAS Y OBJETIVOS =====
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  zone_id INTEGER REFERENCES zones(id),
  manager_id INTEGER REFERENCES users(id),
  target_value DECIMAL(10,2),
  current_value DECIMAL(10,2) DEFAULT 0,
  unit VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  start_date DATE,
  due_date DATE,
  priority VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goals_zone ON goals(zone_id);
CREATE INDEX idx_goals_manager ON goals(manager_id);
CREATE INDEX idx_goals_due_date ON goals(due_date);

-- ===== PROYECTOS =====
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  zone_id INTEGER REFERENCES zones(id),
  manager_id INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'planning',
  budget DECIMAL(12,2),
  spent DECIMAL(12,2) DEFAULT 0,
  start_date DATE,
  due_date DATE,
  completion_date DATE,
  priority VARCHAR(20) DEFAULT 'medium',
  expected_impact VARCHAR(255),
  actual_impact TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_zone ON projects(zone_id);
CREATE INDEX idx_projects_manager ON projects(manager_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ===== AVANCE DE PROYECTOS =====
CREATE TABLE IF NOT EXISTS project_progress (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  milestone VARCHAR(255),
  description TEXT,
  progress_percent INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  planned_date DATE,
  actual_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_progress_project ON project_progress(project_id);

-- ===== INDICADORES TERRITORIALES =====
CREATE TABLE IF NOT EXISTS territorial_indicators (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER REFERENCES zones(id),
  indicator_name VARCHAR(100) NOT NULL,
  indicator_type VARCHAR(50),
  value DECIMAL(10,2),
  baseline DECIMAL(10,2),
  target DECIMAL(10,2),
  unit VARCHAR(50),
  measurement_date DATE,
  status VARCHAR(20),
  trend VARCHAR(20),
  data_source VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_territorial_indicators_zone ON territorial_indicators(zone_id);
CREATE INDEX idx_territorial_indicators_date ON territorial_indicators(measurement_date);

-- ===== ANÁLISIS COMPARATIVO DE ZONAS =====
CREATE TABLE IF NOT EXISTS zone_comparison (
  id SERIAL PRIMARY KEY,
  zone_a_id INTEGER REFERENCES zones(id),
  zone_b_id INTEGER REFERENCES zones(id),
  comparison_type VARCHAR(50),
  metric VARCHAR(100),
  value_a DECIMAL(10,2),
  value_b DECIMAL(10,2),
  difference DECIMAL(10,2),
  percentage_diff DECIMAL(5,2),
  analysis JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zone_comparison_zones ON zone_comparison(zone_a_id, zone_b_id);

-- ===== ALERTAS ESTRATÉGICAS =====
CREATE TABLE IF NOT EXISTS strategic_alerts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  alert_type VARCHAR(50),
  severity VARCHAR(20) DEFAULT 'medium',
  zone_id INTEGER REFERENCES zones(id),
  description TEXT,
  indicator_id INTEGER REFERENCES territorial_indicators(id),
  threshold_value DECIMAL(10,2),
  current_value DECIMAL(10,2),
  recommendation TEXT,
  status VARCHAR(20) DEFAULT 'active',
  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_strategic_alerts_zone ON strategic_alerts(zone_id);
CREATE INDEX idx_strategic_alerts_severity ON strategic_alerts(severity);
CREATE INDEX idx_strategic_alerts_created ON strategic_alerts(created_at);

-- ===== SOCIAL LEADERS =====
CREATE TABLE IF NOT EXISTS social_leaders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  organization VARCHAR(100),
  zone_id INTEGER REFERENCES zones(id),
  influence_level VARCHAR(20),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  area_of_influence VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_social_leaders_zone ON social_leaders(zone_id);
CREATE INDEX idx_social_leaders_influence ON social_leaders(influence_level);

-- ===== COMPROMISOS =====
CREATE TABLE IF NOT EXISTS commitments (
  id SERIAL PRIMARY KEY,
  commitment_type VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  committed_to VARCHAR(100),
  committed_by INTEGER REFERENCES users(id),
  zone_id INTEGER REFERENCES zones(id),
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commitments_zone ON commitments(zone_id);
CREATE INDEX idx_commitments_status ON commitments(status);
CREATE INDEX idx_commitments_due_date ON commitments(due_date);

-- ===== PLANES DE SUSCRIPCIÓN =====
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  model_type VARCHAR(30) NOT NULL,
  tier VARCHAR(30) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL,
  price_min_millions DECIMAL(10,2) NOT NULL,
  price_max_millions DECIMAL(10,2) NOT NULL,
  setup_fee_millions DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'COP',
  features JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_plans_model_type ON subscription_plans(model_type);
CREATE INDEX idx_subscription_plans_tier ON subscription_plans(tier);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(active);

-- ===== SUSCRIPCIONES =====
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  organization_name VARCHAR(180) NOT NULL,
  organization_type VARCHAR(30) NOT NULL,
  scope VARCHAR(20) NOT NULL,
  plan_id INTEGER REFERENCES subscription_plans(id),
  model_type VARCHAR(30) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL,
  amount_millions DECIMAL(10,2) NOT NULL,
  setup_fee_millions DECIMAL(10,2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  next_billing_date DATE,
  renewal_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  users_limit INTEGER DEFAULT 20,
  zones_limit INTEGER DEFAULT 5,
  notes TEXT,
  cancellation_reason VARCHAR(500),
  cancelled_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_model_type ON subscriptions(model_type);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);
CREATE INDEX idx_subscriptions_renewal_date ON subscriptions(renewal_date);

-- ===== PAGOS DE SUSCRIPCIÓN =====
CREATE TABLE IF NOT EXISTS subscription_payments (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER REFERENCES subscriptions(id),
  payment_date DATE NOT NULL,
  period_label VARCHAR(50) NOT NULL,
  amount_millions DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(30),
  status VARCHAR(20) DEFAULT 'paid',
  reference VARCHAR(120),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_payment_date ON subscription_payments(payment_date);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(status);
`;

async function initDB() {
  try {
    console.log('🔧 Inicializando base de datos...');
    
    for (const statement of schema.split(';')) {
      if (statement.trim()) {
        await database.query(statement);
      }
    }

    console.log('✅ Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar DB:', error);
    process.exit(1);
  }
}

initDB();
