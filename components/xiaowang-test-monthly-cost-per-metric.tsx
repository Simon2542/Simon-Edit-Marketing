"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface XiaowangTestMonthlyCostPerMetricProps {
  xiaowangTestData?: any
  brokerData?: any[]
  title?: string
  selectedMetric?: 'views' | 'likes' | 'followers' | 'leads'
  onMetricChange?: (metric: 'views' | 'likes' | 'followers' | 'leads') => void
}

interface MonthlyData {
  month: string
  monthKey: string
  costPerView: number
  costPerLike: number
  costPerFollower: number
  costPerLead: number
}

type MetricType = 'costPerView' | 'costPerLike' | 'costPerFollower' | 'costPerLead'

// Process Xiaowang test data combined with consultation leads data - aggregated by month for cost per metrics
function processXiaowangTestMonthlyCostData(xiaowangTestData: any, brokerData: any[]): MonthlyData[] {
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

  // Convert to array and calculate cost per metrics
  return Object.entries(monthlyMap)
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthName = monthNames[parseInt(month) - 1]

      return {
        month: `${monthName} ${year}`,
        monthKey,
        costPerView: data.views > 0 ? data.cost / data.views : 0,
        costPerLike: data.likes > 0 ? data.cost / data.likes : 0,
        costPerFollower: data.followers > 0 ? data.cost / data.followers : 0,
        costPerLead: data.leads > 0 ? data.cost / data.leads : 0
      }
    })
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

