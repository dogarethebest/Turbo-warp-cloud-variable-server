const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Default configuration for monitoring
 * @private
 */
const DEFAULT_MONITORING_CONFIG = {
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

/**
 * Validate monitoring configuration object
 * @param {object} config
 * @returns {boolean}
 * @private
 */
function isValidMonitoringConfig(config) {
  if (!config || typeof config !== 'object') return false;
  if (!config.monitoring || typeof config.monitoring !== 'object') return false;
  if (typeof config.monitoring.enabled !== 'boolean') return false;
  if (!config.auditLog || typeof config.auditLog !== 'object') return false;
  if (!config.fields || typeof config.fields !== 'object') return false;
  if (!config.limits || typeof config.limits !== 'object') return false;
  if (!config.valueMasking || typeof config.valueMasking !== 'object') return false;
  return true;
}

/**
 * Load monitoring configuration from JSON file
 * Falls back to defaults if file is missing or invalid
 * @returns {object} Configuration object with defaults
 */
function loadMonitoringConfig() {
  const configPath = path.join(__dirname, '../configuration/monitoring.json');

  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (isValidMonitoringConfig(config)) {
        logger.info('✓ Loaded monitoring configuration from ' + configPath);
        return config;
      } else {
        logger.warn('⚠ Monitoring configuration is invalid (missing required sections). Using defaults.');
      }
    } else {
      logger.info('ℹ Monitoring configuration file not found. Using defaults.');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof SyntaxError) {
      logger.warn('⚠ Monitoring configuration JSON syntax error: ' + errorMessage + '. Using defaults.');
    } else {
      logger.warn('⚠ Failed to load monitoring configuration: ' + errorMessage + '. Using defaults.');
    }
  }

  logger.info('Using default monitoring configuration (monitoring=' + 
    DEFAULT_MONITORING_CONFIG.monitoring.enabled + 
    ', auditLog=' + DEFAULT_MONITORING_CONFIG.auditLog.enabled + ')');
  
  return DEFAULT_MONITORING_CONFIG;
}

const monitoringConfig = loadMonitoringConfig();

module.exports = monitoringConfig;
