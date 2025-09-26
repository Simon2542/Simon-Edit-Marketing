"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface XiaowangTestMonthlyCostAnalysisProps {
  xiaowangTestData?: any
  brokerData?: any[]
  title?: string
  selectedMetric?: MetricType
  onMetricChange?: (metric: MetricType) => void
  notesMonthlyCount?: {[key: string]: number} // Notes count by month
}

interface MonthlyData {
  month: string
  monthKey: string
  views: number
  likes: number
  followers: number
  leads: number
  cost: number
}

type MetricType = 'views' | 'likes' | 'followers' | 'leads'

// Process Xiaowang test data combined with consultation leads data - aggregated by month
function processXiaowangTestMonthlyData(xiaowangTestData: any, brokerData: any[]): MonthlyData[] {
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

  // Process daily data and aggregate by month
  const monthlyMap: Record<string, {
    views: number
    likes: number
    followers: number
    leads: number
    cost: number
  }> = {}

  xiaowangTestData.dailyData.forEach((dailyItem: any) => {
    const date = new Date(dailyItem.date)
    if (isNaN(date.getTime())) return

    // Get year and month
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() returns 0-11
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    const dateKey = dailyItem.date

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        views: 0,
        likes: 0,
        followers: 0,
        leads: 0,
        cost: 0
      }
    }

    // Aggregate data
    monthlyMap[monthKey].views += dailyItem.clicks || 0
    monthlyMap[monthKey].likes += dailyItem.likes || 0
    monthlyMap[monthKey].followers += dailyItem.followers || 0
    monthlyMap[monthKey].cost += dailyItem.cost || 0
    monthlyMap[monthKey].leads += leadsPerDate[dateKey] || 0
  })

  // Convert to array and format
  return Object.entries(monthlyMap)
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthName = monthNames[parseInt(month) - 1]

      return {
        month: `${monthName} ${year}`,
        monthKey,
        views: data.views,
        likes: data.likes,
        followers: data.followers,
        leads: data.leads,
        cost: data.cost
      }
    })
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

// Custom label component for data points with intelligent positioning like LifeCar
function CustomLabel(props: any) {
  const { x, y, value, index, color, data, dataKey, payload, metricScale, costScale, selectedMetric } = props

  if (!value || value === 0) return null

  const displayValue = value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0)
  const width = 30
  const height = 14

  // Get current data point values
  const currentData = payload || data?.[index]
  if (!currentData || !metricScale || !costScale) {
    // Fallback to simple positioning if we don't have the necessary data
    const baseOffset = 15
    const staggerOffset = (index % 2) * 8
    const yOffset = baseOffset + staggerOffset
    const labelY = y - yOffset - height

    const labelColor = color || "#751FAE"

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
          {displayValue}
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
  if (dataKey === 'cost') {
    // For cost labels
    if (costRatio > metricRatio) {
      // Cost line is higher, place cost label above
      labelY = y - yOffset - height
    } else {
      // Metric line is higher, place cost label below
      labelY = y + yOffset
    }
  } else {
    // For metric labels
    if (metricRatio > costRatio) {
      // Metric line is higher, place metric label above
      labelY = y - yOffset - height
    } else {
      // Cost line is higher, place metric label below
      labelY = y + yOffset
    }
  }

  const labelColor = color || "#751FAE"

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
        {displayValue}
      </text>
    </g>
  )
}

// Custom tooltip component
function CustomTooltip({ active, payload, label, notesMonthlyCount }: any) {
  if (active && payload && payload.length) {
    // Get posts count for this month
    const postsCount = notesMonthlyCount && notesMonthlyCount[label] ? notesMonthlyCount[label] : 0

    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{`Month: ${label}`}</p>
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

export function XiaowangTestMonthlyCostAnalysis({
  xiaowangTestData,
  brokerData = [],
  title = "Monthly Views/Likes/Followers/Leads & Cost Trend Analysis",
  selectedMetric: propSelectedMetric,
  onMetricChange,
  notesMonthlyCount = {}
}: XiaowangTestMonthlyCostAnalysisProps) {
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

  // Process monthly data (use all data, no filtering)
  const monthlyData = useMemo(() => {
    return processXiaowangTestMonthlyData(xiaowangTestData, brokerData)
  }, [xiaowangTestData, brokerData])

  // Calculate dynamic scales and averages directly from raw data
  const { metricScale, costScale, avgMetric, avgCost } = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) {
      return {
        metricScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
        costScale: { domain: [0, 1000], ticks: [0, 250, 500, 750, 1000] },
        avgMetric: 0,
        avgCost: 0
      }
    }

    // Calculate monthly averages from the processed monthly data
    const metricValues = monthlyData.map(item => item[selectedMetric])
    const costValues = monthlyData.map(item => item.cost)

    // Calculate averages for monthly data - SUM(Cost)/number of months and SUM(xxx)/number of months
    const totalCost = costValues.reduce((sum, val) => sum + val, 0)
    const totalMetric = metricValues.reduce((sum, val) => sum + val, 0)
    const numberOfMonths = monthlyData.length
    const avgCost = numberOfMonths > 0 ? totalCost / numberOfMonths : 0
    const avgMetric = numberOfMonths > 0 ? totalMetric / numberOfMonths : 0

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
  }, [monthlyData, selectedMetric])

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

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 mb-6 font-montserrat">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No monthly data available
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
              Monthly {metricConfig.label} & Cost Trend
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
            <LineChart data={monthlyData} margin={{ top: 40, right: 80, left: 40, bottom: 60 }}>
              <XAxis
                dataKey="month"
                tick={(props: any) => {
                  const { x, y, payload } = props
                  const monthStr = payload.value

                  // Count posts for this month
                  const postsCount = notesMonthlyCount && notesMonthlyCount[monthStr] ? notesMonthlyCount[monthStr] : 0

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
                        {monthStr}
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

              <Tooltip content={(props) => <CustomTooltip {...props} notesMonthlyCount={notesMonthlyCount} />} />
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

              {/* Labels using transparent lines - same pattern as LifeCar */}
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
                  content={(props) => (
                    <CustomLabel
                      {...props}
                      color="#751FAE"
                      data={monthlyData}
                      dataKey="cost"
                      metricScale={metricScale}
                      costScale={costScale}
                      selectedMetric={selectedMetric}
                    />
                  )}
                  position="top"
                />
              </Line>

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
                  content={(props) => (
                    <CustomLabel
                      {...props}
                      color={metricConfig.color}
                      data={monthlyData}
                      dataKey={selectedMetric}
                      metricScale={metricScale}
                      costScale={costScale}
                      selectedMetric={selectedMetric}
                    />
                  )}
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