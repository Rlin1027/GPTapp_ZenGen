import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, Volume2, Download, RefreshCw } from 'lucide-react';
import { MeditationSession } from '../types';
import { getAudioContext } from '../utils/audio';
import Button from './Button';

interface Props {
  session: MeditationSession;
  onReset: () => void;
}

const MeditationPlayer: React.FC<Props> = ({ session, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const [volume, setVolume] = useState(0.8);
  const gainNodeRef = useRef<GainNode | null>(null);

  const ctx = getAudioContext();

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // ignore already stopped errors
      }
      audioSourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const updateProgress = () => {
    if (!session.audioBuffer) return;
    
    const elapsedTime = ctx.currentTime - startTimeRef.current;
    const duration = session.audioBuffer.duration;
    
    const currentProgress = Math.min((elapsedTime / duration) * 100, 100);
    setProgress(currentProgress);

    if (currentProgress < 100 && isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else if (currentProgress >= 100) {
      setIsPlaying(false);
      setProgress(100);
    }
  };

  const playAudio = () => {
    if (!session.audioBuffer) return;

    // Resume context if suspended (browser policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create source
    const source = ctx.createBufferSource();
    source.buffer = session.audioBuffer;

    // Create gain node for volume
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;
    gainNodeRef.current = gainNode;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Calculate offset if resuming
    const offset = (progress / 100) * session.audioBuffer.duration;
    
    startTimeRef.current = ctx.currentTime - offset;
    source.start(0, offset);
    
    audioSourceRef.current = source;
    setIsPlaying(true);

    // Handle end event
    source.onended = () => {
      // Only trigger if it finished naturally (not stopped by user)
      // We handle stop separately in pauseAudio
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const pauseAudio = () => {
    stopAudio();
    setIsPlaying(false);
    // Capture current progress is handled by the update loop before stopping
    // But since we stop the loop, the `progress` state is the last valid position.
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVol;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
        
        {/* Left: Visuals */}
        <div className="relative h-full min-h-[400px] bg-slate-800 rounded-3xl overflow-hidden shadow-2xl group">
          {session.imageUrl ? (
            <img 
              src={session.imageUrl} 
              alt={session.imagePrompt} 
              className={`w-full h-full object-cover transition-transform duration-[20s] ease-linear ${isPlaying ? 'scale-110' : 'scale-100'}`} 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center">
              <p className="text-white/20">Visuals loading...</p>
            </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/20 opacity-80"></div>

          {/* Audio Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-6 bg-gradient-to-t from-slate-900/90 to-transparent">
            <h2 className="text-3xl font-light text-white tracking-wide">{session.title}</h2>
            
            {/* Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden cursor-pointer" onClick={() => { /* Seek implementation optional */ }}>
              <div 
                className="bg-indigo-400 h-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(129,140,248,0.5)]" 
                style={{ width: `${progress}%` }} 
              />
            </div>

            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                <button 
                  onClick={togglePlay}
                  className="w-14 h-14 flex items-center justify-center bg-white text-slate-900 rounded-full hover:scale-105 transition-transform shadow-lg shadow-white/10"
                >
                  {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
                </button>
                
                <button onClick={() => { pauseAudio(); setProgress(0); startTimeRef.current = ctx.currentTime; }} className="p-2 text-white/70 hover:text-white transition-colors">
                  <SkipBack className="w-6 h-6" />
                </button>
               </div>

               <div className="flex items-center gap-2 group/vol">
                 <Volume2 className="text-white/70 w-5 h-5" />
                 <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={volume} 
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                 />
               </div>
            </div>
          </div>
        </div>

        {/* Right: Script & Details */}
        <div className="flex flex-col gap-6 h-full">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 flex-1 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">Meditation Script</h3>
            <div className="prose prose-invert prose-lg max-w-none leading-loose text-slate-300">
              {session.script.split('\n').map((line, i) => (
                <p key={i} className="mb-4">{line}</p>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button variant="secondary" onClick={onReset} className="flex-1">
              <RefreshCw className="w-4 h-4" />
              New Session
            </Button>
            <Button variant="ghost" className="flex-1 border border-slate-700">
              <Download className="w-4 h-4" />
              Save Script
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MeditationPlayer;