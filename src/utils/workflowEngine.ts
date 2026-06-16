import { api } from '../services/api';
import type { ProjectStage } from '../types';

export const advanceProjectWorkflow = async (projectId: string, newStage: ProjectStage, triggerReason: string) => {
  try {
    await api.updateProjectStage(projectId, newStage, triggerReason);
    
    // Dispatch storage and custom events for real-time sync across components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('projects-updated'));
    window.dispatchEvent(new CustomEvent('finance-updated'));
    
    return true;
  } catch (e) {
    console.error("Failed to advance project workflow", e);
    return false;
  }
};

// Emergency Override Helper
export const emergencyOverrideWorkflow = async (projectId: string, newStage: ProjectStage) => {
  try {
    await api.updateProjectStage(projectId, newStage, 'Admin Emergency Override');
    
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('projects-updated'));
    window.dispatchEvent(new CustomEvent('finance-updated'));
    
    return true;
  } catch (e) {
    console.error("Failed to override workflow stage", e);
    return false;
  }
};
