import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Download, Edit3, FolderLock, Plus, RotateCcw, Upload, Volume2, VolumeX, X } from 'lucide-react';
import TechniqueShell from './TechniqueShell';
import useTechniqueEvents from './useTechniqueEvents';
import { promptLibrary, moodCategories } from './journalData';
import { speakSoftly, softVoices } from '../../services/softVoice';
import {
  addEntry, backup, clearDraft, deleteAll, deleteEntry, plainText, readDraft, readEntries,
  readPrompts, readSettings, restore, writeDraft, writePrompts, writeSettings, KEYS,
  getMode, setMode, modeWasInferred,
} from '../../services/journalStore';

/**
 * Journaling. The page is built around one task: writing. The writing area comes first;
 * a title, tags and a feeling are optional and folded away, as are page settings.
 *
 * REDESIGN (21 November 2026): the previous version scored entries for "tone", "growth"
 * and "self-compassion" from the words used, showed "notes from your writing", popped up
 * suggestions based on that scoring, and counted streaks. Relevia does not infer how
 * someone feels from what they write, so all of that is gone. Older entries keep any
 * stored scores (nothing is deleted) but they are not shown. Storage: journalStore.js.
 */

// Journaling's own look: blue ink washed across the top of the desk, and a warm lamp that
// glows brighter while the page is being written on.
const InkDesk = ({ lamp }) => (
  <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg, #DDE5F6 0%, #ECEFF6 38%, #F4F1EA 100%)' }}>
    <div className="absolute -top-[20vh] right-[-10vw] h-[80vh] w-[80vh] rounded-full transition-opacity duration-1000"
      style={{ background: 'radial-gradient(circle, rgba(255,214,150,0.75), rgba(255,214,150,0) 65%)', opacity: lamp ? 1 : 0.45 }} />
  </div>
);

const STYLES = {
  plain: { label: 'Plain', className: 'font-body' },
  pencil: { label: 'Pencil (handwritten)', className: 'font-pencil' },
  marker: { label: 'Marker (handwritten)', className: 'font-handwritten', scale: 1.25 },
};
const SIZES = { '16px': 'Medium', '18px': 'Large', '20px': 'Extra large', '24px': 'Largest' };
const KINDS = { empathic: 'Kind', cbt: 'Thoughts', creative: 'Creative', mindfulness: 'Present moment' };
const lineFor = (size) => `${Math.round(parseInt(size, 10) * 1.9)}px`;
const words = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Date unknown');
const field = 'min-w-0 max-w-full rounded-lg border-2 border-ink-900/25 bg-white/70 px-3 py-2 text-ink-900 focus:border-ink-900';
const PROBLEM = { full: "This browser's storage is full, so it couldn't be saved. Export your entries, then delete some.", blocked: "This browser is blocking storage (for example in a private window), so it couldn't be saved.", unavailable: "This browser is blocking storage (for example in a private window), so it couldn't be saved." };

function promptFor(kind, custom, seed = Math.random()) {
  const pool = [...(promptLibrary.beginner[kind] || promptLibrary.beginner.empathic), ...custom];
  return pool[Math.floor(seed * pool.length)] || "What's on your mind today?";
}

