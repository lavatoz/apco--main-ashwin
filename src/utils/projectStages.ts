import type { ProjectStage } from '../types';

export type BoardProjectStage = 'Planning' | 'Shoot' | 'Editing' | 'Delivery';

export const normalizeProjectStage = (stage?: string): BoardProjectStage => {
  switch (stage) {
    case 'Shoot':
    case 'event_done':
      return 'Shoot';
    case 'Editing':
    case 'selection':
    case 'editing':
      return 'Editing';
    case 'Delivery':
    case 'delivery':
      return 'Delivery';
    case 'Planning':
    case 'booked':
    default:
      return 'Planning';
  }
};

export const getProjectStageProgress = (stage?: string): number => {
  switch (stage) {
    case 'Planning':
    case 'booked':
      return 10;
    case 'Shoot':
    case 'event_done':
      return 35;
    case 'selection':
      return 55;
    case 'Editing':
    case 'editing':
      return 80;
    case 'Delivery':
    case 'delivery':
      return 100;
    default:
      return 0;
  }
};

export const getProjectStageLabel = (stage?: string): string => {
  switch (stage) {
    case 'booked':
      return 'Event Booked';
    case 'event_done':
      return 'Production Complete';
    case 'selection':
      return 'Selection Phase';
    case 'editing':
      return 'Post-Production';
    case 'delivery':
      return 'Awaiting Delivery';
    case 'Planning':
    case 'Shoot':
    case 'Editing':
    case 'Delivery':
      return stage;
    default:
      return 'Planning';
  }
};

export const getNextProjectStage = (stage?: string): ProjectStage | null => {
  switch (stage) {
    case 'Planning':
      return 'Shoot';
    case 'Shoot':
      return 'Editing';
    case 'Editing':
      return 'Delivery';
    case 'booked':
      return 'event_done';
    case 'event_done':
      return 'selection';
    case 'selection':
      return 'editing';
    case 'editing':
      return 'delivery';
    default:
      return null;
  }
};

export const getNextProjectStageAction = (stage?: string): string | null => {
  switch (stage) {
    case 'Planning':
      return 'Start Shoot';
    case 'Shoot':
      return 'Start Editing';
    case 'Editing':
      return 'Start Delivery';
    case 'booked':
      return 'Mark Shoot Complete';
    case 'event_done':
      return 'Start Selection';
    case 'selection':
      return 'Start Editing';
    case 'editing':
      return 'Start Delivery';
    default:
      return null;
  }
};
