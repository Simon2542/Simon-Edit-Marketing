"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarMonthlyData, LifeCarDailyData } from "@/lib/lifecar-data-processor"
import { DualAxisRollingAverageChart } from "@/components/dual-axis-rolling-average-chart"

interface LifeCarMonthlySummaryProps {
  data: LifeCarMonthlyData[]
  dailyData?: LifeCarDailyData[]
  unfilteredDailyData?: LifeCarDailyData[]  // 新增：未筛选的原始数据
  title?: string
}

export function LifeCarMonthlySummary({ data, dailyData = [], unfilteredDailyData, title = "Monthly Performance Summary" }: LifeCarMonthlySummaryProps) {

  return (
    <div className="space-y-6">
      {/* 新增：7天滚动平均双Y轴图表 - 使用未筛选的原始数据 */}
      {unfilteredDailyData && unfilteredDailyData.length > 0 && (
        <>
          <DualAxisRollingAverageChart 
            data={unfilteredDailyData} 
            title="7-Day Rolling Average Analysis: Cost & Views"
          />
          
        </>
      )}
      
    </div>
  )
}