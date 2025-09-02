// LifeCAR数据处理器
export interface LifeCarDailyData {
  date: string
  spend: number
  impressions: number
  clicks: number
  clickRate: number
  avgClickCost: number
  cpm: number
  likes: number
  comments: number
  saves: number
  followers: number
  shares: number
  interactions: number
  avgInteractionCost: number
  actionButtonClicks: number
  actionButtonClickRate: number
  screenshots: number
  imageSaves: number
  searchClicks: number
  searchConversionRate: number
  avgReadNotesAfterSearch: number
  readCountAfterSearch: number
  multiConversion1: number // 多转化人数（添加企微+私信咨询）
  multiConversionCost1: number
  multiConversion2: number // 多转化人数（添加企微成功+私信留资）
  multiConversionCost2: number
}

export interface LifeCarMonthlyData {
  month: string
  totalSpend: number
  totalFollowers: number
  totalInteractions: number
  totalImpressions: number
  totalPrivateMessages: number
  avgDailySpend: number
  avgDailyInteractions: number
  cpm: number // 每千次展现成本
  cpi: number // 每次互动成本
}

export interface LifeCarWeeklyData {
  week: string
  totalSpend: number
  totalFollowers: number
  totalInteractions: number
  totalImpressions: number
  totalPrivateMessages: number
  avgDailySpend: number
}

// RMB转AUD汇率常量 (4.7 RMB = 1 AUD)
const RMB_TO_AUD_RATE = 4.7

// 解析CSV数据
export function parseLifeCarData(csvText: string): LifeCarDailyData[] {
  // Remove BOM if present
  let cleanText = csvText
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.substring(1)
  }
  
  const lines = cleanText.trim().split('\n')
  const data: LifeCarDailyData[] = []
  
  // 跳过标题行，从第二行开始
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // 检查是否包含"合计"，如果是则跳过这一行
    if (line.includes('合计')) continue
    
    const columns = line.split(',')
    // 检查列数，至少需要24列数据（有些列可能为空）
    if (columns.length >= 24) {
      const dateStr = columns[0]
      
      // 解析日期格式：支持两种格式 YYYY-MM-DD 和 DD/MM/YYYY
      let formattedDate = ''
      
      if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // 已经是 YYYY-MM-DD 格式
        formattedDate = dateStr
      } else if (dateStr && dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        // DD/MM/YYYY 格式，需要转换
        const [day, month, year] = dateStr.split('/')
        const paddedDay = day.padStart(2, '0')
        const paddedMonth = month.padStart(2, '0')
        formattedDate = `${year}-${paddedMonth}-${paddedDay}`
      } else {
        // 跳过无效日期格式的行
        continue
      }
      
      if (formattedDate) {
        
        data.push({
          date: formattedDate,
          spend: (parseFloat(columns[1]) || 0) / RMB_TO_AUD_RATE, // RMB转AUD
          impressions: parseInt(columns[2]) || 0,
          clicks: parseInt(columns[3]) || 0,
          clickRate: parseFloat(columns[4]?.replace('%', '')) || 0,
          avgClickCost: (parseFloat(columns[5]) || 0) / RMB_TO_AUD_RATE, // RMB转AUD
          cpm: (parseFloat(columns[6]) || 0) / RMB_TO_AUD_RATE, // RMB转AUD
          likes: parseInt(columns[7]) || 0,
          comments: parseInt(columns[8]) || 0,
          saves: parseInt(columns[9]) || 0,
          followers: parseInt(columns[10]) || 0,
          shares: parseInt(columns[11]) || 0,
          interactions: parseInt(columns[12]) || 0,
          avgInteractionCost: (parseFloat(columns[13]) || 0) / RMB_TO_AUD_RATE, // RMB转AUD
          actionButtonClicks: parseInt(columns[14]) || 0,
          actionButtonClickRate: parseFloat(columns[28]?.replace('%', '')) || 0,
          screenshots: parseInt(columns[16]) || 0,
          imageSaves: parseInt(columns[17]) || 0,
          searchClicks: parseInt(columns[20]) || 0,
          searchConversionRate: parseFloat(columns[21]?.replace('%', '')) || 0,
          avgReadNotesAfterSearch: parseFloat(columns[22]) || 0,
          readCountAfterSearch: parseInt(columns[23]) || 0,
          multiConversion1: parseInt(columns[24]) || 0,
          multiConversionCost1: (parseFloat(columns[25]) || 0) / RMB_TO_AUD_RATE, // RMB转AUD
          multiConversion2: parseInt(columns[26]) || 0,
          multiConversionCost2: (parseFloat(columns[27]) || 0) / RMB_TO_AUD_RATE // RMB转AUD
        })
      }
    }
  }
  
  return data.sort((a, b) => a.date.localeCompare(b.date))
}

