
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column as ColumnType, Task } from '../types';
import TaskCard from './TaskCard';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtasks: (taskId: string, subtasks: string[]) => void;
}

const Column: React.FC<ColumnProps> = ({ column, tasks, onDeleteTask, onToggleSubtask, onAddSubtasks }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-1 flex flex-col min-w-[280px] max-w-[350px] bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden h-full">
      <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
        <h3 className="font-bold text-[#c9d1d9] flex items-center gap-2">
          {column.title}
          <span className="bg-[#30363d] text-xs px-2 py-0.5 rounded-full text-gray-400 font-normal">
            {tasks.length}
          </span>
        </h3>
      </div>

      <div 
        ref={setNodeRef}
        className="flex-1 p-3 overflow-y-auto custom-scrollbar"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onDelete={onDeleteTask}
              onToggleSubtask={onToggleSubtask}
              onAddSubtasks={onAddSubtasks}
            />
          ))}
          {tasks.length === 0 && (
            <div className="h-20 border-2 border-dashed border-[#30363d] rounded-lg flex items-center justify-center text-xs text-gray-600">
              Drag tasks here
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export default Column;
