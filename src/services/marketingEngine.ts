import { api } from './api';
import type { Client, Invoice, Person } from '../types';
import { getActiveProjects, getUpcomingEvents, getStaffWorkload, getRevenueSummary } from './copilotEngine';

// ---------------------------------------------------------
// 1. Email Templates
// ---------------------------------------------------------

export type EmailTemplateType = 'Welcome Email' | 'Payment Reminder' | 'Event Confirmation' | 'Deliverables Ready' | 'Thank You Email';

export const generateEmailTemplate = async (type: EmailTemplateType, client: Client, invoice?: Invoice) => {
    const clientName = client.projectName || client.name || 'Valued Client';
    const eventDate = client.eventDate || client.weddingDate || 'your upcoming event';
    const balanceAmount = invoice ? ((invoice.total || invoice.totalAmount || 0) - (invoice.paidAmount || 0)) : 0;
    const balanceStr = `₹${balanceAmount.toLocaleString()}`;
    const packageInfo = invoice?.items?.map(i => i.description).join(', ') || 'our services';

    switch (type) {
        case 'Welcome Email':
            return `Subject: Welcome to AP Co. Enterprise, ${clientName}!\n\nHi ${clientName},\n\nWe are thrilled to be part of your journey! Our team is officially onboarding your project for ${eventDate}.\n\nYour selected package includes: ${packageInfo}.\n\nOur coordinators will reach out shortly to align on creative direction.\n\nWarm regards,\nAP Co. Enterprise Team`;
        
        case 'Payment Reminder':
            return `Subject: Payment Reminder - AP Co. Enterprise\n\nHi ${clientName},\n\nWe hope preparations are going smoothly for ${eventDate}.\n\nThis is a gentle reminder regarding an outstanding balance of ${balanceStr} for your project.\n\nPlease find the detailed invoice in your Client Portal and process the payment at your earliest convenience to ensure uninterrupted service.\n\nBest regards,\nAP Co. Enterprise Finance`;
        
        case 'Event Confirmation':
            return `Subject: Event Confirmation: See you soon!\n\nHi ${clientName},\n\nThe big day is almost here! This email confirms our team is fully briefed and prepared for ${eventDate}.\n\nIf there are any last-minute logistical changes, please update your portal or contact your lead coordinator immediately.\n\nExcited to capture your memories,\nAP Co. Production Team`;
        
        case 'Deliverables Ready':
            return `Subject: Your Deliverables are Ready!\n\nHi ${clientName},\n\nGreat news! The final deliverables for your event on ${eventDate} have been successfully processed and uploaded to your secure vault.\n\nYou can access your gallery and videos directly via your Client Portal.\n\nEnjoy the memories!\nAP Co. Post-Production Team`;
        
        case 'Thank You Email':
            return `Subject: Thank You for choosing AP Co. Enterprise\n\nHi ${clientName},\n\nIt was an absolute honor to cover your event on ${eventDate}.\n\nThank you for trusting AP Co. Enterprise with your memories. We hope you love the final deliverables.\n\nWe look forward to capturing your future milestones!\n\nWarmly,\nAP Co. Enterprise Team`;
    }
};


// ---------------------------------------------------------
// 2. Social Intelligence
// ---------------------------------------------------------

export const generateSocialContent = (client: Client, theme: string) => {
    const clientName = client.projectName || client.name || 'our amazing couple';
    const cleanTheme = theme.trim() || 'Timeless Elegance';

    const captions = [
        `Capturing the pure magic of ${clientName}. ${cleanTheme} brought to life! ✨📸`,
        `Every frame tells a story. Thrilled to share these moments with ${clientName}. #APCoEnterprise`,
        `When ${cleanTheme} meets raw emotion. 🖤 ${clientName}`
    ];

    const reelIdeas = [
        `Behind the scenes: The making of ${clientName}'s ${cleanTheme} shoot.`,
        `Before & After: Color grading process for ${clientName}.`,
        `A 15-second cinematic trailer highlighting the best moments of ${clientName}.`
    ];

    const postIdeas = [
        `Carousel: 5 breathtaking portraits from ${clientName}.`,
        `Single Post: A dramatic black & white moment showcasing ${cleanTheme}.`,
        `Detail Shots: Close-ups of the decor, rings, and outfits.`
    ];

    const hashtags = `#APCoEnterprise #LuxuryProduction #${cleanTheme.replace(/\s+/g, '')} #Cinematic #EventCoverage #VisualArts`;

    return { captions, reelIdeas, postIdeas, hashtags };
};


