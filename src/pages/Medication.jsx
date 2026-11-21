import { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

function Medication() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' },
    }),
  };

  const listItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: i * 0.2, ease: 'easeOut' },
    }),
  };

  return (
    <div className="min-h-screen pt-20 pb-24 font-body">
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <Motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-ink-900 mb-4 md:mb-0"
          >
            Medication for Panic Attacks
          </Motion.h1>
          <Motion.button
            onClick={() => document.getElementById('emergency-support').scrollIntoView({ behavior: 'smooth' })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-outline !border-red-700 !text-red-800"
          >
            Need immediate help?
          </Motion.button>
        </div>

        <Motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg leading-relaxed text-ink-700 mb-8 max-w-2xl"
        >
          If you're experiencing panic attacks, know that you're not alone. Medications can play a crucial role in reducing the frequency and intensity of your symptoms, helping you regain control and improve your quality of life. Always work with a healthcare professional to find the treatment plan that’s right for you.
        </Motion.p>

        <Motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold text-ink-900 mb-4">Types of Medications</h2>
          <div className="overflow-x-auto">
            <table className="paper-sheet w-full text-left border-collapse overflow-hidden">
              <thead>
                <tr className="border-b-2 border-ink-900 text-ink-900">
                  <th className="p-3 font-semibold">Class</th>
                  <th className="p-3 font-semibold">Examples</th>
                  <th className="p-3 font-semibold">FDA Approved</th>
                  <th className="p-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                  {[
                    {
                      class: 'SSRIs',
                      examples: 'Fluoxetine (Prozac), Sertraline (Zoloft), Paroxetine (Paxil)',
                      fda: 'Yes',
                      notes: 'First choice; takes 4-6 weeks; side effects may include nausea, insomnia',
                    },
                    {
                      class: 'SNRIs',
                      examples: 'Venlafaxine (Effexor XR)',
                      fda: 'Yes',
                      notes: 'May cause dizziness, increased blood pressure',
                    },
                    {
                      class: 'Benzodiazepines',
                      examples: 'Alprazolam (Xanax), Clonazepam (Klonopin)',
                      fda: 'Yes',
                      notes: 'Rapid relief; risk of dependency with long-term use',
                    },
                    {
                      class: 'Other Antidepressants',
                      examples: 'Imipramine (Tofranil), Phenelzine (Nardil)',
                      fda: 'No',
                      notes: 'Less common; more side effects',
                    },
                  ].map((med, index) => (
                    <Motion.tr
                      key={index}
                      custom={index}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={rowVariants}
                      className={'border-b border-rule align-top'}
                    >
                      <td className="p-3">{med.class}</td>
                      <td className="p-3">{med.examples}</td>
                      <td className="p-3">{med.fda}</td>
                      <td className="p-3">{med.notes}</td>
                    </Motion.tr>
                  ))}
                </tbody>
            </table>
          </div>
        </Motion.div>

        <Motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold text-ink-900 mb-4">How Medications Help</h2>
          <p className="text-ink-700 max-w-3xl mx-auto md:mx-0">
            Medications balance brain chemicals to help manage panic attacks. SSRIs and SNRIs boost serotonin and norepinephrine levels to stabilize mood and reduce anxiety over time. Benzodiazepines enhance GABA, a calming neurotransmitter, providing immediate relief during acute episodes.
          </p>
        </Motion.div>

        <Motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold text-ink-900 mb-4">Important Considerations</h2>
          <ul className="list-disc list-inside text-ink-700 space-y-2 max-w-3xl mx-auto md:mx-0">
            {[
              '<strong>Side Effects:</strong> Common with all medications—discuss with your doctor to weigh benefits and risks.',
              '<strong>Time to Effectiveness:</strong> Antidepressants may take 4-6 weeks; benzodiazepines work almost instantly.',
              '<strong>Therapy Boost:</strong> Combining medication with therapy, like CBT, often improves outcomes.',
              '<strong>Follow Medical Advice:</strong> Never start or stop medication without consulting your healthcare provider.',
            ].map((item, index) => (
              <Motion.li
                key={index}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={listItemVariants}
                dangerouslySetInnerHTML={{ __html: item }}
              />
            ))}
          </ul>
        </Motion.div>

        <Motion.div
          id="emergency-support"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="mt-10 paper-sheet border-l-4 border-red-700 p-6"
        >
          <h2 className="text-2xl font-bold text-ink-900 mb-2">Emergency Support</h2>
          <p className="text-ink-800 mb-4">
            If you're having a severe panic attack or thoughts of self-harm, reach out immediately. Call the <strong>SAMHSA National Helpline</strong> at <strong>1-800-662-4357</strong> (24/7 support) or seek emergency medical attention if symptoms feel unmanageable.
          </p>
          <h3 className="text-xl font-bold text-ink-900 mb-2">Emergency Support (Bangladesh)</h3>
          <ul className="list-disc list-inside text-ink-800 space-y-2">
            <li>
              <strong>National Institute of Mental Health (NIMH)</strong> – Sher‑E‑Bangla Nagar, Dhaka‑1207;{' '}
              <strong>Phone:</strong> +8802‑223374409;{' '}
              <a href="http://nimh.gov.bd" target="_blank" rel="noopener noreferrer" className="underline hover:text-secondary-600">
                nimh.gov.bd
              </a>
            </li>
            <li>
              <strong>Psychological Health & Wellness Clinic (PHWC)</strong> – 1st Fl., House 4D, Road 73, Gulshan 2, Dhaka;{' '}
              <strong>Phone:</strong> +88017‑777‑2763;{' '}
              <a href="https://phwcbd.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-secondary-600">
                phwcbd.org
              </a>
            </li>
            <li>
              <strong>Moner Bondhu</strong> (24/7 counselling & crisis helpline):{' '}
              <strong>Phone:</strong> +88017‑7953‑3333;{' '}
              <a href="https://monerbondhu.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-secondary-600">
                monerbondhu.org
              </a>
            </li>
          </ul>
        </Motion.div>

        <Motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="mt-8"
        >
          <Motion.button
            onClick={() => setIsModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-ink"
          >
            Learn More About Medication
          </Motion.button>
        </Motion.div>

        <Motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold text-ink-900 mb-4">Additional Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto md:mx-0">
            {[
              { name: 'Mayo Clinic', url: 'https://www.mayoclinic.org/diseases-conditions/panic-attacks/diagnosis-treatment/drc-20376027' },
              { name: 'Verywell Mind', url: 'https://www.verywellmind.com/medications-for-panic-disorder-2584307' },
              { name: 'AAFP', url: 'https://www.aafp.org/pubs/afp/afp-community-blog/entry/what-are-the-best-medications-for-panic-disorder.html' },
              { name: 'WebMD', url: 'https://www.webmd.com/anxiety-panic/understanding-panic-attack-treatment' },
            ].map((resource, index) => (
              <Motion.a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-outline justify-center"
              >
                {resource.name}
              </Motion.a>
            ))}
          </div>
        </Motion.div>

        <Motion.div
          animate={{
            boxShadow: [
              '0 0 10px rgba(0,0,0,0.1)',
              '0 0 20px rgba(0,0,0,0.2)',
              '0 0 10px rgba(0,0,0,0.1)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mt-12 paper-sheet p-6"
        >
          <h2 className="text-2xl font-bold text-ink-900 mb-4">Expert Insight</h2>
          <blockquote className="text-ink-700 italic">
            "Medications can be valuable in managing panic attacks when combined with therapy." - Dr. Jane Smith, Psychiatrist
          </blockquote>
        </Motion.div>
      </div>

      {showBackToTop && (
        <Motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-20 right-4 z-30 paper-sheet border-2 border-ink-900 px-3 py-2 font-bold text-ink-900"
          aria-label="Back to top"
        >
          ↑
        </Motion.button>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <Motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <Motion.div
              className="paper-sheet p-4 md:p-8 max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-ink-900 mb-4">More About Medication</h2>
              <p className="text-ink-700 mb-4">
                Here’s detailed information about medications commonly used for panic attacks. Each class has unique benefits and considerations to discuss with your doctor.
              </p>

              <h3 className="text-xl font-bold text-ink-900 mb-2">SSRIs</h3>
              <ul className="list-disc list-inside text-ink-700 mb-4">
                <li><strong>How They Work:</strong> Increase serotonin to stabilize mood.</li>
                <li><strong>Examples:</strong> Fluoxetine, Sertraline, Paroxetine.</li>
                <li><strong>Side Effects:</strong> Nausea, insomnia, sexual dysfunction.</li>
                <li><strong>Special Notes:</strong> Takes 4-6 weeks; often first choice due to safety.</li>
              </ul>

              <h3 className="text-xl font-bold text-ink-900 mb-2">SNRIs</h3>
              <ul className="list-disc list-inside text-ink-700 mb-4">
                <li><strong>How They Work:</strong> Boost serotonin and norepinephrine.</li>
                <li><strong>Examples:</strong> Venlafaxine.</li>
                <li><strong>Side Effects:</strong> Dizziness, increased blood pressure.</li>
                <li><strong>Special Notes:</strong> Similar onset to SSRIs; monitor blood pressure.</li>
              </ul>

              <h3 className="text-xl font-bold text-ink-900 mb-2">Benzodiazepines</h3>
              <ul className="list-disc list-inside text-ink-700 mb-4">
                <li><strong>How They Work:</strong> Enhance GABA for rapid calming.</li>
                <li><strong>Examples:</strong> Alprazolam, Clonazepam.</li>
                <li><strong>Side Effects:</strong> Drowsiness, dependence risk.</li>
                <li><strong>Special Notes:</strong> Short-term use; not for those with substance abuse history.</li>
              </ul>

              <h3 className="text-xl font-bold text-ink-900 mb-2">Other Antidepressants</h3>
              <ul className="list-disc list-inside text-ink-700 mb-4">
                <li><strong>How They Work:</strong> Varies (e.g., TCAs block reuptake; MAOIs affect multiple neurotransmitters).</li>
                <li><strong>Examples:</strong> Imipramine (TCA), Phenelzine (MAOI).</li>
                <li><strong>Side Effects:</strong> Dry mouth, dietary restrictions (MAOIs).</li>
                <li><strong>Special Notes:</strong> Less common; used if others fail.</li>
              </ul>

              <h3 className="text-xl font-bold text-ink-900 mb-2">Emergency Contacts</h3>
              <p className="text-ink-700">
                For immediate help, call the <strong>SAMHSA National Helpline</strong> at <strong>1-800-662-4357</strong> or seek emergency care if you’re in crisis.
              </p>

              <Motion.button
                onClick={() => setIsModalOpen(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-6 btn-ink"
              >
                Close
              </Motion.button>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Medication;