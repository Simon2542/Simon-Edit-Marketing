"use client"

import React, { useMemo, useCallback, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface LikesCostDailyChartProps {
  data: LifeCarDailyData[]
  title?: string
  startDate?: string
  endDate?: string
  allData?: LifeCarDailyData[] // All unfiltered data for toggle functionality
}

interface DailyData {
  date: string
  likes: number
  cost: number
  weekday?: string
}

// Process data for daily likes and cost
function processDailyData(data: LifeCarDailyData[]): DailyData[] {
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date))
  
  return sortedData.map(item => ({
    date: item.date,
    likes: item.likes, // Using likes
    cost: item.spend,    // Using spend as cost
    weekday: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
  }))
}

// Process data grouped by weekday (for non-7-day ranges)
function processWeekdayData(data: LifeCarDailyData[]): DailyData[] {
  const weekdayGroups: { [key: string]: { likes: number[], costs: number[] } } = {
    'Mon': { likes: [], costs: [] },
    'Tue': { likes: [], costs: [] },
    'Wed': { likes: [], costs: [] },
    'Thu': { likes: [], costs: [] },
    'Fri': { likes: [], costs: [] },
    'Sat': { likes: [], costs: [] },
    'Sun': { likes: [], costs: [] }
  }
  
  // Group data by weekday
  data.forEach(item => {
    const weekday = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    if (weekdayGroups[weekday]) {
      weekdayGroups[weekday].likes.push(item.likes)
      weekdayGroups[weekday].costs.push(item.spend)
    }
  })
  
  // Calculate averages and create result
  const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return weekdayOrder.map(weekday => {
    const group = weekdayGroups[weekday]
    const avgLikes = group.likes.length > 0 
      ? group.likes.reduce((a, b) => a + b, 0) / group.likes.length 
      : 0
    const avgCost = group.costs.length > 0 
      ? group.costs.reduce((a, b) => a + b, 0) / group.costs.length 
      : 0
    
    return {
      date: weekday,
      weekday: weekday,
      likes: Math.round(avgLikes),
      cost: Math.round(avgCost * 100) / 100 // Round to 2 decimal places
    }
  }).filter(item => item.likes > 0 || item.cost > 0) // Only include weekdays with data
}

// Calculate nice axis domain and ticks for dynamic scaling
function calculateNiceScale(minValue: number, maxValue: number, targetTicks: number = 5) {
  // Add 10% padding to the range
  const range = maxValue - minValue
  const padding = range * 0.1
  const paddedMin = Math.max(0, minValue - padding) // Ensure min is not negative
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
    domain: [Math.max(0, niceMin), niceMax],
    ticks: ticks.filter(t => t >= 0),
    interval: niceInterval
  }
}

// Store label positions to detect overlaps
let likesLabelPositions: Array<{x: number, y: number, width: number, height: number}> = []
let costLabelPositions: Array<{x: number, y: number, width: number, height: number}> = []

