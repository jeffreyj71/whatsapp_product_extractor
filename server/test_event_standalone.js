const { detectEvent, generateICS } = require('./services/eventService');

const testMessages = [
  "Hey let's meet next Friday at 3pm for the review",
  "Reminder: doctor appointment on 20th August at 10am",
  "just checking in, how's everything going",  // should return null
];

testMessages.forEach((msg) => {
  const result = detectEvent(msg);
  console.log(`\nInput: "${msg}"`);
  console.log('Detected:', result);
  if (result) {
    const ics = generateICS(result);
    console.log('ICS generated:', ics ? 'yes' : 'FAILED');
  }
});