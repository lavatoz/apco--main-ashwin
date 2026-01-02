
import React, { useState } from 'react';
import { Sparkles, Mail, TrendingUp, RefreshCcw, Send, Copy, Check, MessageSquare, Instagram, Zap, Heart, Gift, Lightbulb, Megaphone } from 'lucide-react';
import type { Client } from '../types';
import { generateEmailDraft, analyzeBusinessTrends, generateSocialCaption, generatePromoScript, generateEmotionalGreeting, generateEventConcept } from '../services/geminiService';

interface AIToolsViewProps {
  clients: Client[];
  selectedBrand: string | 'All';
}

const AIToolsView: React.FC<AIToolsViewProps> = ({ clients, selectedBrand }) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [toolType, setToolType] = useState<'email' | 'social' | 'promo' | 'nurture' | 'concept'>('email');
  const [emailSubtype, setEmailSubtype] = useState<'welcome' | 'thank_you'>('welcome');
  const [nurtureSubtype, setNurtureSubtype] = useState<'Birthday' | 'Anniversary'>('Birthday');
  const [socialTheme, setSocialTheme] = useState('');
  const [promoOffer, setPromoOffer] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [analysis, setAnalysis] = useState('');

  const filteredClients = selectedBrand === 'All' ? clients : clients.filter(c => c.brand === selectedBrand);

  const handleGenerate = async () => {
    if (!selectedClientId && toolType !== 'promo') return;
    const client = clients.find(c => c.id === selectedClientId);
    if (!client && toolType !== 'promo') return;

    setIsLoading(true);
    let result = '';
    
    if (toolType === 'email') {
      result = await generateEmailDraft(emailSubtype as any, client!);
    } else if (toolType === 'social') {
      result = await generateSocialCaption(client!, socialTheme || 'General highlights');
    } else if (toolType === 'promo') {
      result = await generatePromoScript(client!, promoOffer);
    } else if (toolType === 'nurture') {
      result = await generateEmotionalGreeting(client!, nurtureSubtype);
    } else if (toolType === 'concept') {
      result = await generateEventConcept(client!);
    }
    
    setGeneratedContent(result);
    setIsLoading(false);
  };

  const handleAnalyzeTrends = async () => {
    setIsLoading(true);
    const mockData = [
      { name: 'Jan', value: 250000 },
      { name: 'Feb', value: 400000 },
      { name: 'Mar', value: 150000 },
      { name: 'Apr', value: 900000 },
    ];
    const result = await analyzeBusinessTrends(mockData);
    setAnalysis(result);
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent || analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 animate-ios-slide-up pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter uppercase leading-none">
            CoPilot AI Suite
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Enterprise Relationship Intelligence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-10 squircle-lg space-y-10 border border-white/5">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
             {(['email', 'social', 'promo', 'nurture', 'concept'] as const).map(t => (
               <button 
                key={t} onClick={() => {setToolType(t); setGeneratedContent('');}}
                className={`flex-1 py-3 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${toolType === t ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}
               >
                 {t === 'nurture' ? 'Emotions' : t === 'promo' ? 'Deals' : t}
               </button>
             ))}
          </div>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase text-zinc-600 px-1 tracking-widest">Select Project Profile</label>
              <select 
                className="w-full bg-black border border-white/5 p-5 rounded-2xl text-sm font-black text-white outline-none focus:border-blue-500/50 shadow-inner"
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
              >
                <option value="">Choose an account...</option>
                {filteredClients.map(c => <option key={c.id} value={c.id} className="bg-zinc-900">{c.projectName} ({c.brand})</option>)}
              </select>
            </div>

            {toolType === 'email' && (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setEmailSubtype('welcome')} className={`py-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${emailSubtype === 'welcome' ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-black border-white/5 text-zinc-600'}`}>Onboarding</button>
                <button onClick={() => setEmailSubtype('thank_you')} className={`py-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${emailSubtype === 'thank_you' ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-black border-white/5 text-zinc-600'}`}>Post-Event</button>
              </div>
            )}

            {toolType === 'nurture' && (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setNurtureSubtype('Birthday')} className={`py-4 rounded-2xl text-[10px] font-black uppercase border transition-all flex items-center justify-center gap-3 ${nurtureSubtype === 'Birthday' ? 'bg-pink-600 border-pink-600 text-white shadow-xl shadow-pink-500/20' : 'bg-black border-white/5 text-zinc-600'}`}>
                  <Gift className="w-4 h-4" /> Birthday
                </button>
                <button onClick={() => setNurtureSubtype('Anniversary')} className={`py-4 rounded-2xl text-[10px] font-black uppercase border transition-all flex items-center justify-center gap-3 ${nurtureSubtype === 'Anniversary' ? 'bg-pink-600 border-pink-600 text-white shadow-xl shadow-pink-500/20' : 'bg-black border-white/5 text-zinc-600'}`}>
                  <Heart className="w-4 h-4" /> Anniversary
                </button>
              </div>
            )}

            <button 
              onClick={handleGenerate}
              disabled={isLoading || (!selectedClientId && toolType !== 'promo')}
              className="w-full py-6 bg-white text-black font-black rounded-[1.5rem] text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 disabled:opacity-10"
            >
              {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Synthesize with Gemini
            </button>
          </div>
        </div>

        <div className="glass-panel p-10 squircle-lg space-y-10 border border-white/5 flex flex-col justify-between">
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="p-5 bg-emerald-500/10 rounded-3xl border border-emerald-500/10 text-emerald-500 shadow-xl">
                   <TrendingUp className="w-8 h-8" />
                 </div>
                 <h2 className="text-2xl font-black uppercase tracking-tight">Business IQ</h2>
              </div>
              <p className="text-xs text-zinc-500 font-bold leading-relaxed tracking-wide uppercase">
                Predictive market analysis based on your ledger data. Run a trend audit to identify growth hubs in the Indian production market.
              </p>
           </div>
           
           <div className="space-y-6">
              <button 
                onClick={handleAnalyzeTrends}
                disabled={isLoading}
                className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-[1.5rem] text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95"
              >
                {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                Execute Trend Audit
              </button>
              
              <div className="p-8 bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500/20" />
                 <h4 className="text-[10px] font-black uppercase text-emerald-500 mb-3 tracking-widest flex items-center gap-3">
                    <Megaphone className="w-4 h-4" /> Strategic Intel
                 </h4>
                 <p className="text-[11px] font-bold text-zinc-400 leading-relaxed uppercase tracking-tight">
                    Personalized anniversary "Emotions" messages drive a 40% increase in secondary bookings for family events.
                 </p>
              </div>
           </div>
        </div>
      </div>

      {(generatedContent || analysis) && (
        <div className="glass-panel border border-white/5 rounded-[3rem] p-12 animate-ios-slide-up relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-600">Copilot Synthesis Output</h3>
              <div className="flex gap-3">
                <button onClick={copyToClipboard} className="p-4 bg-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-2xl transition-all border border-white/10 shadow-xl">
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
           </div>
           <div className="bg-black/60 border border-white/5 p-12 rounded-[2rem] min-h-[250px] relative">
              <div className="text-zinc-100 whitespace-pre-wrap font-bold text-lg leading-relaxed relative z-10 font-sans">
                 {generatedContent || analysis}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AIToolsView;
