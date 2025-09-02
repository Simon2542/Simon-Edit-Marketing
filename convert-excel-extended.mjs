import XLSX from 'xlsx';
import fs from 'fs';

const excelPath = './marketing_data.xlsm';
console.log('Reading Excel file from:', excelPath);

try {
  const workbook = XLSX.readFile(excelPath);
  console.log('Available sheets:', workbook.SheetNames);
  
  // 读取客户数据
  const clientsSheetName = 'Clients_info（new）';
  console.log('Found clients sheet:', `"${clientsSheetName}"`);
  
  const clientsSheet = workbook.Sheets[clientsSheetName];
  console.log('Original range:', clientsSheet['!ref']);
  
  // 强制扩展范围到850行
  const extendedRange = 'A1:O850';
  console.log('Extending range to:', extendedRange);
  
  const tempSheet = {...clientsSheet};
  tempSheet['!ref'] = extendedRange;
  
  // 检查第815-850行的原始单元格
  console.log('\n检查第815-850行的原始单元格数据:');
  for (let i = 815; i <= 850; i++) {
    const cellA = clientsSheet[`A${i}`];
    const cellB = clientsSheet[`B${i}`];
    const cellC = clientsSheet[`C${i}`];
    
    if (cellA?.v || cellB?.v || cellC?.v) {
      console.log(`行${i}: A=${cellA?.v || 'empty'}, B=${cellB?.v || 'empty'}, C=${cellC?.v || 'empty'}`);
    }
  }
  
  // 使用扩展范围读取数据
  const clientsData = XLSX.utils.sheet_to_json(tempSheet, { 
    raw: false, 
    cellDates: true,
    blankrows: true,
    defval: null
  });
  
  console.log(`\nSuccessfully parsed ${clientsData.length} rows from the clients sheet.`);
  
  // 过滤掉完全空白的行
  const validClientData = clientsData.filter(row => 
    row['No.'] !== null && row['No.'] !== '' && row['No.'] !== undefined
  );
  
  console.log(`Found ${validClientData.length} rows with valid No. values.`);
  
  // 显示最后20行
  console.log('\n最后20行数据:');
  validClientData.slice(-20).forEach((row, index) => {
    const rowNum = validClientData.length - 20 + index + 1;
    console.log(`行${rowNum}: No.${row['No.']}, Broker=${row['Broker']}, Date=${row['Date']}`);
  });
  
  // 检查7月7-13日的数据
  console.log('\n查找7月7-13日的数据:');
  const july7to13Data = validClientData.filter(row => {
    if (!row['Date']) return false;
    const date = new Date(row['Date']);
    return date >= new Date('2025-07-07') && date <= new Date('2025-07-13');
  });
  
  console.log(`找到${july7to13Data.length}条7月7-13日的数据:`);
  july7to13Data.forEach((row, index) => {
    console.log(`  ${index + 1}. No.${row['No.']}, ${row['Broker']}, ${row['Date']}`);
  });
  
  // 转换数据格式
  const processedData = validClientData.map(row => ({
    no: row['No.'],
    broker: row['Broker'],
    date: row['Date'],
    wechat: row['WeChat'],
    source: row['来源']
  }));
  
  // 保存到JSON文件
  const outputPath = './public/broker_data.json';
  fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
  console.log(`\nSuccessfully converted clients data to JSON at: ${outputPath}`);
  
} catch (error) {
  console.error('Error reading Excel file:', error);
}