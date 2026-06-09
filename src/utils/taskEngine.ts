import type { Task, ProjectStage } from '../types';

export const generateTasksForStage = (stage: ProjectStage, _projectId: string, projectName: string, brand: string, clientId?: string): Task[] => {
  const newTasks: Task[] = [];
  
  const createBaseTask = (title: string, priority: string = 'High'): Task => ({
    id: `TSK-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: `${title} (${projectName})`,
    assignee: 'Unassigned',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    status: 'Pending',
    brand,
    priority,
    client: clientId
  });

  switch (stage) {
    case 'Team Assigned':
      newTasks.push(createBaseTask('Confirm Shoot Schedule'));
      break;
    case 'Shoot Completed':
      newTasks.push(createBaseTask('Collect Media'));
      break;
    case 'Selection Received':
      newTasks.push(createBaseTask('Start Editing'));
      break;
    case 'Editing':
      newTasks.push(createBaseTask('Prepare Deliverables', 'Medium'));
      break;
    case 'Delivery Ready':
      newTasks.push(createBaseTask('Send Delivery Notification'));
      break;
  }

  return newTasks;
};
