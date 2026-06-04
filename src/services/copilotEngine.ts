import { api } from './api';
import type { Invoice } from '../types';

export interface BusinessIQMetrics {
    totalRevenue: number;
    pendingCollections: number;
    activeProjects: number;
    upcomingEvents: number;
    staffUtilization: number;
    completionRate: number;
    pendingDeliverables: number;
    overdueTasks: number;
}

// ---------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------

export const getActiveProjects = async () => {
    const clients = await api.getClients();
    return clients.filter(c => c.status !== 'completed');
};

export const getPendingInvoices = async () => {
    const invoices = await api.getInvoices();
    return invoices.filter((inv: Invoice) => !inv.isQuotation && inv.status !== 'Paid');
};

export const getUpcomingEvents = async () => {
    const clients = await api.getClients();
    const events = clients.flatMap(c => (c.events || []).map(e => ({ ...e, clientName: c.projectName || c.name })));
    return events.filter(e => e.status !== 'Completed' && e.status !== 'Cancelled')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getStaffWorkload = async () => {
    const tasks = await api.getTasks();
    const staff = await api.getStaff();
    
    const workload = staff.map(s => {
        const assignedTasks = tasks.filter(t => t.assignee === s.name && t.status !== 'Completed');
        return { name: s.name, pendingTasks: assignedTasks.length };
    });
    
    return workload.sort((a, b) => b.pendingTasks - a.pendingTasks);
};

export const getPendingDeliverables = async () => {
    const clients = await api.getClients();
    let pending = 0;
    clients.forEach(c => {
        if (c.portal?.deliverables) {
            // Rough heuristic: if deliverables exist but status is not completed
            if (c.status !== 'completed') {
                pending += c.portal.deliverables.length;
            }
        }
    });
    return pending;
};

export const getRevenueSummary = async () => {
    const summary = await api.getFinanceSummary(undefined, 'global');
    return summary; // contains totalRevenue, recoveredAmount, pendingAmount, etc.
};

export const getBusinessIQMetrics = async (): Promise<BusinessIQMetrics> => {
    const [
        revenue, 
        activeProjs, 
        upcomingEvents, 
        workload, 
        tasks
    ] = await Promise.all([
        getRevenueSummary(),
        getActiveProjects(),
        getUpcomingEvents(),
        getStaffWorkload(),
        api.getTasks()
    ]);

    const activeStaff = workload.filter(w => w.pendingTasks > 0).length;
    const totalStaff = workload.length || 1;
    const staffUtilization = Math.round((activeStaff / totalStaff) * 100);

    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const overdueTasks = tasks.filter(t => t.status === 'Overdue').length;

    const pendingDeliverables = await getPendingDeliverables();

    return {
        totalRevenue: revenue.totalRevenue,
        pendingCollections: revenue.pendingAmount,
        activeProjects: activeProjs.length,
        upcomingEvents: upcomingEvents.length,
        staffUtilization,
        completionRate,
        pendingDeliverables,
        overdueTasks
    };
};


// ---------------------------------------------------------
// Rule-Based Copilot Engine
// ---------------------------------------------------------

export const processCopilotCommand = async (command: string): Promise<string> => {
    const cmd = command.toLowerCase().trim();

    if (cmd.includes('show active projects')) {
        const active = await getActiveProjects();
        if (active.length === 0) return "There are currently no active projects.";
        const list = active.slice(0, 5).map(c => `- ${c.projectName || c.name}`).join('\n');
        return `You have ${active.length} active projects.\nHere are the latest ones:\n${list}`;
    }

    if (cmd.includes('show pending payments') || cmd.includes('pending balances')) {
        const pending = await getPendingInvoices();
        if (pending.length === 0) return "All payments are up to date! There are no pending payments.";
        const total = pending.reduce((sum: number, inv: Invoice) => sum + ((inv.total || inv.totalAmount || 0) - (inv.paidAmount || 0)), 0);
        return `There are ${pending.length} pending invoices totaling ₹${total.toLocaleString()}.\nPlease check the Ledger for detailed breakdown.`;
    }

    if (cmd.includes('show overdue invoices')) {
        const pending = await getPendingInvoices();
        const overdue = pending.filter((i: Invoice) => i.status === 'Overdue');
        if (overdue.length === 0) return "Good news! There are no overdue invoices at the moment.";
        return `There are ${overdue.length} overdue invoices that require immediate attention.`;
    }

    if (cmd.includes("show today's events") || cmd.includes("show upcoming shoots")) {
        const events = await getUpcomingEvents();
        if (events.length === 0) return "There are no upcoming shoots scheduled in the near future.";
        const list = events.slice(0, 3).map(e => `- ${e.name} (${e.date}) for ${e.clientName}`).join('\n');
        return `You have ${events.length} upcoming events/shoots.\nNext up:\n${list}`;
    }

    if (cmd.includes('show all photographers') || cmd.includes('show all videographers')) {
        const staff = await api.getStaff();
        const type = cmd.includes('photographer') ? 'photographer' : 'videographer';
        const filtered = staff.filter(s => s.role?.toLowerCase().includes(type) || ((s as any).staffRole && (s as any).staffRole.toLowerCase().includes(type)));
        if (filtered.length === 0) return `I couldn't find any staff with the role of ${type}.`;
        const list = filtered.map(s => `- ${s.name}`).join('\n');
        return `Here are your ${type}s:\n${list}`;
    }

    if (cmd.includes('show staff workload') || cmd.includes('highest workload')) {
        const workload = await getStaffWorkload();
        if (workload.length === 0) return "No staff members or tasks found.";
        const top = workload[0];
        return `The highest workload is currently with ${top.name}, who has ${top.pendingTasks} pending tasks.`;
    }

    if (cmd.includes('unassigned projects')) {
        const clients = await getActiveProjects();
        const unassigned = clients.filter(c => !c.assignedCoordinatorId && !c.assignedPhotographerId);
        if (unassigned.length === 0) return "All active projects currently have staff assigned.";
        return `There are ${unassigned.length} projects without primary assignments.`;
    }

    if (cmd.includes('pending deliverables')) {
        const pending = await getPendingDeliverables();
        return `There are currently ${pending} deliverable items tracked in active projects.`;
    }

    if (cmd.includes('projects in editing')) {
        const clients = await getActiveProjects();
        // Assuming workflow stage or status implies editing
        const editing = clients.filter(c => c.status === 'uploaded' || c.status === 'selected');
        return `There are ${editing.length} projects currently in post-production (editing/selection).`;
    }

    if (cmd.includes('awaiting delivery')) {
        const clients = await getActiveProjects();
        // Assuming workflow stage implies delivery ready
        const delivery = clients.filter(c => c.status === 'completed' && c.portal?.deliverables?.length === 0);
        return `There are ${delivery.length} projects that appear to be ready but lack uploaded deliverables.`;
    }

    if (cmd.includes('revenue this month') || cmd.includes('revenue this year')) {
        const revenue = await getRevenueSummary();
        return `Total recorded revenue is ₹${revenue.totalRevenue.toLocaleString()}.\nRecovered so far: ₹${revenue.recoveredAmount.toLocaleString()}.\n*(Note: Time-based filtering is abstracted for this demo)*`;
    }

    return "I'm not sure how to answer that yet. I am currently programmed with a specific set of rules. Try asking me to 'Show active projects' or 'Show staff workload'.";
};
