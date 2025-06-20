-- Table des comptes Grand Shooting
CREATE TABLE grand_shooting_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id VARCHAR(255) UNIQUE NOT NULL,
  api_key TEXT NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('principal', 'secondary')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des synchronisations
CREATE TABLE synchronizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  principal_account_id UUID REFERENCES grand_shooting_accounts(id),
  secondary_account_id UUID REFERENCES grand_shooting_accounts(id),
  webhook_enabled BOOLEAN DEFAULT false,
  batch_enabled BOOLEAN DEFAULT false,
  batch_frequency VARCHAR(50), -- 'hourly', 'daily', 'weekly'
  batch_schedule VARCHAR(100), -- cron expression
  mapping_config JSONB,
  filter_config JSONB,
  status VARCHAR(20) DEFAULT 'inactive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de la pile de traitement
CREATE TABLE processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id UUID REFERENCES synchronizations(id),
  job_type VARCHAR(20) CHECK (job_type IN ('webhook', 'batch')) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 2,
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des logs de synchronisation
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id UUID REFERENCES synchronizations(id),
  log_type VARCHAR(20) CHECK (log_type IN ('info', 'error', 'warning')) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tokens API utilisateurs
CREATE TABLE user_api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_processing_queue_status ON processing_queue(status);
CREATE INDEX idx_processing_queue_sync_id ON processing_queue(sync_id);
CREATE INDEX idx_sync_logs_sync_id ON sync_logs(sync_id);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at);
