const brokerData = require('./public/broker_data.json');

function testJulyFilterFixed() {
  const startDate = '2025-07-14';
  const endDate = '2025-07-20';
  
  console.log(`Testing filter logic for ${startDate} to ${endDate}:`);
  
  // Create dates properly to avoid timezone issues
  const startParts = startDate.split('-');
  const endParts = endDate.split('-');
  
  const filterStart = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
  const filterEnd = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
  
  console.log('Filter range:');
  console.log('  Start:', filterStart.toDateString());
  console.log('  End:', filterEnd.toDateString());
  
  const filteredData = brokerData.filter((item) => {
    if (!item.date || typeof item.date !== 'number') return false;
    
    // Convert Excel date serial number to JavaScript Date
    const excelEpoch = new Date(1900, 0, 1).getTime() - 2 * 24 * 60 * 60 * 1000;
    const itemDate = new Date(excelEpoch + (item.date - 1) * 24 * 60 * 60 * 1000);
    
    // Create normalized dates for comparison
    const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
    
    return itemDateOnly >= filterStart && itemDateOnly <= filterEnd;
  });
  
  console.log(`Found ${filteredData.length} records`);
  
  if (filteredData.length > 0) {
    console.log('All filtered records:');
    filteredData.forEach(item => {
      const excelEpoch = new Date(1900, 0, 1).getTime() - 2 * 24 * 60 * 60 * 1000;
      const itemDate = new Date(excelEpoch + (item.date - 1) * 24 * 60 * 60 * 1000);
      const dateStr = itemDate.toISOString().split('T')[0];
      console.log(`  ${item.no} ${item.broker} ${dateStr} (Excel: ${item.date})`);
    });
  }
}

testJulyFilterFixed();