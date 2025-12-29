
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, SubTask } from '../types';
import { CheckCircle2, Circle, MoreVertical, Sparkles, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { generateSubtasks } from '../services/geminiService';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtasks: (taskId: string, subtasks: string[]) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onDelete, onToggleSubtask, onAddSubtasks }) => {
  const [isExpanding, setIsExpanding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleAiBreakdown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGenerating(true);
    try {
      const suggestions = await generateSubtasks(task.title);
      onAddSubtasks(task.id, suggestions);
      setIsExpanding(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const completedSubtasks = task.subTasks.filter(s => s.completed).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-[#21262d] border border-[#30363d] rounded-lg p-3 mb-3 cursor-default hover:border-[#58a6ff] transition-all shadow-sm ${task.status === 'done' ? 'border-l-4 border-l-green-500' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div {...attributes} {...listeners} className="flex-1 cursor-grab active:cursor-grabbing">
          <h4 className={`text-sm font-semibold text-[#c9d1d9] leading-tight ${task.status === 'done' ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </h4>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleAiBreakdown}
            disabled={isGenerating}
            className="p-1 hover:bg-[#30363d] rounded text-blue-400 disabled:opacity-50"
            title="AI Breakdown"
          >
            <Sparkles size={14} className={isGenerating ? 'animate-pulse' : ''} />
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="p-1 hover:bg-[#30363d] rounded text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {task.subTasks.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={10} />
              {completedSubtasks}/{task.subTasks.length} subtasks
            </span>
            <button 
              onClick={() => setIsExpanding(!isExpanding)}
              className="hover:text-white"
            >
              {isExpanding ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          
          <div className="w-full bg-[#30363d] h-1 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-full transition-all duration-300"
              style={{ width: `${(completedSubtasks / task.subTasks.length) * 100}%` }}
            />
          </div>

          {isExpanding && (
            <div className="mt-3 space-y-2">
              {task.subTasks.map((sub) => (
                <div 
                  key={sub.id} 
                  className="flex items-center gap-2 text-xs text-gray-300 group/sub"
                  onClick={() => onToggleSubtask(task.id, sub.id)}
                >
                  <button className="flex-shrink-0 transition-colors">
                    {sub.completed ? 
                      <CheckCircle2 size={14} className="text-green-500" /> : 
                      <Circle size={14} className="text-gray-500 hover:text-gray-300" />
                    }
                  </button>
                  <span className={`flex-1 ${sub.completed ? 'line-through text-gray-500' : ''}`}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
