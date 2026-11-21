import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, Moon, Cloud, Flower, Star, Sun, Zap, Coffee,
  Bold, Italic, Underline, Highlighter, AlignLeft, AlignCenter, AlignRight,
  Type, Palette, Plus, X, Sparkles, RotateCcw, Save,
  TrendingUp, Shield, Download, Brain, Settings, HelpCircle,
  Eye, EyeOff, Key, FileText, Calendar, BarChart3, Target,
  Mic, MicOff, Volume2, VolumeX, Play, Pause, BookOpen,
  CheckCircle2, AlertCircle, Clock, Lightbulb, Activity,
  Search, Filter, SortDesc, Archive, Trash2, Edit3,
  ChevronDown, ChevronRight, Monitor, Smartphone, Tablet,
  Upload, Image, Link, Hash, Bookmark, Globe, Layers
} from 'lucide-react';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import TechniqueShell from './TechniqueShell';

// Journaling's own look: blue ink washed across the top of the desk, and a warm lamp that
// glows brighter while the page is being written on.
const InkDesk = ({ lamp }) => (
  <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg, #DDE5F6 0%, #ECEFF6 38%, #F4F1EA 100%)' }}>
    <div className="absolute -top-[20vh] right-[-10vw] h-[80vh] w-[80vh] rounded-full transition-opacity duration-1000"
      style={{ background: 'radial-gradient(circle, rgba(255,214,150,0.75), rgba(255,214,150,0) 65%)', opacity: lamp ? 1 : 0.45 }} />
    <svg className="absolute left-[4vw] top-[52vh] h-40 w-40 opacity-[0.08]" viewBox="0 0 100 100" aria-hidden="true">
      <path fill="#1F3A8A" d="M50 12c14 2 30 10 32 26 2 12-8 16-6 26s-8 22-24 22-30-8-32-22 6-18 4-28S34 10 50 12z" />
      <circle cx="88" cy="18" r="4" fill="#1F3A8A" /><circle cx="12" cy="86" r="3" fill="#1F3A8A" />
    </svg>
    <svg className="absolute right-[8vw] top-[120vh] h-24 w-24 opacity-[0.07]" viewBox="0 0 100 100" aria-hidden="true">
      <path fill="#1F3A8A" d="M48 20c12 0 26 8 26 22s-10 14-8 24-10 16-20 14-22-8-22-20 8-12 6-22 6-18 18-18z" />
    </svg>
  </div>
);
import { speakSoftly, softVoices } from '../../services/softVoice';

// Enhanced prompt categories with difficulty levels and therapeutic approaches
const promptLibrary = {
  beginner: {
    empathic: [
      "What are three small things that brought you comfort today?",
      "Describe a place where you feel completely safe.",
      "What would you say to comfort a friend feeling like you do now?",
      "Write about the last time you felt genuinely happy.",
      "What colors describe your mood today and why?",
      "What made you smile recently, even if just for a moment?",
      "Describe someone who makes you feel understood.",
      "What's one thing you're grateful for right now?"
    ],
    cbt: [
      "What is one thought that keeps coming back today?",
      "If this problem had a simple solution, what might it be?",
      "What would you tell a friend in your situation?",
      "What's one small step you could take toward feeling better?",
      "What evidence do you have that this feeling will pass?",
      "What assumptions might you be making about this situation?",
      "How might someone else view what you're going through?",
      "What would happen if you tried a different approach?"
    ],
    creative: [
      "If your day was a weather report, what would it say?",
      "Write a short letter to your past self from one year ago.",
      "Describe your ideal peaceful morning in detail.",
      "What song best matches your current emotions?",
      "If you could have a conversation with your feelings, what would you ask?",
      "Imagine your stress as a character - what would it look like?",
      "Write about your emotions as if they were colors painting a canvas.",
      "If your thoughts had a voice, what would they sound like?"
    ],
    mindfulness: [
      "What do you notice about your breathing right now?",
      "Describe five things you can sense in this moment.",
      "What thoughts are passing through your mind without judgment?",
      "How does your body feel as you sit here writing?",
      "What sounds can you hear around you right now?",
      "Notice the weight of your hands - what do you feel?",
      "What textures can you touch from where you're sitting?",
      "Observe your emotions like clouds passing by - what do you see?"
    ]
  },
  intermediate: [
    "Explore the connection between your physical sensations and emotions right now.",
    "What patterns do you notice in your thinking when you feel this way?",
    "How has your perspective on this situation changed over time?",
    "What would it look like to hold space for both your pain and your hope?",
    "Write about a time when you successfully navigated similar feelings.",
    "What story are you telling yourself about this experience? What other stories exist?",
    "How might your current challenge be connected to your personal growth?",
    "What would self-compassion look like in this specific situation?",
    "Explore the relationship between your expectations and your current reality.",
    "What would you discover if you approached this with curiosity instead of judgment?"
  ],
  advanced: [
    "Examine the story you're telling yourself about this experience. What alternative narratives exist?",
    "How might your current struggle be connected to your deeper values and growth?",
    "What would radical self-compassion look like in this moment?",
    "Explore the paradox of accepting difficult emotions while also working to change them.",
    "What would you discover if you approached this situation with curious detachment?",
    "How do your past experiences influence your interpretation of current events?",
    "What would it mean to find meaning in this difficult experience?",
    "Explore the tension between control and acceptance in your current situation.",
    "How might your suffering be connected to your capacity for empathy and connection?",
    "What would it look like to embrace the uncertainty in your life right now?"
  ]
};

// Enhanced mood tracking with energy levels, categories, and intensity
const moodCategories = {
  emotional: [
    { emoji: '😊', label: 'Joyful', color: 'bg-yellow-200 hover:bg-yellow-300', value: 0.9, energy: 0.6 },
    { emoji: '💝', label: 'Grateful', color: 'bg-pink-200 hover:bg-pink-300', value: 0.8, energy: 0.5 },
    { emoji: '😌', label: 'Content', color: 'bg-green-200 hover:bg-green-300', value: 0.6, energy: 0.3 },
    { emoji: '🙂', label: 'Hopeful', color: 'bg-blue-200 hover:bg-blue-300', value: 0.5, energy: 0.4 },
    { emoji: '😐', label: 'Neutral', color: 'bg-gray-200 hover:bg-gray-300', value: 0, energy: 0 },
    { emoji: '😔', label: 'Sad', color: 'bg-blue-300 hover:bg-blue-400', value: -0.6, energy: -0.3 },
    { emoji: '😟', label: 'Anxious', color: 'bg-orange-200 hover:bg-orange-300', value: -0.4, energy: 0.6 },
    { emoji: '😢', label: 'Overwhelmed', color: 'bg-purple-200 hover:bg-purple-300', value: -0.8, energy: -0.5 },
    { emoji: '😤', label: 'Frustrated', color: 'bg-red-200 hover:bg-red-300', value: -0.7, energy: 0.7 }
  ],
  energy: [
    { emoji: '⚡', label: 'Energized', color: 'bg-yellow-200 hover:bg-yellow-300', value: 0.8, energy: 0.9 },
    { emoji: '☕', label: 'Alert', color: 'bg-orange-200 hover:bg-orange-300', value: 0.5, energy: 0.7 },
    { emoji: '🌊', label: 'Calm', color: 'bg-blue-200 hover:bg-blue-300', value: 0.3, energy: 0.2 },
    { emoji: '🍃', label: 'Peaceful', color: 'bg-green-200 hover:bg-green-300', value: 0.4, energy: 0.1 },
    { emoji: '😴', label: 'Tired', color: 'bg-purple-200 hover:bg-purple-300', value: -0.2, energy: -0.4 },
    { emoji: '🌙', label: 'Drained', color: 'bg-indigo-200 hover:bg-indigo-300', value: -0.4, energy: -0.7 },
    { emoji: '🔋', label: 'Restless', color: 'bg-red-200 hover:bg-red-300', value: -0.1, energy: 0.8 }
  ],
  physical: [
    { emoji: '💪', label: 'Strong', color: 'bg-green-200 hover:bg-green-300', value: 0.7, energy: 0.8 },
    { emoji: '🧘', label: 'Relaxed', color: 'bg-purple-200 hover:bg-purple-300', value: 0.6, energy: 0.2 },
    { emoji: '🤕', label: 'Unwell', color: 'bg-red-200 hover:bg-red-300', value: -0.5, energy: -0.6 },
    { emoji: '😷', label: 'Under Weather', color: 'bg-gray-200 hover:bg-gray-300', value: -0.3, energy: -0.4 },
    { emoji: '🏃', label: 'Active', color: 'bg-blue-200 hover:bg-blue-300', value: 0.5, energy: 0.9 },
    { emoji: '🛌', label: 'Resting', color: 'bg-indigo-200 hover:bg-indigo-300', value: 0.2, energy: -0.2 }
  ]
};

