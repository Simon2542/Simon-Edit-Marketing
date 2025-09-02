"use client"

import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface ClickRateEngagementRollingChartProps {
  data: LifeCarDailyData[]
  title?: string
}

interface RollingAverageData {
  date: string
  clicksAvg: number
  engagementAvg: number
  privateMessageAvg: number
  originalClicks: number
  originalEngagement: number
  originalPrivateMessage: number
}

// Calculate 7-day rolling average (7 days before, 0 days after) - Same algorithm as other charts
function calculateRollingAverage(data: LifeCarDailyData[]): RollingAverageData[] {
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date))
  const result: RollingAverageData[] = []
  
  for (let i = 0; i < sortedData.length; i++) {
    // Collect data for current date and previous 7 days (including current date)
    const windowData = []
    for (let j = Math.max(0, i - 6); j <= i; j++) {
      windowData.push(sortedData[j])
    }
    
    // Calculate average for this window
    const clicksSum = windowData.reduce((sum, item) => sum + item.clicks, 0)
    const engagementSum = windowData.reduce((sum, item) => sum + item.interactions, 0)
    // Private messages = multiConversion1 + multiConversion2
    const privateMessageSum = windowData.reduce((sum, item) => 
      sum + (item.multiConversion1 || 0) + (item.multiConversion2 || 0), 0)
    
    result.push({
      date: sortedData[i].date,
      clicksAvg: clicksSum / windowData.length,
      engagementAvg: engagementSum / windowData.length,
      privateMessageAvg: privateMessageSum / windowData.length,
      originalClicks: sortedData[i].clicks,
      originalEngagement: sortedData[i].interactions,
      originalPrivateMessage: (sortedData[i].multiConversion1 || 0) + (sortedData[i].multiConversion2 || 0)
    })
  }
  
  return result
}

// Calculate nice axis domain and ticks for dynamic scaling - Same as other charts
function calculateNiceScale(minValue: number, maxValue: number, targetTicks: number = 7) {
  // Add 10% padding to the range
  const range = maxValue - minValue
  const padding = range * 0.1
  const paddedMin = minValue - padding
  const paddedMax = maxValue + padding
  
  // Calculate raw interval
  const rawInterval = (paddedMax - paddedMin) / targetTicks
  
  // Find the magnitude of the interval
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)))
  
  // Normalize the interval to between 1 and 10
  const normalizedInterval = rawInterval / magnitude
  
  // Choose a nice interval (1, 2, 2.5, 5, or 10)
  let niceInterval: number
  if (normalizedInterval <= 1) niceInterval = 1
  else if (normalizedInterval <= 2) niceInterval = 2
  else if (normalizedInterval <= 2.5) niceInterval = 2.5
  else if (normalizedInterval <= 5) niceInterval = 5
  else niceInterval = 10
  
  niceInterval *= magnitude
  
  // Calculate nice min and max
  const niceMin = Math.floor(paddedMin / niceInterval) * niceInterval
  const niceMax = Math.ceil(paddedMax / niceInterval) * niceInterval
  
  // Generate ticks
  const ticks: number[] = []
  for (let tick = niceMin; tick <= niceMax; tick += niceInterval) {
    ticks.push(tick)
  }
  
  return {
    domain: [Math.max(0, niceMin), niceMax], // Ensure min is not negative for these metrics
    ticks: ticks.filter(t => t >= 0), // Filter out negative ticks
    interval: niceInterval
  }
}