// 按月聚合数据
export function aggregateByMonth(dailyData: LifeCarDailyData[]): LifeCarMonthlyData[] {
  const monthlyMap: Record<string, LifeCarDailyData[]> = {}
  
  dailyData.forEach(item => {
    const month = item.date.substring(0, 7) // YYYY-MM
    if (!monthlyMap[month]) {
      monthlyMap[month] = []
    }
    monthlyMap[month].push(item)
  })
  
  return Object.entries(monthlyMap).map(([month, items]) => {
    const totalSpend = items.reduce((sum, item) => sum + item.spend, 0)
    const totalFollowers = items.reduce((sum, item) => sum + item.followers, 0)
    const totalInteractions = items.reduce((sum, item) => sum + item.interactions, 0)
    const totalImpressions = items.reduce((sum, item) => sum + item.impressions, 0)
    const totalPrivateMessages = items.reduce((sum, item) => sum + item.privateMessages, 0)
    const daysCount = items.length
    
    return {
      month,
      totalSpend,
      totalFollowers,
      totalInteractions,
      totalImpressions,
      totalPrivateMessages,
      avgDailySpend: totalSpend / daysCount,
      avgDailyInteractions: totalInteractions / daysCount,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      cpi: totalInteractions > 0 ? totalSpend / totalInteractions : 0
    }
  }).sort((a, b) => a.month.localeCompare(b.month))
}

// 按周聚合数据
export function aggregateByWeek(dailyData: LifeCarDailyData[]): LifeCarWeeklyData[] {
  const weeklyMap: Record<string, LifeCarDailyData[]> = {}
  
  dailyData.forEach(item => {
    const date = new Date(item.date)
    const year = date.getFullYear()
    const weekNum = getWeekNumber(date)
    const weekKey = `${year}/wk${weekNum.toString().padStart(2, '0')}`
    
    if (!weeklyMap[weekKey]) {
      weeklyMap[weekKey] = []
    }
    weeklyMap[weekKey].push(item)
  })
  
  return Object.entries(weeklyMap).map(([week, items]) => {
    const totalSpend = items.reduce((sum, item) => sum + item.spend, 0)
    const totalFollowers = items.reduce((sum, item) => sum + item.followers, 0)
    const totalInteractions = items.reduce((sum, item) => sum + item.interactions, 0)
    const totalImpressions = items.reduce((sum, item) => sum + item.impressions, 0)
    const totalPrivateMessages = items.reduce((sum, item) => sum + item.privateMessages, 0)
    const daysCount = items.length
    
    return {
      week,
      totalSpend,
      totalFollowers,
      totalInteractions,
      totalImpressions,
      totalPrivateMessages,
      avgDailySpend: totalSpend / daysCount
    }
  }).sort((a, b) => a.week.localeCompare(b.week))
}

// 计算周数
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// 按日期范围过滤数据
export function filterByDateRange(
  dailyData: LifeCarDailyData[], 
  startDate?: string, 
  endDate?: string
): LifeCarDailyData[] {
  if (!startDate && !endDate) return dailyData
  
  return dailyData.filter(item => {
    const itemDate = item.date
    if (startDate && itemDate < startDate) return false
    if (endDate && itemDate > endDate) return false
    return true
  })
}