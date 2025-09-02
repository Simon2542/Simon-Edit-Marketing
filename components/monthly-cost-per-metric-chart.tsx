"use client"

import React, { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface MonthlyCostPerMetricChartProps {
  data: LifeCarDailyData[]
  title?: string
}

interface MonthlyData {
  month: string
  costPerFollower: number
  costPerClick: number
  costPerLike: number
}

type MetricType = 'costPerFollower' | 'costPerClick' | 'costPerLike'

// Process data grouped by month with complete month filling
function processMonthlyData(data: LifeCarDailyData[]): MonthlyData[] {
  const monthlyGroups: { [key: string]: { items: LifeCarDailyData[], daysInMonth: number, actualDays: number } } = {}
  
  // Group data by month and track days
  data.forEach(item => {
    const month = item.date.substring(0, 7) // YYYY-MM format
    if (!monthlyGroups[month]) {
      // Calculate days in this month
      const [year, monthNum] = month.split('-').map(Number)
      const daysInMonth = new Date(year, monthNum, 0).getDate()
      
      monthlyGroups[month] = { 
        items: [],
        daysInMonth,
        actualDays: 0
      }
    }
    monthlyGroups[month].items.push(item)
    monthlyGroups[month].actualDays++
  })
  
  // Calculate cost per metrics for each month
  return Object.entries(monthlyGroups).map(([month, group]) => {
    const totalSpend = group.items.reduce((sum, item) => sum + item.spend, 0)
    const totalFollowers = group.items.reduce((sum, item) => sum + item.followers, 0)
    const totalClicks = group.items.reduce((sum, item) => sum + item.clicks, 0)
    const totalLikes = group.items.reduce((sum, item) => sum + item.likes, 0)
    
    // Missing days are treated as 0 for all metrics (no additional cost, no additional engagement)
    const missingDays = group.daysInMonth - group.actualDays
    
    return {
      month,
      costPerFollower: totalFollowers > 0 ? totalSpend / totalFollowers : 0,
      costPerClick: totalClicks > 0 ? totalSpend / totalClicks : 0,
      costPerLike: totalLikes > 0 ? totalSpend / totalLikes : 0
    }
  }).sort((a, b) => a.month.localeCompare(b.month))
}

// Calculate nice axis domain and ticks
function calculateNiceScale(minValue: number, maxValue: number, targetTicks: number = 5) {
  const range = maxValue - minValue
  const padding = range * 0.1
  const paddedMin = Math.max(0, minValue - padding)
  const paddedMax = maxValue + padding
  
  const rawInterval = (paddedMax - paddedMin) / targetTicks
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)))
  const normalizedInterval = rawInterval / magnitude
  
  let niceInterval: number
  if (normalizedInterval <= 1) niceInterval = 1
  else if (normalizedInterval <= 2) niceInterval = 2
  else if (normalizedInterval <= 2.5) niceInterval = 2.5
  else if (normalizedInterval <= 5) niceInterval = 5
  else niceInterval = 10
  
  niceInterval *= magnitude
  
  const niceMin = Math.floor(paddedMin / niceInterval) * niceInterval
  const niceMax = Math.ceil(paddedMax / niceInterval) * niceInterval
  
  const ticks: number[] = []
  for (let tick = niceMin; tick <= niceMax; tick += niceInterval) {
    ticks.push(tick)
  }
  
  return {
    domain: [Math.max(0, niceMin), niceMax],
    ticks: ticks.filter(t => t >= 0),
    interval: niceInterval
  }
}

// Label component for cost metrics
const CostMetricLabel = (props: any) => {
  const { x, y, value, viewBox, color } = props
  if (!value || value === 0) return null
  
  const text = `$${value.toFixed(2)}`
  const width = 40
  const height = 14
  
  const chartHeight = viewBox?.height || 300
  const chartTop = viewBox?.y || 0
  const relativePosition = (y - chartTop) / chartHeight
  const shouldPlaceAbove = relativePosition >= 0.5
  const labelY = shouldPlaceAbove ? y - height - 8 : y + 8
  
  const labelColor = color || '#751FAE'
  
  return (
    <g>
      <rect
        x={x - width/2}
        y={labelY}
        width={width}
        height={height}
        fill={`${labelColor}CC`}
        stroke={labelColor}
        strokeWidth="1"
        rx="3"
      />
      <text 
        x={x} 
        y={labelY + height/2} 
        fill="white" 
        fontSize={10} 
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {text}
      </text>
    </g>
  )
}

