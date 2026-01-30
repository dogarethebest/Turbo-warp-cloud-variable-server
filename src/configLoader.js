/**
 * Centralized Configuration Loader
 * Loads all configuration from JSON files in the configuration/ folder
 * Provides defaults and validation for all config sections
 */

const fs = require('fs');
const path = require('path');
// Avoid requiring './logger' here to prevent a circular dependency
// (logger requires configLoader). Use console for startup config messages.

/**
 * Default server configuration
 * Used when server.json is missing or invalid
 * @private
 */
const DEFAULT_SERVER_CONFIG = {
  server: {
    port: process.env.PORT || 9080,
    unixSocketPermissions: 0o777,
  },
  proxy: {
    trustProxy: process.env.TRUST_PROXY === 'true',
    anonymizeAddresses: process.env.ANONYMIZE_ADDRESSES === 'false',
  },
  websocket: {
    maxPayload: 1024 * 1024,
    perMessageDeflate: false,
  },
  performance: {
    bufferSends: 60,
  },
  features: {
    enableRename: false,
    enableDelete: false,
    anonymizeGeneratedUsernames: true,
  },
  logging: {
    console: true,
    rotation: {
      filename: '%DATE%.log',
      dirname: process.env.LOGS_DIRECTORY || 'logs',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      createSymlink: true,
    },
  },
};

/**
 * Default room configuration
 * Used when room.json is missing or invalid
 * @private
 */
const DEFAULT_ROOM_CONFIG = {
  limits: {
    maxRooms: 16384,
    maxClientsPerRoom: 128,
    maxVariablesPerRoom: 128,
  },
  janitor: {
    interval: 1000 * 60,
    emptyRoomThreshold: 1000 * 60 * 60,
  },
};

/**
 * Default monitoring configuration
 * Used when monitoring.json is missing or invalid
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
 * Load a JSON configuration file
 * @param {string} filename - Name of the file in configuration/ folder
 * @param {object} defaultConfig - Default config to use if file missing/invalid
 * @param {Function} validator - Optional validation function
 * @returns {object} Configuration object
 * @private
 */
function loadConfigFile(filename, defaultConfig, validator) {
  const configPath = path.join(__dirname, '../configuration', filename);

  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (validator) {
        if (validator(config)) {
          console.info(`✓ Loaded ${filename} from configuration folder`);
          return config;
        } else {
          console.warn(`⚠ ${filename} is invalid (missing required fields). Using defaults.`);
        }
      } else {
        console.info(`✓ Loaded ${filename} from configuration folder`);
        return config;
      }
    } else {
      logger.info(`ℹ ${filename} not found in configuration folder. Using defaults.`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof SyntaxError) {
      console.warn(`⚠ ${filename} JSON syntax error: ${errorMessage}. Using defaults.`);
    } else {
      console.warn(`⚠ Failed to load ${filename}: ${errorMessage}. Using defaults.`);
    }
  }

  return defaultConfig;
}

/**
 * Validate server configuration
 * @param {object} config
 * @returns {boolean}
 * @private
 */
function isValidServerConfig(config) {
  if (!config || typeof config !== 'object') return false;
  if (!config.server || typeof config.server !== 'object') return false;
  if (!config.logging || typeof config.logging !== 'object') return false;
  return true;
}

/**
 * Validate room configuration
 * @param {object} config
 * @returns {boolean}
 * @private
 */
function isValidRoomConfig(config) {
  if (!config || typeof config !== 'object') return false;
  if (!config.limits || typeof config.limits !== 'object') return false;
  if (typeof config.limits.maxRooms !== 'number' || config.limits.maxRooms <= 0) return false;
  if (typeof config.limits.maxClientsPerRoom !== 'number' || config.limits.maxClientsPerRoom <= 0) return false;
  if (typeof config.limits.maxVariablesPerRoom !== 'number' || config.limits.maxVariablesPerRoom <= 0) return false;
  if (!config.janitor || typeof config.janitor !== 'object') return false;
  if (typeof config.janitor.interval !== 'number' || config.janitor.interval <= 0) return false;
  if (typeof config.janitor.emptyRoomThreshold !== 'number' || config.janitor.emptyRoomThreshold <= 0) return false;
  return true;
}

/**
 * Validate monitoring configuration
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
 * Load all configuration files
 */
function loadAllConfigs() {
  const serverConfig = loadConfigFile('server.json', DEFAULT_SERVER_CONFIG, isValidServerConfig);
  const roomConfig = loadConfigFile('room.json', DEFAULT_ROOM_CONFIG, isValidRoomConfig);
  const monitoringConfig = loadConfigFile('monitoring.json', DEFAULT_MONITORING_CONFIG, isValidMonitoringConfig);

  return {
    server: serverConfig,
    room: roomConfig,
    monitoring: monitoringConfig,
  };
}

const configs = loadAllConfigs();

/**
 * Export individual config modules for backward compatibility
 */
module.exports = configs.server;
module.exports.serverConfig = configs.server;
module.exports.roomConfig = configs.room;
module.exports.monitoringConfig = configs.monitoring;

// For backward compatibility with old imports
module.exports.port = configs.server.server.port;
module.exports.unixSocketPermissions = configs.server.server.unixSocketPermissions;
module.exports.trustProxy = configs.server.proxy.trustProxy;
module.exports.anonymizeAddresses = configs.server.proxy.anonymizeAddresses;
module.exports.perMessageDeflate = configs.server.websocket.perMessageDeflate;
module.exports.bufferSends = configs.server.performance.bufferSends;
module.exports.enableRename = configs.server.features.enableRename;
module.exports.enableDelete = configs.server.features.enableDelete;
module.exports.anonymizeGeneratedUsernames = configs.server.features.anonymizeGeneratedUsernames;
module.exports.logging = configs.server.logging;
