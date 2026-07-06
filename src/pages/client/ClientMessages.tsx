import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowRight, Loader } from 'lucide-react';
import type { Client, Project } from '../../types';
import { api } from '../../services/api';
import { getAuthUser } from '../../utils/storage';
import ClientPageLoader from './ClientPageLoader';

interface ClientMessagesProps {
  client: Client | null;
}

const ClientMessages: React.FC<ClientMessagesProps> = ({ client }) => {
  const currentUser = getAuthUser();
  const isClient = currentUser?.role === 'Client';

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [projectDetails, setProjectDetails] = useState<Project | null>(null);

  const [inputText, setInputText] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to latest message
  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingMessages]);

  // Hydrate projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      setLoadingProjects(true);
      setError(null);
      try {
        const allProjects = await api.getProjects();
        if (isClient && client) {
          const clientProject = allProjects.find((p: any) => p.clientId === client.id);
          if (clientProject) {
            setProjects([clientProject]);
            setSelectedProjectId(clientProject.id);
          } else {
            setError('No active project found for your client account.');
          }
        } else {
          setProjects(allProjects || []);
        }
      } catch (err: any) {
        console.error("Failed to load projects list", err);
        setError(err.message || 'Failed to load projects list.');
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjects();
  }, [client, isClient]);

  // Load messages and project details when active project switches
  useEffect(() => {
    const loadConversation = async () => {
      if (!selectedProjectId) {
        setMessages([]);
        setProjectDetails(null);
        return;
      }
      setLoadingMessages(true);
      setError(null);
      try {
        const [msgList, details] = await Promise.all([
          api.getProjectMessages(selectedProjectId),
          api.getProjectById(selectedProjectId)
        ]);
        setMessages(msgList || []);
        setProjectDetails(details);
      } catch (err: any) {
        console.error("Failed to load conversation", err);
        setError(err.message || 'Failed to load conversation.');
      } finally {
        setLoadingMessages(false);
      }
    };
    loadConversation();
  }, [selectedProjectId]);

  const handleSend = async () => {
    if (!selectedProjectId || !inputText.trim() || sending) return;
    setSending(true);
    setError(null);
    const textToSend = inputText.trim();
    try {
      const newMsg = await api.createProjectMessage(selectedProjectId, textToSend);
      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
    } catch (err: any) {
      console.error("Failed to dispatch message", err);
      setError(err.message || 'Failed to dispatch message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getSenderName = (senderId: string) => {
    if (currentUser && senderId === currentUser.id) {
      return 'Me';
    }

    if (projectDetails?.staffAssignments) {
      const assignment = projectDetails.staffAssignments.find(
        (a: any) => a.userId === senderId || (a.user && a.user.id === senderId)
      );
      if (assignment?.user) {
        return `${assignment.user.firstName} ${assignment.user.lastName} (${assignment.role || 'Staff'})`;
      }
    }

    if (isClient) {
      return 'Production Desk';
    } else {
      return (projectDetails as any)?.client?.name || 'Client';
    }
  };

  if (isClient && !client) return <ClientPageLoader />;
  if (loadingProjects) return <ClientPageLoader />;

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-8 shrink-0">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Messages</h1>
        <p className="text-xl text-zinc-400 font-medium">Project Communication & Collaboration</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 overflow-hidden min-h-0">
        {/* Messages List */}
        <div className="flex-1 glass-panel squircle-lg flex flex-col overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/5 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
             <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Collaboration Thread
             </h2>
             {!isClient && projects.length > 0 && (
               <select
                 value={selectedProjectId}
                 onChange={(e) => setSelectedProjectId(e.target.value)}
                 className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-white/20 transition-all cursor-pointer"
               >
                 <option value="" className="bg-zinc-950">-- Select Project --</option>
                 {projects.map((p) => (
                   <option key={p.id} value={p.id} className="bg-zinc-950">
                     {p.name}
                   </option>
                 ))}
               </select>
             )}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs font-bold flex justify-between items-center shrink-0">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-[10px] uppercase font-black tracking-wider text-zinc-400 hover:text-white transition-colors">Dismiss</button>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar min-h-0">
            {loadingMessages ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                 <Loader className="w-8 h-8 text-zinc-700 animate-spin mb-2" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Retrieving conversation...</p>
              </div>
            ) : !selectedProjectId ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                 <MessageSquare className="w-12 h-12 mb-4 text-zinc-600" />
                 <p className="text-xs font-bold uppercase tracking-widest">Select a project to view the conversation</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                 <MessageSquare className="w-12 h-12 mb-4 text-zinc-600" />
                 <p className="text-xs font-bold uppercase tracking-widest">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, i) => {
                  const isMe = currentUser && msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id || i} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 rounded-2xl max-w-[80%] shadow-lg ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'}`}>
                        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{getSenderName(msg.senderId)}</span>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {selectedProjectId && (
            <div className="p-4 border-t border-white/5 bg-black/40 shrink-0">
               <div className="flex gap-2">
                  <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending || loadingMessages}
                    placeholder="Type your message..." 
                    rows={1}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/20 transition-all font-medium text-white resize-none custom-scrollbar disabled:opacity-50"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                  <button 
                    onClick={handleSend}
                    disabled={sending || loadingMessages || !inputText.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-primary text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-colors flex items-center justify-center active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                     {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
               </div>
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="w-full md:w-80 space-y-6 shrink-0 overflow-y-auto">
           <div className="glass-panel p-6 squircle-lg">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Assigned Team</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold font-serif text-white">A</div>
                    <div>
                       <p className="text-sm font-bold">Production Desk</p>
                       <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Primary Contact</p>
                    </div>
                 </div>
              </div>
           </div>
           
           <button className="w-full glass-panel p-6 squircle-lg group hover:bg-white/5 transition-colors text-left">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Need Immediate Help?</h3>
              <div className="flex items-center justify-between">
                 <span className="text-sm font-bold group-hover:text-blue-400 transition-colors">Contact Support</span>
                 <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
           </button>
        </div>
      </div>
    </div>
  );
};

export default ClientMessages;
