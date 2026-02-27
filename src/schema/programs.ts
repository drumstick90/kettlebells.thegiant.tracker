/**
 * Template di programmi kettlebell predefiniti
 * Modulo separato per facile estensione
 */

import type { ProgramTemplate } from './index';

export const DEFAULT_PROGRAMS: ProgramTemplate[] = [
  {
    id: 'prog-the-giant',
    type: 'the_giant',
    name: 'The Giant',
    structure: '10x10 Clean & Press',
    unit: 'reps',
    defaultWeightKg: 24,
  },
  {
    id: 'prog-simple-sinister',
    type: 'simple_sinister',
    name: 'Simple & Sinister',
    structure: '100 swings + 10 TGUs',
    unit: 'reps',
    defaultWeightKg: 24,
  },
  {
    id: 'prog-dry-fighting',
    type: 'dry_fighting_weight',
    name: 'Dry Fighting Weight',
    structure: '5x5',
    unit: 'reps',
    defaultWeightKg: 24,
  },
];
