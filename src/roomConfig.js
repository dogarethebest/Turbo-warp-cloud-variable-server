const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Load room configuration from JSON file
 * @returns {object} Configuration object with defaults
 */
function loadRoomConfig() {
  const configPath = path.join(__dirname, '../configuration/room.json');

  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      logger.info('Loaded room configuration from ' + configPath);
      return config;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Failed to load room configuration: ' + errorMessage);
  }

  // Return defaults if file doesn't exist or fails to parse
  return {
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
}

const roomConfig = loadRoomConfig();

module.exports = roomConfig;
