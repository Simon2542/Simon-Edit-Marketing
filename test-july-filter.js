const brokerData = require('./public/broker_data.json');

function testJulyFilter() {
  const startDate = '2025-07-14';
  const endDate = '2025-07-20';
  
  const filterStart = new Date(startDate);
  const filterEnd = new Date(endDate);
  filterEnd.setHours(23, 59, 59, 999);
  
  const filteredData = brokerData.filter((item) => {
    if (!item.date) return false;
    
    // Convert Excel date serial number to JavaScript Date
    let itemDate;
    if (typeof item.date === 'number') {
      const excelEpoch = new Date(1900, 0, 1).getTime() - 2 * 24 * 60 * 60 * 1000;
      itemDate = new Date(excelEpoch + (item.date - 1) * 24 * 60 * 60 * 1000);
    } else {
      itemDate = new Date(item.date);
    }
    
    // 规范化到同一天的开始时间进行比较
    const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
    const startDateOnly = new Date(filterStart.getFullYear(), filterStart.getMonth(), filterStart.getDate());
    const endDateOnly = new Date(filterEnd.getFullYear(), filterEnd.getMonth(), filterEnd.getDate());
    
    return itemDateOnly >= startDateOnly && itemDateOnly <= endDateOnly;
  });
  
  console.log(`Filtering for ${startDate} to ${endDate}:`);
  console.log(`Found ${filteredData.length} records`);
  
  if (filteredData.length > 0) {
    console.log('Sample records:');
    filteredData.slice(0, 5).forEach(item => {
      let dateStr;
      if (typeof item.date === 'number') {
        const excelEpoch = new Date(1900, 0, 1).getTime() - 2 * 24 * 60 * 60 * 1000;
        dateStr = new Date(excelEpoch + (item.date - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else {
        dateStr = new Date(item.date).toISOString().split('T')[0];
      }
      console.log(`  ${item.no} ${item.broker} ${dateStr}`);
    });
  }
}

testJulyFilter();