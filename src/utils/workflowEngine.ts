import { api } from '../services/api';
import type { Project, ProjectStage, Client } from '../types';
import { normalizeWorkflowStage, generateTimelineEvent, WORKFLOW_STAGES } from './workflowUtils';
import { generateTasksForStage } from './taskEngine';

export const advanceProjectWorkflow = async (projectId: string, newStage: ProjectStage, triggerReason: string) => {
  const storedProjects: Project[] = JSON.parse(localStorage.getItem('projects') || '[]');
  const projectIndex = storedProjects.findIndex(p => p.id === projectId);
  
  if (projectIndex === -1) return false;
  
  const project = storedProjects[projectIndex];
  const currentStage = normalizeWorkflowStage(project.stage);
  
  const currentIndex = WORKFLOW_STAGES.indexOf(currentStage as any);
  const newIndex = WORKFLOW_STAGES.indexOf(newStage as any);
  
  // Prevent backwards or redundant progression in automatic mode
  if (newIndex <= currentIndex) {
    return false; 
  }
  
  const timestamp = new Date().toISOString();
  
  // 1. Update Project
  const updatedProject = {
    ...project,
    stage: newStage,
    workflowTrigger: {
      event: triggerReason,
      timestamp
    }
  };
  storedProjects[projectIndex] = updatedProject;
  localStorage.setItem('projects', JSON.stringify(storedProjects));
  
  // 2. Add Timeline Event to Client
  try {
     const clients: Client[] = await api.getClients();
     const client = clients.find(c => c.id === project.clientId);
     if (client) {
        const evt = generateTimelineEvent(`Stage advanced to ${newStage}`, triggerReason);
        const updatedClient = {
           ...client,
           portal: {
              ...client.portal,
              timeline: [...(client.portal?.timeline || []), evt],
              deliverables: client.portal?.deliverables || [],
              internalSpends: client.portal?.internalSpends || []
           }
        };
        await api.saveClient(updatedClient);
     }
  } catch (e) {
     console.error("Failed to update client timeline", e);
  }
  
  // 3. Generate Tasks
  const brandName = typeof project.brand === 'string' ? project.brand : (project.brand as any)?.companyName || 'Artisans';
  const newTasks = generateTasksForStage(newStage, project.id, project.name, brandName, project.clientId);
  if (newTasks.length > 0) {
      const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      localStorage.setItem('tasks', JSON.stringify([...existingTasks, ...newTasks]));
  }
  
  // 4. Dispatch storage event for real-time sync
  window.dispatchEvent(new Event('storage'));
  
  return true;
};

// Emergency Override Helper
export const emergencyOverrideWorkflow = async (projectId: string, newStage: ProjectStage) => {
  const storedProjects: Project[] = JSON.parse(localStorage.getItem('projects') || '[]');
  const projectIndex = storedProjects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) return false;
  
  const project = storedProjects[projectIndex];
  const updatedProject = {
    ...project,
    stage: newStage,
    workflowTrigger: {
      event: 'Admin Emergency Override',
      timestamp: new Date().toISOString()
    }
  };
  storedProjects[projectIndex] = updatedProject;
  localStorage.setItem('projects', JSON.stringify(storedProjects));
  
  try {
     const clients: Client[] = await api.getClients();
     const client = clients.find(c => c.id === project.clientId);
     if (client) {
        const evt = generateTimelineEvent(`Stage overridden to ${newStage}`, 'Admin Emergency Override');
        const updatedClient = {
           ...client,
           portal: {
              ...client.portal,
              timeline: [...(client.portal?.timeline || []), evt],
              deliverables: client.portal?.deliverables || [],
              internalSpends: client.portal?.internalSpends || []
           }
        };
        await api.saveClient(updatedClient);
     }
  } catch (e) {
     console.error("Failed to update client timeline", e);
  }
  
  window.dispatchEvent(new Event('storage'));
  return true;
};
