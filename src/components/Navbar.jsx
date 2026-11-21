import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FaTimes, FaBars } from 'react-icons/fa';
import { CrayonHeart } from './Crayon';

// Paper theme: the bar is the top edge of a notebook. The current page is marked with a
// highlighter stroke, the way you would mark a heading in your own notes.
const navLinks = [
  { to: '/about', label: 'What is it actually?' },
  { to: '/coping', label: 'Coping techniques' },
  { to: '/medication', label: 'Medication' },
  { to: '/contact', label: 'Contact' },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setIsOpen(false); }, [pathname]);
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const linkClass = ({ isActive }) =>
    `px-1 py-1 text-[1.02rem] font-bold text-ink-900 decoration-2 underline-offset-4 hover:underline ${isActive ? 'highlight' : ''}`;

  return (
    <nav className="fixed top-0 z-20 w-full border-b border-white/60 bg-paper-100/60 backdrop-blur-xl backdrop-saturate-150">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-ink-900" aria-label="Relevia, home">
          <CrayonHeart size={34} />
          <span className="font-handwritten text-[2rem] font-bold leading-none">Relevia</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>{link.label}</NavLink>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="rounded-md p-2 text-ink-900 md:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>
      </div>

      {isOpen && (
        <div id="mobile-menu" className="paper-sheet ruled mx-3 mb-3 px-6 pb-4 pt-2 md:hidden" style={{ paddingLeft: 64 }}>
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to}
              className={({ isActive }) => `block text-lg font-bold leading-[32px] text-ink-900 ${isActive ? 'highlight' : ''}`}>
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
