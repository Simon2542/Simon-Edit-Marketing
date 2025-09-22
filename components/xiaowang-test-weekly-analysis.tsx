"use client"

import React from 'react'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react"

interface XiaowangTestWeeklyAnalysisProps {
  xiaowangTestData?: any
  brokerData?: any[]
  title?: string
}

interface WeeklyMetrics {
  weekStart: string
  weekEnd: string
  weekEndDate: Date
  totalCost: number
  totalViews: number
  totalLikes: number
  totalNewFollowers: number
  totalLeads: number
  dailyLeads: number
  costPerLead: number
  costChange?: number
  viewsChange?: number
  likesChange?: number
  newFollowersChange?: number
  leadsChange?: number
  dailyLeadsChange?: number
  costPerLeadChange?: number
}

export function XiaowangTestWeeklyAnalysis({
  xiaowangTestData,
  brokerData = [],
  title = "Weekly Performance Details"
}: XiaowangTestWeeklyAnalysisProps) {
  // Process data to get weekly metrics
  const weeklyMetrics = React.useMemo(() => {
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

    // Group data by week
    const weekMap = new Map<string, any[]>()

    xiaowangTestData.dailyData.forEach((item: any) => {
      // Parse date in local timezone to avoid timezone offset issues
      const [year, month, day] = item.date.split('-').map(Number)
      const date = new Date(year, month - 1, day, 12, 0, 0, 0) // Set to noon
      const weekStart = new Date(date)
      const dayOfWeek = weekStart.getDay()
      // For Monday-Sunday weeks where Sunday is the LAST day of the week:
      // Sunday (0) should be grouped with the Monday 6 days BEFORE it
      // Monday (1) stays at Monday
      // Tuesday (2) goes back 1 day to Monday
      // etc.
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1  // Sunday goes back 6 days to find its Monday
      weekStart.setDate(weekStart.getDate() - daysFromMonday)
      weekStart.setHours(0, 0, 0, 0)

      // Format date in local timezone
      const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, [])
      }
      weekMap.get(weekKey)?.push({
        ...item,
        leads: leadsPerDate[item.date] || 0
      })
    })

    // Calculate metrics for each week
    const weeks: WeeklyMetrics[] = []

    weekMap.forEach((weekData, weekStartStr) => {
      const weekStart = new Date(weekStartStr)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const totalCost = weekData.reduce((sum, d) => sum + (d.cost || 0), 0)
      const totalLeads = weekData.reduce((sum, d) => sum + (d.leads || 0), 0)
      const dailyLeads = totalLeads / 7 // Average leads per day
      const costPerLead = totalLeads > 0 ? totalCost / totalLeads : 0

      const metrics: WeeklyMetrics = {
        weekStart: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekEnd: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        weekEndDate: weekEnd,
        totalCost: totalCost,
        totalViews: weekData.reduce((sum, d) => sum + (d.clicks || 0), 0), // Map clicks to views
        totalLikes: weekData.reduce((sum, d) => sum + (d.likes || 0), 0),
        totalNewFollowers: weekData.reduce((sum, d) => sum + (d.followers || 0), 0),
        totalLeads: totalLeads,
        dailyLeads: dailyLeads,
        costPerLead: costPerLead
      }

      weeks.push(metrics)
    })

    // Sort weeks chronologically
    weeks.sort((a, b) => {
      const dateA = new Date(a.weekStart + ', ' + a.weekEnd.split(', ')[1])
      const dateB = new Date(b.weekStart + ', ' + b.weekEnd.split(', ')[1])
      return dateA.getTime() - dateB.getTime()
    })

    // Calculate week-over-week changes
    for (let i = 1; i < weeks.length; i++) {
      const current = weeks[i]
      const previous = weeks[i - 1]

      if (previous.totalCost > 0) {
        current.costChange = ((current.totalCost - previous.totalCost) / previous.totalCost) * 100
      }
      if (previous.totalViews > 0) {
        current.viewsChange = ((current.totalViews - previous.totalViews) / previous.totalViews) * 100
      }
      if (previous.totalLikes > 0) {
        current.likesChange = ((current.totalLikes - previous.totalLikes) / previous.totalLikes) * 100
      }
      if (previous.totalNewFollowers > 0) {
        current.newFollowersChange = ((current.totalNewFollowers - previous.totalNewFollowers) / previous.totalNewFollowers) * 100
      }
      if (previous.totalLeads > 0) {
        current.leadsChange = ((current.totalLeads - previous.totalLeads) / previous.totalLeads) * 100
      }
      if (previous.dailyLeads > 0) {
        current.dailyLeadsChange = ((current.dailyLeads - previous.dailyLeads) / previous.dailyLeads) * 100
      }
      if (previous.costPerLead > 0) {
        current.costPerLeadChange = ((current.costPerLead - previous.costPerLead) / previous.costPerLead) * 100
      }
    }

    // Reverse to show latest week first, and show only last 12 weeks
    return weeks.reverse().slice(0, 12)
  }, [xiaowangTestData, brokerData])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toFixed(0)
  }

  const formatWeekEndDate = (weekEndDate: Date) => {
    return weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const renderChangePercent = (change: number | undefined, metricType: 'positive' | 'negative' = 'positive') => {
    if (change === undefined) return null

    const isPositive = change > 0
    const arrow = isPositive ? '↑' : change < 0 ? '↓' : '→'
    let color = ''

    // For most metrics, positive change is good (green), negative is bad (red)
    // For costs, it's reversed - lower is better
    if (metricType === 'positive') {
      color = isPositive ? 'text-green-600' : 'text-red-600'
    } else { // costs - reversed colors
      color = isPositive ? 'text-red-600' : 'text-green-600'
    }

    return (
      <span className={`${color} text-xs font-medium font-montserrat`}>
        {arrow} {Math.abs(change).toFixed(1)}%
      </span>
    )
  }

  if (!weeklyMetrics || weeklyMetrics.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
              <span className="text-purple-600 text-lg">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 font-montserrat">{title}</h3>
          </div>
        </div>
        <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-8">
          <p className="text-center text-gray-500">No weekly data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Weekly Performance Details Header */}
      <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <span className="text-purple-600 text-lg">📅</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 font-montserrat">{title}</h3>
        </div>
      </div>

      {/* Individual Weekly Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {weeklyMetrics.map((weekData, index) => (
          <div key={index} className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <div className="flex-1">
                <h4 className="text-2xl font-black text-[#751FAE] font-montserrat">
                  Week of {formatWeekEndDate(weekData.weekEndDate)}
                </h4>
              </div>
              {index === 0 && (
                <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full font-semibold">
                  Latest
                </span>
              )}
            </div>

            <div className="space-y-2">
              {/* Leads */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                <svg className="absolute top-2 right-2 w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">Leads</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">{formatNumber(weekData.totalLeads)}</div>
                  {renderChangePercent(weekData.leadsChange, 'positive')}
                </div>
              </div>

              {/* Daily Leads */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                <svg className="absolute top-2 right-2 w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">Daily Leads</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">{weekData.dailyLeads.toFixed(1)}</div>
                  {renderChangePercent(weekData.dailyLeadsChange, 'positive')}
                </div>
              </div>

              {/* Cost */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                <svg className="absolute top-2 right-2 w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">Cost</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">${formatNumber(weekData.totalCost)}</div>
                  {renderChangePercent(weekData.costChange, 'negative')}
                </div>
              </div>

              {/* Cost per Lead */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                <svg className="absolute top-2 right-2 w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">Cost per Lead</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">
                    {weekData.costPerLead > 0 ? `$${weekData.costPerLead.toFixed(2)}` : '$0'}
                  </div>
                  {renderChangePercent(weekData.costPerLeadChange, 'negative')}
                </div>
              </div>

              {/* New Followers */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                <svg className="absolute top-2 right-2 w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">New Followers</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">{formatNumber(weekData.totalNewFollowers)}</div>
                  {renderChangePercent(weekData.newFollowersChange, 'positive')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}