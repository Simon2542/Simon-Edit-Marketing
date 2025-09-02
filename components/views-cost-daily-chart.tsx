"use client"

import React, { useMemo, useCallback, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface ViewsCostDailyChartProps {
  data: LifeCarDailyData[]
  title?: string
  startDate?: string
  endDate?: string
  allData?: LifeCarDailyData[] // All unfiltered data for toggle functionality
}

interface DailyData {
  date: string
  views: number
  likes: number
  followers: number
  cost: number
  weekday?: string
}

type MetricType = 'views' | 'likes' | 'followers'

// Process data for daily metrics and cost
function processDailyData(data: LifeCarDailyData[]): DailyData[] {
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date))
  
  return sortedData.map(item => ({
    date: item.date,
    views: item.clicks, // Using clicks as views
    likes: item.likes,
    followers: item.followers,
    cost: item.spend,    // Using spend as cost
    weekday: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
  }))
}

// Process data grouped by weekday (for non-7-day ranges)
function processWeekdayData(data: LifeCarDailyData[]): DailyData[] {
  const weekdayGroups: { [key: string]: { views: number[], likes: number[], followers: number[], costs: number[] } } = {
    'Mon': { views: [], likes: [], followers: [], costs: [] },
    'Tue': { views: [], likes: [], followers: [], costs: [] },
    'Wed': { views: [], likes: [], followers: [], costs: [] },
    'Thu': { views: [], likes: [], followers: [], costs: [] },
    'Fri': { views: [], likes: [], followers: [], costs: [] },
    'Sat': { views: [], likes: [], followers: [], costs: [] },
    'Sun': { views: [], likes: [], followers: [], costs: [] }
  }
  
  // Group data by weekday
  data.forEach(item => {
    const weekday = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    if (weekdayGroups[weekday]) {
      weekdayGroups[weekday].views.push(item.clicks)
      weekdayGroups[weekday].likes.push(item.likes)
      weekdayGroups[weekday].followers.push(item.followers)
      weekdayGroups[weekday].costs.push(item.spend)
    }
  })
  
  // Calculate averages and create result
  const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return weekdayOrder.map(weekday => {
    const group = weekdayGroups[weekday]
    const avgViews = group.views.length > 0 
      ? group.views.reduce((a, b) => a + b, 0) / group.views.length 
      : 0
    const avgLikes = group.likes.length > 0 
      ? group.likes.reduce((a, b) => a + b, 0) / group.likes.length 
      : 0
    const avgFollowers = group.followers.length > 0 
      ? group.followers.reduce((a, b) => a + b, 0) / group.followers.length 
      : 0
    const avgCost = group.costs.length > 0 
      ? group.costs.reduce((a, b) => a + b, 0) / group.costs.length 
      : 0
    
    return {
      date: weekday,
      weekday: weekday,
      views: Math.round(avgViews),
      likes: Math.round(avgLikes),
      followers: Math.round(avgFollowers),
      cost: Math.round(avgCost * 100) / 100 // Round to 2 decimal places
    }
  }).filter(item => item.views > 0 || item.likes > 0 || item.followers > 0 || item.cost > 0) // Only include weekdays with data
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

// Label components with distance-based positioning
const RelativeMetricLabel = (props: any) => {
  const { x, y, value, index, payload, viewBox, config, scales } = props
  if (!value || value === 0) return null
  
  const text = value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toString()
  const width = config?.dataKey === 'followers' ? 36 : 30
  const height = 14
  
  // Default positioning fallback
  let metricShouldBeAbove = y < 200
  
  // Distance-based positioning if we have all required data
  if (payload && scales?.costScale && scales?.metricScale && config) {
    const costValue = payload.cost || 0
    const metricValue = payload[config.dataKey] || 0
    
    // Get Y-axis maximum values
    const costMaxValue = scales.costScale.domain?.[1] || 1000
    const metricMaxValue = scales.metricScale.domain?.[1] || 100
    
    // Calculate distance from maximum as a ratio
    // Smaller ratio = closer to top, larger ratio = farther from top
    const costDistanceRatio = (costMaxValue - costValue) / costMaxValue
    const metricDistanceRatio = (metricMaxValue - metricValue) / metricMaxValue
    
    // Distance ratio closer to 0 = closer to Y-axis top = label above
    // Distance ratio closer to 1 = farther from Y-axis top = label below
    metricShouldBeAbove = metricDistanceRatio < costDistanceRatio
  }
  
  const labelY = metricShouldBeAbove ? y - height - 8 : y + 8
  
  // Use the color directly from config
  const color = config?.color || '#3CBDE5'
  
  return (
    <g>
      <rect
        x={x - width/2}
        y={labelY}
        width={width}
        height={height}
        fill={`${color}CC`} // Add transparency
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
  const { x, y, value, index, payload, viewBox, metricConfig, scales } = props
  if (!value || value === 0) return null
  
  const text = `$${value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0)}`
  const width = 36
  const height = 14
  
  // Default positioning fallback
  let costShouldBeAbove = y > 200
  
  // Distance-based positioning if we have all required data
  if (payload && scales?.costScale && scales?.metricScale && metricConfig) {
    const costValue = payload.cost || 0
    const metricValue = payload[metricConfig.dataKey] || 0
    
    // Get Y-axis maximum values
    const costMaxValue = scales.costScale.domain?.[1] || 1000
    const metricMaxValue = scales.metricScale.domain?.[1] || 100
    
    // Calculate distance from maximum as a ratio
    // Smaller ratio = closer to top, larger ratio = farther from top
    const costDistanceRatio = (costMaxValue - costValue) / costMaxValue
    const metricDistanceRatio = (metricMaxValue - metricValue) / metricMaxValue
    
    // Distance ratio closer to 0 = closer to Y-axis top = label above
    // Distance ratio closer to 1 = farther from Y-axis top = label below
    costShouldBeAbove = costDistanceRatio > metricDistanceRatio
  }
  
  const labelY = costShouldBeAbove ? y - height - 8 : y + 8
  
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

export function ViewsCostDailyChart({ data, title = "Daily Metrics & Cost Analysis", startDate, endDate, allData }: ViewsCostDailyChartProps) {
  // State for filter toggle and metric selection
  const [isFiltered, setIsFiltered] = useState(true)
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

  // Calculate average cost per day from currently active data (changes with filter toggle)
  const avgCostPerDay = useMemo(() => {
    if (!activeData || activeData.length === 0) return 0
    const totalCost = activeData.reduce((sum, item) => sum + item.spend, 0)
    const totalDays = activeData.length
    const avgDaily = totalDays > 0 ? totalCost / totalDays : 0
    
    return avgDaily
  }, [activeData, isFiltered])


  // Calculate dynamic scales for both axes
  const { metricScale, costScale } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        metricScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
        costScale: { domain: [0, Math.max(1000, avgCostPerDay * 1.2)], ticks: [0, 250, 500, 750, 1000] }
      }
    }
    
    // Find min and max for selected metric
    const metricValues = chartData.map(d => d[metricConfig.dataKey]).filter(v => v > 0)
    const minMetric = metricValues.length > 0 ? Math.min(...metricValues) : 0
    const maxMetric = metricValues.length > 0 ? Math.max(...metricValues) : 100
    
    // Find min and max for cost - include avgCostPerDay in the range calculation
    const costValues = chartData.map(d => d.cost).filter(v => v > 0)
    if (avgCostPerDay > 0) costValues.push(avgCostPerDay)
    const minCost = costValues.length > 0 ? Math.min(...costValues) : 0
    const maxCost = costValues.length > 0 ? Math.max(...costValues) : 1000
    
    return {
      metricScale: calculateNiceScale(minMetric, maxMetric, 5),
      costScale: calculateNiceScale(minCost, maxCost, 5)
    }
  }, [chartData, metricConfig.dataKey, avgCostPerDay])

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
            
            {/* Selected Metric Section */}
            <div className="mb-2">
              <p className="text-sm font-semibold mb-1" style={{ color: metricConfig.color }}>
                {selectedMetric === 'views' ? '👁️' : selectedMetric === 'likes' ? '👍' : '👥'} {metricConfig.label}
              </p>
              <p className="text-sm text-gray-700">{dataPoint[metricConfig.dataKey].toLocaleString()}</p>
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
            📈 {title}
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#8B5CF6] bg-clip-text text-transparent font-montserrat">
              📈 Daily {metricConfig.label} & Cost Trend {(!isSevenDayRange || !isFiltered) && "(Weekday Averages)"}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Metric Selection Buttons */}
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
            
            {/* Filter Toggle Button */}
            <Button
              variant={isFiltered ? "default" : "outline"}
              size="sm"
              onClick={() => setIsFiltered(!isFiltered)}
              className={isFiltered 
                ? 'bg-gradient-to-r from-[#751FAE] to-[#8B5CF6] hover:from-[#6B1F9A] hover:to-[#7C3AED] text-white border-0' 
                : 'border-[#751FAE] text-[#751FAE] hover:bg-[#751FAE] hover:text-white'
              }
            >
              {isFiltered ? 'Filtered' : 'All Data'}
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
              
              {/* Average Cost per Day Reference Line - Orange dashed line */}
              {avgCostPerDay > 0 && (
                <ReferenceLine 
                  key={`avg-cost-${avgCostPerDay}-${isFiltered}`}
                  yAxisId="cost"
                  y={avgCostPerDay} 
                  stroke="#FF8C00" 
                  strokeDasharray="8 4"
                  strokeWidth={2}
                />
              )}
              
              {/* Invisible Line for Legend display only - placed last to appear last in legend */}
              {avgCostPerDay > 0 && (
                <Line
                  yAxisId="cost"
                  type="monotone"
                  dataKey={() => null}
                  stroke="#FF8C00"
                  strokeDasharray="8 4"
                  strokeWidth={2}
                  dot={false}
                  name={`Average Cost per Day: $${avgCostPerDay.toFixed(0)}`}
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
              
              {/* Selected Metric Line - Right axis */}
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
                <LabelList content={(props) => <RelativeCostLabel {...props} metricConfig={metricConfig} scales={{metricScale, costScale}} />} position="top" />
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
                <LabelList content={(props) => <RelativeMetricLabel {...props} config={metricConfig} scales={{metricScale, costScale}} />} position="top" />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}