// Custom label component for cost per metric data points
function CustomCostLabel(props: any) {
  const { x, y, value, index, metricColor } = props

  if (!value || value === 0) return null

  const displayValue = value >= 100 ? `$${value.toFixed(0)}` : `$${value.toFixed(2)}`
  const width = 36
  const height = 14

  // Smart positioning to avoid overlaps
  const baseOffset = 15
  const staggerOffset = (index % 3) * 6 // Stagger every 3 points for better spacing
  const yOffset = baseOffset + staggerOffset

  const labelY = y - yOffset - height

  // Use the color from the current metric
  const labelColor = metricColor || "#751FAE"

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
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{`Month: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.name}: $${entry.value.toFixed(3)}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function XiaowangTestMonthlyCostPerMetric({
  xiaowangTestData,
  brokerData = [],
  title = "Monthly Cost Per Metric Analysis",
  selectedMetric: propSelectedMetric,
  onMetricChange
}: XiaowangTestMonthlyCostPerMetricProps) {
  // Map external metric to internal metric type
  const mapToInternalMetric = (metric: 'views' | 'likes' | 'followers' | 'leads'): MetricType => {
    const mapping: Record<string, MetricType> = {
      'views': 'costPerView',
      'likes': 'costPerLike',
      'followers': 'costPerFollower',
      'leads': 'costPerLead'
    }
    return mapping[metric] || 'costPerView'
  }

  const mapToExternalMetric = (metric: MetricType): 'views' | 'likes' | 'followers' | 'leads' => {
    const mapping: Record<MetricType, 'views' | 'likes' | 'followers' | 'leads'> = {
      'costPerView': 'views',
      'costPerLike': 'likes',
      'costPerFollower': 'followers',
      'costPerLead': 'leads'
    }
    return mapping[metric] || 'views'
  }

  const [selectedMetric, setSelectedMetric] = useState<MetricType>(
    propSelectedMetric ? mapToInternalMetric(propSelectedMetric) : 'costPerView'
  )

  // Sync with prop changes
  useEffect(() => {
    if (propSelectedMetric) {
      setSelectedMetric(mapToInternalMetric(propSelectedMetric))
    }
  }, [propSelectedMetric])

  // Handle metric change
  const handleMetricChange = (metric: MetricType) => {
    setSelectedMetric(metric)
    onMetricChange?.(mapToExternalMetric(metric))
  }

  // Get current metric config
  const metricConfig = useMemo(() => {
    switch (selectedMetric) {
      case 'costPerView': return { label: 'Cost Per View', color: '#3CBDE5', dataKey: 'costPerView' }
      case 'costPerLike': return { label: 'Cost Per Like', color: '#EF3C99', dataKey: 'costPerLike' }
      case 'costPerFollower': return { label: 'Cost Per Follower', color: '#10B981', dataKey: 'costPerFollower' }
      case 'costPerLead': return { label: 'Cost Per Lead', color: '#F59E0B', dataKey: 'costPerLead' }
      default: return { label: 'Cost Per View', color: '#3CBDE5', dataKey: 'costPerView' }
    }
  }, [selectedMetric])

  // Process monthly cost per metric data (use all data, no filtering)
  const monthlyData = useMemo(() => {
    return processXiaowangTestMonthlyCostData(xiaowangTestData, brokerData)
  }, [xiaowangTestData, brokerData])

  // Calculate dynamic scales
  const metricScale = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) {
      return { domain: [0, 10], ticks: [0, 2.5, 5, 7.5, 10] }
    }

    const values = monthlyData.map(item => item[metricConfig.dataKey]).filter(v => v > 0)
    if (values.length === 0) {
      return { domain: [0, 10], ticks: [0, 2.5, 5, 7.5, 10] }
    }

    const maxValue = Math.max(...values)
    const roundedMax = Math.ceil(maxValue * 1.2)
    const step = roundedMax / 4

    return {
      domain: [0, roundedMax],
      ticks: [0, step, step * 2, step * 3, roundedMax].map(v => Math.round(v * 100) / 100)
    }
  }, [monthlyData, metricConfig.dataKey])

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
            No monthly data available - xiaowangTestData: {xiaowangTestData ? 'exists' : 'null'}, brokerData: {brokerData?.length || 0} items
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
              Monthly {metricConfig.label} Trend
            </CardTitle>
          </div>

          <div className="flex items-center gap-4">
            {/* Metric Selection Buttons - Same order as Daily Analysis */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Cost per:</span>
              <Button
                variant={selectedMetric === 'costPerView' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricChange('costPerView')}
                className={selectedMetric === 'costPerView'
                  ? 'bg-[#3CBDE5] hover:bg-[#2563EB] text-white border-0'
                  : 'border-[#3CBDE5] text-[#3CBDE5] hover:bg-[#3CBDE5] hover:text-white'
                }
              >
                View
              </Button>
              <Button
                variant={selectedMetric === 'costPerLike' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricChange('costPerLike')}
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
                onClick={() => handleMetricChange('costPerFollower')}
                className={selectedMetric === 'costPerFollower'
                  ? 'bg-[#10B981] hover:bg-[#059669] text-white border-0'
                  : 'border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white'
                }
              >
                Follower
              </Button>
              <Button
                variant={selectedMetric === 'costPerLead' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricChange('costPerLead')}
                className={selectedMetric === 'costPerLead'
                  ? 'bg-[#F59E0B] hover:bg-[#D97706] text-white border-0'
                  : 'border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B] hover:text-white'
                }
              >
                Lead
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 60, right: 50, left: 50, bottom: 5 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
                scale="point"
                padding={{ left: 30, right: 30 }}
              />
              <YAxis
                domain={metricScale.domain}
                ticks={metricScale.ticks}
                tick={{ fontSize: 11 }}
                label={{
                  value: metricConfig.label,
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Main Cost Per Metric Line */}
              <Line
                type="monotone"
                dataKey={metricConfig.dataKey}
                stroke={metricConfig.color}
                strokeWidth={3}
                dot={{ fill: metricConfig.color, r: 5 }}
                name={metricConfig.label}
                connectNulls={false}
              />

              {/* Transparent line for labels - same pattern as LifeCar */}
              <Line
                type="monotone"
                dataKey={metricConfig.dataKey}
                stroke="transparent"
                dot={false}
                connectNulls={false}
                legendType="none"
              >
                <LabelList
                  content={(props) => <CustomCostLabel {...props} data={monthlyData} metricColor={metricConfig.color} />}
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