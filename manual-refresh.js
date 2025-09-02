const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Helper function to process Excel data and generate JSON files
function processExcelData() {
  console.log('Processing Excel file...');
  const filePath = path.join(__dirname, 'marketing_data.xlsm');
  const workbook = XLSX.readFile(filePath);
  console.log('Available sheets:', workbook.SheetNames);
  
  // Process broker data from main sheet
  const clientSheetName = "Clients_info（new）";
  if (workbook.Sheets[clientSheetName]) {
    console.log('Processing client data...');
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[clientSheetName]);
    
    // Transform data to match expected format
    const clientData = rawData.map((item) => {
      let broker = item['Broker'] || item.broker;
      
      // Handle broker name mappings
      if (broker && broker.toLowerCase().includes('ruofan')) {
        broker = 'Yuki';
      } else if (broker && broker.toLowerCase().includes('yuki')) {
        broker = 'Yuki';
      } else if (broker && broker.toLowerCase() === 'linudo') {
        broker = 'Linduo';
      } else if (broker && broker.toLowerCase() === 'ziv') {
        broker = 'Ziv';
      }
      
      return {
        no: item['No.'] || item.no,
        broker: broker,
        date: item['日期'] || item.date,
        wechat: item['微信'] || item.wechat,
        source: item['来源'] || item.source
      };
    });
    
    // Save to public folder
    fs.writeFileSync(
      path.join(__dirname, "public", "broker_data.json"),
      JSON.stringify(clientData, null, 2)
    );
    console.log(`Saved ${clientData.length} broker records`);
  }

  // Process weekly data
  const weeklySheetName = "weekly_data";
  if (workbook.Sheets[weeklySheetName]) {
    console.log('Processing weekly data...');
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[weeklySheetName]);
    
    // Transform data to match expected format
    const weeklyData = rawData.map((item) => ({
      week: item['Week'] || item.week,
      totalCost: item['消费总额（aud)'] || item.totalCost || 0,
      leadsTotal: item['Leads总数'] || item.leadsTotal || 0,
      leadsPrice: item['Leads单价（aud）'] || item.leadsPrice || 0
    }));
    
    fs.writeFileSync(
      path.join(__dirname, "public", "weekly_data.json"),
      JSON.stringify(weeklyData, null, 2)
    );
    console.log(`Saved ${weeklyData.length} weekly records`);
  }

  // Process monthly data - combine multiple monthly sheets
  const monthlySheetName = "monthly_data";
  const monthlyCountSheetName = "monthly_count";
  
  if (workbook.Sheets[monthlySheetName] && workbook.Sheets[monthlyCountSheetName]) {
    console.log('Processing monthly data...');
    const costData = XLSX.utils.sheet_to_json(workbook.Sheets[monthlySheetName]);
    const countData = XLSX.utils.sheet_to_json(workbook.Sheets[monthlyCountSheetName]);
    
    // Merge cost and count data by month
    const monthlyData = costData.map((costItem) => {
      const month = costItem['月份'] || costItem.month;
      const countItem = countData.find((c) => 
        (c['Month'] || c.month) === month
      );
      
      return {
        month: month,
        cost: costItem['消费总额（aud)'] || costItem.cost || 0,
        count: countItem ? (countItem['Count'] || countItem.count || 0) : 0
      };
    });
    
    fs.writeFileSync(
      path.join(__dirname, "public", "monthly_data.json"),
      JSON.stringify(monthlyData, null, 2)
    );
    console.log(`Saved ${monthlyData.length} monthly records`);
  }

  // Process daily cost data
  const dailySheetName = "database_marketing";
  if (workbook.Sheets[dailySheetName]) {
    console.log('Processing daily cost data...');
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[dailySheetName]);
    
    const dailyData = rawData.map((item) => ({
      date: item['时间'] || item.date,
      cost: ((item['消费'] || item.cost || 0) / 4.72) // Convert to AUD by dividing by 4.72
    }));
    
    fs.writeFileSync(
      path.join(__dirname, "public", "daily_cost_data.json"),
      JSON.stringify(dailyData, null, 2)
    );
    console.log(`Saved ${dailyData.length} daily cost records`);
  }

  console.log('Excel processing completed successfully!');
}

// Run the processing
try {
  processExcelData();
} catch (error) {
  console.error('Error processing Excel file:', error);
}