// Label components that position based on relative line position
const RelativeLikesLabel = (props: any) => {
  const { x, y, value, index, payload, viewBox } = props
  if (!value || value === 0) return null
  
  const text = value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toString()
  const width = 30
  const height = 14
  
  // Calculate relative position of likes line (right Y-axis)
  // Get chart boundaries
  const chartHeight = viewBox?.height || 300
  const chartTop = viewBox?.y || 0
  
  // Calculate relative position (0 = top, 1 = bottom)
  const relativePosition = (y - chartTop) / chartHeight
  
  // Likes label goes above if point is in upper half, below if in lower half
  const shouldPlaceAbove = relativePosition < 0.5
  
  const labelY = shouldPlaceAbove ? y - height - 8 : y + 8
  
  return (
    <g>
      <rect
        x={x - width/2}
        y={labelY}
        width={width}
        height={height}
        fill="rgba(239, 60, 153, 0.7)"
        stroke="rgba(239, 60, 153, 1)"
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
  const { x, y, value, index, payload, viewBox } = props
  if (!value || value === 0) return null
  
  const text = `$${value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0)}`
  const width = 36
  const height = 14
  
  // Calculate relative position of cost line (left Y-axis)
  // Get chart boundaries
  const chartHeight = viewBox?.height || 300
  const chartTop = viewBox?.y || 0
  
  // Calculate relative position (0 = top, 1 = bottom)
  const relativePosition = (y - chartTop) / chartHeight
  
  // Cost label goes below if point is in upper half, above if in lower half  
  // (opposite of likes to avoid overlap when lines are close)
  const shouldPlaceAbove = relativePosition >= 0.5
  
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

export function LikesCostDailyChart({ data, title = "Daily Likes & Cost Analysis", startDate, endDate, allData }: LikesCostDailyChartProps) {
  // State for filter toggle
  const [isFiltered, setIsFiltered] = useState(true)

  // Check if the date range is exactly 7 days
  const isSevenDayRange = useMemo(() => {
    if (!startDate || !endDate) return false
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays === 6 // 6 days difference means 7 days total (inclusive)
  }, [startDate, endDate])

  // Use filtered or all data based on toggle state
  const activeData = useMemo(() => {
    return isFiltered ? data : (allData || data)
  }, [data, allData, isFiltered])

  const chartData = useMemo(() => {
    if (!activeData || activeData.length === 0) return []
    // If it's a 7-day range and filtered, show daily data; otherwise group by weekday
    if (isSevenDayRange && isFiltered) {
      return processDailyData(activeData)
    } else {
      // Always group by weekday when not filtered or when not 7-day range
      return processWeekdayData(activeData)
    }
  }, [activeData, isSevenDayRange, isFiltered])


  // Calculate dynamic scales for both axes
  const { likesScale, costScale } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        likesScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
        costScale: { domain: [0, 1000], ticks: [0, 250, 500, 750, 1000] }
      }
    }
    
    // Find min and max for likes
    const likesValues = chartData.map(d => d.likes).filter(v => v > 0)
    const minLikes = likesValues.length > 0 ? Math.min(...likesValues) : 0
    const maxLikes = likesValues.length > 0 ? Math.max(...likesValues) : 100
    
    // Find min and max for cost
    const costValues = chartData.map(d => d.cost).filter(v => v > 0)
    const minCost = costValues.length > 0 ? Math.min(...costValues) : 0
    const maxCost = costValues.length > 0 ? Math.max(...costValues) : 1000
    
    return {
      likesScale: calculateNiceScale(minLikes, maxLikes, 5),
      costScale: calculateNiceScale(minCost, maxCost, 5)
    }
  }, [chartData])

  // Format date display
  const formatDate = (dateStr: string) => {
    // If it's a 7-day range and filtered, show weekday + date
    if (isSevenDayRange && isFiltered) {
      const date = new Date(dateStr)
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
      const monthDay = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
      return `${weekday} ${monthDay}`
    }
    
    // Otherwise, it's already a weekday string (Mon, Tue, etc.)
    return dateStr
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = chartData.find(d => d.date === label)
      
      if (dataPoint) {
        let formattedDate: string
        
        if (isSevenDayRange && isFiltered) {
          // For 7-day range with filter, show full date
          formattedDate = new Date(label).toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })
        } else {
          // For weekday grouping, show weekday and indicate it's an average
          formattedDate = `${label} (Average)`
        }
        
        return (
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-xl min-w-[200px]">
            <p className="font-bold text-gray-900 mb-3 border-b pb-2">{formattedDate}</p>
            
            {/* Likes Section */}
            <div className="mb-2">
              <p className="text-sm font-semibold mb-1" style={{ color: '#EF3C99' }}>👍 Likes</p>
              <p className="text-sm text-gray-700">{dataPoint.likes.toLocaleString()}</p>
            </div>
            
            {/* Cost Section */}
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
            👍 {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No data available for the selected time period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#8B5CF6] bg-clip-text text-transparent font-montserrat">
            👍 {title} {(!isSevenDayRange || !isFiltered) && "(Weekday Averages)"}
          </CardTitle>
          <Button
            variant={isFiltered ? "default" : "outline"}
            size="sm"
            onClick={() => setIsFiltered(!isFiltered)}
            className={`ml-4 ${isFiltered 
              ? 'bg-gradient-to-r from-[#751FAE] to-[#8B5CF6] hover:from-[#6B1F9A] hover:to-[#7C3AED] text-white border-0' 
              : 'border-[#751FAE] text-[#751FAE] hover:bg-[#751FAE] hover:text-white'
            }`}
          >
            {isFiltered ? 'Filtered' : 'All Data'}
          </Button>
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
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={formatDate}
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
              
              {/* Right Y-axis - Likes */}
              <YAxis 
                yAxisId="likes"
                orientation="right"
                domain={likesScale.domain}
                ticks={likesScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value/1000).toFixed(1)}K`
                  return value.toFixed(0)
                }}
                label={{ value: 'Likes', angle: 90, position: 'insideRight' }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
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
              
              {/* Likes Line - Right axis */}
              <Line
                yAxisId="likes"
                type="monotone"
                dataKey="likes"
                stroke="#EF3C99"
                strokeWidth={3}
                dot={{ fill: '#EF3C99', strokeWidth: 2, r: 4 }}
                name="Likes"
                connectNulls={false}
              />
              
              {/* Labels rendered on top of both lines */}
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
                yAxisId="likes"
                type="monotone"
                dataKey="likes"
                stroke="transparent"
                dot={false}
                connectNulls={false}
                legendType="none"
              >
                <LabelList content={RelativeLikesLabel} position="top" />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}