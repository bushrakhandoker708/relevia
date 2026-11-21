// Medication: general information to take to a doctor, with sources. Rewritten on
// 21 November 2026 after an accuracy review. The earlier page quoted a psychiatrist who
// could not be identified (removed), called a US treatment-referral line "emergency
// support", listed a Bangladeshi number that did not match the service's own site, and
// said medicines "balance brain chemicals". Contacts and claims below were checked against
// the linked sources on that date. This page has not been reviewed by a clinician.

const SOURCES = {
  nhs: { name: 'NHS: Panic disorder', href: 'https://www.nhs.uk/mental-health/conditions/panic-disorder/' },
  nimh: { name: 'NIMH: Panic disorder, what you need to know', href: 'https://www.nimh.nih.gov/health/publications/panic-disorder-when-fear-overwhelms' },
  mayo: { name: 'Mayo Clinic: Panic attacks and panic disorder, treatment', href: 'https://www.mayoclinic.org/diseases-conditions/panic-attacks/diagnosis-treatment/drc-20376027' },
};

const classes = [
  {
    name: 'SSRIs (selective serotonin reuptake inhibitors)',
    examples: 'Sertraline, fluoxetine, paroxetine',
    notes: 'Usually the first medicine offered. The NHS says antidepressants can take 2 to 4 weeks to start working and up to 8 weeks to work fully.',
  },
  {
    name: 'SNRIs (serotonin and noradrenaline reuptake inhibitors)',
    examples: 'Venlafaxine',
    notes: 'An alternative to SSRIs. Also takes several weeks to work.',
  },
  {
    name: 'Tricyclic antidepressants',
    examples: 'Imipramine, clomipramine',
    notes: 'The NHS lists these for when SSRIs are not suitable. They tend to have more side effects.',
  },
  {
    name: 'Benzodiazepines',
    examples: 'Clonazepam, alprazolam',
    notes: 'Can reduce panic symptoms quickly, but tolerance and dependence can develop, so NIMH says they may be prescribed only for brief periods. The NHS mentions clonazepam only for severe anxiety.',
  },
  {
    name: 'Other medicines',
    examples: 'Pregabalin; sometimes beta-blockers',
    notes: 'The NHS mentions pregabalin as an option. NIMH notes that beta-blockers are not commonly prescribed for panic disorder.',
  },
];

function Medication() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-32 pt-24 sm:px-6">
      <header className="max-w-2xl">
        <p className="margin-note text-2xl">To talk through with a doctor</p>
        <h1 className="mt-1 text-4xl font-bold text-ink-900 sm:text-5xl">Medication for panic disorder</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-700">
          Talking therapies, usually cognitive behavioural therapy (CBT), and medicine are the main treatments for panic
          disorder. Some people use one, some both. This page is general information to help you ask questions. It is not
          medical advice, and it has not been reviewed by a clinician.
        </p>
        <p className="mt-4">
          <a href="#urgent-help" className="font-bold text-red-800 underline underline-offset-4">If you need help now</a>
        </p>
      </header>

      <section className="mt-12" aria-labelledby="types">
        <h2 id="types" className="text-2xl font-bold text-ink-900">Medicines that may be offered</h2>
        <p className="mt-2 leading-relaxed text-ink-700">
          Which medicine is right, if any, depends on the person, their health and other medicines they take. Names and
          approvals differ between countries.
        </p>
        <dl className="mt-6 border-t border-ink-900/10">
          {classes.map((c) => (
            <div key={c.name} className="border-b border-ink-900/10 py-5">
              <dt className="text-lg font-bold text-ink-900">{c.name}</dt>
              <dd className="mt-1 text-ink-800"><span className="font-bold">Examples:</span> {c.examples}</dd>
              <dd className="mt-1 leading-relaxed text-ink-700">{c.notes}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12" aria-labelledby="before">
        <h2 id="before" className="text-2xl font-bold text-ink-900">Things to know</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed text-ink-700">
          <li>Do not start, stop or change a medicine without talking to the person who prescribes it. Stopping some medicines suddenly can cause withdrawal effects.</li>
          <li>Tell your doctor or pharmacist about other medicines, supplements and alcohol use.</li>
          <li>If side effects worry you, or you feel worse, contact your doctor or pharmacist.</li>
          <li>How medicines work in panic disorder is not fully understood; the idea that they &ldquo;rebalance brain chemicals&rdquo; is an oversimplification.</li>
        </ul>
      </section>

      <section className="paper-sheet mt-12 border-l-4 border-red-700 p-6" id="urgent-help" aria-labelledby="urgent-title">
        <h2 id="urgent-title" className="text-2xl font-bold text-ink-900">If you need help now</h2>
        <h3 className="mt-4 text-lg font-bold text-ink-900">Emergency: someone is in danger now</h3>
        <p className="mt-1 leading-relaxed text-ink-800">
          Call your local emergency number: <strong>999</strong> in the UK and in Bangladesh, <strong>112</strong> in the EU,{' '}
          <strong>911</strong> in the US and Canada. Or go to the nearest emergency department.
        </p>
        <h3 className="mt-5 text-lg font-bold text-ink-900">Crisis lines: to talk to someone now</h3>
        <ul className="mt-1 list-disc space-y-1 pl-6 leading-relaxed text-ink-800">
          <li><strong>UK and Ireland:</strong> Samaritans, call <a className="underline" href="tel:116123">116 123</a>, free, 24 hours a day.</li>
          <li><strong>US:</strong> 988 Suicide &amp; Crisis Lifeline, call or text <a className="underline" href="tel:988">988</a>, 24 hours a day.</li>
        </ul>
        <h3 className="mt-5 text-lg font-bold text-ink-900">Not urgent: Bangladesh</h3>
        <ul className="mt-1 list-disc space-y-1 pl-6 leading-relaxed text-ink-800">
          <li>
            <strong>National Institute of Mental Health (NIMH), Bangladesh</strong>, Sher-e-Bangla Nagar, Dhaka. A public hospital, not a
            helpline: <a className="underline" href="tel:+880223374409">+880 2-223374409</a>,{' '}
            <a className="underline" href="https://nimh.gov.bd/" target="_blank" rel="noopener noreferrer">nimh.gov.bd</a>.
          </li>
          <li>
            <strong>Moner Bondhu</strong>, a paid counselling service (online and in person):{' '}
            <a className="underline" href="https://monerbondhu.com/" target="_blank" rel="noopener noreferrer">monerbondhu.com</a>.
          </li>
        </ul>
        <p className="mt-4 text-sm text-ink-700">Contacts checked against each service&apos;s own website on 21 November 2026. Numbers change; check before relying on one.</p>
      </section>

      <section className="mt-12" aria-labelledby="sources">
        <h2 id="sources" className="text-2xl font-bold text-ink-900">Sources</h2>
        <ul className="mt-3 space-y-2">
          {Object.values(SOURCES).map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="font-bold text-ink-900 underline underline-offset-4">{s.name}</a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default Medication;
