import { Task, TaskStats } from '../types/task';

/**
 * Service to process and analyze tasks
 */
export class TaskProcessorService {
  /**
   * Check if a task is overdue
   */
  private isOverdue(task: Task): boolean {
    if (!task.dueDate) {
      return false;
    }

    // Only consider open tasks as overdue
    if (task.state === 'CLOSED' || task.state === 'MERGED') {
      return false;
    }

    // Check if due date is today or earlier (use start of day for comparison)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(task.dueDate);
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    return dueDateOnly <= today;
  }

  /**
   * Calculate statistics from tasks
   */
  calculateStats(tasks: Task[]): TaskStats {
    const total = tasks.length;

    const open = tasks.filter(
      (t) => t.state === 'OPEN'
    ).length;

    const closed = tasks.filter(
      (t) => t.state === 'CLOSED' || t.state === 'MERGED'
    ).length;

    const overdueList = tasks.filter((t) => this.isOverdue(t));
    const overdue = overdueList.length;

    // Tasks without First Tech Handoff ETA Date (only count open tasks)
    const noTechHandoffETAList = tasks.filter(
      (t) => t.state === 'OPEN' && !t.dueDate
    );
    const noTechHandoffETA = noTechHandoffETAList.length;

    // No First Tech Handoff ETA Date by priority
    const noETAP0List = noTechHandoffETAList.filter(
      (t) => t.priority?.toUpperCase() === 'P0'
    );
    const noETAP1List = noTechHandoffETAList.filter(
      (t) => t.priority?.toUpperCase() === 'P1'
    );
    const noETANoPriorityList = noTechHandoffETAList.filter(
      (t) => !t.priority || (t.priority.toUpperCase() !== 'P0' && t.priority.toUpperCase() !== 'P1')
    );

    // Unassigned tasks by priority (only count open tasks)
    const unassignedTasks = tasks.filter(
      (t) => t.state === 'OPEN' && t.assignees.length === 0
    );

    const p0List = unassignedTasks.filter(
      (t) => t.priority?.toUpperCase() === 'P0'
    );
    const p1List = unassignedTasks.filter(
      (t) => t.priority?.toUpperCase() === 'P1'
    );
    const noPriorityList = unassignedTasks.filter(
      (t) => !t.priority || (t.priority.toUpperCase() !== 'P0' && t.priority.toUpperCase() !== 'P1')
    );

    return {
      total,
      open,
      closed,
      overdue,
      overdueList,
      noTechHandoffETA,
      noTechHandoffETAList,
      noTechHandoffETAByPriority: {
        p0: noETAP0List.length,
        p1: noETAP1List.length,
        noPriority: noETANoPriorityList.length,
        p0List: noETAP0List,
        p1List: noETAP1List,
        noPriorityList: noETANoPriorityList,
      },
      unassignedByPriority: {
        p0: p0List.length,
        p1: p1List.length,
        noPriority: noPriorityList.length,
        p0List,
        p1List,
        noPriorityList,
      },
    };
  }

  /**
   * Segregate tasks by state
   */
  segregateTasks(tasks: Task[]): {
    open: Task[];
    closed: Task[];
  } {
    const open = tasks.filter((t) => t.state === 'OPEN');
    const closed = tasks.filter(
      (t) => t.state === 'CLOSED' || t.state === 'MERGED'
    );

    return { open, closed };
  }

  /**
   * Get tasks by repository
   */
  groupByRepository(tasks: Task[]): Map<string, Task[]> {
    const grouped = new Map<string, Task[]>();

    for (const task of tasks) {
      const repo = task.repository || 'unknown';
      if (!grouped.has(repo)) {
        grouped.set(repo, []);
      }
      grouped.get(repo)!.push(task);
    }

    return grouped;
  }

  /**
   * Get tasks by assignee
   */
  groupByAssignee(tasks: Task[]): Map<string, Task[]> {
    const grouped = new Map<string, Task[]>();

    for (const task of tasks) {
      if (task.assignees.length === 0) {
        // Unassigned tasks
        if (!grouped.has('unassigned')) {
          grouped.set('unassigned', []);
        }
        grouped.get('unassigned')!.push(task);
      } else {
        // Tasks with assignees
        for (const assignee of task.assignees) {
          if (!grouped.has(assignee)) {
            grouped.set(assignee, []);
          }
          grouped.get(assignee)!.push(task);
        }
      }
    }

    return grouped;
  }

  /**
   * Get tasks by status (project column)
   */
  groupByStatus(tasks: Task[]): Map<string, Task[]> {
    const grouped = new Map<string, Task[]>();

    for (const task of tasks) {
      const status = task.status || 'no-status';
      if (!grouped.has(status)) {
        grouped.set(status, []);
      }
      grouped.get(status)!.push(task);
    }

    return grouped;
  }

  /**
   * Sort tasks by creation date (newest first)
   */
  sortByCreationDate(tasks: Task[], ascending = false): Task[] {
    return [...tasks].sort((a, b) => {
      const diff = a.createdAt.getTime() - b.createdAt.getTime();
      return ascending ? diff : -diff;
    });
  }

  /**
   * Sort tasks by due date (earliest first)
   */
  sortByDueDate(tasks: Task[], ascending = true): Task[] {
    // Tasks without due date go to the end
    return [...tasks].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      const diff = a.dueDate.getTime() - b.dueDate.getTime();
      return ascending ? diff : -diff;
    });
  }

  /**
   * Filter tasks by date range
   */
  filterByDateRange(
    tasks: Task[],
    startDate: Date | null,
    endDate: Date | null
  ): Task[] {
    return tasks.filter((task) => {
      if (startDate && task.createdAt < startDate) {
        return false;
      }
      if (endDate && task.createdAt > endDate) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get summary report
   */
  getSummaryReport(tasks: Task[]): {
    stats: TaskStats;
    byRepository: { [repo: string]: number };
    byAssignee: { [assignee: string]: number };
    byStatus: { [status: string]: number };
  } {
    const stats = this.calculateStats(tasks);

    const byRepository: { [repo: string]: number } = {};
    this.groupByRepository(tasks).forEach((tasks, repo) => {
      byRepository[repo] = tasks.length;
    });

    const byAssignee: { [assignee: string]: number } = {};
    this.groupByAssignee(tasks).forEach((tasks, assignee) => {
      byAssignee[assignee] = tasks.length;
    });

    const byStatus: { [status: string]: number } = {};
    this.groupByStatus(tasks).forEach((tasks, status) => {
      byStatus[status] = tasks.length;
    });

    return {
      stats,
      byRepository,
      byAssignee,
      byStatus,
    };
  }
}
