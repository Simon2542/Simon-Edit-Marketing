// 检查更新后的数据
fetch('http://localhost:3000/api/excel-data')
  .then(response => response.json())
  .then(data => {
    const clientData = data.data.broker_data;
    const weeklyData = data.data.weekly_data;

    console.log('=== 更新后数据检查 ===');
    console.log('总客户数:', clientData.length);
    console.log('总周数:', weeklyData.length);

    // 转换Excel日期
    const parseExcelDate = (excelDate) => {
      if (typeof excelDate === 'number') {
        const excelBase = new Date(1899, 11, 30);
        return new Date(excelBase.getTime() + excelDate * 24 * 60 * 60 * 1000);
      }
      return new Date(excelDate);
    };

    // 找出最新的客户日期
    let maxDate = null;
    let maxExcelDate = 0;
    clientData.forEach(client => {
      if (client.date > maxExcelDate) {
        maxExcelDate = client.date;
        maxDate = parseExcelDate(client.date);
      }
    });

    console.log('\n最新客户数据日期:');
    console.log('Excel序号:', maxExcelDate);
    console.log('转换后日期:', maxDate ? maxDate.toLocaleDateString('zh-CN') : 'null');
    console.log('ISO日期:', maxDate ? maxDate.toISOString().split('T')[0] : 'null');

    // 检查最后15个客户
    console.log('\n最后15个客户:');
    clientData.slice(-15).forEach((client, index) => {
      const date = parseExcelDate(client.date);
      console.log(`${clientData.length - 14 + index}. ${client.broker} - ${date.toLocaleDateString('zh-CN')} (Excel: ${client.date}, ISO: ${date.toISOString().split('T')[0]})`);
    });

    // 检查最新的周数据
    console.log('\n最后8周数据:');
    weeklyData.slice(-8).forEach(week => {
      console.log(`${week.week}: ${week.leadsTotal} leads, $${week.totalCost ? week.totalCost.toFixed(0) : 0}`);
    });

    // 重点检查7月28日-8月3日的数据
    console.log('\n查找7月28日-8月3日(2025/wk31)的客户数据:');
    let found728to803 = [];
    
    clientData.forEach((client, index) => {
      const date = parseExcelDate(client.date);
      // 使用UTC日期比较避免时区问题
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      // 7月28日到8月3日
      if ((year === 2025 && month === 7 && day >= 28) || 
          (year === 2025 && month === 8 && day <= 3)) {
        found728to803.push({
          index: index + 1,
          broker: client.broker,
          date: date.toLocaleDateString('zh-CN'),
          isoDate: date.toISOString().split('T')[0],
          excelDate: client.date
        });
      }
    });

    console.log(`找到 ${found728to803.length} 个客户在7月28日-8月3日范围内:`);
    found728to803.forEach(client => {
      console.log(`  ${client.index}. ${client.broker} - ${client.date} (${client.isoDate}, Excel: ${client.excelDate})`);
    });

    // 检查8月4日及以后的数据
    console.log('\n查找8月4日及以后的客户数据:');
    let foundAug4Plus = [];
    
    clientData.forEach((client, index) => {
      const date = parseExcelDate(client.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      if (year === 2025 && month === 8 && day >= 4) {
        foundAug4Plus.push({
          index: index + 1,
          broker: client.broker,
          date: date.toLocaleDateString('zh-CN'),
          isoDate: date.toISOString().split('T')[0],
          excelDate: client.date
        });
      }
    });

    console.log(`找到 ${foundAug4Plus.length} 个客户在8月4日及以后:`);
    foundAug4Plus.forEach(client => {
      console.log(`  ${client.index}. ${client.broker} - ${client.date} (${client.isoDate}, Excel: ${client.excelDate})`);
    });

    // 检查是否有2025/wk31和2025/wk32的周数据
    console.log('\n检查新生成的周数据:');
    const week31 = weeklyData.find(w => w.week === '2025/wk31');
    const week32 = weeklyData.find(w => w.week === '2025/wk32');
    const week33 = weeklyData.find(w => w.week === '2025/wk33');
    
    [week31, week32, week33].forEach((week, index) => {
      const weekNum = 31 + index;
      if (week) {
        console.log(`2025/wk${weekNum}: ${week.leadsTotal} leads, $${week.totalCost ? week.totalCost.toFixed(0) : 0}`);
      } else {
        console.log(`2025/wk${weekNum}: 未找到`);
      }
    });
  })
  .catch(error => {
    console.error('获取数据失败:', error);
  });