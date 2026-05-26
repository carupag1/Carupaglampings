---
name: Data persistence architecture
description: How admin data is stored and why JSON files were replaced with PostgreSQL
---

# Admin Data Persistence

## The Rule
All mutable admin data lives in PostgreSQL `app_data` table (key-value JSONB), NOT in `server/api/*.json` files.

## Why
Replit production containers are stateless. Writes to `server/api/*.json` in prod are lost on container restart/redeploy. PostgreSQL persists properly.

## How it works
- `app_data` table: key TEXT PRIMARY KEY, value JSONB, updated_at TIMESTAMPTZ
- `audit_log` table: id, ts, action, entity, entity_id, description
- On startup: `initDataCache()` reads all keys from DB; seeds from JSON files if key doesn't exist yet
- Runtime reads: sync from in-memory `dataCache` object
- Runtime writes: `writeData(key, value)` → updates cache synchronously + fire-and-forget DB flush
- Audit logging: `logAudit(action, entity, entityId, description)` → fire-and-forget INSERT

## Keys
campings, addons, banners, plans, plan-blocks, unit-blocks, pricing

## How to apply
If adding new mutable config data: add to DATA_KEYS array in `initDataCache()`, use `readData(key)` / `writeData(key, data)`, add `logAudit(...)` on mutations.
