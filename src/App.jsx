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
  ['→', 'GET https://tracker.example.com/'],
  ['·', 'rate limit ok  ·  logged'],
  ['·', 'no warm VM for "weekly-tracker", restoring snapshot'],
  ['·', 'VM ready'],
  ['·', 'event → your app'],
  ['←', '200 OK'],
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

// Inside one node, simplified. Boxes are [x, y, label, detail] in a 880×430 viewBox, each 150×44.
const NODES = {
  web: [10, 50, 'browser', 'your users'],
  cli: [10, 170, 'console / CLI', 'signed requests'],
  pub: [205, 50, 'public entry', 'every request logged'],
  rate: [375, 50, 'rate limit', 'per client'],
  url: [545, 50, 'app address', 'on your domain'],
  store: [715, 50, 'storage', 'on your disk'],
  admin: [205, 170, 'admin entry', 'private by default'],
  auth: [375, 170, 'identity', 'policy per action'],
  svc: [545, 170, 'services', 'apps, buckets, data'],
  pool: [715, 170, 'warm pool', 'fast starts'],
  boot: [375, 350, 'your app', 'the code you deploy'],
  rt: [545, 350, 'runtime', 'hands over events'],
  agent: [715, 350, 'guest agent', 'the only door'],
}
// [node, caption]: one request into an app that reads a bucket file, then one signed admin call.
const FLOW = [
  ['web', 'A request arrives at an app’s address.'],
  ['pub', 'The public entry logs it,'],
  ['rate', 'and limits how fast each client can call.'],
  ['url', 'The address names an app, which takes a concurrency slot.'],
  ['pool', 'A warm microVM is ready, or one starts from a snapshot taken after init.'],
  ['agent', 'The node hands the request into the VM over a sealed channel.'],
  ['rt', 'The guest agent passes it to the runtime,'],
  ['boot', 'and your app handles it. The VM has no network of its own.'],
  ['agent', 'To read a file from a bucket, the app asks the guest agent,'],
  ['svc', 'which reaches the node as the app’s own role. There are no keys in your code.'],
  ['store', 'The role’s policy is checked, then the file is read from your disk.'],
  ['web', 'The response goes back out the way it came.'],
  ['cli', 'An admin call from the console or CLI, signed with an access key.'],
  ['admin', 'The admin entry is private to the machine by default.'],
  ['auth', 'The signature names the caller; policies allow or deny each action.'],
  ['svc', 'The service handles it,'],
  ['store', 'and the data stays on your disk.'],
]
// Lines between the boxes the flow passes through.
const EDGES = [['web', 'pub'], ['pub', 'rate'], ['rate', 'url'], ['url', 'pool'], ['pool', 'agent'], ['agent', 'rt'], ['rt', 'boot'],
  ['agent', 'svc'], ['svc', 'store'], ['cli', 'admin'], ['admin', 'auth'], ['auth', 'svc']]

// Planned: several nodes, each with a role, behind a gateway that routes by what a request needs.
const CLUSTER = {
  client: [10, 128, 'requests', 'from users and apps'],
  gateway: [300, 128, 'gateway', 'reads each request'],
  app: [705, 34, 'app node', 'apps in microVMs'],
  storage: [705, 128, 'storage node', 'buckets on big disks'],
  inference: [705, 222, 'inference node', 'GPUs, models loaded'],
}
const CLUSTER_FLOW = [
  ['client', 'A page or an API call comes in.'],
  ['gateway', 'The gateway reads what the request asks for, and picks a node:'],
  ['app', 'here an app node, which runs it in a microVM.'],
  ['storage', 'When the app needs a bucket file, it reaches the storage node directly, still as its own role.'],
  ['client', 'A large upload or download comes in.'],
  ['gateway', 'It is about files, so the gateway sends it'],
  ['storage', 'straight to a storage node, without tying up an app.'],
  ['client', 'A call to a model comes in.'],
  ['gateway', 'It needs a GPU, so it goes'],
  ['inference', 'to an inference node that keeps the model loaded.'],
]
const CLUSTER_EDGES = [['client', 'gateway'], ['gateway', 'app'], ['gateway', 'storage'], ['gateway', 'inference'], ['app', 'storage']]

// An SVG of 150×44 boxes ({id: [x, y, label, detail]}) and the lines between them, with a dot that
// steps through `flow` ([box id, caption]) and a caption for each step. `children` draws behind the boxes.
function Diagram({ nodes, flow, edges, height, label, children }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => setStep(s => (s + 1) % flow.length), 1900)
    return () => clearTimeout(t)
  }, [step, flow.length])
  const center = (id) => [nodes[id][0] + 75, nodes[id][1] + 22]
  const [node, caption] = flow[step]
  const [dx, dy] = center(node)
  return (
    <figure className="diagram">
      <div className="diagram-scroll">
        <svg viewBox={`0 0 880 ${height}`} role="img" aria-label={label}>
          {children}
          {edges.map(([a, b]) => {
            const [x1, y1] = center(a), [x2, y2] = center(b)
            return <line key={a + b} className="edge" x1={x1} y1={y1} x2={x2} y2={y2} />
          })}
          {Object.entries(nodes).map(([id, [x, y, text, detail]]) => (
            <g key={id} className={id === node ? 'node on' : 'node'}>
              <rect x={x} y={y} width="150" height="44" />
              <text className="node-label" x={x + 12} y={y + 19}>{text}</text>
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
          <h3 className="sub">inside a node</h3>
          <Diagram nodes={NODES} flow={FLOW} edges={EDGES} height={430}
            label="Inside a node: requests reach a public or an admin entry, pass rate limiting or identity and policy checks, and reach the services and storage. Apps run in microVMs from a warm pool, reached only through a guest agent, and read bucket files as their own role.">
            <rect className="frame-box" x="190" y="20" width="685" height="230" />
            <text className="frame-label" x="200" y="38">your node · one enclox process</text>
            <rect className="frame-box" x="360" y="320" width="515" height="100" />
            <text className="frame-label" x="370" y="338">microVM · one per app</text>
            <text className="edge-label" x="818" y="285">in ↓</text>
            <text className="edge-label" x="640" y="285">out ↑</text>
          </Diagram>
          <h3 className="sub">many nodes <span className="tag">planned</span></h3>
          <p className="note sub-lede">
            Add nodes as you grow, each with a role: apps, storage, or inference. A gateway routes every request by what
            it needs, so file transfers don’t tie up apps and model calls land where the GPUs are. Today one node runs
            everything.
          </p>
          <Diagram nodes={CLUSTER} flow={CLUSTER_FLOW} edges={CLUSTER_EDGES} height={300}
            label="Planned: requests reach a gateway, which routes pages and API calls to an app node, file transfers to a storage node, and model calls to an inference node. Apps reach the storage node directly as their own role.">
            <rect className="frame-box" x="690" y="6" width="185" height="288" />
            <text className="frame-label" x="700" y="24">your nodes</text>
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
