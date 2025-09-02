const XLSX = require('xlsx');
const path = require('path');

// Read Excel file directly
const filePath = path.join(__dirname, 'marketing_data.xlsm');
const workbook = XLSX.readFile(filePath);

const clientSheetName = "Clients_info（new）";
if (workbook.Sheets[clientSheetName]) {
  const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[clientSheetName]);
  
  // Get all broker names
  const allBrokers = rawData.map(row => row['Broker'] || row.broker).filter(Boolean);
  
  // Count occurrences
  const brokerCounts = {};
  allBrokers.forEach(broker => {
    brokerCounts[broker] = (brokerCounts[broker] || 0) + 1;
  });
  
  // Get unique brokers
  const uniqueBrokers = [...new Set(allBrokers)].sort();
  
  console.log('\n=== BROKER ANALYSIS ===');
  console.log('Total records:', allBrokers.length);
  console.log('Unique brokers:', uniqueBrokers.length);
  console.log('\nBroker list with counts:');
  Object.entries(brokerCounts).sort().forEach(([broker, count]) => {
    console.log(`  ${broker}: ${count} records`);
  });
  
  // Find similar names
  console.log('\n=== SIMILAR NAMES (potential duplicates) ===');
  uniqueBrokers.forEach((broker1, i) => {
    uniqueBrokers.slice(i + 1).forEach(broker2 => {
      if (broker1.toLowerCase() === broker2.toLowerCase() && broker1 !== broker2) {
        console.log(`  "${broker1}" vs "${broker2}" (case difference)`);
      }
      if (broker1.toLowerCase().replace(/[^a-z]/g, '') === broker2.toLowerCase().replace(/[^a-z]/g, '') && broker1 !== broker2) {
        console.log(`  "${broker1}" vs "${broker2}" (similar)`);
      }
    });
  });
  
  // Check specific problematic names
  console.log('\n=== CHECKING SPECIFIC NAMES ===');
  const problematicNames = ['Linduo', 'Linudo', 'Yuki', 'yuki', 'Ziv', 'ziv'];
  problematicNames.forEach(name => {
    const count = brokerCounts[name] || 0;
    if (count > 0) {
      console.log(`  Found "${name}": ${count} records`);
      // Show first few records with this name
      const examples = rawData
        .filter(row => (row['Broker'] || row.broker) === name)
        .slice(0, 3)
        .map(row => `No.${row['No.'] || row.no}`);
      console.log(`    Examples: ${examples.join(', ')}`);
    }
  });
}