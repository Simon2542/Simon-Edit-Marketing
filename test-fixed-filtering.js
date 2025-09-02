const brokerDataJson = require('./public/broker_data.json');

console.log('测试修复后的时间筛选逻辑');
console.log('数据总数:', brokerDataJson.length);
console.log('');

// 测试6月30日-7月6日筛选
function testDateFiltering(startDate, endDate) {
  console.log(`=== 测试时间范围: ${startDate} 到 ${endDate} ===`);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  const filteredData = brokerDataJson.filter((client) => {
    const clientDate = new Date(client.date);
    const clientDateOnly = new Date(clientDate.getFullYear(), clientDate.getMonth(), clientDate.getDate());
    const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    return clientDateOnly >= startDateOnly && clientDateOnly <= endDateOnly;
  });
  
  console.log('筛选结果数量:', filteredData.length);
  
  // 按日期分组显示
  const dateGroups = {};
  filteredData.forEach(client => {
    const clientDate = new Date(client.date);
    const dateStr = clientDate.toISOString().split('T')[0];
    if (!dateGroups[dateStr]) {
      dateGroups[dateStr] = [];
    }
    dateGroups[dateStr].push(client);
  });
  
  console.log('按日期分组:');
  Object.keys(dateGroups).sort().forEach(date => {
    console.log(`  ${date}: ${dateGroups[date].length} 条记录`);
  });
  
  console.log('');
  return filteredData;
}

// 测试6月30日-7月6日（应该有21条）
const june30toJuly6 = testDateFiltering('2025-06-30', '2025-07-06');

// 测试7月7日-13日（应该有数据）
const july7to13 = testDateFiltering('2025-07-07', '2025-07-13');

console.log('修复验证:');
console.log('6月30日-7月6日数据:', june30toJuly6.length, '条（期望21条）');
console.log('7月7日-13日数据:', july7to13.length, '条（期望有数据）');