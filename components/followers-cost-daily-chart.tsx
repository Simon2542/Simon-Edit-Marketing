"use client"

import React, { useMemo, useCallback, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface FollowersCostDailyChartProps {
  data: LifeCarDailyData[]
  title?: string
  startDate?: string
  endDate?: string
  allData?: LifeCarDailyData[] // All unfiltered data for toggle functionality
}

interface DailyData {
  date: string
  followers: number
  cost: number
  weekday?: string
}

// Process data for daily followers and cost
function processDailyData(data: LifeCarDailyData[]): DailyData[] {
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date))
  
  return sortedData.map(item => ({
    date: item.date,
    followers: item.followers, // Using followers
    cost: item.spend,    // Using spend as cost
    weekday: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
  }))
}

// Process data grouped by weekday (for non-7-day ranges)
function processWeekdayData(data: LifeCarDailyData[]): DailyData[] {
  const weekdayGroups: { [key: string]: { followers: number[], costs: number[] } } = {
    'Mon': { followers: [], costs: [] },
    'Tue': { followers: [], costs: [] },
    'Wed': { followers: [], costs: [] },
    'Thu': { followers: [], costs: [] },
    'Fri': { followers: [], costs: [] },
    'Sat': { followers: [], costs: [] },
    'Sun': { followers: [], costs: [] }
  }
  
  // Group data by weekday
  data.forEach(item => {
    const weekday = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    if (weekdayGroups[weekday]) {
      weekdayGroups[weekday].followers.push(item.followers)
      weekdayGroups[weekday].costs.push(item.spend)
    }
  })
  
  // Calculate averages and create result
  const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return weekdayOrder.map(weekday => {
    const group = weekdayGroups[weekday]
    const avgFollowers = group.followers.length > 0 
      ? group.followers.reduce((a, b) => a + b, 0) / group.followers.length 
      : 0
    const avgCost = group.costs.length > 0 
      ? group.costs.reduce((a, b) => a + b, 0) / group.costs.length 
      : 0
    
    return {
      date: weekday,
      weekday: weekday,
      followers: Math.round(avgFollowers),
      cost: Math.round(avgCost * 100) / 100 // Round to 2 decimal places
    }
  }).filter(item => item.followers > 0 || item.cost > 0) // Only include weekdays with data
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

// Smart label components that position based on comparing visual heights
const SmartFollowersLabel = (props: any) => {
  const { x, y, value, index, payload } = props
  if (!value || value === 0) return null
  
  // Get cost value for the same data point
  const costValue = payload?.cost || 0
  
  // Get scale domains from props (passed from parent)
  const followersScale = props.followersScale || { domain: [0, 100] }
  const costScale = props.costScale || { domain: [0, 1000] }
  
  // Normalize both values to 0-1 range (inverted because Y axis goes from top to bottom)
  const normalizedFollowers = (value - followersScale.domain[0]) / (followersScale.domain[1] - followersScale.domain[0])
  const normalizedCost = (costValue - costScale.domain[0]) / (costScale.domain[1] - costScale.domain[0])
  
  // Determine if followers line is visually higher than cost line
  // Higher normalized value means visually higher position on chart
  const isFollowersHigher = normalizedFollowers > normalizedCost
  
  const text = value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toString()
  const width = 30
  const height = 14
  
  // Position label above if this line is visually higher, below if visually lower
  const labelY = isFollowersHigher ? y - height - 8 : y + 8
  
  return (
    <g>
      <rect
        x={x - width/2}
        y={labelY}
        width={width}
        height={height}
        fill="rgba(16, 185, 129, 0.7)"
        stroke="rgba(16, 185, 129, 1)"
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

const SmartCostLabel = (props: any) => {
  const { x, y, value, index, payload } = props
  if (!value || value === 0) return null
  
  // Get followers value for the same data point
  const followersValue = payload?.followers || 0
  
  // Get scale domains from props (passed from parent)
  const followersScale = props.followersScale || { domain: [0, 100] }
  const costScale = props.costScale || { domain: [0, 1000] }
  
  // Normalize both values to 0-1 range (inverted because Y axis goes from top to bottom)
  const normalizedFollowers = (followersValue - followersScale.domain[0]) / (followersScale.domain[1] - followersScale.domain[0])
  const normalizedCost = (value - costScale.domain[0]) / (costScale.domain[1] - costScale.domain[0])
  
  // Determine if cost line is visually higher than followers line
  // Higher normalized value means visually higher position on chart
  const isCostHigher = normalizedCost > normalizedFollowers
  
  const text = `$${value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0)}`
  const width = 36
  const height = 14
  
  // Position label above if this line is visually higher, below if visually lower
  const labelY = isCostHigher ? y - height - 8 : y + 8
  
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

export function FollowersCostDailyChart({ data, title = "Daily Followers & Cost Analysis", startDate, endDate, allData }: FollowersCostDailyChartProps) {
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
  const { followersScale, costScale } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        followersScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
        costScale: { domain: [0, 1000], ticks: [0, 250, 500, 750, 1000] }
      }
    }
    
    // Find min and max for followers
    const followersValues = chartData.map(d => d.followers).filter(v => v > 0)
    const minFollowers = followersValues.length > 0 ? Math.min(...followersValues) : 0
    const maxFollowers = followersValues.length > 0 ? Math.max(...followersValues) : 100
    
    // Find min and max for cost
    const costValues = chartData.map(d => d.cost).filter(v => v > 0)
    const minCost = costValues.length > 0 ? Math.min(...costValues) : 0
    const maxCost = costValues.length > 0 ? Math.max(...costValues) : 1000
    
    return {
      followersScale: calculateNiceScale(minFollowers, maxFollowers, 5),
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
            
            {/* Followers Section */}
            <div className="mb-2">
              <p className="text-sm font-semibold mb-1" style={{ color: '#10B981' }}>👥 New Followers</p>
              <p className="text-sm text-gray-700">{dataPoint.followers.toLocaleString()}</p>
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
            👥 {title}
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
            👥 {title} {(!isSevenDayRange || !isFiltered) && "(Weekday Averages)"}
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
              
              {/* Right Y-axis - Followers */}
              <YAxis 
                yAxisId="followers"
                orientation="right"
                domain={followersScale.domain}
                ticks={followersScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value/1000).toFixed(1)}K`
                  return value.toFixed(0)
                }}
                label={{ value: 'New Followers', angle: 90, position: 'insideRight' }}
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
              
              {/* Followers Line - Right axis */}
              <Line
                yAxisId="followers"
                type="monotone"
                dataKey="followers"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                name="New Followers"
                connectNulls={false}
              >
                <LabelList 
                  content={(props) => <SmartFollowersLabel {...props} followersScale={followersScale} costScale={costScale} />} 
                  position="top" 
                />
              </Line>
              
              {/* Cost Line Labels - rendered after followers to ensure proper layering */}
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="cost"
                stroke="transparent"
                dot={false}
                connectNulls={false}
                legendType="none"
              >
                <LabelList 
                  content={(props) => <SmartCostLabel {...props} followersScale={followersScale} costScale={costScale} />} 
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