// ---------------------------------------------------------
// 3. Deals Dashboard (Leads/Status)
// ---------------------------------------------------------

export interface DealsData {
    totalLeads: number;
    converted: number;
    activeProductions: number;
    lost: number;
    conversionRate: number;
}

export const getDealsData = async (): Promise<DealsData> => {
    const clients = await api.getClients();
    
    // Status Mapping:
    // pending = Lead
    // active = Converted Client (Wait, AP Co typically uses 'confirmed' or 'active', but let's count anything not pending/lost as converted)
    // completed = Completed Project (also converted)
    // cancelled = Lost Lead
    // uploaded/selected = Active Production

    let pending = 0;
    let converted = 0;
    let active = 0;
    let lost = 0;

    clients.forEach(c => {
        const status = (c.status || 'pending').toLowerCase();
        
        if (status === 'pending') pending++;
        else if (status === 'cancelled') lost++;
        else {
            converted++; // anything else is converted at some point
            if (['uploaded', 'selected', 'active', 'confirmed'].includes(status)) {
                active++;
            }
        }
    });

    const totalLeads = pending + converted + lost;
    const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

    return {
        totalLeads,
        converted,
        activeProductions: active,
        lost,
        conversionRate
    };
};


// ---------------------------------------------------------
// 4. Emotions Engine (Birthdays, Anniversaries)
// ---------------------------------------------------------

export interface EmotionEvent {
    type: 'Birthday' | 'Anniversary';
    personName: string;
    clientName: string;
    date: string;
    reminderText: string;
    template: string;
}

export const getEmotionsData = async (): Promise<EmotionEvent[]> => {
    const clients = await api.getClients();
    const events: EmotionEvent[] = [];
    
    clients.forEach(c => {
        // Anniversaries
        if (c.weddingDate) {
            events.push({
                type: 'Anniversary',
                personName: c.projectName || c.name || 'Couple',
                clientName: c.projectName || c.name || 'Client',
                date: c.weddingDate,
                reminderText: `Upcoming Anniversary for ${c.projectName}`,
                template: `Happy Anniversary ${c.projectName}! Wishing you another year of beautiful memories. We loved capturing your big day.`
            });
        }
        
        // Birthdays
        c.people?.forEach((p: Person) => {
            if (p.dateOfBirth) {
                events.push({
                    type: 'Birthday',
                    personName: p.name,
                    clientName: c.projectName || c.name || 'Client',
                    date: p.dateOfBirth,
                    reminderText: `Upcoming Birthday for ${p.name}`,
                    template: `Happy Birthday ${p.name}! The AP Co. team wishes you a fantastic day filled with joy.`
                });
            }
        });
    });

    // In a real app, we'd filter for "upcoming in next 30 days" based on day/month
    // For demo purposes, we return a slice of them
    return events.slice(0, 10);
};


// ---------------------------------------------------------
// 5. Trend Audit & Business Health Score
// ---------------------------------------------------------

export interface TrendAuditData {
    totalRevenue: number;
    pendingCollections: number;
    activeProjects: number;
    upcomingEvents: number;
    averageProjectValue: number;
    mostPopularService: string;
    healthScore: number;
    healthColor: 'red' | 'yellow' | 'green';
}

