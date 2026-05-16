import { motion } from 'framer-motion';
import { TaskRow } from '../components/TaskRow';
import { useTasks } from '../hooks/useTasks';
import { Loader2 } from 'lucide-react';

export default function Schedule() {
  const { tasks, loading, completeTask } = useTasks();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-12 max-w-[1000px] mx-auto w-full space-y-8"
    >
      <div className="mb-8">
        <h1 className="font-orbitron text-4xl font-bold uppercase tracking-widest text-white mb-2">
          Daily <span className="text-accent-blue">Directives</span>
        </h1>
        <p className="font-space-mono text-sm text-white/50 tracking-widest uppercase">
          Failure to complete directives reduces aura. Proceed with discipline.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-white/30 font-space-mono text-sm uppercase tracking-widest border border-dashed border-white/10">
            No directives established.
          </div>
        ) : (
          tasks.map((task) => (
            <TaskRow 
              key={task.id} 
              task={task} 
              onComplete={() => completeTask(task.id, task.xp_reward)} 
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
