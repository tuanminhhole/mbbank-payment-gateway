/**
 * Reconciliation Service — Auto-match bank transactions with pending payments
 *
 * Polls MB Bank transaction history and matches incoming transfers
 * against pending payment transactions using:
 * 1. Payment note keyword match (case-insensitive)
 * 2. Amount match (±1 VND tolerance for rounding)
 *
 * When matched: updates TX status to 'completed' and sends webhook.
 */

const logger = require('../utils/logger');

class ReconciliationService {
  constructor(bankConnector, config, db) {
    this.bankConnector = bankConnector;
    this.config = config;
    this.db = db;
    this.timer = null;
  }

  /**
   * Start the reconciliation loop
   * Uses adaptive interval: faster when pending TXs exist, slower when idle
   */
  start() {
    const scheduleNext = async () => {
      try {
        const hasPending = await this._reconcile();
        const interval = hasPending
          ? (this.config.RECON_ACTIVE_INTERVAL || 30000)   // 30s when pending
          : (this.config.RECON_IDLE_INTERVAL || 300000);   // 5 min when idle
        this.timer = setTimeout(scheduleNext, interval);
      } catch (err) {
        logger.error(`Reconciliation error: ${err.message}`);
        this.timer = setTimeout(scheduleNext, 60000); // 1 min on error
      }
    };

    scheduleNext();
    logger.info('🔁 Reconciliation service started');
  }

  /**
   * Stop the reconciliation loop
   */
  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Run one reconciliation cycle
   * @returns {boolean} true if there are still pending transactions
   */
  async _reconcile() {
    // 1. Expire old pending transactions
    await this._expirePending();

    // 2. Get pending transactions
    const pendingTxs = await this.db.queryAll(
      "SELECT * FROM transactions WHERE status = 'pending' AND expires_at > NOW()"
    );

    if (pendingTxs.length === 0) return false;

    // 3. Fetch today's bank history
    const today = this._formatDate(new Date());
    let bankTxs;
    try {
      bankTxs = await this.bankConnector.getTransactionHistory(today, today);
    } catch (err) {
      logger.warn(`Failed to fetch bank history: ${err.message}`);
      return pendingTxs.length > 0;
    }

    if (!bankTxs || bankTxs.length === 0) return pendingTxs.length > 0;

    // 4. Match each pending TX against bank transactions
    for (const ptx of pendingTxs) {
      const matched = this._matchTransaction(bankTxs, ptx.payment_note, ptx.amount);
      if (matched) {
        await this._completeTx(ptx, matched);
      }
    }

    return true;
  }

  /**
   * Match a bank transaction against expected payment_note and amount
   *
   * @param {Array}  bankTxs     - Array of bank transactions
   * @param {string} paymentNote - Expected payment note keyword
   * @param {number} amount      - Expected amount
   * @returns {object|null}      - Matched bank transaction or null
   */
  _matchTransaction(bankTxs, paymentNote, amount) {
    const noteUpper = paymentNote.toUpperCase();

    for (const tx of bankTxs) {
      const credit = parseFloat(tx.creditAmount || 0);
      if (credit <= 0) continue;                          // Only consider incoming transfers

      if (Math.abs(credit - amount) > 1) continue;       // Amount match (±1 VND tolerance)

      const desc = (tx.transactionDesc || '').toUpperCase();
      if (desc.includes(noteUpper)) {                     // Payment note match
        return tx;
      }
    }

    return null;
  }

  /**
   * Mark transaction as completed and send webhook
   */
  async _completeTx(ptx, matchedBankTx) {
    await this.db.execute(
      `UPDATE transactions SET status = 'completed', matched_bank_tx = ?, completed_at = NOW() WHERE id = ?`,
      [JSON.stringify(matchedBankTx), ptx.id]
    );

    logger.info(`✅ TX matched: ${ptx.tx_id} — ${ptx.amount} VND — ${ptx.payment_note}`);

    // TODO: Send webhook callback to merchant
    // await sendWebhook(merchant.webhook_url, { event: 'payment_completed', tx_id: ptx.tx_id, ... });
  }

  /**
   * Expire pending transactions past their expiry time
   */
  async _expirePending() {
    const result = await this.db.execute(
      "UPDATE transactions SET status = 'expired' WHERE status = 'pending' AND expires_at <= NOW()"
    );
    if (result.affectedRows > 0) {
      logger.info(`⏰ Expired ${result.affectedRows} transaction(s)`);
    }
  }

  /**
   * Format date as DD/MM/YYYY (required by MB Bank API)
   */
  _formatDate(date) {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
}

module.exports = ReconciliationService;
