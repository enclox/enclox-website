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

const PILLARS = [
  ['local', 'Apps, their data, and usage learning stay on your node, inside your network. Nothing leaves unless you allow it.'],
  ['self-hostable', 'Run the node on your hardware or your cloud account, and the control plane too if you want everything in-house.'],
  ['completely manageable', 'Every app, user, permission, and network rule is yours to inspect and change, with an audit log and a kill switch.'],
]

// What an app can do with bucket files, without keys in its code.
const FILES = [
  ['from inside an app', 'An app reads and writes bucket files as its own role, through the node. There are no keys in its code; its policy decides which buckets and paths it may touch, and revoking the role cuts off running apps at once.'],
  ['shared by link', 'Hand someone a signed link to one file. It expires on its own, and they need no account.'],
  ['served as a website', 'Point a domain at a bucket and it serves a built site, client-side routes included.'],
]

const STATS = [
  ['~0.7s', 'microVM boot'],
  ['~4ms', 'to run a function'],
  ['1', 'microVM per app'],
]

const TRACE = [
  ['→', 'POST https://scan.acme.example/  →  invoice-scanner'],
  ['·', 'rate limit ok  ·  logged'],
  ['·', 'no warm VM for "invoice-scanner", restoring snapshot'],
  ['·', 'GET invoices/inv-0412.jpg  as role invoice-scanner'],
  ['·', 'PUT invoices/inv-0412.json'],
  ['←', '200 OK  Acme Supplies · $1,240.00'],
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

// Planned: nodes with roles behind a gateway. Boxes are [x, y, label, detail] in an 880×420 viewBox.
const CLUSTER = {
  client: [10, 200, 'requests', 'users, apps, scripts'],
  gateway: [205, 200, 'gateway', 'routes by request'],
  pool: [410, 110, 'warm pool', 'fast starts'],
  tracker: [610, 40, 'weekly-tracker', 'own microVM'],
  bot: [610, 110, 'support-bot', 'own microVM'],
  scanner: [610, 180, 'invoice-scanner', 'own microVM'],
  buckets: [420, 330, 'buckets', 'invoices, reports'],
  models: [690, 330, 'models', 'ocr-small, chat'],
}
// One invoice-scanner request through the nodes, then a direct download.
const CLUSTER_FLOW = [
  ['client', 'POST scan.acme.example: finance uploads an invoice to invoice-scanner.'],
  ['gateway', 'The gateway sees an app request and routes it to an app node.'],
  ['pool', 'invoice-scanner has a warm microVM there, or one restores from its snapshot.'],
  ['scanner', 'The request runs in invoice-scanner’s own microVM. Other apps can’t see into it.'],
  ['buckets', 'It fetches inv-0412.jpg from the invoices bucket on a storage node, as its own role.'],
  ['scanner', 'The scan comes back to the app.'],
  ['models', 'It sends the scan to ocr-small on an inference node, where the model stays loaded on a GPU,'],
  ['scanner', 'and gets back the vendor, date and total.'],
  ['buckets', 'It saves inv-0412.json next to the scan.'],
  ['client', '200 OK: Acme Supplies, 2026-10-12, $1,240.00.'],
  ['client', 'Next, someone downloads last quarter’s report.'],
  ['gateway', 'It is a file transfer, so the gateway skips the app node'],
  ['buckets', 'and streams reports/2026-q3.pdf from the storage node.'],
]
// [from, to, ...corners]: right-angled lines that run through the gaps between boxes, so none cross.
const CLUSTER_EDGES = [
  ['client', 'gateway'],
  ['gateway', 'pool', [380, 222], [380, 132]],
  ['gateway', 'buckets', [280, 352]],
  ['gateway', 'models', [280, 410], [765, 410]],
  ['pool', 'tracker', [585, 132], [585, 62]],
  ['pool', 'bot'],
  ['pool', 'scanner', [585, 132], [585, 202]],
  ['scanner', 'buckets', [685, 270], [495, 270]],
  ['scanner', 'models', [800, 202], [800, 352]],
]

// An SVG of 150×44 boxes ({id: [x, y, label, detail]}) and the lines between them, which highlights
// each box of `flow` ([box id, caption]) in turn with its caption. `children` draws behind the boxes.
function Diagram({ nodes, flow, edges, height, label, children }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => setStep(s => (s + 1) % flow.length), 1900)
    return () => clearTimeout(t)
  }, [step, flow.length])
  const center = (id) => [nodes[id][0] + 75, nodes[id][1] + 22]
  const [node, caption] = flow[step]
  return (
    <figure className="diagram">
      <div className="diagram-scroll">
        <svg viewBox={`0 0 880 ${height}`} role="img" aria-label={label}>
          {children}
          {edges.map(([a, b, ...corners]) => (
            <polyline key={a + b} className="edge" points={[center(a), ...corners, center(b)].join(' ')} />
          ))}
          {Object.entries(nodes).map(([id, [x, y, text, detail]]) => (
            <g key={id} className={id === node ? 'node on' : 'node'}>
              <rect x={x} y={y} width="150" height="44" />
              <text className="node-label" x={x + 12} y={y + 19}>{text}</text>
              <text className="node-detail" x={x + 12} y={y + 35}>{detail}</text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption><span className="idx">{String(step + 1).padStart(2, '0')}</span>{caption}</figcaption>
    </figure>
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
      <div className="term-bar"><span>node</span><span>https</span></div>
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

        <Section n={3} title="yours to run" lede="Local, self-hostable, and completely manageable.">
          <ul className="grid">
            {PILLARS.map(([name, text]) => (
              <li key={name}>
                <h3>{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section n={4} title="how it works" lede="By default we run the control plane and you run the compute. Or run all of it yourself.">
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
          <h3 className="sub">many nodes</h3>
          <p className="note sub-lede">
            Add nodes as you grow, each with a role: apps, storage, or inference. Every app runs in its own microVM on an
            app node, and reaches buckets and models by making a request, as its own role. A gateway routes each request
            by what it needs. Today one node runs apps and buckets.
          </p>
          <Diagram nodes={CLUSTER} flow={CLUSTER_FLOW} edges={CLUSTER_EDGES} height={430}
            label="Planned: an invoice-scanner request reaches the gateway, runs in invoice-scanner's own microVM on an app node, reads the scan from a bucket on a storage node, asks an OCR model on an inference node, saves the result and responds. A file download goes from the gateway straight to the storage node.">
            <rect className="frame-box" x="395" y="14" width="480" height="236" />
            <text className="frame-label" x="405" y="32">app node</text>
            {[40, 110, 180].map(y => <rect key={y} className="frame-box vm" x="602" y={y - 8} width="166" height="60" />)}
            <rect className="frame-box" x="395" y="290" width="250" height="110" />
            <text className="frame-label" x="405" y="308">storage node</text>
            <rect className="frame-box" x="665" y="290" width="210" height="110" />
            <text className="frame-label" x="675" y="308">inference node</text>
          </Diagram>
        </Section>

        <Section n={5} title="the node" lede="Every app is sealed in its own Firecracker microVM, with its own user, a memory cap, and no network.">
          <ul className="stats">
            {STATS.map(([value, label]) => (
              <li key={label}><b>{value}</b><span>{label}</span></li>
            ))}
          </ul>
          <Trace />
          <h3 className="sub">files from buckets</h3>
          <ul className="grid">
            {FILES.map(([name, text]) => (
              <li key={name}>
                <h3>{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section n={6} title="where this goes" lede="From a place to run AI-built apps to a layer that learns what a company needs.">
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
