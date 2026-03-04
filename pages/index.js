import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    fetch('/api/fix-status')
      .then(res => res.json())
      .then(data => setStatus(data.status + " - " + data.protocol))
      .catch(() => setStatus('FIX Engine Offline (Simulation Ready)'));
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: '20px' }}>
        <h1 style={{ color: '#38bdf8' }}>Buttertech Finance FIX Bridge</h1>
        <p>Status: <span style={{ color: '#4ade80' }}>{status}</span></p>
      </header>
      
      <main style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px' }}>
          <h3>Payments Gateways</h3>
          <ul>
            <li>Mobile Money (Africa) - <span style={{ color: '#fbbf24' }}>Ready</span></li>
            <li>Interac / Apple Pay - <span style={{ color: '#fbbf24' }}>Pending</span></li>
            <li>Stripe / PayPal - <span style={{ color: '#4ade80' }}>Active</span></li>
          </ul>
        </div>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px' }}>
          <h3>FIX Engine 4.4 (2016 Legacy)</h3>
          <p>Bridge status: <strong>Operational</strong></p>
          <code style={{ color: '#94a3b8' }}>8=FIX.4.4|9=112|35=A|49=BUTTERTECH|...</code>
        </div>
      </main>
    </div>
  );
}
