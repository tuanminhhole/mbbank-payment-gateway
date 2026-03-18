/**
 * Configuration — Loads from environment variables
 */
require('dotenv').config();

module.exports = {
  PORT: parseInt(process.env.PORT || '3456', 10),
  ADMIN_SECRET: process.env.ADMIN_SECRET || '',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',

  // MB Bank credentials
  MB_USERNAME: process.env.MB_USERNAME || '',
  MB_PASSWORD: process.env.MB_PASSWORD || '',
  MB_ACCOUNT_NUMBER: process.env.MB_ACCOUNT_NUMBER || '',

  // MB Bank base URL
  MB_BASE_URL: 'https://online.mbbank.com.vn',

  // Session keep-alive: ping every N ms (default: 4 min)
  KEEP_ALIVE_INTERVAL: parseInt(process.env.KEEP_ALIVE_INTERVAL || '240000', 10),

  // Max ping failures before re-login (default: 3)
  MAX_PING_FAILURES: parseInt(process.env.MAX_PING_FAILURES || '3', 10),

  // Reconciliation intervals
  RECON_ACTIVE_INTERVAL: parseInt(process.env.RECON_ACTIVE_INTERVAL || '30000', 10),   // 30s
  RECON_IDLE_INTERVAL: parseInt(process.env.RECON_IDLE_INTERVAL || '300000', 10),       // 5 min

  // Transaction expiry (default: 30 min)
  TX_EXPIRE_MS: parseInt(process.env.TX_EXPIRE_MS || '1800000', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
