"use client"

import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface ClickRateInteractionRateRollingChartProps {
  data: LifeCarDailyData[]
  title?: string
}

interface RollingAverageData {
  date: string
  clickRateAvg: number
  interactionRateAvg: number
  originalClickRate: number
  originalInteractionRate: number
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
    const clickRateSum = windowData.reduce((sum, item) => sum + item.clickRate, 0)
    
    // Calculate interaction rate for each item: interactions/clicks * 100
    const interactionRateSum = windowData.reduce((sum, item) => {
      const interactionRate = item.clicks > 0 ? (item.interactions / item.clicks) * 100 : 0
      return sum + interactionRate
    }, 0)
    
    result.push({
      date: sortedData[i].date,
      clickRateAvg: clickRateSum / windowData.length,
      interactionRateAvg: interactionRateSum / windowData.length,
      originalClickRate: sortedData[i].clickRate,
      originalInteractionRate: sortedData[i].clicks > 0 ? (sortedData[i].interactions / sortedData[i].clicks) * 100 : 0
    })
  }
  
  return result
}

// Calculate axis domain and ticks with 1% intervals
function calculateFixedScale(minValue: number, maxValue: number) {
  // Add 2 percentage points to the max, keep min at 0 for rates
  const paddedMin = 0
  const paddedMax = maxValue + 2
  
  // Round up to nearest integer for clean scale
  const niceMax = Math.ceil(paddedMax)
  
  // Generate ticks with 1% intervals
  const ticks: number[] = []
  for (let tick = 0; tick <= niceMax; tick += 1) {
    ticks.push(tick)
  }
  
  return {
    domain: [0, niceMax],
    ticks: ticks,
    interval: 1
  }
}

export function ClickRateInteractionRateRollingChart({ data, title = "7-Day Rolling Average: Click Rate vs Interaction Rate" }: ClickRateInteractionRateRollingChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return calculateRollingAverage(data)
  }, [data])

  // Calculate dynamic scales for both axes
  const { clickRateScale, interactionRateScale } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        clickRateScale: { domain: [0, 10], ticks: [0, 2.5, 5, 7.5, 10] },
        interactionRateScale: { domain: [0, 50], ticks: [0, 10, 20, 30, 40, 50] }
      }
    }
    
    // Find min and max for click rate with better dynamic range
    const clickRateValues = chartData.map(d => d.clickRateAvg).filter(v => v > 0)
    const minClickRate = clickRateValues.length > 0 ? Math.min(...clickRateValues) : 0
    const maxClickRate = clickRateValues.length > 0 ? Math.max(...clickRateValues) : 10
    
    // Find min and max for interaction rate with better dynamic range
    const interactionRateValues = chartData.map(d => d.interactionRateAvg).filter(v => v > 0)
    const minInteractionRate = interactionRateValues.length > 0 ? Math.min(...interactionRateValues) : 0
    const maxInteractionRate = interactionRateValues.length > 0 ? Math.max(...interactionRateValues) : 50
    
    // Use fixed 1% intervals for both axes
    return {
      clickRateScale: calculateFixedScale(minClickRate, maxClickRate),
      interactionRateScale: calculateFixedScale(minInteractionRate, maxInteractionRate)
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
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-xl min-w-[240px]">
          <p className="font-bold text-gray-900 mb-3 border-b pb-2">{formattedDate}</p>
          
          {/* Click Rate Section */}
          <div className="mb-3">
            <p className="text-sm font-semibold text-pink-600 mb-1">👆 Click Rate</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">7-day Avg:</span> {dataPoint.clickRateAvg.toFixed(2)}%
            </p>
          </div>
          
          {/* Interaction Rate Section */}
          <div>
            <p className="text-sm font-semibold text-blue-600 mb-1">🤝 Interaction Rate</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">7-day Avg:</span> {dataPoint.interactionRateAvg.toFixed(2)}%
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
          7-day rolling average comparison. X-axis: Time, Left Y-axis: Click Rate (%), Right Y-axis: Interaction Rate (% = Interactions/Clicks)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 60, left: 60, bottom: 5 }}
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
              
              {/* Left Y-axis - Click Rate */}
              <YAxis 
                yAxisId="clickRate"
                orientation="left"
                domain={clickRateScale.domain}
                ticks={clickRateScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
                label={{ value: 'Click Rate (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              />
              
              {/* Right Y-axis - Interaction Rate */}
              <YAxis 
                yAxisId="interactionRate"
                orientation="right"
                domain={interactionRateScale.domain}
                ticks={interactionRateScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
                label={{ value: 'Interaction Rate (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* 7-day Click Rate Rolling Average - Left axis */}
              <Line
                yAxisId="clickRate"
                type="monotone"
                dataKey="clickRateAvg"
                stroke="#EF3C99"
                strokeWidth={3}
                dot={false}
                name="7-day Click Rate Avg"
                connectNulls={false}
              />
              
              {/* 7-day Interaction Rate Rolling Average - Right axis */}
              <Line
                yAxisId="interactionRate"
                type="monotone"
                dataKey="interactionRateAvg"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
                name="7-day Interaction Rate Avg"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}