"use client"

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MonthlyPatternChart } from '@/components/monthly-pattern-chart';
import { WeekdayChartWithFilter } from '@/components/weekday-chart-with-filter';
// 移除静态导入，改为接收props

interface AcquisitionTimeAnalysisProps {
  brokerData?: any[];
  monthlyData?: any[];
  dailyCostData?: any[];
  startDate?: string;
  endDate?: string;
}

export function AcquisitionTimeAnalysis({ brokerData = [], monthlyData = [], dailyCostData = [], startDate, endDate }: AcquisitionTimeAnalysisProps) {
  const [comment, setComment] = useState('');
  
  // 从localStorage加载保存的评论
  useEffect(() => {
    const savedComment = localStorage.getItem('timeAnalysisComment');
    if (savedComment) {
      setComment(savedComment);
    }
  }, []);
  
  // monthlyData already available from props

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 font-montserrat">Customer Acquisition Time Analysis</h3>
        <p className="text-sm text-gray-600 font-montserrat font-light">Discover optimal timing patterns for lead generation</p>
      </div>


      {/* Weekday Distribution Chart */}
      <div className="mb-6">
        <WeekdayChartWithFilter 
          brokerData={brokerData} 
          dailyCostData={dailyCostData} 
          startDate={startDate}
          endDate={endDate}
        />
      </div>

      {/* 月度趋势 - 替换为MonthlyPatternChart */}
      <div className="mb-6">
        <MonthlyPatternChart 
          data={monthlyData} 
          title="Monthly Leads Pattern Analysis"
        />
      </div>


      {/* Comment输入框 */}
      <div className="mt-6 p-4 bg-black rounded-lg border border-gray-600">
        <Label htmlFor="time-analysis-comment" className="text-sm text-white font-montserrat font-semibold mb-2 block">
          Comments & Notes
        </Label>
        <Textarea
          id="time-analysis-comment"
          placeholder="Add your comments or insights about the time analysis..."
          value={comment}
          onChange={(e) => {
            const newComment = e.target.value;
            setComment(newComment);
            localStorage.setItem('timeAnalysisComment', newComment);
          }}
          className="w-full min-h-[80px] resize-none bg-gray-800 border-gray-600 text-white placeholder-gray-400 font-montserrat font-light focus:border-purple-400 focus:ring-purple-400/20"
        />
        {comment && (
          <div className="mt-2 text-xs text-gray-400 font-montserrat font-light">
            Character count: {comment.length}
          </div>
        )}
      </div>
    </div>
  );
}