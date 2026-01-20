const fs = require('fs');
const pathUtil = require('path');

const LOG_DIR = pathUtil.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  fs.appendFileSync(pathUtil.join(LOG_DIR, 'naughty.log'), line);
  console.log(line.trim());
}

/**
 * A list of the names of the loaded filters.
 * @type {string[]}
 */
const LOADED_FILTERS = [];

/**
 * A list of filter functions.
 * Each filter function should take a string and return true if it's naughty.
 * @type {Array<(text: string) => boolean>}
 */
const FILTERS = [];

/**
 * Load a filter from contents.
 * @param {string} name The name of the filter file
 * @param {string} contents The file contents
 * @param {boolean} isCode Whether this is a JS code filter
 */
function loadFilter(name, contents, isCode = false) {
  LOADED_FILTERS.push(name);
  log(`Loading filter: ${name} (isCode: ${isCode})`);

  if (isCode) {
    const codeBlocks = [];
    const regex = /<code>([\s\S]*?)<\/code>/gi;
    let match;
    while ((match = regex.exec(contents)) !== null) {
      codeBlocks.push(match[1]);
    }

    for (const block of codeBlocks) {
      try {
        // Create a raw function from the code block
        const rawFunc = new Function('text', block);
        // Wrap it to guarantee boolean output and catch runtime errors
        const filterFunc = function(text) {
          try {
            return Boolean(rawFunc(text));
          } catch (err) {
            log(`Error in JS filter "${name}" execution: ${err}`);
            return false;
          }
        };
        FILTERS.push(filterFunc);
        log(`Loaded JS filter from ${name}`);
      } catch (err) {
        log(`Error loading JS filter "${name}": ${err}`);
        console.error(err);
      }
    }
  } else {
    contents.split('\n')
      .map(i => i.trim())
      .filter(i => i && !i.startsWith('#'))
      .map(i => new RegExp(i, 'i'))
      .forEach(regex => {
        FILTERS.push(function(txt) { return regex.test(txt); });
        log(`Loaded regex filter from ${name}: ${regex}`);
      });
  }
}

/**
 * Return whether a file should be read as a filter list.
 * @param {string} fileName 
 */
function isFilterList(fileName) {
  const result = fileName.endsWith('.filter') || fileName.endsWith('.jsfilter');
  log(`Checking if file is filter: ${fileName} => ${result}`);
  return result;
}

/**
 * Load all filters from the filters directory.
 */
function loadFilters() {
  const FILTER_DIRECTORY = pathUtil.join(__dirname, 'filters');
  log(`Loading filters from directory: ${FILTER_DIRECTORY}`);

  const filterFiles = fs.readdirSync(FILTER_DIRECTORY).filter(isFilterList);
  log(`Found filter files: ${filterFiles.join(', ')}`);

  for (const fileName of filterFiles) {
    const fullPath = pathUtil.join(FILTER_DIRECTORY, fileName);
    const contents = fs.readFileSync(fullPath, 'utf8');
    log(`Reading filter file: ${fileName}`);
    loadFilter(fileName, contents, fileName.endsWith('.jsfilter'));
  }

  log(`Total filters loaded: ${FILTERS.length}`);
}

/**
 * Determine whether a given string of text is naughty.
 * @param {string} text
 * @returns {boolean}
 */
function naughty(text) {
  log(`Checking text: "${text}"`);
  for (const filter of FILTERS) {
    try {
      if (filter(text)) {
        log(`Text matched a filter: "${text}"`);
        return true;
      }
    } catch (err) {
      log(`Error running filter on text "${text}": ${err}`);
      console.error(err);
    }
  }
  log(`Text passed all filters: "${text}"`);
  return false;
}

naughty.getTotalBlockedPhrases = () => FILTERS.length;
naughty.getTotalFilterLists = () => LOADED_FILTERS.length;

loadFilters();

module.exports = naughty;