// =============================================================
// Stretch Pose & Routine Library — 30 Poses, 8 Routines
// =============================================================
//
// Each pose includes:
//  • Primary + secondary body regions
//  • Timed holds (not reps)
//  • Breathing & depth cues
//  • Easier/harder modifications
//  • Safety contraindications
//  • Tutorial video links
//
// Routines scaled to 3 difficulty tiers via hold multipliers.
// =============================================================

import type {
  StretchPose,
  StretchRoutine,
  StretchRoutinePose,
  StretchCategory,
  StretchDifficulty,
  STRETCH_PROGRESSION,
} from '@/types/stretch';

// ── ID Generator ──────────────────────────────────────────────

let _id = 0;
function pose(p: Omit<StretchPose, 'id' | 'slug'>): StretchPose {
  _id++;
  return {
    ...p,
    id: `sp_${String(_id).padStart(3, '0')}`,
    slug: p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  };
}

// ══════════════════════════════════════════════════════════════
// NECK & SHOULDERS
// ══════════════════════════════════════════════════════════════

export const NECK_TILT = pose({
  name: 'Neck Side Tilt',
  phase: 'hold',
  primaryRegion: 'neck',
  secondaryRegions: ['shoulders'],
  difficulty: 'beginner',
  holdSeconds: 20,
  transitionSeconds: 5,
  sidesCount: 2,
  instructions: [
    'Sit or stand tall with shoulders relaxed',
    'Slowly tilt your head toward your right shoulder',
    'Let gravity do the work — no pulling',
    'Hold, then repeat on the left side',
  ],
  breathingCue: 'Breathe slowly through your nose; exhale to deepen the stretch',
  depthCue: 'Mild pull along the side of your neck — stop if there\'s any pain',
  modifications: {
    easier: 'Place opposite hand on thigh for stability',
    harder: 'Gently rest hand on top of head for added weight',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=wQylqaCl8Zo',
  contraindications: ['Cervical disc issues', 'Recent neck injury'],
  commonMistakes: ['Shrugging the opposite shoulder', 'Forcing the head down'],
});

export const SHOULDER_CROSS = pose({
  name: 'Cross-Body Shoulder Stretch',
  phase: 'hold',
  primaryRegion: 'shoulders',
  secondaryRegions: ['upper_back'],
  difficulty: 'beginner',
  holdSeconds: 25,
  transitionSeconds: 5,
  sidesCount: 2,
  instructions: [
    'Extend your right arm across your chest',
    'Use your left hand to gently press it closer',
    'Keep the shoulder down — don\'t let it hike up',
    'Hold, then switch arms',
  ],
  breathingCue: 'Deep breaths — relax the shoulder with each exhale',
  depthCue: 'Comfortable pull in the back of your shoulder',
  modifications: {
    easier: 'Hold at elbow instead of forearm',
    harder: 'Simultaneously tilt head away from the arm',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=WOr5hFnIKmI',
  contraindications: ['Shoulder impingement'],
  commonMistakes: ['Hiking the shoulder toward the ear'],
});

export const THREAD_NEEDLE = pose({
  name: 'Thread the Needle',
  phase: 'hold',
  primaryRegion: 'upper_back',
  secondaryRegions: ['shoulders', 'neck'],
  difficulty: 'intermediate',
  holdSeconds: 25,
  transitionSeconds: 6,
  sidesCount: 2,
  instructions: [
    'Start on all fours in tabletop position',
    'Slide your right arm under your body to the left',
    'Lower your right shoulder and temple to the floor',
    'Hold, breathe, then switch sides',
  ],
  breathingCue: 'Inhale to lengthen, exhale to rotate deeper',
  depthCue: 'Mild twist through the thoracic spine',
  modifications: {
    easier: 'Use a pillow under your head for support',
    harder: 'Reach top arm overhead for a deeper twist',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=4rFnpLjYbJQ',
  contraindications: ['Acute shoulder injury'],
  commonMistakes: ['Collapsing the hips — keep them stacked over knees'],
});

// ══════════════════════════════════════════════════════════════
// CHEST & UPPER BODY
// ══════════════════════════════════════════════════════════════

export const DOORWAY_CHEST = pose({
  name: 'Doorway Chest Stretch',
  phase: 'hold',
  primaryRegion: 'chest',
  secondaryRegions: ['shoulders'],
  difficulty: 'beginner',
  holdSeconds: 25,
  transitionSeconds: 5,
  sidesCount: 2,
  instructions: [
    'Stand in a doorway with arms in a goalpost position',
    'Step one foot forward through the door',
    'Lean forward until you feel a stretch in the chest',
    'Hold, then switch which foot is forward',
  ],
  breathingCue: 'Open your chest wider with each inhale',
  depthCue: 'Gentle pull across the front of your chest and shoulders',
  modifications: {
    easier: 'Start with arms lower on the doorframe',
    harder: 'Raise arms higher for more stretch on the upper chest',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=SIh6pVCJ-W8',
  contraindications: ['Shoulder dislocation history'],
  commonMistakes: ['Arching the lower back — keep core engaged'],
});

export const WRIST_CIRCLES = pose({
  name: 'Wrist Circles & Flexion',
  phase: 'dynamic',
  primaryRegion: 'wrists',
  secondaryRegions: [],
  difficulty: 'beginner',
  holdSeconds: 20,
  transitionSeconds: 3,
  sidesCount: 1,
  instructions: [
    'Extend arms in front with fingers spread',
    'Circle wrists clockwise 10 times',
    'Circle counter-clockwise 10 times',
    'Finish by pulling fingers back gently with other hand',
  ],
  breathingCue: 'Natural breathing throughout',
  depthCue: 'Move through full range of motion without forcing',
  modifications: {
    easier: 'Smaller circles at slow speed',
    harder: 'Add finger extension holds between circles',
  },
  contraindications: ['Carpal tunnel — reduce range'],
  commonMistakes: ['Rushing through the movement'],
});

// ══════════════════════════════════════════════════════════════
// BACK & SPINE
// ══════════════════════════════════════════════════════════════

export const CAT_COW = pose({
  name: 'Cat-Cow',
  phase: 'dynamic',
  primaryRegion: 'lower_back',
  secondaryRegions: ['upper_back', 'core'],
  difficulty: 'beginner',
  holdSeconds: 30,
  transitionSeconds: 5,
  sidesCount: 1,
  instructions: [
    'Start on all fours, wrists under shoulders, knees under hips',
    'Inhale: arch your back, drop belly, lift head (Cow)',
    'Exhale: round your spine, tuck chin, push floor away (Cat)',
    'Flow between positions with your breath',
  ],
  breathingCue: 'Inhale = Cow (open), Exhale = Cat (round)',
  depthCue: 'Smooth, controlled movement — no jerking',
  modifications: {
    easier: 'Smaller range of motion',
    harder: 'Pause 3 seconds at each end position',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=kqnua4rHVVA',
  contraindications: ['Acute disc herniation'],
  commonMistakes: ['Moving only the head instead of the whole spine'],
});

export const CHILDS_POSE = pose({
  name: 'Child\'s Pose',
  phase: 'hold',
  primaryRegion: 'lower_back',
  secondaryRegions: ['hips', 'shoulders'],
  difficulty: 'beginner',
  holdSeconds: 30,
  transitionSeconds: 5,
  sidesCount: 1,
  instructions: [
    'Kneel with big toes touching, knees wide',
    'Sit back on your heels',
    'Walk your hands forward and lower your chest',
    'Rest your forehead on the mat and relax',
  ],
  breathingCue: 'Long, slow belly breaths into your back ribs',
  depthCue: 'Full relaxation — let gravity pull you down',
  modifications: {
    easier: 'Place a pillow between thighs and calves',
    harder: 'Walk hands to one side for a lateral stretch',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=2MJGg-dUKh0',
  contraindications: ['Knee injury — use padding'],
  commonMistakes: ['Not sitting far back enough on the heels'],
});

export const SEATED_TWIST = pose({
  name: 'Seated Spinal Twist',
  phase: 'hold',
  primaryRegion: 'lower_back',
  secondaryRegions: ['upper_back', 'hips'],
  difficulty: 'intermediate',
  holdSeconds: 25,
  transitionSeconds: 6,
  sidesCount: 2,
  instructions: [
    'Sit tall with legs extended',
    'Cross right foot over left knee, foot flat',
    'Place left elbow outside right knee',
    'Gently rotate torso to the right, looking over your shoulder',
  ],
  breathingCue: 'Inhale to lengthen spine, exhale to twist deeper',
  depthCue: 'Twist from mid-back, not by leveraging with your arm',
  modifications: {
    easier: 'Keep bottom leg bent',
    harder: 'Bind — reach right hand behind to clasp left wrist',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=deqGSS0cqE4',
  contraindications: ['Herniated disc — reduce rotation'],
  commonMistakes: ['Rounding the upper back instead of sitting tall'],
});

// ══════════════════════════════════════════════════════════════
// HIPS & GLUTES
// ══════════════════════════════════════════════════════════════

export const PIGEON_POSE = pose({
  name: 'Pigeon Pose',
  phase: 'hold',
  primaryRegion: 'hips',
  secondaryRegions: ['glutes'],
  difficulty: 'intermediate',
  holdSeconds: 30,
  transitionSeconds: 8,
  sidesCount: 2,
  instructions: [
    'From all fours, bring right knee behind right wrist',
    'Slide left leg back, straighten it',
    'Square your hips forward',
    'Fold forward over your front shin if comfortable',
  ],
  breathingCue: 'Breathe into the tight hip — soften with each exhale',
  depthCue: 'Deep stretch in the outer hip; back off if there\'s knee pain',
  modifications: {
    easier: 'Place a block or pillow under the front hip',
    harder: 'Reach back and pull your rear foot toward your glutes (King Pigeon)',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=_CxeOJZdFoc',
  contraindications: ['Knee injury on front leg'],
  commonMistakes: ['Tilting hips to one side'],
});

export const HIP_FLEXOR_LUNGE = pose({
  name: 'Low Lunge Hip Flexor Stretch',
  phase: 'hold',
  primaryRegion: 'hips',
  secondaryRegions: ['quads'],
  difficulty: 'beginner',
  holdSeconds: 25,
  transitionSeconds: 6,
  sidesCount: 2,
  instructions: [
    'Step your right foot forward into a low lunge',
    'Drop left knee to the floor (pad if needed)',
    'Shift hips forward until you feel a stretch in the left hip',
    'Keep torso upright with core engaged',
  ],
  breathingCue: 'Exhale to press hips forward gently',
  depthCue: 'Stretch across the front of the back hip',
  modifications: {
    easier: 'Keep hands on front knee for support',
    harder: 'Raise arms overhead and lean slightly back',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=UGEpQ1BRx-4',
  contraindications: ['Recent hip replacement'],
  commonMistakes: ['Front knee passing over the toe'],
});

export const FIGURE_FOUR = pose({
  name: 'Figure Four (Supine)',
  phase: 'hold',
  primaryRegion: 'glutes',
  secondaryRegions: ['hips', 'lower_back'],
  difficulty: 'beginner',
  holdSeconds: 25,
  transitionSeconds: 5,
  sidesCount: 2,
  instructions: [
    'Lie on your back with knees bent, feet flat',
    'Cross right ankle over left knee',
    'Thread hands behind left thigh and pull toward chest',
    'Keep head and shoulders on the floor',
  ],
  breathingCue: 'Relax with slow breaths — let the hip open',
  depthCue: 'Deep stretch in the right glute / piriformis area',
  modifications: {
    easier: 'Keep the bottom foot on the floor instead of pulling in',
    harder: 'Straighten the bottom leg for more intensity',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=C-3oyrUMOGo',
  contraindications: ['Knee instability on the crossed leg'],
  commonMistakes: ['Lifting head off the floor — use a pillow if needed'],
});

export const BUTTERFLY = pose({
  name: 'Butterfly / Bound Angle',
  phase: 'hold',
  primaryRegion: 'hips',
  secondaryRegions: ['glutes', 'lower_back'],
  difficulty: 'beginner',
  holdSeconds: 30,
  transitionSeconds: 5,
  sidesCount: 1,
  instructions: [
    'Sit tall with soles of feet together, knees out',
    'Hold your feet or ankles',
    'Gently press knees toward the floor with your elbows',
    'Fold forward from the hips for a deeper stretch',
  ],
  breathingCue: 'Exhale to fold forward; inhale to lengthen',
  depthCue: 'Inner thigh and groin stretch — mild to moderate',
  modifications: {
    easier: 'Sit on a folded blanket to elevate hips',
    harder: 'Walk hands far forward and rest forehead on feet',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=rTFJx0UJkIo',
  contraindications: ['Groin strain'],
  commonMistakes: ['Rounding the back instead of hinging at the hips'],
});

// ══════════════════════════════════════════════════════════════
// LEGS — QUADS, HAMSTRINGS, CALVES
// ══════════════════════════════════════════════════════════════

export const STANDING_QUAD = pose({
  name: 'Standing Quad Stretch',
  phase: 'hold',
  primaryRegion: 'quads',
  secondaryRegions: ['hips'],
  difficulty: 'beginner',
  holdSeconds: 25,
  transitionSeconds: 5,
  sidesCount: 2,
  instructions: [
    'Stand tall, hold a wall or chair for balance',
    'Bend your right knee and grab your right foot behind you',
    'Pull heel toward glute keeping knees together',
    'Hold, then switch',
  ],
  breathingCue: 'Steady breathing — push hips slightly forward',
  depthCue: 'Front of the thigh — stop before knee pain',
  modifications: {
    easier: 'Use a strap or towel if you can\'t reach your foot',
    harder: 'Let go of the wall and balance freely',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=jRBJQsYQyY0',
  contraindications: ['Acute knee injury'],
  commonMistakes: ['Arching the lower back — tuck pelvis under'],
});

export const FORWARD_FOLD = pose({
  name: 'Standing Forward Fold',
  phase: 'hold',
  primaryRegion: 'hamstrings',
  secondaryRegions: ['lower_back', 'calves'],
  difficulty: 'beginner',
  holdSeconds: 25,
  transitionSeconds: 5,
  sidesCount: 1,
  instructions: [
    'Stand with feet hip-width apart',
    'Hinge at the hips and fold forward',
    'Let arms hang or hold opposite elbows',
    'Relax your head and neck completely',
  ],
  breathingCue: 'Exhale to fold deeper; let gravity assist',
  depthCue: 'Stretch through the entire back of the legs',
  modifications: {
    easier: 'Bend knees generously',
    harder: 'Straighten legs completely and grab behind ankles',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=HAZ0GkPICKQ',
  contraindications: ['Severe lower back injury'],
  commonMistakes: ['Rounding upper back instead of hinging at hips'],
});

export const SEATED_HAMSTRING = pose({
  name: 'Seated Hamstring Stretch',
  phase: 'hold',
  primaryRegion: 'hamstrings',
  secondaryRegions: ['lower_back'],
  difficulty: 'beginner',
  holdSeconds: 25,
  transitionSeconds: 5,
  sidesCount: 2,
  instructions: [
    'Sit with right leg extended, left foot against inner right thigh',
    'Reach toward your right foot with both hands',
    'Keep your back as straight as possible',
    'Hold, then switch legs',
  ],
  breathingCue: 'Inhale to lengthen, exhale to reach further',
  depthCue: 'Stretch along the back of the extended leg',
  modifications: {
    easier: 'Use a strap around the foot',
    harder: 'Fold chest completely over the leg',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=FDwpEdRxZJQ',
  contraindications: ['Hamstring tear — be very gentle'],
  commonMistakes: ['Locking the knee on the extended leg'],
});

export const CALF_WALL = pose({
  name: 'Wall Calf Stretch',
  phase: 'hold',
  primaryRegion: 'calves',
  secondaryRegions: ['ankles'],
  difficulty: 'beginner',
  holdSeconds: 20,
  transitionSeconds: 5,
  sidesCount: 2,
  instructions: [
    'Face a wall with hands at shoulder height',
    'Step right foot back, keeping it straight and heel down',
    'Bend the front knee and lean into the wall',
    'Hold, then switch legs',
  ],
  breathingCue: 'Steady breathing while pressing the heel down',
  depthCue: 'Stretch along the lower back of the leg',
  modifications: {
    easier: 'Shorter stance — foot closer to the wall',
    harder: 'Drop hips lower and press harder into the wall',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=k5YH92l7BbA',
  contraindications: ['Achilles tendon tear'],
  commonMistakes: ['Letting the back heel lift off the floor'],
});

// ══════════════════════════════════════════════════════════════
// CORE & FULL BODY
// ══════════════════════════════════════════════════════════════

export const COBRA_POSE = pose({
  name: 'Cobra Pose',
  phase: 'hold',
  primaryRegion: 'core',
  secondaryRegions: ['chest', 'lower_back'],
  difficulty: 'beginner',
  holdSeconds: 20,
  transitionSeconds: 5,
  sidesCount: 1,
  instructions: [
    'Lie face down with palms under shoulders',
    'Press up, lifting chest off the floor',
    'Keep hips on the mat with elbows slightly bent',
    'Look forward with shoulders down away from ears',
  ],
  breathingCue: 'Inhale as you rise, hold with steady breaths',
  depthCue: 'Gentle back extension — not a deep backbend',
  modifications: {
    easier: 'Baby cobra — only lift head and chest slightly',
    harder: 'Full cobra with arms fully extended (Upward Dog)',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=JDcdhTuycOI',
  contraindications: ['Acute lower back injury', 'Pregnancy'],
  commonMistakes: ['Shrugging shoulders up to ears'],
});

export const DOWNWARD_DOG_STRETCH = pose({
  name: 'Downward Dog',
  phase: 'hold',
  primaryRegion: 'full_body',
  secondaryRegions: ['hamstrings', 'calves', 'shoulders', 'upper_back'],
  difficulty: 'intermediate',
  holdSeconds: 30,
  transitionSeconds: 6,
  sidesCount: 1,
  instructions: [
    'Start on all fours',
    'Push hips up and back into an inverted V',
    'Press heels toward the floor',
    'Spread fingers wide, head between biceps',
  ],
  breathingCue: 'Breathe deeply; pedal feet to warm up calves',
  depthCue: 'Length through the spine is more important than straight legs',
  modifications: {
    easier: 'Keep knees bent generously',
    harder: 'Lift one leg to the sky for Three-Legged Dog',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=j97SSGBBiR4',
  contraindications: ['Wrist injury — use fists or forearm variation'],
  commonMistakes: ['Rounding the back — focus on pushing hips back'],
});

export const DEEP_SQUAT_HOLD = pose({
  name: 'Deep Squat Hold (Malasana)',
  phase: 'hold',
  primaryRegion: 'hips',
  secondaryRegions: ['ankles', 'lower_back', 'glutes'],
  difficulty: 'intermediate',
  holdSeconds: 25,
  transitionSeconds: 6,
  sidesCount: 1,
  instructions: [
    'Stand with feet shoulder-width, toes turned out slightly',
    'Squat down as deep as comfortable',
    'Press elbows against inner knees with palms together',
    'Keep chest lifted and spine long',
  ],
  breathingCue: 'Slow breaths — use each exhale to sink deeper',
  depthCue: 'If heels lift, place something under them for support',
  modifications: {
    easier: 'Hold onto a doorframe or pole for balance',
    harder: 'Add a gentle twist by reaching one arm to the sky',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=9DVYOsL3Kzc',
  contraindications: ['Knee injury', 'Ankle impingement'],
  commonMistakes: ['Rounding the back — push chest forward'],
});

// ══════════════════════════════════════════════════════════════
// BREATHING / TRANSITION POSES
// ══════════════════════════════════════════════════════════════

export const BOX_BREATHING = pose({
  name: 'Box Breathing',
  phase: 'breathing',
  primaryRegion: 'full_body',
  secondaryRegions: [],
  difficulty: 'beginner',
  holdSeconds: 30,
  transitionSeconds: 3,
  sidesCount: 1,
  instructions: [
    'Sit comfortably with eyes closed',
    'Inhale for 4 seconds',
    'Hold breath for 4 seconds',
    'Exhale for 4 seconds',
    'Hold empty for 4 seconds — repeat',
  ],
  breathingCue: '4-4-4-4 count — let your mind settle',
  depthCue: 'No physical stretch — this is for nervous system recovery',
  modifications: {
    easier: '3-3-3-3 count',
    harder: '6-6-6-6 count',
  },
  contraindications: [],
  commonMistakes: ['Shallow breaths — breathe from the diaphragm'],
});

export const BODY_SCAN = pose({
  name: 'Body Scan Relaxation',
  phase: 'cooldown',
  primaryRegion: 'full_body',
  secondaryRegions: [],
  difficulty: 'beginner',
  holdSeconds: 40,
  transitionSeconds: 3,
  sidesCount: 1,
  instructions: [
    'Lie flat on your back (Savasana)',
    'Close your eyes and breathe naturally',
    'Mentally scan from toes to head',
    'Release any remaining tension',
  ],
  breathingCue: 'Natural, effortless breathing',
  depthCue: 'Total relaxation — sink into the floor',
  modifications: {
    easier: 'Place a pillow under your knees',
    harder: 'Extend the scan to 2 minutes',
  },
  contraindications: [],
  commonMistakes: ['Falling asleep (it\'s allowed though!)'],
});

// ══════════════════════════════════════════════════════════════
// ADVANCED POSES
// ══════════════════════════════════════════════════════════════

export const LIZARD_POSE = pose({
  name: 'Lizard Pose',
  phase: 'hold',
  primaryRegion: 'hips',
  secondaryRegions: ['hamstrings', 'quads'],
  difficulty: 'advanced',
  holdSeconds: 30,
  transitionSeconds: 8,
  sidesCount: 2,
  instructions: [
    'From low lunge, walk front foot to the outside of your hand',
    'Lower onto forearms or place hands on blocks',
    'Sink hips forward and down',
    'Hold, then switch sides',
  ],
  breathingCue: 'Long exhales to soften into the deep stretch',
  depthCue: 'Intense hip flexor and groin stretch',
  modifications: {
    easier: 'Stay on hands instead of forearms',
    harder: 'Drop back knee and tuck back toes for added hip extension',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=UQwf8NoH0Zk',
  contraindications: ['Hip labral tear', 'Groin injury'],
  commonMistakes: ['Front knee caving inward — press it outward'],
});

export const SCORPION_STRETCH = pose({
  name: 'Prone Scorpion',
  phase: 'hold',
  primaryRegion: 'lower_back',
  secondaryRegions: ['hips', 'chest'],
  difficulty: 'advanced',
  holdSeconds: 20,
  transitionSeconds: 8,
  sidesCount: 2,
  instructions: [
    'Lie face down with arms out in a T',
    'Bend right knee and lift it over your body to the left',
    'Let your right foot reach toward your left hand',
    'Keep both shoulders as close to the floor as possible',
  ],
  breathingCue: 'Breathe into the twist — don\'t force it',
  depthCue: 'Deep rotational stretch through hip and lower back',
  modifications: {
    easier: 'Don\'t cross over as far — just lift the knee',
    harder: 'Reach the foot all the way to touch opposite hand',
  },
  contraindications: ['Disc herniation', 'SI joint dysfunction'],
  commonMistakes: ['Losing shoulder contact with the floor'],
});

export const PANCAKE_STRETCH = pose({
  name: 'Pancake Stretch (Straddle)',
  phase: 'hold',
  primaryRegion: 'hamstrings',
  secondaryRegions: ['hips', 'lower_back'],
  difficulty: 'advanced',
  holdSeconds: 30,
  transitionSeconds: 8,
  sidesCount: 1,
  instructions: [
    'Sit with legs spread as wide as comfortable',
    'Keep toes pointing up and knees straight',
    'Walk hands forward, hinging at the hips',
    'Lower chest toward the ground as far as possible',
  ],
  breathingCue: 'Each exhale — walk fingers forward one more inch',
  depthCue: 'Deep inner thigh and hamstring stretch',
  modifications: {
    easier: 'Sit on a raised surface to reduce difficulty',
    harder: 'Walk chest all the way to the floor',
  },
  tutorialVideoUrl: 'https://www.youtube.com/watch?v=UbyI1eDEbmk',
  contraindications: ['Groin strain', 'Adductor tear'],
  commonMistakes: ['Rounding the back — lead with the chest'],
});

// ══════════════════════════════════════════════════════════════
// MASTER POSE LIST
// ══════════════════════════════════════════════════════════════

export const STRETCH_POSE_LIBRARY: StretchPose[] = [
  // Neck & Shoulders
  NECK_TILT,
  SHOULDER_CROSS,
  THREAD_NEEDLE,
  // Chest & Upper Body
  DOORWAY_CHEST,
  WRIST_CIRCLES,
  // Back & Spine
  CAT_COW,
  CHILDS_POSE,
  SEATED_TWIST,
  // Hips & Glutes
  PIGEON_POSE,
  HIP_FLEXOR_LUNGE,
  FIGURE_FOUR,
  BUTTERFLY,
  // Legs
  STANDING_QUAD,
  FORWARD_FOLD,
  SEATED_HAMSTRING,
  CALF_WALL,
  // Core & Full Body
  COBRA_POSE,
  DOWNWARD_DOG_STRETCH,
  DEEP_SQUAT_HOLD,
  // Breathing/Cooldown
  BOX_BREATHING,
  BODY_SCAN,
  // Advanced
  LIZARD_POSE,
  SCORPION_STRETCH,
  PANCAKE_STRETCH,
];

// ── Lookup Helpers ────────────────────────────────────────────

export function getStretchPoseById(id: string): StretchPose | undefined {
  return STRETCH_POSE_LIBRARY.find(p => p.id === id);
}

export function getStretchPoseBySlug(slug: string): StretchPose | undefined {
  return STRETCH_POSE_LIBRARY.find(p => p.slug === slug);
}

// ── Routine Builder ───────────────────────────────────────────

function buildRoutine(
  config: Omit<StretchRoutine, 'id' | 'poses' | 'estimatedMinutes'> & { poseRefs: StretchPose[] },
): StretchRoutine {
  const poses: StretchRoutinePose[] = config.poseRefs.map((p, i) => ({
    poseId: p.id,
    pose: p,
    orderIndex: i,
    holdSeconds: p.holdSeconds,
    transitionSeconds: p.transitionSeconds,
  }));

  const totalSeconds = poses.reduce(
    (sum, p) => sum + p.holdSeconds * p.pose.sidesCount + p.transitionSeconds,
    0,
  );

  return {
    ...config,
    id: `sr_${config.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
    poses,
    estimatedMinutes: Math.ceil(totalSeconds / 60),
  };
}

// ══════════════════════════════════════════════════════════════
// PRE-BUILT ROUTINES (8)
// ══════════════════════════════════════════════════════════════

export const MORNING_WAKE_UP = buildRoutine({
  title: 'Morning Wake-Up',
  subtitle: '5 min to start your day right',
  category: 'morning',
  difficulty: 'beginner',
  description: 'Gentle poses to wake up your body and mind. Perfect for earning the morning stretch bonus XP.',
  benefits: ['Improved circulation', 'Reduced stiffness', 'Mental clarity'],
  icon: '🌅',
  isDefault: true,
  timesCompleted: 0,
  poseRefs: [CAT_COW, NECK_TILT, SHOULDER_CROSS, FORWARD_FOLD, CHILDS_POSE, BOX_BREATHING],
});

export const FULL_BODY_FLOW = buildRoutine({
  title: 'Full Body Flow',
  subtitle: '10 min head-to-toe stretch',
  category: 'full_body',
  difficulty: 'intermediate',
  description: 'A comprehensive routine that touches every major muscle group. Great for rest days.',
  benefits: ['Total body flexibility', 'Joint mobility', 'Stress relief'],
  icon: '🧘',
  isDefault: true,
  timesCompleted: 0,
  poseRefs: [
    CAT_COW, NECK_TILT, SHOULDER_CROSS, DOORWAY_CHEST,
    DOWNWARD_DOG_STRETCH, HIP_FLEXOR_LUNGE, PIGEON_POSE,
    STANDING_QUAD, FORWARD_FOLD, SEATED_TWIST, BODY_SCAN,
  ],
});

export const DESK_BREAK = buildRoutine({
  title: 'Desk Break',
  subtitle: '3 min office-friendly reset',
  category: 'desk_break',
  difficulty: 'beginner',
  description: 'Quick stretches you can do at your desk. No mat needed.',
  benefits: ['Reduced neck tension', 'Better posture', 'Wrist relief'],
  icon: '💻',
  isDefault: true,
  timesCompleted: 0,
  poseRefs: [NECK_TILT, SHOULDER_CROSS, WRIST_CIRCLES, SEATED_TWIST],
});

export const HIP_OPENER_FLOW = buildRoutine({
  title: 'Hip Opener Flow',
  subtitle: '8 min deep hip release',
  category: 'hip_opener',
  difficulty: 'intermediate',
  description: 'Target tight hips from sitting all day. One of the most requested routines.',
  benefits: ['Hip mobility', 'Reduced lower back pain', 'Better squat depth'],
  icon: '🦋',
  isDefault: true,
  timesCompleted: 0,
  poseRefs: [
    CAT_COW, HIP_FLEXOR_LUNGE, PIGEON_POSE, BUTTERFLY,
    FIGURE_FOUR, DEEP_SQUAT_HOLD, CHILDS_POSE,
  ],
});

export const BACK_RELIEF = buildRoutine({
  title: 'Back Relief',
  subtitle: '6 min spinal care',
  category: 'back_relief',
  difficulty: 'beginner',
  description: 'Gentle stretches specifically for lower and upper back tension.',
  benefits: ['Spinal decompression', 'Reduced back pain', 'Core activation'],
  icon: '🔙',
  isDefault: true,
  timesCompleted: 0,
  poseRefs: [CAT_COW, CHILDS_POSE, COBRA_POSE, SEATED_TWIST, THREAD_NEEDLE, BODY_SCAN],
});

export const POST_WORKOUT_COOL = buildRoutine({
  title: 'Post-Workout Cooldown',
  subtitle: '7 min recovery stretch',
  category: 'post_workout',
  difficulty: 'intermediate',
  description: 'Essential cooldown after training. Speeds recovery and reduces DOMS.',
  benefits: ['Faster recovery', 'Reduced soreness', 'Improved flexibility'],
  icon: '❄️',
  isDefault: true,
  timesCompleted: 0,
  poseRefs: [
    FORWARD_FOLD, STANDING_QUAD, CALF_WALL, PIGEON_POSE,
    SEATED_HAMSTRING, CHILDS_POSE, BODY_SCAN,
  ],
});

export const ADVANCED_FLEXIBILITY = buildRoutine({
  title: 'Advanced Flexibility',
  subtitle: '12 min deep stretching',
  category: 'full_body',
  difficulty: 'advanced',
  description: 'For experienced practitioners. Deep holds at advanced ranges.',
  benefits: ['Extreme flexibility', 'Advanced mobility', 'Performance gains'],
  icon: '🤸',
  isDefault: true,
  timesCompleted: 0,
  poseRefs: [
    CAT_COW, DOWNWARD_DOG_STRETCH, LIZARD_POSE, PIGEON_POSE,
    PANCAKE_STRETCH, SCORPION_STRETCH, DEEP_SQUAT_HOLD,
    THREAD_NEEDLE, BODY_SCAN,
  ],
});

export const SLEEP_PREP = buildRoutine({
  title: 'Sleep Prep',
  subtitle: '5 min bedtime wind-down',
  category: 'sleep',
  difficulty: 'beginner',
  description: 'Calm, floor-based poses to relax your body and prepare for deep sleep.',
  benefits: ['Improved sleep quality', 'Nervous system calming', 'Tension release'],
  icon: '🌙',
  isDefault: true,
  timesCompleted: 0,
  poseRefs: [CHILDS_POSE, FIGURE_FOUR, SEATED_TWIST, BUTTERFLY, BOX_BREATHING, BODY_SCAN],
});

// ── All Routines ──────────────────────────────────────────────

export const STRETCH_ROUTINE_LIBRARY: StretchRoutine[] = [
  MORNING_WAKE_UP,
  FULL_BODY_FLOW,
  DESK_BREAK,
  HIP_OPENER_FLOW,
  BACK_RELIEF,
  POST_WORKOUT_COOL,
  ADVANCED_FLEXIBILITY,
  SLEEP_PREP,
];

export function getRoutineById(id: string): StretchRoutine | undefined {
  return STRETCH_ROUTINE_LIBRARY.find(r => r.id === id);
}

export function getRoutinesByCategory(category: StretchCategory): StretchRoutine[] {
  return STRETCH_ROUTINE_LIBRARY.filter(r => r.category === category);
}

export function getRoutinesByDifficulty(difficulty: StretchDifficulty): StretchRoutine[] {
  return STRETCH_ROUTINE_LIBRARY.filter(r => r.difficulty === difficulty);
}
