import React from 'react'
import { createRoot } from 'react-dom/client'
import { Sparkles } from 'lucide-react'
import './App.css'

function App() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="mark"><Sparkles size={24} /></div>
        <p className="eyebrow">Jostavant scratch build</p>
        <h1>Your app is being generated from scratch.</h1>
        <p>
          The AI build pipeline will replace this starter with the complete
          product experience, backend wiring, and deployment workflow.
        </p>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
