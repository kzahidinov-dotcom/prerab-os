import fs from 'fs';

const html = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/6955fd78-1c61-40f2-af79-a6908cee37c2/.system_generated/steps/313/content.md', 'utf8');

// Look for FB_PUBLIC_LOAD_DATA_
const match = html.match(/var FB_PUBLIC_LOAD_DATA_ = (\[.+?\]);\n/s) || html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.+?\]);/s);

if (match) {
  try {
    const data = JSON.parse(match[1]);
    console.log('Form Title:', data[1][8] || data[1][0]);
    const items = data[1][1];
    items.forEach((item, idx) => {
      console.log(`\n--- Item ${idx + 1}: ${item[1]} (type: ${item[3]}) ---`);
      if (item[4] && item[4][0] && item[4][0][1]) {
        console.log('Choices:', item[4][0][1].map(c => c[0]));
      }
    });
  } catch (e) {
    console.error('Error parsing JSON:', e.message);
  }
} else {
  console.log('No FB_PUBLIC_LOAD_DATA_ found, looking for text patterns...');
  // regex search for questions
  const questions = html.match(/\[\[\d+,"[^"]+",/g);
  console.log('Matches:', questions);
}
