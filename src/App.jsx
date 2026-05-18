import React, { useMemo, useState } from 'react'
import { Bell, MessageCircle, Moon, Plus, Search, Send, Settings, Sun, UserRound, Users } from 'lucide-react'
import './styles.css'

const features = [
  "Email capture form",
  "User authentication (sign‑in / sign‑up)",
  "Database storage of waitlist entries",
  "Responsive design",
  "Confirmation message after submission"
]
const pages = [
  {
    "name": "Landing",
    "route": "/"
  },
  {
    "name": "SignIn",
    "route": "/"
  },
  {
    "name": "SignUp",
    "route": "/"
  },
  {
    "name": "Confirmation",
    "route": "/"
  }
]

export default function App() {
  const [dark, setDark] = useState(false)
  const [message, setMessage] = useState('')
  const [activeChat, setActiveChat] = useState('Product team')
  const chats = ['Product team', 'Design review', 'Support desk', 'Launch group']
  const messages = useMemo(() => [
    { from: 'Maya', text: 'The first scratch build is live and wired for backend APIs.', mine: false },
    { from: 'You', text: 'Great. Keep the experience clean and fast.', mine: true },
    { from: 'Ari', text: 'Auth, conversations, messages, reads, and push tables are ready.', mine: false },
  ], [])

  const send = (event) => {
    event.preventDefault()
    setMessage('')
  }

  return (
    <main className={dark ? 'app dark' : 'app'}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><MessageCircle size={24} /></div>
          <div>
            <strong>Waitlist</strong>
            <span>Messaging workspace</span>
          </div>
        </div>
        <label className="search">
          <Search size={18} />
          <input placeholder="Search messages" />
        </label>
        <nav>
          {chats.map((chat) => (
            <button key={chat} className={activeChat === chat ? 'active' : ''} onClick={() => setActiveChat(chat)}>
              <Users size={18} />
              <span>{chat}</span>
            </button>
          ))}
        </nav>
        <button className="new-chat"><Plus size={18} />New chat</button>
      </aside>

      <section className="chat">
        <header className="topbar">
          <div>
            <p className="eyebrow">Active conversation</p>
            <h1>{activeChat}</h1>
          </div>
          <div className="actions">
            <button aria-label="Notifications"><Bell size={19} /></button>
            <button aria-label="Settings"><Settings size={19} /></button>
            <button aria-label="Toggle theme" onClick={() => setDark((value) => !value)}>
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </header>

        <div className="messages">
          {messages.map((item) => (
            <article key={item.from + item.text} className={item.mine ? 'bubble mine' : 'bubble'}>
              <span>{item.from}</span>
              <p>{item.text}</p>
            </article>
          ))}
        </div>

        <form className="composer" onSubmit={send}>
          <UserRound size={20} />
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message" />
          <button type="submit"><Send size={18} />Send</button>
        </form>
      </section>

      <aside className="inspector">
        <h2>Build scope</h2>
        <div className="feature-list">
          {features.map((feature) => <span key={feature}>{feature}</span>)}
        </div>
        <h2>Pages</h2>
        <div className="page-list">
          {pages.map((page) => (
            <div key={page.name}>
              <strong>{page.name}</strong>
              <span>{page.route}</span>
            </div>
          ))}
        </div>
      </aside>
    </main>
  )
}
