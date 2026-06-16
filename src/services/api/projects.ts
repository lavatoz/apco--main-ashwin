import { fetchApi, checkClientBlock } from './client';
import { type Project, type Client, type Task, type Booking, type Division, type Company, type Expense, type Invoice } from '../../types';
import { safeParse } from '../../utils/storage';

const STORAGE_KEY = 'apco_enterprise_db_v5';

interface DBStructure {
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  bookings: Booking[];
  expenses: Expense[];
  companies: Company[];
  tasks: Task[];
  lastSynced: string;
}

const getInitialDB = (): DBStructure => ({
  companies: [
    {
      id: '1', name: 'AAHA Kalyanam', ownerName: 'Artisan Owner', phone: '9876543210', email: 'wedding@artisans.co', color: '#fbbf24', type: 'Wedding', description: 'Luxury Wedding Production',
      createdAt: ""
    }
  ],
  clients: [],
  projects: [],
  invoices: [],
  bookings: [],
  expenses: [],
  tasks: [],
  lastSynced: new Date().toISOString()
});

export const getDB = (): DBStructure => {
  return safeParse<DBStructure>(STORAGE_KEY, getInitialDB());
};

export const saveDB = (db: DBStructure) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...db, lastSynced: new Date().toISOString() }));
};

const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const projects = {
  getProjects: async (): Promise<Project[]> => {
    const data = await fetchApi('/projects');
    if (Array.isArray(data)) {
      return data;
    }
    throw new Error("Invalid response from server: projects is not an array");
  },

  getProjectById: async (id: string): Promise<Project | null> => {
    const data = await fetchApi(`/projects/${id}`);
    return data;
  },

  saveProject: async (project: Project): Promise<Project> => {
    checkClientBlock("Manage Projects");

    const resolvedClientId = project.clientId;
    const projectPayload = {
      name: project.name || "Unnamed Project",
      description: project.description || null,
      status: project.status || 'Draft',
      clientId: resolvedClientId,
    };

    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const hasBackendId = (project.id && isUuid(project.id)) || (project._id && isUuid(project._id));
    const targetId = isUuid(project.id) ? project.id : project._id;

    let savedBackendProject;
    if (hasBackendId && targetId) {
      savedBackendProject = await fetchApi(`/projects/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify(projectPayload)
      });
    } else {
      savedBackendProject = await fetchApi('/projects', {
        method: 'POST',
        body: JSON.stringify(projectPayload)
      });
    }

    const mappedProject: Project = {
      ...project,
      id: savedBackendProject.id,
      _id: savedBackendProject.id,
      name: savedBackendProject.name,
      description: savedBackendProject.description,
      status: savedBackendProject.status,
      clientId: savedBackendProject.clientId,
    };

    return mappedProject;
  },

  deleteProject: async (id: string) => {
    checkClientBlock("Manage Projects");
    await fetchApi(`/projects/${id}`, { method: 'DELETE' });
  },

  assignStaff: async (projectId: string, userId: string, role: string) => {
    checkClientBlock("Assign Staff");
    return fetchApi(`/projects/${projectId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId, role })
    });
  },

  unassignStaff: async (projectId: string, userId: string) => {
    checkClientBlock("Unassign Staff");
    return fetchApi(`/projects/${projectId}/unassign`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  updateProjectStatus: async (id: string, status: string) => {
    checkClientBlock("Update Project Status");
    return fetchApi(`/projects/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  },

  updateProjectStage: async (projectId: string, stage: string, reason: string): Promise<any> => {
    checkClientBlock("Progress Project Stage");
    return fetchApi(`/projects/${projectId}/stage`, {
      method: 'PUT',
      body: JSON.stringify({ stage, reason })
    });
  },

  uploadImages: async (projectId: string, imageUrls: string[]) => {
    return fetchApi(`/projects/${projectId}/upload`, { method: 'POST', body: JSON.stringify({ imageUrls }) });
  },

  toggleImageSelection: async (projectId: string, imageId: string) => {
    return fetchApi(`/projects/${projectId}/select`, { method: 'POST', body: JSON.stringify({ imageId }) });
  },

  // Tasks
  getTasks: async (): Promise<Task[]> => {
    const data = await fetchApi('/tasks');
    return data;
  },
  saveTask: async (task: Task): Promise<Task> => {
    checkClientBlock("Manage Tasks");
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const hasUuid = task.id && isUuid(task.id);
    
    const payload = {
      title: task.title,
      assignee: task.assignee || 'Unassigned',
      dueDate: task.dueDate,
      status: task.status,
      brand: task.brand || 'AAHA Kalyanam',
      priority: task.priority || 'High',
      clientId: task.client || null,
      projectId: task.eventId || null,
      eventId: task.eventId || null,
    };

    let result;
    if (hasUuid) {
      result = await fetchApi(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      result = await fetchApi('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    return {
      ...task,
      id: result.id,
      client: result.clientId || task.client,
      eventId: result.projectId || result.eventId || task.eventId
    };
  },
  deleteTask: async (id: string): Promise<void> => {
    checkClientBlock("Delete Task");
    await fetchApi(`/tasks/${id}`, { method: 'DELETE' });
  },

  // Bookings
  getBookings: async () => { await delay(); return getDB().bookings; },

  // Divisions
  getDivisions: async (): Promise<Division[]> => {
    await delay(100);
    const data = localStorage.getItem("divisions");
    return data ? JSON.parse(data) : [
      { id: 'div_wedding', name: 'AAHA KALYANAM', type: 'Wedding', createdAt: new Date().toISOString() }
    ];
  },
  saveDivision: async (division: Division) => {
    checkClientBlock("Manage Divisions");
    await delay(200);
    const divisions = await projects.getDivisions();
    const idx = divisions.findIndex(d => d.id === division.id);
    if (idx >= 0) divisions[idx] = division;
    else divisions.push(division);
    localStorage.setItem("divisions", JSON.stringify(divisions));
    return division;
  },
  deleteDivision: async (id: string) => {
    checkClientBlock("Manage Divisions");
    await delay(200);
    const divisions = await projects.getDivisions();
    const filtered = divisions.filter(d => d.id !== id);
    localStorage.setItem("divisions", JSON.stringify(filtered));
  }
};
