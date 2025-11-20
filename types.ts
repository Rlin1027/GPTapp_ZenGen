export interface MeditationSession {
  title: string;
  script: string;
  imagePrompt: string;
  imageUrl?: string;
  audioBuffer?: AudioBuffer;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum AppView {
  HOME = 'HOME',
  GENERATING = 'GENERATING',
  PLAYER = 'PLAYER'
}

export interface GenerationParams {
  mood: string;
  duration: string; // "Short" | "Medium" | "Long"
  focus: string;
}