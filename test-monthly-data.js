const monthlyDataJson = require('./public/monthly_data.json');

console.log('更新后的月度数据检查:');
console.log('数据长度:', monthlyDataJson.length);
console.log('');

console.log('所有月度数据:');
monthlyDataJson.forEach((item, index) => {
  console.log(`${index + 1}. ${item.month}: 消费金额=$${item.cost}, 数量=${item.count}`);
});

console.log('');
console.log('数据格式检查:');
console.log('第一条数据:', JSON.stringify(monthlyDataJson[0], null, 2));
console.log('最后一条数据:', JSON.stringify(monthlyDataJson[monthlyDataJson.length - 1], null, 2));

// 检查数据范围
console.log('');
console.log('数据范围:');
const costs = monthlyDataJson.map(item => item.cost);
const counts = monthlyDataJson.map(item => item.count);

console.log('消费金额范围:', Math.min(...costs), '到', Math.max(...costs));
console.log('数量范围:', Math.min(...counts), '到', Math.max(...counts));

// 检查9月和10月的数据
console.log('');
console.log('9月和10月数据检查:');
const sep2024 = monthlyDataJson.find(item => item.month === '2024/09');
const oct2024 = monthlyDataJson.find(item => item.month === '2024/10');
console.log('2024/09:', sep2024);
console.log('2024/10:', oct2024);