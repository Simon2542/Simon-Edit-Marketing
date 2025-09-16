import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// RMB转AUD汇率常量 (4.7 RMB = 1 AUD)
const RMB_TO_AUD_RATE = 4.7

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '没有找到文件' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let data: any[] = []

    if (file.name.endsWith('.csv')) {
      // 处理CSV文件
      const text = buffer.toString('utf-8')

      // Remove BOM if present
      let cleanText = text
      if (cleanText.charCodeAt(0) === 0xFEFF) {
        cleanText = cleanText.substring(1)
      }

      const lines = cleanText.trim().split('\n')

      // Parse CSV header - handle complex CSV with quotes
      const parseCSVLine = (line: string): string[] => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }

        if (current) {
          result.push(current.trim());
        }

        return result;
      };

      // Parse CSV header
      const headers = parseCSVLine(lines[0]);
      console.log('小王测试 CSV Headers:', headers);

      // Parse CSV data - skip the summary row if it exists
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip summary rows (e.g., "合计104条记录")
        if (line.startsWith('合计') || line.includes('条记录')) {
          console.log('Skipping summary row:', line.substring(0, 50));
          continue;
        }

        const values = parseCSVLine(line);
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    } else if (file.name.endsWith('.xlsx')) {
      // 处理Excel文件
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      data = XLSX.utils.sheet_to_json(worksheet)
    } else {
      return NextResponse.json(
        { error: '不支持的文件格式' },
        { status: 400 }
      )
    }

    console.log(`Parsed ${data.length} data rows from 小王测试 file`);

    // 处理数据
    const processedData = processXiaowangData(data)

    return NextResponse.json({
      success: true,
      data: processedData,
      rowCount: data.length,
      fileName: file.name
    })
  } catch (error: any) {
    console.error('处理文件时出错:', error)
    return NextResponse.json(
      { error: '处理文件失败', details: error.message },
      { status: 500 }
    )
  }
}

// 日期格式化函数
function formatDate(dateInput: string): string {
  if (!dateInput) return ''

  try {
    // 解析日期格式：支持两种格式 YYYY-MM-DD 和 DD/MM/YYYY
    let formattedDate = ''

    if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // 已经是 YYYY-MM-DD 格式
      formattedDate = dateInput
    } else if (dateInput.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      // DD/MM/YYYY 格式，需要转换
      const [day, month, year] = dateInput.split('/')
      const paddedDay = day.padStart(2, '0')
      const paddedMonth = month.padStart(2, '0')
      formattedDate = `${year}-${paddedMonth}-${paddedDay}`
    } else {
      // 尝试直接解析其他格式
      const date = new Date(dateInput)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        formattedDate = `${year}-${month}-${day}`
      }
    }

    return formattedDate
  } catch {
    return dateInput // 返回原始输入如果解析失败
  }
}

function processXiaowangData(rawData: any[]) {
  // 计算汇总数据
  const summary = {
    totalCost: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalInteractions: 0,
    totalConversions: 0,
    avgClickRate: 0,
    avgConversionCost: 0,
    totalFollowers: 0,
    totalSaves: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
  }

  // 处理每一行数据
  const processedRows = rawData.map((row, index) => {
    // 货币转换: RMB → AUD (除以4.7)
    const cost = (parseFloat(row['消费'] || row['cost'] || '0')) / RMB_TO_AUD_RATE
    const avgClickCost = (parseFloat(row['平均点击成本'] || row['avgClickCost'] || '0')) / RMB_TO_AUD_RATE
    const avgInteractionCost = (parseFloat(row['平均互动成本'] || row['avgInteractionCost'] || '0')) / RMB_TO_AUD_RATE
    const conversionCost = (parseFloat(row['多转化成本（添加企微+私信咨询）'] || row['conversionCost'] || '0')) / RMB_TO_AUD_RATE
    const cpm = (parseFloat(row['平均千次展现费用'] || row['cpm'] || '0')) / RMB_TO_AUD_RATE

    // 数字字段
    const impressions = parseInt(row['展现量'] || row['impressions'] || '0')
    const clicks = parseInt(row['点击量'] || row['clicks'] || '0')
    const interactions = parseInt(row['互动量'] || row['interactions'] || '0')
    const followers = parseInt(row['关注'] || row['followers'] || '0')
    const saves = parseInt(row['收藏'] || row['saves'] || '0')
    const likes = parseInt(row['点赞'] || row['likes'] || '0')
    const comments = parseInt(row['评论'] || row['comments'] || '0')
    const shares = parseInt(row['分享'] || row['shares'] || '0')
    const conversions = parseInt(row['多转化人数（添加企微+私信咨询）'] || row['conversions'] || '0')
    const actionClicks = parseInt(row['行动按钮点击量'] || row['actionClicks'] || '0')

    // 百分比字段 - 去除%符号
    const clickRate = parseFloat(row['点击率']?.replace('%', '') || row['clickRate'] || '0')
    const actionClickRate = parseFloat(row['行动按钮点击率']?.replace('%', '') || row['actionClickRate'] || '0')

    // 累计汇总数据
    summary.totalCost += cost
    summary.totalImpressions += impressions
    summary.totalClicks += clicks
    summary.totalInteractions += interactions
    summary.totalConversions += conversions
    summary.totalFollowers += followers
    summary.totalSaves += saves
    summary.totalLikes += likes
    summary.totalComments += comments
    summary.totalShares += shares

    return {
      id: index + 1,
      date: formatDate(row['时间'] || row['date'] || ''), // 日期格式化
      cost,
      impressions,
      clicks,
      clickRate,
      interactions,
      followers,
      saves,
      likes,
      comments,
      shares,
      conversions,
      avgClickCost,
      avgInteractionCost,
      conversionCost,
      cpm,
      actionClicks,
      actionClickRate,
    }
  })

  // 计算平均值
  if (processedRows.length > 0) {
    summary.avgClickRate = summary.totalImpressions > 0
      ? (summary.totalClicks / summary.totalImpressions) * 100
      : 0
    summary.avgConversionCost = summary.totalConversions > 0
      ? summary.totalCost / summary.totalConversions
      : 0
  }

  // 按日期分组数据
  const dailyData = processedRows.reduce((acc: any, row) => {
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
    acc[date].followers += row.followers
    acc[date].saves += row.saves
    acc[date].likes += row.likes
    acc[date].comments += row.comments
    acc[date].shares += row.shares
    return acc
  }, {})

  // 转换为数组并排序
  const sortedDailyData = Object.values(dailyData).sort((a: any, b: any) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  return {
    summary,
    dailyData: sortedDailyData,
    rawData: processedRows,
    totalRows: processedRows.length
  }
}