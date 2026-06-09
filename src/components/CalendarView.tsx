import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, Tag } from 'lucide-react';
// Fix: removed non-existent Brand import
import { type Booking, type Client } from '../types';

interface CalendarViewProps {
  bookings?: Booking[];
  clients: Client[];
  // Fix: replaced non-existent Brand with string
  selectedBrand: string | 'All';
}

const CalendarView: React.FC<CalendarViewProps> = ({ bookings = [], clients, selectedBrand }) => {
  const allEvents = useMemo(() => {
    const evs: any[] = [];
    clients.forEach(c => {
       if (c.events && c.events.length > 0) {
          c.events.forEach(ev => {
             evs.push({
                id: ev.id,
                date: ev.date,
                status: ev.status,
                title: ev.name,
                clientId: c.id,
                clientName: c.name,
                brand: c.brand || 'Artisans',
                type: 'Event'
             });
          });
       } else if (c.eventDate || c.weddingDate) {
          evs.push({
             id: c.id + '_legacy',
             date: c.eventDate || c.weddingDate || '',
             status: 'Scheduled',
             title: c.projectName || 'Legacy Event',
             clientId: c.id,
             clientName: c.name,
             brand: c.brand || 'Artisans',
             type: 'Event'
          });
       }
    });
    return evs;
  }, [clients]);

  const combinedItems = [...bookings, ...allEvents];
  const filteredBookings = selectedBrand === 'All' ? combinedItems : combinedItems.filter(b => b.brand === selectedBrand);
  const sortedBookings = [...filteredBookings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-primary/20 text-emerald-400 border-primary/50';
      case 'Pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'Completed': return 'bg-primary/20 text-blue-400 border-primary/50';
      case 'Cancelled': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'Scheduled': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'In Preparation': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'In Progress': return 'bg-primary/20 text-blue-400 border-primary/50';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Event Schedule</h1>
          <p className="text-zinc-500 text-sm">Manage all upcoming and past event dates.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
          <div className="flex items-center gap-2 pr-4 border-r border-zinc-800">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-[10px] font-black uppercase text-zinc-400">Wedding</span>
          </div>
          <div className="flex items-center gap-2 pl-4">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-[10px] font-black uppercase text-zinc-400">Kids Event</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedBookings.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
            <CalendarIcon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No Events Found</p>
          </div>
        )}
        {sortedBookings.map((booking: any) => {
          const clientName = booking.clientName || (clients.find(c => c.id === booking.clientId)?.projectName || 'TBD Client');
          const dateObj = new Date(booking.date);

          return (
            <div key={booking.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-600 transition-all group overflow-hidden relative">
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full opacity-5 blur-3xl ${booking.brand === 'AAHA Kalyanam' ? 'bg-yellow-500' : 'bg-primary'}`}></div>

              <div className="flex justify-between items-start mb-6">
                <div className="bg-black/50 p-4 rounded-2xl border border-zinc-800 flex flex-col items-center min-w-[64px]">
                  <span className="text-[10px] font-black uppercase text-zinc-500">{dateObj.toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-2xl font-black text-white">{dateObj.getDate()}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <h3 className="text-lg font-black text-white group-hover:text-yellow-500 transition-colors uppercase tracking-tight mb-1">{booking.title}</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase mb-4">{clientName}</p>

              <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                  <Tag className="w-3 h-3 text-zinc-600" />
                  <span>Type: {booking.type}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                  <Clock className="w-3 h-3 text-zinc-600" />
                  <span>Year: {dateObj.getFullYear()}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                  <MapPin className="w-3 h-3 text-zinc-600" />
                  <span className={booking.brand === 'AAHA Kalyanam' ? 'text-yellow-600' : 'text-blue-400'}>{booking.brand}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;

