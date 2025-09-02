const monthlyDataJson = require('./public/monthly_data.json');

console.log('月度数据检查:');
console.log('数据长度:', monthlyDataJson.length);
console.log('');

console.log('所有月度数据:');
monthlyDataJson.forEach((item, index) => {
  console.log(`${index + 1}. ${item.month}: 成本=$${item.cost}, 数量=${item.count}, 平均成本=$${item.avgCost.toFixed(2)}`);
});

console.log('');
console.log('数据格式检查:');
console.log('第一条数据:', JSON.stringify(monthlyDataJson[0], null, 2));

// 检查是否有无效数据
console.log('');
console.log('数据有效性检查:');
const invalidData = monthlyDataJson.filter(item => 
  !item.month || 
  isNaN(item.cost) || 
  isNaN(item.count) || 
  isNaN(item.avgCost)
);
console.log('无效数据条数:', invalidData.length);
if (invalidData.length > 0) {
  console.log('无效数据:', invalidData);
}

// 检查数据范围
console.log('');
console.log('数据范围:');
const costs = monthlyDataJson.map(item => item.cost);
const counts = monthlyDataJson.map(item => item.count);
const avgCosts = monthlyDataJson.map(item => item.avgCost);

console.log('成本范围:', Math.min(...costs), '到', Math.max(...costs));
console.log('数量范围:', Math.min(...counts), '到', Math.max(...counts));
console.log('平均成本范围:', Math.min(...avgCosts).toFixed(2), '到', Math.max(...avgCosts).toFixed(2));