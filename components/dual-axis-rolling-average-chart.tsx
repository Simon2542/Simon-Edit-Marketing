"use client"

import React, { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface DualAxisRollingAverageChartProps {
  data: LifeCarDailyData[]
  title?: string
}

interface RollingAverageData {
  date: string
  spendAvg: number
  clicksAvg: number
  likesAvg: number
  followersAvg: number
  originalSpend: number
  originalClicks: number
  originalLikes: number
  originalFollowers: number
}

type MetricType = 'clicks' | 'likes' | 'followers'

// Calculate 7-day rolling average (7 days before, 0 days after)
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
    const spendSum = windowData.reduce((sum, item) => sum + item.spend, 0)
    const clicksSum = windowData.reduce((sum, item) => sum + item.clicks, 0)
    const likesSum = windowData.reduce((sum, item) => sum + item.likes, 0)
    const followersSum = windowData.reduce((sum, item) => sum + item.followers, 0)
    
    result.push({
      date: sortedData[i].date,
      spendAvg: spendSum / windowData.length,
      clicksAvg: clicksSum / windowData.length,
      likesAvg: likesSum / windowData.length,
      followersAvg: followersSum / windowData.length,
      originalSpend: sortedData[i].spend,
      originalClicks: sortedData[i].clicks,
      originalLikes: sortedData[i].likes,
      originalFollowers: sortedData[i].followers
    })
  }
  
  return result
}

// Calculate nice axis domain and ticks for dynamic scaling
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

export function DualAxisRollingAverageChart({ data, title = "7-Day Rolling Average Analysis: Cost & Metrics" }: DualAxisRollingAverageChartProps) {
  // State for metric selection
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('clicks')
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return calculateRollingAverage(data)
  }, [data])
  
  // Get current metric data and config
  const metricConfig = useMemo(() => {
    switch (selectedMetric) {
      case 'likes':
        return {
          dataKey: 'likesAvg',
          name: '7-day Likes Rolling Avg',
          color: '#EF3C99',
          label: 'Likes',
          icon: '👍',
          yAxisLabel: 'Likes'
        }
      case 'followers':
        return {
          dataKey: 'followersAvg',
          name: '7-day Followers Rolling Avg',
          color: '#10B981',
          label: 'New Followers',
          icon: '👥',
          yAxisLabel: 'New Followers'
        }
      default: // clicks
        return {
          dataKey: 'clicksAvg',
          name: '7-day Views Rolling Avg',
          color: '#3CBDE5',
          label: 'Views',
          icon: '👁️',
          yAxisLabel: 'Views'
        }
    }
  }, [selectedMetric])

  // Calculate dynamic scales for both axes
  const { spendScale, metricScale } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        spendScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
        metricScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] }
      }
    }
    
    // Find min and max for spend with better dynamic range
    const spendValues = chartData.map(d => d.spendAvg).filter(v => v > 0)
    const minSpend = spendValues.length > 0 ? Math.min(...spendValues) : 0
    const maxSpend = spendValues.length > 0 ? Math.max(...spendValues) : 100
    
    // Find min and max for selected metric with better dynamic range
    const metricValues = chartData.map(d => d[metricConfig.dataKey]).filter(v => v > 0)
    const minMetric = metricValues.length > 0 ? Math.min(...metricValues) : 0
    const maxMetric = metricValues.length > 0 ? Math.max(...metricValues) : 100
    
    // Use adaptive tick count based on data range
    const spendRange = maxSpend - minSpend
    const metricRange = maxMetric - minMetric
    
    const spendTickCount = spendRange > 1000 ? 6 : spendRange > 100 ? 5 : 4
    const metricTickCount = metricRange > 1000 ? 6 : metricRange > 100 ? 5 : 4
    
    return {
      spendScale: calculateNiceScale(minSpend, maxSpend, spendTickCount),
      metricScale: calculateNiceScale(minMetric, maxMetric, metricTickCount)
    }
  }, [chartData, metricConfig.dataKey])

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
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-xl min-w-[220px]">
          <p className="font-bold text-gray-900 mb-3 border-b pb-2">{formattedDate}</p>
          
          {/* Cost Section */}
          <div className="mb-3">
            <p className="text-sm font-semibold text-pink-600 mb-1">💰 Cost</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">7-day Avg:</span> ${dataPoint.spendAvg.toFixed(2)}
            </p>
          </div>
          
          {/* Selected Metric Section */}
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: metricConfig.color }}>
              {metricConfig.icon} {metricConfig.label}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">7-day Avg:</span> {dataPoint[metricConfig.dataKey].toFixed(1)}
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
            📈 {title}
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
              📈 7-Day Rolling Average Analysis: Cost & {metricConfig.label}
            </CardTitle>
            <p className="text-sm text-gray-600 font-montserrat font-light mt-1">
              7-day rolling average comparison analysis. Left Y-axis: Cost, Right Y-axis: {metricConfig.label}
            </p>
          </div>
          
          {/* Metric Selection Buttons */}
          <div className="flex gap-2">
            <Button
              variant={selectedMetric === 'clicks' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric('clicks')}
              className={selectedMetric === 'clicks' 
                ? 'bg-[#3CBDE5] hover:bg-[#2563EB] text-white border-0' 
                : 'border-[#3CBDE5] text-[#3CBDE5] hover:bg-[#3CBDE5] hover:text-white'
              }
            >
              Views
            </Button>
            <Button
              variant={selectedMetric === 'likes' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric('likes')}
              className={selectedMetric === 'likes' 
                ? 'bg-[#EF3C99] hover:bg-[#E91E63] text-white border-0' 
                : 'border-[#EF3C99] text-[#EF3C99] hover:bg-[#EF3C99] hover:text-white'
              }
            >
              Likes
            </Button>
            <Button
              variant={selectedMetric === 'followers' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric('followers')}
              className={selectedMetric === 'followers' 
                ? 'bg-[#10B981] hover:bg-[#059669] text-white border-0' 
                : 'border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white'
              }
            >
              Followers
            </Button>
          </div>
        </div>
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
                label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }}
              />
              
              {/* Right Y-axis - Selected Metric */}
              <YAxis 
                yAxisId="metric"
                orientation="right"
                domain={metricScale.domain}
                ticks={metricScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value/1000).toFixed(1)}K`
                  return value.toFixed(0)
                }}
                label={{ value: metricConfig.yAxisLabel, angle: 90, position: 'insideRight' }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* 7-day Cost Rolling Average - Left axis */}
              <Line
                yAxisId="spend"
                type="monotone"
                dataKey="spendAvg"
                stroke="#751FAE"
                strokeWidth={3}
                dot={false}
                name="7-day Cost Rolling Avg"
                connectNulls={false}
              />
              
              {/* 7-day Selected Metric Rolling Average - Right axis */}
              <Line
                yAxisId="metric"
                type="monotone"
                dataKey={metricConfig.dataKey}
                stroke={metricConfig.color}
                strokeWidth={3}
                dot={false}
                name={metricConfig.name}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}