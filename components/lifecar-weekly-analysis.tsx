"use client"

import React from 'react'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react"
import { type LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface LifeCarWeeklyAnalysisProps {
  data: LifeCarDailyData[]
  title?: string
}

interface WeeklyMetrics {
  weekStart: string
  weekEnd: string
  weekEndDate: Date
  totalCost: number
  totalImpressions: number
  totalClicks: number
  totalInteraction: number
  totalPrivateMessages: number
  costChange?: number
  impressionsChange?: number
  clicksChange?: number
  interactionChange?: number
  privateMessagesChange?: number
}

export function LifeCarWeeklyAnalysis({ data, title = "Weekly Performance Details" }: LifeCarWeeklyAnalysisProps) {
  // Process data to get weekly metrics
  const weeklyMetrics = React.useMemo(() => {
    if (!data || data.length === 0) return []

    // Group data by week
    const weekMap = new Map<string, LifeCarDailyData[]>()
    
    data.forEach(item => {
      const date = new Date(item.date)
      const weekStart = new Date(date)
      const day = weekStart.getDay()
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0)
      
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, [])
      }
      weekMap.get(weekKey)?.push(item)
    })

    // Calculate metrics for each week
    const weeks: WeeklyMetrics[] = []
    
    weekMap.forEach((weekData, weekStartStr) => {
      const weekStart = new Date(weekStartStr)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const metrics: WeeklyMetrics = {
        weekStart: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekEnd: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        weekEndDate: weekEnd,
        totalCost: weekData.reduce((sum, d) => sum + (d.spend || 0), 0),
        totalImpressions: weekData.reduce((sum, d) => sum + (d.impressions || 0), 0),
        totalClicks: weekData.reduce((sum, d) => sum + (d.clicks || 0), 0),
        totalInteraction: weekData.reduce((sum, d) => sum + (d.interactions || 0), 0),
        totalPrivateMessages: weekData.reduce((sum, d) => sum + ((d.multiConversion1 || 0) + (d.multiConversion2 || 0)), 0)

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
      if (previous.totalImpressions > 0) {
        current.impressionsChange = ((current.totalImpressions - previous.totalImpressions) / previous.totalImpressions) * 100
      }
      if (previous.totalClicks > 0) {
        current.clicksChange = ((current.totalClicks - previous.totalClicks) / previous.totalClicks) * 100
      }
      if (previous.totalInteraction > 0) {
        current.interactionChange = ((current.totalInteraction - previous.totalInteraction) / previous.totalInteraction) * 100
      }
      if (previous.totalPrivateMessages > 0) {
        current.privateMessagesChange = ((current.totalPrivateMessages - previous.totalPrivateMessages) / previous.totalPrivateMessages) * 100
      }
    }

    // Reverse to show latest week first
    return weeks.reverse()
  }, [data])

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
              <div className="p-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                <span className="text-purple-600 text-sm">📊</span>
              </div>
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
              {/* Total Cost */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                <svg className="absolute top-2 right-2 w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">Total Cost</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">${formatNumber(weekData.totalCost)}</div>
                  {renderChangePercent(weekData.costChange, 'negative')}
                </div>
              </div>

              {/* Views (previously Clicks) */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                <svg className="absolute top-2 right-2 w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">Views</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">{formatNumber(weekData.totalClicks)}</div>
                  {renderChangePercent(weekData.clicksChange, 'positive')}
                </div>
              </div>

              {/* Interaction */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                <svg className="absolute top-2 right-2 w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">Interaction</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">{formatNumber(weekData.totalInteraction)}</div>
                  {renderChangePercent(weekData.interactionChange, 'positive')}
                </div>
              </div>

              {/* Private Messages */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                <svg className="absolute top-2 right-2 w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">Private Messages</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">{formatNumber(weekData.totalPrivateMessages)}</div>
                  {renderChangePercent(weekData.privateMessagesChange, 'positive')}
                </div>
              </div>
            </div>
          </div>
        ))}CL
      </div>
    </div>
  )
}