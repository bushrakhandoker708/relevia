import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Settings, ChevronLeft, ChevronRight, Heart, User, Plus, X } from 'lucide-react';
import TechniqueShell from './TechniqueShell';
import useTechniqueEvents from './useTechniqueEvents';
import PlaceScene from './PlaceScene';
import { speakSoftly, softVoices } from '../../services/softVoice';

// Browser storage can be blocked (private windows, strict settings); the page must still work.
const readStore = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const writeStore = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* settings last for this visit only */ }
};

const visualizationScenarios = {
  peacefulBeach: {
    name: "Peaceful Ocean Beach",
    description: "Escape to a serene coastline where gentle waves wash away your worries",
    duration: "12-15 minutes",
    icon: "🏖️",
    color: "from-blue-400 to-cyan-500",
    backgroundGradient: "from-sky-200 via-blue-100 to-cyan-50",
    darkBackground: "from-blue-900 via-slate-800 to-cyan-900",
    ambientSound: "ocean waves",
    triggers: ['water', 'drowning', 'ocean'],
    steps: [
      {
        instruction: "Close your eyes gently and take three deep, cleansing breaths. Let your body settle into complete comfort.",
        duration: 25,
        scene: "preparation",
        guidance: "Check that your surroundings are suitable before continuing. You can pause or stop. This is your time to find peace and restoration.",
        visualCue: "🌊"
      },
      {
        instruction: "Imagine yourself standing at the edge of a beautiful, pristine beach. The sand is soft and warm beneath your bare feet.",
        duration: 40,
        scene: "arrival",
        guidance: "Feel the gentle warmth of the sand supporting you. This beach exists just for you - your personal sanctuary.",
        visualCue: "🏖️"
      },
      {
        instruction: "Look out at the endless ocean before you. The water is a brilliant blue-green, sparkling in the golden sunlight.",
        duration: 35,
        scene: "ocean view",
        guidance: "The vastness of the ocean reminds you that your worries are small in comparison to this infinite peace.",
        visualCue: "🌊"
      },
      {
        instruction: "Listen to the rhythmic sound of gentle waves rolling onto the shore. Each wave brings calm and takes away tension.",
        duration: 40,
        scene: "wave sounds",
        guidance: "Let the rhythm of the waves synchronize with your breathing. In with peace, out with stress.",
        visualCue: "〰️"
      },
      {
        instruction: "Feel the warm, gentle breeze caressing your skin. It carries the fresh, clean scent of salt air and ocean spray.",
        duration: 35,
        scene: "ocean breeze",
        guidance: "This breeze is washing away all your worries, leaving you refreshed and renewed.",
        visualCue: "💨"
      },
      {
        instruction: "Walk slowly along the water's edge. Feel the cool water gently touching your feet as waves roll in and out.",
        duration: 45,
        scene: "walking shoreline",
        guidance: "With each step, you feel lighter, more peaceful, more connected to the natural world.",
        visualCue: "👣"
      },
      {
        instruction: "Find a comfortable spot on the warm sand and sit or lie down. Feel completely supported by the earth beneath you.",
        duration: 50,
        scene: "settling on sand",
        guidance: "You are held safely by the earth. Let your entire body sink into deep relaxation.",
        visualCue: "🏝️"
      },
      {
        instruction: "Look up at the vast, clear blue sky. Watch as a few fluffy white clouds drift peacefully overhead.",
        duration: 40,
        scene: "sky gazing",
        guidance: "Like these clouds, your thoughts can drift by gently without disturbing your inner peace.",
        visualCue: "☁️"
      },
      {
        instruction: "Feel the warm sun on your face and body, filling you with golden light and healing energy.",
        duration: 45,
        scene: "sun bathing",
        guidance: "This golden light is healing every cell in your body, restoring your energy and vitality.",
        visualCue: "☀️"
      },
      {
        instruction: "Take a few more moments to simply be present in this peaceful place. You can return here anytime you need tranquility.",
        duration: 50,
        scene: "integration",
        guidance: "This peace lives within you always. Carry this serenity with you as you slowly prepare to return.",
        visualCue: "🧘"
      }
    ]
  },
  enchantedForest: {
    name: "Enchanted Forest Sanctuary",
    description: "Journey through a magical woodland where ancient trees offer wisdom and healing",
    duration: "14-18 minutes", 
    icon: "🌲",
    color: "from-green-500 to-emerald-600",
    backgroundGradient: "from-green-100 via-emerald-50 to-green-200",
    darkBackground: "from-green-900 via-emerald-800 to-green-900",
    ambientSound: "forest sounds",
    triggers: ['claustrophobia', 'darkness', 'isolation'],
    steps: [
      {
        instruction: "Close your eyes and breathe deeply. With each breath, feel yourself becoming more relaxed and open to healing.",
        duration: 25,
        scene: "centering",
        guidance: "You are about to enter a sacred forest where healing and wisdom await you.",
        visualCue: "🌿"
      },
      {
        instruction: "Find yourself standing at the entrance to an ancient, enchanted forest. Tall, majestic trees welcome you with their gentle presence.",
        duration: 40,
        scene: "forest entrance",
        guidance: "These ancient guardians have watched over this sacred space for centuries. They welcome you with love.",
        visualCue: "🌲"
      },
      {
        instruction: "Step onto a soft pathway covered with moss and fallen leaves. Feel the springy earth beneath your feet.",
        duration: 35,
        scene: "forest path",
        guidance: "Each step connects you deeper to the earth's healing energy. You are supported and guided.",
        visualCue: "🍃"
      },
      {
        instruction: "Listen to the gentle symphony of the forest - birds singing, leaves rustling, a distant stream bubbling peacefully.",
        duration: 40,
        scene: "forest sounds",
        guidance: "These natural sounds are medicine for your soul, washing away stress and bringing deep peace.",
        visualCue: "🐦"
      },
      {
        instruction: "Breathe in the fresh, clean forest air filled with the scent of pine, earth, and growing things.",
        duration: 35,
        scene: "forest scents",
        guidance: "Each breath fills your lungs with pure, healing energy that flows throughout your entire being.",
        visualCue: "🌲"
      },
      {
        instruction: "Discover a beautiful clearing where golden sunlight filters through the canopy, creating dancing patterns of light.",
        duration: 45,
        scene: "sunlit clearing",
        guidance: "This golden light represents healing energy flowing into every part of your body and mind.",
        visualCue: "✨"
      },
      {
        instruction: "In the center of the clearing, find a perfect place to rest - perhaps by a gentle stream or beneath a wise old tree.",
        duration: 50,
        scene: "resting place",
        guidance: "This is your sacred healing space. Feel completely safe, loved, and supported here.",
        visualCue: "🏞️"
      },
      {
        instruction: "As you rest, imagine roots growing from your body into the earth, connecting you to the forest's ancient wisdom.",
        duration: 45,
        scene: "grounding",
        guidance: "Feel the deep wisdom of the earth flowing up through these roots, bringing you strength and clarity.",
        visualCue: "🌳"
      },
      {
        instruction: "Notice woodland creatures - deer, rabbits, butterflies - approaching without fear, drawn to your peaceful energy.",
        duration: 40,
        scene: "forest friends",
        guidance: "These gentle beings recognize the peace within you. You are one with all of nature.",
        visualCue: "🦋"
      },
      {
        instruction: "Feel a profound sense of belonging and connection to all life. You are part of something magnificent and eternal.",
        duration: 45,
        scene: "unity",
        guidance: "This connection to nature and all life is always within you. You carry this wisdom wherever you go.",
        visualCue: "💚"
      },
      {
        instruction: "Slowly and gently, begin to return from this sacred place, carrying its peace and wisdom with you always.",
        duration: 35,
        scene: "return",
        guidance: "This enchanted forest lives within your heart. You can return here anytime you need healing and peace.",
        visualCue: "🌟"
      }
    ]
  },
  mountainRetreat: {
    name: "Mountain Peak Serenity",
    description: "Ascend to a peaceful mountain summit where clarity and strength await you",
    duration: "10-14 minutes",
    icon: "⛰️",
    color: "from-purple-500 to-indigo-600",
    backgroundGradient: "from-purple-100 via-indigo-50 to-blue-100",
    darkBackground: "from-purple-900 via-indigo-800 to-blue-900",
    ambientSound: "mountain wind",
    triggers: ['heights', 'vertigo', 'falling'],
    steps: [
      {
        instruction: "Take several deep breaths and allow your body to become heavy and relaxed in your seat.",
        duration: 25,
        scene: "preparation",
        guidance: "You are about to journey to a place of great strength and clarity high above the world.",
        visualCue: "🧘"
      },
      {
        instruction: "Imagine yourself standing on a peaceful mountain peak, high above the clouds and concerns of daily life.",
        duration: 40,
        scene: "mountain peak",
        guidance: "From this elevated perspective, you can see that you are stronger and more capable than you realize.",
        visualCue: "⛰️"
      },
      {
        instruction: "Look out at the vast landscape stretching endlessly in all directions. Mountains, valleys, and distant horizons unfold before you.",
        duration: 40,
        scene: "panoramic view",
        guidance: "This expansive view reminds you of the infinite possibilities in your life.",
        visualCue: "🌄"
      },
      {
        instruction: "Feel the cool, crisp mountain air filling your lungs with each breath. The air here is pure and energizing.",
        duration: 35,
        scene: "mountain air",
        guidance: "This pure air is cleansing your mind of doubt and filling you with confidence and clarity.",
        visualCue: "💨"
      },
      {
        instruction: "Notice how stable and grounded you feel on this solid rock foundation beneath your feet.",
        duration: 30,
        scene: "solid ground",
        guidance: "Like this mountain, you have an unshakeable foundation of inner strength and resilience.",
        visualCue: "🪨"
      },
      {
        instruction: "Feel the gentle warmth of sunlight on your face, while a cool breeze keeps you perfectly comfortable.",
        duration: 35,
        scene: "perfect weather",
        guidance: "You are in perfect balance - strong yet gentle, grounded yet elevated, calm yet energized.",
        visualCue: "☀️"
      },
      {
        instruction: "From this high vantage point, look down at any problems or worries. See how small they appear from here.",
        duration: 45,
        scene: "perspective shift",
        guidance: "Your challenges are manageable. You have the wisdom and strength to overcome anything.",
        visualCue: "👁️"
      },
      {
        instruction: "Feel a profound sense of your own inner strength and capability flowing through you like mountain streams.",
        duration: 40,
        scene: "inner strength",
        guidance: "This strength has always been within you. You are more resilient and capable than you know.",
        visualCue: "💪"
      },
      {
        instruction: "Take a moment to set an intention or make a commitment to yourself from this place of clarity and strength.",
        duration: 45,
        scene: "intention setting",
        guidance: "From this elevated state of consciousness, your intentions are powerful and achievable.",
        visualCue: "🎯"
      },
      {
        instruction: "Slowly prepare to return, knowing you can access this mountain strength and clarity whenever you need it.",
        duration: 30,
        scene: "integration",
        guidance: "Carry this mountain strength with you. You are unshakeable, clear-minded, and powerful.",
        visualCue: "🌟"
      }
    ]
  },
  healingGarden: {
    name: "Healing Garden of Renewal",
    description: "Enter a magical garden where every flower, tree, and stream offers healing energy",
    duration: "15-20 minutes",
    icon: "🌺",
    color: "from-pink-500 to-rose-600",
    backgroundGradient: "from-pink-100 via-rose-50 to-purple-100",
    darkBackground: "from-pink-900 via-rose-800 to-purple-900",
    ambientSound: "garden birds",
    triggers: ['allergies', 'insects', 'pollen'],
    steps: [
      {
        instruction: "Relax completely and breathe naturally. Allow healing energy to begin flowing through your entire being.",
        duration: 25,
        scene: "preparation",
        guidance: "You are about to enter a sacred healing garden where miraculous restoration awaits you.",
        visualCue: "🌿"
      },
      {
        instruction: "Find yourself walking through an ornate gate into the most beautiful garden you've ever seen.",
        duration: 40,
        scene: "garden entrance",
        guidance: "This garden exists specifically for your healing. Every element here serves your highest good.",
        visualCue: "🌸"
      },
      {
        instruction: "Walk along a winding path surrounded by vibrant flowers in every color imaginable - roses, lilies, jasmine, and more.",
        duration: 45,
        scene: "flower path",
        guidance: "Each flower radiates healing energy. Feel their colors washing over you like gentle waves of restoration.",
        visualCue: "🌺"
      },
      {
        instruction: "Breathe in the heavenly fragrance of all these healing flowers. Let their essence fill your entire being.",
        duration: 35,
        scene: "healing scents",
        guidance: "These natural aromatherapy scents are healing your mind, body, and spirit on the deepest levels.",
        visualCue: "🌹"
      },
      {
        instruction: "Discover a crystal-clear stream flowing gently through the garden, its water sparkling in the golden light.",
        duration: 40,
        scene: "healing stream",
        guidance: "This is the stream of pure healing energy. Its gentle flow represents life force flowing through you.",
        visualCue: "💧"
      },
      {
        instruction: "Kneel by the stream and cup the pure water in your hands. Drink deeply of this healing elixir.",
        duration: 45,
        scene: "drinking healing water",
        guidance: "This sacred water is healing every cell, organ, and system in your body. Feel it restoring you completely.",
        visualCue: "🥤"
      },
      {
        instruction: "Find a comfortable spot beneath a magnificent healing tree whose branches offer perfect shade and protection.",
        duration: 50,
        scene: "healing tree",
        guidance: "This ancient tree has witnessed countless healings. Feel its wisdom and loving energy surrounding you.",
        visualCue: "🌳"
      },
      {
        instruction: "Place your hands on your heart and feel healing light flowing from the garden into every part of your body.",
        duration: 55,
        scene: "heart healing",
        guidance: "Golden healing light is flowing through your heart to every cell. You are being restored to perfect wholeness.",
        visualCue: "💖"
      },
      {
        instruction: "Visualize any areas of your body or mind that need healing being bathed in this magical garden light.",
        duration: 60,
        scene: "targeted healing",
        guidance: "The garden's healing energy knows exactly where to go. Trust in this perfect, loving restoration.",
        visualCue: "✨"
      },
      {
        instruction: "Feel butterflies landing gently on your hands and shoulders, each one bringing a message of hope and renewal.",
        duration: 40,
        scene: "butterfly messengers",
        guidance: "These butterflies represent transformation. Like them, you are emerging renewed and beautiful.",
        visualCue: "🦋"
      },
      {
        instruction: "Know that this healing garden exists within your heart. You can return here anytime for restoration and peace.",
        duration: 35,
        scene: "integration",
        guidance: "Carry this healing energy with you always. You are whole, healthy, and surrounded by love.",
        visualCue: "💚"
      }
    ]
  }
};

