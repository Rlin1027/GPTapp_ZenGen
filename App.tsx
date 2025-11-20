import React, { useState } from 'react';
import { Sparkles, Wind, Brain, Clock, Music } from 'lucide-react';
import Button from './components/Button';
import MeditationPlayer from './components/MeditationPlayer';
import ChatWidget from './components/ChatWidget';
import { generateMeditationContent, generateMeditationImage, generateMeditationAudio } from './services/gemini';
import { AppView, MeditationSession, GenerationParams } from './types';

export default function App() {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [params, setParams] = useState<GenerationParams>({
    mood: '',
    duration: 'Short',
    focus: ''
  });
  const [session, setSession] = useState<MeditationSession | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  const handleGenerate = async () => {
    if (!params.mood || !params.focus) return;

    setView(AppView.GENERATING);
    
    try {
      // Step 1: Script
      setLoadingStep('Connecting to cosmic energy (Writing script)...');
      const content = await generateMeditationContent(params.mood, params.focus, params.duration);
      
      // Step 2: Parallel Media Generation
      setLoadingStep('Visualizing serenity & synthesizing voice...');
      
      const [imageUrl, audioBuffer] = await Promise.all([
        generateMeditationImage(content.imagePrompt),
        generateMeditationAudio(content.script)
      ]);

      setSession({
        ...content,
        imageUrl,
        audioBuffer
      });

      setView(AppView.PLAYER);
    } catch (error) {
      console.error(error);
      setLoadingStep('Error connecting. Please try again.');
      setTimeout(() => setView(AppView.HOME), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 selection:bg-indigo-500/30 overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] animate-pulse-slow"></div>
         <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(AppView.HOME)}>
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-medium tracking-tight">ZenGen</h1>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Gallery</a>
            <a href="#" className="hover:text-white transition-colors">My Sessions</a>
            <a href="#" className="hover:text-white transition-colors">Profile</a>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex flex-col justify-center">
          
          {view === AppView.HOME && (
            <div className="max-w-2xl mx-auto w-full animate-in slide-in-from-bottom-10 fade-in duration-700">
              <div className="text-center mb-12">
                <h2 className="text-5xl md:text-6xl font-light tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                  Create your sanctuary.
                </h2>
                <p className="text-lg text-slate-400 font-light max-w-lg mx-auto">
                  AI-generated guided meditations tailored to your emotional state and available time.
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl space-y-6">
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 ml-1">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    How are you feeling right now?
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., Stressed about a deadline, Anxious about travel, Need to sleep..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 text-lg text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    value={params.mood}
                    onChange={(e) => setParams({...params, mood: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 ml-1">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      What is your goal?
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g., Calm, Focus, Sleep"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      value={params.focus}
                      onChange={(e) => setParams({...params, focus: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 ml-1">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      Duration
                    </label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-700">
                      {['Short', 'Medium', 'Long'].map((d) => (
                        <button
                          key={d}
                          onClick={() => setParams({...params, duration: d})}
                          className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                            params.duration === d 
                              ? 'bg-indigo-600 text-white shadow-lg' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full text-lg py-4" 
                    onClick={handleGenerate}
                    disabled={!params.mood || !params.focus}
                  >
                    <Music className="w-5 h-5" />
                    Generate Session
                  </Button>
                </div>
              </div>
            </div>
          )}

          {view === AppView.GENERATING && (
            <div className="flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Wind className="w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-light text-white mb-2">Crafting your experience</h3>
              <p className="text-slate-400 animate-pulse">{loadingStep}</p>
            </div>
          )}

          {view === AppView.PLAYER && session && (
            <MeditationPlayer 
              session={session} 
              onReset={() => setView(AppView.HOME)} 
            />
          )}
        </main>

        <ChatWidget />
      </div>
    </div>
  );
}