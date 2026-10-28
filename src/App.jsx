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

const INSTALL = 'curl -fsSL https://enclox.com/install.sh | sh'

const PILLARS = [
  ['local', 'Apps, their data, and usage learning stay on your node, inside your network. Nothing leaves unless you allow it.'],
  ['self-hostable', 'Run the node on your hardware or your cloud account, and the control plane too if you want everything in-house.'],
  ['completely manageable', 'Every app, user, permission, and network rule is yours to inspect and change, with an audit log and a kill switch.'],
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

function Install() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(INSTALL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }
  return (
    <div className="line">
      <code>{INSTALL}</code>
      <button className="ghost" onClick={copy}>{copied ? 'copied' : 'copy'}</button>
    </div>
  )
}

// Inside one node, after the big-picture diagram in self-host-AWS docs/code-flow.md.
// Boxes are [x, y, label, detail] in a 880×430 viewBox, each 150×44.
const NODES = {
  web: [10, 50, 'browser / curl', 'via your TLS proxy'],
  cli: [10, 170, 'enclox-api', 'signed requests'],
  pub: [205, 50, 'public listener', 'access log'],
  rate: [375, 50, 'rate limit', 'per client IP'],
  url: [545, 50, 'Function URL', 'or custom domain'],
  store: [715, 50, 'SQLite + blobs', 'in DATA_DIR'],
  admin: [205, 170, 'admin listener', '127.0.0.1:4566'],
  auth: [375, 170, 'SigV4 + IAM', 'policy per action'],
  svc: [545, 170, 'services', 'APIs + state KV'],
  pool: [715, 170, 'warm pool', 'snapshot clones'],
  boot: [375, 350, 'bootstrap', 'your function'],
  rt: [545, 350, 'Runtime API', '127.0.0.1:9001'],
  agent: [715, 350, 'agent · PID 1', 'vsock 1000 / 1001'],
}
const center = (id) => [NODES[id][0] + 75, NODES[id][1] + 22]

// [node, caption]: one Function URL request into a microVM and back, then one signed admin call.
const FLOW = [
  ['web', 'A request arrives on a Function URL from the internet.'],
  ['pub', 'The public listener logs it,'],
  ['rate', 'and rate-limits each client IP.'],
  ['url', 'The URL names a function, which takes a concurrency slot.'],
  ['pool', 'The pool lends a warm microVM, or restores one from its post-init snapshot.'],
  ['agent', 'Over vsock port 1000, the host asks the agent, PID 1 in the VM, to invoke.'],
  ['rt', 'The agent queues the event on the Lambda Runtime API,'],
  ['boot', 'and your bootstrap picks it up. The VM has no network device.'],
  ['agent', 'To read its state, the function goes back through the agent, out on vsock port 1001,'],
  ['svc', 'to a socket only this VM can open: identity comes from the transport, never the payload.'],
  ['store', 'Its keys, like everything else, live in SQLite on your disk.'],
  ['web', 'The response goes back out the way it came.'],
  ['cli', 'An admin call, signed with an access key.'],
  ['admin', 'The admin listener is on 127.0.0.1 unless you choose otherwise.'],
  ['auth', 'SigV4 names the caller; IAM policies allow or deny each action.'],
  ['svc', 'IAM, Buckets or Lambda handles it,'],
  ['store', 'and writes to the same SQLite and blob files.'],
]
// Lines between the boxes the flow passes through.
const EDGES = [['web', 'pub'], ['pub', 'rate'], ['rate', 'url'], ['url', 'pool'], ['pool', 'agent'], ['agent', 'rt'], ['rt', 'boot'],
  ['agent', 'svc'], ['svc', 'store'], ['cli', 'admin'], ['admin', 'auth'], ['auth', 'svc']]

function NodeDiagram() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => setStep(s => (s + 1) % FLOW.length), 1900)
    return () => clearTimeout(t)
  }, [step])
  const [node, caption] = FLOW[step]
  const [dx, dy] = center(node)
  return (
    <figure className="diagram">
      <div className="diagram-scroll">
        <svg viewBox="0 0 880 430" role="img"
          aria-label="Inside a node: requests reach a public or an admin listener, pass rate limiting or SigV4 and IAM checks, and reach the services and storage. Functions run in microVMs from a warm pool; the host talks to the agent inside each VM over vsock, and the agent hands events to your bootstrap.">
          <rect className="frame-box" x="190" y="20" width="685" height="230" />
          <text className="frame-label" x="200" y="38">host · one enclox process</text>
          <rect className="frame-box" x="360" y="320" width="515" height="100" />
          <text className="frame-label" x="370" y="338">microVM · Firecracker + jailer, one per app</text>
          {EDGES.map(([a, b]) => {
            const [x1, y1] = center(a), [x2, y2] = center(b)
            return <line key={a + b} className="edge" x1={x1} y1={y1} x2={x2} y2={y2} />
          })}
          <text className="edge-label" x="800" y="285">vsock 1000 ↓</text>
          <text className="edge-label" x="625" y="285">vsock 1001 ↑</text>
          {Object.entries(NODES).map(([id, [x, y, label, detail]]) => (
            <g key={id} className={id === node ? 'node on' : 'node'}>
              <rect x={x} y={y} width="150" height="44" />
              <text className="node-label" x={x + 12} y={y + 19}>{label}</text>
              <text className="node-detail" x={x + 12} y={y + 35}>{detail}</text>
            </g>
          ))}
          <circle className="packet" r="6" style={{ transform: `translate(${dx}px, ${dy}px)` }} />
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
          <Install />
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
          <h3 className="sub">inside a node</h3>
          <NodeDiagram />
        </Section>

        <Section n={5} title="the node" lede="Every app is sealed in its own Firecracker microVM, with its own user, a memory cap, and no network.">
          <ul className="stats">
            {STATS.map(([value, label]) => (
              <li key={label}><b>{value}</b><span>{label}</span></li>
            ))}
          </ul>
          <Trace />
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