// Advanced sentiment analysis with context awareness and therapeutic insights
const analyzeSentiment = (text) => {
  if (!text || text.length < 10) return { 
    polarity: 0, subjectivity: 0, arousal: 0, complexity: 0, coherence: 0, growth: 0,
    selfCompassion: 0, mindfulness: 0, resilience: 0, problemSolving: 0
  };
  
  const positiveWords = ['happy', 'joy', 'love', 'peace', 'hope', 'grateful', 'calm', 'better', 'good', 'positive', 'wonderful', 'amazing', 'blessed', 'thankful', 'proud', 'excited', 'optimistic', 'confident', 'serene', 'content'];
  const negativeWords = ['sad', 'pain', 'hurt', 'angry', 'fear', 'worried', 'anxious', 'depressed', 'lonely', 'lost', 'broken', 'difficult', 'struggling', 'terrible', 'awful', 'hopeless', 'frustrated', 'disappointed', 'overwhelmed', 'stressed'];
  const growthWords = ['learn', 'grow', 'understand', 'realize', 'discover', 'insight', 'progress', 'healing', 'journey', 'strength', 'resilience', 'courage', 'wisdom', 'perspective', 'change', 'transform', 'accept', 'forgive'];
  const complexityWords = ['however', 'although', 'despite', 'nevertheless', 'complex', 'nuanced', 'paradox', 'contradiction', 'balance', 'both', 'yet', 'still', 'ambivalent', 'mixed'];
  const selfCompassionWords = ['kind', 'gentle', 'patient', 'understanding', 'forgive', 'human', 'normal', 'okay', 'enough', 'worthy', 'deserving', 'compassion'];
  const mindfulnessWords = ['present', 'moment', 'aware', 'notice', 'observe', 'breath', 'body', 'sensation', 'feeling', 'here', 'now', 'mindful'];
  const resilienceWords = ['overcome', 'survive', 'endure', 'persevere', 'bounce', 'recover', 'adapt', 'cope', 'manage', 'handle', 'through', 'strong'];
  const problemSolvingWords = ['solution', 'solve', 'plan', 'strategy', 'approach', 'try', 'attempt', 'option', 'choice', 'decide', 'action', 'step'];
  
  const words = text.toLowerCase().split(/\W+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const totalWords = words.length;
  
  const posCount = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
  const negCount = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;
  const growthCount = words.filter(word => growthWords.some(gw => word.includes(gw))).length;
  const complexityCount = words.filter(word => complexityWords.some(cw => word.includes(cw))).length;
  const selfCompassionCount = words.filter(word => selfCompassionWords.some(sc => word.includes(sc))).length;
  const mindfulnessCount = words.filter(word => mindfulnessWords.some(mw => word.includes(mw))).length;
  const resilienceCount = words.filter(word => resilienceWords.some(rw => word.includes(rw))).length;
  const problemSolvingCount = words.filter(word => problemSolvingWords.some(ps => word.includes(ps))).length;
  
  // Calculate coherence based on sentence structure and flow
  const avgSentenceLength = totalWords / Math.max(sentences.length, 1);
  const coherence = Math.min(1, avgSentenceLength / 15) * (sentences.length > 1 ? 1 : 0.5);
  
  return {
    polarity: Math.max(-1, Math.min(1, (posCount - negCount) / Math.max(totalWords * 0.1, 1))),
    subjectivity: Math.min(1, (posCount + negCount + growthCount) / Math.max(totalWords * 0.15, 1)),
    arousal: Math.min(1, words.filter(w => ['!', 'very', 'extremely', 'intense', 'overwhelming'].some(aw => w.includes(aw))).length / Math.max(totalWords * 0.05, 1)),
    complexity: Math.min(1, complexityCount / Math.max(totalWords * 0.05, 1)),
    coherence: coherence,
    growth: Math.min(1, growthCount / Math.max(totalWords * 0.08, 1)),
    selfCompassion: Math.min(1, selfCompassionCount / Math.max(totalWords * 0.05, 1)),
    mindfulness: Math.min(1, mindfulnessCount / Math.max(totalWords * 0.05, 1)),
    resilience: Math.min(1, resilienceCount / Math.max(totalWords * 0.05, 1)),
    problemSolving: Math.min(1, problemSolvingCount / Math.max(totalWords * 0.05, 1))
  };
};

// Enhanced smart intervention system with therapeutic approaches
const generateSmartIntervention = (sentiment, mood, timeOfDay, sessionLength, previousInterventions = []) => {
  const interventions = {
    grounding: [
      "Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.",
      "Take three deep breaths. With each exhale, let your shoulders drop a little more.",
      "Feel your feet on the ground. You are here, you are present. You can stop if this feels uncomfortable.",
      "Place your hand on your heart. Feel it beating steadily, supporting you through this moment.",
      "Look around and name three objects you can see. Notice their colors and textures.",
      "Press your palms together and feel the warmth and pressure. You are connected to yourself."
    ],
    reframing: [
      "What would you tell your best friend if they shared these exact thoughts with you?",
      "How might you view this situation differently in 5 years? What growth might come from this?",
      "This feeling is like weather - temporary, changing, part of a larger pattern.",
      "You've survived 100% of your difficult days so far. That's a perfect track record.",
      "What would happen if you assumed positive intent in this situation?",
      "Is this thought helpful right now? What would be more supportive to think instead?"
    ],
    selfCompassion: [
      "You're doing the best you can with the resources you have right now.",
      "It's okay to not be okay. Healing isn't linear, and you're exactly where you need to be.",
      "Speaking to yourself with the same kindness you'd show a dear friend is a radical act of love.",
      "Your feelings are messengers, not permanent residents. Thank them and let them pass through.",
      "What you're experiencing is part of being human. You are not alone in feeling this way.",
      "Place your hand on your chest and offer yourself the compassion you need right now."
    ],
    motivation: [
      "Every word you write is an act of courage and self-care.",
      "You're building emotional resilience simply by showing up here.",
      "Your willingness to explore your inner world is creating positive change.",
      "This practice of reflection is strengthening your capacity for growth.",
      "You are creating a sacred space for your thoughts and feelings.",
      "Your commitment to understanding yourself is a gift to your future self."
    ],
    mindfulness: [
      "Return to your breath. Each breath is an anchor to the present moment.",
      "Notice the thoughts without becoming them. You are the observer of your experience.",
      "What sensations do you feel in your body right now? Just notice without changing anything.",
      "Can you create a small space between you and your emotions? You are not your feelings.",
      "Breathe in awareness, breathe out tension. Check that your surroundings are suitable before continuing. You can pause or stop.",
      "Your awareness is like the sky - vast enough to hold all weather patterns of emotion."
    ]
  };
  
  let category = 'selfCompassion';
  if (sentiment.arousal > 0.6 || (mood.emotional?.value < -0.6)) category = 'grounding';
  else if (sentiment.polarity < -0.4 && sentiment.complexity > 0.3) category = 'reframing';
  else if (sentiment.growth > 0.4 || sentiment.resilience > 0.3) category = 'motivation';
  else if (sentiment.mindfulness > 0.3) category = 'mindfulness';
  
  // Avoid recently shown interventions
  const availableInterventions = interventions[category].filter(
    intervention => !previousInterventions.some(prev => prev.text === intervention)
  );
  
  if (availableInterventions.length === 0) {
    return interventions[category][Math.floor(Math.random() * interventions[category].length)];
  }
  
  return availableInterventions[Math.floor(Math.random() * availableInterventions.length)];
};

// Auto-save functionality with cloud sync simulation
const useAutoSave = (data, delay = 2000) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const timeoutRef = useRef(null);
  
  const saveData = useCallback(async (data) => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
      
      // Save to localStorage (simulating cloud sync)
      const saveData = {
        ...data,
        lastModified: new Date().toISOString(),
        version: Date.now()
      };
      localStorage.setItem('journalDraft', JSON.stringify(saveData));
      
      setLastSaved(new Date());
      setIsSaving(false);
    } catch {
      console.error('Journal auto-save failed');
      setSaveError('Failed to save');
      setIsSaving(false);
    }
  }, []);
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (data.text && data.text.length > 20) {
      timeoutRef.current = setTimeout(() => {
        saveData(data);
      }, delay);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, saveData]);
  
  return { isSaving, lastSaved, saveError };
};

