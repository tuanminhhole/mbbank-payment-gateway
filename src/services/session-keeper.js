/**
 * Session Keeper — Keeps MB Bank session alive via periodic pings
 *
 * Periodically calls getBalance() to prevent session timeout.
 * If ping fails MAX_PING_FAILURES times, forces a re-login.
 */

const logger = require('../utils/logger');

class SessionKeeper {
  constructor(bankConnector, config) {
    this.bankConnector = bankConnector;
    this.config = config;
    this.pingInterval = null;
    this.failCount = 0;
  }

  /**
   * Start the keep-alive loop
   */
  start() {
    if (this.pingInterval) return;

    const interval = this.config.KEEP_ALIVE_INTERVAL || 240000; // 4 min default
    const maxFails = this.config.MAX_PING_FAILURES || 3;

    this.pingInterval = setInterval(async () => {
      try {
        await this.bankConnector.getBalance();
        this.failCount = 0;
        logger.debug('💓 Session ping OK');
      } catch (err) {
        this.failCount++;
        logger.warn(`⚠️ Session ping failed (${this.failCount}/${maxFails}): ${err.message}`);

        if (this.failCount >= maxFails) {
          logger.info('🔄 Max ping failures reached, forcing re-login...');
          this.failCount = 0;
          try {
            await this.bankConnector.login();
            logger.info('✅ Re-login successful');
          } catch (loginErr) {
            logger.error(`❌ Re-login failed: ${loginErr.message}`);
          }
        }
      }
    }, interval);

    logger.info(`💓 Session keeper started (ping every ${interval / 1000}s, max fails: ${maxFails})`);
  }

  /**
   * Stop the keep-alive loop
   */
  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      logger.info('Session keeper stopped');
    }
  }
}

module.exports = SessionKeeper;
