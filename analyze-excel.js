const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'full data', 'Leads DataBase.xlsx');

try {
  console.log('Reading Excel file:', filePath);
  const workbook = XLSX.readFile(filePath);

  console.log('\n=== SHEET NAMES IN LEADS DATABASE.XLSX ===');
  workbook.SheetNames.forEach((name, index) => {
    console.log(`${index + 1}. "${name}"`);
  });

  console.log('\n=== SHEET DETAILS ===');

  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: "${sheetName}" ---`);
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON to see structure
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length > 0) {
      console.log(`Rows: ${data.length}`);
      console.log('Headers (first row):', data[0]);

      if (data.length > 1) {
        console.log('Sample data (second row):', data[1]);
      }

      if (data.length > 2) {
        console.log('Sample data (third row):', data[2]);
      }
    } else {
      console.log('Sheet is empty');
    }
  });

} catch (error) {
  console.error('Error reading Excel file:', error);
}