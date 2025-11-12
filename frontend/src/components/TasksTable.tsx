import React, { useState, useMemo } from 'react';
import { Task } from '../types';

interface TasksTableProps {
  tasks: Task[];
  showOverdueOnly?: boolean;
}

export const TasksTable: React.FC<TasksTableProps> = ({ tasks, showOverdueOnly = false }) => {
  const [sortField, setSortField] = useState<keyof Task>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRepository, setFilterRepository] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  const isOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.state !== 'OPEN') return false;
    return new Date(task.dueDate) < new Date();
  };

  // Extract unique values for filters
  const { repositories, statuses, assignees } = useMemo(() => {
    const repos = new Set<string>();
    const stats = new Set<string>();
    const assigns = new Set<string>();

    tasks.forEach((task) => {
      if (task.repository) repos.add(task.repository);
      if (task.status) stats.add(task.status);
      task.assignees.forEach((a) => assigns.add(a));
    });

    return {
      repositories: Array.from(repos).sort(),
      statuses: Array.from(stats).sort(),
      assignees: Array.from(assigns).sort(),
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (showOverdueOnly) {
      filtered = filtered.filter(isOverdue);
    }

    if (filterState !== 'all') {
      filtered = filtered.filter((task) => task.state === filterState);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((task) => task.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((task) => task.status === filterStatus);
    }

    if (filterRepository !== 'all') {
      filtered = filtered.filter((task) => task.repository === filterRepository);
    }

    if (filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned') {
        filtered = filtered.filter((task) => task.assignees.length === 0);
      } else {
        filtered = filtered.filter((task) => task.assignees.includes(filterAssignee));
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.number.toString().includes(query) ||
          task.repository?.toLowerCase().includes(query) ||
          task.assignees.some((a) => a.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [tasks, filterState, filterType, filterStatus, filterRepository, filterAssignee, searchQuery, showOverdueOnly]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle null values
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      // Convert dates to timestamps for comparison
      if (sortField === 'createdAt' || sortField === 'updatedAt' || sortField === 'dueDate') {
        aVal = new Date(aVal as string).getTime();
        bVal = new Date(bVal as string).getTime();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage);
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTasks, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filterState, filterType, filterStatus, filterRepository, filterAssignee, searchQuery]);

  const handleSort = (field: keyof Task) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const clearAllFilters = () => {
    setFilterState('all');
    setFilterType('all');
    setFilterStatus('all');
    setFilterRepository('all');
    setFilterAssignee('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    filterState !== 'all' ||
    filterType !== 'all' ||
    filterStatus !== 'all' ||
    filterRepository !== 'all' ||
    filterAssignee !== 'all' ||
    searchQuery !== '';

  return (
    <div>
      {!showOverdueOnly && (
        <div style={{ marginBottom: '20px' }}>
          {/* Search Bar */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search tasks by title, number, repository, or assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '0.875rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                outline: 'none',
              }}
            />
          </div>

          {/* Filters Row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>State:</label>
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="MERGED">Merged</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All</option>
                <option value="ISSUE">Issue</option>
                <option value="PULL_REQUEST">Pull Request</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  maxWidth: '150px',
                }}
              >
                <option value="all">All</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>Repository:</label>
              <select
                value={filterRepository}
                onChange={(e) => setFilterRepository(e.target.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  maxWidth: '200px',
                }}
              >
                <option value="all">All</option>
                {repositories.map((repo) => (
                  <option key={repo} value={repo}>
                    {repo.split('/')[1] || repo}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>Assignee:</label>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  maxWidth: '180px',
                }}
              >
                <option value="all">All</option>
                <option value="unassigned">Unassigned</option>
                {assignees.map((assignee) => (
                  <option key={assignee} value={assignee}>
                    @{assignee}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  color: '#dc2626',
                  fontWeight: 500,
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Results Info */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          >
            <div style={{ color: '#6b7280' }}>
              Showing <strong style={{ color: '#1f2937' }}>{paginatedTasks.length}</strong> of{' '}
              <strong style={{ color: '#1f2937' }}>{sortedTasks.length}</strong> tasks
              {sortedTasks.length !== tasks.length && (
                <span> (filtered from {tasks.length} total)</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ color: '#6b7280' }}>Per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>
                Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('state')} style={{ cursor: 'pointer' }}>
                State {sortField === 'state' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('repository')} style={{ cursor: 'pointer' }}>
                Repository {sortField === 'repository' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Assignees</th>
              <th onClick={() => handleSort('dueDate')} style={{ cursor: 'pointer' }}>
                Due Date {sortField === 'dueDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                Created {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedTasks.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  No tasks found
                </td>
              </tr>
            ) : (
              paginatedTasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{task.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>#{task.number}</div>
                  </td>
                  <td>
                    <span className="badge">{task.type.replace('_', ' ')}</span>
                  </td>
                  <td>
                    <span className={`badge ${task.state.toLowerCase()}`}>
                      {task.state}
                    </span>
                  </td>
                  <td>{task.status || '-'}</td>
                  <td style={{ fontSize: '0.875rem' }}>{task.repository || '-'}</td>
                  <td>
                    {task.assignees.length > 0 ? (
                      <div style={{ fontSize: '0.875rem' }}>
                        {task.assignees.map((a, i) => (
                          <div key={i}>@{a}</div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#6b7280' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    {task.dueDate ? (
                      <span className={isOverdue(task) ? 'badge overdue' : ''}>
                        {formatDate(task.dueDate)}
                        {isOverdue(task) && ' (Overdue)'}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{formatDate(task.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!showOverdueOnly && totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: currentPage === 1 ? '#f3f4f6' : '#fff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: currentPage === 1 ? '#f3f4f6' : '#fff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            Previous
          </button>

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: currentPage === pageNum ? '#2563eb' : '#fff',
                    color: currentPage === pageNum ? '#fff' : '#374151',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: currentPage === pageNum ? 600 : 400,
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#fff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#fff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            Last
          </button>

          <span style={{ marginLeft: '16px', fontSize: '0.875rem', color: '#6b7280' }}>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}
    </div>
  );
};
