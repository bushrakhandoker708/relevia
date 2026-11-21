import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  ExclamationTriangleIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';
import TechniqueShell from './TechniqueShell';
import useTechniqueEvents from './useTechniqueEvents';
import { speakSoftly } from '../../services/softVoice';
import BodyGlow from './BodyGlow';

const relaxationTechniques = {
  progressive: {
    name: "Progressive Muscle Relaxation",
    description: "Systematically tense and release muscle groups to release physical stress and anxiety",
    duration: "10-15 minutes",
    icon: "💪",
    color: "from-blue-500 to-purple-500",
    steps: [
      { 
        instruction: "Find a comfortable position, either sitting or lying down. Close your eyes and take three slow, deep breaths.",
        duration: 20,
        bodyPart: "preparation",
        guidance: "Allow your body to settle into this moment. Check that your surroundings are suitable before continuing. You can pause or stop."
      },
      { 
        instruction: "Curl your toes tightly, creating tension in your feet. Hold this tension for 5 seconds... now release and let your feet go completely limp.",
        duration: 25,
        bodyPart: "feet",
        guidance: "Notice the contrast between tension and relaxation. Feel the relief washing through your feet."
      },
      { 
        instruction: "Tighten your calf muscles by flexing your feet upward. Hold the tension... now release and feel your calves become heavy and relaxed.",
        duration: 25,
        bodyPart: "calves",
        guidance: "Your lower legs are sinking deeper into relaxation with each breath you take."
      },
      { 
        instruction: "Tense your thigh muscles by pressing your knees together. Hold firmly... now let go and feel your thighs melt into softness.",
        duration: 25,
        bodyPart: "thighs",
        guidance: "All tension is flowing out of your legs, leaving them heavy and peaceful."
      },
      { 
        instruction: "Squeeze your buttocks muscles tightly. Hold this tension... now release completely and let your hips sink down.",
        duration: 25,
        bodyPart: "glutes",
        guidance: "Your entire lower body is now deeply relaxed and supported."
      },
      { 
        instruction: "Tense your stomach muscles by drawing your belly button toward your spine. Hold... now release and let your abdomen soften.",
        duration: 25,
        bodyPart: "abdomen",
        guidance: "Feel your breathing naturally deepen as your core muscles release and relax."
      },
      { 
        instruction: "Make tight fists and tense your entire arms, pulling them close to your body. Hold... now let your arms drop and go completely limp.",
        duration: 30,
        bodyPart: "arms",
        guidance: "Your arms feel heavy and warm, like they're floating in warm water."
      },
      { 
        instruction: "Raise your shoulders up to your ears and tense your neck. Hold this tension... now let your shoulders drop and your neck lengthen.",
        duration: 30,
        bodyPart: "shoulders & neck",
        guidance: "All the weight you've been carrying is melting away from your shoulders."
      },
      { 
        instruction: "Scrunch up your entire face - close your eyes tightly, furrow your brow, clench your jaw. Hold... now relax everything.",
        duration: 30,
        bodyPart: "face",
        guidance: "Your face is now soft and peaceful, like the surface of a calm lake."
      },
      { 
        instruction: "Take a moment to scan your entire body from head to toe. Notice the deep relaxation flowing through every muscle.",
        duration: 45,
        bodyPart: "full body scan",
        guidance: "You may notice comfort, discomfort or no change. Notice how you feel without expecting a particular outcome."
      }
    ]
  },
  grounding: {
    name: "5-4-3-2-1 Sensory Grounding",
    description: "Anchor yourself in the present moment using your five senses to calm anxiety",
    duration: "5-8 minutes",
    icon: "🌍",
    color: "from-green-500 to-teal-500",
    steps: [
      { 
        instruction: "Take three slow, calming breaths. You're going to ground yourself using your senses to return to the present moment.",
        duration: 20,
        bodyPart: "preparation",
        guidance: "This technique will help pull you out of anxious thoughts and into the safety of now."
      },
      { 
        instruction: "Look around you slowly and mindfully identify 5 things you can SEE. Name them silently or out loud, really observing each one.",
        duration: 60,
        bodyPart: "sight",
        guidance: "Take your time with each object. Notice colors, shapes, textures, and details. You are present and aware."
      },
      { 
        instruction: "Now focus on 4 things you can physically TOUCH or FEEL. Your clothes, the chair, the temperature, a texture nearby...",
        duration: 50,
        bodyPart: "touch",
        guidance: "Feel the physical world supporting and surrounding you. You are grounded and connected to reality."
      },
      { 
        instruction: "Listen carefully and identify 3 different things you can HEAR right now. Perhaps sounds from outside, inside, near or far.",
        duration: 45,
        bodyPart: "hearing",
        guidance: "These sounds connect you to the world around you. Check that your surroundings are suitable before continuing. You can pause or stop."
      },
      { 
        instruction: "Gently notice 2 things you can SMELL. Take slow breaths to identify scents in your environment.",
        duration: 40,
        bodyPart: "smell",
        guidance: "Each breath brings you deeper into the present, away from worry and into awareness."
      },
      { 
        instruction: "Finally, identify 1 thing you can TASTE. It might be lingering from something you drank or ate, or just your mouth right now.",
        duration: 35,
        bodyPart: "taste",
        guidance: "You have successfully anchored yourself in this moment. You are here, you are safe, you are present."
      },
      { 
        instruction: "Take three final deep breaths and appreciate how grounded and present you feel in this moment.",
        duration: 30,
        bodyPart: "integration",
        guidance: "Remember: you can use this technique anytime you feel overwhelmed. Your senses will always bring you home to the present."
      }
    ]
  },
  visualization: {
    name: "Guided Safe Space Visualization",
    description: "Create and visit a mental sanctuary where you feel completely secure and peaceful",
    duration: "12-18 minutes",
    icon: "🏞️",
    color: "from-purple-500 to-pink-500",
    steps: [
      { 
        instruction: "Close your eyes gently and take five slow, deep breaths. Let your body sink into comfort and safety.",
        duration: 30,
        bodyPart: "preparation",
        guidance: "You are about to create a special place in your mind where you feel completely safe and peaceful."
      },
      { 
        instruction: "Imagine a place where you feel absolutely safe and calm. This could be real or completely from your imagination - a beach, forest, cozy room, or magical realm.",
        duration: 60,
        bodyPart: "creating your space",
        guidance: "This is your sanctuary. No one can disturb you here. Take time to see this place clearly in your mind."
      },
      { 
        instruction: "Look around your safe space. What do you see? Notice the colors, the lighting, the atmosphere. Make it exactly how you want it to be.",
        duration: 55,
        bodyPart: "visual details",
        guidance: "Add any details that make you feel more comfortable and secure. This place exists just for you."
      },
      { 
        instruction: "What sounds exist in your safe place? Perhaps gentle waves, birds singing, a crackling fire, or peaceful silence. Let yourself hear these calming sounds.",
        duration: 50,
        bodyPart: "sounds of safety",
        guidance: "These sounds remind you that you belong here, that this place welcomes and protects you."
      },
      { 
        instruction: "Feel the temperature and textures in your space. Is it warmly sunny or coolly comfortable? What can you touch - soft grass, warm sand, a cozy blanket?",
        duration: 55,
        bodyPart: "physical sensations",
        guidance: "An imagined setting cannot establish your physical safety. Your body relaxes deeper into this peaceful environment."
      },
      { 
        instruction: "Notice any pleasant scents in your safe place - ocean air, flowers, fresh rain, or something that brings you comfort.",
        duration: 45,
        bodyPart: "comforting scents",
        guidance: "These scents anchor the memory of this place, making it easier to return whenever you need peace."
      },
      { 
        instruction: "Find the most comfortable spot in your safe place and settle in. Feel how protected and loved you are here.",
        duration: 80,
        bodyPart: "settling in",
        guidance: "Check that your surroundings are suitable before continuing. You can pause or stop. You can stop this exercise at any time. You deserve this peace and tranquility."
      },
      { 
        instruction: "Know that this safe place lives within you and you can return here anytime. Take three deep breaths and slowly prepare to return, carrying this peace with you.",
        duration: 40,
        bodyPart: "integration & return",
        guidance: "This sanctuary is always accessible to you. The calm and safety you feel here can travel with you into your daily life."
      }
    ]
  },
  bodyScan: {
    name: "Mindful Body Scan",
    description: "Systematically relax your entire body through mindful awareness and gentle attention",
    duration: "8-12 minutes",
    icon: "🧘",
    color: "from-teal-500 to-blue-500",
    steps: [
      { 
        instruction: "Lie down or sit comfortably with your spine straight. Close your eyes and take several deep, cleansing breaths.",
        duration: 25,
        bodyPart: "centering",
        guidance: "Allow your body to be heavy and supported. You don't need to do anything except be present with yourself."
      },
      { 
        instruction: "Bring your attention to the top of your head. Simply notice any sensations - warmth, tingling, or just awareness itself.",
        duration: 30,
        bodyPart: "head & scalp",
        guidance: "There's no right or wrong way to feel. Simply observe with gentle, non-judgmental awareness."
      },
      { 
        instruction: "Move your attention down to your face. Notice your forehead, eyes, cheeks, jaw. If you notice tension, simply breathe into those areas.",
        duration: 35,
        bodyPart: "face",
        guidance: "Let your facial muscles soften with each exhale. Your face holds so much - allow it to rest now."
      },
      { 
        instruction: "Focus on your neck and throat. These areas often hold stress and emotion. Breathe gently into any tightness you find.",
        duration: 30,
        bodyPart: "neck & throat",
        guidance: "Your throat is the bridge between your heart and mind. Let it be open and relaxed."
      },
      { 
        instruction: "Bring awareness to your shoulders and arms. Notice if they're carrying tension from the day. Let them become heavy and relaxed.",
        duration: 40,
        bodyPart: "shoulders & arms",
        guidance: "You can put down whatever burden you've been carrying. Your shoulders don't need to hold it all."
      },
      { 
        instruction: "Focus on your chest and heart area. Notice your natural breath rhythm. Feel your heart beating steadily, keeping you alive.",
        duration: 45,
        bodyPart: "chest & heart",
        guidance: "Your heart has been beating for you your entire life. Send it gratitude and love."
      },
      { 
        instruction: "Move your attention to your abdomen and lower torso. This is often where we hold emotional tension. Breathe softly here.",
        duration: 35,
        bodyPart: "abdomen",
        guidance: "Your core is your center of power and intuition. Let it be soft and spacious."
      },
      { 
        instruction: "Focus on your hips, pelvis, and lower back. These areas support your entire upper body. Send them appreciation.",
        duration: 35,
        bodyPart: "hips & pelvis",
        guidance: "Thank these strong areas for supporting you. Let them release and soften."
      },
      { 
        instruction: "Bring attention to your legs - thighs, knees, calves. Feel them heavy and supported, carrying you through life.",
        duration: 40,
        bodyPart: "legs",
        guidance: "Your legs have taken you on your life's journey. Honor them with relaxation and gratitude."
      },
      { 
        instruction: "Finally, focus on your feet. They connect you to the earth and ground you in reality. Feel them completely relaxed.",
        duration: 30,
        bodyPart: "feet",
        guidance: "Your feet keep you connected to the earth. Feel rooted, stable, and peacefully grounded."
      },
      { 
        instruction: "Now feel your entire body as one unified, relaxed whole. You are complete, peaceful, and deeply relaxed.",
        duration: 35,
        bodyPart: "integration",
        guidance: "Carry this sense of wholeness and peace with you. Your body is your home, and it is a good home."
      }
    ]
  }
};

