const XLSX = require('xlsx');

const workbook = XLSX.readFile('./marketing_data.xlsm');
const clientsSheet = workbook.Sheets['Clients_info（new）'];

console.log('Excel文件范围检查:');
console.log('工作表范围:', clientsSheet['!ref']);

const range = XLSX.utils.decode_range(clientsSheet['!ref']);
console.log('开始行:', range.s.r);
console.log('结束行:', range.e.r);
console.log('总行数:', range.e.r - range.s.r + 1);

// 检查第810-850行的原始单元格数据
console.log('\n检查第810-850行的原始单元格数据:');
for (let i = 810; i <= 850; i++) {
  const cellA = clientsSheet[`A${i}`];
  const cellB = clientsSheet[`B${i}`];
  const cellC = clientsSheet[`C${i}`];
  
  if (cellA?.v || cellB?.v || cellC?.v) {
    console.log(`行${i}: A=${cellA?.v || 'empty'}, B=${cellB?.v || 'empty'}, C=${cellC?.v || 'empty'}`);
  }
}

// 使用不同的读取选项
console.log('\n使用不同读取选项:');

// 1. 包含空行
const dataWithBlanks = XLSX.utils.sheet_to_json(clientsSheet, { 
  raw: false, 
  cellDates: true, 
  blankrows: true,
  defval: '' 
});
console.log('包含空行的数据行数:', dataWithBlanks.length);

// 2. 原始数据
const rawData = XLSX.utils.sheet_to_json(clientsSheet, { 
  raw: true, 
  cellDates: false 
});
console.log('原始数据行数:', rawData.length);

// 3. 手动设置范围
if (range.e.r >= 835) {
  console.log('尝试手动设置范围到835行...');
  const manualRange = `A1:E${Math.max(835, range.e.r)}`;
  const tempSheet = {...clientsSheet};
  tempSheet['!ref'] = manualRange;
  
  const manualData = XLSX.utils.sheet_to_json(tempSheet, { 
    raw: false, 
    cellDates: true,
    blankrows: true 
  });
  console.log('手动设置范围后的数据行数:', manualData.length);
  
  // 检查最后几行
  console.log('\n最后20行数据:');
  manualData.slice(-20).forEach((row, index) => {
    const rowNum = manualData.length - 20 + index + 1;
    console.log(`行${rowNum + 1}: No.${row['No.'] || 'empty'}, Broker=${row['Broker'] || 'empty'}, Date=${row['Date'] || 'empty'}`);
  });
}