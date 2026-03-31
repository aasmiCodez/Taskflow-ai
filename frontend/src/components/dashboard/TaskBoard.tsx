import { useState } from "react";
import type { Subtask, Task, TaskStatus, TeamUser, User } from "../../types";
import { getSubtaskStoryPoints } from "../../lib/storyPoints";
import { TaskCard } from "./TaskCard";
import { SubtaskCard } from "./SubtaskCard";

interface TaskBoardProps {
  currentUser: User;
  tasks: Task[];
  assignableUsers: TeamUser[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onInvalidMove: (message: string) => void;
  onAssign: (taskId: string, assigneeId: string | null) => void;
  onDelete: (taskId: string) => void;
  onDeleteAll: () => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onGenerateSubtasks: (taskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onSubtaskStatusChange: (subtaskId: string, status: TaskStatus) => void;
}

const columns: Array<{ status: TaskStatus; label: string; accent: string }> = [
  { status: "TODO", label: "To Do", accent: "text-slate-200" },
  { status: "IN_PROGRESS", label: "In Progress", accent: "text-cyan-300" },
  { status: "REVIEW", label: "Review", accent: "text-amber-300" },
  { status: "COMPLETED", label: "Completed", accent: "text-emerald-300" },
];

function getStatusIndex(status: TaskStatus) {
  return columns.findIndex((column) => column.status === status);
}

function canMoveOneStep(currentStatus: TaskStatus, nextStatus: TaskStatus) {
  return Math.abs(getStatusIndex(currentStatus) - getStatusIndex(nextStatus)) === 1;
}

function printStatus(status: TaskStatus) {
  return status.replace("_", " ");
}

function getSubtaskStatus(subtask: Subtask): TaskStatus {
  return subtask.status || (subtask.completed ? "COMPLETED" : "TODO");
}

export function TaskBoard(props: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedSubtaskId, setDraggedSubtaskId] = useState<string | null>(null);

  if (!props.tasks.length) {
    return (
      <section className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-8">
        <h2 className="text-2xl font-bold text-white">Taskdrome</h2>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          No tasks yet. Create a main task and let AI split it into story-pointed subtasks automatically.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Taskdrome</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Drag cards across Jira-style columns to move work from planning to in progress, review, and completed.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
          onClick={props.onDeleteAll}
          type="button"
        >
          Delete All Tasks
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => {
          const tasks = props.tasks.filter((task) => task.status === column.status);
          const subtasks = props.tasks.flatMap((task) =>
            task.subtasks
              .filter((subtask) => getSubtaskStatus(subtask) === column.status)
              .map((subtask) => ({
                subtask,
                taskId: task.id,
                taskTitle: task.title,
                taskAssignee: task.assignee,
                storyPoints: getSubtaskStoryPoints(task, subtask.id),
              }))
          );
          return (
            <div
              key={column.status}
              className="rounded-3xl border border-slate-800 bg-slate-900/70 p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedTaskId) {
                  const draggedTask = props.tasks.find((task) => task.id === draggedTaskId);
                  if (draggedTask && canMoveOneStep(draggedTask.status, column.status)) {
                    props.onStatusChange(draggedTaskId, column.status);
                  } else if (draggedTask && draggedTask.status !== column.status) {
                    props.onInvalidMove(
                      `Tasks must move step by step. Move from ${printStatus(draggedTask.status)} to the next stage first.`
                    );
                  }
                  setDraggedTaskId(null);
                }
                if (draggedSubtaskId) {
                  const draggedSubtask = props.tasks
                    .flatMap((task) => task.subtasks)
                    .find((subtask) => subtask.id === draggedSubtaskId);
                  if (draggedSubtask && canMoveOneStep(getSubtaskStatus(draggedSubtask), column.status)) {
                    props.onSubtaskStatusChange(draggedSubtaskId, column.status);
                  } else if (draggedSubtask && getSubtaskStatus(draggedSubtask) !== column.status) {
                    props.onInvalidMove(
                      `Subtasks must move step by step. Move from ${printStatus(getSubtaskStatus(draggedSubtask))} to the next stage first.`
                    );
                  }
                  setDraggedSubtaskId(null);
                }
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className={`text-sm font-semibold uppercase tracking-[0.2em] ${column.accent}`}>{column.label}</h3>
                <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-300">
                  {tasks.length + subtasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    currentUser={props.currentUser}
                    task={task}
                    assignableUsers={props.assignableUsers}
                    onAddSubtask={props.onAddSubtask}
                    onAssign={props.onAssign}
                    onDelete={props.onDelete}
                    onDragStart={setDraggedTaskId}
                    onGenerateSubtasks={props.onGenerateSubtasks}
                    onStatusChange={props.onStatusChange}
                  />
                ))}
                {subtasks.map(({ subtask, taskTitle, taskAssignee, storyPoints }) => (
                  <SubtaskCard
                    key={subtask.id}
                    currentUser={props.currentUser}
                    onDeleteSubtask={props.onDeleteSubtask}
                    onDragStart={setDraggedSubtaskId}
                    onStatusChange={props.onSubtaskStatusChange}
                    storyPoints={storyPoints}
                    subtask={subtask}
                    taskAssignee={taskAssignee}
                    taskTitle={taskTitle}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