export default function Journaling() {
  const reduce = useReducedMotion();
  const initialSettings = useRef(readSettings()).current;
  const initialDraft = useRef(readDraft()).current;

  const [tab, setTab] = useState('write');
  const [text, setText] = useState(initialDraft?.text || '');
  const [title, setTitle] = useState(initialDraft?.title || '');
  const [tags, setTags] = useState(initialDraft?.tags || []);
  const [tagDraft, setTagDraft] = useState('');
  const [mood, setMood] = useState(initialDraft?.mood || null);
  const [moodKind, setMoodKind] = useState('emotional');
  const [entries, setEntries] = useState(readEntries);
  // 'session': nothing written to the browser; 'device': kept in localStorage (opt-in).
  const [mode, setModeState] = useState(getMode);
  const [inferred, setInferred] = useState(modeWasInferred);
  const [customPrompts, setCustomPrompts] = useState(readPrompts);
  const [kind, setKind] = useState(KINDS[initialSettings.promptCategory] ? initialSettings.promptCategory : 'empathic');
  const [prompt, setPrompt] = useState(() => promptFor(KINDS[initialSettings.promptCategory] ? initialSettings.promptCategory : 'empathic', readPrompts()));
  const [showPrompt, setShowPrompt] = useState(initialSettings.showPrompt !== false);
  const [style, setStyle] = useState(STYLES[initialSettings.fontFamily] ? initialSettings.fontFamily : 'plain');
  const [size, setSize] = useState(SIZES[initialSettings.fontSize] ? initialSettings.fontSize : '18px');
  const [draftState, setDraftState] = useState(initialDraft?.text ? { ok: true, at: initialDraft.lastModified, restored: true } : null);
  const [message, setMessage] = useState(null); // { text, tone: 'ok' | 'problem' }
  const [saved, setSaved] = useState(0);
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(null); // entry id being read
  const [confirm, setConfirm] = useState(null); // entry id or 'all'
  const [query, setQuery] = useState('');
  const [voices, setVoices] = useState([]);
  const [reading, setReading] = useState(false);
  const stopRef = useRef(null);
  const areaRef = useRef(null);
  const draftTimer = useRef(null);

  // Started: something written on the page in this visit. Completed: an entry saved.
  useTechniqueEvents('journaling', text.trim().length > 0 && text !== (initialDraft?.text || ''), saved > 0);

  // Drafts save themselves shortly after typing stops, and say so.
  useEffect(() => {
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      const r = writeDraft({ text, title, tags, mood });
      setDraftState((prev) => (text.trim() || title.trim() ? { ...r, at: new Date().toISOString() } : prev && !r.ok ? { ...r } : null));
    }, 700);
    return () => clearTimeout(draftTimer.current);
  }, [text, title, tags, mood]);

  // Another tab saving or deleting entries: show the same list here.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEYS.entries || e.key === null) setEntries(readEntries());
      if (e.key === KEYS.prompts) setCustomPrompts(readPrompts());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => { writeSettings({ fontFamily: style, fontSize: size, promptCategory: kind, showPrompt }); }, [style, size, kind, showPrompt]);

  // Read aloud uses on-device voices only: journal text must not go to an online voice.
  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;
    const load = () => setVoices(softVoices(window.speechSynthesis.getVoices(), { allowOnline: false }));
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => { window.speechSynthesis.removeEventListener?.('voiceschanged', load); stopRef.current?.(); };
  }, []);

  const say = (msg, tone = 'ok') => { setMessage({ text: msg, tone }); };

  const save = useCallback(() => {
    if (!text.trim()) { say('There is nothing on the page to save yet.', 'problem'); areaRef.current?.focus(); return; }
    const r = addEntry({ id: Date.now(), title: title.trim(), text, tags, mood, timestamp: new Date().toISOString() });
    setEntries(r.entries);
    if (!r.ok) { say(PROBLEM[r.error] || PROBLEM.blocked, 'problem'); return; }
    clearDraft();
    setText(''); setTitle(''); setTags([]); setMood(null); setDraftState(null);
    setSaved((n) => n + 1);
    say(getMode() === 'device'
      ? 'Saved. It is in "My entries", on this device only.'
      : 'Saved for this visit. It is in "My entries" until you close this tab.');
    areaRef.current?.focus();
  }, [text, title, tags, mood]);

  const chooseMode = (next) => {
    const r = setMode(next);
    if (!r.ok) { say(PROBLEM[r.error] || PROBLEM.blocked, 'problem'); return; }
    setModeState(next); setInferred(false); setEntries(readEntries());
    say(next === 'device'
      ? 'Your journal will now be kept in this browser on this device.'
      : 'Your journal is now kept for this visit only, and has been removed from this browser.');
  };

  // Where the journal is kept, said before anything is written.
  const storageChoice = mode === 'session' ? (
    <div className="border-l-4 border-sage-500 pl-4 text-sm leading-relaxed text-ink-800">
      <p>
        <strong>This visit only.</strong> What you write and save here is gone when you close the tab. Nothing is stored
        in your browser unless you choose to keep it.
      </p>
      <p className="mt-1">
        <button type="button" onClick={() => chooseMode('device')} className="min-h-11 font-bold text-ink-900 underline underline-offset-4">
          Keep my journal on this device
        </button>{' '}
        <span className="text-ink-700">(stored unencrypted in this browser; anyone using it could read it)</span>
      </p>
    </div>
  ) : inferred ? (
    <div className="border-l-4 border-[#C98A12] pl-4 text-sm leading-relaxed text-ink-800">
      <p><strong>Your journal is stored in this browser</strong> from an earlier visit. It is not encrypted, and anyone using this browser could read it.</p>
      <p className="mt-1 flex flex-wrap gap-x-5">
        <button type="button" onClick={() => chooseMode('device')} className="min-h-11 font-bold text-ink-900 underline underline-offset-4">Keep it here</button>
        <button type="button" onClick={() => chooseMode('session')} className="min-h-11 font-bold text-ink-900 underline underline-offset-4">Remove it from this browser, keep it for this visit</button>
      </p>
    </div>
  ) : null;

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (tab === 'write') save(); }
  };

  const addTag = () => {
    const t = tagDraft.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagDraft('');
  };

  const download = (name, body, type) => {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const stamp = new Date().toISOString().slice(0, 10);

  const readAloud = () => {
    if (reading) { stopRef.current?.(); setReading(false); return; }
    stopRef.current = speakSoftly(text || prompt, {
      allowOnline: false, voice: voices[0], rate: 0.85,
      onStart: () => setReading(true), onEnd: () => setReading(false), onError: () => setReading(false),
    });
  };

  const st = STYLES[style];
  const fontPx = `calc(${size} * ${st.scale || 1})`;
  const shown = entries.filter((e) => !query.trim() || `${e.title} ${e.text} ${e.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
  const tabs = [
    { id: 'write', label: 'Write', icon: Edit3 },
    { id: 'entries', label: entries.length ? `My entries (${entries.length})` : 'My entries', icon: BookOpen },
    { id: 'data', label: 'Your data', icon: FolderLock },
  ];

  return (
    <TechniqueShell icon="journaling" color="blue" note="Write it down" title="Journaling" wide backdrop={<InkDesk lamp={focused || text.length > 0} />}
      intro="A private page to write on. Use a prompt if a blank page is hard, or ignore it. Entries stay in this browser unless you export them.">
      <div onKeyDown={onKeyDown}>
        <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 border-b-2 border-ink-900/10 pb-3" role="tablist" aria-label="Journal sections">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`}
              onClick={() => { setTab(t.id); setMessage(null); }}
              className={`relative inline-flex items-center gap-2 py-1 text-lg font-bold ${tab === t.id ? 'text-ink-900' : 'text-ink-700/80 hover:text-ink-900'}`}>
              <t.icon size={18} aria-hidden="true" />
              {t.label}
              {tab === t.id && (
                <Motion.span layoutId="journal-tab" aria-hidden="true" className="absolute inset-x-0 -bottom-[14px] h-1 rounded-full bg-[#3E6FD8]"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 34 }} />
              )}
            </button>
          ))}
        </div>

        {message && (
          <p role="status" className={`mb-4 flex items-start justify-between gap-3 border-l-4 py-1 pl-3 ${message.tone === 'problem' ? 'border-red-700 text-red-900' : 'border-sage-500 text-ink-900'}`}>
            <span>{message.text}</span>
            <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss message" className="text-ink-700 hover:text-ink-900"><X size={16} /></button>
          </p>
        )}

        {tab === 'write' && (
          <section id="panel-write" role="tabpanel" aria-labelledby="tab-write" className="space-y-5">
            {storageChoice}
            {showPrompt && (
              <div className="flex items-start gap-3 border-l-4 border-[#3E6FD8] pl-4 [perspective:800px]">
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink-700">If a blank page is hard, you could start here</p>
                  <AnimatePresence mode="wait" initial={false}>
                    <Motion.p key={prompt}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, rotateX: -70 }} animate={{ opacity: 1, rotateX: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, rotateX: 70 }} transition={{ duration: 0.3 }}
                      style={{ transformOrigin: 'top center' }} className="text-xl leading-snug text-[#1F3A8A]">
                      {prompt}
                    </Motion.p>
                  </AnimatePresence>
                </div>
                <button type="button" onClick={() => setPrompt(promptFor(kind, customPrompts))} aria-label="Another prompt"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-white/70"><RotateCcw size={18} /></button>
                <button type="button" onClick={() => setShowPrompt(false)} aria-label="Hide prompts"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-white/70"><X size={18} /></button>
              </div>
            )}

            {/* The page itself, first */}
            <div className={`paper-sheet ruled relative py-6 pl-14 pr-5 transition-shadow duration-700 sm:pl-16 ${focused ? 'shadow-[0_30px_80px_-30px_rgba(196,140,60,0.55)]' : ''}`}
              style={{ '--line': lineFor(size) }}>
              <label htmlFor="journal-text" className="sr-only">Journal entry</label>
              <textarea id="journal-text" ref={areaRef} value={text} onChange={(e) => setText(e.target.value)}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                placeholder="Write whatever is on your mind. Nobody else reads this."
                style={{ fontSize: fontPx, lineHeight: lineFor(size), minHeight: `calc(${lineFor(size)} * 10)` }}
                className={`block w-full resize-y border-0 bg-transparent p-0 text-ink-900 placeholder:text-ink-700/50 focus:outline-none ${st.className}`} />
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <button type="button" onClick={save} className="btn-ink">Save entry</button>
              {voices.length > 0 && (
                <button type="button" onClick={readAloud} aria-pressed={reading} className="inline-flex items-center gap-2 font-bold text-ink-900 underline underline-offset-4">
                  {reading ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}{reading ? 'Stop reading' : 'Read it back'}
                </button>
              )}
              {text && (
                <button type="button" onClick={() => { setText(''); setTitle(''); setTags([]); setMood(null); clearDraft(); setDraftState(null); areaRef.current?.focus(); }}
                  className="text-sm font-bold text-ink-700 underline underline-offset-4">Clear the page</button>
              )}
              <p className="text-sm text-ink-700" aria-live="polite">
                {words(text)} {words(text) === 1 ? 'word' : 'words'}
                {draftState?.ok && draftState.at && `. Draft kept ${mode === 'device' ? 'on this device' : 'until you close this tab'}${draftState.restored ? ' from last time' : ''}, ${new Date(draftState.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                {draftState && !draftState.ok && <strong className="text-red-800">. {PROBLEM[draftState.error] || PROBLEM.blocked}</strong>}
              </p>
            </div>

            <details className="group border-t border-ink-900/10 pt-4">
              <summary className="cursor-pointer font-bold text-ink-900">
                Add a title, tags or a feeling <span className="font-normal text-ink-700">(optional)</span>
                {(title || tags.length || mood) && <span className="font-normal text-ink-700">: {[title && 'title', tags.length && `${tags.length} tag${tags.length > 1 ? 's' : ''}`, mood && mood.label].filter(Boolean).join(', ')}</span>}
              </summary>
              <div className="mt-4 space-y-5">
                <label className="block max-w-xl">
                  <span className="text-sm font-bold text-ink-900">Title</span>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" className={`${field} mt-1 w-full`} />
                </label>
                <div>
                  <label htmlFor="tag-input" className="text-sm font-bold text-ink-900">Tags</label>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <input id="tag-input" value={tagDraft} onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="for example, work" className={`${field} w-44`} />
                    <button type="button" onClick={addTag} aria-label="Add tag" className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink-900/30 hover:border-ink-900"><Plus size={16} /></button>
                    {tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full border-2 border-ink-900/20 px-2 py-0.5 text-sm text-ink-800">
                        #{t}
                        <button type="button" aria-label={`Remove tag ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                </div>
                <fieldset>
                  <legend className="text-sm font-bold text-ink-900">A feeling, if you want to note one. You choose it; nothing is worked out from your writing.</legend>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" role="group" aria-label="Kind of feeling">
                    {Object.keys(moodCategories).map((k) => (
                      <button key={k} type="button" aria-pressed={moodKind === k} onClick={() => setMoodKind(k)}
                        className={`min-h-11 px-1 capitalize ${moodKind === k ? 'font-bold text-ink-900 underline decoration-2 underline-offset-4' : 'text-ink-700'}`}>{k}</button>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {moodCategories[moodKind].map((m) => {
                      const on = mood?.label === m.label;
                      return (
                        <button key={m.label} type="button" aria-pressed={on} onClick={() => setMood(on ? null : { label: m.label, emoji: m.emoji, kind: moodKind })}
                          className="relative w-[5.25rem] px-1 py-2 text-center">
                          {on && <Motion.span layoutId="ink-blot" aria-hidden="true" className="absolute inset-x-2 inset-y-1 rounded-[46%_54%_42%_58%/55%_45%_55%_45%] bg-[#C9D6F2]" transition={reduce ? { duration: 0 } : undefined} />}
                          <span className="relative block text-2xl" aria-hidden="true">{m.emoji}</span>
                          <span className={`relative block text-sm ${on ? 'font-bold text-ink-900' : 'text-ink-700'}`}>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            </details>

            <details className="border-t border-ink-900/10 pt-4">
              <summary className="cursor-pointer font-bold text-ink-900">Page settings</summary>
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4 text-sm text-ink-800">
                <label className="block min-w-0 max-w-full">Writing style
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className={`${field} mt-1 block w-full`}>
                    {Object.entries(STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </label>
                <label className="block min-w-0 max-w-full">Text size
                  <select value={size} onChange={(e) => setSize(e.target.value)} className={`${field} mt-1 block w-full`}>
                    {Object.entries(SIZES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                <label className="block min-w-0 max-w-full">Kind of prompt
                  <select value={kind} onChange={(e) => { setKind(e.target.value); setPrompt(promptFor(e.target.value, customPrompts)); setShowPrompt(true); }} className={`${field} mt-1 block w-full`}>
                    {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                {!showPrompt && <button type="button" onClick={() => setShowPrompt(true)} className="self-end font-bold underline underline-offset-4">Show prompts again</button>}
              </div>
              <p className="mt-3 text-sm text-ink-700">Ctrl+S (or ⌘S) saves the entry.</p>
            </details>
          </section>
        )}

        {tab === 'entries' && (
          <section id="panel-entries" role="tabpanel" aria-labelledby="tab-entries">
            {entries.length === 0 ? (
              <p className="text-lg text-ink-800">No saved entries yet. Anything you save from the Write tab appears here, on this device only.</p>
            ) : (
              <>
                <label className="block max-w-md">
                  <span className="sr-only">Search your entries</span>
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your entries" className={`${field} w-full`} />
                </label>
                <ul className="mt-4 divide-y divide-ink-900/10 border-y border-ink-900/10">
                  {shown.map((e) => (
                    <li key={e.id} className="py-4">
                      <button type="button" aria-expanded={open === e.id} onClick={() => setOpen(open === e.id ? null : e.id)} className="block w-full text-left">
                        <span className="block text-lg font-bold text-ink-900">{e.title || 'Untitled entry'}</span>
                        <span className="block text-sm text-ink-700">{when(e.timestamp)}{e.tags.length ? ` · ${e.tags.map((t) => `#${t}`).join(' ')}` : ''}{e.mood?.label ? ` · ${e.mood.label}` : ''}</span>
                        {open !== e.id && <span className="mt-1 line-clamp-2 block text-ink-800">{e.text}</span>}
                      </button>
                      {open === e.id && (
                        <div className="mt-3">
                          <p className="whitespace-pre-wrap leading-relaxed text-ink-900">{e.text}</p>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold">
                            {confirm === e.id ? (
                              <>
                                <span className="text-ink-900">Delete this entry for good?</span>
                                <button type="button" className="text-red-800 underline underline-offset-4" onClick={() => {
                                  const r = deleteEntry(e.id); setEntries(r.entries); setConfirm(null); setOpen(null);
                                  say(r.ok ? 'Entry deleted.' : PROBLEM[r.error] || PROBLEM.blocked, r.ok ? 'ok' : 'problem');
                                }}>Delete it</button>
                                <button type="button" className="underline underline-offset-4" onClick={() => setConfirm(null)}>Keep it</button>
                              </>
                            ) : (
                              <button type="button" className="text-red-800 underline underline-offset-4" onClick={() => setConfirm(e.id)}>Delete this entry</button>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {shown.length === 0 && <p className="mt-4 text-ink-700">No entries match that search.</p>}
              </>
            )}
          </section>
        )}

        {tab === 'data' && (
          <section id="panel-data" role="tabpanel" aria-labelledby="tab-data" className="max-w-3xl space-y-8">
            <div>
              <h2 className="text-xl font-bold text-ink-900">Where your journal is kept</h2>
              <p className="mt-2">
                <button type="button" onClick={() => chooseMode(mode === 'device' ? 'session' : 'device')} className="min-h-11 font-bold text-ink-900 underline underline-offset-4">
                  {mode === 'device' ? 'Stop keeping it: remove it from this browser, keep it for this visit' : 'Keep my journal on this device'}
                </button>
              </p>
              <p className="mt-2 leading-relaxed text-ink-800">
                {mode === 'device'
                  ? 'Entries, the unsaved draft and your settings are stored in this browser on this device (localStorage), because you chose to keep them.'
                  : 'Right now your journal is kept for this visit only, in the memory of this page, and is gone when you close the tab. If you choose to keep it, it is stored in this browser on this device (localStorage).'}{' '}
                They are not sent anywhere. Stored entries are not encrypted by Relevia and have no automatic expiry.
                Anyone who uses this browser profile could read them. Clearing your browser&apos;s site data deletes them too, so export a copy if you want to keep them. The chat&apos;s session-only and deletion controls, and &ldquo;Forget them&rdquo; on the home page, do not clear journal data.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-900">Export</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" className="btn-outline" disabled={!entries.length} onClick={() => download(`relevia-journal-${stamp}.txt`, plainText(entries), 'text/plain')}>
                  <Download size={16} aria-hidden="true" /> As plain text
                </button>
                <button type="button" className="btn-outline" disabled={!entries.length && !customPrompts.length} onClick={() => download(`relevia-journal-backup-${stamp}.json`, JSON.stringify(backup(), null, 2), 'application/json')}>
                  <Download size={16} aria-hidden="true" /> As a backup file
                </button>
              </div>
              <p className="mt-2 text-sm text-ink-700">Plain text is for reading anywhere. The backup file can be restored here later, on this or another browser.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-900">Restore a backup</h2>
              <label className="btn-outline mt-3 inline-flex cursor-pointer">
                <Upload size={16} aria-hidden="true" /> Choose a backup file
                <input type="file" accept="application/json,.json" className="sr-only" onChange={(ev) => {
                  const file = ev.target.files?.[0]; ev.target.value = '';
                  if (!file) return;
                  file.text().then((t) => {
                    let r;
                    try { r = restore(JSON.parse(t)); } catch { r = { ok: false, error: 'invalid' }; }
                    if (r.ok) { setEntries(r.entries); setCustomPrompts(readPrompts()); say(`Restored. ${r.added} new ${r.added === 1 ? 'entry' : 'entries'} added; entries already here were kept.`); }
                    else say(r.error === 'invalid' ? "That file isn't a Relevia journal backup." : PROBLEM[r.error] || PROBLEM.blocked, 'problem');
                  });
                }} />
              </label>
              <p className="mt-2 text-sm text-ink-700">Restoring adds entries; it never replaces or deletes what is already here.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-900">Your own prompts</h2>
              <ul className="mt-2 space-y-1">
                {customPrompts.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-ink-800">{p}
                    <button type="button" aria-label={`Remove prompt: ${p}`} onClick={() => { const next = customPrompts.filter((x) => x !== p); setCustomPrompts(next); writePrompts(next); }}><X size={14} /></button>
                  </li>
                ))}
              </ul>
              <form className="mt-2 flex max-w-xl gap-2" onSubmit={(ev) => {
                ev.preventDefault(); const v = new FormData(ev.currentTarget).get('p')?.toString().trim();
                if (v && !customPrompts.includes(v)) { const next = [...customPrompts, v]; setCustomPrompts(next); const r = writePrompts(next); if (!r.ok) say(PROBLEM[r.error], 'problem'); }
                ev.currentTarget.reset();
              }}>
                <label className="flex-1"><span className="sr-only">New prompt</span><input name="p" placeholder="Add a prompt of your own" className={`${field} w-full`} /></label>
                <button type="submit" className="btn-outline">Add</button>
              </form>
            </div>
            <div className="border-l-4 border-red-700 pl-4">
              <h2 className="text-xl font-bold text-ink-900">Delete everything</h2>
              <p className="mt-2 text-ink-800">Deletes every saved entry, the draft and your own prompts from this browser. This can&apos;t be undone. Export first if you want a copy.</p>
              {confirm === 'all' ? (
                <div className="mt-3 flex flex-wrap items-center gap-4 font-bold">
                  <span>Delete all {entries.length} {entries.length === 1 ? 'entry' : 'entries'} for good?</span>
                  <button type="button" className="text-red-800 underline underline-offset-4" onClick={() => {
                    clearTimeout(draftTimer.current); // a pending draft save must not bring text back
                    const r = deleteAll({ settings: true });
                    setEntries(readEntries()); setCustomPrompts(readPrompts()); setText(''); setTitle(''); setTags([]); setMood(null); setDraftState(null); setConfirm(null);
                    say(r.ok ? 'Everything in the journal has been deleted from this browser.' : PROBLEM.blocked, r.ok ? 'ok' : 'problem');
                  }}>Yes, delete everything</button>
                  <button type="button" className="underline underline-offset-4" onClick={() => setConfirm(null)}>Keep it</button>
                </div>
              ) : (
                <button type="button" className="mt-3 font-bold text-red-800 underline underline-offset-4" onClick={() => setConfirm('all')}>Delete everything…</button>
              )}
            </div>
          </section>
        )}
      </div>
    </TechniqueShell>
  );
}
