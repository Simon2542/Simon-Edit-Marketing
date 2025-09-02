"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TimeRangeFilterProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function TimeRangeFilter({ onDateRangeChange }: TimeRangeFilterProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApplyFilter = () => {
    onDateRangeChange(startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    onDateRangeChange('', '');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-semibold mb-4">Time Range Filter</h3>
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleApplyFilter} variant="default">
            Apply
          </Button>
          <Button onClick={handleClearFilter} variant="outline">
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}