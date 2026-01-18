const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Default configuration for rooms
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
 * Validate room configuration object
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
 * Load room configuration from JSON file
 * Falls back to defaults if file is missing or invalid
 * @returns {object} Configuration object with defaults
 */
function loadRoomConfig() {
  const configPath = path.join(__dirname, '../configuration/room.json');

  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (isValidRoomConfig(config)) {
        logger.info('✓ Loaded room configuration from ' + configPath);
        return config;
      } else {
        logger.warn('⚠ Room configuration is invalid (missing required fields). Using defaults.');
      }
    } else {
      logger.info('ℹ Room configuration file not found. Using defaults.');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof SyntaxError) {
      logger.warn('⚠ Room configuration JSON syntax error: ' + errorMessage + '. Using defaults.');
    } else {
      logger.warn('⚠ Failed to load room configuration: ' + errorMessage + '. Using defaults.');
    }
  }

  logger.info('Using default room configuration: maxRooms=' + DEFAULT_ROOM_CONFIG.limits.maxRooms + 
    ', maxClientsPerRoom=' + DEFAULT_ROOM_CONFIG.limits.maxClientsPerRoom + 
    ', maxVariablesPerRoom=' + DEFAULT_ROOM_CONFIG.limits.maxVariablesPerRoom);
  
  return DEFAULT_ROOM_CONFIG;
}

const roomConfig = loadRoomConfig();

module.exports = roomConfig;
