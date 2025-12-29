
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: number;
  subTasks: SubTask[];
}

export interface Column {
  id: TaskStatus;
  title: string;
}

export interface BoardState {
  tasks: Task[];
  columns: Column[];
}
