"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarMonthlyData, LifeCarDailyData } from "@/lib/lifecar-data-processor"
import { DualAxisRollingAverageChart } from "@/components/dual-axis-rolling-average-chart"

interface LifeCarNote {
  发布时间: string
  类型: string
  名称: string
  链接: string
}

interface LifeCarMonthlySummaryProps {
  data: LifeCarMonthlyData[]
  dailyData?: LifeCarDailyData[]
  unfilteredDailyData?: LifeCarDailyData[]  // 新增：未筛选的原始数据
  title?: string
  selectedDates?: string[]
  notesData?: LifeCarNote[] // 新增：Posts数据
}

export function LifeCarMonthlySummary({ data, dailyData = [], unfilteredDailyData, title = "Monthly Performance Summary", selectedDates = [], notesData = [] }: LifeCarMonthlySummaryProps) {

  return (
    <div className="space-y-6">
      {/* 新增：7天滚动平均双Y轴图表 - 使用未筛选的原始数据 */}
      {unfilteredDailyData && unfilteredDailyData.length > 0 && (
        <>
          <DualAxisRollingAverageChart
            data={unfilteredDailyData}
            title="7-Day Rolling Average Analysis: Cost & Views"
            selectedDates={selectedDates}
            notesData={notesData}
          />
          
        </>
      )}
      
    </div>
  )
}