export function MonthlyCostPerMetricChart({ data, title = "Monthly Cost Analysis" }: MonthlyCostPerMetricChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('costPerFollower')
  
  // Get metric display info
  const getMetricInfo = (metric: MetricType) => {
    switch (metric) {
      case 'costPerFollower':
        return { label: 'Cost per Follower', emoji: '👥', color: '#10B981' }
      case 'costPerClick':
        return { label: 'Cost per View', emoji: '👁️', color: '#3CBDE5' }
      case 'costPerLike':
        return { label: 'Cost per Like', emoji: '❤️', color: '#EF3C99' }
    }
  }
  
  const currentMetricInfo = getMetricInfo(selectedMetric)

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return processMonthlyData(data)
  }, [data])

  // Calculate dynamic scale for selected metric
  const metricScale = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1] }
    }
    
    const metricValues = chartData.map(d => d[selectedMetric]).filter(v => v > 0)
    const minMetric = metricValues.length > 0 ? Math.min(...metricValues) : 0
    const maxMetric = metricValues.length > 0 ? Math.max(...metricValues) : 1
    
    return calculateNiceScale(minMetric, maxMetric, 5)
  }, [chartData, selectedMetric])

  // Format month display
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = chartData.find(d => d.month === label)
      
      if (dataPoint) {
        const [year, month] = label.split('-')
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December']
        const formattedMonth = `${monthNames[parseInt(month) - 1]} ${year}`
        const value = dataPoint[selectedMetric]
        
        return (
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-xl min-w-[200px]">
            <p className="font-bold text-gray-900 mb-3 border-b pb-2">{formattedMonth}</p>
            
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: currentMetricInfo.color }}>
                💰 {currentMetricInfo.label}
              </p>
              <p className="text-sm text-gray-700">${value.toFixed(2)}</p>
            </div>
          </div>
        )
      }
    }
    return null
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#8B5CF6] bg-clip-text text-transparent font-montserrat">
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#8B5CF6] bg-clip-text text-transparent font-montserrat">
              📊 Monthly {currentMetricInfo.label}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Cost per:</span>
            <Button
              variant={selectedMetric === 'costPerClick' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric('costPerClick')}
              className={selectedMetric === 'costPerClick' 
                ? 'bg-[#3CBDE5] hover:bg-[#2563EB] text-white border-0' 
                : 'border-[#3CBDE5] text-[#3CBDE5] hover:bg-[#3CBDE5] hover:text-white'
              }
            >
              View
            </Button>
            <Button
              variant={selectedMetric === 'costPerLike' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric('costPerLike')}
              className={selectedMetric === 'costPerLike' 
                ? 'bg-[#EF3C99] hover:bg-[#E91E63] text-white border-0' 
                : 'border-[#EF3C99] text-[#EF3C99] hover:bg-[#EF3C99] hover:text-white'
              }
            >
              Like
            </Button>
            <Button
              variant={selectedMetric === 'costPerFollower' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric('costPerFollower')}
              className={selectedMetric === 'costPerFollower' 
                ? 'bg-[#10B981] hover:bg-[#059669] text-white border-0' 
                : 'border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white'
              }
            >
              Follower
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
            >
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={formatMonth}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              
              {/* Left Y-axis - Selected Metric */}
              <YAxis 
                orientation="left"
                domain={metricScale.domain}
                ticks={metricScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000) return `$${(value/1000).toFixed(1)}K`
                  return `$${value.toFixed(2)}`
                }}
                label={{ value: `${currentMetricInfo.label} ($)`, angle: -90, position: 'insideLeft' }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Selected Metric Line */}
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={currentMetricInfo.color}
                strokeWidth={3}
                dot={{ fill: currentMetricInfo.color, strokeWidth: 2, r: 4 }}
                name={`${currentMetricInfo.label} ($)`}
                connectNulls={false}
              />
              
              {/* Labels */}
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke="transparent"
                dot={false}
                connectNulls={false}
                legendType="none"
              >
                <LabelList 
                  content={(props: any) => <CostMetricLabel {...props} color={currentMetricInfo.color} />} 
                  position="top" 
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}