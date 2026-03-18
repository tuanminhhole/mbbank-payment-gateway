/**
 * MB Bank API Client — Login, Session, and Transaction History
 *
 * Wraps the 'mbbank' npm package with production-ready error handling,
 * automatic re-login, and session state management.
 *
 * @requires mbbank (npm i mbbank)
 */

const logger = require('../utils/logger');

// Dynamic require to handle cases where mbbank is not installed
let MB;
try {
  ({ MB } = require('mbbank'));
} catch (err) {
  logger.error('❌ mbbank library not found. Run: npm install mbbank');
  MB = null;
}

class BankConnector {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.isLoggedIn = false;
    this.loginPromise = null;
    this.lastLoginAt = null;
  }

  /**
   * Login to MB Bank Internet Banking
   *
   * The library handles captcha solving internally:
   * 1. Requests captcha image from MB Bank
   * 2. Uses sharp to preprocess the image
   * 3. Runs ONNX ML model for OCR
   * 4. Submits captcha + credentials
   * 5. Receives session token
   */
  async login() {
    if (!MB) {
      throw new Error('mbbank library not available');
    }

    // Prevent concurrent logins
    if (this.loginPromise) {
      return this.loginPromise;
    }

    this.loginPromise = this._doLogin();
    try {
      const result = await this.loginPromise;
      return result;
    } finally {
      this.loginPromise = null;
    }
  }

  async _doLogin() {
    try {
      logger.info('🔐 Logging into MB Bank...');

      this.client = new MB({
        username: this.config.MB_USERNAME,
        password: this.config.MB_PASSWORD,
        preferredOCRMethod: 'default',
        saveWasm: false,
      });

      await this.client.login();
      this.isLoggedIn = true;
      this.lastLoginAt = new Date();

      logger.info('✅ MB Bank login successful');
      return { success: true };
    } catch (err) {
      this.isLoggedIn = false;
      logger.error(`❌ MB Bank login failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get account balance (also used as session ping)
   * Error code 'GW200' indicates session expired → needs re-login
   */
  async getBalance() {
    if (!this.isLoggedIn || !this.client) {
      await this.login();
    }

    try {
      const result = await this.client.getBalance();
      return result;
    } catch (err) {
      if (this._isSessionExpired(err)) {
        logger.warn('⚠️ Session expired (GW200), re-logging in...');
        this.isLoggedIn = false;
        await this.login();
        return this.client.getBalance();
      }
      throw err;
    }
  }

  /**
   * Get transaction history for a date range
   *
   * @param {string} fromDate - Start date (DD/MM/YYYY)
   * @param {string} toDate   - End date (DD/MM/YYYY)
   * @returns {Array} Array of transaction objects
   *
   * Each transaction contains:
   * - creditAmount: Amount received (string)
   * - debitAmount: Amount sent (string)
   * - transactionDesc: Description (contains payment note)
   * - postDate: Transaction date
   * - balanceAvailable: Balance after transaction
   * - refNo: Reference number
   */
  async getTransactionHistory(fromDate, toDate) {
    if (!this.isLoggedIn || !this.client) {
      await this.login();
    }

    try {
      const result = await this.client.getTransactionsHistory({
        accountNumber: this.config.MB_ACCOUNT_NUMBER,
        fromDate,
        toDate,
      });
      return result;
    } catch (err) {
      if (this._isSessionExpired(err)) {
        logger.warn('⚠️ Session expired (GW200), re-logging in...');
        this.isLoggedIn = false;
        await this.login();
        return this.client.getTransactionsHistory({
          accountNumber: this.config.MB_ACCOUNT_NUMBER,
          fromDate,
          toDate,
        });
      }
      throw err;
    }
  }

  /**
   * Check if error indicates session expired
   * MB Bank returns error code 'GW200' when session is invalid
   */
  _isSessionExpired(err) {
    const msg = (err.message || '').toUpperCase();
    return msg.includes('GW200') || msg.includes('SESSION') || msg.includes('UNAUTHORIZED');
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isLoggedIn: this.isLoggedIn,
      lastLoginAt: this.lastLoginAt,
      accountNumber: this.config.MB_ACCOUNT_NUMBER
        ? `***${this.config.MB_ACCOUNT_NUMBER.slice(-4)}`
        : null,
    };
  }
}

module.exports = BankConnector;
