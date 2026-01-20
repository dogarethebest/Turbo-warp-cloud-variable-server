// This file contains words that some may find disturbing.
const naughty = require('../naughty');

describe('naughty word detector', () => {
  test('basic detection', () => {
    
    expect(naughty('iloveceebee')).toBe(false);
    expect(naughty('')).toBe(false);
    expect(naughty(' ')).toBe(false);
    expect(naughty('123')).toBe(false);
    expect(naughty('@#$%')).toBe(false);
  });

  test('temporary banned usernames', () => {
    expect(naughty('four_unit_test_456')).toBe(true); // currently banned
    console.log('Note: "four_unit_test_456" is banned until 2028-01-25 15:00');
    console.log('This test will need to be updated after that date.');
    expect(naughty('SafeUser')).toBe(false);// safe
  });

  test('metrics', () => {
    expect(naughty.getTotalBlockedPhrases()).toBeGreaterThan(0);
    expect(naughty.getTotalFilterLists()).toBeGreaterThan(0);
  });
});