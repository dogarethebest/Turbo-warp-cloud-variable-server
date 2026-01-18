const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Load monitoring configuration from JSON file
 * @returns {object} Configuration object with defaults
 */
function loadMonitoringConfig() {
  const configPath = path.join(__dirname, '../configuration/monitoring.json');

  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      logger.info('Loaded monitoring configuration from ' + configPath);
      return config;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Failed to load monitoring configuration: ' + errorMessage);
  }

  // Return defaults if file doesn't exist or fails to parse
  return {
    monitoring: {
      enabled: true,
      logVariableChanges: true,
      logFormat: 'detailed',
    },
    auditLog: {
      enabled: true,
      filename: 'variable-audit.log',
      dirname: 'logs',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      maxSize: '100m',
      createSymlink: true,
    },
    fields: {
      timestamp: true,
      ip: true,
      username: true,
      roomId: true,
      variableName: true,
      oldValue: true,
      newValue: true,
      userAgent: true,
      action: true,
      clientCount: true,
      valueType: true,
    },
    limits: {
      enableRateLimiting: false,
      maxChangesPerSecondPerClient: 100,
      maxChangesPerMinutePerVariable: 1000,
      logSuspiciousActivity: true,
      suspiciousThreshold: 50,
    },
    valueMasking: {
      enabled: false,
      maskLongValues: true,
      maxValueLength: 100,
      maskSensitivePatterns: false,
    },
  };
}

const monitoringConfig = loadMonitoringConfig();

module.exports = monitoringConfig;
