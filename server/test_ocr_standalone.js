const { extractText } = require('./services/ocrService');

(async () => {
  const imagePath = "C:\\Users\\DELL-L5420\\Downloads\\hotel.jpg"; // ← point this at your actual test image
  console.time('ocr');
  const text = await extractText(imagePath);
  console.timeEnd('ocr');
  console.log('--- Extracted text ---');
  console.log(text || '(empty — nothing passed the confidence/length threshold)');
  process.exit(0);
})();