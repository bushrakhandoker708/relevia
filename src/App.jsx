import React, { Suspense, lazy, useEffect } from 'react';
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

// A new page starts at its top; the router alone keeps the previous page's scroll position.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
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
          <title>Mental Health & Wellness - Your Journey to Better Mental Health</title>
          <meta 
            name="description" 
            content="Discover effective coping techniques, medication information, and resources for mental health support. Your comprehensive guide to mental wellness and recovery." 
          />
          <meta name="keywords" content="mental health, coping techniques, mindfulness, anxiety relief, depression support, wellness, meditation, breathing exercises" />
          <meta name="author" content="Mental Health & Wellness Team" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          
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
          <link rel="canonical" href="https://your-domain.com" />
          
          {/* Preconnect to external domains for performance */}
          <link rel="preconnect" href="https://vitals.vercel-insights.com" />
          
          {/* JSON-LD Structured Data for SEO */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Mental Health & Wellness",
              "description": "Comprehensive mental health resources and coping techniques",
              "url": "https://your-domain.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://your-domain.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Mental Health & Wellness"
              }
            })}
          </script>
        </Helmet>

        <ScrollToTop />
        <CrayonDefs />
        <ErrorBoundary>
          {/* Navigation Component */}
          <Navbar />
          
          {/* Main Content Area with Suspense for Lazy Loading */}
          <main role="main">
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