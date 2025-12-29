
import React, { useState, useEffect, useCallback } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus, Layout, Sparkles, Wand2, Info } from 'lucide-react';
import { Column as ColumnType, Task, TaskStatus } from './types';
import Column from './components/Column';
import TaskCard from './components/TaskCard';
import { getBoardSummary } from './services/geminiService';

const COLUMNS: ColumnType[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Initialize with some data
  useEffect(() => {
    const saved = localStorage.getItem('zenboard_tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      setTasks([
        { id: '1', title: 'Launch ZenBoard AI', description: '', status: 'in-progress', createdAt: Date.now(), subTasks: [{ id: 's1', title: 'Connect Gemini API', completed: true }, { id: 's2', title: 'Test Drag and Drop', completed: false }] },
        { id: '2', title: 'Write documentation', description: '', status: 'todo', createdAt: Date.now(), subTasks: [] },
        { id: '3', title: 'Setup GitHub Repo', description: '', status: 'done', createdAt: Date.now(), subTasks: [] },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('zenboard_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle,
      description: '',
      status: 'todo',
      createdAt: Date.now(),
      subTasks: []
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subTasks: t.subTasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
        };
      }
      return t;
    }));
  };

  const addSubtasks = (taskId: string, newTitles: string[]) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const subs = newTitles.map(title => ({
          id: Math.random().toString(36).substr(2, 9),
          title,
          completed: false
        }));
        return { ...t, subTasks: [...t.subTasks, ...subs] };
      }
      return t;
    }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = tasks.some(t => t.id === activeId);
    const isOverTask = tasks.some(t => t.id === overId);
    const isOverColumn = COLUMNS.some(c => c.id === overId);

    if (isActiveTask && isOverTask) {
      const activeTask = tasks.find(t => t.id === activeId)!;
      const overTask = tasks.find(t => t.id === overId)!;

      if (activeTask.status !== overTask.status) {
        setTasks(prev => {
          const activeIndex = prev.findIndex(t => t.id === activeId);
          const overIndex = prev.findIndex(t => t.id === overId);
          
          prev[activeIndex].status = overTask.status;
          
          const newTasks = arrayMove(prev, activeIndex, overIndex);
          return [...newTasks];
        });
      }
    }

    if (isActiveTask && isOverColumn) {
      setTasks(prev => {
        const activeIndex = prev.findIndex(t => t.id === activeId);
        prev[activeIndex].status = overId as TaskStatus;
        
        // When moving to 'done', trigger confetti
        if (overId === 'done' && prev[activeIndex].status !== 'done') {
          // Triggered later in drag end for simplicity
        }

        return [...prev];
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeIndex = tasks.findIndex(t => t.id === active.id);
      const overIndex = tasks.findIndex(t => t.id === over.id);

      if (overIndex !== -1) {
        setTasks(prev => arrayMove(prev, activeIndex, overIndex));
      }

      // Check for 'done' status completion celebration
      const task = tasks[activeIndex];
      if (task && task.status === 'done') {
        // @ts-ignore
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#238636', '#58a6ff', '#ffffff']
        });
      }
    }
    setActiveTask(null);
  };

  const handleGetSummary = async () => {
    setIsSummarizing(true);
    try {
      const res = await getBoardSummary(tasks);
      setAiSummary(res);
    } catch (error) {
      setAiSummary("Could not generate summary at this time.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#161b22] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#58a6ff] rounded-lg flex items-center justify-center">
            <Layout size={20} className="text-[#0d1117]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ZenBoard <span className="text-[#58a6ff]">AI</span></h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Add quick task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              className="bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:border-[#58a6ff] transition-all"
            />
            <button 
              onClick={addTask}
              className="absolute right-1 top-1 p-1 bg-[#238636] hover:bg-[#2ea043] rounded text-white transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          <button 
            onClick={handleGetSummary}
            disabled={isSummarizing}
            className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] px-4 py-1.5 rounded-md text-sm border border-[#30363d] transition-all disabled:opacity-50"
          >
            <Sparkles size={16} className={isSummarizing ? "animate-spin" : "text-yellow-400"} />
            AI Summary
          </button>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="flex-1 overflow-x-auto p-6 flex gap-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map(col => (
            <Column 
              key={col.id} 
              column={col} 
              tasks={tasks.filter(t => t.status === col.id)}
              onDeleteTask={deleteTask}
              onToggleSubtask={toggleSubtask}
              onAddSubtasks={addSubtasks}
            />
          ))}

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}>
            {activeTask ? (
              <TaskCard 
                task={activeTask} 
                onDelete={() => {}} 
                onToggleSubtask={() => {}}
                onAddSubtasks={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Footer Info / AI Feedback */}
      {aiSummary && (
        <div className="mx-6 mb-6 p-4 bg-[#161b22] border border-[#58a6ff]/30 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="p-2 bg-[#58a6ff]/10 rounded-full text-[#58a6ff]">
            <Wand2 size={20} />
          </div>
          <div className="flex-1">
            <h5 className="text-xs font-bold text-[#58a6ff] uppercase tracking-wider mb-1">AI Assistant Insights</h5>
            <p className="text-sm text-gray-300 leading-relaxed italic">"{aiSummary}"</p>
          </div>
          <button onClick={() => setAiSummary('')} className="text-gray-500 hover:text-white">&times;</button>
        </div>
      )}

      <footer className="px-6 py-3 border-t border-[#30363d] text-[10px] text-gray-500 flex justify-between items-center bg-[#161b22]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Info size={12} /> Data stored locally</span>
          <span>&bull;</span>
          <span>Drag tasks to reorder or change status</span>
        </div>
        <div>
          Powered by Gemini 3 Flash
        </div>
      </footer>
    </div>
  );
};

export default App;
