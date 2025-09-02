const brokerData = require('./public/broker_data.json');

// Test weekday calculation
function getDayOfWeek(dateInput) {
  let date;
  
  if (typeof dateInput === 'number') {
    // Convert Excel date serial number to JavaScript Date
    const excelBase = new Date(1899, 11, 30);
    date = new Date(excelBase.getTime() + dateInput * 24 * 60 * 60 * 1000);
  } else {
    date = new Date(dateInput);
  }
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

// Test with July 14-20 data specifically
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

console.log(`Testing weekday calculation for July 14-20 (${filteredData.length} records):`);

// Count by weekday
const weekdayCount = {
  Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, 
  Friday: 0, Saturday: 0, Sunday: 0
};

filteredData.forEach(client => {
  const dayOfWeek = getDayOfWeek(client.date);
  weekdayCount[dayOfWeek]++;
});

console.log('Weekday distribution:');
Object.entries(weekdayCount).forEach(([day, count]) => {
  if (count > 0) {
    console.log(`  ${day}: ${count} leads`);
  }
});

// Show actual Sunday records
console.log('\nSunday records in detail:');
const sundayRecords = filteredData.filter(client => getDayOfWeek(client.date) === 'Sunday');
sundayRecords.forEach(item => {
  const excelBase = new Date(1899, 11, 30);
  const itemDate = new Date(excelBase.getTime() + item.date * 24 * 60 * 60 * 1000);
  const dateStr = itemDate.toISOString().split('T')[0];
  const dayName = getDayOfWeek(item.date);
  console.log(`  Record ${item.no}: ${item.broker} on ${dateStr} (${dayName}) Excel: ${item.date}`);
});