const sheetUrl = "https://docs.google.com/spreadsheets/d/1rT1tTCDIn39nAhk1vfbz5g4aGLNuknR78v3NrQFn5rk/export?format=csv&gid=1035036129";

async function analyze() {
  const res = await fetch(sheetUrl);
  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  console.log('Total rows:', lines.length);
  console.log('Header line:', lines[0]);
  console.log('Sample row 1:', lines[1]);
  console.log('Sample row 2:', lines[2]);
  console.log('Sample row 3:', lines[3]);
  console.log('Sample row 4:', lines[4]);
  console.log('Last row:', lines[lines.length - 1]);
}

analyze();
