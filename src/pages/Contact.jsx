import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import abirImg from '../assets/images/abir.jpg';
import bushraImg from '../assets/images/bushra.png';

const StoryCard = ({ name, image, story }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const variants = {
    hidden: { opacity: 0, rotateY: 90 },
    visible: { opacity: 1, rotateY: 0 },
  };

  return (
    <Motion.div
      className="paper-sheet p-6"
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ type: 'spring', stiffness: 80, damping: 10 }}
      whileHover={{ y: -5 }}
    >
      <div className="flex items-center space-x-4">
        <Motion.img
          src={image}
          alt={name}
          className="w-16 h-16 rounded-full object-cover shadow-md"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
        <h3 className="text-[1.9rem] font-handwritten font-bold text-ink-900">{name}</h3>
      </div>
      <Motion.button
        className="mt-4 font-bold text-ink-800 underline decoration-2 underline-offset-4"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        {isExpanded ? 'Hide story' : 'Read story'}
      </Motion.button>
      <AnimatePresence>
        {isExpanded && (
          <Motion.p
            className="mt-4 text-ink-700 leading-relaxed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {story}
          </Motion.p>
        )}
      </AnimatePresence>
    </Motion.div>
  );
};

const ContactItem = ({ icon, text, link }) => (
  <Motion.a
    href={link}
    target="_blank"
    rel="noopener noreferrer"
    className="paper-sheet flex items-center space-x-4 p-4 transition-transform hover:-translate-y-0.5"
    whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: 'spring', stiffness: 200 }}
  >
    <FontAwesomeIcon icon={icon} className="h-6 w-6 text-sage-600" />
    <span className="text-ink-900 font-bold text-lg">{text}</span>
  </Motion.a>
);

function Contact() {
  const contactItems = [
    {
      icon: faGlobe,
      text: 'Visit our website',
      link: 'https://bushraabir.github.io/empowereducation',
    },
  ];

  const stories = [
    {
      name: 'Abir’s Experience',
      image: abirImg,
      story: `I’ve experienced anxiety and panic attacks myself. At times, I felt suffocated, with extreme tingling headaches. It was like my brain was on fire—my thoughts running wild, my body forgetting how to breathe, and my mental energy dropping to almost nothing.
      
      I remember sleepless nights, moments when I felt like I was falling apart from the inside. I had black circles under my eyes, felt extremely hungry and full at the same time. Everything felt wrong, like my body and mind were not mine anymore.
      
      I tried talking to people, but it didn’t help. Most would just say, “Calm down,” and that never works. It made me feel even more alone, like no one really understood. I don’t want anyone else to go through that silence and confusion.
      
      Even now, I still deal with anxiety from time to time. But I’ve stopped hiding from it. Now, I want to face it—with you, and with all of us—together.
      Relivia is my way of saying:
      
      “I’ve been there. I still am sometimes. And I built this space for all of us.”`,
    },
    {
      name: 'Bushra’s Experience',
      image: bushraImg,
      story: `Mental health has always been a quiet battle for me. I often felt sharp pain in my chest, sudden mood swings, and endless pressure. The stress, the racing thoughts—they didn’t always show, but they were always there, quietly hurting.
      
      I used to think I had to deal with it all alone. I tried talking to people, but instead of helping, they said things that made me feel worse. When people don’t understand you, you start to believe your feelings don’t matter. That’s the part that hurts the most.
      
      Sometimes the pain was so heavy, I honestly thought I might die. I’m still healing. I’m not fully okay yet. But I’m trying.
      
      We created Relivia because I know what it feels like to carry all that pain in silence.
      I wanted to help build a space that doesn’t say “Get over it,” but gently says:
      
      “It’s okay. You’re safe here. Take your time.”
      
      Relivia is personal to me.
      It’s not just a project—it’s a small light for anyone walking through a dark tunnel.`,
    },
  ];

  const introParagraphs = [
    "We created Relivia with a dream in our hearts—to help people who feel lost, anxious, or overwhelmed. We’ve seen and experienced how hard panic attacks can be. Sometimes, it feels like the neurons in your brain are frying. Everything feels too much, and many people don’t know where to turn or what to do when that happens. That’s why we wanted to build something simple, free, and filled with gentle, daily guidance—so we can all take small steps toward making the world a better place.",
    "Relivia is not just a website. It’s a quiet, safe space for anyone who needs to breathe and feel okay again. We’re not just developers—we’re human beings who want others to feel safe, supported, and heard. Whether it’s through calming sounds, guided meditations, or simple breathing tools, Relivia is built with love and care, with every person in mind.",
    "We hope that when someone visits Relivia during a hard moment, they feel a little lighter. A little stronger. And most importantly—not alone."
  ];

  return (
    <Motion.section
      className="min-h-screen pt-20 pb-24 overflow-hidden relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
    >
      <div className="container mx-auto p-6 max-w-4xl relative z-10">
        <Motion.h1
          className="text-5xl md:text-6xl font-handwritten font-bold text-ink-900 text-center mb-8"
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeInOut', type: 'spring', stiffness: 100 }}
        >
          Contact
        </Motion.h1>
        <div className="mb-12">
          {introParagraphs.map((paragraph, index) => (
            <Motion.p
              key={index}
              className="text-lg md:text-xl font-body text-ink-700 leading-relaxed text-center max-w-2xl mx-auto mb-6"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.5, duration: 1, ease: 'easeInOut' }}
            >
              {paragraph}
            </Motion.p>
          ))}
          <Motion.div
            className="flex justify-center mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 1 }}
          >
            <Motion.span
              className="text-sage-700 text-sm font-body"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              Scroll to explore
            </Motion.span>
          </Motion.div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <Motion.h2
              className="text-3xl font-bold text-ink-900 mb-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 1, ease: 'easeInOut' }}
            >
              Why We Built Relivia
            </Motion.h2>
            {stories.map((story, index) => (
              <StoryCard key={index} name={story.name} image={story.image} story={story.story} />
            ))}
          </div>
          <Motion.div
            className="hidden md:block w-px bg-rule"
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ duration: 1.5, delay: 0.8, ease: 'easeInOut' }}
          />
          <div className="flex-1">
            <Motion.h2
              className="text-3xl font-bold text-ink-900 mb-6"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 1, ease: 'easeInOut' }}
            >
              Get in Touch
            </Motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactItems.map((item, index) => (
                <ContactItem key={index} icon={item.icon} text={item.text} link={item.link} />
              ))}
            </div>
          </div>
        </div>
        <Motion.div
          className="text-center text-ink-700 mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1, ease: 'easeInOut' }}
        >
          Relevia doesn&apos;t offer one-to-one contact. If you need help now, contact your local emergency service or a crisis line.
        </Motion.div>
      </div>
    </Motion.section>
  );
}

export default Contact;