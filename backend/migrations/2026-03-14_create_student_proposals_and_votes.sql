-- Tabla de propuestas estudiantiles
CREATE TABLE IF NOT EXISTS student_proposals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de votos estudiantiles
CREATE TABLE IF NOT EXISTS student_votes (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER NOT NULL REFERENCES student_proposals(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value IN (1, -1)),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (proposal_id, user_id)
);
