import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'
import { getNotesStore as getLifeCarNotesStore } from '@/app/api/lifecar-notes/notes-store'
import { getXiaoWangTestNotesStore } from '@/app/api/xiaowang-test-notes/notes-store'

// Helper function to parse Excel date - 支持 DD/MM/YYYY 格式
function parseExcelDate(excelDate: any): Date | null {
  if (typeof excelDate === 'number') {
    // Excel date serial number
    const excelBase = new Date(1899, 11, 30);
    return new Date(excelBase.getTime() + excelDate * 24 * 60 * 60 * 1000);
  } else if (typeof excelDate === 'string') {
    // 处理 DD/MM/YYYY 格式 (如: "19/09/2024")
    if (excelDate.includes('/')) {
      const parts = excelDate.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        let year = parseInt(parts[2]);
        if (year < 100) {
          year = year > 50 ? 1900 + year : 2000 + year;
        }
        return new Date(year, month - 1, day); // month - 1 因为JS月份从0开始
      }
    }
    // 尝试其他格式
    const date = new Date(excelDate);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

// Helper function to get week string from date (copied from excel-data route)
function getWeekString(date: Date): string {
  const year = date.getFullYear();

  // Use the same logic as the component to find first Monday
  const firstDay = new Date(year, 0, 1);
  const dayOfWeek = firstDay.getDay();
  const firstMonday = new Date(firstDay);
  firstMonday.setDate(firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

  // Find the Monday of the week containing this date
  const targetDayOfWeek = date.getDay();
  const mondayOfTargetWeek = new Date(date);
  mondayOfTargetWeek.setDate(date.getDate() - targetDayOfWeek + (targetDayOfWeek === 0 ? -6 : 1));

  // Calculate week number
  const daysDiff = Math.floor((mondayOfTargetWeek.getTime() - firstMonday.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.floor(daysDiff / 7) + 1;

  // Handle edge cases for negative week numbers or very large week numbers
  if (weekNum <= 0) {
    // This belongs to previous year's last week
    return getWeekString(new Date(year - 1, 11, 31));
  } else if (weekNum > 53) {
    // This might belong to next year's first week
    return `${year + 1}/wk01`;
  }

  return `${year}/wk${weekNum.toString().padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('Processing all-in-one file:', file.name, 'Size:', file.size)

    const buffer = Buffer.from(await file.arrayBuffer())
    let workbook: XLSX.WorkBook

    // Determine file type and parse accordingly
    if (file.name.endsWith('.csv')) {
      // Parse CSV
      const csvText = buffer.toString('utf-8')
      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
        trim: true,
      })

      // Create workbook with single sheet
      workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(records)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    } else {
      // Parse Excel - use same simple options as single upload to avoid fake data
      workbook = XLSX.read(buffer, { type: 'buffer' })
    }

    console.log('Available sheets in uploaded file:', workbook.SheetNames)
    console.log('Looking for these sheets:')
    console.log('- Clients_info (for XiaoWang consultation)')
    console.log('- 小王投放 (for XiaoWang advertising)')
    console.log('- 小王笔记 (for XiaoWang notes)')
    console.log('- Lifecar投放 (for LifeCar data)')
    console.log('- Lifecar笔记 (for LifeCar notes)')

    const processedData: any = {
      xiaowangConsultation: null,
      xiaowangAdvertising: null,
      xiaowangNotes: null,
      lifecarData: null,
      lifecarNotes: null
    }

    const processed = {
      xiaowangConsultation: false,
      xiaowangAdvertising: false,
      xiaowangNotes: false,
      lifecarData: false,
      lifecarNotes: false
    }

    // Process XiaoWang Leads Database (client_info sheet) - 匹配单个上传的确切sheet名称
    const clientsSheetName = workbook.SheetNames.find(name =>
      name === 'Clients_info（new）' ||  // 单个上传使用的确切名称
      name === 'client_info' ||
      name === 'Clients_info' ||
      name === 'clients_info' ||
      name.toLowerCase() === 'client_info' ||
      name.toLowerCase() === 'clients_info' ||
      name.toLowerCase() === 'clients info' ||
      name.toLowerCase().includes('client')
    )
    console.log('Found clients sheet:', clientsSheetName)
    console.log('All available sheet names:', workbook.SheetNames)

    if (clientsSheetName) {
      try {
        const sheet = workbook.Sheets[clientsSheetName]
        const data = XLSX.utils.sheet_to_json(sheet)  // 移除选项，与单个上传保持一致

        console.log('=== ALL-IN-ONE 原始Excel读取数据 ===')
        console.log('All-in-One Excel总行数:', data.length)
        console.log('All-in-One Excel原始数据前3行:', data.slice(0, 3))
        console.log('All-in-One Excel可用列名:', Object.keys(data[0] || {}))
        console.log('All-in-One Excel第一行完整数据:', data[0])

        // 检查Excel中实际的broker分布 (原始数据)
        const rawBrokerCounts = {};
        data.forEach((row, index) => {
          const rawBroker = row['Broker'] || row.broker || 'EMPTY';
          rawBrokerCounts[rawBroker] = (rawBrokerCounts[rawBroker] || 0) + 1;
        });
        console.log('All-in-One Excel原始broker分布:', rawBrokerCounts);

        // Process broker data - EXACT match to excel-data route format (无日期转换)
        const brokerData = data.map((row: any, index: number) => {
          // 使用与单个上传完全相同的字段映射和处理方式（无日期转换）
          const processedRow = {
            no: row['No.'] || row.no,
            broker: row['Broker'] || row.broker,
            date: row['日期'] || row.date,  // 直接使用原始值，不进行转换
            wechat: row['微信'] || row.wechat,
            source: row['来源'] || row.source
          }

          if (index < 5) {
            console.log(`=== Row ${index} Processing ===`)
            console.log('Original row:', row)
            console.log('Processed row:', processedRow)
            console.log('Field mappings:')
            console.log('  - No.: ', row['No.'], '||', row.no, '→', processedRow.no)
            console.log('  - Broker: ', row['Broker'], '||', row.broker, '→', processedRow.broker)
            console.log('  - Date: ', row['日期'], '||', row.date, '→', processedRow.date)
            console.log('  - WeChat: ', row['微信'], '||', row.wechat, '→', processedRow.wechat)
            console.log('  - Source: ', row['来源'], '||', row.source, '→', processedRow.source)
          }

          return processedRow
        })

        console.log('Total broker data processed:', brokerData.length)
        console.log('Sample broker data after processing:', brokerData.slice(0, 3))

        // Since we now match excel-data route format (no week/month/leads_amount in broker_data),
        // we'll generate aggregations based on date counting (like excel-data does)
        const weeklyData = processWeeklyDataFromBroker(brokerData)
        console.log('Generated weekly data:', weeklyData.length, 'weeks')

        // Process monthly aggregation by counting records per month
        const monthlyData = processMonthlyDataFromBroker(brokerData)
        console.log('Generated monthly data:', monthlyData.length, 'months')

        // Process daily data - count records per day
        const dailyCostData = processDailyDataFromBroker(brokerData)
        console.log('Generated daily data:', dailyCostData.length, 'days')

        processedData.xiaowangConsultation = {
          broker_data: brokerData,
          weekly_data: weeklyData,
          monthly_data: monthlyData,
          daily_cost_data: dailyCostData
        }
        processed.xiaowangConsultation = true
        console.log(`Processed ${brokerData.length} XiaoWang consultation records`)
      } catch (error) {
        console.error('Error processing Clients_info sheet:', error)
      }
    }

    // Process XiaoWang Advertising Data (小王投放 sheet)
    if (workbook.SheetNames.includes('小王投放')) {
      try {
        const sheet = workbook.Sheets['小王投放']
        const data = XLSX.utils.sheet_to_json(sheet)  // 移除选项，与单个上传保持一致

        const advertisingData = data.map((row: any, index: number) => {
          // 转换Excel序列号日期为YYYY-MM-DD格式以便filter工作
          const rawDate = row['时间'] || '';
          let formattedDate = rawDate;

          if (typeof rawDate === 'number') {
            // Excel date serial number to Date object
            const dateObj = new Date((rawDate - 25569) * 86400 * 1000);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
            }
          } else if (typeof rawDate === 'string' && rawDate.includes('/')) {
            // Handle D/M/YYYY format (如 "1/9/2024")
            const parts = rawDate.split('/');
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              const year = parts[2];
              formattedDate = `${year}-${month}-${day}`;
            }
          }

          // 调试前5行数据
          if (index < 5) {
            console.log(`XiaoWang Advertising Row ${index} date conversion: "${rawDate}" -> "${formattedDate}"`);
          }

          return {
            date: formattedDate,  // 转换为YYYY-MM-DD格式
            dateObj: null,
            cost: (parseFloat(row['消费'] || '0')) / 4.7, // Convert RMB to AUD
            impressions: parseInt(row['展现量'] || '0'),
            clicks: parseInt(row['点击量'] || '0'),
            clickRate: parseFloat((row['点击率'] || '0').toString().replace('%', '')),
            avgClickCost: (parseFloat(row['平均点击成本'] || '0')) / 4.7, // Convert RMB to AUD
            likes: parseInt(row['点赞'] || '0'),
            comments: parseInt(row['评论'] || '0'),
            favorites: parseInt(row['收藏'] || '0'),
            followers: parseInt(row['关注'] || '0'),
            shares: parseInt(row['分享'] || '0'),
            interactions: parseInt(row['互动量'] || '0'),
            avgInteractionCost: (parseFloat(row['平均互动成本'] || '0')) / 4.7, // Convert RMB to AUD
            actionClicks: parseInt(row['行动按钮点击量'] || '0'),
            actionClickRate: parseFloat((row['行动按钮点击率'] || '0').toString().replace('%', '')),
            conversions: parseInt(row['多转化人数（添加企微+私信咨询）'] || '0'),
            conversionCost: (parseFloat(row['多转化成本（添加企微+私信咨询）'] || '0')) / 4.7 // Convert RMB to AUD
          }
        })

        // 按日期分组数据 - 与单个上传保持一致
        const dailyDataMap = advertisingData.reduce((acc: any, row) => {
          const date = row.date
          if (!acc[date]) {
            acc[date] = {
              date,
              cost: 0,
              impressions: 0,
              clicks: 0,
              interactions: 0,
              conversions: 0,
              followers: 0,
              saves: 0,
              likes: 0,
              comments: 0,
              shares: 0,
            }
          }
          acc[date].cost += row.cost
          acc[date].impressions += row.impressions
          acc[date].clicks += row.clicks
          acc[date].interactions += row.interactions
          acc[date].conversions += row.conversions
          acc[date].followers += row.followers || 0
          acc[date].saves += row.favorites || 0
          acc[date].likes += row.likes
          acc[date].comments += row.comments
          acc[date].shares += row.shares
          return acc
        }, {})

        // 转换为数组并排序
        const sortedDailyData = Object.values(dailyDataMap).sort((a: any, b: any) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        })

        // 构造与单个上传完全一致的数据结构
        const summary = {
          totalCost: advertisingData.reduce((sum, d) => sum + d.cost, 0),
          totalImpressions: advertisingData.reduce((sum, d) => sum + d.impressions, 0),
          totalClicks: advertisingData.reduce((sum, d) => sum + d.clicks, 0),
          totalInteractions: advertisingData.reduce((sum, d) => sum + d.interactions, 0),
          totalConversions: advertisingData.reduce((sum, d) => sum + d.conversions, 0),
          totalFollowers: advertisingData.reduce((sum, d) => sum + (d.followers || 0), 0),
          totalSaves: advertisingData.reduce((sum, d) => sum + (d.favorites || 0), 0),
          totalLikes: advertisingData.reduce((sum, d) => sum + d.likes, 0),
          totalComments: advertisingData.reduce((sum, d) => sum + d.comments, 0),
          totalShares: advertisingData.reduce((sum, d) => sum + d.shares, 0),
          avgClickRate: 0,
          avgConversionCost: 0,
        }

        // 计算平均值
        if (advertisingData.length > 0) {
          summary.avgClickRate = summary.totalImpressions > 0
            ? (summary.totalClicks / summary.totalImpressions) * 100
            : 0
          summary.avgConversionCost = summary.totalConversions > 0
            ? summary.totalCost / summary.totalConversions
            : 0
        }

        processedData.xiaowangAdvertising = {
          summary,
          dailyData: sortedDailyData,
          rawData: advertisingData,  // 使用rawData而不是adData，与单个上传一致
          totalRows: advertisingData.length,
          // 额外包含的数据（如果需要）
          brokerData: processedData.xiaowangConsultation?.broker_data || [],
        }

        processed.xiaowangAdvertising = true
        console.log(`Processed ${data.length} XiaoWang advertising records`)
      } catch (error) {
        console.error('Error processing 小王投放 sheet:', error)
      }
    }

    // Process XiaoWang Notes (小王笔记 sheet)
    if (workbook.SheetNames.includes('小王笔记')) {
      try {
        const sheet = workbook.Sheets['小王笔记']
        const data = XLSX.utils.sheet_to_json(sheet)  // 移除选项，与单个上传保持一致

        // Filter out rows with "笔记违规" or "仅自己可见" status, and rows starting with "专业号行业"
        const filteredData = data.filter(row => {
          const status = row['笔记状态'] || ''
          const publishTime = row['笔记发布时间'] || ''
          const isValid = status !== '笔记违规' && status !== '仅自己可见' && !publishTime.toString().startsWith('专业号行业')
          return isValid
        })

        // Only return specific columns: 笔记发布时间, 笔记类型, 笔记名称, 笔记链接
        const processedNotesData = filteredData.map(row => ({
          发布时间: row['笔记发布时间'] || '',
          类型: row['笔记类型'] || '',
          名称: row['笔记名称'] || '',
          链接: row['笔记链接'] || ''
        }))

        // Store in memory using the notes store
        const notesStore = getXiaoWangTestNotesStore()
        notesStore.setData(processedNotesData)

        processedData.xiaowangNotes = processedNotesData
        processed.xiaowangNotes = true
        console.log(`Processed ${processedNotesData.length} XiaoWang notes records after filtering`)
      } catch (error) {
        console.error('Error processing 小王笔记 sheet:', error)
      }
    }

    // Process LifeCar Data (LifeCar 投放 sheet - note the space!)
    const lifecarDataSheetName = workbook.SheetNames.find(name =>
      name === 'LifeCar 投放' ||
      name === 'Lifecar 投放' ||
      name === 'LifeCar投放' ||
      name === 'Lifecar投放' ||
      (name.toLowerCase().includes('lifecar') && name.includes('投放'))
    )
    console.log('Found LifeCar data sheet:', lifecarDataSheetName)

    if (lifecarDataSheetName) {
      try {
        const sheet = workbook.Sheets[lifecarDataSheetName]
        const data = XLSX.utils.sheet_to_json(sheet)  // 移除选项，与单个上传保持一致

        // 与单个上传保持一致 - 不在后端转换货币，但需要处理日期格式
        // 货币转换将在前端的 parseLifeCarData 函数中进行
        const lifecarRawData = data.map((row: any, index: number) => {
          // 处理日期 - 需要转换为YYYY-MM-DD格式，以便前端正常使用
          let dateStr = row['时间'] || row['Date'] || row['日期'] || ''

          // 如果是Excel序列号，转换为YYYY-MM-DD格式
          if (typeof dateStr === 'number') {
            const dateObj = parseExcelDate(dateStr)
            if (dateObj) {
              const year = dateObj.getFullYear()
              const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
              const day = dateObj.getDate().toString().padStart(2, '0')
              dateStr = `${year}-${month}-${day}` // YYYY-MM-DD格式
            }
          } else if (typeof dateStr === 'string' && dateStr.includes('/')) {
            // 处理 D/M/YYYY 或 DD/MM/YYYY 格式
            const parts = dateStr.split('/')
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0')
              const month = parts[1].padStart(2, '0')
              const year = parts[2]
              dateStr = `${year}-${month}-${day}` // 转换为YYYY-MM-DD
            }
          }

          // 调试前几行
          if (index < 5) {
            console.log(`LifeCar Row ${index} date: raw="${row['时间'] || row['Date'] || row['日期']}" -> formatted="${dateStr}"`)
          }

          // 返回数据，日期已格式化，货币转换为AUD（与单个上传保持一致）
          return {
            date: dateStr,  // YYYY-MM-DD格式的日期字符串
            spend: parseFloat(row['消费'] || row['Spend'] || row['花费'] || '0') / 4.7, // RMB转AUD
            impressions: parseInt(row['展现量'] || row['Impressions'] || row['曝光'] || '0'),
            clicks: parseInt(row['点击量'] || row['Clicks'] || row['点击'] || '0'),
            clickRate: parseFloat(row['点击率'] || row['Click Rate'] || row['CTR'] || '0'),
            avgClickCost: parseFloat(row['平均点击成本'] || row['CPC'] || row['单次点击成本'] || '0') / 4.7, // RMB转AUD
            cpm: parseFloat(row['平均千次展现费用'] || row['CPM'] || row['千次曝光成本'] || '0') / 4.7, // RMB转AUD
            likes: parseInt(row['点赞'] || row['Likes'] || '0'),
            comments: parseInt(row['评论'] || row['Comments'] || '0'),
            saves: parseInt(row['收藏'] || row['Saves'] || row['保存'] || '0'),
            followers: parseInt(row['关注'] || row['Followers'] || row['关注者'] || '0'),
            shares: parseInt(row['分享'] || row['Shares'] || '0'),
            interactions: parseInt(row['互动量'] || row['Interactions'] || '0'),
            avgInteractionCost: parseFloat(row['平均互动成本'] || row['Avg Interaction Cost'] || '0') / 4.7, // RMB转AUD
            actionButtonClicks: parseInt(row['行动按钮点击量'] || row['Action Button Clicks'] || '0'),
            actionButtonClickRate: parseFloat(row['行动按钮点击率'] || row['Action Button Click Rate'] || '0'),
            screenshots: parseInt(row['截图'] || row['Screenshots'] || '0'),
            imageSaves: parseInt(row['图片保存'] || row['Image Saves'] || '0'),
            searchClicks: parseInt(row['搜索点击'] || row['Search Clicks'] || '0'),
            searchConversionRate: parseFloat(row['搜索转化率'] || row['Search Conversion Rate'] || '0'),
            avgReadNotesAfterSearch: parseFloat(row['搜索后平均阅读笔记数'] || row['Avg Read Notes After Search'] || '0'),
            readCountAfterSearch: parseInt(row['搜索后阅读数'] || row['Read Count After Search'] || '0'),
            multiConversion1: parseInt(row['多转化人数（添加企微+私信咨询）'] || row['Multi Conversion 1'] || '0'),
            multiConversionCost1: parseFloat(row['多转化成本（添加企微+私信咨询）'] || row['Multi Conversion Cost 1'] || '0') / 4.7, // RMB转AUD
            multiConversion2: parseInt(row['多转化人数（添加企微成功+私信留资）'] || row['Multi Conversion 2'] || '0'),
            multiConversionCost2: parseFloat(row['多转化成本（添加企微成功+私信留资）'] || row['Multi Conversion Cost 2'] || '0') / 4.7, // RMB转AUD
            // 兼容旧字段名
            ctr: parseFloat(row['点击率'] || row['CTR'] || '0'),
            cpc: parseFloat(row['平均点击成本'] || row['CPC'] || row['单次点击成本'] || '0') / 4.7, // RMB转AUD，与单个上传一致
            views: parseInt(row['点击量'] || row['Clicks'] || row['点击'] || '0'), // 使用点击量作为views，与单个上传一致
            profileViews: parseInt(row['主页访问'] || row['Profile Views'] || '0'),
            engagementRate: parseFloat(row['互动率'] || row['Engagement Rate'] || '0'),
            interactionRate: parseFloat(row['互动率'] || row['Interaction Rate'] || '0')
          }
        })

        // 返回与单个上传一致的数据结构
        processedData.lifecarData = lifecarRawData
        processedData.lifecar_data = lifecarRawData // 兼容性
        processedData.daily_cost_data = lifecarRawData // 与单个上传一致

        // 不在后端处理月度数据，让前端处理（与单个上传一致）
        // 如果需要，可以包含原始CSV格式的文本（但Excel不需要）

        processed.lifecarData = true
        console.log(`Processed ${data.length} LifeCar advertising records (raw data without currency conversion)`)
      } catch (error) {
        console.error('Error processing Lifecar投放 sheet:', error)
      }
    }

    // Process LifeCar Notes (LifeCar笔记 sheet)
    const lifecarNotesSheetName = workbook.SheetNames.find(name =>
      name === 'LifeCar笔记' ||
      name === 'Lifecar笔记' ||
      name === 'LifeCar 笔记' ||
      name === 'Lifecar 笔记' ||
      (name.toLowerCase().includes('lifecar') && name.includes('笔记'))
    )
    console.log('Found LifeCar notes sheet:', lifecarNotesSheetName)

    if (lifecarNotesSheetName) {
      try {
        const sheet = workbook.Sheets[lifecarNotesSheetName]
        const data = XLSX.utils.sheet_to_json(sheet)  // 移除选项，与单个上传保持一致

        // Filter out rows with "笔记违规" or "仅自己可见" status, and rows starting with "专业号行业"
        const filteredData = data.filter(row => {
          const status = row['笔记状态'] || ''
          const publishTime = row['笔记发布时间'] || row['发布时间'] || ''
          const isValid = status !== '笔记违规' && status !== '仅自己可见' && !publishTime.toString().startsWith('专业号行业')
          return isValid
        })

        // Only return specific columns: 笔记发布时间, 笔记类型, 笔记名称, 笔记链接
        const formattedNotes = filteredData.map((row: any) => ({
          发布时间: row['笔记发布时间'] || row['发布时间'] || row['Post Time'] || '',
          类型: row['笔记类型'] || row['类型'] || row['Type'] || '',
          名称: row['笔记名称'] || row['名称'] || row['Name'] || '',
          链接: row['笔记链接'] || row['链接'] || row['Link'] || ''
        }))

        // Store in memory using the notes store
        const notesStore = getLifeCarNotesStore()
        notesStore.setData(formattedNotes)

        processedData.lifecarNotes = formattedNotes
        processed.lifecarNotes = true
        console.log(`Processed ${formattedNotes.length} LifeCar notes records after filtering`)
      } catch (error) {
        console.error('Error processing Lifecar笔记 sheet:', error)
      }
    }

    // Return all processed data
    return NextResponse.json({
      success: true,
      message: 'All data processed successfully',
      processed,
      data: processedData,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('All-in-one upload error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process file',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// Helper function to process weekly data from broker records (counting records per week)
function processWeeklyDataFromBroker(brokerData: any[]): any[] {
  const weeklyMap = new Map()
  let validDates = 0
  let invalidDates = 0

  brokerData.forEach((row: any, index: number) => {
    const dateValue = row.date || row['日期']
    if (!dateValue) {
      if (index < 5) console.log(`Row ${index}: No date value found`)
      invalidDates++
      return
    }

    let dateObj = null
    if (typeof dateValue === 'number') {
      dateObj = parseExcelDate(dateValue)
      if (index < 5) console.log(`Row ${index}: Excel date ${dateValue} -> ${dateObj}`)
    } else if (typeof dateValue === 'string') {
      dateObj = new Date(dateValue)
      if (index < 5) console.log(`Row ${index}: String date "${dateValue}" -> ${dateObj}`)
    }

    if (!dateObj || isNaN(dateObj.getTime())) {
      if (index < 5) console.log(`Row ${index}: Invalid date conversion for ${dateValue}`)
      invalidDates++
      return
    }

    validDates++
    const week = getWeekString(dateObj)

    if (!weeklyMap.has(week)) {
      weeklyMap.set(week, {
        week,
        leadsTotal: 0,  // Count of records (matching excel-data format)
        totalCost: 0,    // Will be 0 as we don't have cost in broker data
        leadsPrice: 0    // Will be 0 as we don't have cost
      })
    }

    const weekData = weeklyMap.get(week)
    weekData.leadsTotal += 1  // Each record counts as 1 lead
  })

  console.log(`Weekly data processing: ${validDates} valid dates, ${invalidDates} invalid dates`)

  return Array.from(weeklyMap.values()).sort((a, b) =>
    a.week.localeCompare(b.week)
  )
}

// Helper function to process monthly data from broker records (counting records per month)
function processMonthlyDataFromBroker(brokerData: any[]): any[] {
  const monthlyMap = new Map()

  brokerData.forEach((row: any) => {
    const dateValue = row.date || row['日期']
    if (!dateValue) return

    let dateObj = null
    if (typeof dateValue === 'number') {
      dateObj = parseExcelDate(dateValue)
    } else if (typeof dateValue === 'string') {
      dateObj = new Date(dateValue)
    }

    if (!dateObj || isNaN(dateObj.getTime())) return

    const year = dateObj.getFullYear()
    const month = dateObj.getMonth() + 1
    const monthKey = `${year}/${month.toString().padStart(2, '0')}`

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthKey,
        cost: 0,    // Will be 0 as we don't have cost in broker data
        count: 0    // Count of records (matching excel-data format)
      })
    }

    const monthData = monthlyMap.get(monthKey)
    monthData.count += 1  // Each record counts as 1 client
  })

  return Array.from(monthlyMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  )
}

// Helper function to process daily data from broker records (counting records per day)
function processDailyDataFromBroker(brokerData: any[]): any[] {
  const dailyMap = new Map()

  brokerData.forEach((row: any) => {
    const dateValue = row.date || row['日期']
    if (!dateValue) return

    let dateStr: string
    if (typeof dateValue === 'number') {
      const dateObj = parseExcelDate(dateValue)
      if (!dateObj) return
      dateStr = dateObj.toISOString().split('T')[0]
    } else {
      dateStr = dateValue.toString().split(' ')[0] // Remove time if present
    }

    if (!dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, {
        date: dateStr,
        cost: 0,  // Will be 0 as we don't have cost in broker data
        leads_amount: 0
      })
    }

    const dayData = dailyMap.get(dateStr)
    dayData.leads_amount += 1  // Each record counts as 1 lead
  })

  return Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  )
}

// Trigger recompile
