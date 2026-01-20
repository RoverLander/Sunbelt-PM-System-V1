import React from 'react';
import { ZOOM_LEVELS, generateDateHeaders, getDayWidth } from './timelineUtils';

/**
 * TimelineHeader - Renders the date header for the Gantt/Timeline view
 *
 * @param {Date} startDate - Start date of the visible timeline
 * @param {Date} endDate - End date of the visible timeline
 * @param {string} zoomLevel - Current zoom level ('day', 'week', 'month')
 * @param {number} scrollLeft - Current horizontal scroll position
 */
function TimelineHeader({
  startDate,
  endDate,
  zoomLevel = 'week',
  scrollLeft = 0
}) {
  const config = ZOOM_LEVELS[zoomLevel];
  const dayWidth = getDayWidth(zoomLevel);
  const headers = generateDateHeaders(startDate, endDate, zoomLevel);

  // Group headers by month for month labels row
  const monthGroups = [];
  let currentMonth = null;
  let currentMonthDays = 0;
  let currentMonthStart = 0;

  headers.forEach((header, index) => {
    const month = header.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (month !== currentMonth) {
      if (currentMonth !== null) {
        monthGroups.push({
          label: currentMonth,
          days: currentMonthDays,
          startIndex: currentMonthStart
        });
      }
      currentMonth = month;
      currentMonthDays = 1;
      currentMonthStart = index;
    } else {
      currentMonthDays++;
    }
  });

  // Add last month group
  if (currentMonth !== null) {
    monthGroups.push({
      label: currentMonth,
      days: currentMonthDays,
      startIndex: currentMonthStart
    });
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)'
      }}
    >
      {/* Month Row (only shown for week/month zoom) */}
      {zoomLevel !== 'day' && (
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)',
            position: 'relative'
          }}
        >
          {monthGroups.map((group, index) => (
            <div
              key={`${group.label}-${index}`}
              style={{
                width: group.days * dayWidth,
                padding: '6px 8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRight: '1px solid var(--border-color)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {group.label}
            </div>
          ))}
        </div>
      )}

      {/* Day Headers Row */}
      <div
        style={{
          display: 'flex',
          position: 'relative'
        }}
      >
        {headers.map((header, index) => (
          <div
            key={`day-${index}`}
            style={{
              width: dayWidth,
              flexShrink: 0,
              padding: zoomLevel === 'day' ? '8px 4px' : '4px 2px',
              textAlign: 'center',
              borderRight: '1px solid var(--border-color)',
              background: header.isToday
                ? 'rgba(255, 107, 53, 0.15)'
                : header.isWeekend
                  ? 'rgba(0, 0, 0, 0.03)'
                  : 'transparent',
              transition: 'background 0.15s'
            }}
          >
            {/* Day of Week (for day zoom) */}
            {zoomLevel === 'day' && (
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: '600',
                  color: header.isToday
                    ? 'var(--sunbelt-orange)'
                    : header.isWeekend
                      ? 'var(--text-tertiary)'
                      : 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}
              >
                {header.dayOfWeek}
              </div>
            )}

            {/* Date Number */}
            <div
              style={{
                fontSize: zoomLevel === 'day' ? '0.875rem' : zoomLevel === 'week' ? '0.75rem' : '0.625rem',
                fontWeight: header.isToday ? '700' : '600',
                color: header.isToday
                  ? 'white'
                  : header.isWeekend
                    ? 'var(--text-tertiary)'
                    : 'var(--text-primary)',
                width: header.isToday ? '24px' : 'auto',
                height: header.isToday ? '24px' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: header.isToday ? 'var(--sunbelt-orange)' : 'transparent',
                margin: header.isToday ? '0 auto' : '0'
              }}
            >
              {header.label}
            </div>

            {/* Short day name for week zoom */}
            {zoomLevel === 'week' && (
              <div
                style={{
                  fontSize: '0.5625rem',
                  color: header.isWeekend ? 'var(--text-tertiary)' : 'var(--text-tertiary)',
                  marginTop: '1px',
                  textTransform: 'uppercase'
                }}
              >
                {header.dayOfWeek.charAt(0)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Today Indicator Line */}
      <TodayIndicator
        headers={headers}
        dayWidth={dayWidth}
      />
    </div>
  );
}

/**
 * Today Indicator - Vertical line showing current day
 */
function TodayIndicator({ headers, dayWidth }) {
  const todayIndex = headers.findIndex(h => h.isToday);

  if (todayIndex === -1) return null;

  const now = new Date();
  const hoursProgress = (now.getHours() + now.getMinutes() / 60) / 24;
  const offset = todayIndex * dayWidth + hoursProgress * dayWidth;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: offset,
        width: '2px',
        background: 'var(--sunbelt-orange)',
        zIndex: 5,
        pointerEvents: 'none'
      }}
    >
      {/* Triangle marker at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-4px',
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '6px solid var(--sunbelt-orange)'
        }}
      />
    </div>
  );
}

export default TimelineHeader;
