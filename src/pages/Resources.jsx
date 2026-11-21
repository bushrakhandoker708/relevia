import { motion as Motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { staggerChildren: 0.3, duration: 0.8 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const cardVariants = {
  rest: { scale: 1, rotate: 0, backgroundColor: 'rgba(255,255,255,0.2)' },
  hover: { scale: 1.05, rotate: 1, backgroundColor: 'rgba(255,255,255,0.3)', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', transition: { duration: 0.3 } },
};

function Resources() {
  return (
    <div className="min-h-screen pt-20 pb-8 relative overflow-hidden">
      <div className="hidden" style={{ backgroundSize: '200% 200%' }}></div>
      <div className="container mx-auto p-4 sm:p-6 md:p-8 relative z-10">
        <Motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-4xl sm:text-5xl font-heading font-bold mb-8 text-neutral-800 text-center"
        >
          Resources
        </Motion.h1>

        <Motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16"
        >
          <Motion.div variants={itemVariants}>
            <Motion.div
              variants={cardVariants}
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-md border border-white/30 p-6 rounded-xl"
            >
              <h2 className="text-xl sm:text-2xl font-heading font-semibold text-primary-600 mb-2">National Institute of Mental Health</h2>
              <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">Learn more about mental health and panic attacks.</p>
              <a
                href="https://www.nimh.nih.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm sm:text-base"
              >
                Visit Site
              </a>
            </Motion.div>
          </Motion.div>
          <Motion.div variants={itemVariants}>
            <Motion.div
              variants={cardVariants}
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-md border border-white/30 p-6 rounded-xl"
            >
              <h2 className="text-xl sm:text-2xl font-heading font-semibold text-primary-600 mb-2">Crisis Hotline</h2>
              <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">Get immediate help in a crisis situation.</p>
              <a
                href="https://www.crisisline.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm sm:text-base"
              >
                Visit Site
              </a>
            </Motion.div>
          </Motion.div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transitioning={{ duration: 1 }}
          className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-md border border-white/30 p-6 sm:p-8 rounded-xl"
        >
          <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-6 text-neutral-800">
            Understanding and Overcoming Panic Attacks: A Comprehensive Guide
          </h2>
          <p className="text-neutral-600 font-body mb-8 text-sm sm:text-base">
            Panic attacks can be an overwhelming and frightening experience, but they are manageable with the right knowledge and tools. This guide explores what panic attacks are, why they happen, and how to handle them effectively—both in the moment and over the long term.
          </p>

          <div className="mb-8">
            <h3 className="text-lg sm:text-xl font-heading font-semibold text-primary-600 mb-4">Table of Contents</h3>
            <ul className="list-disc pl-6 text-neutral-600 font-body text-sm sm:text-base">
              <li><a href="#what-are-panic-attacks" className="hover:underline">What Are Panic Attacks?</a></li>
              <li><a href="#science-behind-panic-attacks" className="hover:underline">The Science Behind Panic Attacks</a></li>
              <li><a href="#traditional-advice" className="hover:underline">Why Traditional Advice Might Not Work</a></li>
              <li><a href="#new-approach" className="hover:underline">A New Approach: Accepting and Welcoming Panic</a></li>
              <li><a href="#practical-steps" className="hover:underline">Practical Steps to Manage a Panic Attack</a></li>
              <li><a href="#long-term-strategies" className="hover:underline">Long-Term Strategies for Prevention</a></li>
              <li><a href="#conclusion" className="hover:underline">Conclusion</a></li>
            </ul>
          </div>

          <Motion.section
            id="what-are-panic-attacks"
            className="mb-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}
          >
            <h3 className="text-xl sm:text-2xl font-heading font-semibold text-primary-600 mb-4">What Are Panic Attacks?</h3>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              Picture this: your heart races, your chest tightens, and you feel like you might faint—or worse, that you’re facing a life-threatening emergency like a heart attack or stroke. That’s how countless poets and writers have described a panic attack—a sudden, intense wave of fear and physical symptoms so powerful that it’s often mistaken for a medical crisis. Studies indicate that nearly one-third of people will encounter at least one panic attack in their lifetime, making it a surprisingly common experience.
            </p>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              Though panic attacks don’t cause lasting physical damage, their aftermath can be debilitating. The fear of another episode can disrupt daily life, sometimes even triggering more attacks. They differ from what some call “anxiety attacks,” which refer to overwhelming stress or anxiety with intense physical sensations that hinder functioning. Understanding this distinction is the first step to managing them, as it sheds light on why they feel so consuming.
            </p>
          </Motion.section>

          <Motion.section
            id="science-behind-panic-attacks"
            className="mb-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}
          >
            <h3 className="text-xl sm:text-2xl font-heading font-semibold text-primary-600 mb-4">The Science Behind Panic Attacks</h3>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              At their core, panic attacks are an exaggerated version of the body’s natural reaction to danger—the fight-or-flight response. This process begins in the amygdala, the brain’s fear-processing center. When it senses a threat, whether real or imagined, it signals the sympathetic nervous system to release adrenaline. This hormone ramps up your heart rate and breathing, sending blood and oxygen to your muscles and brain to prepare you for action.
            </p>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              In a panic attack, however, this response goes into overdrive. Far beyond what’s needed for a genuine threat, it leads to symptoms like a pounding heart, rapid breathing (or hyperventilation), dizziness, and numbness in the hands and feet. This happens because hyperventilation reduces carbon dioxide in the blood, leaving too much oxygen and causing blood vessels to constrict—sometimes mimicking chest pain akin to a heart attack.
            </p>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              Typically, this intense reaction peaks within 10 minutes. Then, the prefrontal cortex steps in, activating the parasympathetic nervous system to release acetylcholine, which slows the heart rate and winds down the attack. Environmental cues tied to past trauma or anxiety disorders—like PTSD, OCD, or social anxiety—can spark this response, though the exact cause remains unclear.
            </p>
          </Motion.section>

          <Motion.section
            id="traditional-advice"
            className="mb-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}
          >
            <h3 className="text-xl sm:text-2xl font-heading font-semibold text-primary-600 mb-4">Why Traditional Advice Might Not Work</h3>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              People respond differently to self-help exercises. If an exercise increases discomfort, stop and consider other support.
            </p>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              These activities are optional. They cannot determine whether symptoms are anxiety or a medical condition.
            </p>
          </Motion.section>

          <Motion.section
            id="new-approach"
            className="mb-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}
          >
            <h3 className="text-xl sm:text-2xl font-heading font-semibold text-primary-600 mb-4">A New Approach: Accepting and Welcoming Panic</h3>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              Some therapies explore how people respond to feared sensations. This page does not provide an individual exposure-treatment plan.
            </p>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              Exposure exercises should be discussed with a qualified clinician, including whether they are appropriate for your circumstances.
            </p>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              Do not deliberately provoke symptoms based on this page. Support options can be discussed with a qualified professional.
            </p>
          </Motion.section>

          <Motion.section
            id="practical-steps"
            className="mb-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}
          >
            <h3 className="text-xl sm:text-2xl font-heading font-semibold text-primary-600 mb-4">Practical Steps to Manage a Panic Attack</h3>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              When panic strikes, having a toolkit can make all the difference. Here are practical steps, reimagined from various techniques, to navigate an attack:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 font-body mb-4 text-sm sm:text-base">
              <li>Check your needs: this page cannot distinguish anxiety from a medical problem. Seek assessment for new or concerning symptoms.</li>
              <li>Let Go of the Fight: Stop battling the sensations. Allow your heart to race or your breathing to quicken without forcing them to change.</li>
              <li>Do not deliberately intensify dizziness, breathlessness or chest symptoms. Discuss exposure exercises with a qualified clinician.</li>
              <li>Ground Yourself: Focus on your senses—name five things you see, four you can touch, three you hear, two you smell, and one you taste—to anchor yourself in the present.</li>
              <li>Engage Your Body: Hold an ice cube, splash cold water on your face, or suck on a sour candy to activate your calming parasympathetic response.</li>
              <li>Use bounded self-talk: “I can pause, consider what I need and ask for help.”</li>
              <li>Challenge the Fear: Avoid catastrophic thoughts like “Everything’s awful.” Acknowledge the difficulty without labeling it as hopeless.</li>
            </ul>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              A change in symptoms when moving does not establish their cause. Do not use an exercise as a diagnostic test.
            </p>
          </Motion.section>

          <Motion.section
            id="long-term-strategies"
            className="mb-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}
          >
            <h3 className="text-xl sm:text-2xl font-heading font-semibold text-primary-600 mb-4">Long-Term Strategies for Prevention</h3>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              Managing panic in the moment is vital, but preventing future attacks requires a broader approach. Two main treatments stand out: antidepressant medication and Cognitive Behavioral Therapy (CBT). Both help about 40% of people, though they work differently. Medications can have side effects, and half of users relapse after stopping, while CBT offers lasting results with only a 20% relapse rate.
            </p>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              CBT teaches practical skills: understanding the physiology of panic, controlling breathing and muscle tension, restructuring fearful thoughts (e.g., replacing “I’ll die” with “This will pass”), and gradually facing triggering sensations or situations. Outside therapy, life management is key. This means:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 font-body mb-4 text-sm sm:text-base">
              <li>Set Boundaries: Protect your energy by saying no when needed.</li>
              <li>Balance Your Life: Manage finances, process trauma, and keep a sustainable schedule with rest.</li>
              <li>Care for Your Body: Exercise, eat regularly, cut caffeine, and get enough sleep.</li>
              <li>Practice Daily Calm: Meditate, breathe deeply, or journal to track triggers and emotions.</li>
              <li>Know Your Control: Address what you can change and let go of what you can’t.</li>
            </ul>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              Frequent attacks or constant worry about them might signal panic disorder, but these steps can reduce their grip over time.
            </p>
          </Motion.section>

          <Motion.section
            id="conclusion"
            className="mb-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}
          >
            <h3 className="text-xl sm:text-2xl font-heading font-semibold text-primary-600 mb-4">Conclusion</h3>
            <p className="text-neutral-600 font-body mb-4 text-sm sm:text-base">
              Panic attacks may feel like your body’s turned against you, but they’re a common human experience—one you can learn to handle. By understanding their mechanics and embracing rather than fearing them, you can break free from their cycle. Whether it’s your first attack or your hundredth, you’re not alone, and you’re stronger than you think. For extra support, explore therapy, online resources like the “Therapy in a Nutshell” panic attack playlist, or courses on processing emotions. Each step forward is a victory over panic’s hold on your life.
            </p>
          </Motion.section>
        </Motion.div>

        <div className="text-center mt-12 sm:mt-16">
          <h2 className="text-xl sm:text-2xl font-heading font-semibold text-neutral-800 mb-4">Need More Help?</h2>
          <p className="text-neutral-600 font-body mb-8 text-sm sm:text-base">Explore additional resources or reach out for support.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Motion.div
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(14, 165, 233, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Link
                to="/resources"
                className="bg-primary-500 text-white px-6 py-3 rounded-lg shadow-soft hover:bg-primary-600 transition duration-300 text-sm sm:text-base"
              >
                More Resources
              </Link>
            </Motion.div>
            <Motion.div
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Link
                to="/contact"
                className="bg-secondary-500 text-white px-6 py-3 rounded-lg shadow-soft hover:bg-secondary-600 transition duration-300 text-sm sm:text-base"
              >
                Contact Us
              </Link>
            </Motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Resources;