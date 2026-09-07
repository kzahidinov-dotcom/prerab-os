const sheetUrl = "https://docs.google.com/spreadsheets/d/1rT1tTCDIn39nAhk1vfbz5g4aGLNuknR78v3NrQFn5rk/export?format=csv&gid=1035036129";

// Simple CSV line parser handling quoted values with commas
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseAmount(val) {
  if (!val) return 0;
  const clean = val.replace(/\s+/g, '').replace('€', '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

async function run() {
  const res = await fetch(sheetUrl);
  const text = await res.text();
  const rawLines = text.split('\n').filter(l => l.trim().length > 0);
  
  console.log(`Fetched ${rawLines.length} lines from Google Sheet`);

  const headers = parseCsvLine(rawLines[0]);

  const projectsMap = {};
  const expensesList = [];
  const incomeList = [];

  for (let i = 1; i < rawLines.length; i++) {
    const row = parseCsvLine(rawLines[i]);
    if (!row || row.length < 5) continue;

    const timestamp = row[0] || '';
    const date = row[1] || '';
    const author = row[2] || '';

    // Consolidated columns or direct columns
    // Columns 30-35 are aggregated summary:
    // [30]: Об'єкт (зведено), [31]: Категорія (зведено), [32]: Сума (зведено), [33]: Тип операції (зведено), [34]: Спосіб оплати (зведено), [35]: Опис (зведено)
    let project = row[30] || row[3] || row[11] || row[23] || row[28] || '';
    let category = row[31] || row[4] || row[13] || row[18] || row[22] || row[27] || 'Інше';
    let amount = parseAmount(row[32]) || parseAmount(row[6]) || parseAmount(row[14]) || parseAmount(row[19]) || parseAmount(row[24]) || parseAmount(row[29]);
    let type = row[33] || row[5] || (category.toLowerCase().includes('дохід') || category.toLowerCase().includes('аванс') ? 'Дохід' : 'Витрата');
    let paymentMethod = row[34] || row[7] || row[16] || row[20] || row[25] || '';
    let description = row[35] || row[8] || row[17] || row[21] || row[26] || '';

    if (!amount && !description) continue;

    // Normalize project name
    project = project.trim();
    if (!project || project === '-' || project.toLowerCase() === 'загальні') {
      project = 'Загальні витрати фірми';
    }

    if (!projectsMap[project]) {
      projectsMap[project] = {
        name: project,
        totalIncome: 0,
        totalExpenses: 0,
        expenseCount: 0,
        incomeCount: 0,
      };
    }

    const isIncome = type.toLowerCase().includes('дохід') || category.toLowerCase().includes('аванс') || category.toLowerCase().includes('дохід');

    if (isIncome) {
      projectsMap[project].totalIncome += amount;
      projectsMap[project].incomeCount++;
      incomeList.push({
        date: date || timestamp.split(' ')[0] || '2026-08-25',
        project,
        amount,
        paymentMethod,
        description: description || category,
        author,
      });
    } else {
      projectsMap[project].totalExpenses += amount;
      projectsMap[project].expenseCount++;
      expensesList.push({
        date: date || timestamp.split(' ')[0] || '2026-08-25',
        project,
        category,
        amount,
        paymentMethod,
        description,
        author,
      });
    }
  }

  console.log('\n--- DETECTED PROJECTS & SUMMARY ---');
  Object.keys(projectsMap).forEach(pKey => {
    const p = projectsMap[pKey];
    const margin = p.totalIncome - p.totalExpenses;
    console.log(`\n• [${p.name}]`);
    console.log(`  Доход (Оплаты): ${p.totalIncome.toFixed(2)} € (${p.incomeCount} операций)`);
    console.log(`  Расходы (Чеки): ${p.totalExpenses.toFixed(2)} € (${p.expenseCount} операций)`);
    console.log(`  Текущая маржа: ${margin.toFixed(2)} €`);
  });

  console.log(`\nTotal Expenses parsed: ${expensesList.length}`);
  console.log(`Total Incomes parsed: ${incomeList.length}`);
}

run();
