"use client"

import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface SpendInteractionRollingChartProps {
  data: LifeCarDailyData[]
  title?: string
}

interface RollingAverageData {
  date: string
  spendAvg: number
  interactionAvg: number
  privateMessageAvg: number
  originalSpend: number
  originalInteraction: number
  originalPrivateMessage: number
}

// Calculate 7-day rolling average (7 days before, 0 days after) - Same algorithm as dual-axis-rolling-average-chart
function calculateRollingAverage(data: LifeCarDailyData[]): RollingAverageData[] {
  const sortedData = [...data].sort((a, b) => {
    const dateA = typeof a.date === 'string' ? a.date : String(a.date);
    const dateB = typeof b.date === 'string' ? b.date : String(b.date);
    return dateA.localeCompare(dateB);
  })
  const result: RollingAverageData[] = []
  
  for (let i = 0; i < sortedData.length; i++) {
    // Collect data for current date and previous 7 days (including current date)
    const windowData = []
    for (let j = Math.max(0, i - 6); j <= i; j++) {
      windowData.push(sortedData[j])
    }
    
    // Calculate average for this window
    const spendSum = windowData.reduce((sum, item) => sum + item.spend, 0)
    const interactionSum = windowData.reduce((sum, item) => sum + item.interactions, 0)
    // Private messages = multiConversion1 + multiConversion2
    const privateMessageSum = windowData.reduce((sum, item) => 
      sum + (item.multiConversion1 || 0) + (item.multiConversion2 || 0), 0)
    
    result.push({
      date: sortedData[i].date,
      spendAvg: spendSum / windowData.length,
      interactionAvg: interactionSum / windowData.length,
      privateMessageAvg: privateMessageSum / windowData.length,
      originalSpend: sortedData[i].spend,
      originalInteraction: sortedData[i].interactions,
      originalPrivateMessage: (sortedData[i].multiConversion1 || 0) + (sortedData[i].multiConversion2 || 0)
    })
  }
  
  return result
}

// Calculate nice axis domain and ticks for dynamic scaling - Same as dual-axis-rolling-average-chart
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

export function SpendInteractionRollingChart({ data, title = "7-Day Rolling Average: Spend vs Interaction & Private Messages" }: SpendInteractionRollingChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return calculateRollingAverage(data)
  }, [data])

  // Calculate dynamic scales for both axes
  const { spendScale, interactionScale } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        spendScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
        interactionScale: { domain: [0, 50], ticks: [0, 10, 20, 30, 40, 50] }
      }
    }
    
    // Find min and max for spend with better dynamic range
    const spendValues = chartData.map(d => d.spendAvg).filter(v => v > 0)
    const minSpend = spendValues.length > 0 ? Math.min(...spendValues) : 0
    const maxSpend = spendValues.length > 0 ? Math.max(...spendValues) : 100
    
    // Find min and max for engagement metrics (both engagement and private messages)
    const interactionValues = chartData.map(d => d.interactionAvg).filter(v => v > 0)
    const privateMessageValues = chartData.map(d => d.privateMessageAvg).filter(v => v > 0)
    const allInteractionValues = [...interactionValues, ...privateMessageValues]
    const minInteraction = allInteractionValues.length > 0 ? Math.min(...allInteractionValues) : 0
    const maxInteraction = allInteractionValues.length > 0 ? Math.max(...allInteractionValues) : 50
    
    // Use adaptive tick count based on data range
    const spendRange = maxSpend - minSpend
    const interactionRange = maxInteraction - minInteraction
    
    const spendTickCount = spendRange > 1000 ? 6 : spendRange > 100 ? 5 : 4
    const interactionTickCount = interactionRange > 1000 ? 6 : interactionRange > 100 ? 5 : 4
    
    return {
      spendScale: calculateNiceScale(minSpend, maxSpend, spendTickCount),
      interactionScale: calculateNiceScale(minInteraction, maxInteraction, interactionTickCount)
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
      
      // Calculate day-over-day changes if previous data exists
      const currentIndex = chartData.findIndex(d => d.date === label)
      const prevData = currentIndex > 0 ? chartData[currentIndex - 1] : null
      
      const spendChange = prevData 
        ? ((dataPoint.spendAvg - prevData.spendAvg) / prevData.spendAvg * 100)
        : null
      const engagementChange = prevData
        ? ((dataPoint.engagementAvg - prevData.engagementAvg) / prevData.engagementAvg * 100)
        : null
      const privateMessageChange = prevData && prevData.privateMessageAvg > 0
        ? ((dataPoint.privateMessageAvg - prevData.privateMessageAvg) / prevData.privateMessageAvg * 100)
        : null
      
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-xl min-w-[260px]">
          <p className="font-bold text-gray-900 mb-3 border-b pb-2">{formattedDate}</p>
          
          {/* Spend Section */}
          <div className="mb-3">
            <p className="text-sm font-semibold text-pink-600 mb-1">💰 Spend</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">7-day Avg:</span> ${dataPoint.spendAvg.toFixed(2)}
            </p>
          </div>
          
          {/* Interaction Section */}
          <div className="mb-3">
            <p className="text-sm font-semibold text-blue-600 mb-1">🤝 Interaction</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">7-day Avg:</span> {dataPoint.interactionAvg.toFixed(1)}
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
          7-day rolling average comparison. X-axis: Time, Left Y-axis: Spend, Right Y-axis: Interaction & Private Messages
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
              
              {/* Left Y-axis - Spend */}
              <YAxis 
                yAxisId="spend"
                orientation="left"
                domain={spendScale.domain}
                ticks={spendScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `$${(value/1000000).toFixed(1)}M`
                  if (value >= 1000) return `$${(value/1000).toFixed(1)}K`
                  return `$${value.toFixed(0)}`
                }}
                label={{ value: 'Spend ($)', angle: -90, position: 'insideLeft' }}
              />
              
              {/* Right Y-axis - Interaction & Private Messages */}
              <YAxis 
                yAxisId="interaction"
                orientation="right"
                domain={interactionScale.domain}
                ticks={interactionScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value/1000).toFixed(1)}K`
                  return value.toFixed(0)
                }}
                label={{ value: 'Interaction & Messages', angle: 90, position: 'insideRight' }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* 7-day Spend Rolling Average - Left axis */}
              <Line
                yAxisId="spend"
                type="monotone"
                dataKey="spendAvg"
                stroke="#EF3C99"
                strokeWidth={3}
                dot={false}
                name="7-day Spend Avg"
                connectNulls={false}
              />
              
              {/* 7-day Interaction Rolling Average - Right axis */}
              <Line
                yAxisId="interaction"
                type="monotone"
                dataKey="interactionAvg"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
                name="7-day Interaction Avg"
                connectNulls={false}
              />
              
              {/* 7-day Private Messages Rolling Average - Right axis */}
              <Line
                yAxisId="interaction"
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