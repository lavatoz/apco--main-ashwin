import type { ProjectStage, TimelineItem, Project } from '../types';

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

export const calculateProjectWorkflowProgress = (project?: Project | null): number => {
  if (!project || !project.stageTracking) return 0;
  let completedCount = 0;
  for (let i = 1; i <= 10; i++) {
    if (project.stageTracking[String(i)]?.status === 'Completed') {
      completedCount++;
    }
  }
  return Math.round((completedCount / 10) * 100);
};

export const getTeamFromProjectAssignments = (assignments?: any[]): any => {
  if (!assignments || !Array.isArray(assignments)) return {};
  
  const defaultRoles = ['Photographer', 'Videographer', 'Editor', 'Assistant', 'DroneOperator', 'Designer'];
  const team: any = {};

  defaultRoles.forEach(roleName => {
     const cleanName = roleName.toLowerCase();
     const pluralKey = (cleanName === 'droneoperator' ? 'droneoperator' : cleanName) + 's';
     const singularKey = cleanName === 'droneoperator' ? 'droneoperator' : cleanName;

     const matching = assignments.filter((a: any) => a.role === roleName);
     const mapped = matching.map((a: any) => ({
        id: a.userId,
        name: a.user ? `${a.user.firstName} ${a.user.lastName}` : 'Unassigned',
        type: 'internal',
        assigned_dates: a.assignedAt ? [a.assignedAt] : [],
        role: roleName === 'DroneOperator' ? 'Drone Operator' : roleName
     }));

     team[pluralKey] = mapped;
     team[singularKey] = mapped.length > 0 ? mapped[0] : undefined;
  });

  return team;
};

// Keep placeholder for backward compatibility
export const getTeamFromClientAssignments = (_clientId?: string, _currentProjectTeam?: any): any => {
  return {};
};
