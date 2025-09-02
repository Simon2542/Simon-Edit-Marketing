const XLSX = require('xlsx');
const workbook = XLSX.readFile('./marketing_data.xlsm');
const clientsSheet = workbook.Sheets['Clients_info（new）'];
const clientsData = XLSX.utils.sheet_to_json(clientsSheet, { raw: false, cellDates: true });

console.log('Excel文件中的总行数:', clientsData.length);
console.log('');

// 检查第816-835行的数据
console.log('第816-835行数据检查:');
if (clientsData.length >= 835) {
  const targetRows = clientsData.slice(815, 835); // 数组索引从0开始，所以815-834对应第816-835行
  targetRows.forEach((row, index) => {
    console.log(`行${816 + index}: No.${row['No.']}, ${row['Broker']}, ${row['Date']}`);
  });
} else {
  console.log('数据不够835行，实际只有', clientsData.length, '行');
  console.log('显示最后20行:');
  clientsData.slice(-20).forEach((row, index) => {
    console.log(`行${clientsData.length - 20 + index + 1}: No.${row['No.']}, ${row['Broker']}, ${row['Date']}`);
  });
}
console.log('');

// 检查6月30日-7月6日的数据
console.log('6月30日-7月6日数据检查:');

// 先找出6月30日和7月1-6日的数据
const june30Data = clientsData.filter(row => {
  if (!row['Date']) return false;
  const date = new Date(row['Date']);
  return date.getFullYear() === 2025 && date.getMonth() === 5 && date.getDate() === 30;
});

const july1to6Data = clientsData.filter(row => {
  if (!row['Date']) return false;
  const date = new Date(row['Date']);
  return date.getFullYear() === 2025 && date.getMonth() === 6 && date.getDate() >= 1 && date.getDate() <= 6;
});

console.log('6月30日数据条数:', june30Data.length);
console.log('7月1-6日数据条数:', july1to6Data.length);
console.log('总计应该有:', june30Data.length + july1to6Data.length, '条数据');

// 合并显示
const allData = [...june30Data, ...july1to6Data];
console.log('6月30日-7月6日所有数据:');
allData.forEach((row, index) => {
  console.log(`  ${index + 1}. No.${row['No.']}, ${row['Broker']}, ${row['Date']}`);
});
console.log('');

// 检查7月7日-13日的数据
console.log('7月7日-13日数据检查:');
const july7to13 = clientsData.filter(row => {
  if (!row['Date']) return false;
  const date = new Date(row['Date']);
  const start = new Date('2025-07-07');
  const end = new Date('2025-07-13');
  return date >= start && date <= end;
});

console.log('找到的7月7日-13日数据条数:', july7to13.length);
july7to13.forEach((row, index) => {
  console.log(`  ${index + 1}. No.${row['No.']}, ${row['Broker']}, ${row['Date']}`);
});
console.log('');

// 检查所有7月份的数据
console.log('所有7月份数据:');
const allJuly = clientsData.filter(row => {
  if (!row['Date']) return false;
  const date = new Date(row['Date']);
  return date.getFullYear() === 2025 && date.getMonth() === 6; // 7月是index 6
});

console.log('7月份总数据条数:', allJuly.length);
allJuly.forEach((row, index) => {
  console.log(`  ${index + 1}. No.${row['No.']}, ${row['Broker']}, ${row['Date']}`);
});

// 检查数据完整性
console.log('');
console.log('数据完整性检查:');
console.log('最后一行数据:', clientsData[clientsData.length - 1]);
console.log('是否有空白行或未读取的数据...');

// 检查原始worksheet数据
console.log('');
console.log('原始工作表信息:');
const range = XLSX.utils.decode_range(clientsSheet['!ref']);
console.log('工作表范围:', clientsSheet['!ref']);
console.log('行数范围:', range.s.r, 'to', range.e.r);
console.log('实际数据行数:', range.e.r - range.s.r);

// 尝试不同的读取方式
console.log('');
console.log('尝试不同的读取方式:');
const clientsDataWithHeader = XLSX.utils.sheet_to_json(clientsSheet, { raw: false, cellDates: true, header: 1 });
console.log('包含头部的原始数据行数:', clientsDataWithHeader.length);

// 检查原始单元格数据
console.log('');
console.log('检查原始单元格数据（第815-820行）:');
for (let i = 815; i <= 820; i++) {
  const cellA = clientsSheet[`A${i}`];
  const cellB = clientsSheet[`B${i}`];
  const cellC = clientsSheet[`C${i}`];
  console.log(`行${i}: A=${cellA?.v || 'empty'}, B=${cellB?.v || 'empty'}, C=${cellC?.v || 'empty'}`);
}

// 检查没有筛选的原始数据读取
console.log('');
console.log('使用不同选项读取数据:');
const clientsDataRaw = XLSX.utils.sheet_to_json(clientsSheet, { raw: true, cellDates: false });
console.log('原始数据（不转换日期）行数:', clientsDataRaw.length);

const clientsDataDefRange = XLSX.utils.sheet_to_json(clientsSheet, { raw: false, cellDates: true, defval: '', blankrows: true });
console.log('包含空白行的数据行数:', clientsDataDefRange.length);

// 检查6月30日数据（应该有6月30日的数据）
console.log('');
console.log('检查6月30日数据:');
const june30Data = clientsData.filter(row => {
  if (!row['Date']) return false;
  const date = new Date(row['Date']);
  return date.getFullYear() === 2025 && date.getMonth() === 5 && date.getDate() === 30; // 6月30日
});
console.log('6月30日数据条数:', june30Data.length);
june30Data.forEach((row, index) => {
  console.log(`  ${index + 1}. No.${row['No.']}, ${row['Broker']}, ${row['Date']}`);
});