import type { Task } from "../types";

export function getTaskStoryPoints(task: Task) {
  return task.storyPoints;
}

export function getSubtaskStoryPoints(task: Task, subtaskId: string) {
  const subtasks = task.subtasks || [];
  if (!subtasks.length) {
    return 0;
  }

  const subtaskIndex = subtasks.findIndex((subtask) => subtask.id === subtaskId);
  if (subtaskIndex === -1) {
    return 0;
  }

  const totalPoints = Math.max(0, task.storyPoints || 0);
  const basePoints = Math.floor(totalPoints / subtasks.length);
  const remainder = totalPoints % subtasks.length;

  return subtaskIndex < remainder ? basePoints + 1 : basePoints;
}
