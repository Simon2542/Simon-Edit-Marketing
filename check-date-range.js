const XLSX = require('xlsx');
const workbook = XLSX.readFile('./marketing_data.xlsm');
const clientsSheet = workbook.Sheets['Clients_info（new）'];
const clientsData = XLSX.utils.sheet_to_json(clientsSheet, { raw: false, cellDates: true });

console.log('Excel文件中的总行数:', clientsData.length);
console.log('');

// 基本信息检查
console.log('工作表范围:', clientsSheet['!ref']);
console.log('');

// 检查6月30日-7月6日的数据
console.log('=== 6月30日-7月6日数据检查 ===');

// 先找出6月30日的数据
const june30Data = clientsData.filter(row => {
  if (!row['Date']) return false;
  const date = new Date(row['Date']);
  return date.getFullYear() === 2025 && date.getMonth() === 5 && date.getDate() === 30;
});

// 找出7月1-6日的数据
const july1to6Data = clientsData.filter(row => {
  if (!row['Date']) return false;
  const date = new Date(row['Date']);
  return date.getFullYear() === 2025 && date.getMonth() === 6 && date.getDate() >= 1 && date.getDate() <= 6;
});

console.log('6月30日数据条数:', june30Data.length);
console.log('7月1-6日数据条数:', july1to6Data.length);
console.log('总计应该有:', june30Data.length + july1to6Data.length, '条数据');

// 合并显示
const allWeekData = [...june30Data, ...july1to6Data];
console.log('6月30日-7月6日所有数据:');
allWeekData.forEach((row, index) => {
  console.log(`  ${index + 1}. No.${row['No.']}, ${row['Broker']}, ${row['Date']}`);
});

// 检查当前筛选逻辑的问题
console.log('');
console.log('=== 当前筛选逻辑测试 ===');
const currentLogic = clientsData.filter(row => {
  if (!row['Date']) return false;
  const date = new Date(row['Date']);
  const start = new Date('2025-06-30');
  const end = new Date('2025-07-06');
  return date >= start && date <= end;
});

console.log('使用当前逻辑筛选的数据条数:', currentLogic.length);
console.log('差异:', allWeekData.length - currentLogic.length, '条数据');

// 找出差异的原因
console.log('');
console.log('=== 调试时间比较 ===');
console.log('筛选范围: 2025-06-30 到 2025-07-06');

// 检查6月30日的数据为什么被排除
june30Data.forEach(row => {
  const date = new Date(row['Date']);
  const start = new Date('2025-06-30');
  const end = new Date('2025-07-06');
  console.log(`${row['No.']}: ${row['Date']} -> ${date.toISOString()}`);
  console.log(`  start: ${start.toISOString()}`);
  console.log(`  end: ${end.toISOString()}`);
  console.log(`  date >= start: ${date >= start}`);
  console.log(`  date <= end: ${date <= end}`);
  console.log(`  included: ${date >= start && date <= end}`);
  console.log('');
});

// 检查是否有额外的数据
console.log('=== 检查可能的额外数据 ===');
console.log('检查是否Excel文件需要重新保存...');

// 检查原始单元格数据的更多行
console.log('检查第816-825行的原始单元格数据:');
for (let i = 816; i <= 825; i++) {
  const cellA = clientsSheet[`A${i}`];
  const cellB = clientsSheet[`B${i}`];
  const cellC = clientsSheet[`C${i}`];
  if (cellA?.v || cellB?.v || cellC?.v) {
    console.log(`行${i}: A=${cellA?.v || 'empty'}, B=${cellB?.v || 'empty'}, C=${cellC?.v || 'empty'}`);
  }
}