export const getTrendAudit = async (): Promise<TrendAuditData> => {
    const revenueSummary = await getRevenueSummary();
    const activeProjs = await getActiveProjects();
    const upcomingEvents = await getUpcomingEvents();
    
    // Average Project Value
    const invoices = revenueSummary.invoices || [];
    const paidInvoices = invoices.filter((i: Invoice) => i.status === 'Paid');
    const avgValue = paidInvoices.length > 0 
        ? revenueSummary.recoveredAmount / paidInvoices.length 
        : 0;

    // Most Popular Service (Simple heuristic from invoice items)
    const serviceCounts: Record<string, number> = {};
    invoices.forEach((inv: Invoice) => {
        inv.items?.forEach(item => {
            const desc = item.description || 'General Photography';
            serviceCounts[desc] = (serviceCounts[desc] || 0) + 1;
        });
    });
    const mostPopularService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Premium Photography';

    // Business Health Score Calculation (out of 100)
    // Base 100, deduct points for bad metrics
    let score = 100;
    
    // Pending collections metric
    if (revenueSummary.totalRevenue > 0) {
        const pendingRatio = revenueSummary.pendingAmount / revenueSummary.totalRevenue;
        if (pendingRatio > 0.4) score -= 20;
        else if (pendingRatio > 0.2) score -= 10;
    }

    // Active vs Completed ratio (just a mock metric for completion rate)
    // Assume 80% is good
    
    // Staff Utilization (from copilot engine)
    const workload = await getStaffWorkload();
    const activeStaff = workload.filter(w => w.pendingTasks > 0).length;
    const totalStaff = workload.length || 1;
    const staffUtilization = activeStaff / totalStaff;
    if (staffUtilization > 0.9) score -= 15; // Overloaded
    else if (staffUtilization < 0.3) score -= 10; // Underutilized

    // Clamp score
    score = Math.max(0, Math.min(100, Math.round(score)));

    let healthColor: 'red' | 'yellow' | 'green' = 'green';
    if (score < 60) healthColor = 'red';
    else if (score < 80) healthColor = 'yellow';

    return {
        totalRevenue: revenueSummary.totalRevenue,
        pendingCollections: revenueSummary.pendingAmount,
        activeProjects: activeProjs.length,
        upcomingEvents: upcomingEvents.length,
        averageProjectValue: avgValue,
        mostPopularService,
        healthScore: score,
        healthColor
    };
};


// ---------------------------------------------------------
// 6. Strategic Insights
// ---------------------------------------------------------

export interface StrategicInsight {
    title: string;
    description: string;
    type: 'warning' | 'success' | 'info';
}

export const getStrategicInsights = async (): Promise<StrategicInsight[]> => {
    const insights: StrategicInsight[] = [];
    const audit = await getTrendAudit();
    const staffWorkload = await getStaffWorkload();

    // High pending payments warning
    if (audit.totalRevenue > 0 && (audit.pendingCollections / audit.totalRevenue) > 0.3) {
        insights.push({
            title: "High Outstanding Balances",
            description: `Over 30% of recorded revenue (₹${audit.pendingCollections.toLocaleString()}) is currently pending. Consider sending payment reminders.`,
            type: 'warning'
        });
    } else {
        insights.push({
            title: "Healthy Cash Flow",
            description: "Pending collections are well within healthy operational limits.",
            type: 'success'
        });
    }

    // Staff overload warning
    if (staffWorkload.length > 0 && staffWorkload[0].pendingTasks > 10) {
        insights.push({
            title: "Staff Overload Alert",
            description: `${staffWorkload[0].name} has ${staffWorkload[0].pendingTasks} pending tasks. Consider redistributing the workload to maintain quality.`,
            type: 'warning'
        });
    }

    // Workload alerts
    if (audit.upcomingEvents > 5) {
        insights.push({
            title: "Upcoming Production Spike",
            description: `There are ${audit.upcomingEvents} upcoming events scheduled. Ensure equipment and team assignments are locked in.`,
            type: 'info'
        });
    }

    if (insights.length < 3) {
         insights.push({
            title: "Market Trend",
            description: `${audit.mostPopularService} continues to be your most requested service block. Consider creating a premium tier for it.`,
            type: 'info'
        });
    }

    return insights;
};
