const assert = require('node:assert/strict');
const { detectEvent } = require('./services/eventService');

function at(year, month, day) {
  return new Date(year, month - 1, day, 12, 0, 0);
}

function assertEventDate(message, referenceDate, expectedDate) {
  const event = detectEvent(message, referenceDate);
  assert.ok(event, `Expected an event for: ${message}`);
  assert.equal(
    event.date.getTime(),
    expectedDate.getTime(),
    `${message} should resolve to the expected future date`,
  );
}

// Monday, 24 August 2026: an unqualified Friday is the coming Friday.
assertEventDate('Let\'s have a meeting regarding event discussion Friday', at(2026, 8, 24), at(2026, 8, 28));

// Friday, 28 August 2026: Monday has passed, so it is next week's Monday.
assertEventDate('Team sync Monday', at(2026, 8, 28), at(2026, 8, 31));

// Other future-relative expressions retain their expected meaning.
const monday = at(2026, 8, 24);
assertEventDate('Review tomorrow', monday, at(2026, 8, 25));
assertEventDate('Planning next week', monday, at(2026, 8, 31));
assertEventDate('Follow up in 2 days', monday, at(2026, 8, 26));

console.log('Event date resolution tests passed.');
