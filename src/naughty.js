const fs = require('fs');
const pathUtil = require('path');

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

  if (isCode) {
    // Extract code inside <code>...</code> tags (compatible with older TS/JS targets)
    const codeBlocks = [];
    const regex = /<code>([\s\S]*?)<\/code>/gi;
    let match;
    while ((match = regex.exec(contents)) !== null) {
      codeBlocks.push(match);
    }

    for (const block of codeBlocks) {
      try {
        // Cast to a proper filter type to satisfy TypeScript
        const filterFunc = /** @type {(text: string) => boolean} */ (new Function('text', block[1]));
        FILTERS.push(filterFunc);
      } catch (err) {
        console.error(`Error loading code filter "${name}":`, err);
      }
    }
  } else {
    contents.split('\n')
      .map(i => i.trim())
      .filter(i => i && !i.startsWith('#'))
      .map(i => new RegExp(i, 'i'))
      .forEach(regex => FILTERS.push(text => regex.test(text)));
  }
}
/**
 * Return whether a file should be read as a filter list.
 * @param {string} fileName 
 */
function isFilterList(fileName) {
  return fileName.endsWith('.filter') || fileName.endsWith('.jsfilter');
}

/**
 * Load all filters from the filters directory.
 */
function loadFilters() {
  const FILTER_DIRECTORY = pathUtil.join(__dirname, 'filters');
  const filterFiles = fs.readdirSync(FILTER_DIRECTORY).filter(isFilterList);

  for (const fileName of filterFiles) {
    const fullPath = pathUtil.join(FILTER_DIRECTORY, fileName);
    const contents = fs.readFileSync(fullPath, 'utf8');
    loadFilter(fileName, contents, fileName.endsWith('.jsfilter'));
  }
}

/**
 * Determine whether a given string of text is naughty.
 * @param {string} text
 * @returns {boolean}
 */
function naughty(text) {
  // Remove non-alphanumerics
  const cleaned = text.replace(/[^a-z0-9]/gi, '');

  for (const filter of FILTERS) {
    if (filter(cleaned)) return true;
  }
  return false;
}

naughty.getTotalBlockedPhrases = () => FILTERS.length;
naughty.getTotalFilterLists = () => LOADED_FILTERS.length;

loadFilters();

module.exports = naughty;