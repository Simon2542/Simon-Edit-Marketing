import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // 读取默认的小王数据文件
    const filePath = path.join(process.cwd(), 'full data', '账户-小王投放数据（~9.9）.csv')

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: '默认数据文件不存在' },
        { status: 404 }
      )
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const lines = fileContent.split('\n')
    const headers = lines[0].replace(/^\ufeff/, '').split(',').map(h => h.trim())

    const data: any[] = []
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',')
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || ''
        })
        data.push(row)
      }
    }

    // 处理数据
    const processedData = processXiaowangData(data)

    return NextResponse.json({
      success: true,
      data: processedData,
      fileName: '账户-小王投放数据（~9.9）.csv'
    })
  } catch (error: any) {
    console.error('读取默认文件失败:', error)
    return NextResponse.json(
      { error: '读取文件失败', details: error.message },
      { status: 500 }
    )
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
    const cost = parseFloat(row['消费'] || '0')
    const impressions = parseInt(row['展现量'] || '0')
    const clicks = parseInt(row['点击量'] || '0')
    const interactions = parseInt(row['互动量'] || '0')
    const clickRate = parseFloat(row['点击率']?.replace('%', '') || '0')
    const followers = parseInt(row['关注'] || '0')
    const saves = parseInt(row['收藏'] || '0')
    const likes = parseInt(row['点赞'] || '0')
    const comments = parseInt(row['评论'] || '0')
    const shares = parseInt(row['分享'] || '0')
    const conversions = parseInt(row['多转化人数（添加企微+私信咨询）'] || '0')

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
      date: row['时间'] || '',
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
      avgClickCost: parseFloat(row['平均点击成本'] || '0'),
      avgInteractionCost: parseFloat(row['平均互动成本'] || '0'),
      conversionCost: parseFloat(row['多转化成本（添加企微+私信咨询）'] || '0'),
      avgCPM: parseFloat(row['平均千次展现费用'] || '0'),
      actionClicks: parseInt(row['行动按钮点击量'] || '0'),
      actionClickRate: parseFloat(row['行动按钮点击率']?.replace('%', '') || '0'),
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

  // 按日期分组数据（用于图表展示）
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
    const dateA = parseDate(a.date)
    const dateB = parseDate(b.date)
    return dateA - dateB
  })

  return {
    summary,
    dailyData: sortedDailyData,
    rawData: processedRows,
    totalRows: processedRows.length
  }
}

function parseDate(dateStr: string): number {
  // 处理 "31/10/2024" 格式
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const day = parseInt(parts[0])
    const month = parseInt(parts[1])
    const year = parseInt(parts[2])
    return new Date(year, month - 1, day).getTime()
  }
  return new Date(dateStr).getTime()
}