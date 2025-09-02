const data = require('./public/broker_data.json');

const dates = data.map(item => {
  if (typeof item.date === 'number') {
    // Excel date serial number to JavaScript Date
    const excelEpoch = new Date(1900, 0, 1).getTime() - 2 * 24 * 60 * 60 * 1000;
    return new Date(excelEpoch + (item.date - 1) * 24 * 60 * 60 * 1000);
  }
  return new Date(item.date);
}).filter(d => !isNaN(d.getTime())).sort((a, b) => a - b);

console.log('Total records:', data.length);
console.log('Date range:');
console.log('  Earliest:', dates[0]?.toISOString().split('T')[0]);
console.log('  Latest:', dates[dates.length - 1]?.toISOString().split('T')[0]);

// Show July 14-20 data
const july14 = new Date('2025-07-14');
const july20 = new Date('2025-07-20');
const julyData = data.filter(item => {
  let itemDate;
  if (typeof item.date === 'number') {
    const excelEpoch = new Date(1900, 0, 1).getTime() - 2 * 24 * 60 * 60 * 1000;
    itemDate = new Date(excelEpoch + (item.date - 1) * 24 * 60 * 60 * 1000);
  } else {
    itemDate = new Date(item.date);
  }
  return itemDate >= july14 && itemDate <= july20;
});

console.log('July 14-20 records:', julyData.length);
if (julyData.length > 0) {
  console.log('Sample records:');
  julyData.slice(0, 5).forEach(item => {
    let dateStr;
    if (typeof item.date === 'number') {
      const excelEpoch = new Date(1900, 0, 1).getTime() - 2 * 24 * 60 * 60 * 1000;
      dateStr = new Date(excelEpoch + (item.date - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else {
      dateStr = new Date(item.date).toISOString().split('T')[0];
    }
    console.log('  ', item.no, item.broker, dateStr, 'Excel date:', item.date);
  });
}

// Show latest 10 records
console.log('\nLatest 10 records:');
const sortedData = data.sort((a, b) => {
  let dateA, dateB;
  if (typeof a.date === 'number') {
    const excelEpoch = new Date(1900, 0, 1).getTime() - 2 * 24 * 60 * 60 * 1000;
    dateA = new Date(excelEpoch + (a.date - 1) * 24 * 60 * 60 * 1000);
  } else {
    dateA = new Date(a.date);
  }
  if (typeof b.date === 'number') {
    const excelEpoch = new Date(1900, 0, 1).getTime() - 2 * 24 * 60 * 60 * 1000;
    dateB = new Date(excelEpoch + (b.date - 1) * 24 * 60 * 60 * 1000);
  } else {
    dateB = new Date(b.date);
  }
  return dateB - dateA;
});

sortedData.slice(0, 10).forEach(item => {
  let dateStr;
  if (typeof item.date === 'number') {
    const excelEpoch = new Date(1900, 0, 1).getTime() - 2 * 24 * 60 * 60 * 1000;
    dateStr = new Date(excelEpoch + (item.date - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  } else {
    dateStr = new Date(item.date).toISOString().split('T')[0];
  }
  console.log('  ', item.no, item.broker, dateStr, 'Excel date:', item.date);
});