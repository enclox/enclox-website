import { useEffect, useState } from 'react'

const REPO = 'https://github.com/enclox/self-host-AWS'

// ANSI Shadow lettering. Full blocks are lit; the box-drawing shadow stays dim.
const LOGO = [
  '███████╗███╗   ██╗ ██████╗██╗      ██████╗ ██╗  ██╗',
  '██╔════╝████╗  ██║██╔════╝██║     ██╔═══██╗╚██╗██╔╝',
  '█████╗  ██╔██╗ ██║██║     ██║     ██║   ██║ ╚███╔╝ ',
  '██╔══╝  ██║╚██╗██║██║     ██║     ██║   ██║ ██╔██╗ ',
  '███████╗██║ ╚████║╚██████╗███████╗╚██████╔╝██╔╝ ██╗',
  '╚══════╝╚═╝  ╚═══╝ ╚═════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝',
]

const PROBLEMS = [
  ['Teams don’t know what to build', 'Time sinks are visible only to the people living them. Nobody reads the pattern across the team.'],
  ['Tools stall at sharing', 'A builder’s tool lives on a laptop or a personal account. Colleagues can’t open it safely, and IT can’t see it.'],
  ['Nobody learns what worked', 'Tools get abandoned with no record of whether they helped, so the next one is built blind.'],
]

// [step, text, status]
const LOOP = [
  ['see', 'Learns where a team’s time goes, from usage metadata the company chooses to share.', 'designed'],
  ['build', 'An agent builds the tool, and one command deploys it.', 'runtime built'],
  ['share', 'Deploys inside the company’s network behind its login, and shares with the people who need it most.', 'next'],
  ['learn', 'Reads usage and feedback to judge whether the tool helped, then shares it wider or retires it.', 'designed'],
]

const WE_HOST = [
  'Login with Google or Microsoft',
  'App directory and sharing',
  'Relay for access from anywhere',
  'Audit log and kill switch',
  'Signed updates and patches',
  'Recommendations from usage metadata only',
]

const YOU_HOST = [
  'A node on your hardware or cloud account',
  'Each app in its own microVM',
  'No network by default, with an approved list',
  'Each app’s data on your node',
  'Usage learning runs on your node by default',
]

const STATS = [
  ['~0.7s', 'microVM boot'],
  ['~4ms', 'to run a function'],
  ['1', 'microVM per app'],
]

const TRACE = [
  ['→', 'GET /fn/7f3a…/  (Function URL, AuthType NONE)'],
  ['·', 'rate_limit ok  ·  access_log'],
  ['·', 'pool: no warm vm for "weekly-tracker", restoring snapshot'],
  ['·', 'jailer → firecracker  ·  agent ready on vsock:1000'],
  ['·', 'POST /invoke  →  /var/task/bootstrap'],
  ['←', '200 OK  x-enclox-requestid: 4c1e…'],
]

const STAGES = [
  ['run', 'Deploy, share, and govern apps built with any agent.'],
  ['learn', 'With consent, usage metadata shows where teams lose time and which tools earn their keep.'],
  ['build', 'Enclox proposes the next tool, has an agent build it, and shares it with the people who need it.'],
  ['agents', 'Scheduled agents run in the same isolated place, with scoped credentials and an audit trail.'],
]

function Logo() {
  return (
    <pre className="logo" aria-label="Enclox">
      {LOGO.map((row, i) => (
        <span key={i}>
          {row.split(/(█+)/).map((run, j) => (run[0] === '█' ? <b key={j}>{run}</b> : run))}
          {'\n'}
        </span>
      ))}
    </pre>
  )
}

function Trace() {
  // Reveal one line at a time, then hold and loop.
  const [n, setN] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setN(TRACE.length)
    const t = setTimeout(() => setN(n => (n > TRACE.length + 4 ? 0 : n + 1)), 520)
    return () => clearTimeout(t)
  }, [n])
  return (
    <div className="term">
      <div className="term-bar"><span>node</span><span>public listener · :443</span></div>
      <ol>
        {TRACE.map(([mark, text], i) => (
          <li key={i} className={i < n ? 'on' : ''}>
            <span className="mark">{mark}</span>{text}
          </li>
        ))}
        <li className="on"><span className="cursor" /></li>
      </ol>
    </div>
  )
}

function Section({ n, title, lede, children }) {
  return (
    <section>
      <h2><span>{String(n).padStart(2, '0')}</span>{title}</h2>
      {lede && <p className="lede">{lede}</p>}
      {children}
    </section>
  )
}

export default function App() {
  return (
    <>
      <header className="nav">
        <a className="brand" href="./">[enclox]</a>
        <nav>
          <a href="#how">how it works</a>
          <a href={REPO}>github</a>
        </nav>
      </header>

      <main>
        <div className="hero">
          <div className="frame"><Logo /></div>
          <p className="tagline">A SELF-LEARNING LAYER FOR COMPANY SOFTWARE</p>
          <p className="copy">
            Enclox learns where a team loses time, has an agent build the tool, deploys it behind the company login
            inside the company’s own network, and learns whether it helped.
          </p>
          <div className="line prompt"><code>deploy ./weekly-tracker</code></div>
        </div>

        <Section n={1} title="the problem" lede="Building a tool takes an hour. Knowing what to build, and whether it worked, still takes guesswork.">
          <ul className="grid">
            {PROBLEMS.map(([title, text]) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section n={2} title="the loop" lede="See where time goes, build the tool, share it, and learn whether it helped.">
          <ol className="grid loop four">
            {LOOP.map(([step, text, status], i) => (
              <li key={step}>
                <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                <h3>{step}</h3>
                <p>{text}</p>
                <span className="tag">{status}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section n={3} title="how it works" lede="We run the control plane. You run the compute.">
          <div className="split" id="how">
            <div>
              <h3>we host</h3>
              <ul className="ticks">{WE_HOST.map(t => <li key={t}>{t}</li>)}</ul>
            </div>
            <div>
              <h3>you host</h3>
              <ul className="ticks">{YOU_HOST.map(t => <li key={t}>{t}</li>)}</ul>
            </div>
          </div>
          <p className="note">
            We see metadata only: who deployed, who opened what, and when. Early pilots run on a node we host and move
            in-house later.
          </p>
        </Section>

        <Section n={4} title="the node" lede="Every app is sealed in its own Firecracker microVM, with its own user, a memory cap, and no network.">
          <ul className="stats">
            {STATS.map(([value, label]) => (
              <li key={label}><b>{value}</b><span>{label}</span></li>
            ))}
          </ul>
          <Trace />
        </Section>

        <Section n={5} title="where this goes" lede="From a place to run AI-built apps to a layer that learns what a company needs.">
          <ol className="grid loop four">
            {STAGES.map(([stage, text], i) => (
              <li key={stage}>
                <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                <h3>{stage}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          <p className="note">Each stage starts only when customers ask for it.</p>
        </Section>

        <p className="status">
          <span className="dot" /> Early pilots. The runtime works today; login, sharing and the directory are next.
        </p>
      </main>

      <footer>
        <span>enclox</span>
        <a href={REPO}>source</a>
      </footer>
    </>
  )
}
