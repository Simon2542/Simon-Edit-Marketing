"use client"

import { useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface LifeCarDailyTrendsProps {
  data: LifeCarDailyData[]
  title?: string
}

export function LifeCarDailyTrends({ data, title = "Daily Performance Trends" }: LifeCarDailyTrendsProps) {
  // 数据系列控制状态 - 顺序：Cost, Views, Likes, Followers
  const [visibleSeries, setVisibleSeries] = useState({
    cost: true,
    views: true,
    likes: true,
    followers: true
  })

  // 切换系列可见性
  const toggleSeries = (seriesKey: keyof typeof visibleSeries) => {
    setVisibleSeries(prev => ({
      ...prev,
      [seriesKey]: !prev[seriesKey]
    }))
  }

  // 数据系列配置 - 与 Trend Overview 保持完全一致的颜色
  const seriesConfig = [
    { key: 'cost', label: 'Cost', color: '#751FAE' },         // Purple - 与 Trend Overview 一致
    { key: 'views', label: 'Views (÷10)', color: '#3CBDE5' }, // Blue - 与 Trend Overview 一致 
    { key: 'likes', label: 'Likes', color: '#EF3C99' },       // Pink - 与 Trend Overview 一致
    { key: 'followers', label: 'Followers', color: '#10B981' } // Green - 与 Trend Overview 一致
  ]
  const chartData = data.map(item => ({
    date: item.date.substring(5), // 只显示月-日
    cost: item.spend,
    views: Math.round(item.clicks / 10), // 使用 clicks 作为 views，除以10便于展示
    likes: item.likes,
    followers: item.followers
  }))

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
          📈 {title}
        </CardTitle>
        
        {/* 数据系列筛选按钮 */}
        <div className="flex flex-wrap gap-2 mt-4">
          {seriesConfig.map((series) => (
            <Button
              key={series.key}
              variant={visibleSeries[series.key as keyof typeof visibleSeries] ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSeries(series.key as keyof typeof visibleSeries)}
              className={`transition-all duration-200 ${
                visibleSeries[series.key as keyof typeof visibleSeries]
                  ? 'bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white hover:from-[#6919A6] hover:to-[#E73691]'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-xs font-medium">{series.label}</span>
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'cost') {
                    return [`$${value.toFixed(2)}`, 'Cost']
                  }
                  if (name === 'views') {
                    return [(value * 10).toLocaleString(), 'Views']
                  }
                  return [value.toLocaleString(), name]
                }}
              />
              <Legend 
                payload={[
                  { value: 'Cost', type: 'line', color: '#751FAE' },
                  { value: 'Views (÷10)', type: 'line', color: '#3CBDE5' },
                  { value: 'Likes', type: 'line', color: '#EF3C99' },
                  { value: 'Followers', type: 'line', color: '#10B981' }
                ].filter(item => {
                  // 只显示当前可见的系列
                  if (item.value === 'Cost') return visibleSeries.cost;
                  if (item.value === 'Views (÷10)') return visibleSeries.views;
                  if (item.value === 'Likes') return visibleSeries.likes;
                  if (item.value === 'Followers') return visibleSeries.followers;
                  return false;
                })}
              />
              {visibleSeries.cost && (
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#751FAE" 
                  strokeWidth={2}
                  name="Cost"
                  dot={false}
                />
              )}
              {visibleSeries.views && (
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#3CBDE5" 
                  strokeWidth={2}
                  name="Views (÷10)"
                  dot={false}
                />
              )}
              {visibleSeries.likes && (
                <Line 
                  type="monotone" 
                  dataKey="likes" 
                  stroke="#EF3C99" 
                  strokeWidth={2}
                  name="Likes"
                  dot={false}
                />
              )}
              {visibleSeries.followers && (
                <Line 
                  type="monotone" 
                  dataKey="followers" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Followers"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}