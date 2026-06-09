import type { Client, Project, Invoice } from '../types';

export type AlertPriority = 1 | 2 | 3; // 1 = Critical, 2 = Warning, 3 = Info
export type AlertCategory = 'Payments' | 'Team Allocation' | 'Agreements' | 'Deliverables' | 'Logistics' | 'General' | 'Approvals';

export interface AlertDetail {
  message: string;
  priority: AlertPriority;
  category: AlertCategory;
}

export interface ClientAlertGroup {
  clientId: string;
  clientName: string;
  projectName: string;
  alerts: AlertDetail[];
  highestPriority: AlertPriority;
}

export const generateGroupedAlerts = (
  clients: Client[],
  projects: Project[],
  invoices: Invoice[],
  today: Date
): ClientAlertGroup[] => {
  const alertMap = new Map<string, ClientAlertGroup>();

  const getGroup = (clientId: string, defaultName: string, defaultProject: string): ClientAlertGroup => {
    if (!alertMap.has(clientId)) {
      alertMap.set(clientId, {
        clientId,
        clientName: defaultName,
        projectName: defaultProject,
        alerts: [],
        highestPriority: 3
      });
    }
    return alertMap.get(clientId)!;
  };

  const addAlert = (clientId: string, cName: string, pName: string, detail: AlertDetail) => {
    const group = getGroup(clientId, cName, pName);
    group.alerts.push(detail);
    if (detail.priority < group.highestPriority) {
      group.highestPriority = detail.priority;
    }
  };

  // 1. AGREEMENTS
  clients.forEach(c => {
    const pName = c.projectName || c.name || 'Unknown Project';
    const cName = c.name || 'Unknown Client';
    
    if (!c.activeAgreement || c.activeAgreement.status !== 'accepted') {
      const hasUpcoming = c.events?.some(ev => new Date(ev.date) >= today);
      if (hasUpcoming) {
        addAlert(c.id, cName, pName, {
          message: 'Agreement Not Signed',
          priority: 1, // Critical
          category: 'Agreements'
        });
      }
    }
  });

  // 2. PAYMENTS
  invoices.forEach((inv: any) => {
    if (inv.status !== 'Paid' && inv.type !== 'quotation') {
      let cName = 'Client';
      let pName = 'Project';
      let cId = inv.clientId || 'unknown_client';
      
      if (inv.clientId) {
        const c = clients.find(client => String(client.id) === String(inv.clientId));
        if (c) {
          cName = c.name || 'Client';
          pName = c.projectName || c.name || 'Project';
        }
      }

      const pendingAmount = ((inv.totalAmount || inv.total || 0) - (inv.paidAmount || 0));
      const formattedAmount = `₹${pendingAmount.toLocaleString('en-IN')}`;
      
      const isAdvance = inv.items?.some((i:any) => i.description?.toLowerCase().includes('advance'));
      
      if (isAdvance) {
        addAlert(cId, cName, pName, {
          message: `Advance Payment Pending ${formattedAmount}`,
          priority: 2, // Warning
          category: 'Payments'
        });
      } else {
        const invDateStr = inv.dueDate || (inv as any).date || inv.issueDate || inv.createdAt;
        if (invDateStr) {
          const invDate = new Date(invDateStr);
          invDate.setHours(0,0,0,0);
          if (invDate.getTime() < today.getTime()) {
            addAlert(cId, cName, pName, {
              message: `Invoice Overdue ${formattedAmount}`,
              priority: 1, // Critical
              category: 'Payments'
            });
          } else {
            addAlert(cId, cName, pName, {
              message: `Pending Balance ${formattedAmount}`,
              priority: 3, // Info
              category: 'Payments'
            });
          }
        }
      }
    }
  });

  // 3. EVENTS, LOGISTICS & TEAM ALLOCATION
  clients.forEach(c => {
    const cName = c.name || 'Unknown Client';
    const pName = c.projectName || c.name || 'Unknown Project';
    
    if (c.events && Array.isArray(c.events)) {
      c.events.forEach(ev => {
        const evDate = new Date(ev.date);
        evDate.setHours(0,0,0,0);
        const diffTime = evDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Only care about upcoming events or today's events for these alerts
        if (diffDays >= 0) {
          // Info reminders
          if (diffDays === 0) {
            addAlert(c.id, cName, pName, { message: `${ev.name} Starts Today`, priority: 3, category: 'General' });
          } else if (diffDays <= 3) {
            addAlert(c.id, cName, pName, { message: `${ev.name} Starts in ${diffDays} days`, priority: 3, category: 'General' });
          }

          // Logistics
          if (!ev.venueLocation) addAlert(c.id, cName, pName, { message: `${ev.name} Venue Missing`, priority: 1, category: 'Logistics' });
          else if (!ev.brideLocation && !ev.groomLocation) {
             addAlert(c.id, cName, pName, { message: `${ev.name} Logistics Details Missing`, priority: 2, category: 'Logistics' });
          }

          // Team Allocation
          const proj = projects.find(p => String(p.clientId) === String(c.id));
          const hasTeamAssigned = proj?.team && (proj.team.photographer || proj.team.videographer || proj.team.photographers?.length > 0 || proj.team.videographers?.length > 0);
          if (!hasTeamAssigned) {
            addAlert(c.id, cName, pName, { 
              message: `Team Not Assigned for ${ev.name}`, 
              priority: diffDays <= 7 ? 1 : 2, 
              category: 'Team Allocation' 
            });
          }
        }
      });
    }
  });

  // 4. DELIVERABLES (WORKFLOW)
  projects.forEach(p => {
    const c = clients.find(cl => String(cl.id) === String(p.clientId));
    const cName = c?.name || 'Unknown Client';
    const pName = c?.projectName || c?.name || p.name || 'Unknown Project';
    const cId = p.clientId ? String(p.clientId) : `proj-${p.id}`;
    
    if (p.stage === 'Shoot Completed' || p.stage === 'Selection Received') {
      addAlert(cId, cName, pName, { message: `Selections Pending`, priority: 2, category: 'Deliverables' });
    } else if (p.stage === 'Editing') {
      addAlert(cId, cName, pName, { message: `Editing in Progress`, priority: 3, category: 'Deliverables' });
    } else if (p.stage === 'Delivery Ready') {
      addAlert(cId, cName, pName, { message: `Delivery Pending`, priority: 2, category: 'Deliverables' });
    }
  });

  // 5. APPROVALS
  try {
    const approvals = JSON.parse(localStorage.getItem('apco_approvals') || '[]');
    approvals.forEach((app: any) => {
      if (app.status === 'Pending Approval') {
        let cId = app.targetId || 'unknown';
        const client = clients.find(c => c.name === app.clientName);
        if (client) cId = client.id;
        
        addAlert(cId, app.clientName || 'Client', app.brandName || 'Project', {
          message: `${app.type} Pending: ₹${app.amount.toLocaleString('en-IN')}`,
          priority: 2, // Warning
          category: 'Approvals'
        });
      }
    });
  } catch (e) {
    console.error("Failed to parse approvals for alerts", e);
  }

  // Convert map to array and sort by priority (1 is highest)
  return Array.from(alertMap.values()).sort((a, b) => a.highestPriority - b.highestPriority);
};
