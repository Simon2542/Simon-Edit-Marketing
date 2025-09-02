const monthlyDataJson = require('./public/monthly_data.json');

console.log('修复后的Monthly Chart数据调试:');

// 使用修复后的逻辑（不重复扩展数据）
const extendedData = monthlyDataJson;

console.log('数据条数:', extendedData.length);
console.log('原始数据:', extendedData);

const chartData = extendedData.reduce((acc, item) => {
  const [year, month] = item.month.split('/');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const monthName = monthNames[parseInt(month) - 1];
  
  let yearData = acc.find(d => d.year === year);
  if (!yearData) {
    yearData = { 
      year, 
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };
    acc.push(yearData);
  }
  
  yearData[monthName] = item.count;
  
  return acc;
}, []);

chartData.sort((a, b) => parseInt(a.year) - parseInt(b.year));

console.log('\n最终图表数据:');
chartData.forEach(yearData => {
  console.log(`${yearData.year}年:`, yearData);
  
  // 统计该年度的数据
  const monthsWithData = Object.keys(yearData).filter(key => key !== 'year' && yearData[key] > 0);
  console.log(`  有数据的月份: ${monthsWithData.join(', ')}`);
  const totalLeads = Object.keys(yearData).reduce((sum, key) => {
    if (key !== 'year') {
      return sum + yearData[key];
    }
    return sum;
  }, 0);
  console.log(`  总leads: ${totalLeads}`);
  console.log('');
});

console.log('解释那个 "31 4 4":');
console.log('- 2024年12月: 27 leads');
console.log('- 2024年9月: 4 leads');
console.log('- 如果看到31和4，可能是显示bug或数据重复问题');
console.log('');
console.log('期望的柱状图结构:');
console.log('- 2024年的柱子应该显示：9月(4), 10月(57), 11月(124), 12月(27)');
console.log('- 2025年的柱子应该显示：1月(71), 2月(88), 3月(104), 4月(115), 5月(113), 6月(95), 7月(16)');