const AdvancedRelaxation = () => {
  const [selectedTechnique, setSelectedTechnique] = useState('grounding');
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [, setTotalTime] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  useTechniqueEvents('relaxation', isActive || isCompleted, isCompleted);
  const [initialAnxiety, setInitialAnxiety] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [showEmergencyHelp, setShowEmergencyHelp] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(0.8);

  const timerRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const utteranceRef = useRef(null);
  const startTimeRef = useRef(null);

  const currentTechnique = relaxationTechniques[selectedTechnique];
  const currentStepData = currentTechnique.steps[currentStep];

  // Session timing
  useEffect(() => {
    if (isActive && !isPaused) {
      startTimeRef.current = startTimeRef.current || Date.now();
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
    
    utteranceRef.current = speakSoftly(text, { allowOnline: true, rate: voiceSpeed * 0.95 });
  }, [voiceEnabled, isPaused, voiceSpeed]);

  const completeSession = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    setCompletedSessions(prev => prev + 1);

  }, []);

  const handleNextStep = useCallback(() => {
    if (currentStep < currentTechnique.steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setTimeRemaining(currentTechnique.steps[nextStep].duration);
    } else {
      completeSession();
    }
  }, [currentStep, currentTechnique, completeSession]);

  // Step timer
  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive && !isPaused) {
      if (autoAdvance) {
        handleNextStep();
      }
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

  const startTechnique = () => {
    setIsActive(true);
    setIsPaused(false);
    setCurrentStep(0);
    setIsCompleted(false);
    setTimeRemaining(currentTechnique.steps[0].duration);
    setTotalTime(currentTechnique.steps.reduce((acc, step) => acc + step.duration, 0));
    startTimeRef.current = Date.now();
  };



  const handlePrevStep = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setTimeRemaining(currentTechnique.steps[prevStep].duration);
      window.speechSynthesis.cancel();
    }
  };



  const pauseResume = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
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
    window.speechSynthesis.cancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepProgress = () => {
    return ((currentStep + 1) / currentTechnique.steps.length) * 100;
  };


  const round = 'flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink-900/30 bg-white/60 text-ink-900 hover:border-ink-900 disabled:cursor-not-allowed disabled:opacity-30';
  const uk = (s) => s.replace('Visualization', 'Visualisation');

  // Relaxation's own look: warm amber light that slowly breathes behind the page.
  const warmth = (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFF6E3 0%, #FDEBD2 45%, #F9DCC4 100%)' }}>
      <div className="relax-glow absolute left-1/2 top-[30%] h-[70vmin] w-[70vmin] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,214,120,0.75), rgba(255,214,120,0) 70%)' }} />
      <style>{`
        .relax-glow { animation: relaxGlow 9s ease-in-out infinite; }
        @keyframes relaxGlow { 0%, 100% { transform: translate(-50%, 0) scale(0.92); opacity: 0.7; } 50% { transform: translate(-50%, 0) scale(1.08); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .relax-glow { animation: none; } }
      `}</style>
    </div>
  );

  return (
    <TechniqueShell icon="relaxation" color="sun" note="Let the tension go" title="Relaxation" backdrop={warmth}
      intro="Guided exercises that take you through your body or a calm place, one step at a time. Each step has a timer, and you can pause whenever you like.">

      {!isActive && !isCompleted && (
        <>
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">Choose an exercise</h2>
          {/* A list, not a grid of cards: the chosen one gets a warm bar on the left. */}
          <div className="mt-4 border-t border-ink-900/10" role="radiogroup" aria-label="Relaxation exercises">
            {Object.entries(relaxationTechniques).map(([key, technique]) => {
              const on = selectedTechnique === key;
              return (
                <button key={key} type="button" role="radio" aria-checked={on} onClick={() => setSelectedTechnique(key)}
                  className={`relative block w-full border-b border-ink-900/10 py-5 pl-6 pr-2 text-left transition-colors ${on ? 'bg-white/45' : 'hover:bg-white/25'}`}>
                  <span aria-hidden="true" className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-full transition-all ${on ? 'bg-marigold-500' : 'bg-transparent'}`} />
                  <span className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <span className="text-xl font-bold text-ink-900">{uk(technique.name)}</span>
                    <span className="text-sm text-ink-700">{technique.duration}, {technique.steps.length} steps</span>
                  </span>
                  <span className="mt-1 block max-w-2xl leading-relaxed text-ink-700">{technique.description}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-10 max-w-xl">
            <label htmlFor="start-rating" className="block font-bold text-ink-900">
              How tense do you feel right now? <span className="font-normal text-ink-700">(optional)</span>
            </label>
            <input id="start-rating" type="range" min="1" max="10" value={initialAnxiety}
              onChange={(e) => setInitialAnxiety(parseInt(e.target.value))}
              className="relax-range mt-4 w-full" />
            <div className="mt-1 flex justify-between text-sm text-ink-700">
              <span>Very calm</span><span className="text-lg font-bold text-ink-900">{initialAnxiety}/10</span><span>Very tense</span>
            </div>
            <p className="mt-1 text-sm text-ink-700">Only shown back to you during the session. Not saved.</p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <button type="button" onClick={startTechnique} className="btn-ink">
              <PlayIcon className="h-5 w-5" aria-hidden="true" /> Start {uk(currentTechnique.name).toLowerCase()}
            </button>
            <button type="button" onClick={() => setShowEmergencyHelp(!showEmergencyHelp)} aria-expanded={showEmergencyHelp}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-red-800 underline underline-offset-4">
              <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" /> Crisis support
            </button>
          </div>
        </>
      )}

      {showEmergencyHelp && (
        <section className="mt-6 border-l-4 border-red-700 bg-white/60 p-5" aria-labelledby="crisis-support">
          <h2 id="crisis-support" className="mb-2 text-xl font-bold text-ink-900">Crisis support</h2>
          <p className="text-ink-800">If you&apos;re in immediate danger or having thoughts of self-harm:</p>
          <ul className="mt-2 space-y-1 text-ink-800">
            <li>If there is immediate danger, contact your local emergency service now.</li>
            <li>Crisis Text Line: Text HOME to <strong>741741</strong></li>
            <li>International: <strong>iasp.info/resources</strong></li>
          </ul>
          <p className="mt-3 text-sm text-ink-700">These relaxation techniques can help, but they are not a substitute for professional mental health care.</p>
        </section>
      )}

      {isActive && (
        <section className="grid items-center gap-8 md:grid-cols-[220px_1fr]" aria-live="polite">
          <BodyGlow part={currentStepData.bodyPart || ''} className="mx-auto h-56 w-auto md:h-[360px]" />
          <div className="glass p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="margin-note text-[1.5rem]">
                Step {currentStep + 1} of {currentTechnique.steps.length}{currentStepData.bodyPart ? `: ${currentStepData.bodyPart}` : ''}
              </p>
              <p className="text-sm font-bold text-ink-800">{isPaused ? 'Paused' : `${formatTime(timeRemaining)} left`}</p>
            </div>
            <div className="mb-6 mt-2 h-1.5 overflow-hidden rounded bg-white/70" aria-hidden="true">
              <div className="h-1.5 bg-marigold-500 transition-all duration-500" style={{ width: `${getStepProgress()}%` }} />
            </div>
            <p className="text-2xl font-bold leading-snug text-ink-900">{currentStepData.instruction}</p>
            <p className="my-6 font-handwritten text-[1.7rem] leading-snug text-ink-800">{currentStepData.guidance}</p>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={handlePrevStep} disabled={currentStep === 0} className={round} aria-label="Previous step">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button type="button" onClick={pauseResume} className="btn-ink !px-5 !py-2">
                {isPaused ? <PlayIcon className="h-5 w-5" aria-hidden="true" /> : <PauseIcon className="h-5 w-5" aria-hidden="true" />}
                {isPaused ? 'Carry on' : 'Pause'}
              </button>
              <button type="button" onClick={handleNextStep} className={round} aria-label="Next step">
                <ChevronRightIcon className="h-5 w-5" />
              </button>
              <button type="button" onClick={resetSession} className="text-sm font-bold text-ink-700 underline underline-offset-4">Stop</button>
            </div>
            <p className="mt-6 text-sm text-ink-700">
              Session time {formatTime(sessionTime)}. Starting rating {initialAnxiety}/10. If you miss an instruction, pause and step back.
            </p>
          </div>
        </section>
      )}

      {isCompleted && (
        <section className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900">That&apos;s the end of the session</h2>
          <p className="mt-3 text-lg leading-relaxed text-ink-800">
            You&apos;ve completed {uk(currentTechnique.name).toLowerCase()} ({formatTime(sessionTime)}). You may feel different, unchanged or uncomfortable; there is no required outcome.
          </p>
          <dl className="mt-6 grid max-w-md grid-cols-2 gap-y-2 border-y border-ink-900/10 py-4 text-ink-800">
            <dt className="text-ink-700">Selected starting rating</dt><dd className="font-bold text-ink-900">{initialAnxiety}/10</dd>
            <dt className="text-ink-700">Change in stress</dt><dd className="font-bold text-ink-900">Not measured</dd>
          </dl>
          <ul className="mt-6 space-y-1 text-ink-800">
            <li>Notice any areas of your body that feel more relaxed now.</li>
            <li>Take note of any changes in your breathing or heart rate.</li>
            <li>Consider how you might carry this into the rest of your day.</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={startTechnique} className="btn-ink">Do it again</button>
            <button type="button" onClick={resetSession} className="btn-outline">Choose another exercise</button>
          </div>
          <p className="mt-6 text-sm text-ink-700">Sessions completed on this visit: {completedSessions}</p>
        </section>
      )}

      <div className="mt-10">
        <button type="button" onClick={() => setShowSettings(!showSettings)} aria-expanded={showSettings}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink-800 underline underline-offset-4">
          <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" /> Voice and timing
        </button>
      </div>

      {showSettings && (
        <section className="mt-4 grid max-w-3xl gap-6 border-t border-ink-900/10 pt-5 sm:grid-cols-2">
          <div>
            <label className="flex items-center gap-3 font-bold text-ink-900">
              <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} className="h-4 w-4 accent-ink-900" />
              {voiceEnabled ? <SpeakerWaveIcon className="h-4 w-4" aria-hidden="true" /> : <SpeakerXMarkIcon className="h-4 w-4" aria-hidden="true" />}
              Read the steps aloud
            </label>
            {voiceEnabled && (
              <label className="mt-3 block text-sm text-ink-800">
                Voice speed: {voiceSpeed}×
                <input type="range" min="0.6" max="1.2" step="0.1" value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))} className="mt-1 w-full accent-ink-900" />
              </label>
            )}
          </div>
          <div>
            <label className="flex items-center gap-3 font-bold text-ink-900">
              <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} className="h-4 w-4 accent-ink-900" />
              Move on when the timer ends
            </label>
            <p className="mt-1 text-sm text-ink-700">Switch this off to move between steps yourself.</p>
          </div>
        </section>
      )}

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight text-ink-900">Where these come from</h2>
        <dl className="mt-4 grid gap-x-10 gap-y-6 border-t border-ink-900/10 pt-6 sm:grid-cols-2">
          {[
            ['Progressive relaxation', 'Developed by Edmund Jacobson in the 1920s, this technique helps distinguish between muscle tension and relaxation, reducing physical anxiety symptoms.'],
            ['Grounding', 'Based on mindfulness principles, grounding helps interrupt anxiety spirals by anchoring attention in the present moment through sensory awareness.'],
            ['Visualisation', 'Uses guided imagery to activate the parasympathetic nervous system, creating real physiological changes that promote relaxation and healing.'],
            ['Body scanning', 'Rooted in mindfulness meditation, body scanning increases body awareness and helps release unconsciously held tension and stress.'],
          ].map(([t, d]) => (
            <div key={t}>
              <dt className="font-bold text-ink-900">{t}</dt>
              <dd className="mt-1 leading-relaxed text-ink-700">{d}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm leading-relaxed text-ink-700">
          These are wellness practices, not a substitute for professional treatment. If you&apos;re experiencing persistent anxiety, depression or other mental health concerns, please consider talking to a qualified healthcare provider.
        </p>
      </section>

      <style>{`
        .relax-range { -webkit-appearance: none; appearance: none; height: 10px; border-radius: 999px;
          background: linear-gradient(90deg, #8FCB9B, #F4D06F 55%, #EE9A6B); }
        .relax-range::-webkit-slider-thumb { -webkit-appearance: none; width: 28px; height: 28px; border-radius: 999px;
          background: #fff; border: 3px solid #2B2D42; box-shadow: 0 4px 10px rgba(0,0,0,0.2); cursor: pointer; }
        .relax-range::-moz-range-thumb { width: 24px; height: 24px; border-radius: 999px; background: #fff; border: 3px solid #2B2D42; cursor: pointer; }
        .relax-range:focus-visible { outline: 2px dashed #2B2D42; outline-offset: 6px; }
      `}</style>
    </TechniqueShell>
  );
};

export default AdvancedRelaxation;