// Enhanced voice features with better error handling
const useVoiceFeatures = () => {
  const [isReading, setIsReading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voiceError, setVoiceError] = useState(null);
  const utteranceRef = useRef(null);
  
  useEffect(() => {
    const loadVoices = () => {
      try {
        // Journal text is private: only voices that run on this device are offered.
        const availableVoices = softVoices(speechSynthesis.getVoices(), { allowOnline: false });
        setVoices(availableVoices);
        if (availableVoices.length > 0 && !selectedVoice) setSelectedVoice(availableVoices[0]);
      } catch {
        setVoiceError('Speech synthesis not supported');
      }
    };
    
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);
  
  const readText = (text) => {
    if (!text || voiceError) return;
    
    try {
      utteranceRef.current = speakSoftly(text, {
        allowOnline: false,
        voice: selectedVoice,
        rate: 0.8,
        onStart: () => setIsReading(true),
        onEnd: () => setIsReading(false),
        onError: (error) => {
          console.error('Speech error:', error);
          setIsReading(false);
          setVoiceError('Speech playback error');
        },
      });
    } catch {
      setVoiceError('Unable to read text aloud');
    }
  };
  
  const stopReading = () => {
    speechSynthesis.cancel();
    setIsReading(false);
  };
  
  return { readText, stopReading, isReading, voices, selectedVoice, setSelectedVoice, voiceError };
};

// Progress tracking hook
const useProgressTracking = () => {
  const [streakCount, setStreakCount] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [achievements, setAchievements] = useState([]);
  
  const updateProgress = useCallback((entries) => {
    // Calculate streak
    const sortedEntries = [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);
      
      if (entryDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (entryDate.getTime() === currentDate.getTime() + 24 * 60 * 60 * 1000) {
        // Allow for yesterday if no entry today
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    setStreakCount(streak);
    setTotalSessions(entries.length);
    
    // Check for achievements
    const newAchievements = [];
    if (entries.length >= 7 && !achievements.includes('first-week')) {
      newAchievements.push('first-week');
    }
    if (streak >= 7 && !achievements.includes('week-streak')) {
      newAchievements.push('week-streak');
    }
    if (entries.length >= 30 && !achievements.includes('month-milestone')) {
      newAchievements.push('month-milestone');
    }
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      return newAchievements;
    }
    return [];
  }, [achievements]);
  
  return { streakCount, totalSessions, achievements, updateProgress };
};

export default function AdvancedCalmJournal() {
  // Core states
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  
  // UI states
  const [activeTab, setActiveTab] = useState('write');
  const [showPrompt, setShowPrompt] = useState(true);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [promptDifficulty, setPromptDifficulty] = useState('beginner');
  const [promptCategory, setPromptCategory] = useState('empathic');
  const [showAchievements, setShowAchievements] = useState(false);
  
  // Mood and analytics
  const [mood, setMood] = useState({ energy: null, emotional: null, physical: null });
  const [moodCategory, setMoodCategory] = useState('emotional');
  const [moodIntensity, setMoodIntensity] = useState(5);
  const [sentimentData, setSentimentData] = useState({ 
    polarity: 0, subjectivity: 0, arousal: 0, complexity: 0, coherence: 0, growth: 0,
    selfCompassion: 0, mindfulness: 0, resilience: 0, problemSolving: 0
  });
  
  // Advanced features
  const [customPrompts, setCustomPrompts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  // Rich text and formatting
  const [fontSize, setFontSize] = useState('16px');
  const [fontFamily, setFontFamily] = useState('pencil');
  const [textAlign, setTextAlign] = useState('left');
  const [theme, setTheme] = useState('light');
  
  // Advanced functionality
  const [wordGoal, setWordGoal] = useState(null);
  const [timeGoal, setTimeGoal] = useState(null);
  const [sessionStart, setSessionStart] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [pageFocused, setPageFocused] = useState(false);
  const reduceMotion = useReducedMotion();
  const [writingMode, setWritingMode] = useState('freeform');
  
  // Interventions and insights
  const [interventions, setInterventions] = useState([]);
  const [showIntervention, setShowIntervention] = useState(false);
  const [currentIntervention, setCurrentIntervention] = useState('');
  const [insights, setInsights] = useState([]);
  
  // Privacy and security
  
  // Refs and hooks
  const textAreaRef = useRef(null);
  const interventionTimeoutRef = useRef(null);
  const hideInterventionTimeoutRef = useRef(null);
  useEffect(() => () => {
    clearTimeout(interventionTimeoutRef.current);
    clearTimeout(hideInterventionTimeoutRef.current);
  }, []);
  const { isSaving, lastSaved, saveError } = useAutoSave({ text, title, tags, mood });
  const { readText, stopReading, isReading, voices, selectedVoice, setSelectedVoice, voiceError } = useVoiceFeatures();
  const { streakCount, totalSessions, achievements, updateProgress } = useProgressTracking();
  
  // Initialize session
  useEffect(() => {
    if (!sessionStart && text.length > 0) {
      setSessionStart(new Date());
    }
  }, [text, sessionStart]);
  
  // Load saved data on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('journalDraft');
      const savedEntries = localStorage.getItem('journalEntries');
      const savedCustomPrompts = localStorage.getItem('customPrompts');
      const savedSettings = localStorage.getItem('journalSettings');
      
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.text) setText(draft.text);
        if (draft.title) setTitle(draft.title);
        if (draft.tags) setTags(draft.tags);
      }
      
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries);
        setEntries(parsedEntries);
        updateProgress(parsedEntries);
      }
      
      if (savedCustomPrompts) {
        setCustomPrompts(JSON.parse(savedCustomPrompts));
      }
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.theme) setTheme(settings.theme);
        if (settings.fontSize) setFontSize(settings.fontSize);
        if (settings.fontFamily) setFontFamily(settings.fontFamily);
        if (settings.promptDifficulty) setPromptDifficulty(settings.promptDifficulty);
        if (settings.promptCategory) setPromptCategory(settings.promptCategory);
      }
    } catch {
      console.error('Could not load saved journal data');
    }
  }, [updateProgress]);
  
  // Smart prompt selection
  useEffect(() => {
    const getSmartPrompt = () => {
      let prompts = [];
      if (promptDifficulty === 'beginner') {
        prompts = promptLibrary.beginner[promptCategory] || [];
      } else {
        prompts = promptLibrary[promptDifficulty] || [];
      }
      
      if (customPrompts.length > 0 && Math.random() < 0.3) {
        prompts = [...prompts, ...customPrompts];
      }
      
      return prompts[Math.floor(Math.random() * prompts.length)] || "What's on your mind today?";
    };
    
    setCurrentPrompt(getSmartPrompt());
  }, [promptDifficulty, promptCategory, customPrompts]);
  
  const generateInsight = useCallback((sentiment) => {
    const insightTemplates = [
      'Would you like to name one detail that matters to you in this entry?',
      'These word-pattern indicators cannot measure your mental health or personal growth.',
      'You can pause, leave this entry unfinished or seek support from someone you trust.',
      'Consider whether this prompt fits your experience; you do not need to agree with it.'
    ];

    const insight = {
      id: Date.now(),
      text: insightTemplates[Math.floor(Math.random() * insightTemplates.length)],
      timestamp: new Date(),
      sentiment: sentiment,
      category: sentiment.growth > 0.4 ? 'growth' : sentiment.selfCompassion > 0.4 ? 'compassion' : 'processing'
    };

    setInsights(prev => [...prev.slice(-4), insight]);
  }, []);

  const triggerSmartIntervention = useCallback((currentSentiment) => {
    if (interventionTimeoutRef.current) clearTimeout(interventionTimeoutRef.current);

    interventionTimeoutRef.current = setTimeout(() => {
      const timeOfDay = new Date().getHours();
      const sessionLength = sessionStart ? (Date.now() - sessionStart.getTime()) / 1000 / 60 : 0;

      const intervention = generateSmartIntervention(
        currentSentiment,
        mood,
        timeOfDay,
        sessionLength,
        interventions.slice(-5)
      );

      setCurrentIntervention(intervention);
      setShowIntervention(true);

      clearTimeout(hideInterventionTimeoutRef.current);
      hideInterventionTimeoutRef.current = setTimeout(() => setShowIntervention(false), 15000);
    }, 3000);
  }, [sessionStart, mood, interventions]);

  // Real-time analysis
  useEffect(() => {
    if (text.length > 50) {
      const sentiment = analyzeSentiment(text, entries);
      setSentimentData(sentiment);
      
      // Generate insights periodically
      if (text.length > 200 && Math.random() < 0.1) {
        generateInsight(sentiment);
      }
      
      // Trigger smart intervention
      const wordCount = text.split(' ').filter(w => w.length > 0).length;
      if (wordCount > 0 && wordCount % 100 === 0) {
        triggerSmartIntervention(sentiment);
      }
    }
  }, [text, entries, generateInsight, triggerSmartIntervention]);
  
  // Save entries to localStorage
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('journalEntries', JSON.stringify(entries));
    }
  }, [entries]);
  
  // Save settings
  useEffect(() => {
    const settings = {
      theme, fontSize, fontFamily, promptDifficulty, promptCategory
    };
    localStorage.setItem('journalSettings', JSON.stringify(settings));
  }, [theme, fontSize, fontFamily, promptDifficulty, promptCategory]);
  

  

  
  const handleInterventionResponse = (helpful) => {
    const intervention = {
      id: Date.now(),
      text: currentIntervention,
      helpful,
      timestamp: new Date(),
      context: { 
        sentiment: sentimentData, 
        mood, 
        sessionLength: sessionStart ? (Date.now() - sessionStart.getTime()) / 1000 / 60 : 0,
        wordCount: text.split(' ').filter(w => w.length > 0).length
      }
    };
    
    setInterventions(prev => [...prev, intervention]);
    setShowIntervention(false);
  };
  
  const saveEntry = async () => {
    if (!text.trim()) return;
    
    const entry = {
      id: Date.now(),
      title: title || `Entry from ${new Date().toLocaleDateString()}`,
      text,
      tags,
      mood,
      moodIntensity,
      sentiment: sentimentData,
      wordCount: text.split(' ').filter(w => w.length > 0).length,
      sessionLength: sessionStart ? (Date.now() - sessionStart.getTime()) / 1000 / 60 : 0,
      timestamp: new Date(),
      prompt: showPrompt ? currentPrompt : null,
      promptCategory,
      promptDifficulty,
      writingMode
    };
    
    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    
    // Check for new achievements
    const newAchievements = updateProgress(newEntries);
    if (newAchievements.length > 0) {
      setShowAchievements(true);
      setTimeout(() => setShowAchievements(false), 5000);
    }
    
    // Reset form
    setText('');
    setTitle('');
    setTags([]);
    setMood({ energy: null, emotional: null, physical: null });
    setMoodIntensity(5);
    setSessionStart(null);
    
    // Clear draft from localStorage
    localStorage.removeItem('journalDraft');
    
    // Show success notification
    showNotification('Entry saved successfully!', 'success');
  };
  
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-opacity duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };
  
  const getFilteredEntries = () => {
    return entries
      .filter(entry => {
        const matchesSearch = entry.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (entry.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesMood = filterMood === 'all' || 
                          (entry.mood?.emotional?.label.toLowerCase() === filterMood.toLowerCase());
        return matchesSearch && matchesMood;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date': return new Date(b.timestamp) - new Date(a.timestamp);
          case 'mood': return (b.sentiment?.polarity || 0) - (a.sentiment?.polarity || 0);
          case 'length': return b.wordCount - a.wordCount;
          case 'growth': return (b.sentiment?.growth || 0) - (a.sentiment?.growth || 0);
          default: return 0;
        }
      });
  };
  
  const getWritingStats = () => {
    const currentSession = {
      wordCount: text.split(' ').filter(w => w.length > 0).length,
      charCount: text.length,
      timeSpent: sessionStart ? Math.round((Date.now() - sessionStart.getTime()) / 1000 / 60) : 0,
      goalProgress: wordGoal ? Math.min(100, Math.round((text.split(' ').filter(w => w.length > 0).length / wordGoal) * 100)) : 0
    };
    
    const allTimeStats = entries.reduce((acc, entry) => ({
      totalEntries: acc.totalEntries + 1,
      totalWords: acc.totalWords + entry.wordCount,
      totalTime: acc.totalTime + (entry.sessionLength || 0),
      averageMood: acc.averageMood + (entry.sentiment?.polarity || 0),
      averageGrowth: acc.averageGrowth + (entry.sentiment?.growth || 0),
      averageLength: 0 // calculated below
    }), { totalEntries: 0, totalWords: 0, totalTime: 0, averageMood: 0, averageGrowth: 0 });
    
    if (allTimeStats.totalEntries > 0) {
      allTimeStats.averageMood = allTimeStats.averageMood / allTimeStats.totalEntries;
      allTimeStats.averageGrowth = allTimeStats.averageGrowth / allTimeStats.totalEntries;
      allTimeStats.averageLength = Math.round(allTimeStats.totalWords / allTimeStats.totalEntries);
    }
    
    return { currentSession, allTimeStats };
  };
  
  const exportData = (format = 'json') => {
    const data = {
      entries,
      customPrompts,
      interventions,
      insights,
      settings: { theme, fontSize, fontFamily, promptDifficulty, promptCategory },
      stats: {
        streakCount,
        totalSessions,
        achievements,
        ...getWritingStats().allTimeStats
      },
      metadata: {
        exportDate: new Date().toISOString(),
        totalEntries: entries.length,
        dateRange: entries.length > 0 ? {
          from: entries[entries.length - 1].timestamp,
          to: entries[0].timestamp
        } : null,
        version: '2.0'
      }
    };
    
    let content, filename, type;
    
    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      filename = `advanced-journal-export-${Date.now()}.json`;
      type = 'application/json';
    } else if (format === 'txt') {
      content = entries.map(entry => {
        const moodText = entry.mood?.emotional ? `Mood: ${entry.mood.emotional.emoji} ${entry.mood.emotional.label}` : '';
        const tagsText = (entry.tags || []).length > 0 ? `Tags: ${(entry.tags || []).join(', ')}` : '';
        return `${entry.title}\n${new Date(entry.timestamp).toLocaleString()}\n${moodText}\n${tagsText}\n${'-'.repeat(50)}\n${entry.text}\n\n`;
      }).join('\n');
      filename = `journal-entries-${Date.now()}.txt`;
      type = 'text/plain';
    } else if (format === 'csv') {
      const csvHeaders = 'Date,Title,Word Count,Mood,Sentiment,Growth Score,Tags\n';
      const csvRows = entries.map(entry => {
        const date = new Date(entry.timestamp).toISOString().split('T')[0];
        const mood = entry.mood?.emotional?.label || '';
        const sentiment = Math.round((entry.sentiment?.polarity || 0) * 100);
        const growth = Math.round((entry.sentiment?.growth || 0) * 100);
        const tags = (entry.tags || []).join(';');
        return `${date},"${entry.title.replace(/"/g, '""')}",${entry.wordCount},${mood},${sentiment},${growth},"${tags}"`;
      }).join('\n');
      content = csvHeaders + csvRows;
      filename = `journal-data-${Date.now()}.csv`;
      type = 'text/csv';
    }
    
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification(`Data exported as ${format.toUpperCase()}`, 'success');
  };
  
  const addCustomPrompt = () => {
    if (currentTag.trim()) {
      const newPrompts = [...customPrompts, currentTag.trim()];
      setCustomPrompts(newPrompts);
      localStorage.setItem('customPrompts', JSON.stringify(newPrompts));
      setCurrentTag('');
      showNotification('Custom prompt added!', 'success');
    }
  };
  
  const removeCustomPrompt = (index) => {
    const newPrompts = customPrompts.filter((_, i) => i !== index);
    setCustomPrompts(newPrompts);
    localStorage.setItem('customPrompts', JSON.stringify(newPrompts));
  };

  // REDESIGN: shared bits for the notebook look.
  const field = 'rounded-lg border-2 border-ink-900/20 bg-sheet px-3 py-2 text-ink-900 focus:border-ink-900 focus:outline-none';
  const round = 'flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink-900/20 bg-sheet text-ink-900 hover:border-ink-900';
  // The page is ruled, so the line height is fixed to the ruling. Older saved settings
  // (Georgia, Arial and so on) fall back to the pencil hand.
  const pageFonts = {
    pencil: { label: 'Pencil', className: 'font-pencil', size: 1.05 },
    marker: { label: 'Marker', className: 'font-handwritten', size: 1.35 },
    plain: { label: 'Plain', className: 'font-sans', size: 1 },
  };
  const pageFontKey = pageFonts[fontFamily] ? fontFamily : 'pencil';
  const pageFont = pageFonts[pageFontKey];
  const lineFor = (size) => `${Math.round(parseFloat(size) * 1.9)}px`;
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const sessionMinutes = sessionStart ? Math.round((Date.now() - sessionStart.getTime()) / 1000 / 60) : 0;

  const renderWriteTab = () => (
    <div className="space-y-6">
      {/* Achievement note */}
      {showAchievements && achievements.length > 0 && (
        <div className="paper-sheet fixed left-1/2 top-24 z-50 -translate-x-1/2 border-l-4 border-marigold-500 px-5 py-3" role="status">
          <p className="font-bold text-ink-900">A small milestone</p>
          <p className="text-sm text-ink-700">
            {achievements.includes('first-week') && 'First week of writing. '}
            {achievements.includes('week-streak') && 'Seven days in a row. '}
            {achievements.includes('month-milestone') && 'Thirty entries. '}
          </p>
        </div>
      )}

      {/* Gentle suggestion while writing */}
      {showIntervention && (
        <aside className="paper-sheet fixed right-4 top-24 z-50 max-w-sm border-l-4 border-sage-500 p-4 intervention-enter" role="status">
          <p className="margin-note text-[1.4rem]">A thought</p>
          <p className="mb-3 mt-1 text-sm leading-relaxed text-ink-800">{currentIntervention}</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => handleInterventionResponse(true)} className="btn-outline !px-3 !py-1 text-sm">That helps</button>
            <button type="button" onClick={() => handleInterventionResponse(false)} className="text-sm font-bold text-ink-700 underline underline-offset-4">Not now</button>
          </div>
        </aside>
      )}

      {/* Title and tags */}
      <div className="space-y-3">
        <label htmlFor="entry-title" className="sr-only">Entry title</label>
        <input
          id="entry-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A title, if you want one"
          className="w-full border-0 border-b-2 border-ink-900/20 bg-transparent px-1 py-2 font-handwritten text-[1.9rem] text-ink-900 placeholder:text-paper-400 focus:border-ink-900 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="entry-tag" className="sr-only">Add a tag</label>
          <input
            id="entry-tag"
            type="text"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && currentTag.trim()) {
                setTags([...tags, currentTag.trim()]);
                setCurrentTag('');
              }
            }}
            placeholder="Add a tag"
            className={field + ' w-40 !py-1.5 text-sm'}
          />
          <button
            type="button"
            aria-label="Add tag"
            onClick={() => {
              if (currentTag.trim()) {
                setTags([...tags, currentTag.trim()]);
                setCurrentTag('');
              }
            }}
            className={round}
          >
            <Plus size={16} />
          </button>
          {tags.map((tag, index) => (
            <span key={index} className="inline-flex items-center gap-1 rounded-full border-2 border-ink-900/20 px-2 py-0.5 text-sm text-ink-800">
              #{tag}
              <button type="button" aria-label={`Remove tag ${tag}`} onClick={() => setTags(tags.filter((_, i) => i !== index))} className="text-ink-700 hover:text-ink-900">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Mood */}
      <section aria-labelledby="mood-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 id="mood-heading" className="text-xl font-bold text-ink-900">How are you feeling? <span className="text-sm font-normal text-ink-700">(optional)</span></h3>
          <div className="flex gap-4" role="tablist" aria-label="Kind of feeling">
            {['emotional', 'energy', 'physical'].map(category => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={moodCategory === category}
                onClick={() => setMoodCategory(category)}
                className={`font-bold capitalize text-ink-900 ${moodCategory === category ? 'highlight' : 'text-ink-700 hover:underline hover:underline-offset-4'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex flex-wrap gap-1">
            {moodCategories[moodCategory].map((m, index) => {
              const on = mood[moodCategory]?.label === m.label;
              return (
                <button
                  key={index}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMood(prev => ({ ...prev, [moodCategory]: on ? null : m }))}
                  className="relative w-[5.5rem] px-1 py-2 text-center"
                >
                  {on && (
                    <Motion.span layoutId={`ink-${moodCategory}`} aria-hidden="true"
                      className="absolute inset-x-2 inset-y-1 -z-0 rounded-[46%_54%_42%_58%/55%_45%_55%_45%] bg-[#C9D6F2]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                  )}
                  <Motion.span className="relative block text-3xl" aria-hidden="true"
                    whileHover={reduceMotion ? undefined : { scale: 1.2, rotate: -6 }} whileTap={reduceMotion ? undefined : { scale: 0.9 }}>
                    {m.emoji}
                  </Motion.span>
                  <span className={`relative mt-1 block text-sm ${on ? 'font-bold text-ink-900' : 'text-ink-700'}`}>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {mood[moodCategory] && (
          <label className="mt-4 block max-w-md text-sm text-ink-800">
            How strong: <span className="font-bold text-ink-900">{moodIntensity}/10</span>
            <input
              type="range"
              min="1"
              max="10"
              value={moodIntensity}
              onChange={(e) => setMoodIntensity(parseInt(e.target.value))}
              className="mt-2 w-full accent-ink-900"
            />
          </label>
        )}
      </section>

      {/* Prompt */}
      <section aria-labelledby="prompt-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 id="prompt-heading" className="text-xl font-bold text-ink-900">Something to start with</h3>
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="prompt-depth">Prompt depth</label>
            <select id="prompt-depth" value={promptDifficulty} onChange={(e) => setPromptDifficulty(e.target.value)} className={field + ' !py-1.5 text-sm'}>
              <option value="beginner">Gentle</option>
              <option value="intermediate">Deeper</option>
              <option value="advanced">Harder</option>
            </select>
            <label className="sr-only" htmlFor="prompt-kind">Prompt kind</label>
            <select id="prompt-kind" value={promptCategory} onChange={(e) => setPromptCategory(e.target.value)} className={field + ' !py-1.5 text-sm'}>
              <option value="empathic">Kind</option>
              <option value="cbt">Thoughts (CBT)</option>
              <option value="creative">Creative</option>
              <option value="mindfulness">Mindful</option>
            </select>
          </div>
        </div>

        {showPrompt ? (
          <div className="flex items-start gap-3 border-l-4 border-[#3E6FD8] pl-4 [perspective:800px]">
            <AnimatePresence mode="wait" initial={false}>
              <Motion.p key={currentPrompt}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotateX: -70, y: -6 }}
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotateX: 70, y: 6 }}
                transition={{ duration: 0.35 }}
                style={{ transformOrigin: 'top center' }}
                className="flex-1 font-handwritten text-[clamp(1.75rem,3vw,2.2rem)] leading-snug text-[#1F3A8A]">
                {currentPrompt}
              </Motion.p>
            </AnimatePresence>
            <div className="flex shrink-0 gap-1">
              {voices.length > 0 && !voiceError && (
                <button type="button" onClick={() => isReading ? stopReading() : readText(currentPrompt)} className={round}
                  aria-label={isReading ? 'Stop reading' : 'Read the prompt aloud'}>
                  {isReading ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setCurrentPrompt(promptLibrary[promptDifficulty === 'beginner' ? 'beginner' : promptDifficulty][promptCategory === 'mindfulness' ? Math.random() > 0.5 ? 'empathic' : 'cbt' : promptCategory][Math.floor(Math.random() * (promptLibrary[promptDifficulty === 'beginner' ? 'beginner' : promptDifficulty][promptCategory] || promptLibrary.beginner.empathic).length)])}
                className={round}
                aria-label="Another prompt"
              >
                <RotateCcw size={16} />
              </button>
              <button type="button" onClick={() => setShowPrompt(false)} className={round} aria-label="Hide the prompt">
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowPrompt(true)} className="btn-outline">Show a prompt</button>
            <button type="button" onClick={() => setWritingMode(writingMode === 'freeform' ? 'guided' : 'freeform')}
              aria-pressed={writingMode === 'guided'} className="text-sm font-bold text-ink-800 underline underline-offset-4">
              {writingMode === 'freeform' ? 'Write with the prompt' : 'Write freely'}
            </button>
          </div>
        )}
      </section>

      {/* Page settings */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-ink-800">
        <label className="flex items-center gap-2">
          Text size
          <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className={field + ' !py-1 text-sm'}>
            <option value="14px">Small</option>
            <option value="16px">Medium</option>
            <option value="18px">Large</option>
            <option value="20px">Extra large</option>
            <option value="24px">Largest</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          Writing
          <select value={pageFontKey} onChange={(e) => setFontFamily(e.target.value)} className={field + ' !py-1 text-sm'}>
            {Object.entries(pageFonts).map(([value, f]) => <option key={value} value={value}>{f.label}</option>)}
          </select>
        </label>
        <div className="flex gap-1" role="group" aria-label="Text alignment">
          {[{ a: 'left', icon: AlignLeft }, { a: 'center', icon: AlignCenter }, { a: 'right', icon: AlignRight }].map(({ a, ...x }) => (
            <button key={a} type="button" onClick={() => setTextAlign(a)} aria-pressed={textAlign === a} aria-label={`Align ${a}`}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 ${textAlign === a ? 'border-ink-900' : 'border-transparent hover:border-ink-900/30'}`}>
              {React.createElement(x.icon, { size: 16 })}
            </button>
          ))}
        </div>
      </div>

      {/* The page itself */}
      <div className={`paper-sheet ruled relative py-8 pl-16 pr-6 transition-all duration-700 ${pageFocused ? 'shadow-[0_30px_80px_-30px_rgba(196,140,60,0.55)]' : 'motion-safe:-rotate-[0.4deg]'}`}
        style={{ '--line': lineFor(fontSize) }}>
        <label htmlFor="journal-text" className="sr-only">Journal entry</label>
        <textarea
          id="journal-text"
          ref={textAreaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setPageFocused(true)}
          onBlur={() => setPageFocused(false)}
          style={{
            fontSize: pageFont.size ? `calc(${fontSize} * ${pageFont.size})` : fontSize,
            textAlign,
            lineHeight: lineFor(fontSize),
            minHeight: focusMode ? '70vh' : `calc(${lineFor(fontSize)} * 12)`,
          }}
          className={`block w-full resize-none border-0 bg-transparent p-0 text-ink-900 placeholder:text-paper-400 focus:outline-none ${pageFont.className}`}
          placeholder={writingMode === 'guided' && showPrompt
            ? 'Start with the prompt, or anywhere else. There is no right answer.'
            : 'Write whatever is on your mind. Nobody else reads this.'}
        />
      </div>

      {/* Status line under the page */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-700" aria-live="polite">
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}{wordGoal ? ` of ${wordGoal}` : ''}</span>
        <span>{sessionMinutes} min{timeGoal ? ` of ${timeGoal}` : ''}</span>
        {isSaving && <span>Saving the draft…</span>}
        {lastSaved && !isSaving && <span>Draft saved in this browser at {lastSaved.toLocaleTimeString()}</span>}
        {saveError && <span className="font-bold text-red-800">{saveError}</span>}
        {streakCount > 0 && <span>{streakCount} {streakCount === 1 ? 'day' : 'days'} in a row</span>}
      </div>

      {/* Word-pattern indicators */}
      {text.length > 100 && (
        <details className="paper-sheet p-5">
          <summary className="cursor-pointer font-bold text-ink-900">Word-pattern counts (experimental)</summary>
          <p className="mt-2 text-sm text-ink-700">
            These count certain words in what you wrote. They are rough and can be wrong. They do not measure how you are.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ['Tone', `${Math.round(sentimentData.polarity * 100)}%`],
              ['Growth words', `${Math.round(sentimentData.growth * 100)}%`],
              ['Kind-to-self words', `${Math.round(sentimentData.selfCompassion * 100)}%`],
              ['Present-moment words', `${Math.round(sentimentData.mindfulness * 100)}%`],
            ].map(([k, v]) => (
              <div key={k}><dt className="text-sm text-ink-700">{k}</dt><dd className="text-xl font-bold text-ink-900">{v}</dd></div>
            ))}
          </dl>
        </details>
      )}

      {insights.length > 0 && (
        <section className="paper-sheet p-5">
          <h4 className="mb-2 font-bold text-ink-900">Notes from your writing</h4>
          <ul className="space-y-2">
            {insights.slice(-2).map(insight => (
              <li key={insight.id} className="font-handwritten text-[1.45rem] leading-snug text-ink-800">{insight.text}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-ink-800">
          <button type="button" onClick={() => setFocusMode(!focusMode)} aria-pressed={focusMode} className="underline underline-offset-4">
            {focusMode ? 'Smaller page' : 'Bigger page'}
          </button>
          <button type="button" onClick={() => setWordGoal(wordGoal ? null : 200)} aria-pressed={!!wordGoal} className="underline underline-offset-4">
            {wordGoal ? 'Remove word goal' : 'Aim for 200 words'}
          </button>
          <button type="button" onClick={() => setTimeGoal(timeGoal ? null : 15)} aria-pressed={!!timeGoal} className="underline underline-offset-4">
            {timeGoal ? 'Remove time goal' : 'Aim for 15 minutes'}
          </button>
          {voices.length > 0 && !voiceError && (
            <button type="button" onClick={() => isReading ? stopReading() : readText(text)} disabled={!text.trim()}
              className="underline underline-offset-4 disabled:opacity-40">
              {isReading ? 'Stop reading' : 'Read it back to me'}
            </button>
          )}
        </div>
        <button type="button" onClick={saveEntry} disabled={!text.trim()} className="btn-ink disabled:cursor-not-allowed disabled:opacity-40">
          <Save size={18} aria-hidden="true" /> Save entry
        </button>
      </div>
    </div>
  );

  const renderEntriesTab = () => {
    const filteredEntries = getFilteredEntries();
    
    return (
      <div className="space-y-6">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your entries..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-ink-900/20 bg-sheet focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <select
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
            className="px-4 py-3 rounded-lg border-2 border-ink-900/20 bg-sheet"
          >
            <option value="all">All Moods</option>
            <option value="joyful">Joyful</option>
            <option value="grateful">Grateful</option>
            <option value="content">Content</option>
            <option value="sad">Sad</option>
            <option value="anxious">Anxious</option>
            <option value="overwhelmed">Overwhelmed</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 rounded-lg border-2 border-ink-900/20 bg-sheet"
          >
            <option value="date">Latest First</option>
            <option value="mood">By Mood</option>
            <option value="length">By Length</option>
            <option value="growth">By Growth</option>
          </select>
        </div>

        {/* Entry Stats */}
        {entries.length > 0 && (
          <div className="paper-sheet p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{entries.length}</div>
                <div className="text-sm text-ink-700">Total Entries</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{streakCount}</div>
                <div className="text-sm text-ink-700">Day Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(entries.reduce((sum, e) => sum + e.wordCount, 0) / entries.length)}
                </div>
                <div className="text-sm text-ink-700">Avg Words</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">
                  {Math.round(entries.reduce((sum, e) => sum + (e.sentiment?.polarity || 0), 0) / entries.length * 100)}%
                </div>
                <div className="text-sm text-ink-700">Avg Mood</div>
              </div>
            </div>
          </div>
        )}

        {/* Entries List */}
        <div className="space-y-4">
          {filteredEntries.length > 0 ? (
            filteredEntries.map(entry => (
              <div key={entry.id} className="paper-sheet p-6 transition-colors cursor-pointer hover:border-ink-900/30 border-2 border-transparent"
                   onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-ink-900">{entry.title}</h3>
                    <p className="text-sm text-ink-700">
                      {new Date(entry.timestamp).toLocaleDateString(undefined, { 
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                      })} • {entry.wordCount} words
                      {entry.sessionLength && ` • ${Math.round(entry.sessionLength)}m session`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {entry.mood?.emotional && (
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{entry.mood.emotional.emoji}</span>
                        <span className="text-xs text-ink-700">{entry.moodIntensity}/10</span>
                      </div>
                    )}
                    {entry.sentiment && (
                      <div className="flex gap-1">
                        <div className={`w-3 h-3 rounded-full ${
                          entry.sentiment.polarity > 0.2 ? 'bg-green-400' :
                          entry.sentiment.polarity < -0.2 ? 'bg-blue-400' : 'bg-gray-400'
                        }`} title="Emotional tone"></div>
                        <div className={`w-3 h-3 rounded-full opacity-70 ${
                          entry.sentiment.growth > 0.4 ? 'bg-purple-400' : 'bg-gray-300'
                        }`} title="Growth indicator"></div>
                      </div>
                    )}
                    <ChevronDown 
                      size={16} 
                      className={`text-slate-400 transition-transform ${
                        selectedEntry?.id === entry.id ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>
                </div>
                
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(entry.tags || []).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="text-ink-800 leading-relaxed mb-4">
                  {selectedEntry?.id === entry.id 
                    ? entry.text 
                    : entry.text.length > 300 
                      ? `${entry.text.substring(0, 300)}...` 
                      : entry.text
                  }
                </p>
                
                {selectedEntry?.id === entry.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
                      <div>
                        <div className="font-semibold text-ink-700">Growth</div>
                        <div className="text-purple-600">{Math.round((entry.sentiment?.growth || 0) * 100)}%</div>
                      </div>
                      <div>
                        <div className="font-semibold text-ink-700">Self-Compassion</div>
                        <div className="text-pink-600">{Math.round((entry.sentiment?.selfCompassion || 0) * 100)}%</div>
                      </div>
                      <div>
                        <div className="font-semibold text-ink-700">Mindfulness</div>
                        <div className="text-green-600">{Math.round((entry.sentiment?.mindfulness || 0) * 100)}%</div>
                      </div>
                      <div>
                        <div className="font-semibold text-ink-700">Complexity</div>
                        <div className="text-indigo-600">{Math.round((entry.sentiment?.complexity || 0) * 100)}%</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {entry.prompt && selectedEntry?.id === entry.id && (
                  <p className="text-sm text-ink-700 italic bg-marigold-50 p-3 rounded-lg mt-4">
                    Prompt: "{entry.prompt}"
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-ink-700 mb-2">No entries found</h3>
              <p className="text-ink-700">
                {entries.length === 0 ? 'Start writing your first entry!' : 'Try adjusting your search or filters.'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAnalyticsTab = () => {
    const { currentSession, allTimeStats } = getWritingStats();
    
    return (
      <div className="space-y-6">
        {/* Current Session Stats */}
        <div className="paper-sheet p-6">
          <h3 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
            <Clock size={20} className="mr-2 text-blue-600" />
            Current Session
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentSession.wordCount}</div>
              <div className="text-sm text-ink-700">Words Written</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{currentSession.charCount}</div>
              <div className="text-sm text-ink-700">Characters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{currentSession.timeSpent}m</div>
              <div className="text-sm text-ink-700">Time Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currentSession.goalProgress}%</div>
              <div className="text-sm text-ink-700">Goal Progress</div>
            </div>
          </div>
        </div>

        {/* All-Time Stats */}
        <div className="paper-sheet p-6">
          <h3 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
            <BarChart3 size={20} className="mr-2 text-green-600" />
            All entries
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{allTimeStats.totalEntries}</div>
              <div className="text-sm text-ink-700">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{allTimeStats.totalWords.toLocaleString()}</div>
              <div className="text-sm text-ink-700">Total Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">{allTimeStats.averageLength}</div>
              <div className="text-sm text-ink-700">Avg Words/Entry</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-600">{Math.round(allTimeStats.totalTime)}m</div>
              <div className="text-sm text-ink-700">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(allTimeStats.averageGrowth * 100)}%</div>
              <div className="text-sm text-ink-700">Avg Growth</div>
            </div>
          </div>
        </div>

        {/* Streak & Achievements */}
        <div className="paper-sheet p-6">
          <h3 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
            <Star size={20} className="mr-2 text-yellow-600" />
            Streaks and milestones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{streakCount}</div>
              <div className="text-sm text-ink-700 mb-2">Day Streak</div>
              <div className="w-full bg-yellow-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (streakCount / 30) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-ink-700 mt-1">Goal: 30 days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{achievements.length}</div>
              <div className="text-sm text-ink-700 mb-2">Achievements</div>
              <div className="flex justify-center gap-1">
                {['first-week', 'week-streak', 'month-milestone'].map(achievement => (
                  <div key={achievement} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    achievements.includes(achievement) ? 'bg-orange-200 text-orange-700' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {achievement === 'first-week' && '🎯'}
                    {achievement === 'week-streak' && '🔥'}
                    {achievement === 'month-milestone' && '🏆'}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {Math.round(allTimeStats.averageMood * 100)}
              </div>
              <div className="text-sm text-ink-700 mb-2">Mood Trend</div>
              <div className={`text-xs px-2 py-1 rounded-full ${
                allTimeStats.averageMood > 0.2 ? 'bg-green-100 text-green-700' :
                allTimeStats.averageMood < -0.2 ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {allTimeStats.averageMood > 0.2 ? 'Improving' :
                 allTimeStats.averageMood < -0.2 ? 'Processing' : 'Stable'}
              </div>
            </div>
          </div>
        </div>

        {/* Intervention Effectiveness */}
        {interventions.length > 0 && (
          <div className="paper-sheet p-6">
            <h3 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
              <Brain size={20} className="mr-2 text-purple-600" />
              Suggestions while writing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{interventions.length}</div>
                <div className="text-sm text-ink-700">Total Suggestions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">
                  {interventions.filter(i => i.helpful).length}
                </div>
                <div className="text-sm text-ink-700">Helpful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-600">
                  {Math.round((interventions.filter(i => i.helpful).length / Math.max(interventions.length, 1)) * 100)}%
                </div>
                <div className="text-sm text-ink-700">Marked helpful (%)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-600">{insights.length}</div>
                <div className="text-sm text-ink-700">Notes made</div>
              </div>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="paper-sheet p-6">
          <h3 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
            <Download size={20} className="mr-2 text-ink-700" />
            Export your entries
          </h3>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => exportData('json')}
              className="px-4 py-2 rounded-lg border-2 border-ink-900 bg-sheet font-bold text-ink-900 hover:bg-marigold-100 transition-colors flex items-center gap-2"
            >
              <FileText size={16} />
              Export as JSON
            </button>
            <button
              onClick={() => exportData('txt')}
              className="px-4 py-2 rounded-lg border-2 border-ink-900 bg-sheet font-bold text-ink-900 hover:bg-marigold-100 transition-colors flex items-center gap-2"
            >
              <BookOpen size={16} />
              Export as Text
            </button>
            <button
              onClick={() => exportData('csv')}
              className="px-4 py-2 rounded-lg border-2 border-ink-900 bg-sheet font-bold text-ink-900 hover:bg-marigold-100 transition-colors flex items-center gap-2"
            >
              <BarChart3 size={16} />
              Export as CSV
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <div className="paper-sheet p-6">
        <h3 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
          <Shield size={20} className="mr-2 text-green-600" />
          Privacy & Security
        </h3>
        <p className="text-sm text-ink-700">
          Journal entries and drafts are saved automatically in this browser. They are not encrypted by Relevia and have no automatic expiry.
          Anyone using this browser profile may be able to read them. The chat's session-only and deletion controls do not clear journal data.
          Avoid saving sensitive information on a shared device. Voice playback depends on your browser and selected voice service.
        </p>
      </div>

      {/* Voice Settings */}
      {voices.length > 0 && (
        <div className="paper-sheet p-6">
          <h3 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
            <Volume2 size={20} className="mr-2 text-blue-600" />
            Voice Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-ink-700 mb-2">Preferred Voice</label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = voices.find(v => v.name === e.target.value);
                  setSelectedVoice(voice);
                }}
                className="w-full px-3 py-2 rounded-lg border-2 border-ink-900/20 bg-sheet"
              >
                {voices.map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
            {voiceError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {voiceError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Writing Preferences */}
      <div className="paper-sheet p-6">
        <h3 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
          <Edit3 size={20} className="mr-2 text-indigo-600" />
          Writing Preferences
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink-700 mb-2">Default Font Size</label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 border-ink-900/20 bg-sheet"
              >
                <option value="14px">Small</option>
                <option value="16px">Medium</option>
                <option value="18px">Large</option>
                <option value="20px">Extra Large</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-ink-700 mb-2">Writing style</label>
            <select
              value={pageFontKey}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-ink-900/20 bg-sheet"
            >
              {Object.entries(pageFonts).map(([value, f]) => <option key={value} value={value}>{f.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Prompt Management */}
      <div className="paper-sheet p-6">
        <h3 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
          <Sparkles size={20} className="mr-2 text-yellow-600" />
          Custom Prompts
        </h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              placeholder="Add your own writing prompt..."
              className="flex-1 px-4 py-2 rounded-lg border-2 border-ink-900/20 bg-sheet"
              onKeyPress={(e) => e.key === 'Enter' && addCustomPrompt()}
            />
            <button
              onClick={addCustomPrompt}
              className="px-4 py-2 rounded-lg border-2 border-ink-900 bg-sheet font-bold text-ink-900 hover:bg-marigold-100 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          {customPrompts.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {customPrompts.map((prompt, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm text-ink-800 italic">"{prompt}"</span>
                  <button
                    onClick={() => removeCustomPrompt(index)}
                    className="text-red-400 hover:text-red-600 transition-colors ml-3"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Goal Settings */}
      <div className="paper-sheet p-6">
        <h3 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
          <Target size={20} className="mr-2 text-green-600" />
          Default Goals
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ink-700 mb-2">Default Word Goal</label>
            <input
              type="number"
              value={wordGoal || ''}
              onChange={(e) => setWordGoal(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g., 200"
              className="w-full px-3 py-2 rounded-lg border-2 border-ink-900/20 bg-sheet"
            />
          </div>
          <div>
            <label className="block text-sm text-ink-700 mb-2">Default Time Goal (minutes)</label>
            <input
              type="number"
              value={timeGoal || ''}
              onChange={(e) => setTimeGoal(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g., 15"
              className="w-full px-3 py-2 rounded-lg border-2 border-ink-900/20 bg-sheet"
            />
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="paper-sheet p-6">
        <h3 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
          <Settings size={20} className="mr-2 text-ink-700" />
          Data Management
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={() => exportData('json')}
              className="flex-1 px-4 py-3 rounded-lg border-2 border-ink-900 bg-sheet font-bold text-ink-900 hover:bg-marigold-100 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Backup All Data
            </button>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      try {
                        const data = JSON.parse(e.target.result);
                        if (data.entries) setEntries(data.entries);
                        if (data.customPrompts) setCustomPrompts(data.customPrompts);
                        showNotification('Data restored successfully!', 'success');
                      } catch {
                        showNotification('Invalid backup file', 'error');
                      }
                    };
                    reader.readAsText(file);
                  }
                };
                input.click();
              }}
              className="flex-1 px-4 py-3 rounded-lg border-2 border-ink-900 bg-sheet font-bold text-ink-900 hover:bg-marigold-100 transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              Restore Backup
            </button>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all entries? This cannot be undone.')) {
                setEntries([]);
                setInterventions([]);
                setInsights([]);
                localStorage.removeItem('journalEntries');
                localStorage.removeItem('journalDraft');
                showNotification('All data cleared', 'success');
              }
            }}
            className="w-full px-4 py-3 rounded-lg border-2 border-red-700 bg-sheet font-bold text-red-800 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Clear All Data
          </button>
        </div>
      </div>

      {/* About */}
      <div className="paper-sheet p-6">
        <h3 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
          <HelpCircle size={20} className="mr-2 text-indigo-600" />
          About This Journal
        </h3>
        <div className="space-y-3 text-sm text-ink-700">
          <p>
            A private notebook in your browser. The optional counts look for certain words in what you write; they are rough and are not a measure of how you are.
          </p>
          <p>
            Writing and the counts happen on this device, and nothing is sent to Relevia. Reading aloud uses your browser&apos;s voices, and some browsers send that text to their own speech service.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <TechniqueShell icon="journaling" color="blue" note="Write it down" title="Journaling" wide backdrop={<InkDesk lamp={pageFocused || text.length > 0} />}
      intro="A private page to write on. Use a prompt if a blank page is hard, or ignore it. Entries stay in this browser unless you export them.">
      <div
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (activeTab === 'write' && text.trim()) saveEntry();
          }
          if (e.key === 'Escape' && focusMode) setFocusMode(false);
        }}
      >
        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 border-b-2 border-ink-900/10 pb-3" role="tablist" aria-label="Journal sections">
          {[
            { id: 'write', label: 'Write', icon: Edit3 },
            { id: 'entries', label: entries.length ? `My entries (${entries.length})` : 'My entries', icon: BookOpen },
            { id: 'analytics', label: 'Counts', icon: BarChart3 },
            { id: 'settings', label: 'Settings and data', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative inline-flex items-center gap-2 py-1 text-lg font-bold ${activeTab === tab.id ? 'text-ink-900' : 'text-ink-700/80 hover:text-ink-900'}`}
            >
              <tab.icon size={18} aria-hidden="true" />
              {tab.label}
              {activeTab === tab.id && (
                <Motion.span layoutId="journal-tab" aria-hidden="true" className="absolute inset-x-0 -bottom-[14px] h-1 rounded-full bg-[#3E6FD8]"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
              )}
            </button>
          ))}
        </div>

        <div role="tabpanel">
          {activeTab === 'write' && renderWriteTab()}
          {activeTab === 'entries' && renderEntriesTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </div>

        <p className="mt-10 text-sm leading-relaxed text-ink-700">
          Journal entries and drafts are saved in this browser. Anyone using this browser profile may be able to read them, so avoid writing anything you would not want kept on this device. Ctrl+S saves an entry.
        </p>
      </div>

      <style>{`
        .intervention-enter { animation: slideInRight 0.4s ease-out; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) { .intervention-enter { animation: none; } }
      `}</style>
    </TechniqueShell>
  );
}