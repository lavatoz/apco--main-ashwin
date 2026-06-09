import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCcw, Copy, Check, Heart, Gift, Megaphone, Send, Bot, Activity, FileText, Clock, Calendar, Mail, Hash, Briefcase, BarChart3, AlertTriangle } from 'lucide-react';
import type { Client } from '../types';
import { getBusinessIQMetrics, processCopilotCommand, type BusinessIQMetrics } from '../services/copilotEngine';
import { 
  generateEmailTemplate, 
  generateSocialContent, 
  getDealsData, 
  getEmotionsData, 
  getTrendAudit, 
  getStrategicInsights,
  type EmailTemplateType,
  type DealsData,
  type EmotionEvent,
  type TrendAuditData,
  type StrategicInsight
} from '../services/marketingEngine';

interface AIToolsViewProps {
  clients: Client[];
  selectedBrand: string | 'All';
}

const AIToolsView: React.FC<AIToolsViewProps> = ({ clients, selectedBrand }) => {
  const [activeMainTab, setActiveMainTab] = useState<'erp' | 'marketing'>('erp');

  // --- ERP Copilot State ---
  const [metrics, setMetrics] = useState<BusinessIQMetrics | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: "Hello Admin. I'm your ERP Copilot. How can I assist with your operations today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getBusinessIQMetrics().then(setMetrics);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isCopilotThinking]);

  const handleSendChat = async (override?: string) => {
    const text = override || chatInput;
    if (!text.trim()) return;

    setChatHistory(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    setIsCopilotThinking(true);

    const response = await processCopilotCommand(text);
    
    setChatHistory(prev => [...prev, { role: 'assistant', text: response }]);
    setIsCopilotThinking(false);
  };

  const quickActions = [
    "Show active projects",
    "Show pending payments",
    "Show upcoming shoots",
    "Show staff workload",
    "Show overdue invoices"
  ];

  // --- Marketing & BI Suite State ---
  const [toolType, setToolType] = useState<'email' | 'social' | 'emotions' | 'deals' | 'audit'>('email');
  const [selectedClientId, setSelectedClientId] = useState('');
  
  // Email & Social State
  const [emailSubtype, setEmailSubtype] = useState<EmailTemplateType>('Welcome Email');
  const [socialTheme, setSocialTheme] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);

  // BI Data State
  const [dealsData, setDealsData] = useState<DealsData | null>(null);
  const [emotionsData, setEmotionsData] = useState<EmotionEvent[]>([]);
  const [trendAudit, setTrendAudit] = useState<TrendAuditData | null>(null);
  const [insights, setInsights] = useState<StrategicInsight[]>([]);

  const filteredClients = selectedBrand === 'All' ? clients : clients.filter(c => c.brand === selectedBrand);

  useEffect(() => {
    if (activeMainTab === 'marketing') {
      getDealsData().then(setDealsData);
      getEmotionsData().then(setEmotionsData);
      getTrendAudit().then(setTrendAudit);
      getStrategicInsights().then(setInsights);
    }
  }, [activeMainTab]);

  const handleGenerateContent = async () => {
    if (!selectedClientId) return;
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    if (toolType === 'email') {
      const draft = await generateEmailTemplate(emailSubtype, client);
      setGeneratedContent(draft || '');
    } else if (toolType === 'social') {
      const result = generateSocialContent(client, socialTheme);
      setGeneratedContent(
        `[CAPTIONS]\n${result.captions.join('\n\n')}\n\n` +
        `[REEL IDEAS]\n${result.reelIdeas.join('\n')}\n\n` +
        `[POST IDEAS]\n${result.postIdeas.join('\n')}\n\n` +
        `[HASHTAGS]\n${result.hashtags}`
      );
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHealthColorClass = (color: string) => {
    if (color === 'red') return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (color === 'yellow') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-primary bg-primary/10 border-primary/20';
  };

  return (
    <div className="space-y-10 animate-ios-slide-up pb-32 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter uppercase leading-none">
            Intelligence Hub
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Enterprise Operations & BI</p>
        </div>
        
        {/* Top-Level Navigation Tabs */}
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveMainTab('erp')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeMainTab === 'erp' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            ERP Assistant
          </button>
          <button
            onClick={() => setActiveMainTab('marketing')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeMainTab === 'marketing' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Marketing & BI
          </button>
        </div>
      </div>

      {activeMainTab === 'erp' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[75vh]">
          {/* Conversational Copilot Chat Interface */}
          <div className="lg:col-span-2 glass-panel border border-white/5 rounded-[2rem] flex flex-col overflow-hidden bg-black/40">
            {/* Chat Header */}
            <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-blue-400 flex items-center justify-center border border-primary/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase text-white tracking-widest">AP Co. Copilot</h2>
                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.2em] flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live ERP Connection
                </p>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                      <Bot className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-6 py-4 text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-white text-black rounded-br-none' 
                      : 'bg-zinc-900 border border-white/10 text-zinc-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isCopilotThinking && (
                <div className="flex items-end gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                    <Bot className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl px-6 py-4 bg-zinc-900 border border-white/10 text-zinc-400 rounded-bl-none flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-white/5 bg-white/[0.02] space-y-4">
              <div className="flex flex-wrap gap-2">
                {quickActions.map(action => (
                  <button
                    key={action}
                    onClick={() => handleSendChat(action)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-zinc-400 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
                className="flex items-center gap-3 glass-panel rounded-[1.5rem] p-2 focus-within:border-white/30 transition-colors"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about revenue, projects, or workload..."
                  className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-white placeholder:text-zinc-600"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isCopilotThinking}
                  className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          {/* Business IQ Dashboard Panel */}
          <div className="glass-panel border border-white/5 rounded-[2rem] p-8 flex flex-col gap-6 overflow-y-auto bg-black/40">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-[11px] font-black uppercase text-white tracking-widest">Business IQ metrics</h2>
            </div>
            
            {!metrics ? (
              <div className="flex-1 flex justify-center items-center">
                <RefreshCcw className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex flex-col gap-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Total Revenue</p>
                  <p className="text-xl font-black text-white">₹{metrics.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/10 p-5 rounded-2xl flex flex-col gap-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-500">Pending</p>
                  <p className="text-xl font-black text-red-400">₹{metrics.pendingCollections.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex flex-col gap-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Active Proj</p>
                  <p className="text-xl font-black text-white">{metrics.activeProjects}</p>
                </div>
                <div className="bg-primary/10 border border-primary/10 p-5 rounded-2xl flex flex-col gap-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary">Upcoming Events</p>
                  <p className="text-xl font-black text-blue-400">{metrics.upcomingEvents}</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex flex-col gap-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Staff Utilization</p>
                  <p className="text-xl font-black text-white">{metrics.staffUtilization}%</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex flex-col gap-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Task Completion</p>
                  <p className="text-xl font-black text-white">{metrics.completionRate}%</p>
                </div>
                <div className="col-span-2 bg-amber-500/10 border border-amber-500/10 p-5 rounded-2xl flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Pending Deliverables</p>
                    <p className="text-xl font-black text-amber-400">{metrics.pendingDeliverables} Items</p>
                  </div>
                  <FileText className="w-8 h-8 text-amber-500/50" />
                </div>
                <div className="col-span-2 bg-orange-500/10 border border-orange-500/10 p-5 rounded-2xl flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-orange-500">Overdue Tasks</p>
                    <p className="text-xl font-black text-orange-400">{metrics.overdueTasks} Tasks</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500/50" />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* --- Marketing & BI Suite --- */
        <div className="space-y-8">
          {/* Tool Selector */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
            {(['deals', 'audit', 'emotions', 'email', 'social'] as const).map(t => (
              <button
                key={t} onClick={() => { setToolType(t); setGeneratedContent(''); }}
                className={`flex-1 py-3 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${toolType === t ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}
              >
                {t === 'deals' && <Briefcase className="w-4 h-4" />}
                {t === 'audit' && <BarChart3 className="w-4 h-4" />}
                {t === 'emotions' && <Heart className="w-4 h-4" />}
                {t === 'email' && <Mail className="w-4 h-4" />}
                {t === 'social' && <Hash className="w-4 h-4" />}
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Deals Dashboard */}
            {toolType === 'deals' && dealsData && (
              <div className="lg:col-span-2 glass-panel p-10 squircle-lg space-y-8 border border-white/5 bg-black/40">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20"><Briefcase className="w-6 h-6" /></div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Deals Dashboard</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Total Leads</p>
                    <p className="text-3xl font-black text-white">{dealsData.totalLeads}</p>
                  </div>
                  <div className="bg-primary/10 border border-primary/10 p-6 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Converted</p>
                    <p className="text-3xl font-black text-emerald-400">{dealsData.converted}</p>
                  </div>
                  <div className="bg-primary/10 border border-primary/10 p-6 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Active</p>
                    <p className="text-3xl font-black text-blue-400">{dealsData.activeProductions}</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/10 p-6 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Lost</p>
                    <p className="text-3xl font-black text-red-400">{dealsData.lost}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-6 rounded-2xl flex flex-col justify-center items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Conv. Rate</p>
                    <div className="text-3xl font-black text-white">{dealsData.conversionRate}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Trend Audit & Insights */}
            {toolType === 'audit' && trendAudit && (
              <>
                <div className="glass-panel p-10 squircle-lg space-y-8 border border-white/5 bg-black/40">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20"><BarChart3 className="w-6 h-6" /></div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">Trend Audit</h2>
                    </div>
                    <div className={`px-6 py-4 rounded-2xl border flex flex-col items-center ${getHealthColorClass(trendAudit.healthColor)}`}>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">Health Score</p>
                      <p className="text-3xl font-black">{trendAudit.healthScore}/100</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-5 rounded-2xl"><p className="text-[10px] text-zinc-500 font-black uppercase">Revenue</p><p className="text-xl font-bold mt-1">₹{trendAudit.totalRevenue.toLocaleString()}</p></div>
                    <div className="bg-white/5 p-5 rounded-2xl"><p className="text-[10px] text-zinc-500 font-black uppercase">Pending</p><p className="text-xl font-bold mt-1 text-red-400">₹{trendAudit.pendingCollections.toLocaleString()}</p></div>
                    <div className="bg-white/5 p-5 rounded-2xl"><p className="text-[10px] text-zinc-500 font-black uppercase">Avg Project</p><p className="text-xl font-bold mt-1">₹{Math.round(trendAudit.averageProjectValue).toLocaleString()}</p></div>
                    <div className="bg-white/5 p-5 rounded-2xl"><p className="text-[10px] text-zinc-500 font-black uppercase">Popular</p><p className="text-sm font-bold mt-1 truncate">{trendAudit.mostPopularService}</p></div>
                  </div>
                </div>
                <div className="glass-panel p-10 squircle-lg space-y-8 border border-white/5 bg-black/40">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500 border border-purple-500/20"><Megaphone className="w-6 h-6" /></div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Strategic Insights</h2>
                  </div>
                  <div className="space-y-4">
                    {insights.map((insight, idx) => (
                      <div key={idx} className={`p-6 rounded-2xl border flex items-start gap-4 ${insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : insight.type === 'success' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest mb-1">{insight.title}</p>
                          <p className="text-sm text-white/80 font-medium">{insight.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Emotions Engine */}
            {toolType === 'emotions' && (
              <div className="lg:col-span-2 glass-panel p-10 squircle-lg space-y-8 border border-white/5 bg-black/40">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-pink-500/10 rounded-2xl text-pink-500 border border-pink-500/20"><Heart className="w-6 h-6" /></div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Emotions Engine</h2>
                </div>
                {emotionsData.length === 0 ? (
                  <p className="text-zinc-500 italic text-center py-10">No upcoming birthdays or anniversaries found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {emotionsData.map((ev, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/10 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-3 rounded-xl ${ev.type === 'Birthday' ? 'bg-orange-500/20 text-orange-400' : 'bg-pink-500/20 text-pink-400'}`}>
                            {ev.type === 'Birthday' ? <Gift className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-white font-bold">{ev.personName}</p>
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{ev.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold mb-4">
                          <Calendar className="w-4 h-4" /> {ev.date}
                        </div>
                        <p className="text-xs text-zinc-300 italic">"{ev.template}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content Generators (Email & Social) */}
            {(toolType === 'email' || toolType === 'social') && (
              <>
                <div className="glass-panel p-10 squircle-lg space-y-8 border border-white/5 bg-black/40">
                  <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
                    {toolType === 'email' ? 'Email Engine' : 'Social Intel'}
                  </h2>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase text-zinc-600 px-1 tracking-widest">Select Client</label>
                      <select
                        className="w-full bg-black border border-white/5 p-5 rounded-2xl text-sm font-black text-white outline-none focus:border-primary/50 shadow-inner"
                        value={selectedClientId}
                        onChange={e => setSelectedClientId(e.target.value)}
                      >
                        <option value="">Choose a client...</option>
                        {filteredClients.map(c => <option key={c.id} value={c.id} className="bg-zinc-900">{c.projectName} ({c.brand})</option>)}
                      </select>
                    </div>

                    {toolType === 'email' && (
                      <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-zinc-600 px-1 tracking-widest">Template Type</label>
                        <div className="grid grid-cols-2 gap-3">
                          {(['Welcome Email', 'Payment Reminder', 'Event Confirmation', 'Deliverables Ready', 'Thank You Email'] as EmailTemplateType[]).map(type => (
                            <button 
                              key={type}
                              onClick={() => setEmailSubtype(type)} 
                              className={`py-4 px-2 rounded-2xl text-[10px] font-black uppercase border transition-all ${emailSubtype === type ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-black border-white/5 text-zinc-600 hover:text-white'}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {toolType === 'social' && (
                      <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-zinc-600 px-1 tracking-widest">Theme / Context</label>
                        <input
                          className="w-full bg-black border border-white/5 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:border-primary/50"
                          placeholder="e.g. Traditional Vibes, Fun & Candid..."
                          value={socialTheme}
                          onChange={e => setSocialTheme(e.target.value)}
                        />
                      </div>
                    )}

                    <button
                      onClick={handleGenerateContent}
                      disabled={!selectedClientId}
                      className="w-full py-6 bg-white text-black font-black rounded-[1.5rem] text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 disabled:opacity-10 mt-8"
                    >
                      <Sparkles className="w-5 h-5" />
                      Generate {toolType === 'email' ? 'Draft' : 'Content'}
                    </button>
                  </div>
                </div>

                <div className="glass-panel border border-white/5 rounded-[3rem] p-10 relative overflow-hidden bg-black/40 flex flex-col h-full min-h-[400px]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-600">Local Synthesis Output</h3>
                    {generatedContent && (
                      <button onClick={copyToClipboard} className="p-3 bg-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-2xl transition-all border border-white/10 shadow-xl">
                        {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 bg-black/60 border border-white/5 p-8 rounded-[2rem] overflow-y-auto">
                    {generatedContent ? (
                      <div className="text-zinc-200 whitespace-pre-wrap font-medium text-sm leading-relaxed font-sans">
                        {generatedContent}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-black uppercase tracking-widest">
                        Ready to generate
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIToolsView;


