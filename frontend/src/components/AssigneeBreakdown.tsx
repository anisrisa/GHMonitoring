import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Task } from '../types';

interface AssigneeBreakdownProps {
  tasks: Task[];
}

const COLORS = [
  '#2563eb', // Blue
  '#16a34a', // Green
  '#ea580c', // Orange
  '#dc2626', // Red
  '#9333ea', // Purple
  '#0891b2', // Cyan
  '#c026d3', // Magenta
  '#65a30d', // Lime
  '#db2777', // Pink
  '#f59e0b', // Amber
];

const UNASSIGNED_COLOR = '#9ca3af'; // Gray
const OTHERS_COLOR = '#6b7280'; // Dark gray
const TOP_N = 10; // Show top 10 assignees

export const AssigneeBreakdown: React.FC<AssigneeBreakdownProps> = ({ tasks }) => {
  const { chartData, allData, totalOpenTasks } = useMemo(() => {
    // Filter only OPEN tasks
    const openTasks = tasks.filter((task) => task.state === 'OPEN');
    const total = openTasks.length;

    // Group tasks by assignee
    const assigneeMap = new Map<string, number>();

    for (const task of openTasks) {
      if (task.assignees.length === 0) {
        assigneeMap.set('Unassigned', (assigneeMap.get('Unassigned') || 0) + 1);
      } else {
        for (const assignee of task.assignees) {
          assigneeMap.set(assignee, (assigneeMap.get(assignee) || 0) + 1);
        }
      }
    }

    // Convert to array and sort by count (descending)
    const sortedData = Array.from(assigneeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Take top N and group others
    const topData = sortedData.slice(0, TOP_N);
    const othersCount = sortedData.slice(TOP_N).reduce((sum, item) => sum + item.value, 0);

    const chartDataFinal = [...topData];
    if (othersCount > 0) {
      chartDataFinal.push({ name: `Others (${sortedData.length - TOP_N})`, value: othersCount });
    }

    return {
      chartData: chartDataFinal,
      allData: sortedData,
      totalOpenTasks: total,
    };
  }, [tasks]);

  if (allData.length === 0) {
    return (
      <div className="card">
        <h2>Open Tasks by Assignee</h2>
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
          No open tasks found
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Open Tasks by Assignee</h2>
      <div style={{ marginBottom: '16px', color: '#6b7280', fontSize: '0.875rem' }}>
        Total Open Tasks: <strong style={{ color: '#1f2937', fontSize: '1.125rem' }}>{totalOpenTasks}</strong>
      </div>

      {/* Bar Chart */}
      <div style={{ marginBottom: '32px' }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                if (value === 'Unassigned') return value;
                if (value.startsWith('Others')) return value;
                return `@${value}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [`${value} tasks`, 'Count']}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === 'Unassigned'
                      ? UNASSIGNED_COLOR
                      : entry.name.startsWith('Others')
                      ? OTHERS_COLOR
                      : COLORS[index % COLORS.length]
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Table */}
      <div>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#374151' }}>
          Detailed Breakdown
        </h3>
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <table style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f9fafb', zIndex: 1 }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb' }}>Rank</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb' }}>Assignee</th>
                <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e5e7eb' }}>Tasks</th>
                <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e5e7eb' }}>Percentage</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb' }}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {allData.map((entry, index) => {
                const percentage = ((entry.value / totalOpenTasks) * 100).toFixed(1);
                const colorIndex = index < TOP_N ? index : TOP_N;
                const color =
                  entry.name === 'Unassigned'
                    ? UNASSIGNED_COLOR
                    : COLORS[colorIndex % COLORS.length];

                return (
                  <tr
                    key={entry.name}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                    }}
                  >
                    <td style={{ padding: '12px', color: '#6b7280', fontWeight: 600 }}>#{index + 1}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: color,
                          }}
                        />
                        {entry.name === 'Unassigned' ? (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{entry.name}</span>
                        ) : (
                          <span style={{ fontWeight: 500 }}>@{entry.name}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                      {entry.value}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#6b7280' }}>
                      {percentage}%
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '8px',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${percentage}%`,
                              backgroundColor: color,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
