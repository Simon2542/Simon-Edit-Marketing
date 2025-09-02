const brokerData = require('./public/broker_data.json');

// Test July 14-20 filtering with corrected Excel conversion
const startDate = '2025-07-14';
const endDate = '2025-07-20';

const startParts = startDate.split('-');
const endParts = endDate.split('-');

const filterStart = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
const filterEnd = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));

const filteredData = brokerData.filter((item) => {
  if (!item.date || typeof item.date !== 'number') return false;
  
  const excelBase = new Date(1899, 11, 30);
  const itemDate = new Date(excelBase.getTime() + item.date * 24 * 60 * 60 * 1000);
  const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
  
  return itemDateOnly >= filterStart && itemDateOnly <= filterEnd;
});

console.log('July 14-20 filtered results:', filteredData.length, 'records');
if (filteredData.length > 0) {
  console.log('Date range in filtered data:');
  const dates = filteredData.map(item => {
    const excelBase = new Date(1899, 11, 30);
    const itemDate = new Date(excelBase.getTime() + item.date * 24 * 60 * 60 * 1000);
    return itemDate.toISOString().split('T')[0];
  });
  const uniqueDates = [...new Set(dates)].sort();
  console.log('  Dates:', uniqueDates.join(', '));
  
  console.log('Sample records:');
  filteredData.slice(0, 5).forEach(item => {
    const excelBase = new Date(1899, 11, 30);
    const itemDate = new Date(excelBase.getTime() + item.date * 24 * 60 * 60 * 1000);
    const dateStr = itemDate.toISOString().split('T')[0];
    console.log(`  ${item.no} ${item.broker} ${dateStr}`);
  });
}