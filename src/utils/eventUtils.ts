import { type ClientEvent, type EventStatus } from '../types';

export function calculateEventStatusAndProgress(ev: ClientEvent): { status: EventStatus; progress: number } {
   // If manually marked completed, it's always completed with 100% progress.
   if (ev.actualCompletedAt || ev.status === 'Completed' || ev.status === 'Cancelled') {
      return { status: ev.status, progress: 100 };
   }

   // If no time is set, fallback to default status (Scheduled)
   if (!ev.startTime || !ev.endTime) {
      return { status: ev.status || 'Scheduled', progress: 0 };
   }

   const now = new Date();
   
   // Parse start and end times assuming they belong to ev.date
   const startDateTime = new Date(`${ev.date}T${ev.startTime}`);
   const endDateTime = new Date(`${ev.date}T${ev.endTime}`);

   // If invalid dates (e.g., parsing failed), fallback
   if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return { status: ev.status || 'Scheduled', progress: 0 };
   }

   if (now < startDateTime) {
      return { status: 'Scheduled', progress: 0 };
   }

   if (now >= startDateTime && now < endDateTime) {
      const totalDuration = endDateTime.getTime() - startDateTime.getTime();
      const elapsed = now.getTime() - startDateTime.getTime();
      let progress = (elapsed / totalDuration) * 100;
      progress = Math.max(0, Math.min(100, progress));
      
      return { status: 'In Progress', progress };
   }

   if (now >= endDateTime) {
      return { status: 'Completed', progress: 100 };
   }

   return { status: ev.status || 'Scheduled', progress: 0 };
}
