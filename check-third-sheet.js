const XLSX = require('xlsx');

const workbook = XLSX.readFile('./marketing_data.xlsm');

console.log('检查第3个工作表:');
console.log('所有工作表:', workbook.SheetNames);

// 第3个工作表 (索引2)
const thirdSheetName = workbook.SheetNames[2];
console.log('第3个工作表名称:', thirdSheetName);

const thirdSheet = workbook.Sheets[thirdSheetName];
console.log('第3个工作表范围:', thirdSheet['!ref']);

// 读取数据
const thirdSheetData = XLSX.utils.sheet_to_json(thirdSheet, { raw: false, cellDates: true });
console.log('第3个工作表数据行数:', thirdSheetData.length);

if (thirdSheetData.length > 0) {
  console.log('第3个工作表列名:', Object.keys(thirdSheetData[0]));
  console.log('前5行数据:');
  thirdSheetData.slice(0, 5).forEach((row, index) => {
    console.log(`行${index + 1}:`, row);
  });
}

// 检查第2列数据
console.log('\n第2列数据检查:');
const secondColumnKey = Object.keys(thirdSheetData[0])[1]; // 第2列
console.log('第2列列名:', secondColumnKey);

thirdSheetData.slice(0, 10).forEach((row, index) => {
  const value = row[secondColumnKey];
  const audValue = parseFloat(value) / 4.72;
  console.log(`行${index + 1}: ${secondColumnKey}=${value}, AUD=${audValue.toFixed(2)}`);
});