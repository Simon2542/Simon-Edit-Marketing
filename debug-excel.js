const XLSX = require('xlsx');
const path = require('path');

try {
  const filePath = path.join(__dirname, 'marketing_data.xlsm');
  console.log('Reading file:', filePath);
  
  const workbook = XLSX.readFile(filePath);
  console.log('Available sheets:', workbook.SheetNames);
  
  // Check each sheet
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\nSheet: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`Rows: ${data.length}`);
    if (data.length > 0) {
      console.log('First row (headers):', data[0]);
    }
  });
  
} catch (error) {
  console.error('Error reading Excel file:', error);
}