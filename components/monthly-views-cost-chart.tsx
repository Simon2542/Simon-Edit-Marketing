"use client"

import React, { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface MonthlyViewsCostChartProps {
  data: LifeCarDailyData[]
  title?: string
}

interface MonthlyData {
  month: string
  views: number
  likes: number
  followers: number
  cost: number
}

type MetricType = 'views' | 'likes' | 'followers'

// Process data grouped by month with complete month filling
function processMonthlyData(data: LifeCarDailyData[]): MonthlyData[] {
  const monthlyGroups: { [key: string]: { views: number[], likes: number[], followers: number[], costs: number[], daysInMonth: number, actualDays: number } } = {}
  
  // Group data by month and track actual days vs expected days
  data.forEach(item => {
    const month = item.date.substring(0, 7) // YYYY-MM format
    if (!monthlyGroups[month]) {
      // Calculate days in this month
      const [year, monthNum] = month.split('-').map(Number)
      const daysInMonth = new Date(year, monthNum, 0).getDate()
      
      monthlyGroups[month] = { 
        views: [], 
        likes: [], 
        followers: [], 
        costs: [],
        daysInMonth,
        actualDays: 0
      }
    }
    monthlyGroups[month].views.push(item.clicks)
    monthlyGroups[month].likes.push(item.likes)
    monthlyGroups[month].followers.push(item.followers)
    monthlyGroups[month].costs.push(item.spend)
    monthlyGroups[month].actualDays++
  })
  
  // Calculate totals and fill missing days with zeros
  return Object.entries(monthlyGroups).map(([month, group]) => {
    const totalViews = group.views.reduce((a, b) => a + b, 0)
    const totalLikes = group.likes.reduce((a, b) => a + b, 0)
    const totalFollowers = group.followers.reduce((a, b) => a + b, 0)
    const totalCost = group.costs.reduce((a, b) => a + b, 0)
    
    // Fill missing days with zeros
    const missingDays = group.daysInMonth - group.actualDays
    
    return {
      month,
      views: Math.round(totalViews), // Keep actual totals, missing days are implicitly 0
      likes: Math.round(totalLikes),
      followers: Math.round(totalFollowers),
      cost: Math.round(totalCost * 100) / 100 // Round to 2 decimal places
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

// Label components with simple position-based logic
const RelativeMetricLabel = (props: any) => {
  const { x, y, value, viewBox, color } = props
  if (!value || value === 0) return null
  
  const text = value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toString()
  const width = 36
  const height = 14
  
  // Simple logic: if point is in upper half of chart, label goes above
  // if point is in lower half, label goes below
  const chartHeight = viewBox?.height || 300
  const chartTop = viewBox?.y || 0
  const relativePosition = (y - chartTop) / chartHeight
  
  const shouldPlaceAbove = relativePosition < 0.5
  const labelY = shouldPlaceAbove ? y - height - 8 : y + 8
  
  return (
    <g>
      <rect
        x={x - width/2}
        y={labelY}
        width={width}
        height={height}
        fill={`${color}CC`}
        stroke={color}
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

const RelativeCostLabel = (props: any) => {
  const { x, y, value, viewBox } = props
  if (!value || value === 0) return null
  
  const text = `$${value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0)}`
  const width = 36
  const height = 14
  
  // Opposite logic from metric labels to avoid overlap
  // if point is in upper half of chart, label goes below
  // if point is in lower half, label goes above
  const chartHeight = viewBox?.height || 300
  const chartTop = viewBox?.y || 0
  const relativePosition = (y - chartTop) / chartHeight
  
  const shouldPlaceAbove = relativePosition > 0.5
  const labelY = shouldPlaceAbove ? y - height - 8 : y + 8
  
  return (
    <g>
      <rect
        x={x - width/2}
        y={labelY}
        width={width}
        height={height}
        fill="rgba(117, 31, 174, 0.7)"
        stroke="rgba(117, 31, 174, 1)"
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

export function MonthlyViewsCostChart({ data, title = "Monthly Metrics & Cost Analysis" }: MonthlyViewsCostChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('views')
  
  // Get current metric config
  const metricConfig = useMemo(() => {
    switch (selectedMetric) {
      case 'likes':
        return {
          dataKey: 'likes',
          name: 'Likes',
          color: '#EF3C99',
          label: 'Likes',
          yAxisLabel: 'Likes'
        }
      case 'followers':
        return {
          dataKey: 'followers',
          name: 'New Followers',
          color: '#10B981',
          label: 'New Followers',
          yAxisLabel: 'New Followers'
        }
      default: // views
        return {
          dataKey: 'views',
          name: 'Views',
          color: '#3CBDE5',
          label: 'Views',
          yAxisLabel: 'Views'
        }
    }
  }, [selectedMetric])

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return processMonthlyData(data)
  }, [data])

  // Calculate average cost per month
  const avgCostPerMonth = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0
    const totalCost = chartData.reduce((sum, item) => sum + item.cost, 0)
    const totalMonths = chartData.length
    return totalMonths > 0 ? totalCost / totalMonths : 0
  }, [chartData])

  // Calculate dynamic scales for both axes
  const { metricScale, costScale } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        metricScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
        costScale: { domain: [0, 1000], ticks: [0, 250, 500, 750, 1000] }
      }
    }
    
    const metricValues = chartData.map(d => d[metricConfig.dataKey as keyof MonthlyData] as number).filter(v => v > 0)
    const minMetric = metricValues.length > 0 ? Math.min(...metricValues) : 0
    const maxMetric = metricValues.length > 0 ? Math.max(...metricValues) : 100
    
    const costValues = chartData.map(d => d.cost).filter(v => v > 0)
    if (avgCostPerMonth > 0) costValues.push(avgCostPerMonth)
    const minCost = costValues.length > 0 ? Math.min(...costValues) : 0
    const maxCost = costValues.length > 0 ? Math.max(...costValues) : 1000
    
    return {
      metricScale: calculateNiceScale(minMetric, maxMetric, 5),
      costScale: calculateNiceScale(minCost, maxCost, 5)
    }
  }, [chartData, metricConfig.dataKey, avgCostPerMonth])

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
        
        return (
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-xl min-w-[200px]">
            <p className="font-bold text-gray-900 mb-3 border-b pb-2">{formattedMonth}</p>
            
            <div className="mb-2">
              <p className="text-sm font-semibold mb-1" style={{ color: metricConfig.color }}>
                {metricConfig.label === 'Views' ? '👁️' : metricConfig.label === 'Likes' ? '❤️' : '👥'} {metricConfig.label}
              </p>
              <p className="text-sm text-gray-700">{dataPoint[metricConfig.dataKey as keyof MonthlyData].toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#751FAE' }}>💰 Cost</p>
              <p className="text-sm text-gray-700">${dataPoint.cost.toFixed(2)}</p>
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#8B5CF6] bg-clip-text text-transparent font-montserrat">
              📈 Monthly {metricConfig.label} & Cost Trend
            </CardTitle>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={selectedMetric === 'views' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric('views')}
              className={selectedMetric === 'views' 
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
              margin={{ top: 20, right: 80, left: 40, bottom: 60 }}
            >
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={formatMonth}
                angle={-45}
                textAnchor="end"
                height={80}
                scale="point"
                padding={{ left: 30, right: 30 }}
              />
              
              {/* Left Y-axis - Cost */}
              <YAxis 
                yAxisId="cost"
                orientation="left"
                domain={costScale.domain}
                ticks={costScale.ticks}
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
              
              {/* Average Cost per Month Reference Line - Orange dashed line */}
              {avgCostPerMonth > 0 && (
                <ReferenceLine 
                  yAxisId="cost"
                  y={avgCostPerMonth} 
                  stroke="#FF8C00" 
                  strokeDasharray="8 4"
                  strokeWidth={2}
                />
              )}
              
              {/* Invisible Line for Legend display only - placed last to appear last in legend */}
              {avgCostPerMonth > 0 && (
                <Line
                  yAxisId="cost"
                  type="monotone"
                  dataKey={() => null}
                  stroke="#FF8C00"
                  strokeDasharray="8 4"
                  strokeWidth={2}
                  dot={false}
                  name={`Average Cost per Month: $${avgCostPerMonth.toFixed(0)}`}
                  connectNulls={false}
                  legendType="line"
                />
              )}
              
              {/* Cost Line - Left axis */}
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="cost"
                stroke="#751FAE"
                strokeWidth={3}
                dot={{ fill: '#751FAE', strokeWidth: 2, r: 4 }}
                name="Cost ($)"
                connectNulls={false}
              />
              
              {/* Metric Line - Right axis */}
              <Line
                yAxisId="metric"
                type="monotone"
                dataKey={metricConfig.dataKey}
                stroke={metricConfig.color}
                strokeWidth={3}
                dot={{ fill: metricConfig.color, strokeWidth: 2, r: 4 }}
                name={metricConfig.name}
                connectNulls={false}
              />
              
              {/* Labels */}
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="cost"
                stroke="transparent"
                dot={false}
                connectNulls={false}
                legendType="none"
              >
                <LabelList content={RelativeCostLabel} position="top" />
              </Line>
              
              <Line
                yAxisId="metric"
                type="monotone"
                dataKey={metricConfig.dataKey}
                stroke="transparent"
                dot={false}
                connectNulls={false}
                legendType="none"
              >
                <LabelList content={(props) => <RelativeMetricLabel {...props} color={metricConfig.color} />} position="top" />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}