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

const INSTALL = {
  build: `git clone ${REPO} && cd self-host-AWS && cargo build --release`,
  run: 'cargo run   # creates root and prints its access key',
  deploy: 'bash scripts/deploy.sh homepage',
}

const SERVICES = [
  ['iam', 'Users, access keys, managed policies. Every request is signed and checked against the caller’s policies.'],
  ['buckets', 'Object storage on SQLite and plain blobs. Multipart uploads, streamed reads, presigned URLs.'],
  ['functions', 'Each invocation runs in a Firecracker microVM, restored from a snapshot taken after init.'],
  ['urls', 'Public Function URLs with CORS, per-IP rate limits, reserved concurrency and custom domains.'],
  ['schedules', 'Cron and rate expressions that invoke functions on time.'],
  ['console', 'A local-only web console for functions, buckets, domains and applications.'],
]

const TRACE = [
  ['→', 'GET /fn/7f3a…/  (Function URL, AuthType NONE)'],
  ['·', 'rate_limit ok  ·  access_log'],
  ['·', 'pool: no warm vm for "hello", restoring snapshot'],
  ['·', 'jailer → firecracker  ·  agent ready on vsock:1000'],
  ['·', 'POST /invoke  →  /var/task/bootstrap'],
  ['←', '200 OK  x-enclox-requestid: 4c1e…'],
]

const HANDLER = `use enclox_runtime::{Error, Event};
use serde_json::{json, Value};

fn handler(event: Event) -> Result<Value, Error> {
    Ok(json!({ "echo": event.payload, "request_id": event.request_id }))
}

fn main() -> Result<(), Error> {
    enclox_runtime::run(handler)
}`

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
  const [tab, setTab] = useState('build')
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(INSTALL[tab]).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }
  return (
    <div className="install">
      <div className="tabs" role="tablist">
        {Object.keys(INSTALL).map((k, i) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            <span className="n">{i + 1}</span> {k}
          </button>
        ))}
      </div>
      <div className="line">
        <code>{INSTALL[tab]}</code>
        <button className="ghost" onClick={copy}>{copied ? 'copied' : 'copy'}</button>
      </div>
    </div>
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
      <div className="term-bar"><span>enclox</span><span>public listener · :443</span></div>
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

function Section({ n, title, children }) {
  return (
    <section>
      <h2><span>{String(n).padStart(2, '0')}</span>{title}</h2>
      {children}
    </section>
  )
}

export default function App() {
  return (
    <>
      <header className="nav">
        <a className="brand" href="/">[enclox]</a>
        <nav>
          <a href={`${REPO}/blob/master/docs/code-flow.md`}>docs</a>
          <a href={`${REPO}/commits/master`}>changelog</a>
          <a href={REPO}>github</a>
        </nav>
      </header>

      <main>
        <div className="hero">
          <div className="frame"><Logo /></div>
          <p className="tagline">YOUR OWN CLOUD, IN ONE BINARY</p>
          <p className="copy">
            Enclox is a self-hosted cloud: IAM, object storage and serverless functions served by a single Rust
            process. Functions run sealed inside Firecracker microVMs, on hardware you own.
          </p>
          <Install />
        </div>

        <Section n={1} title="services">
          <ul className="grid">
            {SERVICES.map(([name, text]) => (
              <li key={name}>
                <h3>{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section n={2} title="a request, end to end">
          <p className="lede">
            Identity comes from the transport, never from the payload. A guest can only reach the host through
            vsock, and only as its function’s execution role.
          </p>
          <Trace />
        </Section>

        <Section n={3} title="write a function">
          <pre className="code">{HANDLER}</pre>
        </Section>

        <p className="status">
          <span className="dot" /> Pre-release. Linux with KVM. Built in the open.
        </p>
      </main>

      <footer>
        <span>enclox</span>
        <a href={REPO}>source</a>
      </footer>
    </>
  )
}
