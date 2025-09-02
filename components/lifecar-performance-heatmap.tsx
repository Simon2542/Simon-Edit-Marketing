"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface LifeCarPerformanceHeatmapProps {
  data: LifeCarDailyData[]
  title?: string
}

export function LifeCarPerformanceHeatmap({ data, title = "Performance Heatmap" }: LifeCarPerformanceHeatmapProps) {
  // 按星期几和小时分组数据（这里我们只有日期，所以按星期几分组）
  const weekdayData = data.reduce((acc, item) => {
    const date = new Date(item.date)
    const weekday = date.getDay() // 0 = Sunday, 6 = Saturday
    
    if (!acc[weekday]) {
      acc[weekday] = {
        totalSpend: 0,
        totalInteractions: 0,
        totalImpressions: 0,
        count: 0
      }
    }
    
    acc[weekday].totalSpend += item.spend
    acc[weekday].totalInteractions += item.interactions
    acc[weekday].totalImpressions += item.impressions
    acc[weekday].count += 1
    
    return acc
  }, {} as Record<number, any>)

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  // 找出最大值用于颜色缩放
  const maxSpend = Math.max(...Object.values(weekdayData).map((d: any) => d.totalSpend || 0))
  const maxInteractions = Math.max(...Object.values(weekdayData).map((d: any) => d.totalInteractions || 0))

  const getIntensity = (value: number, max: number) => {
    if (max === 0) return 0
    return Math.min(value / max, 1)
  }

  const getHeatmapColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100'
    if (intensity < 0.2) return 'bg-purple-100'
    if (intensity < 0.4) return 'bg-purple-200'
    if (intensity < 0.6) return 'bg-purple-300'
    if (intensity < 0.8) return 'bg-purple-400'
    return 'bg-purple-500'
  }

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
          🔥 {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 按花费的热力图 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Spend by Day of Week</h4>
            <div className="grid grid-cols-7 gap-2">
              {weekdays.map((day, index) => {
                const dayData = weekdayData[index]
                const intensity = dayData ? getIntensity(dayData.totalSpend, maxSpend) : 0
                const avgSpend = dayData ? dayData.totalSpend / dayData.count : 0
                
                return (
                  <div
                    key={day}
                    className={`p-3 rounded-lg text-center transition-all duration-200 hover:scale-105 cursor-pointer ${getHeatmapColor(intensity)}`}
                    title={`${day}: $${avgSpend.toFixed(2)} avg spend`}
                  >
                    <div className="text-xs font-medium text-gray-800 mb-1">{day.slice(0, 3)}</div>
                    <div className="text-sm font-bold text-gray-900">
                      ${dayData ? dayData.totalSpend.toFixed(0) : '0'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 按互动的热力图 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Interactions by Day of Week</h4>
            <div className="grid grid-cols-7 gap-2">
              {weekdays.map((day, index) => {
                const dayData = weekdayData[index]
                const intensity = dayData ? getIntensity(dayData.totalInteractions, maxInteractions) : 0
                const avgInteractions = dayData ? dayData.totalInteractions / dayData.count : 0
                
                return (
                  <div
                    key={day}
                    className={`p-3 rounded-lg text-center transition-all duration-200 hover:scale-105 cursor-pointer ${getHeatmapColor(intensity).replace('purple', 'pink')}`}
                    title={`${day}: ${avgInteractions.toFixed(1)} avg interactions`}
                  >
                    <div className="text-xs font-medium text-gray-800 mb-1">{day.slice(0, 3)}</div>
                    <div className="text-sm font-bold text-gray-900">
                      {dayData ? dayData.totalInteractions : 0}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 图例 */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <div className="w-3 h-3 bg-purple-100 rounded"></div>
              <div className="w-3 h-3 bg-purple-200 rounded"></div>
              <div className="w-3 h-3 bg-purple-300 rounded"></div>
              <div className="w-3 h-3 bg-purple-400 rounded"></div>
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}