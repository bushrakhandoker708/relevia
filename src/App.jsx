import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { MotionConfig } from 'framer-motion';

// Core Components
import Navbar from './components/Navbar';
import QuickHelpButton from './components/QuickHelpButton';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import { CrayonDefs, CrayonHeart } from './components/Crayon';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Coping = lazy(() => import('./pages/Coping'));
const Medication = lazy(() => import('./pages/Medication'));
const Contact = lazy(() => import('./pages/Contact'));

// Lazy load coping technique components
const Breathing = lazy(() => import('./components/CopingTechniques/Breathing'));
const Mindfulness = lazy(() => import('./components/CopingTechniques/Mindfulness'));
const Relaxation = lazy(() => import('./components/CopingTechniques/Relaxation'));
const Visualisation = lazy(() => import('./components/CopingTechniques/Visualization'));
const Affirmations = lazy(() => import('./components/CopingTechniques/Affirmations'));
const Activity = lazy(() => import('./components/CopingTechniques/Activity'));
const Journaling = lazy(() => import('./components/CopingTechniques/Journaling'));

// One title per page, so tabs, history and screen readers can tell pages apart.
const TITLES = {
  '/': 'Relevia: a quiet page to put things down',
  '/about': 'Understanding panic attacks',
  '/coping': 'Coping techniques',
  '/medication': 'Medication',
  '/contact': 'Contact',
  '/coping/breathing': 'Breathing',
  '/coping/mindfulness': '5-4-3-2-1 grounding',
  '/coping/relaxation': 'Relaxation',
  '/coping/visualization': 'Visualisation',
  '/coping/affirmations': 'Affirmations',
  '/coping/activity': 'Moving',
  '/coping/journaling': 'Journaling',
};

// On every route change: start at the top, set the page title, and (after the first page)
// move keyboard and screen-reader focus to the new page's heading. Without this, focus
// stays on the link that was clicked, which no longer exists, and nothing is announced.
function RouteChange() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    window.scrollTo(0, 0);
    const path = pathname.replace(/\/+$/, '') || '/';
    const name = TITLES[path];
    document.title = name ? (path === '/' ? name : `${name} | Relevia`) : 'Page not found | Relevia';
    if (first.current) { first.current = false; return undefined; }
    // Pages are lazy-loaded, so wait for the heading to appear (up to about 3 seconds).
    let tries = 0;
    const id = setInterval(() => {
      const h1 = document.querySelector('main h1');
      if (h1 || ++tries > 30) {
        clearInterval(id);
        const target = h1 || document.getElementById('main');
        if (target) {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      }
    }, 100);
    return () => clearInterval(id);
  }, [pathname]);
  return null;
}

/**
 * Main App component that provides routing and global layout structure
 * for a mental health and wellness application.
 * 
 * Features:
 * - React Router for client-side navigation
 * - Lazy loading for improved performance
 * - SEO optimization with react-helmet-async
 * - Analytics integration with Vercel
 * - Error boundary for graceful error handling
 * - Loading states for better UX
 * 
 * @returns {JSX.Element} The main application component
 */
function App() {
  return (
    <HelmetProvider>
      {/* ACCESSIBILITY + PERF: anyone with "reduce motion" turned on (common with anxiety
          and vestibular issues) gets every framer-motion animation on the site calmed
          down - no sliding, bouncing or looping movement, just fades. */}
      <MotionConfig reducedMotion="user">
      {/* FIX: on GitHub Pages the site lives at /relevia/, without basename every
          route 404'd. BASE_URL is '/' locally and '/relevia/' for npm run deploy. */}
      <Router basename={import.meta.env.BASE_URL}>
        {/* Global SEO Configuration */}
        <Helmet>
          <html lang="en" />
          <title>Relevia</title>
          <meta 
            name="description" 
            content="Discover effective coping techniques, medication information, and resources for mental health support. Your comprehensive guide to mental wellness and recovery." 
          />
          <meta name="keywords" content="mental health, coping techniques, mindfulness, anxiety relief, depression support, wellness, meditation, breathing exercises" />
          <meta name="author" content="Mental Health & Wellness Team" />
          
          {/* Open Graph / Social Media Meta Tags */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Mental Health & Wellness - Your Journey to Better Mental Health" />
          <meta property="og:description" content="Discover effective coping techniques, medication information, and resources for mental health support." />
          <meta property="og:site_name" content="Mental Health & Wellness" />
          
          {/* Twitter Card Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Mental Health & Wellness" />
          <meta name="twitter:description" content="Your comprehensive guide to mental wellness and recovery." />
          
          {/* Additional SEO Meta Tags */}
          <meta name="robots" content="index, follow" />
          <meta name="theme-color" content="#EEF0E9" />          
        </Helmet>

        <RouteChange />
        <CrayonDefs />
        <ErrorBoundary>
          <a href="#main" className="btn-ink sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]">Skip to main content</a>
          <Navbar />
          
          {/* Main Content Area with Suspense for Lazy Loading */}
          <main id="main" tabIndex={-1} className="focus:outline-none">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Primary Pages */}
                <Route 
                  path="/" 
                  element={<Home />}
                />
                <Route 
                  path="/about" 
                  element={<About />}
                />
                <Route 
                  path="/coping" 
                  element={<Coping />}
                />
                <Route 
                  path="/medication" 
                  element={<Medication />}
                />
                <Route 
                  path="/contact" 
                  element={<Contact />}
                />

                {/* Coping Techniques Sub-routes */}
                <Route 
                  path="/coping/mindfulness" 
                  element={<Mindfulness />}
                />
                <Route 
                  path="/coping/breathing" 
                  element={<Breathing />}
                />
                <Route 
                  path="/coping/relaxation" 
                  element={<Relaxation />}
                />
                <Route 
                  path="/coping/visualization" 
                  element={<Visualisation />}
                />
                <Route 
                  path="/coping/affirmations" 
                  element={<Affirmations />}
                />
                <Route 
                  path="/coping/activity" 
                  element={<Activity />}
                />
                <Route 
                  path="/coping/journaling" 
                  element={<Journaling />}
                />

                {/* 404 Route - Should be last */}
                <Route 
                  path="*" 
                  element={
                    <div className="flex min-h-screen items-center justify-center px-4 pt-16">
                      <div className="paper-sheet max-w-md px-8 py-10 text-center">
                        <CrayonHeart size={56} className="mx-auto mb-3" />
                        <h1 className="mb-3 text-3xl font-bold text-ink-900">This page isn&apos;t in the notebook</h1>
                        <p className="mb-7 text-ink-700">The link may be old or mistyped.</p>
                        {/* FIX: a plain href="/" left the /relevia/ site on GitHub Pages */}
                        <Link to="/" className="btn-ink">Go to the home page</Link>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </main>

          {/* Analytics Integration */}
          <Analytics />
          
          {/* Quick Help Button - Always accessible */}
          <QuickHelpButton />
        </ErrorBoundary>
      </Router>
      </MotionConfig>
    </HelmetProvider>
  );
}

export default App;