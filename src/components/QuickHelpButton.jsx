import { Link, useLocation } from 'react-router-dom';
import { TechniqueSphere } from './CopingTechniques/TechniqueShell';

// A quiet shortcut to the coping techniques, on every page. It used to spin and pulse
// constantly; for someone who is already panicking that is the opposite of helpful.
function QuickHelpButton() {
  // Hidden inside a technique: the person is already doing one, and on a phone the
  // button would sit on top of the exercise controls.
  const { pathname } = useLocation();
  if (pathname.startsWith('/coping/')) return null;
  return (
    <Link
      to="/coping"
      className="paper-sheet fixed bottom-4 right-3 z-40 flex items-center gap-1.5 border-2 border-sage-600 py-1.5 pl-1.5 pr-3 text-ink-900 transition-transform hover:-translate-y-0.5 sm:bottom-6 sm:right-6"
    >
      <TechniqueSphere icon="breathing" color="leaf" size={32} />
      <span className="font-handwritten text-[1.35rem] font-bold leading-none">Quick calm</span>
    </Link>
  );
}

export default QuickHelpButton;
