import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Dumbbell, Timer, Flame, Plus, Scale,
  Moon, Target, TrendingUp, ChevronDown, ChevronUp, Zap, AlertTriangle, Trophy, Search,
  Calculator
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, YAxis } from 'recharts';
import { useUIStore } from '../store/uiStore';
import { StatRing } from '../components/StatRing';
import toast from 'react-hot-toast';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useProfile } from '../hooks/useProfile';
import { SecondBodyProtocol } from '../components/enhanced/SecondBodyProtocol';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { auraOnWorkout } from '../lib/auraService';
import { getSecondBodyStage } from '../lib/rpgEnhanced';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonRow } from '../components/ui/Skeleton';
import { sounds } from '../lib/sound';

const WORKOUT_TYPES = [
  { label: 'Weightlifting', icon: '🏋️', stats: ['strength'], baseXpRate: 2.5 },
  { label: 'Calisthenics',  icon: '💪', stats: ['strength', 'endurance'], baseXpRate: 2.2 },
  { label: 'Cardio',        icon: '🏃', stats: ['endurance'], baseXpRate: 2.0 },
  { label: 'Martial Arts',  icon: '🥊', stats: ['strength', 'endurance'], baseXpRate: 3.0 },
  { label: 'Yoga / Stretch',icon: '🧘', stats: ['endurance'], baseXpRate: 1.5 },
  { label: 'HIIT',          icon: '⚡', stats: ['strength', 'endurance'], baseXpRate: 2.8 },
];

export interface Exercise {
  name: string;
  category: string;
  baseDifficulty: 'S' | 'A' | 'B' | 'C' | 'D';
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  type: 'weighted' | 'bodyweight' | 'cardio' | 'duration';
}

