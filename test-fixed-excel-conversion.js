const brokerData = require('./public/broker_data.json');

function testFixedExcelConversion() {
  const startDate = '2025-07-14';
  const endDate = '2025-07-20';
  
  // Create dates properly to avoid timezone issues
  const startParts = startDate.split('-');
  const endParts = endDate.split('-');
  
  const filterStart = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
  const filterEnd = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
  
  console.log(`Testing FIXED filter logic for ${startDate} to ${endDate}:`);
  console.log('Filter range:');
  console.log('  Start:', filterStart.toDateString());
  console.log('  End:', filterEnd.toDateString());
  
  const filteredData = brokerData.filter((item) => {
    if (!item.date || typeof item.date !== 'number') return false;
    
    // Use CORRECT Excel date conversion
    const excelBase = new Date(1899, 11, 30);
    const itemDate = new Date(excelBase.getTime() + item.date * 24 * 60 * 60 * 1000);
    
    // Create normalized dates for comparison
    const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
    
    return itemDateOnly >= filterStart && itemDateOnly <= filterEnd;
  });
  
  console.log(`Found ${filteredData.length} records`);
  
  if (filteredData.length > 0) {
    console.log('All filtered records:');
    filteredData.forEach(item => {
      const excelBase = new Date(1899, 11, 30);
      const itemDate = new Date(excelBase.getTime() + item.date * 24 * 60 * 60 * 1000);
      const dateStr = itemDate.toISOString().split('T')[0];
      console.log(`  ${item.no} ${item.broker} ${dateStr} (Excel: ${item.date})`);
    });
  }
}

testFixedExcelConversion();