const defaultPersonalSettings = {
  favoriteScenarios: [],
  customDurations: {},
  personalTriggers: [],
  voicePreferences: {
    gender: 'any',
    accent: 'neutral',
    speed: 0.7
  },
  reminderSchedule: {
    frequency: 'none',
    times: []
  },
  ambientVolume: 0.3,
  voiceVolume: 0.8
};

const AdvancedVisualization = () => {
  const [selectedScenario, setSelectedScenario] = useState('peacefulBeach');
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [, setTotalTime] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(() => readStore('visualization-completed-sessions', 0));
  const [isCompleted, setIsCompleted] = useState(false);
  useTechniqueEvents('visualization', isActive || isCompleted, isCompleted);
  const [showSettings, setShowSettings] = useState(false);
  const [showPersonalSettings, setShowPersonalSettings] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [newTrigger, setNewTrigger] = useState('');
  
  // Personal Settings State
  const [personalSettings, setPersonalSettings] = useState(() => ({ ...defaultPersonalSettings, ...readStore('visualization-personal-settings', {}) }));

  const timerRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const utteranceRef = useRef(null);
  const startTimeRef = useRef(null);

  const currentScenario = visualizationScenarios[selectedScenario];
  const currentStepData = currentScenario?.steps[currentStep] || currentScenario?.steps[0];

  // Save states to localStorage
  useEffect(() => {
    writeStore('visualization-personal-settings', personalSettings);
  }, [personalSettings]);

  useEffect(() => {
    writeStore('visualization-completed-sessions', completedSessions);
  }, [completedSessions]);

  // Check for triggers before starting
  const hasTriggersForScenario = useCallback((scenarioKey) => {
    const scenario = visualizationScenarios[scenarioKey];
    if (!scenario || !personalSettings.personalTriggers) return false;
    return personalSettings.personalTriggers.some(trigger => 
      scenario.triggers.includes(trigger.toLowerCase())
    );
  }, [personalSettings.personalTriggers]);

  // Get available scenarios (excluding those with triggers)
  const getAvailableScenarios = useCallback(() => {
    return Object.entries(visualizationScenarios).filter(([key]) => 
      !hasTriggersForScenario(key)
    );
  }, [hasTriggersForScenario]);

  // Session timing
  useEffect(() => {
    if (isActive && !isPaused) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(sessionTimerRef.current);
    }

    return () => clearInterval(sessionTimerRef.current);
  }, [isActive, isPaused]);

  const speakInstruction = useCallback((text) => {
    if (!voiceEnabled || isPaused) return;
    
    if (window.speechSynthesis) {
      const male = personalSettings.voicePreferences.gender === 'male'
        ? softVoices(window.speechSynthesis.getVoices(), { allowOnline: true })
          .find((v) => /\b(male|daniel|alex|david|guy|ryan|george|arthur|thomas|oliver)\b/i.test(v.name) && !/female/i.test(v.name))
        : null;
      utteranceRef.current = speakSoftly(text, {
        allowOnline: true,
        voice: male || null,
        rate: personalSettings.voicePreferences.speed * 0.95,
        volume: personalSettings.voiceVolume,
      });
    }
  }, [voiceEnabled, personalSettings.voicePreferences, personalSettings.voiceVolume, isPaused]);

  const getAdjustedSteps = useCallback(() => {
    const customDuration = personalSettings.customDurations[selectedScenario];
    if (!customDuration || customDuration === 1) return currentScenario.steps;
    
    return currentScenario.steps.map(step => ({ 
      ...step, 
      duration: Math.floor(step.duration * customDuration) 
    }));
  }, [selectedScenario, personalSettings.customDurations, currentScenario]);

  const completeSession = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    setCompletedSessions(prev => prev + 1);

    // Add to favorites if not already there
    if (!personalSettings.favoriteScenarios.includes(selectedScenario)) {
      setPersonalSettings(prev => ({
        ...prev,
        favoriteScenarios: [...prev.favoriteScenarios, selectedScenario]
      }));
    }

  }, [personalSettings.favoriteScenarios, selectedScenario]);

  const handleNextStep = useCallback(() => {
    const steps = getAdjustedSteps();

    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setTimeRemaining(steps[nextStep].duration);
    } else {
      completeSession();
    }
  }, [currentStep, getAdjustedSteps, completeSession]);

  // Step timer
  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive && !isPaused && autoAdvance) {
      handleNextStep();
    }

    return () => clearTimeout(timerRef.current);
  }, [isActive, isPaused, timeRemaining, autoAdvance, handleNextStep]);

  // Cancel both delayed utterances when the step or playback state changes.
  useEffect(() => {
    if (!voiceEnabled || !isActive || isPaused || !currentStepData || !('speechSynthesis' in window)) return;
    let guidanceTimer;
    const instructionTimer = setTimeout(() => {
      speakInstruction(currentStepData.instruction);
      guidanceTimer = setTimeout(() => speakInstruction(currentStepData.guidance), currentStepData.instruction.length * 50 + 2000);
    }, 2000);
    return () => {
      clearTimeout(instructionTimer);
      clearTimeout(guidanceTimer);
      window.speechSynthesis.cancel();
    };
  }, [voiceEnabled, isActive, isPaused, currentStepData, speakInstruction]);

  useEffect(() => {
    if (!isCompleted || !voiceEnabled || isPaused || !('speechSynthesis' in window)) return;
    const timer = setTimeout(() => speakInstruction('You have completed the session. Notice how you feel without expecting a particular change.'), 1000);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
  }, [isCompleted, voiceEnabled, isPaused, speakInstruction]);

  const startVisualization = () => {
    const steps = getAdjustedSteps();
    setIsActive(true);
    setIsPaused(false);
    setCurrentStep(0);
    setIsCompleted(false);
    setTimeRemaining(steps[0].duration);
    setTotalTime(steps.reduce((acc, step) => acc + step.duration, 0));
    setSessionTime(0);
    startTimeRef.current = Date.now();
  };



  const handlePrevStep = useCallback(() => {
    const steps = getAdjustedSteps();
    
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setTimeRemaining(steps[prevStep].duration);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [currentStep, getAdjustedSteps]);



  const pauseResume = () => {
    setIsPaused(!isPaused);
    if (!isPaused && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const resetSession = () => {
    setIsActive(false);
    setIsPaused(false);
    setCurrentStep(0);
    setIsCompleted(false);
    setTimeRemaining(0);
    setSessionTime(0);
    startTimeRef.current = null;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const updatePersonalSettings = (updates) => {
    setPersonalSettings(prev => ({ ...prev, ...updates }));
  };

  const addPersonalTrigger = () => {
    const trigger = newTrigger.trim().toLowerCase();
    if (trigger && !personalSettings.personalTriggers.includes(trigger)) {
      updatePersonalSettings({
        personalTriggers: [...personalSettings.personalTriggers, trigger]
      });
      setNewTrigger('');
    }
  };

  const removePersonalTrigger = (trigger) => {
    updatePersonalSettings({
      personalTriggers: personalSettings.personalTriggers.filter(t => t !== trigger)
    });
  };

  const removeFavoriteScenario = (scenario) => {
    updatePersonalSettings({
      favoriteScenarios: personalSettings.favoriteScenarios.filter(s => s !== scenario)
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepProgress = () => {
    return ((currentStep + 1) / currentScenario.steps.length) * 100;
  };

  const lengthLabel = (key) => {
    const k = personalSettings.customDurations[key];
    const sc = visualizationScenarios[key];
    if (!k || k === 1) return sc.duration;
    const words = { 0.5: 'half the usual length', 0.75: 'a quarter shorter', 1.25: 'a quarter longer', 1.5: 'half as long again' };
    return `${sc.duration}, ${words[k] || 'custom length'}`;
  };
  const uk = (s) => s.replace(/Visualization/g, 'Visualisation').replace(/visualization/g, 'visualisation');
  const round = 'flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink-900/30 bg-sheet text-ink-900 hover:border-ink-900 disabled:cursor-not-allowed disabled:opacity-30';
  const blocked = hasTriggersForScenario(selectedScenario);
  const steps = getAdjustedSteps();
  // The sun moves across the painted sky as the steps go by.
  const journey = isCompleted ? 1 : isActive ? Math.min(1, (currentStep + getStepProgress() / 100) / steps.length) : 0.12;

  return (
    <TechniqueShell icon="visualization" color="lilac" note="Go somewhere calm" title="Visualisation"
      backdrop={<PlaceScene place={selectedScenario} progress={journey} className="h-full w-full" />}
      intro="A guided walk through a calm place in your imagination. Each step has a timer and can be read aloud. You can pause or stop whenever you like.">

      {!isActive && !isCompleted && (
        <>
          <h2 className="mb-4 text-2xl font-bold text-ink-900">Choose a place</h2>
          <p className="-mt-2 mb-4 text-ink-800">The picture behind the page changes to match.</p>
          <div className="grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Places">
            {getAvailableScenarios().map(([key, scenario]) => (
              <button key={key} type="button" role="radio" aria-checked={selectedScenario === key}
                onClick={() => setSelectedScenario(key)}
                className={`glass overflow-hidden !border-2 p-0 text-left transition-all ${selectedScenario === key ? '!border-ink-900 shadow-xl' : 'hover:-translate-y-0.5'}`}>
                <PlaceScene place={key} progress={0.35} still className="block h-28 w-full" />
                <span className="block p-5 pt-4">
                <span className="flex items-center gap-2 text-lg font-bold text-ink-900">
                  <span className={selectedScenario === key ? 'highlight' : ''}>{uk(scenario.name)}</span>
                  {personalSettings.favoriteScenarios.includes(key) && <Heart className="h-4 w-4 fill-rose-500 text-rose-500" aria-label="Favourite" />}
                </span>
                <span className="mt-1 block leading-relaxed text-ink-700">{scenario.description}</span>
                <span className="mt-2 block text-sm text-ink-700">{lengthLabel(key)}, {scenario.steps.length} steps</span>
                </span>
              </button>
            ))}
          </div>

          {personalSettings.personalTriggers.length > 0 && (
            <p className="mt-4 text-sm text-ink-700">
              {Object.keys(visualizationScenarios).length - getAvailableScenarios().length} place(s) hidden because they mention: {personalSettings.personalTriggers.join(', ')}.
            </p>
          )}

          {blocked && (
            <p className="glass mt-4 border-l-4 !border-l-marigold-500 p-4 text-ink-800">
              This place mentions something on your list ({currentScenario.triggers.filter(t => personalSettings.personalTriggers.includes(t)).join(', ')}). Please choose another one.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="button" onClick={startVisualization} disabled={blocked} className="btn-ink disabled:cursor-not-allowed disabled:opacity-40">
              <Play className="h-5 w-5" aria-hidden="true" /> Start: {uk(currentScenario.name).toLowerCase()}
            </button>
            <span className="text-sm text-ink-700">{lengthLabel(selectedScenario)}</span>
          </div>
        </>
      )}

      {isActive && (
        <section className="glass p-6 sm:p-8" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="margin-note text-[1.5rem] leading-[32px]">
              {uk(currentScenario.name)}: step {currentStep + 1} of {steps.length}, {currentStepData.scene}
            </p>
            <p className="text-sm font-bold leading-[32px] text-ink-800">{isPaused ? 'Paused' : `${formatTime(timeRemaining)} left in this step`}</p>
          </div>
          <div className="mb-6 mt-2 h-1.5 overflow-hidden rounded bg-white/60" aria-hidden="true">
            <div className="h-1 bg-lilac-500 transition-all duration-500" style={{ width: `${getStepProgress()}%` }} />
          </div>
          <p className="text-2xl font-bold leading-snug text-ink-900">{currentStepData.instruction}</p>
          <p className="my-6 font-handwritten text-[1.7rem] leading-snug text-ink-800">{currentStepData.guidance}</p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={handlePrevStep} disabled={currentStep === 0} className={round} aria-label="Previous step">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={pauseResume} className="btn-ink !px-5 !py-2">
              {isPaused ? <Play className="h-5 w-5" aria-hidden="true" /> : <Pause className="h-5 w-5" aria-hidden="true" />}
              {isPaused ? 'Carry on' : 'Pause'}
            </button>
            <button type="button" onClick={handleNextStep} className={round} aria-label="Next step">
              <ChevronRight className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setVoiceEnabled(!voiceEnabled)} className={round} aria-pressed={voiceEnabled}
              aria-label={voiceEnabled ? 'Stop reading aloud' : 'Read the steps aloud'}>
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <button type="button" onClick={resetSession} className="text-sm font-bold text-ink-700 underline underline-offset-4">Stop</button>
          </div>
          <p className="mt-[32px] text-sm leading-[32px] text-ink-700">Time so far: {formatTime(sessionTime)}</p>
        </section>
      )}

      {isCompleted && (
        <section className="glass p-6 sm:p-8">
          <h2 className="text-2xl font-bold leading-[64px] text-ink-900">Back from {uk(currentScenario.name).toLowerCase()}</h2>
          <p className="mb-[32px] leading-[32px] text-ink-800">
            That was {steps.length} steps in {formatTime(sessionTime)}. Take a moment before you get up. However you feel now is fine.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={startVisualization} className="btn-ink">Go again</button>
            <button type="button" onClick={resetSession} className="btn-outline">Choose another place</button>
          </div>
          <p className="mt-[32px] text-sm leading-[32px] text-ink-700">Visits finished on this device: {completedSessions}</p>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-5">
        <button type="button" onClick={() => { setShowSettings(!showSettings); setShowPersonalSettings(false); }} aria-expanded={showSettings}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink-800 underline underline-offset-4">
          <Settings className="h-4 w-4" aria-hidden="true" /> Voice and timing
        </button>
        <button type="button" onClick={() => { setShowPersonalSettings(!showPersonalSettings); setShowSettings(false); }} aria-expanded={showPersonalSettings}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink-800 underline underline-offset-4">
          <User className="h-4 w-4" aria-hidden="true" /> Things to avoid and favourites
        </button>
      </div>

      {showSettings && (
        <section className="glass mt-3 grid gap-6 p-6 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="flex items-center gap-3 font-bold text-ink-900">
              <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} className="h-4 w-4 accent-ink-900" />
              Read the steps aloud
            </label>
            <label className="block text-sm text-ink-800">Voice
              <select value={personalSettings.voicePreferences.gender}
                onChange={(e) => updatePersonalSettings({ voicePreferences: { ...personalSettings.voicePreferences, gender: e.target.value } })}
                className="mt-1 w-full rounded-lg border-2 border-ink-900/30 bg-sheet p-2">
                <option value="any">Any</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </label>
            <label className="block text-sm text-ink-800">Speed: {personalSettings.voicePreferences.speed}×
              <input type="range" min="0.5" max="1.2" step="0.1" value={personalSettings.voicePreferences.speed}
                onChange={(e) => updatePersonalSettings({ voicePreferences: { ...personalSettings.voicePreferences, speed: parseFloat(e.target.value) } })}
                className="mt-1 w-full accent-ink-900" />
            </label>
            <label className="block text-sm text-ink-800">Volume: {Math.round(personalSettings.voiceVolume * 100)}%
              <input type="range" min="0.1" max="1" step="0.1" value={personalSettings.voiceVolume}
                onChange={(e) => updatePersonalSettings({ voiceVolume: parseFloat(e.target.value) })}
                className="mt-1 w-full accent-ink-900" />
            </label>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 font-bold text-ink-900">
              <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} className="h-4 w-4 accent-ink-900" />
              Move on when the timer ends
            </label>
            <p className="text-sm font-bold text-ink-900">Length of each place</p>
            {Object.entries(visualizationScenarios).map(([key, sc]) => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm text-ink-800">
                {uk(sc.name)}
                <select value={personalSettings.customDurations[key] || 1}
                  onChange={(e) => updatePersonalSettings({ customDurations: { ...personalSettings.customDurations, [key]: parseFloat(e.target.value) } })}
                  className="rounded-lg border-2 border-ink-900/30 bg-sheet p-1">
                  <option value={0.5}>Half</option>
                  <option value={0.75}>Shorter</option>
                  <option value={1}>Usual</option>
                  <option value={1.25}>Longer</option>
                  <option value={1.5}>Much longer</option>
                </select>
              </label>
            ))}
          </div>
        </section>
      )}

      {showPersonalSettings && (
        <section className="glass mt-3 grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <h3 className="font-bold text-ink-900">Things to avoid</h3>
            <p className="mt-1 text-sm text-ink-700">Places that mention these words are hidden. Saved in this browser only.</p>
            <div className="mt-3 flex gap-2">
              <label htmlFor="new-trigger" className="sr-only">Word to avoid</label>
              <input id="new-trigger" type="text" value={newTrigger} onChange={(e) => setNewTrigger(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addPersonalTrigger(); }}
                placeholder="for example, water" className="min-w-0 flex-1 rounded-lg border-2 border-ink-900/30 bg-sheet p-2" />
              <button type="button" onClick={addPersonalTrigger} className="btn-outline !px-3 !py-2" aria-label="Add word to avoid">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {personalSettings.personalTriggers.map((t) => (
                <li key={t} className="flex items-center gap-1 rounded-full border-2 border-ink-900/20 px-3 py-1 text-sm text-ink-800">
                  {t}
                  <button type="button" onClick={() => removePersonalTrigger(t)} aria-label={`Stop avoiding ${t}`}><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-ink-900">Favourites</h3>
            <p className="mt-1 text-sm text-ink-700">A place becomes a favourite when you finish it.</p>
            {personalSettings.favoriteScenarios.length === 0 ? (
              <p className="mt-3 text-sm text-ink-700">None yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {personalSettings.favoriteScenarios.map((key) => (
                  <li key={key} className="flex items-center justify-between gap-2 text-ink-800">
                    <button type="button" className="text-left underline underline-offset-4" onClick={() => setSelectedScenario(key)}>
                      {uk(visualizationScenarios[key]?.name || key)}
                    </button>
                    <button type="button" onClick={() => removeFavoriteScenario(key)} aria-label="Remove from favourites"><X className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </TechniqueShell>
  );
};

export default AdvancedVisualization;
