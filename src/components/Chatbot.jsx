import React, { useState, useRef, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, Send, Minimize2, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { CrayonHeart } from './Crayon';

// Import optimized brain with streaming support
import { think, warmupEngine, rememberName, onEngineStatus, upgradeEngine } from '../services/releviaBrain';
import { PREFETCH_AFTER_MS } from '../services/modelConfig';
import { chatStore, newSessionId, deleteLegacyChat } from '../services/chatStorage.js';
import { recordChat } from '../services/activity.js';
import ChatPrivacy from './ChatPrivacy.jsx';
import { CrisisFilter, FIXED_SAFETY_REPLIES } from '../services/safetyS3.js';
import { speakSoftly } from '../services/softVoice.js';

// FIX: my emoji list had no /u flag, so it matched HALF of each emoji's surrogate
// pair and left broken characters for the speech engine. This catches every emoji.
const EMOJI_RE = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

// FIX: my old name detector matched "i'm|i am" + any word, so "I'm sad" set the
// user's name to "Sad" and "I am tired" made it "Tired". Only explicit intros now.
const NAME_RE = /\b(?:my name is|my name's|call me|i'm called)\s+([a-z][a-z'-]{1,20})\b/i;

// Paper theme: the chat is a page of a notebook. Relevia writes in pencil (Kalam, graphite),
// you write in your own looser hand (Caveat). Lines of text sit on the ruled lines.
// Safety and error messages are never handwritten: they use the plain reading font on a
// red-edged note so they cannot be mistaken for ordinary chat or be hard to read.
// "Plain text" switches all handwriting off for anyone who finds it hard to read.
const LINE = 30; // px, must match --line on the notebook page

const Message = ({ message, isBot, isTyping = false, isCrisis = false, hasError = false, timestamp, currentlySpeaking, plain }) => {
  const time = timestamp ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const who = isBot ? 'Relevia' : 'You';

  if (isTyping) {
    return (
      <div className={`pencil ${plain ? 'font-sans' : ''} flex items-center gap-1 text-[15px]`} style={{ lineHeight: `${LINE}px`, minHeight: LINE }}>
        <span>Relevia is writing</span>
        {[0, 1, 2].map((i) => (
          <Motion.span key={i} aria-hidden="true" animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}>.</Motion.span>
        ))}
      </div>
    );
  }

  if (isBot && (isCrisis || hasError)) {
    return (
      <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
        className="my-[15px] mr-2 rounded-r-md border-l-4 border-red-600 bg-red-50 px-3 py-2 font-sans text-[15px] leading-relaxed text-red-900"
        role={isCrisis ? 'alert' : undefined}>
        <span className="sr-only">{who}{time ? `, ${time}` : ''}: </span>
        <p className="whitespace-pre-wrap">{message}</p>
      </Motion.div>
    );
  }

  const hand = plain
    ? 'font-sans text-[15px] text-ink-900'
    : isBot ? 'pencil pencil-texture text-[16.5px]' : 'font-handwritten text-[22px] text-ink-700';

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className={`group relative ${isBot ? 'pr-6' : 'ml-auto max-w-[88%] pl-6 text-right'}`}
      style={{ marginBottom: LINE }}
      title={time}
    >
      <span className="sr-only">{who}{time ? `, ${time}` : ''}: </span>
      {currentlySpeaking && <Volume2 aria-label="Reading aloud" className="absolute -left-6 top-[7px] h-4 w-4 text-sage-600" />}
      <p className={`whitespace-pre-wrap ${hand}`} style={{ lineHeight: `${LINE}px` }}>{message}</p>
    </Motion.div>
  );
};

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null);
  // Handwriting can be hard to read; this switch is remembered on this device only.
  const [plainText, setPlainText] = useState(() => {
    try { return localStorage.getItem('relevia_chat_plain') === '1'; } catch { return false; }
  });
  const togglePlain = () => setPlainText((v) => {
    try { localStorage.setItem('relevia_chat_plain', v ? '0' : '1'); } catch { /* still works for this visit */ }
    return !v;
  });
  // Other parts of the page (the home page's "Start writing" button) open the notebook.
  useEffect(() => {
    const open = () => { setIsOpen(true); setIsMinimized(false); };
    window.addEventListener('relevia:open-chat', open);
    return () => window.removeEventListener('relevia:open-chat', open);
  }, []);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "I'm Relevia, an AI for general supportive conversation, not a therapist or emergency service. What would you like to talk about?",
      isBot: true,
      timestamp: new Date(),
      isCrisis: false
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [messageCount, setMessageCount] = useState(0);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(newSessionId);
  const generationEpoch = useRef(0);
  // Home letter: whether this chat has been counted ('skip' after crisis support).
  const chatCounted = useRef(false);
  const [legacyWarning, setLegacyWarning] = useState('');
  const resetChat = () => {
    generationEpoch.current++;
    chatStore.invalidateAll();
    chatCounted.current = false;
    setUserId(newSessionId()); setMessages([]); setUserName(''); setInputMessage('');
    setMessageCount(0); setStreamingId(null); setIsTyping(false);
    speechSynthRef.current?.cancel();
  };
  useEffect(() => {
    // Purge old shared data without importing it into a new session. Failure is visible.
    deleteLegacyChat().catch(err => setLegacyWarning(err.message));
    const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('relevia-chat-clear') : null;
    if (channel) channel.onmessage = () => resetChat();
    const endSession = () => resetChat();
    window.addEventListener('pagehide', endSession);
    return () => { channel?.close(); window.removeEventListener('pagehide', endSession); };
  }, []);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const toggleRef = useRef(null); // the dock button, which gets focus back on Escape

  const speechSynthRef = useRef(null);
  const utteranceRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [engineStatus, setEngineStatus] = useState({ state: 'idle', progress: 0 });
  const [streamingId, setStreamingId] = useState(null);   // id of the bot message being streamed
  const noticeShownRef = useRef(false);
  const [upgradeDismissed, setUpgradeDismissed] = useState(false);

  // the 1B starts fast; on devices that can handle it, I offer the 3B as an upgrade
  const showUpgrade = engineStatus.state === 'ready' && engineStatus.upgradeAvailable && !upgradeDismissed;
  const handleUpgrade = async () => {
    setUpgradeDismissed(true);
    const ok = await upgradeEngine();
    setMessages(prev => [...prev, {
      id: Date.now(), isBot: true, timestamp: new Date(), isCrisis: false,
      text: ok
        ? "All set ✨ I'm running my bigger AI now, so my replies should feel more thoughtful."
        : "That bigger AI was too heavy for this device, so I've gone back to my lighter one. I'm still right here.",
    }]);
  };

  // keep the header in sync with the model loading in releviaBrain
  useEffect(() => onEngineStatus(setEngineStatus), []);

  // Start loading the AI. Safe to call many times, it only ever starts once.
  // FIX: I used to do this on first render of Home, which started a multi-GB
  // download for every visitor, even people who never touched the chat.
  const startWarmup = (why) => {
    if (window.releviaWarmupStarted) return;
    window.releviaWarmupStarted = true;
    console.log(`[Chat] Starting warmup (${why})...`);
    warmupEngine().then((ok) =>
      console.log(ok ? '[Chat] Warmup complete - ready for first message' : '[Chat] No WebGPU - using offline replies'));
  };

  // opening the chat always starts it
  useEffect(() => {
    if (isOpen) startWarmup('chat opened');
  }, [isOpen]);

  // PERF: timed prefetch (see PREFETCH_AFTER_MS in modelConfig.js) - only on a fast,
  // unmetered connection on a laptop/desktop, because it's a big download for someone
  // who may never chat. Browsers without navigator.connection (Firefox, Safari) skip it.
  useEffect(() => {
    if (!PREFETCH_AFTER_MS) return;
    const c = navigator.connection;
    const phone = navigator.userAgentData?.mobile ?? /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (!c || c.saveData || c.effectiveType !== '4g' || c.type === 'cellular' || phone) return;
    const t = setTimeout(() => startWarmup('prefetch'), PREFETCH_AFTER_MS);
    return () => clearTimeout(t);
  }, []);

  // Tell people ONCE what's happening, so a slow first visit doesn't feel broken.
  // I'm honest about it: it's a one-time download and it stays on their device.
  useEffect(() => {
    if (noticeShownRef.current) return;
    let text = null;
    if (engineStatus.state === 'loading' && !engineStatus.cached) {
      text = `I'm setting up my private AI on your device (about ${engineStatus.sizeGB} GB, only the first time). Chat generation runs locally; model downloads and optional browser voice services have separate data flows. Until it's ready I'll still reply, just more simply 💜`;
    } else if (engineStatus.state === 'unavailable') {
      text = "Heads up: this browser can't run my AI (it needs WebGPU, e.g. a recent Chrome or Edge on a laptop). I'm still here to listen, with simpler replies.";
    }
    if (!text) return;
    noticeShownRef.current = true;
    setMessages(prev => [...prev, { id: Date.now(), text, isBot: true, timestamp: new Date(), isCrisis: false }]);
  }, [engineStatus.state, engineStatus.cached, engineStatus.sizeGB]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const voices = speechSynthRef.current.getVoices();
        console.log('Voice synthesis ready:', voices.length, 'voices available');
      };
      
      speechSynthRef.current.addEventListener('voiceschanged', loadVoices);
      loadVoices();
      
      return () => {
        if (speechSynthRef.current) {
          speechSynthRef.current.removeEventListener('voiceschanged', loadVoices);
        }
      };
    }
  }, []);

  useEffect(() => {
    return () => {
      if (speechSynthRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Escape closes the notebook from anywhere inside it and hands focus back to the button
  // that opened it. The panel is not modal: the page behind stays usable.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape' || !document.getElementById('relevia-chat-panel')?.contains(document.activeElement)) return;
      setIsOpen(false);
      toggleRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const speakMessage = (text, messageId) => {
    if (!voiceEnabled || !speechSynthRef.current || !text.trim()) {
      return;
    }

    speechSynthRef.current.cancel();

    const cleanText = text
      .replace(EMOJI_RE, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // Soft voice, on-device only: a reply can echo what the person wrote.
    utteranceRef.current = speakSoftly(cleanText, {
      allowOnline: false,
      onStart: () => setCurrentlySpeaking(messageId),
      onEnd: () => setCurrentlySpeaking(null),
      onError: (event) => { console.warn('Speech synthesis error:', event.error); setCurrentlySpeaking(null); },
    });
  };

  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setCurrentlySpeaking(null);
    }
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const userHistory = () => messages.filter(message => !message.isBot).map(message => ({ role: 'user', content: message.text }));

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const safetyReply = CrisisFilter(inputMessage.trim(), userHistory());
    // While a reply is being written, only a message that needs safety support can be sent.
    // It must not wait for a slow model: the half-written reply is dropped and the fixed
    // support text is shown at once (think() answers crisis messages without the model).
    if (isTyping && !safetyReply) return;
    if (isTyping) {
      generationEpoch.current++;
      stopSpeaking();
      const unfinished = streamingId;
      if (unfinished) setMessages(prev => prev.filter(m => m.id !== unfinished));
      setStreamingId(null);
    }
    // The conversation limit must not prevent deterministic safety support.
    if (messageCount >= 12 && !safetyReply) {
      const rateLimitMessage = {
        id: Date.now(),
        text: 'This session has reached its conversation limit. If you or someone else is in immediate danger, contact your local emergency service or someone nearby you trust. This chat cannot provide emergency care.',
        isBot: true,
        timestamp: new Date(),
        hasError: true,
        isCrisis: false
      };
      setMessages(prev => [...prev, rateLimitMessage]);
      return;
    }

    // Count that a chat happened, as a number only, once per chat. A chat where crisis
    // support was triggered is never counted, so the home letter cannot echo it.
    if (safetyReply) chatCounted.current = 'skip';
    else if (!chatCounted.current) { recordChat(); chatCounted.current = true; }

    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      isBot: false,
      timestamp: new Date(),
      isCrisis: false
    };

    const currentMessage = inputMessage.trim();
    const requestEpoch = generationEpoch.current;
    const nameMatch = currentMessage.match(NAME_RE);
    if (nameMatch && nameMatch[1]) {
      const detectedName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
      setUserName(detectedName);
      // FIX: the name only lived in React state, so the model never saw it
      // (db.getName() was always ''). Save it so releviaBrain can use it.
      await rememberName(detectedName, userId);
      if (requestEpoch !== generationEpoch.current) return;
    }

    setInputMessage('');
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setMessageCount(prev => prev + 1);

    try {
      setConnectionStatus('connecting');

      
      let partialMessage = '';
      const botMessageId = Date.now() + 1;

      // Stream tokens live to UI
      // FIX: the streamed text was being written into a bot message that didn't
      // exist yet (I only added it after think() finished), and I was mutating
      // state objects directly. Now I add the bubble on the first token and
      // update it immutably.
      const response = await think(currentMessage, userId, (token) => {
        if (requestEpoch !== generationEpoch.current) return;
        partialMessage += token;
        const text = partialMessage;
        setStreamingId(botMessageId);
        setMessages(prev => {
          if (!prev.some(m => m.id === botMessageId)) {
            return [...prev, { id: botMessageId, text, isBot: true, timestamp: new Date(), isCrisis: false }];
          }
          return prev.map(m => (m.id === botMessageId ? { ...m, text } : m));
        });
      });

      if (requestEpoch !== generationEpoch.current) return;
      setConnectionStatus('connected');

      const isCrisisResponse = FIXED_SAFETY_REPLIES.includes(response) || response === safetyReply;

      // Final message with complete response
      const botMessage = {
        id: botMessageId,
        text: response,
        isBot: true,
        timestamp: new Date(),
        isCrisis: isCrisisResponse
      };

      // replace the streamed bubble if there is one, otherwise add the reply
      // (crisis + fallback replies don't stream). Before, a streamed reply would
      // have shown up twice.
      setMessages(prev =>
        prev.some(m => m.id === botMessageId)
          ? prev.map(m => (m.id === botMessageId ? botMessage : m))
          : [...prev, botMessage]
      );

      if (voiceEnabled) {
        setTimeout(() => {
          if (requestEpoch === generationEpoch.current) speakMessage(botMessage.text, botMessage.id);
        }, 200);
      }

    } catch {
      if (requestEpoch !== generationEpoch.current) return;
      setConnectionStatus('error');
      
      const errorMessage = {
        id: Date.now() + 1,
        text: 'The chat encountered a technical problem. If you or someone else is in immediate danger, contact your local emergency service or someone nearby you trust now. Do not wait for this chat to recover.',
        isBot: true,
        timestamp: new Date(),
        hasError: true,
        isCrisis: true
      };

      setMessages(prev => [...prev, errorMessage]);
      
      if (voiceEnabled) {
        setTimeout(() => {
          if (requestEpoch === generationEpoch.current) speakMessage(errorMessage.text, errorMessage.id);
        }, 100);
      }
      
      setTimeout(() => setConnectionStatus('connected'), 5000);

    } finally {
      if (requestEpoch === generationEpoch.current) {
        setIsTyping(false);
        setStreamingId(null);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConnectionStatusColor = () => {
    if (engineStatus.state === 'loading') return 'bg-marigold-400';
    switch (connectionStatus) {
      case 'connected': return 'bg-sage-500';
      case 'connecting': return 'bg-marigold-400';
      case 'error': return 'bg-red-500';
      default: return 'bg-paper-400';
    }
  };

  const getConnectionStatusText = () => {
    // show model download progress so people know why replies are simpler for now
    if (engineStatus.state === 'loading') return `Getting the AI ready, ${engineStatus.progress}%`;
    if (engineStatus.state === 'unavailable' && connectionStatus === 'connected') return 'Simple replies (no WebGPU)';
    if (engineStatus.state === 'network' && connectionStatus === 'connected') return 'No connection, retrying';
    const mode = engineStatus.label && engineStatus.label !== 'Relevia' ? ` · ${engineStatus.label.replace('Relevia ', '')}` : '';
    switch (connectionStatus) {
      case 'connected': return `Ready on this device${mode}`;
      case 'connecting': return 'Writing back';
      case 'error': return 'Reconnecting';
      default: return 'Hello';
    }
  };

  // Quick calm sits bottom-right; on a phone the open panel covers that corner.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('relevia:chat-panel', { detail: { open: isOpen } }));
  }, [isOpen]);

  const getChatDimensions = () => {
    if (isMobile) {
      return {
        width: 'w-auto',
        height: isMinimized ? 'h-auto' : 'h-[min(560px,calc(100dvh-7rem))]',
        position: 'fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))]'
      };
    }
    return {
      width: 'w-[440px]',
      height: isMinimized ? 'h-auto' : 'h-[min(620px,calc(100vh-8rem))]',
      position: 'fixed left-6 bottom-24'
    };
  };

  const dimensions = getChatDimensions();
  const iconBtn = 'rounded-md p-1.5 text-ink-800 hover:bg-ink-900/5';

  return (
    <>
      {/* Bottom-left dock. It never takes more than half the width, so it cannot meet the
          "Quick calm" link on the right, and it sits above the phone's home indicator. */}
      <div className="float-dock float-dock-left z-50">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          // PERF: hovering/focusing the button means they're about to chat - start
          // loading now, it buys a second or two before they even click
          onMouseEnter={() => startWarmup('hover')}
          onFocus={() => startWarmup('focus')}
          onTouchStart={() => startWarmup('touch')}
          ref={toggleRef}
          aria-expanded={isOpen}
          aria-controls="relevia-chat-panel"
          className="paper-sheet flex min-h-11 max-w-full items-center gap-2 border-2 border-ink-900 px-3 py-2 text-left text-ink-900 transition-transform hover:-translate-y-0.5 sm:px-4 sm:py-2.5"
        >
          {isOpen ? <X className="h-5 w-5 shrink-0" aria-hidden="true" /> : <span className="shrink-0"><CrayonHeart size={26} /></span>}
          <span className="font-handwritten text-[1.35rem] font-bold leading-[1.05] sm:text-[1.45rem]">
            {isOpen ? 'Close the notebook' : 'Talk to Relevia'}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <Motion.section
            id="relevia-chat-panel"
            aria-label="Conversation with Relevia"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`${dimensions.position} ${dimensions.width} ${dimensions.height} paper-sheet z-50 flex flex-col overflow-hidden border border-paper-300`}
          >
            {/* spiral binding */}
            <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 flex w-6 flex-col justify-around py-4">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="mx-auto block h-3 w-3 rounded-full bg-paper-100 shadow-[inset_0_1px_2px_rgba(35,50,74,.35)]" />
              ))}
            </div>

            <header className="flex items-center justify-between gap-2 border-b-2 border-ink-900/80 bg-sheet py-2 pl-12 pr-3">
              <div className="min-w-0">
                <h2 className="font-handwritten text-[1.45rem] font-bold leading-none text-ink-900 sm:text-[1.75rem]">Talking with Relevia</h2>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-700" role="status">
                  <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${getConnectionStatusColor()}`} aria-hidden="true" />
                  {getConnectionStatusText()}
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <button type="button" onClick={togglePlain} aria-pressed={plainText} className={`${iconBtn} px-2 text-xs font-bold`}
                  title="Show the chat in plain print instead of handwriting">
                  {plainText ? 'Handwriting' : 'Plain text'}
                </button>
                <button type="button" onClick={toggleVoice} aria-pressed={voiceEnabled} className={iconBtn}
                  aria-label={voiceEnabled ? 'Stop reading replies aloud' : 'Read replies aloud'}>
                  {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => setIsMinimized(!isMinimized)} className={iconBtn}
                  aria-label={isMinimized ? 'Open the notebook' : 'Fold the notebook away'}>
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </button>
              </div>
            </header>

            {!isMinimized && (
              <>
                <div className="pl-6">
                  <ChatPrivacy sessionId={userId} busy={isTyping} legacyWarning={legacyWarning}
                    onReset={resetChat} onRestore={(id, rows) => {
                      generationEpoch.current++; setUserId(id); setUserName(''); setMessageCount(0);
                      speechSynthRef.current?.cancel();
                      setMessages(rows.map(r => ({ id: r.id, text: r.content, isBot: r.role === 'assistant', timestamp: new Date(r.ts) })));
                    }} />
                </div>

                <div className="notebook-lines custom-scrollbar flex-1 overflow-y-auto pb-[30px] pl-[60px] pr-4 pt-[30px]"
                  aria-live="polite" aria-relevant="additions">
                  {messages.map((message) => (
                    <Message
                      key={message.id}
                      message={message.text}
                      isBot={message.isBot}
                      hasError={message.hasError}
                      isCrisis={message.isCrisis}
                      timestamp={message.timestamp}
                      currentlySpeaking={currentlySpeaking === message.id}
                      plain={plainText}
                    />
                  ))}
                  {/* hide the dots once the streamed reply bubble is showing */}
                  {isTyping && !streamingId && <Message message="" isBot={true} isTyping={true} plain={plainText} />}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-dashed border-rule bg-sheet py-1.5 pl-12 pr-3 text-xs text-ink-700">
                  {showUpgrade ? (
                    // optional, never automatic: it's another big download
                    <div className="flex items-center justify-between gap-2">
                      <span>Fuller replies are available ({engineStatus.upgradeSizeGB} GB, one-time download)</span>
                      <span className="flex shrink-0 gap-3">
                        <button type="button" onClick={handleUpgrade} className="font-bold underline decoration-2 underline-offset-2">Download</button>
                        <button type="button" onClick={() => setUpgradeDismissed(true)} className="underline underline-offset-2">Not now</button>
                      </span>
                    </div>
                  ) : (
                    <p>An AI for everyday support, not therapy or emergency care.</p>
                  )}
                </div>

                <form className="flex items-end gap-2 border-t-2 border-ink-900/80 bg-sheet py-3 pl-12 pr-3"
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                  <label htmlFor="relevia-message" className="sr-only">Your message</label>
                  <input
                    id="relevia-message"
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={userName ? `What's on your mind, ${userName}?` : 'Write here…'}
                    className={`min-w-0 flex-1 border-0 border-b-2 border-ink-900/40 bg-transparent px-1 py-1 text-ink-800 placeholder:text-paper-500 focus:border-ink-900 focus:outline-none focus-visible:outline-none ${plainText ? 'text-[15px]' : 'font-handwritten text-[22px]'}`}
                    maxLength={500}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || (isTyping && !CrisisFilter(inputMessage.trim(), userHistory()))}
                    className="btn-ink !px-4 !py-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>Send</span>
                  </button>
                </form>

                {(voiceEnabled || messageCount >= 10) && (
                  <div className="flex items-center justify-between bg-sheet pb-2 pl-12 pr-3 text-xs text-ink-700">
                    <span>{voiceEnabled ? 'Replies are read aloud' : ''}</span>
                    {messageCount >= 10 && <span className="font-bold">{Math.max(0, 12 - messageCount)} ordinary messages left</span>}
                  </div>
                )}
              </>
            )}
          </Motion.section>
        )}
      </AnimatePresence>

      {/* FIX: `jsx` is a Next.js styled-jsx thing, in Vite it just threw a React warning */}
      <style>{`
        .notebook-lines {
          --line: ${LINE}px;
          background:
            linear-gradient(var(--margin), var(--margin)) 46px 0 / 2px 100% no-repeat,
            repeating-linear-gradient(transparent 0 calc(var(--line) - 1px), var(--rule) calc(var(--line) - 1px) var(--line)) 0 0 / 100% var(--line) local,
            var(--sheet);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #C9CFC6; border-radius: 3px; }
      `}</style>
    </>
  );
};

export default ChatbotWidget;
