// ─── Exercise Library ────────────────────────────────────────────────────────
// Extracted from Fitness.tsx so Vite can tree-shake/split it independently.

export interface Exercise {
  name: string;
  category: string;
  baseDifficulty: 'S' | 'A' | 'B' | 'C' | 'D';
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  type: 'weighted' | 'bodyweight' | 'cardio' | 'duration';
}

export const EXERCISE_LIBRARY: Exercise[] = [
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
  { name: "World's Greatest Stretch", category: 'Mobility', baseDifficulty: 'D', primaryMuscles: ['Full Body Mobility'],              secondaryMuscles: [],                                   equipment: 'None', type: 'duration' },
];

export const EXERCISE_CATEGORIES = [
  'All', 'Compound', 'Chest', 'Back', 'Legs', 'Shoulders',
  'Arms', 'Core', 'Calisthenics', 'Cardio', 'Martial Arts', 'Mobility'
];
