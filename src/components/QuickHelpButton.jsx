import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TechniqueSphere } from './CopingTechniques/TechniqueShell';

// A quiet shortcut to the coping techniques, on every page. It used to spin and pulse
// constantly; for someone who is already panicking that is the opposite of helpful.
//
// It shares the bottom edge with "Talk to Relevia" (bottom-left). Each takes at most half
// the width (.float-dock in index.css), so at narrow widths or with enlarged text they
// wrap rather than overlap. It steps aside while the chat panel is open, because on a
// phone the panel covers this corner, and while the on-screen keyboard is up.
function QuickHelpButton() {
  const { pathname } = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [keyboardUp, setKeyboardUp] = useState(false);

  useEffect(() => {
    const onChat = (e) => setChatOpen(Boolean(e.detail?.open));
    window.addEventListener('relevia:chat-panel', onChat);
    const vv = window.visualViewport;
    // A visual viewport much shorter than the layout viewport means a software keyboard.
    const onResize = () => setKeyboardUp(Boolean(vv) && window.innerHeight - vv.height > 150);
    vv?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('relevia:chat-panel', onChat);
      vv?.removeEventListener('resize', onResize);
    };
  }, []);

  // Hidden inside a technique: the person is already doing one, and on a phone the
  // button would sit on top of the exercise controls.
  if (pathname.startsWith('/coping/') || chatOpen || keyboardUp) return null;
  return (
    <Link
      to="/coping"
      className="paper-sheet float-dock float-dock-right z-40 flex min-h-11 items-center gap-1.5 border-2 border-sage-600 py-1.5 pl-1.5 pr-3 text-ink-900 transition-transform hover:-translate-y-0.5"
    >
      <span className="shrink-0"><TechniqueSphere icon="breathing" color="leaf" size={32} /></span>
      <span className="font-handwritten text-[1.35rem] font-bold leading-[1.05]">Quick calm</span>
    </Link>
  );
}

export default QuickHelpButton;
