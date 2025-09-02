"use client"

import React, { useMemo, useCallback, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface CostPerFollowerDailyChartProps {
  data: LifeCarDailyData[]
  title?: string
  startDate?: string
  endDate?: string
  allData?: LifeCarDailyData[] // All unfiltered data for toggle functionality
}

interface DailyData {
  date: string
  costPerFollower: number
  costPerClick: number
  costPerLike: number
  weekday?: string
}

type MetricType = 'costPerFollower' | 'costPerClick' | 'costPerLike'

// Process data for daily cost metrics
function processDailyData(data: LifeCarDailyData[]): DailyData[] {
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date))
  
  return sortedData.map(item => ({
    date: item.date,
    costPerFollower: item.followers > 0 ? item.spend / item.followers : 0,
    costPerClick: item.clicks > 0 ? item.spend / item.clicks : 0,
    costPerLike: item.likes > 0 ? item.spend / item.likes : 0,
    weekday: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
  }))
}

// Process data grouped by weekday (for non-7-day ranges)
function processWeekdayData(data: LifeCarDailyData[]): DailyData[] {
  const weekdayGroups: { [key: string]: { costPerFollower: number[], costPerClick: number[], costPerLike: number[] } } = {
    'Mon': { costPerFollower: [], costPerClick: [], costPerLike: [] },
    'Tue': { costPerFollower: [], costPerClick: [], costPerLike: [] },
    'Wed': { costPerFollower: [], costPerClick: [], costPerLike: [] },
    'Thu': { costPerFollower: [], costPerClick: [], costPerLike: [] },
    'Fri': { costPerFollower: [], costPerClick: [], costPerLike: [] },
    'Sat': { costPerFollower: [], costPerClick: [], costPerLike: [] },
    'Sun': { costPerFollower: [], costPerClick: [], costPerLike: [] }
  }
  
  // Group data by weekday
  data.forEach(item => {
    const weekday = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    if (weekdayGroups[weekday]) {
      if (item.followers > 0) {
        weekdayGroups[weekday].costPerFollower.push(item.spend / item.followers)
      }
      if (item.clicks > 0) {
        weekdayGroups[weekday].costPerClick.push(item.spend / item.clicks)
      }
      if (item.likes > 0) {
        weekdayGroups[weekday].costPerLike.push(item.spend / item.likes)
      }
    }
  })
  
  // Calculate averages and create result
  const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return weekdayOrder.map(weekday => {
    const group = weekdayGroups[weekday]
    const avgCostPerFollower = group.costPerFollower.length > 0 
      ? group.costPerFollower.reduce((a, b) => a + b, 0) / group.costPerFollower.length 
      : 0
    const avgCostPerClick = group.costPerClick.length > 0 
      ? group.costPerClick.reduce((a, b) => a + b, 0) / group.costPerClick.length 
      : 0
    const avgCostPerLike = group.costPerLike.length > 0 
      ? group.costPerLike.reduce((a, b) => a + b, 0) / group.costPerLike.length 
      : 0
    
    return {
      date: weekday,
      weekday: weekday,
      costPerFollower: Math.round(avgCostPerFollower * 1000) / 1000, // Round to 3 decimal places
      costPerClick: Math.round(avgCostPerClick * 1000) / 1000,
      costPerLike: Math.round(avgCostPerLike * 1000) / 1000
    }
  }).filter(item => item.costPerFollower > 0 || item.costPerClick > 0 || item.costPerLike > 0) // Include weekdays with any data
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

// Label component for cost metrics - receives color from parent
const CostMetricLabel = (props: any) => {
  const { x, y, value, index, payload, viewBox, color } = props
  if (!value || value === 0) return null
  
  const text = `$${value.toFixed(2)}`
  const width = 40
  const height = 14
  
  // Calculate relative position
  const chartHeight = viewBox?.height || 300
  const chartTop = viewBox?.y || 0
  
  // Calculate relative position (0 = top, 1 = bottom)
  const relativePosition = (y - chartTop) / chartHeight
  
  // Place label above if point is in lower half, below if in upper half
  const shouldPlaceAbove = relativePosition >= 0.5
  
  const labelY = shouldPlaceAbove ? y - height - 8 : y + 8
  
  // Use color passed from parent or default
  const labelColor = color || '#751FAE'
  
  return (
    <g>
      <rect
        x={x - width/2}
        y={labelY}
        width={width}
        height={height}
        fill={`${labelColor}CC`} // Add transparency
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

export function CostPerFollowerDailyChart({ data, title = "Daily Cost Analysis", startDate, endDate, allData }: CostPerFollowerDailyChartProps) {
  // State for filter toggle and metric selection
  const [isFiltered, setIsFiltered] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('costPerFollower')

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

  // Calculate dynamic scale for selected metric axis
  const metricScale = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1] }
    }
    
    // Find min and max for selected metric
    const metricValues = chartData.map(d => d[selectedMetric]).filter(v => v > 0)
    const minMetric = metricValues.length > 0 ? Math.min(...metricValues) : 0
    const maxMetric = metricValues.length > 0 ? Math.max(...metricValues) : 1
    
    return calculateNiceScale(minMetric, maxMetric, 5)
  }, [chartData, selectedMetric])

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

  // Get metric display info
  const getMetricInfo = (metric: MetricType) => {
    switch (metric) {
      case 'costPerFollower':
        return { label: 'Cost Per Follower', emoji: '👥', color: '#10B981' }
      case 'costPerClick':
        return { label: 'Cost Per View', emoji: '👁️', color: '#3CBDE5' }
      case 'costPerLike':
        return { label: 'Cost Per Like', emoji: '❤️', color: '#EF3C99' }
    }
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
        
        const metricInfo = getMetricInfo(selectedMetric)
        const value = dataPoint[selectedMetric]
        
        return (
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-xl min-w-[200px]">
            <p className="font-bold text-gray-900 mb-3 border-b pb-2">{formattedDate}</p>
            
            {/* Selected Metric Section */}
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: metricInfo.color }}>
                💰 {metricInfo.label}
              </p>
              <p className="text-sm text-gray-700">${value.toFixed(2)}</p>
            </div>
          </div>
        )
      }
    }
    return null
  }

  const currentMetricInfo = getMetricInfo(selectedMetric)

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
              📊 {currentMetricInfo.label} {(!isSevenDayRange || !isFiltered) && "(Weekday Averages)"}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Metric Selection Buttons - Same order as Daily Views & Cost Trend */}
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
              margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
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
              
              {/* Left Y-axis - Selected Metric (only axis) */}
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
              
              {/* Labels rendered on top of the line */}
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