export function ClickRateEngagementRollingChart({ data, title = "7-Day Rolling Average: Clicks vs Engagement & Private Messages" }: ClickRateEngagementRollingChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return calculateRollingAverage(data)
  }, [data])

  // Calculate dynamic scales for both axes
  const { clicksScale, engagementScale } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        clicksScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
        engagementScale: { domain: [0, 50], ticks: [0, 10, 20, 30, 40, 50] }
      }
    }
    
    // Find min and max for clicks with better dynamic range
    const clicksValues = chartData.map(d => d.clicksAvg).filter(v => v > 0)
    const minClicks = clicksValues.length > 0 ? Math.min(...clicksValues) : 0
    const maxClicks = clicksValues.length > 0 ? Math.max(...clicksValues) : 100
    
    // Find min and max for engagement metrics (both engagement and private messages)
    const engagementValues = chartData.map(d => d.engagementAvg).filter(v => v > 0)
    const privateMessageValues = chartData.map(d => d.privateMessageAvg).filter(v => v > 0)
    const allEngagementValues = [...engagementValues, ...privateMessageValues]
    const minEngagement = allEngagementValues.length > 0 ? Math.min(...allEngagementValues) : 0
    const maxEngagement = allEngagementValues.length > 0 ? Math.max(...allEngagementValues) : 50
    
    // Use adaptive tick count based on data range
    const clicksRange = maxClicks - minClicks
    const engagementRange = maxEngagement - minEngagement
    
    const clicksTickCount = clicksRange > 1000 ? 6 : clicksRange > 100 ? 5 : 4
    const engagementTickCount = engagementRange > 1000 ? 6 : engagementRange > 100 ? 5 : 4
    
    return {
      clicksScale: calculateNiceScale(minClicks, maxClicks, clicksTickCount),
      engagementScale: calculateNiceScale(minEngagement, maxEngagement, engagementTickCount)
    }
  }, [chartData])

  // Format date display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find the data point for this date
      const dataPoint = chartData.find(d => d.date === label)
      
      // Format date nicely
      const formattedDate = new Date(label).toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
      
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-xl min-w-[260px]">
          <p className="font-bold text-gray-900 mb-3 border-b pb-2">{formattedDate}</p>
          
          {/* Clicks Section */}
          <div className="mb-3">
            <p className="text-sm font-semibold text-pink-600 mb-1">👆 Clicks</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">7-day Avg:</span> {dataPoint.clicksAvg.toFixed(1)}
            </p>
          </div>
          
          {/* Engagement Section */}
          <div className="mb-3">
            <p className="text-sm font-semibold text-blue-600 mb-1">🤝 Engagement</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">7-day Avg:</span> {dataPoint.engagementAvg.toFixed(1)}
            </p>
          </div>
          
          {/* Private Messages Section */}
          <div>
            <p className="text-sm font-semibold text-purple-600 mb-1">💬 Private Messages</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">7-day Avg:</span> {dataPoint.privateMessageAvg.toFixed(1)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
            📊 {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader>
        <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
          📊 {title}
        </CardTitle>
        <p className="text-sm text-gray-600 font-montserrat font-light">
          7-day rolling average comparison. X-axis: Time, Left Y-axis: Clicks, Right Y-axis: Engagement & Private Messages
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={formatDate}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
              
              {/* Left Y-axis - Clicks */}
              <YAxis 
                yAxisId="clicks"
                orientation="left"
                domain={clicksScale.domain}
                ticks={clicksScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value/1000).toFixed(1)}K`
                  return value.toFixed(0)
                }}
                label={{ value: 'Clicks', angle: -90, position: 'insideLeft' }}
              />
              
              {/* Right Y-axis - Engagement & Private Messages */}
              <YAxis 
                yAxisId="engagement"
                orientation="right"
                domain={engagementScale.domain}
                ticks={engagementScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value/1000).toFixed(1)}K`
                  return value.toFixed(0)
                }}
                label={{ value: 'Engagement & Messages', angle: 90, position: 'insideRight' }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* 7-day Clicks Rolling Average - Left axis */}
              <Line
                yAxisId="clicks"
                type="monotone"
                dataKey="clicksAvg"
                stroke="#EF3C99"
                strokeWidth={3}
                dot={false}
                name="7-day Clicks Avg"
                connectNulls={false}
              />
              
              {/* 7-day Engagement Rolling Average - Right axis */}
              <Line
                yAxisId="engagement"
                type="monotone"
                dataKey="engagementAvg"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
                name="7-day Engagement Avg"
                connectNulls={false}
              />
              
              {/* 7-day Private Messages Rolling Average - Right axis */}
              <Line
                yAxisId="engagement"
                type="monotone"
                dataKey="privateMessageAvg"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={false}
                name="7-day Private Messages Avg"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}