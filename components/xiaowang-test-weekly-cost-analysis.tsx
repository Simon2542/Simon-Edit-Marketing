"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface XiaowangTestWeeklyCostAnalysisProps {
  xiaowangTestData?: any
  brokerData?: any[]
  title?: string
  selectedMetric?: MetricType
  onMetricChange?: (metric: MetricType) => void
  weeklyTimePeriod?: number
  notesWeeklyCount?: {[key: string]: number} // Notes count by week
}

interface WeeklyData {
  week: string
  weekStart: string
  weekEnd: string
  views: number
  likes: number
  followers: number
  leads: number
  cost: number
}

type MetricType = 'views' | 'likes' | 'followers' | 'leads'

// Process Xiaowang test data combined with consultation leads data - aggregated by week
function processXiaowangTestWeeklyData(xiaowangTestData: any, brokerData: any[]): WeeklyData[] {
  if (!xiaowangTestData?.dailyData || !Array.isArray(xiaowangTestData.dailyData)) {
    return []
  }

  // Create a map of leads by date from broker data
  const leadsPerDate: Record<string, number> = {}

  if (brokerData && Array.isArray(brokerData)) {
    brokerData.forEach(item => {
      if (!item || typeof item !== 'object') return

      let dateValue: string | null = null
      let dateField = ''

      // Try different date field names
      const dateFields = ['Date', 'date', '时间', 'Date ', 'date ']
      for (const field of dateFields) {
        if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
          if (typeof item[field] === 'number') {
            // Excel serial number conversion
            const excelDate = new Date((item[field] - 25569) * 86400 * 1000)
            if (!isNaN(excelDate.getTime())) {
              dateValue = excelDate.toISOString().split('T')[0]
              dateField = field
              break
            }
          } else if (typeof item[field] === 'string') {
            // Try to parse string date
            const parsedDate = new Date(item[field])
            if (!isNaN(parsedDate.getTime())) {
              dateValue = parsedDate.toISOString().split('T')[0]
              dateField = field
              break
            }
          }
        }
      }

      if (dateValue) {
        leadsPerDate[dateValue] = (leadsPerDate[dateValue] || 0) + 1
      }
    })
  }

  // Process daily data and aggregate by week
  const weeklyMap: Record<string, {
    weekStart: string
    weekEnd: string
    views: number
    likes: number
    followers: number
    leads: number
    cost: number
  }> = {}

  xiaowangTestData.dailyData.forEach((dailyItem: any) => {
    const date = new Date(dailyItem.date)
    if (isNaN(date.getTime())) return

    // Get the start of the week (Monday)
    const dayOfWeek = date.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Sunday = 0, so we need to go back 6 days
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - mondayOffset)
    weekStart.setHours(0, 0, 0, 0)

    // Get the end of the week (Sunday)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const weekKey = weekStart.toISOString().split('T')[0]
    const dateKey = dailyItem.date

    if (!weeklyMap[weekKey]) {
      weeklyMap[weekKey] = {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        views: 0,
        likes: 0,
        followers: 0,
        leads: 0,
        cost: 0
      }
    }

    // Aggregate data
    weeklyMap[weekKey].views += dailyItem.clicks || 0
    weeklyMap[weekKey].likes += dailyItem.likes || 0
    weeklyMap[weekKey].followers += dailyItem.followers || 0
    weeklyMap[weekKey].cost += dailyItem.cost || 0
    weeklyMap[weekKey].leads += leadsPerDate[dateKey] || 0
  })

  // Convert to array and format
  return Object.entries(weeklyMap)
    .map(([weekKey, data]) => ({
      week: `${new Date(data.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(data.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      weekStart: data.weekStart,
      weekEnd: data.weekEnd,
      views: data.views,
      likes: data.likes,
      followers: data.followers,
      leads: data.leads,
      cost: data.cost
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}

// Smart label component that avoids overlaps
function SmartLabel(props: any) {
  const { payload, x, y, index } = props

  if (!payload || payload.length === 0) return null

  const metricValue = payload[0].value
  const costValue = payload[1]?.value || 0

  if ((!metricValue || metricValue === 0) && (!costValue || costValue === 0)) return null

  const metricDisplayValue = metricValue >= 1000 ? `${(metricValue/1000).toFixed(1)}k` : metricValue?.toFixed(0) || '0'
  const costDisplayValue = costValue >= 1000 ? `$${(costValue/1000).toFixed(1)}k` : `$${costValue?.toFixed(0) || '0'}`

  const labelWidth = Math.max(metricDisplayValue.length * 7 + 12, costDisplayValue.length * 7 + 12)
  const labelHeight = 14
  const spacing = 4
  const totalHeight = labelHeight * 2 + spacing

  // Smart positioning to avoid overlaps
  const baseOffset = 25
  const staggerOffset = (index % 3) * 8 // Stagger every 3 points
  const yOffset = baseOffset + staggerOffset

  // Calculate positions for both labels
  const metricY = y - yOffset - totalHeight
  const costY = metricY + labelHeight + spacing

  // Get colors from payload
  const metricColor = payload[0].color || '#3CBDE5'
  const costColor = payload[1]?.color || '#751FAE'

  return (
    <g>
      {/* Metric Label */}
      {metricValue > 0 && (
        <text
          x={x}
          y={metricY + labelHeight/2}
          fill={metricColor}
          fontSize={10}
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {metricDisplayValue}
        </text>
      )}

      {/* Cost Label */}
      {costValue > 0 && (
        <text
          x={x}
          y={costY + labelHeight/2}
          fill={costColor}
          fontSize={10}
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {costDisplayValue}
        </text>
      )}
    </g>
  )
}

// Custom tooltip component
function CustomTooltip({ active, payload, label, notesWeeklyCount }: any) {
  if (active && payload && payload.length) {
    // Get posts count for this week
    const postsCount = notesWeeklyCount && notesWeeklyCount[label] ? notesWeeklyCount[label] : 0

    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{`Week: ${label}`}</p>
        <p className="text-sm text-blue-600 mb-2">{`📝 Posts: ${postsCount}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.name}: ${entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function XiaowangTestWeeklyCostAnalysis({
  xiaowangTestData,
  brokerData = [],
  title = "Weekly Views/Likes/Followers/Leads & Cost Trend Analysis",
  selectedMetric: propSelectedMetric,
  onMetricChange,
  weeklyTimePeriod = 12,
  notesWeeklyCount = {}
}: XiaowangTestWeeklyCostAnalysisProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(propSelectedMetric || 'views')

  // Sync with prop changes
  useEffect(() => {
    if (propSelectedMetric) {
      setSelectedMetric(propSelectedMetric)
    }
  }, [propSelectedMetric])

  // Handle metric change
  const handleMetricChange = (metric: MetricType) => {
    setSelectedMetric(metric)
    onMetricChange?.(metric)
  }

  // Process weekly data (always use all data, no filtering)
  const weeklyData = useMemo(() => {
    return processXiaowangTestWeeklyData(xiaowangTestData, brokerData)
  }, [xiaowangTestData, brokerData])

  // Filter out incomplete weeks (current week if not finished) and apply time period filter
  const displayData = useMemo(() => {
    if (!weeklyData || weeklyData.length === 0) return []

    const today = new Date()
    const currentWeekStart = new Date(today)
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    currentWeekStart.setDate(today.getDate() - mondayOffset)
    currentWeekStart.setHours(0, 0, 0, 0)

    // Filter out the current week if it's not complete (today is not Sunday)
    const filtered = weeklyData.filter(item => {
      const weekStartDate = new Date(item.weekStart)
      const weekEndDate = new Date(item.weekEnd)

      // Check if this week is the current week (contains today)
      const isCurrentWeek = today >= weekStartDate && today <= weekEndDate

      // If it's the current week and today is not Sunday (week not complete), exclude it
      const shouldInclude = !isCurrentWeek || dayOfWeek === 0

      return shouldInclude
    })

    // Apply time period filter based on weeklyTimePeriod prop
    const weeksToShow = weeklyTimePeriod || 12

    // Get the last N weeks based on the selected period
    const displayWeeks = filtered.slice(-weeksToShow)

    return displayWeeks
  }, [weeklyData, weeklyTimePeriod])

  // Calculate dynamic scales and averages directly from raw data
  const { metricScale, costScale, avgMetric, avgCost } = useMemo(() => {
    if (!displayData || displayData.length === 0) {
      return {
        metricScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
        costScale: { domain: [0, 1000], ticks: [0, 250, 500, 750, 1000] },
        avgMetric: 0,
        avgCost: 0
      }
    }

    // Calculate weekly averages from the processed weekly data
    const metricValues = displayData.map(item => item[selectedMetric])
    const costValues = displayData.map(item => item.cost)

    // Calculate averages for weekly data - SUM(Cost)/number of weeks and SUM(xxx)/number of weeks
    const totalCost = costValues.reduce((sum, val) => sum + val, 0)
    const totalMetric = metricValues.reduce((sum, val) => sum + val, 0)
    const numberOfWeeks = displayData.length
    const avgCost = numberOfWeeks > 0 ? totalCost / numberOfWeeks : 0
    const avgMetric = numberOfWeeks > 0 ? totalMetric / numberOfWeeks : 0

    const maxMetric = Math.max(...metricValues, 1)
    const maxCost = Math.max(...costValues, 1)

    // Calculate nice scales
    const metricMax = Math.ceil(maxMetric * 1.1)
    const costMax = Math.ceil(maxCost * 1.1)

    const metricStep = Math.ceil(metricMax / 4)
    const costStep = Math.ceil(costMax / 4)

    return {
      metricScale: {
        domain: [0, metricMax],
        ticks: [0, metricStep, metricStep * 2, metricStep * 3, metricMax]
      },
      costScale: {
        domain: [0, costMax],
        ticks: [0, costStep, costStep * 2, costStep * 3, costMax]
      },
      avgMetric,
      avgCost
    }
  }, [displayData, selectedMetric])

  // Get current metric config
  const metricConfig = useMemo(() => {
    switch (selectedMetric) {
      case 'views': return { label: 'Views', color: '#3CBDE5' }
      case 'likes': return { label: 'Likes', color: '#EF3C99' }
      case 'followers': return { label: 'Followers', color: '#10B981' }
      case 'leads': return { label: 'Leads', color: '#F59E0B' }
      default: return { label: 'Views', color: '#3CBDE5' }
    }
  }, [selectedMetric])

  if (!displayData || displayData.length === 0) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 mb-6 font-montserrat">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No weekly data available
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
            <CardTitle className="text-xl font-semibold text-gray-900 mb-6 font-montserrat">
              Weekly {metricConfig.label} & Cost Trend
            </CardTitle>
          </div>

          <div className="flex items-center gap-4">
            {/* Metric Selection Buttons */}
            <div className="flex gap-2">
              <Button
                variant={selectedMetric === 'views' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricChange('views')}
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
                onClick={() => handleMetricChange('likes')}
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
                onClick={() => handleMetricChange('followers')}
                className={selectedMetric === 'followers'
                  ? 'bg-[#10B981] hover:bg-[#059669] text-white border-0'
                  : 'border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white'
                }
              >
                Followers
              </Button>
              <Button
                variant={selectedMetric === 'leads' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricChange('leads')}
                className={selectedMetric === 'leads'
                  ? 'bg-[#F59E0B] hover:bg-[#D97706] text-white border-0'
                  : 'border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B] hover:text-white'
                }
              >
                Leads
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 40, right: 80, left: 40, bottom: 60 }}>
              <XAxis
                dataKey="week"
                tick={(props: any) => {
                  const { x, y, payload } = props
                  const weekStr = payload.value

                  // Count posts for this week
                  const postsCount = notesWeeklyCount && notesWeeklyCount[weekStr] ? notesWeeklyCount[weekStr] : 0

                  // Debug logging (only log first few times to avoid spam)
                  if (Math.random() < 0.2) { // Only 20% chance to log each render
                    console.log('Weekly chart debug - Format comparison:', {
                      weekStr,
                      postsCount,
                      'Match found': notesWeeklyCount[weekStr] !== undefined,
                      'Available keys (first 5)': Object.keys(notesWeeklyCount).slice(0, 5),
                      'Sample key': Object.keys(notesWeeklyCount)[0],
                      'Keys that contain Sep': Object.keys(notesWeeklyCount).filter(k => k.includes('Sep')),
                      'Exact match test': notesWeeklyCount['Sep 8 - Sep 14'],
                      'Trimmed match test': notesWeeklyCount[weekStr.trim()]
                    });
                  }

                  return (
                    <g>
                      <text
                        x={x}
                        y={y + 16}
                        textAnchor="end"
                        fill="#6B7280"
                        fontSize="11"
                        transform={`rotate(-45, ${x}, ${y + 16})`}
                      >
                        {weekStr}
                      </text>
                      <text
                        x={x}
                        y={y + 30}
                        textAnchor="end"
                        fill="#6B7280"
                        fontSize="10"
                        transform={`rotate(-45, ${x}, ${y + 30})`}
                      >
                        {postsCount} Posts
                      </text>
                    </g>
                  )
                }}
                interval={
                  displayData.length <= 12 ? 0 :
                  displayData.length <= 20 ? 1 :
                  displayData.length <= 30 ? 2 : 3
                }
                height={100}
                scale="point"
                padding={{ left: 30, right: 30 }}
              />
              <YAxis
                yAxisId="metric"
                orientation="left"
                domain={metricScale.domain}
                ticks={metricScale.ticks}
                tick={{ fontSize: 11 }}
                label={{ value: metricConfig.label, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              />
              <YAxis
                yAxisId="cost"
                orientation="right"
                domain={costScale.domain}
                ticks={costScale.ticks}
                tick={{ fontSize: 11 }}
                label={{ value: 'Cost ($)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
              />

              <Tooltip content={(props) => <CustomTooltip {...props} notesWeeklyCount={notesWeeklyCount} />} />
              <Legend />

              {/* Average Cost Reference Line */}
              {avgCost > 0 && (
                <ReferenceLine
                  yAxisId="cost"
                  y={avgCost}
                  stroke="#C4A5E7"
                  strokeWidth={2}
                  strokeDasharray="8 8"
                />
              )}

              {/* Average Metric Reference Line */}
              {avgMetric > 0 && (
                <ReferenceLine
                  yAxisId="metric"
                  y={avgMetric}
                  stroke={`${metricConfig.color}80`}
                  strokeWidth={2}
                  strokeDasharray="8 8"
                />
              )}

              {/* Main Metric Line */}
              <Line
                yAxisId="metric"
                type="monotone"
                dataKey={selectedMetric}
                stroke={metricConfig.color}
                strokeWidth={3}
                dot={{ fill: metricConfig.color, r: 5 }}
                name={`${metricConfig.label} (Avg: ${avgMetric >= 1000 ? `${(avgMetric/1000).toFixed(2)}K` : avgMetric.toFixed(2)})`}
                connectNulls={false}
              />

              {/* Cost Line */}
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="cost"
                stroke="#751FAE"
                strokeWidth={3}
                dot={{ fill: "#751FAE", r: 5 }}
                name={`Cost (Avg: $${avgCost.toFixed(2)})`}
                connectNulls={false}
              />

              {/* Labels for Cost */}
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
                  content={(props) => {
                    const { x, y, value, index, payload } = props
                    if (!value || value === 0) return null

                    // Get current data point values
                    const currentData = payload || displayData?.[index]
                    if (!currentData || !metricScale || !costScale) {
                      // Fallback to simple positioning
                      const costDisplayValue = value >= 1000 ? `$${(value/1000).toFixed(1)}k` : `$${value?.toFixed(0) || '0'}`
                      const width = 36
                      const height = 14
                      const labelY = y + 8

                      return (
                        <g>
                          <rect
                            x={x - width/2}
                            y={labelY}
                            width={width}
                            height={height}
                            fill="rgba(117, 31, 174, 0.8)"
                            stroke="#751FAE"
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
                            {costDisplayValue}
                          </text>
                        </g>
                      )
                    }

                    // LifeCar's intelligent positioning logic
                    const metricValue = currentData[selectedMetric] || 0
                    const costValue = currentData.cost || 0

                    // Calculate ratios relative to their maximum scales
                    const metricRatio = metricValue / metricScale.domain[1]
                    const costRatio = costValue / costScale.domain[1]

                    // Smart positioning based on which line is higher
                    const baseOffset = 15
                    const staggerOffset = (index % 3) * 6 // Stagger every 3 points
                    const yOffset = baseOffset + staggerOffset

                    let labelY
                    if (costRatio > metricRatio) {
                      // Cost line is higher, place cost label above
                      labelY = y - yOffset - 14
                    } else {
                      // Metric line is higher, place cost label below
                      labelY = y + yOffset
                    }

                    const costDisplayValue = value >= 1000 ? `$${(value/1000).toFixed(1)}k` : `$${value?.toFixed(0) || '0'}`
                    const width = 36
                    const height = 14

                    return (
                      <g>
                        <rect
                          x={x - width/2}
                          y={labelY}
                          width={width}
                          height={height}
                          fill="rgba(117, 31, 174, 0.8)"
                          stroke="#751FAE"
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
                          {costDisplayValue}
                        </text>
                      </g>
                    )
                  }}
                  position="top"
                />
              </Line>

              {/* Labels for Selected Metric */}
              <Line
                yAxisId="metric"
                type="monotone"
                dataKey={selectedMetric}
                stroke="transparent"
                dot={false}
                connectNulls={false}
                legendType="none"
              >
                <LabelList
                  content={(props) => {
                    const { x, y, value, index, payload } = props
                    if (!value || value === 0) return null

                    // Get current data point values
                    const currentData = payload || displayData?.[index]
                    if (!currentData || !metricScale || !costScale) {
                      // Fallback to simple positioning
                      const metricDisplayValue = value >= 1000 ? `${(value/1000).toFixed(1)}k` : value?.toFixed(0) || '0'
                      const width = 30
                      const height = 14
                      const labelY = y - height - 8

                      return (
                        <g>
                          <rect
                            x={x - width/2}
                            y={labelY}
                            width={width}
                            height={height}
                            fill={`${metricConfig.color}CC`}
                            stroke={metricConfig.color}
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
                            {metricDisplayValue}
                          </text>
                        </g>
                      )
                    }

                    // LifeCar's intelligent positioning logic
                    const metricValue = currentData[selectedMetric] || 0
                    const costValue = currentData.cost || 0

                    // Calculate ratios relative to their maximum scales
                    const metricRatio = metricValue / metricScale.domain[1]
                    const costRatio = costValue / costScale.domain[1]

                    // Smart positioning based on which line is higher
                    const baseOffset = 15
                    const staggerOffset = (index % 3) * 6 // Stagger every 3 points
                    const yOffset = baseOffset + staggerOffset

                    let labelY
                    if (metricRatio > costRatio) {
                      // Metric line is higher, place metric label above
                      labelY = y - yOffset - 14
                    } else {
                      // Cost line is higher, place metric label below
                      labelY = y + yOffset
                    }

                    const metricDisplayValue = value >= 1000 ? `${(value/1000).toFixed(1)}k` : value?.toFixed(0) || '0'
                    const width = 30
                    const height = 14

                    return (
                      <g>
                        <rect
                          x={x - width/2}
                          y={labelY}
                          width={width}
                          height={height}
                          fill={`${metricConfig.color}CC`}
                          stroke={metricConfig.color}
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
                          {metricDisplayValue}
                        </text>
                      </g>
                    )
                  }}
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