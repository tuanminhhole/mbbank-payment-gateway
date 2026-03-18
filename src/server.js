/**
 * MBBank Payment Gateway — Example Server
 *
 * Demonstrates a minimal Express server with:
 * - MB Bank login + session keep-alive
 * - Transaction creation with VietQR
 * - Auto-reconciliation
 *
 * This is a simplified example. For production use,
 * add proper authentication, database, and error handling.
 */
const express = require('express');
const config = require('./config');
const BankConnector = require('./services/bank-connector');
const SessionKeeper = require('./services/session-keeper');
const logger = require('./utils/logger');

const app = express();
app.use(express.json());

// ── Initialize MB Bank Connection ──
const bankConnector = new BankConnector(config);
const sessionKeeper = new SessionKeeper(bankConnector, config);

// ── Routes ──

app.get('/api/health', (req, res) => {
  const status = bankConnector.getStatus();
  res.json({
    status: 'ok',
    bank_connected: status.isLoggedIn,
    last_login: status.lastLoginAt,
    account: status.accountNumber,
  });
});

app.get('/api/balance', async (req, res) => {
  try {
    const balance = await bankConnector.getBalance();
    res.json({ success: true, data: balance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const { from, to } = req.query;
    const today = new Date();
    const fromDate = from || formatDate(today);
    const toDate = to || formatDate(today);

    const transactions = await bankConnector.getTransactionHistory(fromDate, toDate);
    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Helpers ──

function formatDate(date) {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// ── Startup ──

async function start() {
  // 1. Login to MB Bank
  await bankConnector.login();

  // 2. Start session keeper
  sessionKeeper.start();

  // 3. Listen
  app.listen(config.PORT, () => {
    logger.info(`
╔══════════════════════════════════════════╗
║  🏦 MBBank Payment Gateway              ║
║  Port: ${String(config.PORT).padEnd(34)}║
║  Account: ${bankConnector.getStatus().accountNumber || 'N/A'}${' '.repeat(Math.max(0, 28 - (bankConnector.getStatus().accountNumber || 'N/A').length))}║
╚══════════════════════════════════════════╝
    `);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  sessionKeeper.stop();
  process.exit(0);
});

start().catch((err) => {
  logger.error(`Failed to start: ${err.message}`);
  process.exit(1);
});
