import type { ProjectStage, TimelineItem } from '../types';

export const WORKFLOW_STAGES = [
  'Booked',
  'Agreement Signed',
  'Advance Paid',
  'Team Assigned',
  'Shoot Completed',
  'Selection Received',
  'Editing',
  'Delivery Ready',
  'Delivered'
] as const;

export const normalizeWorkflowStage = (stage?: string): ProjectStage => {
  if (!stage) return 'Booked';
  // Legacy mapping
  if (['booked', 'Planning'].includes(stage)) return 'Booked';
  if (['event_done', 'Shoot'].includes(stage)) return 'Shoot Completed';
  if (['selection'].includes(stage)) return 'Selection Received';
  if (['editing', 'Editing'].includes(stage)) return 'Editing';
  if (['delivery', 'Delivery'].includes(stage)) return 'Delivered';

  if (WORKFLOW_STAGES.includes(stage as any)) {
    return stage as ProjectStage;
  }
  return 'Booked';
};

export const getWorkflowProgress = (stage?: string): number => {
  const norm = normalizeWorkflowStage(stage);
  const index = WORKFLOW_STAGES.indexOf(norm as any);
  if (index === -1) return 0;
  // Calculate percentage based on 9 stages (0 to 8 index)
  // Booked = 10%, Delivered = 100%
  const percentages = [10, 20, 30, 45, 60, 70, 80, 90, 100];
  return percentages[index];
};

export const getNextWorkflowStage = (stage?: string): ProjectStage | null => {
  const norm = normalizeWorkflowStage(stage);
  const index = WORKFLOW_STAGES.indexOf(norm as any);
  if (index === -1 || index === WORKFLOW_STAGES.length - 1) return null;
  return WORKFLOW_STAGES[index + 1] as ProjectStage;
};

export const generateTimelineEvent = (title: string, description: string): TimelineItem => {
  return {
    id: `TL-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title,
    description,
    date: new Date().toISOString(),
    status: 'Completed'
  };
};
