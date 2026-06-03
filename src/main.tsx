import { StrictMode, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// ─────────────────────────────────────────────────────────────────────────────
// Root Error Boundary — catches render exceptions and shows a readable UI
// instead of a blank black page. Remove or downgrade in production.
// ─────────────────────────────────────────────────────────────────────────────
interface EBState { error: Error | null; info: ErrorInfo | null }

class RootErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null, info: null };

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
    console.error('[RootErrorBoundary] Render crash:', error, info.componentStack);
  }

  render() {
    const { error, info } = this.state;
    if (error) {
      return (
        <div style={{
          fontFamily: 'monospace', background: '#000', color: '#f87171',
          minHeight: '100vh', padding: '3rem', boxSizing: 'border-box'
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>
            ⚠ Render Error — Open DevTools Console for full trace
          </h1>
          <pre style={{
            background: '#0f0f0f', padding: '1.5rem', borderRadius: '0.75rem',
            fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            border: '1px solid #3f0000', marginBottom: '1rem'
          }}>
            {error.message}
          </pre>
          <details>
            <summary style={{ color: '#94a3b8', cursor: 'pointer', marginBottom: '0.5rem' }}>
              Component Stack
            </summary>
            <pre style={{
              background: '#0f0f0f', padding: '1rem', borderRadius: '0.5rem',
              fontSize: '0.7rem', whiteSpace: 'pre-wrap', color: '#64748b'
            }}>
              {info?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ error: null, info: null })}
            style={{
              marginTop: '1.5rem', padding: '0.5rem 1.5rem', background: '#1d4ed8',
              color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
              fontFamily: 'monospace', fontWeight: 700
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </RootErrorBoundary>
  </StrictMode>,
)
