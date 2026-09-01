import { useRef, useEffect } from 'react';
import { gsap } from './gsapSetup';

const PROBLEMS = [
  {
    no: '01',
    title: 'Finding the right people',
    desc: 'There are a billion stories in India — but meeting people who actually share your interests, your language, your world, still takes luck.',
  },
  {
    no: '02',
    title: 'Discovering useful opportunities',
    desc: 'The right opportunity — a study partner, a collaborator, a local community — exists, but it is buried under noise and never finds you.',
  },
  {
    no: '03',
    title: 'Navigating a huge and diverse India',
    desc: "Across 28 states and dozens of languages, genuine connection should feel close. Today it still feels fragmented and far away.",
  },
];

export default function ProblemSection() {
  const rootRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      // Big statement: word-by-word reveal
      gsap.fromTo(
        '.bb-problem__word',
        { opacity: 0.14, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.045,
          scrollTrigger: { trigger: '.bb-problem__statement', start: 'top 78%', once: true },
        }
      );

      // Sequential problem cards — each drives itself on scroll
      gsap.utils.toArray('.bb-problem__item').forEach((item) => {
        gsap.timeline({
          scrollTrigger: { trigger: item, start: 'top 82%', once: true },
        })
          .fromTo(item.querySelector('.bb-problem__no'), { opacity: 0, x: -34 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' })
          .fromTo(item.querySelector('.bb-problem__title'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.45')
          .fromTo(item.querySelector('.bb-problem__desc'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.35')
          .fromTo(item.querySelector('.bb-problem__line'), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0);
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const statement = "India is connected. But finding the right connection isn't always easy.";

  return (
    <section className="bb-problem" id="problem" ref={rootRef}>
      <div className="bb-problem__bg" aria-hidden="true" />

      <p className="bb-problem__statement">
        {statement.split(' ').map((w, i) => (
          <span className="bb-problem__word" key={i}>
            {w}&nbsp;
          </span>
        ))}
      </p>

      <p className="bb-problem__lede">So we built BharatBuddy around three honest problems.</p>

      <ol className="bb-problem__list">
        {PROBLEMS.map((p) => (
          <li className="bb-problem__item" key={p.no}>
            <span className="bb-problem__no">{p.no}</span>
            <div className="bb-problem__body">
              <h3 className="bb-problem__title">{p.title}</h3>
              <p className="bb-problem__desc">{p.desc}</p>
            </div>
            <span className="bb-problem__line" aria-hidden="true" />
          </li>
        ))}
      </ol>
    </section>
  );
}
