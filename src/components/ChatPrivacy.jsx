import { useState } from 'react';
import { chatStore, deleteLegacyChat, newSessionId } from '../services/chatStorage.js';

export default function ChatPrivacy({ sessionId, busy, legacyWarning, onReset, onRestore }) {
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState([]);
  const [saving, setSaving] = useState(false);
  const settings = chatStore.settings(sessionId);
  const choose = (enabled) => {
    try {
      chatStore.setPersistence(sessionId, enabled);
      setSaving(enabled);
      setNotice(enabled ? 'Saving is on. Names are never saved separately.' : 'Saving is off; the saved copy was removed.');
    } catch (err) { setSaving(false); setNotice(err.message); }
  };
  const erase = async () => {
    // Invalidate pending UI and storage writes before awaiting legacy deletion.
    onReset();
    setSaved([]); setSaving(false);
    try {
      chatStore.clearAll();
      globalThis.sessionStorage?.removeItem('relevia_visit_counted');
      const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('relevia-chat-clear') : null;
      channel?.postMessage('clear'); channel?.close();
      await deleteLegacyChat();
      setNotice('Chat history and chat personalization deleted. Journals and other tools are separate.');
    } catch (err) { setNotice(`Memory cleared; stored data deletion needs retry. ${err.message}`); }
  };
  const restore = (id) => {
    try {
      const fresh = newSessionId();
      const db = chatStore.restore(id, fresh);
      onRestore(fresh, db.getHist(100));
      setSaved([]); setSaving(false);
      setNotice('Opened in memory. Saving is off; the old saved copy was removed.');
    } catch (err) { setNotice(`Could not open saved chat. ${err.message}`); }
  };
  return (
    <details className="chat-privacy max-h-56 overflow-y-auto border-b border-dashed border-rule bg-sheet px-4 py-2 text-xs leading-relaxed text-ink-800 [&_p]:mt-2">
      <summary className="cursor-pointer font-bold text-ink-800">Chat privacy and history</summary>
      <p>By default, chat stays in this page&apos;s memory and ends when you reload or leave. Optional saving keeps messages on this browser for up to 24 hours to reopen later. Anyone using this browser can open saved chats. It is not encrypted by Relevia.</p>
      <p>Detected crisis context disables saving for the whole chat. Detection is incomplete: other sensitive messages may still be saved if you opt in. Expired records are excluded when accessed; deletion runs while this app is open.</p>
      <label className="my-2 block font-bold">
        <input type="checkbox" checked={saving && settings.persistent} disabled={busy || settings.sensitive}
          onChange={e => choose(e.target.checked)} /> Save this chat for up to 24 hours
      </label>
      <button type="button" className="mr-3 font-bold underline decoration-rose-400 decoration-2 underline-offset-2" onClick={erase}>Delete all saved chats and start fresh</button>
      <button type="button" className="font-bold underline decoration-2 underline-offset-2" disabled={busy} onClick={() => {
        try { const items = chatStore.listSaved(); setSaved(items); setNotice(items.length ? 'Choose only your own chat; this is a shared browser, not a login.' : 'No saved chats.'); }
        catch { setNotice('Browser storage is unavailable. Chat still works in memory.'); }
      }}>Show saved chats</button>
      {saved.map(item => <button type="button" disabled={busy} className="block underline" key={item.id}
        onClick={() => restore(item.id)}>Open chat saved {new Date(item.savedAt).toLocaleString()}</button>)}
      <p role="status">{legacyWarning ? `Legacy storage: ${legacyWarning} ` : ''}{settings.error}{settings.sensitive ? 'Saving disabled for sensitive context. ' : ''}{notice}</p>
      <p>Local inference still downloads model files. Site analytics and browser voice services have separate data flows. Speech is off by default.</p>
    </details>
  );
}
