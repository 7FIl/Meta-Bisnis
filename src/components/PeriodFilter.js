"use client";

import { useState, useEffect } from "react";

export default function PeriodFilter({
  currentYear,
  currentMonth,
  onYearChange,
  onMonthChange,
  filterMode,
  onFilterModeChange,
  singleDate,
  onSingleDateChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showCalendarPopup,
  onCalendarPopupToggle,
}) {
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Calculate auto date range for current month
  const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const previousMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    
    const days = [];
    
    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: `${currentYear}-${String(currentMonth - 1).padStart(2, '0')}-${String(previousMonthLastDay - i).padStart(2, '0')}`,
        isCurrentMonth: false,
        day: previousMonthLastDay - i,
      });
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: true,
        day: i,
      });
    }
    
    // Next month's days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: false,
        day: i,
      });
    }
    
    return days;
  };

  const isDateInRange = (dateStr) => {
    if (!startDate || !endDate) return false;
    return dateStr >= startDate && dateStr <= endDate;
  };

  const isDateRangeStart = (dateStr) => dateStr === startDate;
  const isDateRangeEnd = (dateStr) => dateStr === endDate;

  const calendarDays = generateCalendarDays();

  const handleDateClick = (dateStr, isCurrentMonth) => {
    if (!isCurrentMonth) return;
    
    if (!startDate || (dateStr < startDate && dateStr < endDate)) {
      onStartDateChange(dateStr);
      onEndDateChange('');
    } else if (!endDate) {
      if (dateStr >= startDate) {
        onEndDateChange(dateStr);
      } else {
        onEndDateChange(startDate);
        onStartDateChange(dateStr);
      }
    } else {
      onStartDateChange(dateStr);
      onEndDateChange('');
    }
  };

  return (
    <>
      {/* Month/Year Navigation */}
      <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-1">
        <select 
          value={currentMonth} 
          onChange={(e) => onMonthChange(parseInt(e.target.value))}
          className="px-2 py-1 border-r border-slate-300 text-slate-600"
        >
          {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select 
          value={currentYear} 
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="px-2 py-1 text-slate-600"
        >
          {Array.from({length: 10}, (_, i) => currentYear - 5 + i).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Filter Mode */}
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium">Filter:</span>
        <select 
          value={filterMode} 
          onChange={(e) => {
            onFilterModeChange(e.target.value);
            onSingleDateChange('');
            onStartDateChange('');
            onEndDateChange('');
          }}
          className="px-2 py-1 border border-slate-300 rounded text-sm text-slate-600"
        >
          <option value="all">Semua Hari</option>
          <option value="single">1 Hari</option>
          <option value="range">Rentang Tanggal</option>
        </select>

        {filterMode === 'single' && (
          <input 
            type="date" 
            value={singleDate}
            onChange={(e) => onSingleDateChange(e.target.value)}
            className="px-2 py-1 border border-slate-300 rounded text-sm"
          />
        )}

        {filterMode === 'range' && (
          <button 
            onClick={() => onCalendarPopupToggle(true)}
            className="px-3 py-1 border border-slate-300 rounded text-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            {startDate && endDate 
              ? `${startDate.split('-')[2]} - ${endDate.split('-')[2]} ${monthNames[currentMonth - 1]}`
              : 'Pilih Rentang'}
          </button>
        )}
      </div>

      {/* Calendar Popup for Range Selection */}
      {filterMode === 'range' && showCalendarPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => onCalendarPopupToggle(false)}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-96" onClick={(e) => e.stopPropagation()}>
            {/* Header with Close Button */}
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold">{monthNames[currentMonth - 1]} {currentYear}</h4>
              <button 
                onClick={() => onCalendarPopupToggle(false)}
                className="text-2xl leading-none text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
          
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {/* Day headers */}
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, i) => (
                <div key={i} className="text-center text-xs font-semibold text-slate-600">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((dayObj, idx) => {
                const isInRange = isDateInRange(dayObj.date);
                const isStart = isDateRangeStart(dayObj.date);
                const isEnd = isDateRangeEnd(dayObj.date);
                const isCurrentMonth = dayObj.isCurrentMonth;
                
                let dayClasses = 'w-10 h-10 flex items-center justify-center rounded-full text-sm cursor-pointer transition-all ';
                
                if (!isCurrentMonth) {
                  dayClasses += 'text-slate-400 cursor-default';
                } else if (isStart || isEnd) {
                  dayClasses += 'bg-blue-600 text-white font-bold';
                } else if (isInRange) {
                  dayClasses += 'bg-blue-100 text-blue-900 border border-blue-300';
                } else {
                  dayClasses += 'text-slate-700 hover:bg-slate-200';
                }
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleDateClick(dayObj.date, isCurrentMonth)}
                    disabled={!isCurrentMonth}
                    className={dayClasses}
                  >
                    {dayObj.day}
                  </button>
                );
              })}
            </div>
            
            {/* Selected Range Display */}
            {startDate && endDate && (
              <div className="text-sm text-slate-700 text-center mb-4">
                Dipilih: {new Date(startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} 
                {' s/d '} 
                {new Date(endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            )}

            {/* Close Button */}
            <button 
              onClick={() => onCalendarPopupToggle(false)}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
