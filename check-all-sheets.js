const XLSX = require('xlsx');

const workbook = XLSX.readFile('./marketing_data.xlsm');

console.log('检查所有工作表:');
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== 工作表: ${sheetName} ===`);
  const sheet = workbook.Sheets[sheetName];
  console.log('范围:', sheet['!ref']);
  
  if (sheetName.includes('Clients')) {
    const range = XLSX.utils.decode_range(sheet['!ref']);
    console.log('总行数:', range.e.r - range.s.r + 1);
    
    // 检查是否有7月7-13日的数据
    const data = XLSX.utils.sheet_to_json(sheet, { raw: false, cellDates: true });
    console.log('数据行数:', data.length);
    
    const july7to13 = data.filter(row => {
      if (!row['Date']) return false;
      const date = new Date(row['Date']);
      return date >= new Date('2025-07-07') && date <= new Date('2025-07-13');
    });
    
    console.log('7月7-13日数据:', july7to13.length, '条');
    
    if (july7to13.length > 0) {
      console.log('找到的数据:');
      july7to13.forEach((row, index) => {
        console.log(`  ${index + 1}. No.${row['No.']}, ${row['Broker']}, ${row['Date']}`);
      });
    }
  }
});

// 检查文件修改时间
const fs = require('fs');
const stats = fs.statSync('./marketing_data.xlsm');
console.log('\nExcel文件最后修改时间:', stats.mtime);