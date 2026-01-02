import React from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, Tag } from 'lucide-react';
// Fix: removed non-existent Brand import
import { type Booking, type Client, BookingStatus } from '../types';

interface CalendarViewProps {
  bookings: Booking[];
  clients: Client[];
  // Fix: replaced non-existent Brand with string
  selectedBrand: string | 'All';
}

const CalendarView: React.FC<CalendarViewProps> = ({ bookings, clients, selectedBrand }) => {
  const filteredBookings = selectedBrand === 'All' ? bookings : bookings.filter(b => b.brand === selectedBrand);
  const sortedBookings = [...filteredBookings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Confirmed: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case BookingStatus.Pending: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case BookingStatus.Completed: return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case BookingStatus.Cancelled: return 'bg-red-500/20 text-red-400 border-red-500/50';
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
             <div className="w-3 h-3 rounded-full bg-blue-500"></div>
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
        {sortedBookings.map(booking => {
          const client = clients.find(c => c.id === booking.clientId);
          const dateObj = new Date(booking.date);
          
          return (
            <div key={booking.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-600 transition-all group overflow-hidden relative">
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full opacity-5 blur-3xl ${booking.brand === 'AAHA Kalyanam' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
              
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
              <p className="text-xs text-zinc-500 font-bold uppercase mb-4">{client?.name || 'TBD Client'}</p>

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