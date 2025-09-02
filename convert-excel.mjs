
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname.substring(1)));

const excelFilePath = path.join(__dirname, 'marketing_data.xlsm');
const brokerOutputPath = path.join(__dirname, 'public', 'broker_data.json');
const weeklyOutputPath = path.join(__dirname, 'public', 'weekly_data.json');
const monthlyOutputPath = path.join(__dirname, 'public', 'monthly_data.json');

console.log(`Reading Excel file from: ${excelFilePath}`);

try {
    // 检查文件是否存在
    if (!fs.existsSync(excelFilePath)) {
        throw new Error(`Excel file not found at ${excelFilePath}`);
    }

    // 读取Excel文件
    const workbook = XLSX.readFile(excelFilePath);
    
    // 打印所有工作表名称以供调试
    console.log("Available sheets:", workbook.SheetNames);

    // 处理第一个工作表（Clients_info(new)）
    const clientsSheetName = workbook.SheetNames[0];
    const clientsWorksheet = workbook.Sheets[clientsSheetName];

    if (!clientsWorksheet) {
        throw new Error(`Sheet "${clientsSheetName}" not found in the workbook.`);
    }

    console.log(`Found clients sheet: "${clientsSheetName}"`);

    // 将客户工作表转换为JSON
    const clientsRawData = XLSX.utils.sheet_to_json(clientsWorksheet, { raw: false, cellDates: true });

    console.log(`Successfully parsed ${clientsRawData.length} rows from the clients sheet.`);

    // 调试：打印第一行数据的键，以查看实际的列名
    if (clientsRawData.length > 0) {
        console.log("Clients column headers found in Excel file:", Object.keys(clientsRawData[0]));
    }

    // 清理客户数据，只保留需要的字段
    const cleanedClientsData = clientsRawData.map(row => {
        // 使用用户提供的列名
        const broker = row['Broker'];
        const date = row['Date'];
        const no = row['No.']; // 添加No.列

        // 进行一些基本的数据验证
        if (!broker || !date) {
            return null;
        }

        return {
            no: no, // 在JSON中包含no
            broker: broker,
            // 将日期转换为ISO 8601格式 (YYYY-MM-DDTHH:mm:ss.sssZ)
            date: new Date(date).toISOString(),
        };
    }).filter(Boolean); // 过滤掉任何为null的条目

    console.log(`Processed ${cleanedClientsData.length} valid client rows.`);

    // 将清理后的客户数据写入JSON文件
    fs.writeFileSync(brokerOutputPath, JSON.stringify(cleanedClientsData, null, 2));

    console.log(`Successfully converted clients data to JSON at: ${brokerOutputPath}`);

    // 处理第二个工作表（weekly_data）
    if (workbook.SheetNames.length > 1) {
        const weeklySheetName = workbook.SheetNames[1];
        const weeklyWorksheet = workbook.Sheets[weeklySheetName];

        if (!weeklyWorksheet) {
            console.warn(`Sheet "${weeklySheetName}" not found in the workbook.`);
        } else {
            console.log(`Found weekly sheet: "${weeklySheetName}"`);

            // 将周数据工作表转换为JSON
            const weeklyRawData = XLSX.utils.sheet_to_json(weeklyWorksheet, { raw: false, cellDates: true });

            console.log(`Successfully parsed ${weeklyRawData.length} rows from the weekly sheet.`);

            // 调试：打印第一行数据的键，以查看实际的列名
            if (weeklyRawData.length > 0) {
                console.log("Weekly column headers found in Excel file:", Object.keys(weeklyRawData[0]));
            }

            // 获取第3个工作表的消费数据并转换为AUD
            let dailyCostData = [];
            if (workbook.SheetNames.length > 2) {
                const thirdSheetName = workbook.SheetNames[2]; // database_marketing
                const thirdSheet = workbook.Sheets[thirdSheetName];
                
                if (thirdSheet) {
                    const thirdSheetData = XLSX.utils.sheet_to_json(thirdSheet, { raw: false, cellDates: true });
                    dailyCostData = thirdSheetData.map(row => ({
                        date: row['时间'],
                        cost: parseFloat(row['消费']) / 4.72 // 转换为AUD
                    }));
                }
            }

            // 清理周数据，获取更多字段，并加入来自第3个工作表的成本数据
            const cleanedWeeklyData = weeklyRawData.map(row => {
                // 使用用户提供的列名
                const week = row['Week'];
                const leadsPrice = row['Leads单价（aud）'];
                const leadsTotal = row['Leads总数'];
                const totalCost = row['消费总额（aud)'];

                // 进行一些基本的数据验证
                if (!week) {
                    return null;
                }

                return {
                    week: week,
                    leadsPrice: parseFloat(leadsPrice) || 0,
                    leadsTotal: parseInt(leadsTotal) || 0,
                    totalCost: parseFloat(totalCost) || 0,
                    dailyCostData: dailyCostData // 添加日消费数据
                };
            }).filter(Boolean); // 过滤掉任何为null的条目

            console.log(`Processed ${cleanedWeeklyData.length} valid weekly rows.`);

            // 将清理后的周数据写入JSON文件
            fs.writeFileSync(weeklyOutputPath, JSON.stringify(cleanedWeeklyData, null, 2));

            console.log(`Successfully converted weekly data to JSON at: ${weeklyOutputPath}`);
            
            // 将日消费数据保存到单独的JSON文件
            const dailyCostOutputPath = path.join(__dirname, 'public', 'daily_cost_data.json');
            fs.writeFileSync(dailyCostOutputPath, JSON.stringify(dailyCostData, null, 2));
            console.log(`Successfully converted daily cost data to JSON at: ${dailyCostOutputPath}`);
        }
    } else {
        console.warn('No weekly data sheet found in the workbook.');
    }

    // 处理第4个工作表（monthly_data）和第5个工作表（monthly_count）
    if (workbook.SheetNames.length >= 5) {
        const monthlyDataSheetName = workbook.SheetNames[3]; // 第4个工作表 (索引3)
        const monthlyCountSheetName = workbook.SheetNames[4]; // 第5个工作表 (索引4)
        
        const monthlyDataWorksheet = workbook.Sheets[monthlyDataSheetName];
        const monthlyCountWorksheet = workbook.Sheets[monthlyCountSheetName];

        if (!monthlyDataWorksheet || !monthlyCountWorksheet) {
            console.warn('Monthly data or count sheet not found in the workbook.');
        } else {
            console.log(`Found monthly data sheet: "${monthlyDataSheetName}"`);
            console.log(`Found monthly count sheet: "${monthlyCountSheetName}"`);

            // 处理monthly_data工作表
            const monthlyDataRaw = XLSX.utils.sheet_to_json(monthlyDataWorksheet, { raw: false, cellDates: true });
            console.log(`Successfully parsed ${monthlyDataRaw.length} rows from monthly data sheet.`);
            
            if (monthlyDataRaw.length > 0) {
                console.log("Monthly data column headers:", Object.keys(monthlyDataRaw[0]));
            }

            // 处理monthly_count工作表
            const monthlyCountRaw = XLSX.utils.sheet_to_json(monthlyCountWorksheet, { raw: false, cellDates: true });
            console.log(`Successfully parsed ${monthlyCountRaw.length} rows from monthly count sheet.`);
            
            if (monthlyCountRaw.length > 0) {
                console.log("Monthly count column headers:", Object.keys(monthlyCountRaw[0]));
            }

            // 合并两个工作表的数据 - 从2024年9月开始到2025年7月
            const combinedMonthlyData = [];
            
            // 创建月份到消费金额的映射 - 第4个工作表第三列
            const monthlyDataMap = new Map();
            monthlyDataRaw.forEach((row) => {
                const month = row['月份'] || row['Month'];
                const cost = row['消费总额（aud)'] || row['Cost(AUD)'] || row['消费总额'];
                if (month) {
                    // 四舍五入消费金额
                    monthlyDataMap.set(month, Math.round(parseFloat(cost) || 0));
                }
            });

            // 创建月份到数量的映射 - 第5个工作表第二列
            const monthlyCountMap = new Map();
            monthlyCountRaw.forEach((row) => {
                const month = row['Month'];
                const count = row['Count'];
                if (month && count) {
                    monthlyCountMap.set(month, parseInt(count) || 0);
                }
            });

            // 定义完整的月份序列从2024年9月到2025年7月
            const fullMonthsSequence = [
                '2024/09', '2024/10', '2024/11', '2024/12',
                '2025/01', '2025/02', '2025/03', '2025/04', '2025/05', '2025/06', '2025/07'
            ];

            // 为每个月份创建数据记录
            fullMonthsSequence.forEach(month => {
                const cost = monthlyDataMap.get(month) || 0; // 9月份消费金额从0开始
                const count = monthlyCountMap.get(month) || 0;
                
                combinedMonthlyData.push({
                    month: month,
                    cost: cost,
                    count: count
                });
            });

            console.log(`Processed ${combinedMonthlyData.length} combined monthly data rows.`);

            // 将合并后的月度数据写入JSON文件
            fs.writeFileSync(monthlyOutputPath, JSON.stringify(combinedMonthlyData, null, 2));

            console.log(`Successfully converted monthly data to JSON at: ${monthlyOutputPath}`);
        }
    } else {
        console.warn('Not enough sheets found for monthly data processing.');
    }

} catch (error) {
    console.error('An error occurred during the conversion process:');
    console.error(error.message);
    process.exit(1); // 以错误码退出
}
