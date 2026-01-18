const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const monitoringConfig = require('./monitoringConfig');

/**
 * Variable audit logger for tracking changes to variables
 */
class VariableAuditLog {
  constructor() {
    this.config = monitoringConfig;
    this.auditLogger = null;
    this.changeHistory = new Map(); // Track changes for rate limiting
    this.init();
  }

  /**
   * Initialize the audit logger
   * @private
   */
  init() {
    if (!this.config.auditLog.enabled) {
      return;
    }

    const logsDir = this.config.auditLog.dirname;
    if (!require('fs').existsSync(logsDir)) {
      require('fs').mkdirSync(logsDir, { recursive: true });
    }

    this.auditLogger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new DailyRotateFile({
          filename: path.join(logsDir, this.config.auditLog.filename),
          datePattern: this.config.auditLog.datePattern,
          maxFiles: this.config.auditLog.maxFiles,
          maxSize: this.config.auditLog.maxSize,
          createSymlink: this.config.auditLog.createSymlink,
        }),
      ],
    });
  }

  /**
   * Get the type of a value
   * @param {*} value
   * @returns {string}
   * @private
   */
  getValueType(value) {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'boolean') return 'boolean';
    return typeof value;
  }

  /**
   * Mask value if configured
   * @param {*} value
   * @returns {*}
   * @private
   */
  maskValue(value) {
    if (!this.config.valueMasking.enabled) {
      return value;
    }

    const strValue = String(value);
    if (this.config.valueMasking.maskLongValues && strValue.length > this.config.valueMasking.maxValueLength) {
      return strValue.substring(0, this.config.valueMasking.maxValueLength) + '...';
    }

    return value;
  }

  /**
   * Check if an activity is suspicious based on rate limits
   * @param {string} clientIp
   * @param {string} variableName
   * @returns {boolean}
   * @private
   */
  isSuspiciousActivity(clientIp, variableName) {
    if (!this.config.limits.enableRateLimiting) {
      return false;
    }

    const now = Date.now();
    const secondAgo = now - 1000;
    const minuteAgo = now - 60000;

    // Check per-second rate for client
    const clientKey = `client:${clientIp}`;
    if (!this.changeHistory.has(clientKey)) {
      this.changeHistory.set(clientKey, []);
    }
    const clientChanges = this.changeHistory.get(clientKey);
    const recentClientChanges = clientChanges.filter((t) => t > secondAgo);
    if (recentClientChanges.length >= this.config.limits.maxChangesPerSecondPerClient) {
      return true;
    }
    recentClientChanges.push(now);
    this.changeHistory.set(clientKey, recentClientChanges);

    // Check per-minute rate for variable
    const varKey = `var:${variableName}`;
    if (!this.changeHistory.has(varKey)) {
      this.changeHistory.set(varKey, []);
    }
    const varChanges = this.changeHistory.get(varKey);
    const recentVarChanges = varChanges.filter((t) => t > minuteAgo);
    if (recentVarChanges.length >= this.config.limits.maxChangesPerMinutePerVariable) {
      return true;
    }
    recentVarChanges.push(now);
    this.changeHistory.set(varKey, recentVarChanges);

    return false;
  }

  /**
   * Log a variable change
   * @param {object} options
   * @param {object} options.client The Client object
   * @param {string} options.variableName The name of the variable
   * @param {*} options.oldValue The previous value
   * @param {*} options.newValue The new value
   * @param {string} options.action 'create' or 'update' or 'delete'
   * @param {string} options.userAgent The user agent string
   * @param {number} options.clientCount Number of clients in room
   */
  logChange(options) {
    if (!this.config.monitoring.enabled || !this.config.monitoring.logVariableChanges) {
      return;
    }

    const auditEntry = {};

    if (this.config.fields.timestamp) {
      auditEntry.timestamp = new Date().toISOString();
    }
    if (this.config.fields.ip) {
      auditEntry.ip = options.client.ip;
    }
    if (this.config.fields.username) {
      auditEntry.username = options.client.username || 'unknown';
    }
    if (this.config.fields.roomId && options.client.room) {
      auditEntry.roomId = options.client.room.id;
    }
    if (this.config.fields.variableName) {
      auditEntry.variableName = options.variableName;
    }
    if (this.config.fields.oldValue && options.action !== 'create') {
      auditEntry.oldValue = this.maskValue(options.oldValue);
    }
    if (this.config.fields.newValue) {
      auditEntry.newValue = this.maskValue(options.newValue);
    }
    if (this.config.fields.userAgent) {
      auditEntry.userAgent = options.userAgent || 'unknown';
    }
    if (this.config.fields.action) {
      auditEntry.action = options.action;
    }
    if (this.config.fields.clientCount) {
      auditEntry.clientCount = options.clientCount || 0;
    }
    if (this.config.fields.valueType) {
      auditEntry.valueType = this.getValueType(options.newValue);
    }

    // Check for suspicious activity
    const isSuspicious = this.isSuspiciousActivity(options.client.ip, options.variableName);
    if (isSuspicious && this.config.limits.logSuspiciousActivity) {
      auditEntry.suspicious = true;
      auditEntry.alert = 'Suspicious activity detected - possible rate limit exceeded';
    }

    if (this.auditLogger) {
      this.auditLogger.info(auditEntry);
    }

    // Also log to console if monitoring is enabled
    if (this.config.monitoring.logFormat === 'detailed') {
      const logMessage = `Variable "${options.variableName}" in room ${options.client.room?.id} - Action: ${options.action} - User: ${options.client.username} (${options.client.ip})${isSuspicious ? ' [SUSPICIOUS]' : ''}`;
      options.client.log(logMessage);
    }
  }

  /**
   * Clean up old entries from change history
   */
  cleanup() {
    const now = Date.now();
    const threshold = now - 60000; // Keep 1 minute of history

    for (const [key, timestamps] of this.changeHistory.entries()) {
      const filtered = timestamps.filter((t) => t > threshold);
      if (filtered.length === 0) {
        this.changeHistory.delete(key);
      } else {
        this.changeHistory.set(key, filtered);
      }
    }
  }
}

// Create singleton instance
const variableAuditLog = new VariableAuditLog();

// Cleanup every minute (unref so it doesn't block process exit)
const cleanupInterval = setInterval(() => {
  variableAuditLog.cleanup();
}, 60000);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

module.exports = variableAuditLog;
