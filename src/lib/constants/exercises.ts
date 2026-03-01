// =============================================================
// Exercise Library — 40+ Exercises with Full Metadata
// =============================================================
//
// Each exercise includes:
//  • Primary + secondary muscle groups
//  • Equipment requirements
//  • Step-by-step instructions
//  • Pro tips
//  • Tutorial video links
//  • Calorie burn estimates
//  • Difficulty rating
//  • Compound vs isolation flag
// =============================================================

import { Exercise, ExerciseCategory, MuscleGroup } from '@/types/workout';

// ── Helper ────────────────────────────────────────────────────

let _id = 0;
function ex(
  partial: Omit<Exercise, 'id' | 'slug'> & { name: string },
): Exercise {
  _id++;
  return {
    ...partial,
    id: `ex_${String(_id).padStart(3, '0')}`,
    slug: partial.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  };
}

// ══════════════════════════════════════════════════════════════
// CHEST
// ══════════════════════════════════════════════════════════════

export const BENCH_PRESS = ex({
  name: 'Barbell Bench Press',
  category: 'strength',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  difficulty: 'intermediate',
  equipment: ['barbell', 'bench'],
  instructions: [
    'Lie on a flat bench with your eyes under the bar',
    'Grip the bar slightly wider than shoulder-width',
    'Unrack and lower the bar to your mid-chest',
    'Press the bar up until arms are fully extended',
    'Keep your feet flat and back slightly arched',
  ],
  tips: [
    'Retract your shoulder blades for stability',
    'Drive through your feet for leg drive',
    'Touch the bar to your chest — don\'t bounce',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  caloriesPerMinute: 6,
  isCompound: true,
  aliases: ['flat bench', 'chest press', 'BP'],
});

export const DUMBBELL_PRESS = ex({
  name: 'Dumbbell Bench Press',
  category: 'strength',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  difficulty: 'beginner',
  equipment: ['dumbbells', 'bench'],
  instructions: [
    'Lie on a flat bench with a dumbbell in each hand',
    'Start with arms extended above your chest',
    'Lower dumbbells to chest level with elbows at 45°',
    'Press back up to the starting position',
  ],
  tips: [
    'Great for building symmetry between left and right',
    'Control the descent — don\'t let gravity take over',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=VmB1G1K7v94',
  caloriesPerMinute: 5,
  isCompound: true,
  aliases: ['DB bench', 'dumbbell chest press'],
});

export const INCLINE_PRESS = ex({
  name: 'Incline Barbell Press',
  category: 'strength',
  primaryMuscle: 'chest',
  secondaryMuscles: ['shoulders', 'triceps'],
  difficulty: 'intermediate',
  equipment: ['barbell', 'incline bench'],
  instructions: [
    'Set bench to 30-45° incline',
    'Grip bar slightly wider than shoulder-width',
    'Unrack and lower to upper chest',
    'Press up and slightly back to lockout',
  ],
  tips: [
    'Targets upper chest fibers',
    '30° is generally better than 45° for chest emphasis',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=SrqOu55lrYU',
  caloriesPerMinute: 6,
  isCompound: true,
  aliases: ['incline bench', 'incline BP'],
});

export const PUSH_UP = ex({
  name: 'Push-Up',
  category: 'bodyweight',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders', 'core'],
  difficulty: 'beginner',
  equipment: ['bodyweight'],
  instructions: [
    'Start in a high plank position with hands shoulder-width',
    'Lower your body until chest nearly touches the floor',
    'Push back up to the starting position',
    'Keep your body in a straight line throughout',
  ],
  tips: [
    'Modify on knees if needed',
    'Engage your core to prevent hip sag',
    'Full range of motion > more reps',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
  caloriesPerMinute: 7,
  isCompound: true,
  aliases: ['pushup', 'press-up'],
});

export const CABLE_FLY = ex({
  name: 'Cable Fly',
  category: 'strength',
  primaryMuscle: 'chest',
  secondaryMuscles: ['shoulders'],
  difficulty: 'intermediate',
  equipment: ['cable machine'],
  instructions: [
    'Set cables at shoulder height',
    'Grab handles and step forward',
    'With slight elbow bend, bring hands together in front',
    'Slowly return to starting position with controlled stretch',
  ],
  tips: [
    'Think about hugging a large tree',
    'Squeeze at the peak contraction',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=Iwe6AmxVf7o',
  caloriesPerMinute: 4,
  isCompound: false,
  aliases: ['cable chest fly', 'cable crossover'],
});

// ══════════════════════════════════════════════════════════════
// BACK
// ══════════════════════════════════════════════════════════════

export const DEADLIFT = ex({
  name: 'Barbell Deadlift',
  category: 'strength',
  primaryMuscle: 'back',
  secondaryMuscles: ['hamstrings', 'glutes', 'core', 'forearms'],
  difficulty: 'advanced',
  equipment: ['barbell'],
  instructions: [
    'Stand with feet hip-width apart, bar over mid-foot',
    'Hinge at hips and grip bar outside knees',
    'Brace core, drive through the floor',
    'Stand tall, squeezing glutes at the top',
    'Lower with control back to the floor',
  ],
  tips: [
    'Keep the bar close to your body throughout',
    'Neutral spine — no rounding',
    'Think "push the floor away" rather than pulling',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
  caloriesPerMinute: 8,
  isCompound: true,
  aliases: ['conventional deadlift', 'DL'],
});

export const PULL_UP = ex({
  name: 'Pull-Up',
  category: 'bodyweight',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps', 'forearms', 'shoulders'],
  difficulty: 'intermediate',
  equipment: ['pull-up bar'],
  instructions: [
    'Hang from bar with overhand grip, hands shoulder-width',
    'Pull your body up until chin is above the bar',
    'Lower with control to full arm extension',
  ],
  tips: [
    'Start with assisted or negative reps if needed',
    'Engage lats by pulling elbows down',
    'Avoid swinging or kipping for strict form',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
  caloriesPerMinute: 8,
  isCompound: true,
  aliases: ['pullup', 'chin-up (overhand)'],
});

export const BARBELL_ROW = ex({
  name: 'Barbell Bent-Over Row',
  category: 'strength',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps', 'shoulders', 'core'],
  difficulty: 'intermediate',
  equipment: ['barbell'],
  instructions: [
    'Hinge forward at hips with knees slightly bent',
    'Grip bar shoulder-width with arms hanging',
    'Row the bar to your lower chest / upper abs',
    'Lower with control to full arm extension',
  ],
  tips: [
    'Keep torso at roughly 45° angle',
    'Squeeze shoulder blades at the top',
    'Don\'t use momentum to swing the weight',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ',
  caloriesPerMinute: 6,
  isCompound: true,
  aliases: ['bent row', 'BB row', 'Pendlay row'],
});

export const LAT_PULLDOWN = ex({
  name: 'Lat Pulldown',
  category: 'machine',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps', 'forearms'],
  difficulty: 'beginner',
  equipment: ['lat pulldown machine'],
  instructions: [
    'Sit with thighs secured under pad',
    'Grip bar wider than shoulder-width',
    'Pull bar down to upper chest',
    'Slowly return to start with arms extended',
  ],
  tips: [
    'Great pull-up alternative for beginners',
    'Think about driving elbows into your pockets',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
  caloriesPerMinute: 5,
  isCompound: true,
  aliases: ['cable pulldown', 'pulldown'],
});

// ══════════════════════════════════════════════════════════════
// SHOULDERS
// ══════════════════════════════════════════════════════════════

export const OVERHEAD_PRESS = ex({
  name: 'Overhead Press',
  category: 'strength',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['triceps', 'core'],
  difficulty: 'intermediate',
  equipment: ['barbell'],
  instructions: [
    'Unrack bar at collar-bone level',
    'Brace core and press bar overhead',
    'Lock out with bar directly over mid-foot',
    'Lower with control back to starting position',
  ],
  tips: [
    'Tuck chin slightly as bar passes your face',
    'Push head through as the bar clears',
    'Keep glutes squeezed for stability',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
  caloriesPerMinute: 6,
  isCompound: true,
  aliases: ['military press', 'shoulder press', 'OHP'],
});

export const LATERAL_RAISE = ex({
  name: 'Dumbbell Lateral Raise',
  category: 'strength',
  primaryMuscle: 'shoulders',
  secondaryMuscles: [],
  difficulty: 'beginner',
  equipment: ['dumbbells'],
  instructions: [
    'Stand with dumbbells at your sides',
    'Raise arms out to the sides until shoulder level',
    'Pause briefly at the top',
    'Lower with control',
  ],
  tips: [
    'Slight bend in elbows',
    'Lead with your elbows, not your hands',
    'Use lighter weight with strict form',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
  caloriesPerMinute: 4,
  isCompound: false,
  aliases: ['side raise', 'shoulder raise', 'lat raise'],
});

// ══════════════════════════════════════════════════════════════
// ARMS
// ══════════════════════════════════════════════════════════════

export const BARBELL_CURL = ex({
  name: 'Barbell Bicep Curl',
  category: 'strength',
  primaryMuscle: 'biceps',
  secondaryMuscles: ['forearms'],
  difficulty: 'beginner',
  equipment: ['barbell'],
  instructions: [
    'Stand with feet shoulder-width, grip bar underhand',
    'Curl the bar up keeping elbows pinned to sides',
    'Squeeze biceps at the top',
    'Lower with control to full extension',
  ],
  tips: [
    'Don\'t swing your body — strict form',
    'Control the negative portion',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=kwG2ipFRgFo',
  caloriesPerMinute: 4,
  isCompound: false,
  aliases: ['BB curl', 'standing curl'],
});

export const TRICEP_PUSHDOWN = ex({
  name: 'Cable Tricep Pushdown',
  category: 'strength',
  primaryMuscle: 'triceps',
  secondaryMuscles: [],
  difficulty: 'beginner',
  equipment: ['cable machine'],
  instructions: [
    'Stand facing cable with rope or bar attachment',
    'Keep elbows pinned at your sides',
    'Push the weight down until arms are fully extended',
    'Slowly return to starting position',
  ],
  tips: [
    'Don\'t let elbows flare out',
    'Squeeze triceps at full extension',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
  caloriesPerMinute: 3,
  isCompound: false,
  aliases: ['pushdown', 'rope pushdown', 'tricep extension'],
});

export const HAMMER_CURL = ex({
  name: 'Hammer Curl',
  category: 'strength',
  primaryMuscle: 'biceps',
  secondaryMuscles: ['forearms'],
  difficulty: 'beginner',
  equipment: ['dumbbells'],
  instructions: [
    'Hold dumbbells with neutral grip (palms facing each other)',
    'Curl up while keeping palms facing inward',
    'Squeeze at the top, lower with control',
  ],
  tips: [
    'Targets brachialis for thicker arms',
    'Keep elbows stationary throughout',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=zC3nLlEvin4',
  caloriesPerMinute: 3,
  isCompound: false,
  aliases: ['DB hammer curl', 'neutral grip curl'],
});

// ══════════════════════════════════════════════════════════════
// LEGS
// ══════════════════════════════════════════════════════════════

export const BARBELL_SQUAT = ex({
  name: 'Barbell Back Squat',
  category: 'strength',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes', 'hamstrings', 'core'],
  difficulty: 'intermediate',
  equipment: ['barbell', 'squat rack'],
  instructions: [
    'Position bar on upper traps, feet shoulder-width',
    'Brace core, push hips back and down',
    'Descend until thighs are at least parallel',
    'Drive through heels to stand back up',
  ],
  tips: [
    'Knees tracking over toes is OK',
    'Keep chest up throughout the movement',
    'Aim for depth before adding weight',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
  caloriesPerMinute: 8,
  isCompound: true,
  aliases: ['squat', 'back squat', 'BB squat'],
});

export const LEG_PRESS = ex({
  name: 'Leg Press',
  category: 'machine',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes', 'hamstrings'],
  difficulty: 'beginner',
  equipment: ['leg press machine'],
  instructions: [
    'Sit in the machine with back flat against pad',
    'Place feet shoulder-width on the platform',
    'Release safety and lower platform toward chest',
    'Push back up without locking knees',
  ],
  tips: [
    'Don\'t let your lower back round off the pad',
    'Higher foot placement → more glutes and hamstrings',
    'Lower foot placement → more quads',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
  caloriesPerMinute: 6,
  isCompound: true,
  aliases: ['seated leg press', '45° leg press'],
});

export const ROMANIAN_DEADLIFT = ex({
  name: 'Romanian Deadlift',
  category: 'strength',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: ['glutes', 'back', 'core'],
  difficulty: 'intermediate',
  equipment: ['barbell'],
  instructions: [
    'Stand with bar at hip height, feet hip-width',
    'Push hips back while keeping knees slightly bent',
    'Lower bar along your legs until you feel a hamstring stretch',
    'Drive hips forward to return to standing',
  ],
  tips: [
    'The bar should stay close to your legs the entire time',
    'Feel the stretch in your hamstrings, not your back',
    'Squeeze glutes hard at the top',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=JCXUYuzwNrM',
  caloriesPerMinute: 6,
  isCompound: true,
  aliases: ['RDL', 'stiff-leg deadlift'],
});

export const LUNGES = ex({
  name: 'Walking Lunges',
  category: 'strength',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes', 'hamstrings', 'core'],
  difficulty: 'beginner',
  equipment: ['dumbbells'],
  instructions: [
    'Hold dumbbells at sides, stand tall',
    'Step forward with one leg into a lunge',
    'Lower until both knees are at 90°',
    'Push off front foot and step through with the back leg',
  ],
  tips: [
    'Keep torso upright',
    'Front knee should track over toes',
    'Great for balance and unilateral strength',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs',
  caloriesPerMinute: 7,
  isCompound: true,
  aliases: ['lunge', 'forward lunge', 'DB lunge'],
});

export const LEG_CURL = ex({
  name: 'Lying Leg Curl',
  category: 'machine',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: ['calves'],
  difficulty: 'beginner',
  equipment: ['leg curl machine'],
  instructions: [
    'Lie face down on the machine',
    'Position pad just above your ankles',
    'Curl your legs toward your glutes',
    'Lower with control',
  ],
  tips: [
    'Don\'t let your hips rise off the pad',
    'Squeeze at peak contraction',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs',
  caloriesPerMinute: 4,
  isCompound: false,
  aliases: ['hamstring curl', 'prone leg curl'],
});

export const CALF_RAISE = ex({
  name: 'Standing Calf Raise',
  category: 'strength',
  primaryMuscle: 'calves',
  secondaryMuscles: [],
  difficulty: 'beginner',
  equipment: ['calf raise machine'],
  instructions: [
    'Stand on platform with balls of feet on the edge',
    'Rise up onto your toes as high as possible',
    'Hold the peak contraction briefly',
    'Lower slowly below the platform for a full stretch',
  ],
  tips: [
    'Full range of motion is key for calf growth',
    'Pause at the bottom for a deep stretch',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=gwLzBJYoWlI',
  caloriesPerMinute: 3,
  isCompound: false,
  aliases: ['calf raise', 'toe raise'],
});

export const HIP_THRUST = ex({
  name: 'Barbell Hip Thrust',
  category: 'strength',
  primaryMuscle: 'glutes',
  secondaryMuscles: ['hamstrings', 'core'],
  difficulty: 'intermediate',
  equipment: ['barbell', 'bench'],
  instructions: [
    'Sit on the floor with upper back against a bench',
    'Roll barbell over your hips (use a pad)',
    'Drive through heels to lift hips to full extension',
    'Lower with control',
  ],
  tips: [
    'Chin should tuck at the top',
    'Squeeze glutes hard at lockout',
    'Feet should be flat with shins vertical at the top',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=SEdqd1n0cvg',
  caloriesPerMinute: 5,
  isCompound: true,
  aliases: ['glute bridge', 'hip bridge', 'BB hip thrust'],
});

// ══════════════════════════════════════════════════════════════
// CORE
// ══════════════════════════════════════════════════════════════

export const PLANK = ex({
  name: 'Plank',
  category: 'bodyweight',
  primaryMuscle: 'core',
  secondaryMuscles: ['shoulders'],
  difficulty: 'beginner',
  equipment: ['bodyweight'],
  instructions: [
    'Get into a push-up position on your forearms',
    'Keep your body in a straight line from head to heels',
    'Engage your core and hold the position',
    'Don\'t let your hips sag or pike up',
  ],
  tips: [
    'Start with 20-30 seconds and build up',
    'Squeeze your glutes for stability',
    'Breathe normally throughout',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
  caloriesPerMinute: 4,
  isCompound: false,
  aliases: ['forearm plank', 'front plank'],
});

export const HANGING_LEG_RAISE = ex({
  name: 'Hanging Leg Raise',
  category: 'bodyweight',
  primaryMuscle: 'core',
  secondaryMuscles: ['forearms'],
  difficulty: 'advanced',
  equipment: ['pull-up bar'],
  instructions: [
    'Hang from a bar with arms extended',
    'Raise legs until parallel to the floor (or higher)',
    'Lower with control — no swinging',
  ],
  tips: [
    'Bend knees if straight leg version is too hard',
    'Focus on curling your pelvis up',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=hdng3Nm1x_E',
  caloriesPerMinute: 5,
  isCompound: false,
  aliases: ['leg raise', 'knee raise'],
});

export const RUSSIAN_TWIST = ex({
  name: 'Russian Twist',
  category: 'bodyweight',
  primaryMuscle: 'core',
  secondaryMuscles: [],
  difficulty: 'beginner',
  equipment: ['bodyweight'],
  instructions: [
    'Sit on the floor with knees bent, feet slightly raised',
    'Lean back slightly to engage your core',
    'Rotate torso to tap the floor on each side',
  ],
  tips: [
    'Add a weight or medicine ball for more challenge',
    'Keep your core tight and don\'t round your back',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=wkD8rjkodUI',
  caloriesPerMinute: 5,
  isCompound: false,
  aliases: ['seated twist', 'oblique twist'],
});

// ══════════════════════════════════════════════════════════════
// CARDIO / HIIT
// ══════════════════════════════════════════════════════════════

export const BURPEES = ex({
  name: 'Burpee',
  category: 'hiit',
  primaryMuscle: 'full_body',
  secondaryMuscles: ['chest', 'core', 'quads'],
  difficulty: 'intermediate',
  equipment: ['bodyweight'],
  instructions: [
    'Stand, then drop into a squat with hands on the floor',
    'Jump or step feet back into a plank',
    'Perform a push-up (optional)',
    'Jump feet back to hands',
    'Explode upward into a jump with arms overhead',
  ],
  tips: [
    'Step back instead of jumping for lower impact',
    'Keep a consistent pace — it\'s a marathon not a sprint',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=dZgVxmf6jkA',
  caloriesPerMinute: 10,
  isCompound: true,
  aliases: ['burpees'],
});

export const JUMP_ROPE = ex({
  name: 'Jump Rope',
  category: 'cardio',
  primaryMuscle: 'cardio',
  secondaryMuscles: ['calves', 'shoulders'],
  difficulty: 'beginner',
  equipment: ['jump rope'],
  instructions: [
    'Hold rope handles at hip height',
    'Swing rope over your head',
    'Jump with both feet just high enough to clear the rope',
    'Land softly on the balls of your feet',
  ],
  tips: [
    'Keep elbows close to body, use wrists to turn the rope',
    'Start with 30 seconds on, 30 seconds rest',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=u3zgHI8QnqE',
  caloriesPerMinute: 12,
  isCompound: false,
  aliases: ['skipping rope', 'skip rope'],
});

export const MOUNTAIN_CLIMBERS = ex({
  name: 'Mountain Climbers',
  category: 'hiit',
  primaryMuscle: 'core',
  secondaryMuscles: ['quads', 'shoulders', 'cardio'],
  difficulty: 'beginner',
  equipment: ['bodyweight'],
  instructions: [
    'Start in a high plank position',
    'Drive one knee toward your chest',
    'Quickly switch legs in a running motion',
    'Keep hips level and core engaged',
  ],
  tips: [
    'Speed up for cardio, slow down to target core more',
    'Keep shoulders directly over wrists',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM',
  caloriesPerMinute: 10,
  isCompound: true,
  aliases: ['climbers', 'running plank'],
});

export const KETTLEBELL_SWING = ex({
  name: 'Kettlebell Swing',
  category: 'strength',
  primaryMuscle: 'glutes',
  secondaryMuscles: ['hamstrings', 'core', 'shoulders', 'cardio'],
  difficulty: 'intermediate',
  equipment: ['kettlebell'],
  instructions: [
    'Stand with feet wider than shoulder-width',
    'Hinge at hips and swing kettlebell between legs',
    'Drive hips forward explosively to swing bell to chest height',
    'Let the bell fall naturally and hinge again',
  ],
  tips: [
    'This is a HIP movement, not a squat or arm lift',
    'Snap your hips — the arms just guide the bell',
    'Keep your core braced throughout',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=YSxHifyI6s8',
  caloriesPerMinute: 9,
  isCompound: true,
  aliases: ['KB swing', 'Russian swing'],
});

export const BOX_JUMP = ex({
  name: 'Box Jump',
  category: 'plyometric',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes', 'calves', 'core'],
  difficulty: 'intermediate',
  equipment: ['plyo box'],
  instructions: [
    'Stand facing a sturdy box or platform',
    'Swing arms back and hinge slightly at the hips',
    'Explode upward, landing softly on top of the box',
    'Stand fully, then step back down',
  ],
  tips: [
    'Start with a low box height and build up',
    'Land softly — absorb with your legs',
    'Step down rather than jumping down to save knee stress',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=52r_Ul5k03g',
  caloriesPerMinute: 8,
  isCompound: true,
  aliases: ['box jumps', 'plyo jump'],
});

// ══════════════════════════════════════════════════════════════
// ADDITIONAL COMPOUND MOVEMENTS
// ══════════════════════════════════════════════════════════════

export const DIPS = ex({
  name: 'Dips',
  category: 'bodyweight',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  difficulty: 'intermediate',
  equipment: ['dip station'],
  instructions: [
    'Grip parallel bars and hoist yourself up',
    'Lean slightly forward for chest emphasis',
    'Lower until elbows are at 90° or below',
    'Push back up to full lockout',
  ],
  tips: [
    'More forward lean = more chest, upright = more triceps',
    'Add weight with a dip belt once bodyweight feels easy',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As',
  caloriesPerMinute: 7,
  isCompound: true,
  aliases: ['parallel bar dips', 'chest dips'],
});

export const FACE_PULL = ex({
  name: 'Face Pull',
  category: 'strength',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['back'],
  difficulty: 'beginner',
  equipment: ['cable machine', 'rope attachment'],
  instructions: [
    'Set cable at upper chest height with rope attachment',
    'Pull toward your face, separating the rope ends',
    'Squeeze shoulder blades together at the back',
    'Slowly return to start',
  ],
  tips: [
    'Essential for shoulder health and posture',
    'External rotation at the end: "show your biceps"',
    'Use lighter weight, focus on squeezing',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
  caloriesPerMinute: 3,
  isCompound: false,
  aliases: ['cable face pull', 'rear delt pull'],
});

// ══════════════════════════════════════════════════════════════
// FLEXIBILITY / STRETCHING
// ══════════════════════════════════════════════════════════════

export const DOWNWARD_DOG = ex({
  name: 'Downward Dog',
  category: 'flexibility',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: ['calves', 'shoulders', 'back'],
  difficulty: 'beginner',
  equipment: ['bodyweight'],
  instructions: [
    'Start on hands and knees',
    'Push hips up and back into an inverted V shape',
    'Press heels toward the floor',
    'Keep arms straight, head between biceps',
  ],
  tips: [
    'Bend knees if hamstrings are tight',
    'Spread fingers wide for a stable base',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=j97SSGBBiR4',
  caloriesPerMinute: 3,
  isCompound: false,
  aliases: ['adho mukha svanasana', 'down dog'],
});

export const PIGEON_STRETCH = ex({
  name: 'Pigeon Stretch',
  category: 'flexibility',
  primaryMuscle: 'glutes',
  secondaryMuscles: ['hamstrings'],
  difficulty: 'beginner',
  equipment: ['bodyweight'],
  instructions: [
    'From downward dog, bring right knee forward behind right wrist',
    'Extend left leg straight behind you',
    'Square hips toward the floor',
    'Hold for 30-60 seconds, then switch sides',
  ],
  tips: [
    'Place a cushion under your hip if flexibility is limited',
    'Excellent for hip flexor relief',
  ],
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=_CxeOJZdFoc',
  caloriesPerMinute: 2,
  isCompound: false,
  aliases: ['pigeon pose', 'hip opener'],
});

// ══════════════════════════════════════════════════════════════
// MASTER LIST
// ══════════════════════════════════════════════════════════════

export const EXERCISE_LIBRARY: Exercise[] = [
  // Chest
  BENCH_PRESS,
  DUMBBELL_PRESS,
  INCLINE_PRESS,
  PUSH_UP,
  CABLE_FLY,
  DIPS,
  // Back
  DEADLIFT,
  PULL_UP,
  BARBELL_ROW,
  LAT_PULLDOWN,
  // Shoulders
  OVERHEAD_PRESS,
  LATERAL_RAISE,
  FACE_PULL,
  // Arms
  BARBELL_CURL,
  TRICEP_PUSHDOWN,
  HAMMER_CURL,
  // Legs
  BARBELL_SQUAT,
  LEG_PRESS,
  ROMANIAN_DEADLIFT,
  LUNGES,
  LEG_CURL,
  CALF_RAISE,
  HIP_THRUST,
  // Core
  PLANK,
  HANGING_LEG_RAISE,
  RUSSIAN_TWIST,
  // Cardio / HIIT
  BURPEES,
  JUMP_ROPE,
  MOUNTAIN_CLIMBERS,
  KETTLEBELL_SWING,
  BOX_JUMP,
  // Flexibility
  DOWNWARD_DOG,
  PIGEON_STRETCH,
];

// ── Lookup Helpers ────────────────────────────────────────────

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_LIBRARY.find(e => e.id === id);
}

export function getExerciseBySlug(slug: string): Exercise | undefined {
  return EXERCISE_LIBRARY.find(e => e.slug === slug);
}

export function searchExercises(query: string): Exercise[] {
  const q = query.toLowerCase();
  return EXERCISE_LIBRARY.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.aliases.some(a => a.toLowerCase().includes(q)) ||
    e.primaryMuscle.includes(q) ||
    e.category.includes(q)
  );
}

export function getExercisesByMuscle(muscle: MuscleGroup): Exercise[] {
  return EXERCISE_LIBRARY.filter(
    e => e.primaryMuscle === muscle || e.secondaryMuscles.includes(muscle),
  );
}

export function getExercisesByCategory(category: ExerciseCategory): Exercise[] {
  return EXERCISE_LIBRARY.filter(e => e.category === category);
}

export function getExercisesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Exercise[] {
  return EXERCISE_LIBRARY.filter(e => e.difficulty === difficulty);
}

// ── Default Rest Times (seconds) ──────────────────────────────

export const DEFAULT_REST_TIMES = {
  strength_compound: 120,  // 2 min
  strength_isolation: 90,  // 1.5 min
  hypertrophy: 60,         // 1 min
  endurance: 30,           // 30 sec
  hiit: 15,                // 15 sec
  superset: 0,             // No rest between paired exercises
} as const;
