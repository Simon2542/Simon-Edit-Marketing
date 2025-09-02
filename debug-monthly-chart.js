const monthlyDataJson = require('./public/monthly_data.json');

console.log('Monthly Chart数据调试:');
console.log('原始数据:', monthlyDataJson);

// 模拟组件中的数据处理逻辑
const extendedData = [
  ...monthlyDataJson,
  { month: "2024/09", cost: 0, count: 4, avgCost: 0 },
  { month: "2024/12", cost: 0, count: 27, avgCost: 0 }
];

console.log('\n扩展后的数据:', extendedData);

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

console.log('\n图表数据:', chartData);

console.log('\n2024年数据:');
const year2024 = chartData.find(d => d.year === '2024');
if (year2024) {
  console.log('2024:', year2024);
  console.log('2024年9月:', year2024.Sep);
  console.log('2024年10月:', year2024.Oct);
  console.log('2024年11月:', year2024.Nov);
  console.log('2024年12月:', year2024.Dec);
}

console.log('\n2025年数据:');
const year2025 = chartData.find(d => d.year === '2025');
if (year2025) {
  console.log('2025:', year2025);
  console.log('2025年1月:', year2025.Jan);
  console.log('2025年2月:', year2025.Feb);
  console.log('2025年3月:', year2025.Mar);
  console.log('2025年4月:', year2025.Apr);
  console.log('2025年5月:', year2025.May);
  console.log('2025年6月:', year2025.Jun);
  console.log('2025年7月:', year2025.Jul);
} else {
  console.log('2025年数据缺失!');
}