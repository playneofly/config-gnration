-- Run this once in your PostgreSQL provider's SQL editor.
CREATE TABLE IF NOT EXISTS configs (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  protocol varchar(24) NOT NULL,
  host varchar(255) NOT NULL,
  port integer NOT NULL,
  uuid varchar(64),
  password varchar(255),
  flow varchar(40),
  security varchar(24) NOT NULL DEFAULT 'tls',
  transport varchar(24) NOT NULL DEFAULT 'ws',
  sni varchar(255),
  host_header varchar(255),
  path varchar(255) DEFAULT '/',
  service_name varchar(255),
  method varchar(40),
  public_key varchar(128),
  private_key varchar(128),
  local_address varchar(96),
  reserved varchar(32),
  mtu integer,
  enabled boolean NOT NULL DEFAULT true,
  extras jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS configs_protocol_idx ON configs(protocol);
CREATE INDEX IF NOT EXISTS configs_enabled_idx ON configs(enabled);

CREATE TABLE IF NOT EXISTS subscriptions (
  id serial PRIMARY KEY,
  name varchar(120) NOT NULL,
  token varchar(64) NOT NULL,
  mode varchar(12) NOT NULL DEFAULT 'all',
  config_ids jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_token_idx
  ON subscriptions(token);
