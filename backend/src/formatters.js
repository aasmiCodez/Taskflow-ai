function formatTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    storyPoints: task.storyPoints,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    startedAt: task.startedAt,
    reviewAt: task.reviewAt,
    completedAt: task.completedAt,
    createdBy: task.createdBy
      ? {
          id: task.createdBy.id,
          name: task.createdBy.name,
          email: task.createdBy.email,
          role: task.createdBy.role,
        }
      : null,
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email,
          role: task.assignee.role,
          managerId: task.assignee.managerId || null,
        }
      : null,
    subtasks: (task.subtasks || []).map((subtask) => ({
      id: subtask.id,
      title: subtask.title,
      completed: subtask.completed,
      source: subtask.source,
      status: subtask.status,
      storyPoints: subtask.storyPoints,
      dueDate: subtask.dueDate,
      createdAt: subtask.createdAt,
      updatedAt: subtask.updatedAt,
      startedAt: subtask.startedAt,
      reviewAt: subtask.reviewAt,
      completedAt: subtask.completedAt,
    })),
  };
}

module.exports = { formatTask };
