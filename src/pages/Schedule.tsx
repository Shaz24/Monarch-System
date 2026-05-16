import { motion } from 'framer-motion';
import { TaskRow } from '../components/TaskRow';

// Using the same task list defined in the seeder for the UI since DB is offline
const DEFAULT_TASKS = [
  { id: '1', time_slot: '04:30', title: 'Wake Up & Hydrate', description: 'Immediate rise, no snooze. 500ml water.', xp_reward: 20, difficulty: 'D', stat_category: 'discipline' },
  { id: '2', time_slot: '04:45', title: 'Morning Meditation', description: 'Clear the mind.', xp_reward: 30, difficulty: 'C', stat_category: 'stoicism' },
  { id: '3', time_slot: '05:00', title: 'Deep Work Session 1', description: 'Uninterrupted focus.', xp_reward: 100, difficulty: 'A', stat_category: 'focus' },
  { id: '4', time_slot: '07:00', title: 'Intense Workout', description: 'Strength or Cardio.', xp_reward: 80, difficulty: 'B', stat_category: 'strength' },
  { id: '5', time_slot: '08:30', title: 'Cold Shower', description: 'Mental resilience.', xp_reward: 50, difficulty: 'C', stat_category: 'endurance' },
  { id: '6', time_slot: '09:00', title: 'Deep Work Session 2', description: 'Core project work.', xp_reward: 100, difficulty: 'A', stat_category: 'focus' },
  { id: '7', time_slot: '12:00', title: 'Healthy Meal', description: 'High protein, low carb.', xp_reward: 20, difficulty: 'D', stat_category: 'discipline' },
  { id: '8', time_slot: '13:00', title: 'Learning / Reading', description: 'Expand knowledge.', xp_reward: 60, difficulty: 'B', stat_category: 'intelligence' },
  { id: '9', time_slot: '14:30', title: 'Creative Work', description: 'Content or problem solving.', xp_reward: 70, difficulty: 'B', stat_category: 'creativity' },
  { id: '10', time_slot: '16:00', title: 'Admin & Emails', description: 'Clear the backlog.', xp_reward: 10, difficulty: 'E', stat_category: 'consistency' },
  { id: '11', time_slot: '17:00', title: 'Networking / Social', description: 'Build relationships.', xp_reward: 40, difficulty: 'C', stat_category: 'charisma' },
  { id: '12', time_slot: '18:30', title: 'Evening Walk', description: 'Decompress.', xp_reward: 20, difficulty: 'D', stat_category: 'endurance' },
  { id: '13', time_slot: '19:30', title: 'Side Hustle / Finance', description: 'Wealth generation.', xp_reward: 90, difficulty: 'A', stat_category: 'wealth' },
  { id: '14', time_slot: '21:00', title: 'Journal & Plan', description: 'Review day, plan tomorrow.', xp_reward: 40, difficulty: 'C', stat_category: 'stoicism' },
  { id: '15', time_slot: '21:30', title: 'Sleep', description: 'Lights out.', xp_reward: 50, difficulty: 'C', stat_category: 'discipline' },
];

export default function Schedule() {
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
        {DEFAULT_TASKS.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </motion.div>
  );
}