const EXERCISE_LIBRARY: Exercise[] = [
  // ── COMPOUND / POWER ─────────────────────────────────────────────────────
  { name: 'Deadlift',               category: 'Compound', baseDifficulty: 'S', primaryMuscles: ['Hamstrings', 'Glutes', 'Lower Back'], secondaryMuscles: ['Traps', 'Forearms', 'Core'],        equipment: 'Barbell', type: 'weighted' },
  { name: 'Barbell Squat',          category: 'Compound', baseDifficulty: 'S', primaryMuscles: ['Quads', 'Glutes'],                    secondaryMuscles: ['Hamstrings', 'Core', 'Adductors'],  equipment: 'Barbell', type: 'weighted' },
  { name: 'Bench Press',            category: 'Compound', baseDifficulty: 'A', primaryMuscles: ['Chest'],                              secondaryMuscles: ['Front Delts', 'Triceps'],           equipment: 'Barbell', type: 'weighted' },
  { name: 'Overhead Press',         category: 'Compound', baseDifficulty: 'A', primaryMuscles: ['Front Delts', 'Shoulders'],           secondaryMuscles: ['Triceps', 'Upper Traps', 'Core'],   equipment: 'Barbell', type: 'weighted' },
  { name: 'Power Clean',            category: 'Compound', baseDifficulty: 'S', primaryMuscles: ['Full Body'],                          secondaryMuscles: ['Hamstrings', 'Glutes', 'Traps'],    equipment: 'Barbell', type: 'weighted' },
  { name: 'Snatch',                 category: 'Compound', baseDifficulty: 'S', primaryMuscles: ['Full Body'],                          secondaryMuscles: ['Shoulders', 'Core', 'Glutes'],      equipment: 'Barbell', type: 'weighted' },
  { name: 'Front Squat',            category: 'Compound', baseDifficulty: 'A', primaryMuscles: ['Quads', 'Core'],                      secondaryMuscles: ['Glutes', 'Upper Back'],              equipment: 'Barbell', type: 'weighted' },
  { name: 'Sumo Deadlift',          category: 'Compound', baseDifficulty: 'S', primaryMuscles: ['Glutes', 'Inner Thighs'],             secondaryMuscles: ['Hamstrings', 'Lower Back'],         equipment: 'Barbell', type: 'weighted' },
  { name: 'Rack Pull',              category: 'Compound', baseDifficulty: 'A', primaryMuscles: ['Traps', 'Lower Back'],                secondaryMuscles: ['Glutes', 'Hamstrings'],              equipment: 'Barbell', type: 'weighted' },
  { name: 'Barbell Row',            category: 'Compound', baseDifficulty: 'A', primaryMuscles: ['Lats', 'Mid Back'],                  secondaryMuscles: ['Biceps', 'Rear Delts'],              equipment: 'Barbell', type: 'weighted' },

  // ── CHEST ─────────────────────────────────────────────────────────────────
  { name: 'Incline Bench Press',    category: 'Chest',    baseDifficulty: 'A', primaryMuscles: ['Upper Chest'],                        secondaryMuscles: ['Front Delts', 'Triceps'],           equipment: 'Barbell', type: 'weighted' },
  { name: 'Decline Bench Press',    category: 'Chest',    baseDifficulty: 'B', primaryMuscles: ['Lower Chest'],                        secondaryMuscles: ['Triceps'],                          equipment: 'Barbell', type: 'weighted' },
  { name: 'Dumbbell Bench Press',   category: 'Chest',    baseDifficulty: 'B', primaryMuscles: ['Chest'],                              secondaryMuscles: ['Front Delts', 'Triceps'],           equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Incline DB Press',       category: 'Chest',    baseDifficulty: 'B', primaryMuscles: ['Upper Chest'],                        secondaryMuscles: ['Front Delts'],                      equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Dumbbell Fly',           category: 'Chest',    baseDifficulty: 'C', primaryMuscles: ['Chest'],                              secondaryMuscles: ['Front Delts'],                      equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Cable Fly',              category: 'Chest',    baseDifficulty: 'C', primaryMuscles: ['Chest'],                              secondaryMuscles: ['Front Delts'],                      equipment: 'Cable', type: 'weighted' },
  { name: 'Pec Deck',               category: 'Chest',    baseDifficulty: 'D', primaryMuscles: ['Chest'],                              secondaryMuscles: [],                                   equipment: 'Machine', type: 'weighted' },
  { name: 'Push-up',                category: 'Chest',    baseDifficulty: 'D', primaryMuscles: ['Chest'],                              secondaryMuscles: ['Triceps', 'Front Delts'],           equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Archer Push-up',         category: 'Chest',    baseDifficulty: 'B', primaryMuscles: ['Chest', 'Triceps'],                  secondaryMuscles: ['Core'],                             equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Chest Press Machine',    category: 'Chest',    baseDifficulty: 'D', primaryMuscles: ['Chest'],                              secondaryMuscles: ['Triceps'],                          equipment: 'Machine', type: 'weighted' },

  // ── BACK ──────────────────────────────────────────────────────────────────
  { name: 'Lat Pulldown',           category: 'Back',     baseDifficulty: 'C', primaryMuscles: ['Lats'],                               secondaryMuscles: ['Biceps', 'Rear Delts'],             equipment: 'Cable', type: 'weighted' },
  { name: 'Seated Cable Row',       category: 'Back',     baseDifficulty: 'C', primaryMuscles: ['Mid Back', 'Lats'],                  secondaryMuscles: ['Biceps'],                           equipment: 'Cable', type: 'weighted' },
  { name: 'Weighted Pull-up',       category: 'Back',     baseDifficulty: 'A', primaryMuscles: ['Lats'],                               secondaryMuscles: ['Biceps', 'Core'],                   equipment: 'Bodyweight', type: 'weighted' },
  { name: 'T-Bar Row',              category: 'Back',     baseDifficulty: 'B', primaryMuscles: ['Mid Back', 'Lats'],                  secondaryMuscles: ['Rear Delts', 'Biceps'],             equipment: 'Barbell', type: 'weighted' },
  { name: 'Dumbbell Row',           category: 'Back',     baseDifficulty: 'C', primaryMuscles: ['Lats', 'Mid Back'],                  secondaryMuscles: ['Biceps'],                           equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Face Pull',              category: 'Back',     baseDifficulty: 'C', primaryMuscles: ['Rear Delts', 'Traps'],               secondaryMuscles: ['External Rotators'],                equipment: 'Cable', type: 'weighted' },
  { name: 'Straight-Arm Pulldown',  category: 'Back',     baseDifficulty: 'C', primaryMuscles: ['Lats'],                               secondaryMuscles: ['Triceps'],                          equipment: 'Cable', type: 'weighted' },
  { name: 'Meadows Row',            category: 'Back',     baseDifficulty: 'B', primaryMuscles: ['Lats', 'Mid Back'],                  secondaryMuscles: ['Rear Delts'],                       equipment: 'Barbell', type: 'weighted' },
  { name: 'Chest-Supported Row',    category: 'Back',     baseDifficulty: 'C', primaryMuscles: ['Mid Back'],                           secondaryMuscles: ['Rear Delts', 'Biceps'],             equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Inverted Row',           category: 'Back',     baseDifficulty: 'C', primaryMuscles: ['Mid Back', 'Lats'],                  secondaryMuscles: ['Biceps', 'Core'],                   equipment: 'Bodyweight', type: 'bodyweight' },

  // ── LEGS ──────────────────────────────────────────────────────────────────
  { name: 'Leg Press',              category: 'Legs',     baseDifficulty: 'C', primaryMuscles: ['Quads', 'Glutes'],                    secondaryMuscles: ['Hamstrings'],                       equipment: 'Machine', type: 'weighted' },
  { name: 'Romanian Deadlift',      category: 'Legs',     baseDifficulty: 'A', primaryMuscles: ['Hamstrings', 'Glutes'],               secondaryMuscles: ['Lower Back', 'Calves'],             equipment: 'Barbell', type: 'weighted' },
  { name: 'Hack Squat',             category: 'Legs',     baseDifficulty: 'B', primaryMuscles: ['Quads'],                              secondaryMuscles: ['Glutes', 'Hamstrings'],             equipment: 'Machine', type: 'weighted' },
  { name: 'Bulgarian Split Squat',  category: 'Legs',     baseDifficulty: 'A', primaryMuscles: ['Quads', 'Glutes'],                    secondaryMuscles: ['Hamstrings', 'Core'],               equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Leg Curl',               category: 'Legs',     baseDifficulty: 'D', primaryMuscles: ['Hamstrings'],                         secondaryMuscles: ['Calves'],                           equipment: 'Machine', type: 'weighted' },
  { name: 'Leg Extension',          category: 'Legs',     baseDifficulty: 'D', primaryMuscles: ['Quads'],                              secondaryMuscles: [],                                   equipment: 'Machine', type: 'weighted' },
  { name: 'Walking Lunge',          category: 'Legs',     baseDifficulty: 'C', primaryMuscles: ['Quads', 'Glutes'],                    secondaryMuscles: ['Hamstrings', 'Calves'],             equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Goblet Squat',           category: 'Legs',     baseDifficulty: 'C', primaryMuscles: ['Quads', 'Glutes'],                    secondaryMuscles: ['Core'],                             equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Calf Raise',             category: 'Legs',     baseDifficulty: 'D', primaryMuscles: ['Calves'],                             secondaryMuscles: [],                                   equipment: 'Machine', type: 'weighted' },
  { name: 'Hip Thrust',             category: 'Legs',     baseDifficulty: 'B', primaryMuscles: ['Glutes'],                             secondaryMuscles: ['Hamstrings', 'Core'],               equipment: 'Barbell', type: 'weighted' },
  { name: 'Box Squat',              category: 'Legs',     baseDifficulty: 'A', primaryMuscles: ['Glutes', 'Quads'],                    secondaryMuscles: ['Hamstrings'],                       equipment: 'Barbell', type: 'weighted' },
  { name: 'Sissy Squat',            category: 'Legs',     baseDifficulty: 'B', primaryMuscles: ['Quads'],                              secondaryMuscles: ['Core'],                             equipment: 'Bodyweight', type: 'bodyweight' },

  // ── SHOULDERS ─────────────────────────────────────────────────────────────
  { name: 'Lateral Raise',          category: 'Shoulders', baseDifficulty: 'C', primaryMuscles: ['Side Delts'],                        secondaryMuscles: ['Traps'],                            equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Front Raise',            category: 'Shoulders', baseDifficulty: 'C', primaryMuscles: ['Front Delts'],                       secondaryMuscles: ['Upper Chest'],                      equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Rear Delt Fly',          category: 'Shoulders', baseDifficulty: 'C', primaryMuscles: ['Rear Delts'],                        secondaryMuscles: ['Traps', 'Rhomboids'],               equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Arnold Press',           category: 'Shoulders', baseDifficulty: 'B', primaryMuscles: ['All Three Delts'],                   secondaryMuscles: ['Triceps'],                          equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Dumbbell Shoulder Press',category: 'Shoulders', baseDifficulty: 'B', primaryMuscles: ['Front Delts', 'Side Delts'],         secondaryMuscles: ['Triceps'],                          equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Barbell Shrug',          category: 'Shoulders', baseDifficulty: 'C', primaryMuscles: ['Traps'],                             secondaryMuscles: ['Forearms'],                         equipment: 'Barbell', type: 'weighted' },
  { name: 'Cable Lateral Raise',    category: 'Shoulders', baseDifficulty: 'C', primaryMuscles: ['Side Delts'],                        secondaryMuscles: [],                                   equipment: 'Cable', type: 'weighted' },
  { name: 'Upright Row',            category: 'Shoulders', baseDifficulty: 'C', primaryMuscles: ['Side Delts', 'Traps'],               secondaryMuscles: ['Biceps'],                           equipment: 'Barbell', type: 'weighted' },

  // ── ARMS ──────────────────────────────────────────────────────────────────
  { name: 'Bicep Curl',             category: 'Arms',     baseDifficulty: 'C', primaryMuscles: ['Biceps'],                             secondaryMuscles: ['Forearms'],                         equipment: 'Barbell', type: 'weighted' },
  { name: 'Hammer Curl',            category: 'Arms',     baseDifficulty: 'C', primaryMuscles: ['Brachialis', 'Biceps'],               secondaryMuscles: ['Forearms'],                         equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Incline Dumbbell Curl',  category: 'Arms',     baseDifficulty: 'C', primaryMuscles: ['Long Head Biceps'],                   secondaryMuscles: [],                                   equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Concentration Curl',     category: 'Arms',     baseDifficulty: 'C', primaryMuscles: ['Biceps Peak'],                        secondaryMuscles: [],                                   equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Preacher Curl',          category: 'Arms',     baseDifficulty: 'C', primaryMuscles: ['Biceps'],                             secondaryMuscles: ['Forearms'],                         equipment: 'Barbell', type: 'weighted' },
  { name: 'Cable Curl',             category: 'Arms',     baseDifficulty: 'D', primaryMuscles: ['Biceps'],                             secondaryMuscles: [],                                   equipment: 'Cable', type: 'weighted' },
  { name: 'Tricep Pushdown',        category: 'Arms',     baseDifficulty: 'C', primaryMuscles: ['Triceps'],                            secondaryMuscles: [],                                   equipment: 'Cable', type: 'weighted' },
  { name: 'Skull Crusher',          category: 'Arms',     baseDifficulty: 'B', primaryMuscles: ['Triceps'],                            secondaryMuscles: [],                                   equipment: 'Barbell', type: 'weighted' },
  { name: 'Dips',                   category: 'Arms',     baseDifficulty: 'B', primaryMuscles: ['Triceps', 'Lower Chest'],             secondaryMuscles: ['Front Delts'],                      equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Overhead Tricep Ext.',   category: 'Arms',     baseDifficulty: 'C', primaryMuscles: ['Long Head Triceps'],                  secondaryMuscles: [],                                   equipment: 'Dumbbell', type: 'weighted' },
  { name: 'Close-Grip Bench',       category: 'Arms',     baseDifficulty: 'B', primaryMuscles: ['Triceps'],                            secondaryMuscles: ['Chest'],                            equipment: 'Barbell', type: 'weighted' },
  { name: 'Diamond Push-up',        category: 'Arms',     baseDifficulty: 'C', primaryMuscles: ['Triceps'],                            secondaryMuscles: ['Chest'],                            equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Wrist Curl',             category: 'Arms',     baseDifficulty: 'D', primaryMuscles: ['Forearms'],                           secondaryMuscles: [],                                   equipment: 'Dumbbell', type: 'weighted' },

  // ── CORE ──────────────────────────────────────────────────────────────────
  { name: 'Plank',                  category: 'Core',     baseDifficulty: 'D', primaryMuscles: ['Core', 'Transverse Abdominis'],       secondaryMuscles: ['Shoulders', 'Glutes'],              equipment: 'Bodyweight', type: 'duration' },
  { name: 'Ab Wheel Rollout',       category: 'Core',     baseDifficulty: 'A', primaryMuscles: ['Core', 'Lats'],                       secondaryMuscles: ['Shoulders', 'Hip Flexors'],         equipment: 'Ab Wheel', type: 'bodyweight' },
  { name: 'Cable Crunch',           category: 'Core',     baseDifficulty: 'C', primaryMuscles: ['Abs'],                                secondaryMuscles: [],                                   equipment: 'Cable', type: 'weighted' },
  { name: 'Hanging Leg Raise',      category: 'Core',     baseDifficulty: 'B', primaryMuscles: ['Lower Abs', 'Hip Flexors'],           secondaryMuscles: ['Core'],                             equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Decline Sit-up',         category: 'Core',     baseDifficulty: 'C', primaryMuscles: ['Abs'],                                secondaryMuscles: ['Hip Flexors'],                      equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Russian Twist',          category: 'Core',     baseDifficulty: 'C', primaryMuscles: ['Obliques'],                           secondaryMuscles: ['Abs'],                              equipment: 'Dumbbell', type: 'weighted' },
  { name: 'L-Sit',                  category: 'Core',     baseDifficulty: 'A', primaryMuscles: ['Hip Flexors', 'Core'],                secondaryMuscles: ['Triceps', 'Lats'],                  equipment: 'Bodyweight', type: 'duration' },
  { name: 'Dragon Flag',            category: 'Core',     baseDifficulty: 'S', primaryMuscles: ['Full Core'],                          secondaryMuscles: ['Lats', 'Glutes'],                   equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Pallof Press',           category: 'Core',     baseDifficulty: 'C', primaryMuscles: ['Core', 'Obliques'],                   secondaryMuscles: ['Shoulders'],                        equipment: 'Cable', type: 'weighted' },
  { name: 'Hollow Body Hold',       category: 'Core',     baseDifficulty: 'B', primaryMuscles: ['Core', 'Hip Flexors'],                secondaryMuscles: [],                                   equipment: 'Bodyweight', type: 'duration' },

  // ── CALISTHENICS ──────────────────────────────────────────────────────────
  { name: 'Pull-up',                category: 'Calisthenics', baseDifficulty: 'B', primaryMuscles: ['Lats'],                           secondaryMuscles: ['Biceps', 'Core'],                   equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Chin-up',                category: 'Calisthenics', baseDifficulty: 'B', primaryMuscles: ['Lats', 'Biceps'],                secondaryMuscles: ['Core'],                             equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Muscle-Up',              category: 'Calisthenics', baseDifficulty: 'S', primaryMuscles: ['Lats', 'Chest', 'Triceps'],      secondaryMuscles: ['Core', 'Shoulders'],                equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Pistol Squat',           category: 'Calisthenics', baseDifficulty: 'A', primaryMuscles: ['Quads', 'Glutes'],               secondaryMuscles: ['Core', 'Hamstrings'],               equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Handstand Push-up',      category: 'Calisthenics', baseDifficulty: 'S', primaryMuscles: ['Shoulders', 'Triceps'],          secondaryMuscles: ['Core'],                             equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Front Lever',            category: 'Calisthenics', baseDifficulty: 'S', primaryMuscles: ['Lats', 'Core'],                  secondaryMuscles: ['Biceps', 'Chest'],                  equipment: 'Bodyweight', type: 'duration' },
  { name: 'Back Lever',             category: 'Calisthenics', baseDifficulty: 'S', primaryMuscles: ['Shoulders', 'Back'],             secondaryMuscles: ['Core', 'Biceps'],                   equipment: 'Bodyweight', type: 'duration' },
  { name: 'Burpee',                 category: 'Calisthenics', baseDifficulty: 'C', primaryMuscles: ['Full Body'],                     secondaryMuscles: [],                                   equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Jump Squat',             category: 'Calisthenics', baseDifficulty: 'C', primaryMuscles: ['Quads', 'Glutes'],               secondaryMuscles: ['Calves', 'Core'],                   equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Pike Push-up',           category: 'Calisthenics', baseDifficulty: 'C', primaryMuscles: ['Shoulders'],                     secondaryMuscles: ['Triceps', 'Core'],                  equipment: 'Bodyweight', type: 'bodyweight' },
  { name: 'Skin the Cat',           category: 'Calisthenics', baseDifficulty: 'A', primaryMuscles: ['Shoulders', 'Back'],             secondaryMuscles: ['Core'],                             equipment: 'Bodyweight', type: 'bodyweight' },

  // ── CARDIO ────────────────────────────────────────────────────────────────
  { name: 'Treadmill Run',          category: 'Cardio',   baseDifficulty: 'D', primaryMuscles: ['Cardiovascular'],                     secondaryMuscles: ['Legs'],                             equipment: 'Machine', type: 'cardio' },
  { name: 'Rowing Machine',         category: 'Cardio',   baseDifficulty: 'C', primaryMuscles: ['Full Body'],                          secondaryMuscles: ['Back', 'Legs'],                     equipment: 'Machine', type: 'cardio' },
  { name: 'Jump Rope',              category: 'Cardio',   baseDifficulty: 'C', primaryMuscles: ['Cardiovascular'],                     secondaryMuscles: ['Calves', 'Shoulders'],              equipment: 'Jump Rope', type: 'cardio' },
  { name: 'Stationary Bike',        category: 'Cardio',   baseDifficulty: 'D', primaryMuscles: ['Cardiovascular', 'Quads'],            secondaryMuscles: ['Glutes', 'Hamstrings'],             equipment: 'Machine', type: 'cardio' },
  { name: 'Stairmaster',            category: 'Cardio',   baseDifficulty: 'C', primaryMuscles: ['Cardiovascular', 'Glutes'],           secondaryMuscles: ['Quads', 'Calves'],                  equipment: 'Machine', type: 'cardio' },
  { name: 'Battle Ropes',           category: 'Cardio',   baseDifficulty: 'B', primaryMuscles: ['Cardiovascular', 'Shoulders'],        secondaryMuscles: ['Core', 'Arms'],                     equipment: 'Battle Ropes', type: 'cardio' },
  { name: 'Swimming',               category: 'Cardio',   baseDifficulty: 'B', primaryMuscles: ['Full Body'],                          secondaryMuscles: ['Core', 'Shoulders'],                equipment: 'None', type: 'cardio' },
  { name: 'Sprint Intervals',       category: 'Cardio',   baseDifficulty: 'A', primaryMuscles: ['Cardiovascular', 'Legs'],             secondaryMuscles: ['Core'],                             equipment: 'None', type: 'cardio' },

  // ── MARTIAL ARTS ──────────────────────────────────────────────────────────
  { name: 'Shadow Boxing',          category: 'Martial Arts', baseDifficulty: 'C', primaryMuscles: ['Shoulders', 'Core'],             secondaryMuscles: ['Legs', 'Cardiovascular'],           equipment: 'None', type: 'cardio' },
  { name: 'Heavy Bag Work',         category: 'Martial Arts', baseDifficulty: 'B', primaryMuscles: ['Shoulders', 'Core'],             secondaryMuscles: ['Legs', 'Arms'],                     equipment: 'Heavy Bag', type: 'cardio' },
  { name: 'Pad Work',               category: 'Martial Arts', baseDifficulty: 'B', primaryMuscles: ['Shoulders', 'Core'],             secondaryMuscles: ['Legs', 'Cardiovascular'],           equipment: 'Pads', type: 'cardio' },
  { name: 'Sparring',               category: 'Martial Arts', baseDifficulty: 'A', primaryMuscles: ['Full Body'],                     secondaryMuscles: [],                                   equipment: 'Gloves', type: 'cardio' },
  { name: 'Kata Drills',            category: 'Martial Arts', baseDifficulty: 'C', primaryMuscles: ['Core', 'Legs'],                  secondaryMuscles: ['Shoulders'],                        equipment: 'None', type: 'bodyweight' },

  // ── MOBILITY / STRETCHING ─────────────────────────────────────────────────
  { name: 'Hip Flexor Stretch',     category: 'Mobility', baseDifficulty: 'D', primaryMuscles: ['Hip Flexors'],                        secondaryMuscles: ['Quads'],                            equipment: 'None', type: 'duration' },
  { name: 'Thoracic Rotation',      category: 'Mobility', baseDifficulty: 'D', primaryMuscles: ['Thoracic Spine'],                     secondaryMuscles: ['Lats'],                             equipment: 'None', type: 'duration' },
  { name: 'Pigeon Pose',            category: 'Mobility', baseDifficulty: 'D', primaryMuscles: ['Glutes', 'Hip Rotators'],             secondaryMuscles: [],                                   equipment: 'None', type: 'duration' },
  { name: 'Cossack Squat',          category: 'Mobility', baseDifficulty: 'C', primaryMuscles: ['Adductors', 'Hips'],                  secondaryMuscles: ['Quads', 'Ankles'],                  equipment: 'Bodyweight', type: 'bodyweight' },
  { name: "World's Greatest Stretch", category: 'Mobility', baseDifficulty: 'D', primaryMuscles: ['Full Body Mobility'],               secondaryMuscles: [],                                   equipment: 'None', type: 'duration' },
];

const EXERCISE_CATEGORIES = ['All', 'Compound', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Calisthenics', 'Cardio', 'Martial Arts', 'Mobility'];

const INTENSITY_MULTI: Record<string, number> = { Low: 0.7, Medium: 1.0, High: 1.5 };
const INTENSITY_COLOR: Record<string, string> = {
  Low: '#334155', Medium: '#00D4FF', High: '#ff5a00',
};

const TYPE_ICON: Record<string, string> = Object.fromEntries(
  WORKOUT_TYPES.map(w => [w.label, w.icon])
);

const TODAY = new Date().toISOString().split('T')[0];

export default function Fitness() {
  const { addXpParticle } = useUIStore();
  const { user } = useAuthStore();
  const { logs, addLog, loading: logsLoading } = useActivityLogs('fitness');
  const { stats, profile } = useProfile();
  const currentLevel = profile?.current_level ?? 1;

  // Workout form
  const [wType, setWType] = useState('Weightlifting');
  const [duration, setDuration] = useState('45');
  const [intensity, setIntensity] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [logging, setLogging] = useState(false);

  // Exercise builder form
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEx, setSelectedEx] = useState(EXERCISE_LIBRARY[0]);
  const [weightInput, setWeightInput] = useState('60');
  const [repsInput, setRepsInput] = useState('10');
  const [activeCategory, setActiveCategory] = useState('All');

  // Session sets log (for this browser session)
  interface SessionSet {
    id: string;
    exerciseName: string;
    weight: number;
    reps: number;
    xp: number;
  }
  const [sessionSets, setSessionSets] = useState<SessionSet[]>([]);

  // Last used weight per exercise (persisted to localStorage)
  const [lastUsedWeights, setLastUsedWeights] = useState<Record<string, string>>(() => {
    const userId = 'guest'; // will be overwritten in useEffect
    try {
      const saved = localStorage.getItem(`monarch_last_weights_${userId}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Load last used weights for the logged-in user
  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(`monarch_last_weights_${user.id}`);
      if (saved) setLastUsedWeights(JSON.parse(saved));
    } catch { /* noop */ }
  }, [user]);

  // Auto-fill weight when exercise changes
  useEffect(() => {
    const key = selectedEx.name.toLowerCase();
    const saved = lastUsedWeights[key];
    if (saved) setWeightInput(saved);
  }, [selectedEx]);

  // Body metrics form
  const [showMetrics, setShowMetrics] = useState(false);
  const [weight, setWeight] = useState('');
  const [protein, setProtein] = useState('');
  const [calories, setCalories] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [sleepHrs, setSleepHrs] = useState('');
  const [savingMetrics, setSavingMetrics] = useState(false);

  // ── WORKOUT TIMER ──────────────────────────────────────────────────────────
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDuration, setTimerDuration] = useState(45 * 60); // 45min default

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev >= timerDuration) { setTimerRunning(false); sounds.playFanfare(); toast.success('Workout complete!', { icon: '🏋️' }); return prev; }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerDuration]);

  const timerPercent = Math.min(100, (timerSeconds / timerDuration) * 100);
  const timerDisplay = (() => {
    const remaining = timerDuration - timerSeconds;
    const m = Math.floor(remaining / 60); const s = remaining % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  })();

  // ── REST TIMER ─────────────────────────────────────────────────────────────
  const [restSeconds, setRestSeconds] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [restPreset, setRestPreset] = useState(60);
  const REST_PRESETS = [60, 90, 120, 180];

  useEffect(() => {
    if (!restRunning) return;
    const interval = setInterval(() => {
      setRestSeconds(prev => {
        if (prev <= 0) { setRestRunning(false); sounds.playChime(); toast('Rest complete! Start next set.', { icon: '⚡' }); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restRunning]);

  const startRest = (secs: number) => { setRestSeconds(secs); setRestRunning(true); };
  const restDisplay = (() => { const m = Math.floor(restSeconds / 60); const s = restSeconds % 60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; })();

  // ── MACRO INTAKE & GOALS ───────────────────────────────────────────────────
  const [macroProtein, setMacroProtein] = useState(protein || '0');
  const [macroCarbs, setMacroCarbs] = useState('0');
  const [macroFat, setMacroFat] = useState('0');
  
  const [macroGoals, setMacroGoals] = useState(() => {
    const userId = user?.id || 'guest';
    const saved = localStorage.getItem(`monarch_macro_goals_${userId}`);
    return saved ? JSON.parse(saved) : { protein: 180, carbs: 250, fat: 70 };
  });

  const [showMacroCalc, setShowMacroCalc] = useState(false);
  const [calcWeight, setCalcWeight] = useState('80');
  const [calcGoal, setCalcGoal] = useState('Maintain');
  const [calcActivity, setCalcActivity] = useState('1.55');

  // Update calculator weight input when primary weight metric updates
  useEffect(() => {
    if (weight) setCalcWeight(weight);
  }, [weight]);

  // Persist macro goals on change / user swap
  useEffect(() => {
    const userId = user?.id || 'guest';
    const saved = localStorage.getItem(`monarch_macro_goals_${userId}`);
    if (saved) {
      try {
        setMacroGoals(JSON.parse(saved));
      } catch (e) {}
    }
  }, [user]);

  // Load today's intake from localStorage
  useEffect(() => {
    const userId = user?.id || 'guest';
    const saved = localStorage.getItem(`monarch_macro_intake_${userId}_${TODAY}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMacroProtein(parsed.protein || '0');
        setMacroCarbs(parsed.carbs || '0');
        setMacroFat(parsed.fat || '0');
      } catch (e) {}
    } else {
      setMacroProtein('0');
      setMacroCarbs('0');
      setMacroFat('0');
    }
  }, [user]);

  const saveMacroIntake = (p: string, c: string, f: string) => {
    const userId = user?.id || 'guest';
    localStorage.setItem(`monarch_macro_intake_${userId}_${TODAY}`, JSON.stringify({
      protein: p,
      carbs: c,
      fat: f
    }));
  };

  const handleCalculateMacros = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(calcWeight) || 75;
    const activityMult = parseFloat(calcActivity);
    const baseTdee = w * 22 * activityMult;
    
    let targetCalories = baseTdee;
    if (calcGoal === 'Cut') targetCalories -= 500;
    else if (calcGoal === 'Bulk') targetCalories += 400;
    else if (calcGoal === 'Recomp') targetCalories -= 200;
    
    const proteinG = Math.round(w * 2.0);
    const fatG = Math.round(w * 0.85);
    const proteinKcal = proteinG * 4;
    const fatKcal = fatG * 9;
    const carbsKcal = Math.max(100, targetCalories - (proteinKcal + fatKcal));
    const carbsG = Math.round(carbsKcal / 4);
    
    const newGoals = { protein: proteinG, carbs: carbsG, fat: fatG };
    
    setMacroGoals(newGoals);
    const userId = user?.id || 'guest';
    localStorage.setItem(`monarch_macro_goals_${userId}`, JSON.stringify(newGoals));
    
    // Auto-update weight metrics inputs
    setProtein(proteinG.toString());
    setCalories(Math.round(targetCalories).toString());
    
    sounds.playFanfare();
    toast.success(`Targets generated: ${Math.round(targetCalories)} kcal!`, { icon: '🎯' });
    setShowMacroCalc(false);
  };

  // ── BARBELL PLATE LOADER STATE ─────────────────────────────────────────────
  const [targetPlateWeight, setTargetPlateWeight] = useState(60);
  const [barWeight, setBarWeight] = useState(20);

  const PLATES_POOL = [
    { weight: 25, color: '#DC2626', label: '25', thickness: 16, height: 42, textColor: '#fff' }, // Red
    { weight: 20, color: '#2563EB', label: '20', thickness: 14, height: 40, textColor: '#fff' }, // Blue
    { weight: 15, color: '#D97706', label: '15', thickness: 12, height: 38, textColor: '#fff' }, // Yellow
    { weight: 10, color: '#059669', label: '10', thickness: 10, height: 36, textColor: '#fff' }, // Green
    { weight: 5, color: '#4B5563', label: '5', thickness: 8, height: 32, textColor: '#fff' },    // Grey/White
    { weight: 2.5, color: '#1F2937', label: '2.5', thickness: 6, height: 26, textColor: '#fbbf24' }, // Black
    { weight: 1.25, color: '#9CA3AF', label: '1.25', thickness: 5, height: 20, textColor: '#111' } // Silver
  ];

  const plateLoaderResult = useMemo(() => {
    const sideWeight = Math.max(0, (targetPlateWeight - barWeight) / 2);
    let remaining = sideWeight;
    const plates: typeof PLATES_POOL = [];
    
    for (const plate of PLATES_POOL) {
      const count = Math.floor(remaining / plate.weight);
      for (let i = 0; i < count; i++) {
        plates.push(plate);
      }
      remaining = Number((remaining % plate.weight).toFixed(2));
    }
    
    return {
      plates,
      sideWeight,
      remainder: remaining
    };
  }, [targetPlateWeight, barWeight]);

  // ── PRESET QUEST ROUTINES STATE ────────────────────────────────────────────
  interface QuestExercise {
    name: string;
    target: number;
    current: number;
    type: 'reps' | 'sets';
    weight?: number;
  }

  interface WorkoutRoutine {
    id: string;
    name: string;
    rank: 'C' | 'B' | 'A' | 'S';
    description: string;
    rewards: { xp: number; stat: string; statValue: number };
    exercises: QuestExercise[];
  }

  const PRESET_ROUTINES: WorkoutRoutine[] = [
    {
      id: 'saitama',
      name: 'Saitama Protocol',
      rank: 'C',
      description: '100 pushups, 100 squats, 100 sit-ups, and a 10km run.',
      rewards: { xp: 250, stat: 'endurance', statValue: 3 },
      exercises: [
        { name: 'Push-up', target: 100, current: 0, type: 'reps' },
        { name: 'Bodyweight Squat', target: 100, current: 0, type: 'reps' },
        { name: 'Sit-up', target: 100, current: 0, type: 'reps' },
        { name: 'Cardio Run', target: 10, current: 0, type: 'reps' }
      ]
    },
    {
      id: 'spartan',
      name: 'Spartan Blueprint',
      rank: 'B',
      description: 'A heavy calisthenics endurance gauntlet.',
      rewards: { xp: 400, stat: 'endurance', statValue: 5 },
      exercises: [
        { name: 'Burpee', target: 30, current: 0, type: 'reps' },
        { name: 'Push-up', target: 50, current: 0, type: 'reps' },
        { name: 'Bodyweight Squat', target: 50, current: 0, type: 'reps' },
        { name: 'Plank Hold (min)', target: 3, current: 0, type: 'reps' }
      ]
    },
    {
      id: 'shadow_monarch',
      name: 'Shadow Monarch Lift',
      rank: 'S',
      description: 'Heavy strength builder for the ruler of shadows.',
      rewards: { xp: 600, stat: 'strength', statValue: 8 },
      exercises: [
        { name: 'Deadlift', target: 4, current: 0, type: 'sets', weight: 100 },
        { name: 'Barbell Squat', target: 4, current: 0, type: 'sets', weight: 80 },
        { name: 'Bench Press', target: 4, current: 0, type: 'sets', weight: 70 },
        { name: 'Weighted Pull-up', target: 3, current: 0, type: 'sets', weight: 10 }
      ]
    }
  ];

  const [activeRoutine, setActiveRoutine] = useState<WorkoutRoutine | null>(null);

  useEffect(() => {
    const userId = user?.id || 'guest';
    const saved = localStorage.getItem(`monarch_active_routine_${userId}`);
    if (saved) {
      try {
        setActiveRoutine(JSON.parse(saved));
      } catch (e) {}
    }
  }, [user]);

  const updateActiveRoutine = (routine: WorkoutRoutine | null) => {
    setActiveRoutine(routine);
    const userId = user?.id || 'guest';
    if (routine) {
      localStorage.setItem(`monarch_active_routine_${userId}`, JSON.stringify(routine));
    } else {
      localStorage.removeItem(`monarch_active_routine_${userId}`);
    }
  };

  const handleUpdateProgress = (exerciseIndex: number, newValue: number) => {
    if (!activeRoutine) return;
    
    const updatedExercises = [...activeRoutine.exercises];
    const prevVal = updatedExercises[exerciseIndex].current;
    const target = updatedExercises[exerciseIndex].target;
    
    const clampedValue = Math.max(0, Math.min(target, newValue));
    updatedExercises[exerciseIndex].current = clampedValue;
    
    const updatedRoutine = {
      ...activeRoutine,
      exercises: updatedExercises
    };
    
    updateActiveRoutine(updatedRoutine);
    
    if (clampedValue > prevVal) {
      sounds.playChime();
      addXpParticle(window.innerWidth / 2, window.innerHeight / 2, 10);
      
      if (clampedValue === target && prevVal < target) {
        toast.success(`Objective Complete: ${updatedExercises[exerciseIndex].name}!`, { icon: '🎯' });
      }
    }
  };

  const isRoutineComplete = useMemo(() => {
    if (!activeRoutine) return false;
    return activeRoutine.exercises.every(ex => ex.current >= ex.target);
  }, [activeRoutine]);

  const handleClaimRewards = async () => {
    if (!activeRoutine || !isRoutineComplete) return;
    
    const rewardXp = activeRoutine.rewards.xp;
    
    await addLog(
      'Quest Complete',
      60,
      rewardXp,
      {
        notes: `Completed Quest Routine: ${activeRoutine.name} (Rank ${activeRoutine.rank})`,
        routineId: activeRoutine.id,
      },
      [activeRoutine.rewards.stat]
    );
    
    sounds.playFanfare();
    
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        addXpParticle(
          window.innerWidth / 2 + (Math.random() - 0.5) * 200,
          window.innerHeight / 2 + (Math.random() - 0.5) * 200,
          Math.round(rewardXp / 15)
        );
      }, i * 100);
    }
    
    toast.success(`QUEST COMPLETE: Earned +${rewardXp} XP and +${activeRoutine.rewards.statValue} ${activeRoutine.rewards.stat.toUpperCase()}!`, {
      duration: 5000,
      icon: '👑'
    });
    
    updateActiveRoutine(null);
  };


  const [weightHistory, setWeightHistory] = useState<any[]>([]);

  // PR highlight
  const [recentPr, setRecentPr] = useState<{ exercise: string; weight: number } | null>(null);

  // Fetch weight logs
  useEffect(() => {
    if (!user) return;

    const fetchWeightLogs = async () => {
      if (!isSupabaseConfigured) {
        // Fetch last 10 days from localstorage fallback
        const mockWeight = [];
        for (let i = 9; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const raw = localStorage.getItem(`monarch_fitness_metrics_${user.id}_${dateStr}`);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed.weight_kg) {
                mockWeight.push({
                  date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                  weight: parsed.weight_kg
                });
              }
            } catch (e) {}
          }
        }
        // Fallback seed
        if (mockWeight.length === 0) {
          setWeightHistory([
            { date: 'May 10', weight: 78.5 },
            { date: 'May 12', weight: 78.2 },
            { date: 'May 14', weight: 78.4 },
            { date: 'May 16', weight: 77.9 },
            { date: 'May 18', weight: 77.6 }
          ]);
        } else {
          setWeightHistory(mockWeight);
        }
      } else {
        try {
          const { data } = await supabase
            .from('fitness_logs')
            .select('date,weight_kg')
            .eq('user_id', user.id)
            .order('date', { ascending: true })
            .limit(15);
          if (data) {
            setWeightHistory(data.map(d => ({
              date: new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
              weight: d.weight_kg
            })));
          }
        } catch (e) {}
      }
    };

    fetchWeightLogs();
  }, [user, savingMetrics]);

  // Compute stat details
  const getStat = (name: string) => {
    const s = stats.find(s => s.stat_name.toLowerCase() === name.toLowerCase());
    return { level: s?.level ?? 1, xp: s?.xp ?? 0 };
  };
  const strengthStat  = getStat('strength');
  const enduranceStat = getStat('endurance');

  const stage = getSecondBodyStage(currentLevel);

  // 1. Muscle group frequency heatmap (calculate from today's exercises)
  const muscleGroups = useMemo(() => {
    const trained = { chest: false, back: false, legs: false, shoulders: false, arms: false, core: false };
    const todayLogs = logs.filter(l => l.created_at.startsWith(TODAY));

    todayLogs.forEach(l => {
      const type = l.activity_type.toLowerCase();
      const n = (l.metadata?.exerciseName || '').toLowerCase();
      if (type.includes('weight') || type.includes('calisthenics')) {
        if (n.includes('bench') || n.includes('push') || n.includes('dip')) trained.chest = true;
        if (n.includes('dead') || n.includes('pull') || n.includes('row')) trained.back = true;
        if (n.includes('squat') || n.includes('dead') || n.includes('lunge')) trained.legs = true;
        if (n.includes('overhead') || n.includes('press')) trained.shoulders = true;
        if (n.includes('curl') || n.includes('arm') || n.includes('dip')) trained.arms = true;
        if (n.includes('plank') || n.includes('sit') || n.includes('core')) trained.core = true;
      }
    });

    return trained;
  }, [logs]);

  // 2. Cooldown Warning: Alert if 3 strength sessions inside rolling 24-hours
  const isCooldownWarningActive = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentStrengthLogs = logs.filter(l => {
      const cat = l.activity_type;
      const created = new Date(l.created_at);
      return (cat === 'Weightlifting' || cat === 'Calisthenics' || cat === 'HIIT') && created >= oneDayAgo;
    });
    return recentStrengthLogs.length >= 3;
  }, [logs]);

  // 3. Weekly chart data
  const weeklyChart = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = logs.filter(l => l.created_at.startsWith(dateStr));
      const totalXP = dayLogs.reduce((s, l) => s + l.xp_earned, 0);
      const totalMin = dayLogs.reduce((s, l) => s + l.duration_minutes, 0);
      return { day: days[d.getDay()], xp: totalXP, minutes: totalMin, date: dateStr };
    });
  }, [logs]);

  const totalSessions = logs.length;
  const totalMinutes  = logs.reduce((s, l) => s + l.duration_minutes, 0);
  const totalXP       = logs.reduce((s, l) => s + l.xp_earned, 0);
  const thisWeekSessions = weeklyChart.filter(d => d.xp > 0).length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);
    const dur = parseInt(duration) || 0;
    const multi = INTENSITY_MULTI[intensity] ?? 1.0;
    const wt = WORKOUT_TYPES.find(w => w.label === wType) ?? WORKOUT_TYPES[0];
    const xpEarned = Math.round(wt.baseXpRate * dur * multi);
    const statCats = wt.stats;

    await addLog(wType, dur, xpEarned, { intensity, notes: notes.trim() }, statCats);

    if (user) await auraOnWorkout(user.id).catch(console.error);

    const rect = (e.target as HTMLFormElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, xpEarned);
    toast.success(`+${xpEarned} XP — Training logged. The body adapts.`);
    setNotes('');
    setLogging(false);
  };

  // Log customized exercise sets
  const handleLogSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);

    const reps = parseInt(repsInput) || 1;
    const weightVal = parseFloat(weightInput) || 0;
    const xpEarned = Math.round(5 + (weightVal * 0.1) + reps); // dynamic XP formula

    // Persist last-used weight for this exercise
    const userId = user?.id || 'guest';
    const exKey = selectedEx.name.toLowerCase();
    const updatedWeights = { ...lastUsedWeights, [exKey]: weightInput };
    setLastUsedWeights(updatedWeights);
    localStorage.setItem(`monarch_last_weights_${userId}`, JSON.stringify(updatedWeights));

    // Add to in-session log
    setSessionSets(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      exerciseName: selectedEx.name,
      weight: weightVal,
      reps,
      xp: xpEarned,
    }]);

    // Check if new PR
    const prKey = `monarch_pr_${userId}_${exKey}`;
    const previousMax = parseFloat(localStorage.getItem(prKey) || '0');

    if (weightVal > previousMax && selectedEx.type === 'weighted') {
      localStorage.setItem(prKey, weightVal.toString());
      setRecentPr({ exercise: selectedEx.name, weight: weightVal });
      sounds.playFanfare();
      toast.success(`🏆 NEW PERSONAL RECORD: ${selectedEx.name} ${weightVal}kg established!`);
    } else {
      sounds.playChime();
    }

    await addLog(
      selectedEx.category === 'Cardio' || selectedEx.category === 'Martial Arts' ? 'Cardio' : 'Weightlifting',
      10,
      xpEarned,
      {
        intensity: 'High',
        exerciseName: selectedEx.name,
        weight: weightVal,
        reps,
        notes: `Trained ${selectedEx.name} @ ${weightVal}kg x ${reps} reps`
      },
      selectedEx.category === 'Cardio' || selectedEx.category === 'Martial Arts' ? ['endurance'] : ['strength']
    );

    const rect = (e.target as HTMLFormElement).getBoundingClientRect();
    addXpParticle(rect.left + rect.width / 2, rect.top, xpEarned);
    setLogging(false);
  };

  const handleSaveMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingMetrics(true);
    const payload: Record<string, number | string> = { user_id: user.id, date: TODAY };
    if (weight)   payload.weight_kg     = parseFloat(weight);
    if (protein)  payload.protein_g     = parseInt(protein);
    if (calories) payload.calories      = parseInt(calories);
    if (bodyFat)  payload.body_fat_pct  = parseFloat(bodyFat);
    if (sleepHrs) payload.sleep_hours   = parseFloat(sleepHrs);

    if (!isSupabaseConfigured) {
      try {
        const localKey = `monarch_fitness_metrics_${user.id}_${TODAY}`;
        localStorage.setItem(localKey, JSON.stringify(payload));
      } catch (err) {
        console.error('Failed to save local metrics:', err);
      }
      setSavingMetrics(false);
      toast.success('Body metrics saved.');
      setShowMetrics(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('fitness_logs')
        .upsert(payload, { onConflict: 'user_id,date' });

      setSavingMetrics(false);
      if (error) { toast.error('Failed to save metrics.'); return; }
      toast.success('Body metrics saved.');
      setShowMetrics(false);
    } catch (err) {
      console.error(err);
      setSavingMetrics(false);
      toast.error('Failed to save metrics.');
    }
  };

  const filteredExercises = useMemo(() => {
    return EXERCISE_LIBRARY.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.primaryMuscles.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'All' || ex.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  // ── PR BOARD: last PR for each exercise from localStorage ─────────────────
  const prBoard = useMemo(() => {
    if (!user) return [];
    return EXERCISE_LIBRARY.map(ex => {
      const prKey = `monarch_pr_${user.id}_${ex.name.toLowerCase()}`;
      const pr = parseFloat(localStorage.getItem(prKey) || '0');
      return { name: ex.name, category: ex.category, pr, difficulty: ex.baseDifficulty };
    }).filter(e => e.pr > 0).sort((a, b) => a.name.localeCompare(b.name));
  }, [user, recentPr]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 md:p-10 max-w-[1400px] mx-auto w-full space-y-8"
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 flex items-center justify-center bg-red-950/20 border border-red-500/40">
            <Activity className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h1 className="font-orbitron text-3xl md:text-4xl font-bold uppercase tracking-widest text-white">
              Physical <span className="text-red-500">Conditioning</span>
            </h1>
            <p className="font-space-mono text-xs text-white/40 tracking-widest uppercase mt-1">
              Build the vessel to wield the aura.
            </p>
          </div>
        </div>
        
        <div className="px-4 py-2 text-center bg-red-950/10 border border-red-500/30">
          <p className="font-space-mono text-[10px] text-white/30 uppercase tracking-widest">Current Stage</p>
          <p className="font-orbitron text-sm font-bold text-red-500 uppercase mt-0.5">{stage.name}</p>
        </div>
      </div>

      {/* OVERTRAINING COOLDOWN WARNING */}
      {isCooldownWarningActive && (
        <div className="glass-panel p-4 border-l-4 border-red-600 bg-red-950/20 flex items-center gap-4 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <h4 className="font-orbitron text-xs font-bold text-red-500 uppercase tracking-widest">DANGER: OVERTRAINING DETECTED</h4>
            <p className="font-space-mono text-[10px] text-white/60 uppercase mt-0.5">
              3 Strength logs in under 24 hours. Initiate active rest cooldown to protect aura recovery!
            </p>
          </div>
        </div>
      )}

      {/* LIFT PR CELEBRATION BANNER */}
      {recentPr && (
        <div className="glass-panel p-5 border border-green-500/30 bg-green-950/20 flex items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-[40px] pointer-events-none" />
          <div className="flex items-center gap-4">
            <Trophy className="w-8 h-8 text-gold animate-bounce" />
            <div>
              <h4 className="font-orbitron text-sm font-black text-green-400 uppercase tracking-wider">
                PERSONAL RECORD ESTABLISHED!
              </h4>
              <p className="font-space-mono text-xs text-white/80 mt-1">
                You successfully conquered the <span className="font-bold text-white">{recentPr.exercise}</span> set at <span className="font-bold text-green-400">{recentPr.weight}kg</span>!
              </p>
            </div>
          </div>
          <button 
            onClick={() => setRecentPr(null)}
            className="px-3 py-1 bg-green-950/40 border border-green-500/20 text-green-400 text-[10px] font-space-mono uppercase tracking-widest hover:bg-green-950/60"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* STATS SUMMARY ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: totalSessions, icon: <Dumbbell className="w-4 h-4" />, color: '#ff5a00' },
          { label: 'Total Minutes',  value: `${totalMinutes}m`, icon: <Timer className="w-4 h-4" />, color: '#00D4FF' },
          { label: 'Total XP',       value: totalXP.toLocaleString(), icon: <Zap className="w-4 h-4" />, color: '#7B2FFF' },
          { label: 'This Week',      value: `${thisWeekSessions}/7`, icon: <Flame className="w-4 h-4" />, color: '#ff003c' },
        ].map(s => (
          <div key={s.label} className="p-4 bg-black/60 border border-white/[0.03]" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: s.color }}>{s.icon}
              <span className="font-space-mono text-[9px] uppercase tracking-widest text-white/30">{s.label}</span>
            </div>
            <p className="font-orbitron text-2xl font-bold text-white mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── WORKOUT TIMER + REST TIMER + MACRO RING ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Workout Countdown Timer */}
        <div className="glass-panel p-5 border-t-2 border-t-red-500 flex flex-col items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full">
            <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <Timer className="w-4 h-4 text-red-500" /> Session Timer
            </h3>
            <select
              value={timerDuration}
              onChange={e => { setTimerDuration(parseInt(e.target.value)); setTimerSeconds(0); setTimerRunning(false); }}
              className="text-[9px] font-mono bg-black/40 border border-white/10 text-white/70 px-2 py-1 rounded"
            >
              {[15,30,45,60,90].map(m => <option key={m} value={m*60}>{m} MIN</option>)}
            </select>
          </div>

          {/* Circular timer */}
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke={timerPercent >= 100 ? '#22c55e' : '#EF4444'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={276.46}
                strokeDashoffset={276.46 * (1 - timerPercent / 100)}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-xl font-bold text-white">{timerDisplay}</span>
              <span className="font-mono text-[8px] text-white/30 uppercase">{timerRunning ? 'Running' : 'Paused'}</span>
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={() => setTimerRunning(r => !r)}
              className={`flex-1 py-2 text-xs font-mono font-bold border rounded transition-all ${timerRunning ? 'bg-amber-950/20 border-amber-500/30 text-amber-400' : 'bg-red-950/20 border-red-500/30 text-red-400 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]'}`}
            >
              {timerRunning ? 'PAUSE' : 'START'}
            </button>
            <button onClick={() => { setTimerSeconds(0); setTimerRunning(false); }} className="px-3 py-2 text-xs font-mono border border-white/10 text-white/40 rounded hover:text-white/70 transition-all">RESET</button>
          </div>
        </div>

        {/* Rest Timer */}
        <div className="glass-panel p-5 border-t-2 border-t-cyan-500 flex flex-col gap-4">
          <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <Timer className="w-4 h-4 text-cyan-400" /> Rest Timer
          </h3>
          
          {/* Rest Presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {REST_PRESETS.map(s => (
              <button
                key={s}
                onClick={() => setRestPreset(s)}
                className={`py-1.5 text-[10px] font-mono font-bold rounded border transition-all ${restPreset === s ? 'bg-cyan-950/30 border-cyan-400/50 text-cyan-400' : 'border-white/10 text-white/30 hover:text-white/60'}`}
              >
                {s}s
              </button>
            ))}
          </div>

          {/* Countdown display */}
          <div className="flex-1 flex flex-col items-center justify-center my-2">
            <div className={`text-5xl font-mono font-bold transition-colors ${restRunning ? (restSeconds <= 10 ? 'text-red-400 animate-pulse' : 'text-cyan-400') : 'text-white/30'}`}>
              {restDisplay}
            </div>
            <div className="w-full h-2 bg-black/60 border border-white/5 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-1000"
                style={{ width: `${restRunning ? (restSeconds / restPreset) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => restRunning ? setRestRunning(false) : startRest(restPreset)}
              className={`flex-1 py-2.5 text-xs font-mono font-bold border rounded transition-all ${restRunning ? 'bg-amber-950/20 border-amber-500/30 text-amber-400' : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-400'}`}
            >
              {restRunning ? 'STOP' : 'START REST'}
            </button>
          </div>
        </div>

        {/* Macro Ring Chart */}
        <div className="glass-panel p-5 border-t-2 border-t-emerald-500 flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" /> Daily Macros
            </h3>
            <button
              onClick={() => setShowMacroCalc(p => !p)}
              className="text-[9px] font-mono bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded hover:bg-emerald-950/60 transition-all flex items-center gap-1"
            >
              <Calculator className="w-3 h-3" /> CALCULATE
            </button>
          </div>

          <AnimatePresence>
            {showMacroCalc && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleCalculateMacros}
                className="bg-black/40 border border-white/5 p-3 space-y-3 overflow-hidden text-left"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-space-mono text-[8px] text-white/40 uppercase tracking-widest mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={calcWeight}
                      onChange={e => setCalcWeight(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 p-1.5 text-white font-space-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-space-mono text-[8px] text-white/40 uppercase tracking-widest mb-1">Goal</label>
                    <select
                      value={calcGoal}
                      onChange={e => setCalcGoal(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 p-1.5 text-white font-space-mono text-xs focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Cut">Cut (-500 kcal)</option>
                      <option value="Maintain">Maintain</option>
                      <option value="Bulk">Bulk (+400 kcal)</option>
                      <option value="Recomp">Recomp (-200 kcal)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-space-mono text-[8px] text-white/40 uppercase tracking-widest mb-1">Activity Level</label>
                  <select
                    value={calcActivity}
                    onChange={e => setCalcActivity(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 p-1.5 text-white font-space-mono text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="1.2">Sedentary (desk job)</option>
                    <option value="1.375">Lightly Active (1-3 days/wk)</option>
                    <option value="1.55">Moderately Active (3-5 days/wk)</option>
                    <option value="1.725">Very Active (6-7 days/wk)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-orbitron text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/30 transition-all"
                >
                  Generate split
                </button>
              </motion.form>
            )}
          </AnimatePresence>
          
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'protein', label: 'Protein', val: macroProtein, setVal: (val: string) => { setMacroProtein(val); saveMacroIntake(val, macroCarbs, macroFat); }, goal: macroGoals.protein, color: '#EF4444', unit: 'g' },
              { key: 'carbs',   label: 'Carbs',   val: macroCarbs,   setVal: (val: string) => { setMacroCarbs(val); saveMacroIntake(macroProtein, val, macroFat); }, goal: macroGoals.carbs,   color: '#F59E0B', unit: 'g' },
              { key: 'fat',     label: 'Fat',     val: macroFat,     setVal: (val: string) => { setMacroFat(val); saveMacroIntake(macroProtein, macroCarbs, val); }, goal: macroGoals.fat,     color: '#06B6D4', unit: 'g' },
            ].map(m => {
              const pct = Math.min(100, (parseInt(m.val) / m.goal) * 100);
              const r = 18; const circ = 2 * Math.PI * r;
              return (
                <div key={m.key} className="flex flex-col items-center gap-2">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                      <circle cx="22" cy="22" r={r} fill="none" stroke={m.color} strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-[9px] font-bold" style={{ color: m.color }}>{Math.round(pct)}%</span>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={m.val}
                    onChange={e => m.setVal(e.target.value)}
                    className="w-full text-center bg-black/40 border border-white/10 text-white font-mono text-xs py-1 rounded"
                    placeholder="0"
                  />
                  <span className="font-mono text-[8px] text-white/40 uppercase">{m.label} /{m.goal}{m.unit}</span>
                </div>
              );
            })}
          </div>

          <div className="text-[9px] font-mono text-white/30 text-center border-t border-white/5 pt-2 uppercase tracking-wider">
            Total: {parseInt(macroProtein||'0')*4 + parseInt(macroCarbs||'0')*4 + parseInt(macroFat||'0')*9} kcal estimated
          </div>
        </div>
      </div>

      {/* ── PR BOARD ── */}
      {prBoard.length > 0 && (
        <div className="glass-panel p-6 border-t-2 border-t-amber-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-orbitron text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Personal Records Board
            </h3>
            <span className="font-mono text-[9px] text-white/30 uppercase">{prBoard.length} PRs established</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {prBoard.map(pr => (
              <motion.div
                key={pr.name}
                whileHover={{ scale: 1.03, y: -2 }}
                className="p-3 bg-amber-950/10 border border-amber-500/20 rounded-lg flex flex-col gap-1.5 relative overflow-hidden hover:border-amber-500/50 transition-all"
              >
                <div className="achievement-shine absolute inset-0 rounded-lg" />
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[8px] text-white/30 uppercase">{pr.category}</span>
                  <span className={`text-[8px] font-bold px-1 rounded font-mono grade-${pr.difficulty}`}>{pr.difficulty}</span>
                </div>
                <p className="font-display text-xs font-bold text-white leading-tight">{pr.name}</p>
                <div className="flex items-end gap-1">
                  <span className="font-mono text-xl font-black text-amber-400">{pr.pr}</span>
                  <span className="font-mono text-[9px] text-amber-400/60 mb-0.5">kg</span>
                </div>
                <Trophy className="w-3 h-3 text-amber-400/30 absolute bottom-2 right-2" />
              </motion.div>
            ))}
          </div>
        </div>
      )}


      {/* CORE BODY WORKOUT BUILDER & GRIDS */}
      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8 items-start">
        
        {/* Left Column: Logs, Builder, Metrics */}
        <div className="space-y-6">

          {/* Exercise Sets Builder — REDESIGNED */}
          <div className="glass-panel border-t-2 border-t-red-500 bg-void/50 overflow-hidden">
            {/* Header */}
            <div className="p-5 pb-0 flex items-center justify-between">
              <h2 className="font-orbitron text-base font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                <Dumbbell className="w-4 h-4 text-red-500" /> Set Builder
              </h2>
              <div className="flex items-center gap-2">
                <span className="font-space-mono text-[9px] text-white/30 uppercase tracking-widest">
                  {EXERCISE_LIBRARY.length} exercises
                </span>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-1.5 px-5 pt-4 pb-2 overflow-x-auto hide-scrollbar">
              {EXERCISE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setActiveCategory(cat); setSearchQuery(''); }}
                  className={`shrink-0 px-2.5 py-1 text-[9px] font-space-mono font-bold uppercase tracking-wider rounded-full border transition-all ${
                    activeCategory === cat
                      ? 'bg-red-500/20 border-red-500/60 text-red-400'
                      : 'border-white/10 text-white/30 hover:text-white/60 hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogSet} className="p-5 pt-2 space-y-4">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); if (e.target.value) setActiveCategory('All'); }}
                    placeholder={`Search ${activeCategory === 'All' ? 'all exercises' : activeCategory}...`}
                    className="w-full bg-black/40 border border-white/10 p-2 pl-8 text-white font-space-mono text-xs focus:border-red-500 focus:outline-none placeholder:text-white/20 transition-all"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs">✕</button>
                  )}
                </div>
              </div>

              {/* Exercise List */}
              <div className="max-h-[160px] overflow-y-auto border border-white/5 bg-black/30 flex flex-col hide-scrollbar">
                {filteredExercises.length === 0 ? (
                  <div className="p-4 text-center font-space-mono text-[10px] text-white/30 uppercase tracking-wider">
                    No exercises found
                  </div>
                ) : filteredExercises.map(ex => {
                  const isSelected = selectedEx.name === ex.name;
                  const hasPr = user && parseFloat(localStorage.getItem(`monarch_pr_${user.id}_${ex.name.toLowerCase()}`) || '0') > 0;
                  const diffColors: Record<string, string> = { S: '#ff003c', A: '#ff5a00', B: '#F59E0B', C: '#00D4FF', D: '#6b7280' };
                  return (
                    <button
                      key={ex.name}
                      type="button"
                      onClick={() => setSelectedEx(ex)}
                      className={`w-full text-left px-3 py-2 text-xs font-space-mono transition-all flex items-center justify-between gap-2 border-b border-white/[0.03] last:border-b-0 ${
                        isSelected
                          ? 'bg-red-500/15 text-red-300 border-l-2 border-l-red-500'
                          : 'text-white/60 hover:bg-white/[0.03] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="shrink-0 text-[8px] font-black font-mono w-4 h-4 flex items-center justify-center rounded-sm"
                          style={{ color: diffColors[ex.baseDifficulty] ?? '#6b7280', background: `${diffColors[ex.baseDifficulty]}18` }}
                        >
                          {ex.baseDifficulty}
                        </span>
                        <span className={`truncate font-semibold ${isSelected ? 'text-red-300' : ''}`}>{ex.name}</span>
                        {hasPr && <span className="shrink-0 text-[8px] text-amber-400 font-bold">★ PR</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-white/20">{ex.equipment}</span>
                        <span className="text-[9px] text-white/20">{ex.category}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Exercise Info Banner */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedEx.name}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="p-3 bg-red-950/20 border border-red-500/20 rounded"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-orbitron text-sm font-bold text-red-400">{selectedEx.name}</p>
                      <p className="font-space-mono text-[9px] text-white/40 mt-0.5 uppercase">
                        {selectedEx.primaryMuscles.join(' · ')}
                        {selectedEx.secondaryMuscles.length > 0 && (
                          <span className="text-white/20"> / {selectedEx.secondaryMuscles.slice(0,2).join(', ')}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-mono text-[8px] px-1.5 py-0.5 rounded" style={{
                        color: ({ S: '#ff003c', A: '#ff5a00', B: '#F59E0B', C: '#00D4FF', D: '#6b7280' } as Record<string,string>)[selectedEx.baseDifficulty],
                        background: `${({ S: '#ff003c', A: '#ff5a00', B: '#F59E0B', C: '#00D4FF', D: '#6b7280' } as Record<string,string>)[selectedEx.baseDifficulty]}15`,
                        border: `1px solid ${({ S: '#ff003c', A: '#ff5a00', B: '#F59E0B', C: '#00D4FF', D: '#6b7280' } as Record<string,string>)[selectedEx.baseDifficulty]}40`,
                      }}>
                        Rank {selectedEx.baseDifficulty}
                      </span>
                      <span className="font-space-mono text-[8px] text-white/30 capitalize">{selectedEx.type}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Weight + Reps Steppers */}
              <div className="grid grid-cols-2 gap-4">
                {/* Weight */}
                <div>
                  <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">
                    {selectedEx.type === 'cardio' || selectedEx.type === 'duration' ? 'Duration (min)' : 'Weight (kg)'}
                  </label>
                  <div className="flex items-center border border-white/10 bg-black/40 overflow-hidden focus-within:border-red-500 transition-all">
                    <button
                      type="button"
                      onClick={() => setWeightInput(v => Math.max(0, (parseFloat(v)||0) - 2.5).toString())}
                      className="px-2.5 py-2.5 text-white/40 hover:text-white hover:bg-white/5 transition-all font-mono text-sm font-bold shrink-0"
                    >−</button>
                    <input
                      type="number"
                      value={weightInput}
                      onChange={e => setWeightInput(e.target.value)}
                      className="flex-1 bg-transparent text-center text-white font-orbitron text-sm font-bold focus:outline-none min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => setWeightInput(v => ((parseFloat(v)||0) + 2.5).toString())}
                      className="px-2.5 py-2.5 text-white/40 hover:text-white hover:bg-white/5 transition-all font-mono text-sm font-bold shrink-0"
                    >+</button>
                  </div>
                  {/* Quick weight presets */}
                  <div className="flex gap-1 mt-1.5">
                    {['+2.5', '+5', '+10'].map(delta => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => setWeightInput(v => ((parseFloat(v)||0) + parseFloat(delta)).toString())}
                        className="flex-1 py-0.5 text-[8px] font-mono border border-white/5 text-white/30 hover:text-red-400 hover:border-red-500/30 transition-all rounded"
                      >
                        {delta}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reps */}
                <div>
                  <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">
                    {selectedEx.type === 'duration' ? 'Sets' : 'Reps'}
                  </label>
                  <div className="flex items-center border border-white/10 bg-black/40 overflow-hidden focus-within:border-red-500 transition-all">
                    <button
                      type="button"
                      onClick={() => setRepsInput(v => Math.max(1, (parseInt(v)||1) - 1).toString())}
                      className="px-2.5 py-2.5 text-white/40 hover:text-white hover:bg-white/5 transition-all font-mono text-sm font-bold shrink-0"
                    >−</button>
                    <input
                      type="number"
                      value={repsInput}
                      onChange={e => setRepsInput(e.target.value)}
                      className="flex-1 bg-transparent text-center text-white font-orbitron text-sm font-bold focus:outline-none min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => setRepsInput(v => ((parseInt(v)||0) + 1).toString())}
                      className="px-2.5 py-2.5 text-white/40 hover:text-white hover:bg-white/5 transition-all font-mono text-sm font-bold shrink-0"
                    >+</button>
                  </div>
                  {/* Quick rep presets */}
                  <div className="flex gap-1 mt-1.5">
                    {[5, 8, 10, 12].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRepsInput(r.toString())}
                        className={`flex-1 py-0.5 text-[8px] font-mono border transition-all rounded ${
                          repsInput === r.toString()
                            ? 'border-red-500/40 text-red-400 bg-red-500/10'
                            : 'border-white/5 text-white/30 hover:text-red-400 hover:border-red-500/30'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* XP Preview */}
              <div className="flex items-center justify-between px-3 py-2 bg-black/30 border border-white/5 rounded">
                <span className="font-space-mono text-[9px] text-white/30 uppercase tracking-wider">Est. XP Reward</span>
                <span className="font-orbitron text-sm font-bold text-red-400">
                  +{Math.round(5 + ((parseFloat(weightInput)||0) * 0.1) + (parseInt(repsInput)||0))} XP
                </span>
              </div>

              {/* Log Button */}
              <motion.button
                type="submit"
                disabled={logging}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 bg-red-950/20 hover:bg-red-500/20 border border-red-500/40 hover:border-red-500/70 text-red-500 font-orbitron text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_0_rgba(239,68,68,0)] hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] disabled:opacity-50"
              >
                {logging ? 'LOGGING...' : '⚡ LOG COMPLETED SET'}
              </motion.button>
            </form>

            {/* Session Sets Log */}
            <AnimatePresence>
              {sessionSets.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5 overflow-hidden"
                >
                  <div className="p-5 pt-3 space-y-2">
                    {/* Session stats */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-orbitron text-[10px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                        <Zap className="w-3 h-3 text-red-500" /> Session Log
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="font-space-mono text-[9px] text-white/30">
                          Vol: <span className="text-white/60 font-bold">
                            {sessionSets.reduce((s, set) => s + set.weight * set.reps, 0).toLocaleString()}kg
                          </span>
                        </span>
                        <span className="font-space-mono text-[9px] text-red-400 font-bold">
                          +{sessionSets.reduce((s, set) => s + set.xp, 0)} XP
                        </span>
                        <button
                          type="button"
                          onClick={() => setSessionSets([])}
                          className="text-[9px] font-mono text-white/20 hover:text-red-400 transition-all"
                        >
                          CLEAR
                        </button>
                      </div>
                    </div>

                    {/* Set rows */}
                    <div className="space-y-1 max-h-[180px] overflow-y-auto hide-scrollbar">
                      <AnimatePresence>
                        {sessionSets.map((set, idx) => (
                          <motion.div
                            key={set.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex items-center justify-between gap-2 px-3 py-1.5 bg-black/30 border border-white/[0.04] rounded"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-[9px] text-white/20 shrink-0">#{idx + 1}</span>
                              <span className="font-space-mono text-[10px] text-white/70 truncate">{set.exerciseName}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-mono text-[10px] text-white/50">
                                {set.weight > 0 ? `${set.weight}kg` : '—'} × {set.reps}
                              </span>
                              <span className="font-orbitron text-[9px] text-red-400 font-bold">+{set.xp}</span>
                              <button
                                type="button"
                                onClick={() => setSessionSets(prev => prev.filter(s => s.id !== set.id))}
                                className="text-white/10 hover:text-red-400 transition-all text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          {/* Barbell Plate Loader Visualizer */}
          <div className="glass-panel p-6 border-t-2 border-t-blue-500 bg-void/50">
            <h2 className="font-orbitron text-base font-bold uppercase tracking-widest flex items-center gap-2 text-white mb-3">
              <Dumbbell className="w-4 h-4 text-blue-400" /> Plate Loader
            </h2>
            <p className="font-space-mono text-[10px] text-white/40 uppercase tracking-wider mb-4">
              Calculate the plate stack needed on each side of the barbell.
            </p>
            
            <div className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Target Weight (kg)</label>
                  <input
                    type="number"
                    value={targetPlateWeight}
                    onChange={e => setTargetPlateWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-black/40 border border-white/10 p-2 text-white font-space-mono text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">Bar Weight (kg)</label>
                  <select
                    value={barWeight}
                    onChange={e => setBarWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/10 p-2 text-white font-space-mono text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value={20}>20 kg (Standard Olympic)</option>
                    <option value={15}>15 kg (Women's Olympic)</option>
                    <option value={10}>10 kg (EZ-Bar / Light)</option>
                    <option value={0}>0 kg (No Bar)</option>
                  </select>
                </div>
              </div>

              {/* Quick weight selectors */}
              <div className="flex flex-wrap gap-1">
                {[40, 60, 80, 100, 120, 140, 180].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setTargetPlateWeight(w)}
                    className={`px-2 py-1 text-[9px] font-mono border rounded transition-all ${
                      targetPlateWeight === w ? 'bg-blue-950/40 border-blue-500/50 text-blue-400' : 'border-white/5 text-white/40 hover:text-white/70'
                    }`}
                  >
                    {w}kg
                  </button>
                ))}
              </div>

              {/* Plate Loading Visualizer SVG */}
              <div className="relative bg-black/60 border border-white/5 p-3 rounded flex flex-col items-center justify-center overflow-hidden">
                {/* Barbell rendering */}
                <div className="w-full max-w-[280px] h-[70px] relative flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 300 60">
                    <defs>
                      <linearGradient id="barbellSleeveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e5e7eb" />
                        <stop offset="50%" stopColor="#9ca3af" />
                        <stop offset="100%" stopColor="#374151" />
                      </linearGradient>
                      <linearGradient id="shaftGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4b5563" />
                        <stop offset="50%" stopColor="#1f2937" />
                        <stop offset="100%" stopColor="#111827" />
                      </linearGradient>
                    </defs>
                    
                    {/* Shaft left */}
                    <rect x="0" y="27" width="70" height="6" fill="url(#shaftGrad)" />
                    {/* Sleeve Collar stopper */}
                    <rect x="70" y="12" width="10" height="36" fill="#6b7280" rx="1" stroke="#374151" />
                    {/* Sleeve bar */}
                    <rect x="80" y="22" width="200" height="16" fill="url(#barbellSleeveGrad)" stroke="#4b5563" strokeWidth="0.5" />
                    {/* Shaft right cap */}
                    <rect x="277" y="22" width="3" height="16" fill="#374151" />

                    {/* Plates rendered stack */}
                    {(() => {
                      let currentX = 81;
                      return plateLoaderResult.plates.map((plate, idx) => {
                        const x = currentX;
                        currentX += plate.thickness + 2.5; // add plate thickness + spacing
                        return (
                          <g key={idx}>
                            <rect
                              x={x}
                              y={30 - plate.height / 2}
                              width={plate.thickness}
                              height={plate.height}
                              fill={plate.color}
                              rx={1.5}
                              stroke="#000"
                              strokeWidth={1}
                            />
                            {plate.thickness >= 7 && (
                              <text
                                x={x + plate.thickness / 2}
                                y={32.5}
                                fill={plate.textColor}
                                fontSize={7}
                                fontWeight="black"
                                fontFamily="monospace"
                                textAnchor="middle"
                              >
                                {plate.label}
                              </text>
                            )}
                          </g>
                        );
                      });
                    })()}
                  </svg>
                </div>

                {/* Plates textual list */}
                <div className="w-full mt-2 border-t border-white/5 pt-2 flex flex-col items-center gap-1">
                  {plateLoaderResult.plates.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {Object.entries(
                        plateLoaderResult.plates.reduce((acc, p) => {
                          acc[p.weight] = (acc[p.weight] || 0) + 1;
                          return acc;
                        }, {} as Record<number, number>)
                      ).map(([wStr, count]) => {
                        const weightVal = parseFloat(wStr);
                        const match = PLATES_POOL.find(p => p.weight === weightVal);
                        return (
                          <span
                            key={wStr}
                            className="font-space-mono text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1.5"
                            style={{
                              backgroundColor: `${match?.color}15`,
                              borderColor: `${match?.color}40`,
                              color: match?.color,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: match?.color }} />
                            {count} x {wStr}kg
                          </span>
                        );
                      })}
                      <span className="font-space-mono text-[9px] text-white/40 ml-1.5 mt-0.5">
                        (on each side)
                      </span>
                    </div>
                  ) : (
                    <span className="font-space-mono text-[9px] text-white/30">
                      {targetPlateWeight <= barWeight ? 'No plates needed. Just lift the bar!' : 'Enter weight to calculate plate stack.'}
                    </span>
                  )}

                  {plateLoaderResult.remainder > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-amber-500 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="font-space-mono text-[8px] uppercase">
                        Remainder of {plateLoaderResult.remainder}kg cannot be loaded exactly.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Regimen Logger */}
          <div className="glass-panel p-6 border-t-2 border-t-[#ff5a00] bg-void/50">
            <h2 className="font-orbitron text-base font-bold uppercase tracking-widest flex items-center gap-2 text-white mb-4">
              <Plus className="w-4 h-4 text-[#ff5a00]" /> Quick Regimen
            </h2>

            <form onSubmit={handleLogWorkout} className="space-y-4">
              <div>
                <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-2">Regimen Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {WORKOUT_TYPES.map(w => (
                    <button
                      key={w.label}
                      type="button"
                      onClick={() => setWType(w.label)}
                      className="px-3 py-2 flex items-center gap-2 text-left transition-all font-space-mono text-[10px]"
                      style={{
                        background: wType === w.label ? 'rgba(255,90,0,0.15)' : 'rgba(0,0,0,0.4)',
                        border: `1px solid ${wType === w.label ? '#ff5a00' : 'rgba(255,255,255,0.07)'}`,
                        color: wType === w.label ? '#ff5a00' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <span>{w.icon}</span> {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-2">Duration (min)</label>
                  <input
                    type="number" min="1" value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-2.5 text-white font-space-mono focus:border-[#ff5a00] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-2">Intensity</label>
                  <select
                    value={intensity}
                    onChange={e => setIntensity(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-2.5 text-white font-space-mono focus:border-[#ff5a00] focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-space-mono text-[9px] text-white/40 uppercase tracking-widest mb-2">Regimen Notes</label>
                <input
                  type="text" value={notes} placeholder="Notes..."
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 p-2.5 text-white font-space-mono text-xs focus:border-[#ff5a00] focus:outline-none placeholder:text-white/20"
                />
              </div>

              <button
                type="submit"
                disabled={logging}
                className="w-full py-3 bg-[#ff5a00]/10 hover:bg-[#ff5a00]/20 border border-[#ff5a00]/40 text-[#ff5a00] font-orbitron text-xs font-bold uppercase tracking-widest transition-all"
              >
                Log Regimen
              </button>
            </form>
          </div>

          {/* Metrics Drawer */}
          <div className="glass-panel border border-white/5 bg-void/30">
            <button
              onClick={() => setShowMetrics(p => !p)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Scale className="w-4 h-4 text-[#00D4FF]" />
                <span className="font-orbitron text-xs font-bold uppercase tracking-widest text-white">Save Body Metrics</span>
              </div>
              {showMetrics ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
            </button>

            <AnimatePresence>
              {showMetrics && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleSaveMetrics} className="p-4 pt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Weight (kg)', state: weight, set: setWeight, icon: <Scale className="w-3.5 h-3.5" />, type: 'number', step: '0.1' },
                        { label: 'Body Fat %',  state: bodyFat, set: setBodyFat, icon: <Target className="w-3.5 h-3.5" />, type: 'number', step: '0.1' },
                        { label: 'Protein (g)', state: protein, set: setProtein, icon: <Flame className="w-3.5 h-3.5" />, type: 'number', step: '1' },
                        { label: 'Calories',    state: calories, set: setCalories, icon: <Zap className="w-3.5 h-3.5" />, type: 'number', step: '1' },
                        { label: 'Sleep (hrs)', state: sleepHrs, set: setSleepHrs, icon: <Moon className="w-3.5 h-3.5" />, type: 'number', step: '0.5' },
                      ].map(f => (
                        <div key={f.label}>
                          <label className="flex items-center gap-1 font-space-mono text-[8px] text-white/30 uppercase tracking-widest mb-1">
                            {f.icon} {f.label}
                          </label>
                          <input
                            type={f.type} step={f.step} value={f.state}
                            onChange={e => f.set(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 p-2 text-white font-space-mono text-xs focus:border-[#00D4FF] focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="submit" disabled={savingMetrics}
                      className="w-full py-2.5 font-orbitron text-xs font-bold uppercase tracking-widest transition-all mt-2"
                      style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.4)', color: '#00D4FF' }}
                    >
                      {savingMetrics ? 'Saving...' : 'Save Metrics'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stat Rings */}
          <div className="grid grid-cols-2 gap-4">
            <StatRing statName="Strength"  level={strengthStat.level}  xp={strengthStat.xp % 100} />
            <StatRing statName="Endurance" level={enduranceStat.level} xp={enduranceStat.xp % 100} />
          </div>

        </div>

        {/* Right Column: Heatmap, Weight Trend, Training Logs */}
        <div className="space-y-6">

          {/* Preset Quest Routines */}
          <div className="glass-panel p-6 border-t-2 border-t-purple-500 bg-void/50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-orbitron text-base font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                <Trophy className="w-4 h-4 text-purple-400" /> Preset Quest Routines
              </h2>
              {activeRoutine && (
                <button
                  onClick={() => {
                    sounds.playChime();
                    updateActiveRoutine(null);
                  }}
                  className="font-space-mono text-[8px] border border-red-500/20 text-red-400 bg-red-950/10 px-2 py-0.5 rounded hover:bg-red-950/30"
                >
                  ABANDON QUEST
                </button>
              )}
            </div>
            
            {!activeRoutine ? (
              <div className="space-y-4">
                <p className="font-space-mono text-[10px] text-white/40 uppercase tracking-widest">
                  Select a training quest to begin tracking your workout reps/sets and claim massive RPG rewards.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {PRESET_ROUTINES.map(routine => (
                    <div
                      key={routine.id}
                      className="p-4 bg-black/40 border border-white/5 hover:border-purple-500/40 rounded flex flex-col justify-between gap-3 transition-all group"
                    >
                      <div className="space-y-1 text-left">
                        <div className="flex items-center justify-between text-left">
                          <span className="font-space-mono text-[9px] text-purple-400 uppercase tracking-wider font-bold">
                            Rank {routine.rank} Quest
                          </span>
                          <span className="font-orbitron text-[9px] px-1.5 py-0.25 bg-purple-950/40 border border-purple-500/30 text-purple-300">
                            +{routine.rewards.xp} XP
                          </span>
                        </div>
                        <h4 className="font-orbitron text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                          {routine.name}
                        </h4>
                        <p className="font-space-mono text-[9px] text-white/50 leading-relaxed">
                          {routine.description}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => {
                          sounds.playFanfare();
                          updateActiveRoutine(JSON.parse(JSON.stringify(routine)));
                          toast.success(`QUEST ACTIVE: Conquer the ${routine.name}!`);
                        }}
                        className="w-full py-1.5 bg-purple-950/30 border border-purple-500/40 text-purple-400 hover:bg-purple-900/40 text-[10px] font-orbitron font-bold uppercase tracking-wider transition-all"
                      >
                        Accept Quest
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-purple-950/10 border border-purple-500/20 rounded flex items-center justify-between gap-4 text-left">
                  <div>
                    <h3 className="font-orbitron text-sm font-black text-purple-400 uppercase tracking-wider">
                      ACTIVE: {activeRoutine.name} (Rank {activeRoutine.rank})
                    </h3>
                    <p className="font-space-mono text-[9px] text-white/60 mt-0.5">
                      Rewards: <span className="text-purple-300 font-bold">+{activeRoutine.rewards.xp} XP</span> and <span className="text-purple-300 font-bold">+{activeRoutine.rewards.statValue} {activeRoutine.rewards.stat.toUpperCase()}</span>
                    </p>
                  </div>
                  
                  {isRoutineComplete ? (
                    <button
                      onClick={handleClaimRewards}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-orbitron text-[11px] font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-bounce hover:scale-105 transition-all shrink-0"
                    >
                      🏆 CLAIM REWARDS
                    </button>
                  ) : (
                    <div className="text-right shrink-0">
                      <span className="font-space-mono text-[8px] text-white/30 uppercase block">Quest Progress</span>
                      <span className="font-orbitron text-xs text-purple-400 font-bold">
                        {activeRoutine.exercises.filter(ex => ex.current >= ex.target).length} / {activeRoutine.exercises.length} Complete
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-full h-2 bg-black/60 border border-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-300 transition-all duration-500"
                    style={{
                      width: `${
                        (activeRoutine.exercises.reduce((sum, ex) => sum + (ex.current / ex.target), 0) /
                          activeRoutine.exercises.length) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <div className="space-y-2">
                  {activeRoutine.exercises.map((ex, idx) => {
                    const isDone = ex.current >= ex.target;
                    return (
                      <div
                        key={idx}
                        className={`p-3 bg-black/30 border rounded flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all text-left ${
                          isDone ? 'border-green-500/20 bg-green-950/5' : 'border-white/5'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isDone ? (
                              <span className="w-3.5 h-3.5 rounded-full bg-green-500/20 border border-green-500 text-green-400 flex items-center justify-center font-bold text-[9px]">✓</span>
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold text-[9px]">•</span>
                            )}
                            <span className={`font-orbitron text-xs font-bold ${isDone ? 'text-green-400 line-through' : 'text-white'}`}>
                              {ex.name}
                            </span>
                            {ex.weight && (
                              <span className="font-space-mono text-[9px] text-white/40 uppercase">
                                @ {ex.weight}kg
                              </span>
                            )}
                          </div>
                          <p className="font-space-mono text-[9px] text-white/30 uppercase">
                            Objective: {ex.type === 'sets' ? `${ex.target} sets` : `${ex.target} reps`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {ex.type === 'sets' ? (
                            <div className="flex items-center gap-1.5">
                              {Array.from({ length: ex.target }).map((_, setIdx) => {
                                const isChecked = ex.current > setIdx;
                                return (
                                  <button
                                    key={setIdx}
                                    type="button"
                                    onClick={() => handleUpdateProgress(idx, isChecked ? setIdx : setIdx + 1)}
                                    className={`w-6 h-6 font-mono text-[9px] font-bold rounded flex items-center justify-center border transition-all ${
                                      isChecked
                                        ? 'bg-green-950/20 border-green-500/60 text-green-400'
                                        : 'bg-black/40 border-white/10 text-white/40 hover:text-white/60'
                                    }`}
                                  >
                                    S{setIdx + 1}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateProgress(idx, ex.current - 10)}
                                className="px-1.5 py-0.5 bg-black/40 border border-white/10 text-[9px] font-mono text-white/50 hover:text-white"
                              >
                                -10
                              </button>
                              <input
                                type="number"
                                value={ex.current}
                                onChange={e => handleUpdateProgress(idx, parseInt(e.target.value) || 0)}
                                className="w-12 text-center bg-black/40 border border-white/10 text-white font-mono text-xs py-0.5 rounded focus:outline-none"
                              />
                              <span className="font-mono text-xs text-white/40">/ {ex.target}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateProgress(idx, ex.current + 10)}
                                className="px-1.5 py-0.5 bg-purple-950/20 border border-purple-500/20 text-[9px] font-mono text-purple-400 hover:bg-purple-950/40"
                              >
                                +10
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateProgress(idx, ex.target)}
                                className="px-1.5 py-0.5 bg-green-950/20 border border-green-500/20 text-[9px] font-mono text-green-400 hover:bg-green-950/40"
                              >
                                MAX
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Muscle group SVG Silhouette Heatmap */}
          <div className="glass-panel p-5 bg-void/50 border border-white/5 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 space-y-2">
              <h3 className="font-orbitron text-sm font-bold uppercase tracking-widest text-white">
                Muscle Target Heatmap
              </h3>
              <p className="font-space-mono text-[10px] text-white/40 uppercase leading-relaxed">
                Visualizing physical stress matrix based on today's logged exercises and target sets.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 font-space-mono text-[9px] uppercase">
                <div className={`flex items-center gap-2 ${muscleGroups.chest ? 'text-red-500 font-bold' : 'text-white/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${muscleGroups.chest ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`} />
                  Chest
                </div>
                <div className={`flex items-center gap-2 ${muscleGroups.back ? 'text-red-500 font-bold' : 'text-white/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${muscleGroups.back ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`} />
                  Back
                </div>
                <div className={`flex items-center gap-2 ${muscleGroups.legs ? 'text-red-500 font-bold' : 'text-white/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${muscleGroups.legs ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`} />
                  Legs
                </div>
                <div className={`flex items-center gap-2 ${muscleGroups.shoulders ? 'text-red-500 font-bold' : 'text-white/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${muscleGroups.shoulders ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`} />
                  Shoulders
                </div>
                <div className={`flex items-center gap-2 ${muscleGroups.arms ? 'text-red-500 font-bold' : 'text-white/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${muscleGroups.arms ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`} />
                  Arms
                </div>
                <div className={`flex items-center gap-2 ${muscleGroups.core ? 'text-red-500 font-bold' : 'text-white/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${muscleGroups.core ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`} />
                  Core
                </div>
              </div>
            </div>

            {/* Glowing SVG human model */}
            <div className="w-32 h-44 shrink-0 flex items-center justify-center relative bg-black/40 border border-white/5 rounded p-2">
              <svg className="w-full h-full" viewBox="0 0 100 150">
                {/* Silhouette model outline */}
                <rect x="0" y="0" width="100" height="150" fill="transparent" />
                
                {/* Head */}
                <circle cx="50" cy="18" r="8" fill={muscleGroups.shoulders ? '#ef4444' : '#1e293b'} opacity="0.8" />
                {/* Neck */}
                <rect x="47" y="24" width="6" height="6" fill="#1e293b" />
                
                {/* Torso / Chest */}
                <path d="M38,30 L62,30 L58,62 L42,62 Z" fill={muscleGroups.chest ? '#ef4444' : '#1e293b'} opacity="0.8" />
                {/* Torso / Back */}
                <path d="M43,62 L57,62 L55,75 L45,75 Z" fill={muscleGroups.back ? '#ef4444' : '#1e293b'} opacity="0.8" />
                
                {/* Shoulders */}
                <circle cx="34" cy="34" r="5" fill={muscleGroups.shoulders ? '#ef4444' : '#1e293b'} opacity="0.8" />
                <circle cx="66" cy="34" r="5" fill={muscleGroups.shoulders ? '#ef4444' : '#1e293b'} opacity="0.8" />
                
                {/* Arms */}
                <rect x="29" y="38" width="6" height="25" rx="3" fill={muscleGroups.arms ? '#ef4444' : '#1e293b'} opacity="0.8" />
                <rect x="65" y="38" width="6" height="25" rx="3" fill={muscleGroups.arms ? '#ef4444' : '#1e293b'} opacity="0.8" />
                
                {/* Core */}
                <rect x="44" y="45" width="12" height="15" fill={muscleGroups.core ? '#ef4444' : '#1e293b'} opacity="0.8" />

                {/* Legs */}
                <rect x="38" y="78" width="9" height="35" rx="4" fill={muscleGroups.legs ? '#ef4444' : '#1e293b'} opacity="0.8" />
                <rect x="53" y="78" width="9" height="35" rx="4" fill={muscleGroups.legs ? '#ef4444' : '#1e293b'} opacity="0.8" />
                
                {/* Lower legs */}
                <rect x="39" y="112" width="7" height="25" rx="2" fill={muscleGroups.legs ? '#ef4444' : '#1e293b'} opacity="0.8" />
                <rect x="54" y="112" width="7" height="25" rx="2" fill={muscleGroups.legs ? '#ef4444' : '#1e293b'} opacity="0.8" />
              </svg>
            </div>
          </div>

          {/* Historical Body Weight goal tracking chart */}
          <div className="glass-panel p-5 bg-void/50 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#00D4FF]" /> Body Weight Trajectory
              </h3>
              <span className="font-space-mono text-[9px] text-[#00D4FF] font-bold">Goal: 75.0kg</span>
            </div>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightHistory}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#444" tick={{ fill: '#777', fontSize: 9, fontFamily: 'Space Mono' }} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="#444" tick={{ fill: '#777', fontSize: 9, fontFamily: 'Space Mono' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#080D1A', border: '1px solid #00D4FF', fontFamily: 'Space Mono', fontSize: 10 }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="#00D4FF" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Output Chart */}
          <div className="p-5" style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,90,0,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-base font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                <TrendingUp className="w-4 h-4 text-[#ff5a00]" /> Weekly Output
              </h3>
              <span className="font-space-mono text-xs text-white/30">{thisWeekSessions} active days</span>
            </div>
            <div className="h-44 w-full" aria-label="Weekly physical conditioning output bar chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChart} barSize={24} aria-label="Weekly physical output Bar Chart">
                  <XAxis dataKey="day" stroke="#333" tick={{ fill: '#666', fontSize: 10, fontFamily: 'Space Mono' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,90,0,0.06)' }}
                    contentStyle={{ background: '#080D1A', border: '1px solid #ff5a00', fontFamily: 'Space Mono', fontSize: 11 }}
                  />
                  <Bar dataKey="xp" radius={[2, 2, 0, 0]}>
                    {weeklyChart.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.date === TODAY ? '#ff5a00' : entry.xp > 0 ? '#ff5a0066' : '#1a1a1a'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Training Archives */}
          <div className="p-5" style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,90,0,0.15)' }}>
            <h3 className="font-orbitron text-base font-bold uppercase tracking-widest flex items-center gap-2 text-white mb-4">
              <Flame className="w-4 h-4 text-[#ff5a00]" /> Training Archives
              <span className="font-space-mono text-xs text-white/20 font-normal normal-case ml-1">{totalSessions} records</span>
            </h3>

            {logsLoading ? (
              <div className="space-y-2">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : logs.length === 0 ? (
              <EmptyState
                icon={Dumbbell}
                title="No Conditioning Records"
                description="Initialize your body conditioning sequence. Log your first workout to start tracking and earn XP."
              />
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 hide-scrollbar">
                <AnimatePresence>
                  {logs.map((log, idx) => {
                    const intensityColor = INTENSITY_COLOR[log.metadata?.intensity] ?? '#ff5a00';
                    const icon = TYPE_ICON[log.activity_type] ?? '🏋️';
                    const date = new Date(log.created_at);
                    const isToday = log.created_at.startsWith(TODAY);
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                        className="flex items-center gap-4 p-3 transition-all"
                        style={{
                          background: isToday ? 'rgba(255,90,0,0.07)' : 'rgba(0,0,0,0.35)',
                          border: `1px solid ${isToday ? 'rgba(255,90,0,0.3)' : 'rgba(255,255,255,0.04)'}`,
                          borderLeft: `3px solid ${intensityColor}`,
                        }}
                      >
                        <span className="text-xl flex-shrink-0 w-8 text-center">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-archivo-narrow text-base text-white leading-tight">{log.activity_type}</p>
                            {isToday && (
                              <span className="font-space-mono text-[9px] px-1.5 py-0.5 uppercase" style={{ background: 'rgba(255,90,0,0.2)', color: '#ff5a00', border: '1px solid rgba(255,90,0,0.4)' }}>Today</span>
                            )}
                          </div>
                          <p className="font-space-mono text-[10px] text-white/30 mt-0.5">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} •{' '}
                            {log.metadata?.intensity || 'Medium'} intensity
                            {log.metadata?.notes ? ` • ${log.metadata.notes}` : ''}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right space-y-0.5">
                          <div className="font-space-mono text-sm text-white/60">{log.duration_minutes}m</div>
                          <div
                            className="font-orbitron text-xs font-bold px-2 py-0.5"
                            style={{ background: 'rgba(255,90,0,0.12)', color: '#ff5a00', border: '1px solid rgba(255,90,0,0.3)' }}
                          >
                            +{log.xp_earned} XP
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Second Body Protocol */}
      <div className="lazy-section">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(255,90,0,0.4), transparent)' }} />
          <span className="font-space-mono text-xs text-red-500/60 uppercase tracking-[0.4em]">Second Body Protocol</span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(255,90,0,0.4), transparent)' }} />
        </div>
        <SecondBodyProtocol currentLevel={currentLevel} />
      </div>

    </motion.div>
  );
}
