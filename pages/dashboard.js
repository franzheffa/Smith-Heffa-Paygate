import InteracHubButton from '../components/InteracHubButton';
import React, { useMemo, useState } from 'react';
import Head from 'next/head';

const GOLD = '#C6A85B';
const BLACK = '#09090b';
const BRAZIL_FLAG = '/images/flags/br.svg';

const SecOps = () => (
  <svg height="20" viewBox="0 0 340 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
    <path d="M28 3L6 12v18c0 12 9 23 22 27 13-4 22-15 22-27V12Z" fill="none" stroke="#4285F4" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M40 3l10 4v23c0 8-4 16-10 21" fill="none" stroke="#34A853" strokeWidth="3" strokeLinecap="round"/>
    <path d="M24 20c-5 0-9 4-9 10s4 10 9 10c2 0 4-1 6-2" fill="none" stroke="#FBBC04" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M31 22c2 2 3 5 3 8s-1 6-3 8" fill="none" stroke="#EA4335" strokeWidth="3.5" strokeLinecap="round"/>
    <text x="62" y="39" fontFamily="-apple-system,BlinkMacSystemFont,'Google Sans',sans-serif" fontSize="19" fontWeight="400" fill="#ffffff">Google Security Operations</text>
  </svg>
);

// Pays Mobile Money avec préfixes
const MM_COUNTRIES = {
  orange: [
    { code: 'CM', name: 'CM - Cameroun', prefix: '+237' },
    { code: 'SN', name: 'SN - Sénégal', prefix: '+221' },
    { code: 'CI', name: "CI - Côte d'Ivoire", prefix: '+225' },
    { code: 'CD', name: 'CD - RD Congo', prefix: '+243' },
    { code: 'BF', name: 'BF - Burkina Faso', prefix: '+226' },
    { code: 'GN', name: 'GN - Guinée', prefix: '+224' },
  ],
  mtn: [
    { code: 'CM', name: 'CM - Cameroun', prefix: '+237' },
    { code: 'GH', name: 'GH - Ghana', prefix: '+233' },
    { code: 'UG', name: 'UG - Uganda', prefix: '+256' },
    { code: 'RW', name: 'RW - Rwanda', prefix: '+250' },
    { code: 'ZM', name: 'ZM - Zambie', prefix: '+260' },
  ],
  mpesa: [
    { code: 'KE', name: 'KE - Kenya', prefix: '+254' },
    { code: 'TZ', name: 'TZ - Tanzanie', prefix: '+255' },
    { code: 'MZ', name: 'MZ - Mozambique', prefix: '+258' },
  ],
};

const COUNTRY_2_TO_3 = {
  BF: 'BFA',
  CD: 'COD',
  CI: 'CIV',
  CM: 'CMR',
  GH: 'GHA',
  GN: 'GIN',
  KE: 'KEN',
  MZ: 'MOZ',
  RW: 'RWA',
  SN: 'SEN',
  TZ: 'TZA',
  UG: 'UGA',
  ZM: 'ZMB',
};

function matchProviderForBrand(brand, provider = {}) {
  const haystack = `${provider.displayName || ''} ${provider.provider || ''}`.toUpperCase();
  if (brand === 'orange') return haystack.includes('ORANGE');
  if (brand === 'mtn') return haystack.includes('MTN');
  if (brand === 'mpesa') return haystack.includes('M-PESA') || haystack.includes('MPESA') || haystack.includes('SAFARICOM');
  return false;
}

function InfoPills({ items }) {
  if (!items?.length) return null;
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {items.map((item) => (
        <div key={item.label} style={{ fontSize: '11px', fontWeight: '800', borderRadius: '999px', padding: '5px 9px', backgroundColor: item.tone === 'danger' ? '#fef2f2' : item.tone === 'warn' ? '#fff7ed' : '#eff6ff', color: item.tone === 'danger' ? '#991b1b' : item.tone === 'warn' ? '#9a3412' : '#1d4ed8', border: `1px solid ${item.tone === 'danger' ? '#fecaca' : item.tone === 'warn' ? '#fed7aa' : '#bfdbfe'}` }}>
          {item.label}
        </div>
      ))}
    </div>
  );
}

function getPawaPayStatusTone(status = '') {
  if (status === 'COMPLETED' || status === 'ACCEPTED' || status === 'OPERATIONAL' || status === 'SUCCEEDED' || status === 'PAID') return 'info';
  if (status === 'PROCESSING' || status === 'ENQUEUED' || status === 'DELAYED' || status === 'IN_RECONCILIATION' || status === 'REQUIRES_ACTION' || status === 'REQUIRES_CONFIRMATION') return 'warn';
  return 'danger';
}

function getPawaPayFinalData(result) {
  if (!result || typeof result !== 'object') return null;
  if (result.status === 'FOUND' && result.data) return result.data;
  return result;
}

function getPawaPayDisplayMessage(result) {
  const finalData = getPawaPayFinalData(result);
  if (!finalData) return '';
  return finalData.error
    || finalData.failureReason?.failureMessage
    || finalData.rejectionReason?.rejectionMessage
    || finalData.message
    || finalData.status
    || '';
}

function formatPawaPayCountryName(countryConfig) {
  if (!countryConfig) return '';
  const displayName = countryConfig.displayName?.fr || countryConfig.displayName?.en || countryConfig.country;
  return `${countryConfig.country} - ${displayName}`;
}

function extractOperationConfig(currencyConfig, operationType) {
  if (!currencyConfig?.operationTypes) return null;
  return currencyConfig.operationTypes[operationType] || null;
}

function getInstructionSet(opConfig) {
  const channels = opConfig?.pinPromptInstructions?.channels || [];
  return channels.map((channel, index) => ({
    id: `${channel.type || 'channel'}-${index}`,
    title: channel.displayName?.fr || channel.displayName?.en || channel.type || 'Instructions',
    quickLink: channel.quickLink || '',
    steps: channel.instructions?.fr || channel.instructions?.en || []
  }));
}

function mapPawaPayProviderToDirectRail(providerCode = '') {
  const value = String(providerCode || '').toUpperCase();
  if (value.includes('ORANGE')) return 'orange';
  if (value.includes('MTN')) return 'mtn';
  if (value.includes('M-PESA') || value.includes('MPESA') || value.includes('VODACOM')) return 'mpesa';
  return '';
}

function RailBadge({ label, imageUrl, tint = '#f4f4f5' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', padding: '6px 10px', border: '1px solid #e5e7eb', backgroundColor: tint }}>
      {imageUrl ? <img src={imageUrl} alt={label} style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '999px', backgroundColor: '#fff' }} /> : null}
      <span style={{ fontSize: '11px', fontWeight: '800', color: '#18181b' }}>{label}</span>
    </div>
  );
}

function buildStatusTimeline(item) {
  const operation = String(item.operation || '').toUpperCase();
  const history = Array.isArray(item.history) ? item.history : [];
  const currentStatus = String(item.status || '').toUpperCase();
  const isDeposit = operation === 'DEPOSIT';
  const base = [
    { key: 'INITIATED', label: 'Demande créée' },
    { key: 'ACCEPTED', label: 'Acceptée' },
    { key: isDeposit ? 'CUSTOMER_ACTION' : 'PROCESSING', label: isDeposit ? 'Action client / PIN / USSD' : 'Traitement opérateur' },
    { key: 'COMPLETED', label: 'Finalisée' }
  ];

  const statusMap = {
    INITIATED: 0,
    ACCEPTED: 1,
    DUPLICATE_IGNORED: 1,
    PROCESSING: 2,
    REQUIRES_ACTION: 2,
    REQUIRES_CONFIRMATION: 2,
    ENQUEUED: 2,
    IN_RECONCILIATION: 2,
    DELAYED: 2,
    COMPLETED: 3,
    SUCCEEDED: 3,
    FAILED: 3,
    REJECTED: 3,
    EXPIRED: 3,
    CANCELED: 3,
    REQUIRES_PAYMENT_METHOD: 3,
    OTP_REQUIRED: 2
  };

  const currentIndex = statusMap[currentStatus] ?? 0;
  return base.map((step, index) => {
    const matchedHistory = history.find((entry) => {
      const status = String(entry.status || '').toUpperCase();
      if (step.key === 'CUSTOMER_ACTION') return ['PROCESSING', 'OTP_REQUIRED', 'ENQUEUED', 'IN_RECONCILIATION'].includes(status);
      return status === step.key;
    });
    const isFinalFailure = index === 3 && ['FAILED', 'REJECTED'].includes(currentStatus);
    return {
      ...step,
      done: index < currentIndex || (index === currentIndex && !isFinalFailure),
      active: index === currentIndex,
      failed: isFinalFailure,
      at: matchedHistory?.at || ''
    };
  });
}

function TransactionTracker({ items }) {
  if (!items.length) return null;
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {items.map((item) => (
        <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '14px', backgroundColor: '#fcfcfc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '14px', color: '#18181b' }}>{item.railLabel}</strong>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#52525b', backgroundColor: '#f4f4f5', borderRadius: '999px', padding: '4px 8px', border: '1px solid #e4e4e7' }}>
                {item.operation}
              </span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: getPawaPayStatusTone(item.status) === 'danger' ? '#991b1b' : getPawaPayStatusTone(item.status) === 'warn' ? '#9a3412' : '#166534', backgroundColor: getPawaPayStatusTone(item.status) === 'danger' ? '#fef2f2' : getPawaPayStatusTone(item.status) === 'warn' ? '#fff7ed' : '#ecfdf5', borderRadius: '999px', padding: '4px 8px', border: `1px solid ${getPawaPayStatusTone(item.status) === 'danger' ? '#fecaca' : getPawaPayStatusTone(item.status) === 'warn' ? '#fed7aa' : '#bbf7d0'}` }}>
                {item.status}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#71717a' }}>
              {new Date(item.createdAt).toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'grid', gap: '4px', fontSize: '12px', color: '#3f3f46' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              {item.countryLabel ? <RailBadge label={item.countryLabel} imageUrl={item.countryFlag} tint="#fafafa" /> : null}
              {item.providerLabel ? <RailBadge label={item.providerLabel} imageUrl={item.providerLogo} tint="#fafafa" /> : null}
            </div>
            <div>Pays: <strong>{item.country || 'N/A'}</strong></div>
            <div>Provider: <strong>{item.provider || 'N/A'}</strong></div>
            <div>Montant: <strong>{item.amount || 'N/A'} {item.currency || ''}</strong></div>
            <div>Rail choisi: <strong>{item.selectedRail || item.railLabel}</strong>{item.reason ? ` · ${item.reason}` : ''}</div>
            {item.externalId ? <div>ID externe: <span style={{ fontFamily: 'monospace' }}>{item.externalId}</span></div> : null}
            {item.message ? <div>Message: {item.message}</div> : null}
          </div>
          <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Timeline
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {buildStatusTimeline(item).map((step) => (
                <div key={`${item.id}-${step.key}`} style={{ display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '999px', backgroundColor: step.failed ? '#ef4444' : step.done ? '#22c55e' : step.active ? '#f59e0b' : '#e4e4e7', border: `2px solid ${step.failed ? '#fecaca' : step.done ? '#bbf7d0' : step.active ? '#fed7aa' : '#d4d4d8'}` }} />
                  <div style={{ fontSize: '12px', color: '#18181b', fontWeight: step.active ? '800' : '600' }}>{step.label}</div>
                  <div style={{ fontSize: '11px', color: '#71717a' }}>{step.at ? new Date(step.at).toLocaleTimeString() : ''}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CampostForm({ onTracked }) {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [config, setConfig] = useState({ loading: true, ready: false, missing: [], warnings: [] });

  React.useEffect(() => {
    let active = true;
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/campost/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'preflight' })
        });
        const data = await res.json().catch(() => null);
        if (!active) return;
        setConfig({
          loading: false,
          ready: !!data?.ready,
          missing: Array.isArray(data?.missing) ? data.missing : [],
          warnings: Array.isArray(data?.warnings) ? data.warnings : []
        });
      } catch (_) {
        if (!active) return;
        setConfig({ loading: false, ready: false, missing: ['CAMPOST preflight indisponible'], warnings: [] });
      }
    };
    loadConfig();
    return () => { active = false; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/campost/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          currency: 'XAF',
          customerPhone: phone,
          reference: reference || `SH-CAMPOST-${Date.now()}`,
          description: description || 'Smith-Heffa Campost local rail'
        })
      });
      const data = await res.json().catch(() => null);
      setResult(data);
      onTracked?.({
        id: `campost-${data?.externalId || Date.now()}`,
        railLabel: 'Campost',
        selectedRail: 'CAMPOST',
        operation: 'PAYMENT',
        country: 'CM',
        countryLabel: 'CM - Cameroun',
        countryFlag: '/images/flags/cmr.svg',
        provider: 'campost',
        providerLabel: 'Campost Local Rail',
        amount,
        currency: 'XAF',
        status: String(data?.status || 'PENDING').toUpperCase(),
        externalId: data?.externalId || '',
        message: data?.message || data?.error || '',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      setResult({ ok: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
      <InfoPills items={[
        { label: config.loading ? 'Vérification Campost…' : config.ready ? 'Campost operational' : 'Campost config missing', tone: config.loading ? 'warn' : config.ready ? 'info' : 'danger' },
        { label: 'Rail souverain local', tone: 'info' },
        { label: 'Cash-in / cash-out préparatoire', tone: 'warn' }
      ]} />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <RailBadge label="CM - Cameroun" imageUrl="/images/flags/cmr.svg" tint="#fafafa" />
        <RailBadge label="Campost" tint="#fafafa" />
      </div>
      {(!config.ready || config.warnings.length > 0) && (
        <div style={{ padding: '10px 12px', borderRadius: '10px', border: `1px solid ${config.ready ? '#fed7aa' : '#fecaca'}`, backgroundColor: config.ready ? '#fff7ed' : '#fef2f2', color: config.ready ? '#9a3412' : '#991b1b', display: 'grid', gap: '6px', fontSize: '12px' }}>
          <div><strong>{config.ready ? 'Campost prêt avec avertissements' : 'Campost en attente de configuration'}</strong></div>
          {config.missing.map((item) => <div key={`campost-missing-${item}`}>Manquant: {item}</div>)}
          {config.warnings.map((item) => <div key={`campost-warning-${item}`}>Avertissement: {item}</div>)}
        </div>
      )}
      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone client / compte Campost" style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant (XAF)" min="1" step="any" required style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Référence Campost" style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description locale" style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      {result ? (
        <div style={{ padding: '10px 12px', borderRadius: '10px', border: `1px solid ${result.ok ? '#bbf7d0' : '#fecaca'}`, backgroundColor: result.ok ? '#f0fdf4' : '#fef2f2', color: result.ok ? '#166534' : '#991b1b', fontSize: '12px', display: 'grid', gap: '4px' }}>
          <div><strong>{result.ok ? 'Intention Campost préparée' : 'Campost en attente'}</strong></div>
          <div>{result.message || result.error}</div>
          {result.externalId ? <div>ID: <span style={{ fontFamily: 'monospace' }}>{result.externalId}</span></div> : null}
        </div>
      ) : null}
      <button type="submit" disabled={loading} style={{ height: '46px', borderRadius: '10px', backgroundColor: loading ? '#6b7280' : '#14532d', color: '#fff', border: 'none', fontWeight: '800', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '⏳ Préparation...' : 'Préparer Campost'}
      </button>
    </form>
  );
}

// Formulaire Mobile Money
function MobileMoneyForm({ provider, color, onSubmit, loading, result, onTracked }) {
  const countries = MM_COUNTRIES[provider] || [];
  const [country, setCountry] = useState(countries[0]?.code || '');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [operatorMeta, setOperatorMeta] = useState(null);
  const [metaError, setMetaError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpFeedback, setOtpFeedback] = useState(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const prefix = countries.find(c => c.code === country)?.prefix || '';

  React.useEffect(() => {
    let active = true;

    const loadMeta = async () => {
      const country3 = COUNTRY_2_TO_3[country];
      if (!country3) {
        if (active) {
          setOperatorMeta(null);
          setMetaError('');
        }
        return;
      }

      try {
        const res = await fetch('/api/pawapay/active-conf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: country3, operationType: 'PAYOUT' })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Statut opérateur indisponible');

        const countryConfig = Array.isArray(data?.countries)
          ? data.countries.find((item) => item.country === country3)
          : null;
        const matched = (countryConfig?.providers || []).find((item) => matchProviderForBrand(provider, item));
        const currencyConfig = matched?.currencies?.[0];
        const opConfig = currencyConfig?.operationTypes?.PAYOUT;

        if (!active) return;

        setOperatorMeta(matched && opConfig ? {
          providerCode: matched.provider,
          displayName: matched.displayName,
          logo: matched.logo || '',
          countryFlag: countryConfig?.flag || '',
          countryLabel: formatPawaPayCountryName(countryConfig),
          currency: currencyConfig?.currency,
          minAmount: opConfig.minAmount,
          maxAmount: opConfig.maxAmount,
          status: opConfig.status || 'UNKNOWN'
        } : null);
        setMetaError('');
      } catch (error) {
        if (!active) return;
        setOperatorMeta(null);
        setMetaError(error.message);
      }
    };

    loadMeta();
    return () => { active = false; };
  }, [country, provider]);

  React.useEffect(() => {
    setOtpCode('');
    setOtpFeedback(null);
    setOtpVerified(false);
  }, [country, phone]);

  const cleanPhone = phone.replace(/\s/g, '').replace(/^0/, '');
  const fullPhone = cleanPhone.startsWith('+') ? cleanPhone : `${prefix}${cleanPhone}`;

  const sendOrangeOtp = async () => {
    if (provider !== 'orange' || !cleanPhone) {
      setOtpFeedback({ type: 'error', msg: 'Saisissez le numéro Orange avant de demander le code.' });
      return;
    }
    setOtpSending(true);
    setOtpFeedback(null);
    try {
      const res = await fetch('/api/paygate/orange/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, phoneNumber: fullPhone })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Envoi OTP impossible');
      setOtpVerified(false);
      setOtpFeedback({
        type: 'success',
        msg: data?.message || 'Code OTP Orange envoyé. Entrez-le dans le champ ci-dessous.'
      });
    } catch (error) {
      setOtpFeedback({ type: 'error', msg: error.message });
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOrangeOtp = async () => {
    if (provider !== 'orange') return;
    setOtpVerifying(true);
    setOtpFeedback(null);
    try {
      const res = await fetch('/api/paygate/orange/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, phoneNumber: fullPhone, otp: otpCode })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'OTP invalide');
      setOtpVerified(true);
      setOtpFeedback({ type: 'success', msg: data?.message || 'OTP Orange vérifié.' });
    } catch (error) {
      setOtpVerified(false);
      setOtpFeedback({ type: 'error', msg: error.message });
    } finally {
      setOtpVerifying(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (provider === 'orange' && !otpVerified) {
      setOtpFeedback({ type: 'error', msg: 'Validez d’abord le code OTP reçu par SMS pour Orange Money.' });
      return;
    }
    const response = await onSubmit({ provider, country, phoneNumber: fullPhone, amount: Math.round(parseFloat(amount) * 100), otpVerified });
    const status = response?.status || response?.message || (response?.error ? 'FAILED' : 'ACCEPTED');
    onTracked?.({
      railLabel: provider === 'orange' ? 'Orange Money Direct' : provider === 'mtn' ? 'MTN MoMo Direct' : 'M-Pesa Direct',
      selectedRail: provider,
      operation: 'PAYOUT',
      country,
      provider: operatorMeta?.providerCode || provider.toUpperCase(),
      providerLabel: operatorMeta?.displayName || provider.toUpperCase(),
      providerLogo: operatorMeta?.logo || '',
      countryLabel: operatorMeta?.countryLabel || countries.find((c) => c.code === country)?.name || country,
      countryFlag: operatorMeta?.countryFlag || '',
      amount,
      currency: operatorMeta?.currency || '',
      status,
      externalId: response?.referenceId || response?.externalId || '',
      message: response?.reason || response?.message || response?.error || '',
      createdAt: new Date().toISOString(),
      id: `${provider}-${Date.now()}`
    });
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
      <InfoPills items={[
        ...(operatorMeta?.status ? [{ label: `Statut ${operatorMeta.status}`, tone: operatorMeta.status === 'OPERATIONAL' ? 'info' : operatorMeta.status === 'DELAYED' ? 'warn' : 'danger' }] : []),
        ...(operatorMeta?.minAmount && operatorMeta?.maxAmount ? [{ label: `Limites ${operatorMeta.minAmount}-${operatorMeta.maxAmount} ${operatorMeta.currency || ''}`, tone: 'info' }] : [])
      ]} />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {operatorMeta?.countryLabel ? <RailBadge label={operatorMeta.countryLabel} imageUrl={operatorMeta.countryFlag} tint="#fafafa" /> : null}
        {operatorMeta?.displayName ? <RailBadge label={operatorMeta.displayName} imageUrl={operatorMeta.logo} tint="#fafafa" /> : null}
      </div>
      {operatorMeta?.providerCode && (
        <div style={{ fontSize: '12px', color: '#52525b' }}>
          Réseau détecté: <strong>{operatorMeta.displayName}</strong> · <span style={{ fontFamily: 'monospace' }}>{operatorMeta.providerCode}</span>
        </div>
      )}
      {metaError && (
        <div style={{ fontSize: '12px', color: '#991b1b' }}>
          {metaError}
        </div>
      )}
      <select value={country} onChange={e => setCountry(e.target.value)}
        style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px', backgroundColor: '#fff' }}>
        {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
      </select>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '72px', height: '42px', borderRadius: '10px', border: `1.5px solid ${GOLD}`, backgroundColor: '#fffdf8', fontWeight: '800', color: '#b45309', fontSize: '13px' }}>
          {prefix}
        </div>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Numéro" required
          style={{ flex: 1, height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      </div>
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant (XAF / USD)" min="1" step="any" required
        style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      {provider === 'orange' && (
        <div style={{ display: 'grid', gap: '8px', padding: '10px', borderRadius: '12px', border: '1px solid #fed7aa', backgroundColor: '#fff7ed' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#9a3412' }}>
            OTP Orange Money
          </div>
          <div style={{ fontSize: '12px', color: '#7c2d12' }}>
            Les utilisateurs reçoivent déjà un code par SMS. Il doit être saisi ici puis vérifié avant l’envoi Orange.
          </div>
          <button type="button" onClick={sendOrangeOtp} disabled={otpSending || !cleanPhone}
            style={{ height: '40px', borderRadius: '10px', backgroundColor: '#fff', color: '#c2410c', border: '1px solid #fdba74', fontWeight: '800', fontSize: '13px', cursor: otpSending ? 'not-allowed' : 'pointer' }}>
            {otpSending ? '⏳ Envoi OTP...' : 'Recevoir / renvoyer le code OTP'}
          </button>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Entrer le code reçu par SMS" inputMode="numeric"
              style={{ flex: '1 1 180px', minWidth: 0, height: '42px', borderRadius: '10px', border: '1.5px solid #fdba74', padding: '0 12px', fontSize: '14px', backgroundColor: '#fff' }} />
            <button type="button" onClick={verifyOrangeOtp} disabled={otpVerifying || otpCode.length !== 6}
              style={{ flex: '0 0 auto', minWidth: '120px', height: '42px', borderRadius: '10px', backgroundColor: otpVerified ? '#16a34a' : '#ea580c', color: '#fff', border: 'none', fontWeight: '800', fontSize: '13px', cursor: otpVerifying ? 'not-allowed' : 'pointer' }}>
              {otpVerifying ? '⏳...' : otpVerified ? 'OTP vérifié' : 'Vérifier le code'}
            </button>
          </div>
          {otpFeedback && (
            <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: otpFeedback.type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${otpFeedback.type === 'error' ? '#fecaca' : '#bbf7d0'}`, fontSize: '12px', color: otpFeedback.type === 'error' ? '#991b1b' : '#166534' }}>
              {otpFeedback.msg}
            </div>
          )}
        </div>
      )}
      {result && (
        <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: result.error ? '#fef2f2' : '#f0fdf4', border: `1px solid ${result.error ? '#fecaca' : '#bbf7d0'}`, fontSize: '12px', color: result.error ? '#991b1b' : '#166534', fontFamily: 'monospace' }}>
          {result.error ? `❌ ${result.error}` : result.message || result.status || 'Traitement en cours...'}
        </div>
      )}
      <button type="submit" disabled={loading}
        style={{ height: '46px', borderRadius: '10px', backgroundColor: loading ? '#6b7280' : color, color: '#fff', border: 'none', fontWeight: '800', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '⏳ Traitement...' : 'Envoyer'}
      </button>
    </form>
  );
}

function PawaPayForm({ onTracked }) {
  const [country, setCountry] = useState('');
  const [operation, setOperation] = useState('payout');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [providerKey, setProviderKey] = useState('');
  const [routingMode, setRoutingMode] = useState('auto');
  const [routePreview, setRoutePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [configError, setConfigError] = useState('');
  const [predicting, setPredicting] = useState(false);
  const [predictHint, setPredictHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [countryConfigs, setCountryConfigs] = useState([]);
  const [configLoading, setConfigLoading] = useState(true);

  const operationType = operation === 'deposit' ? 'DEPOSIT' : 'PAYOUT';

  React.useEffect(() => {
    let active = true;

    const loadConfig = async () => {
      setConfigLoading(true);
      setConfigError('');
      try {
        const res = await fetch('/api/pawapay/active-conf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Configuration pawaPay indisponible');

        if (!active) return;

        const countries = Array.isArray(data?.countries) ? data.countries : [];
        setCountryConfigs(countries);
        setCountry((prev) => prev || countries[0]?.country || '');
      } catch (error) {
        if (!active) return;
        setCountryConfigs([]);
        setConfigError(error.message);
      } finally {
        if (active) setConfigLoading(false);
      }
    };

    loadConfig();
    return () => { active = false; };
  }, []);

  const availableCountries = useMemo(() => {
    return countryConfigs
      .map((countryConfig) => {
        const providers = (countryConfig.providers || []).filter((item) =>
          (item.currencies || []).some((currencyConfig) => extractOperationConfig(currencyConfig, operationType))
        );

        if (!providers.length) return null;

        const firstCurrency = providers[0]?.currencies?.find((currencyConfig) => extractOperationConfig(currencyConfig, operationType))
          || providers[0]?.currencies?.[0]
          || null;

        return {
          code: countryConfig.country,
          name: formatPawaPayCountryName(countryConfig),
          prefix: `+${countryConfig.prefix || ''}`,
          countryConfig,
          defaultCurrency: firstCurrency?.currency || '',
          providers
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [countryConfigs, operationType]);

  const current = useMemo(() => {
    return availableCountries.find((item) => item.code === country) || availableCountries[0] || null;
  }, [availableCountries, country]);

  React.useEffect(() => {
    if (!current?.code) return;
    if (country !== current.code) {
      setCountry(current.code);
    }
  }, [country, current]);

  const providers = useMemo(() => {
    if (!current?.providers) return [];
    return current.providers
      .flatMap((item) => {
        return (item.currencies || [])
          .map((currencyConfig) => {
            const opConfig = extractOperationConfig(currencyConfig, operationType);
            if (!opConfig) return null;
            return {
              code: item.provider,
              label: `${item.displayName} · ${item.provider}`,
              displayName: item.displayName,
              providerCode: item.provider,
              logo: item.logo || '',
              currency: currencyConfig.currency,
              minAmount: opConfig.minAmount || '',
              maxAmount: opConfig.maxAmount || '',
              status: opConfig.status || 'UNKNOWN',
              authType: opConfig.authType || '',
              pinPrompt: opConfig.pinPrompt || '',
              pinPromptRevivable: !!opConfig.pinPromptRevivable,
              instructions: getInstructionSet(opConfig),
              nameDisplayedToCustomer: item.nameDisplayedToCustomer || '',
              quickConfig: opConfig
            };
          })
          .filter(Boolean);
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }, [current, operationType]);

  React.useEffect(() => {
    if (!providers.length) {
      setProviderKey('');
      if (current?.code) setConfigError(`Aucun provider ${operationType} disponible pour ${current.code}.`);
      return;
    }
    setConfigError('');
    setProviderKey((prev) => (providers.some((item) => `${item.code}::${item.currency}` === prev) ? prev : `${providers[0].code}::${providers[0].currency}`));
  }, [providers, operationType, current]);

  React.useEffect(() => {
    let active = true;
    const digits = phone.replace(/\D/g, '');
    if (!current?.prefix || digits.length < 6 || providers.length === 0) {
      setPredictHint('');
      setPredicting(false);
      return () => { active = false; };
    }

    const timer = setTimeout(async () => {
      setPredicting(true);
      try {
        const phoneNumber = `${current.prefix.replace(/\D/g, '')}${digits.replace(/^0/, '')}`;
        const res = await fetch('/api/pawapay/predict-provider', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Prédiction indisponible');
        if (!active) return;

        const predicted = providers.find((item) => item.code === data?.provider);
        if (predicted) {
          setProviderKey(`${predicted.code}::${predicted.currency}`);
          setPredictHint(`Provider prédit: ${predicted.label}`);
        } else if (data?.provider) {
          setPredictHint(`Provider prédit hors configuration: ${data.provider}`);
        } else {
          setPredictHint('');
        }
      } catch (error) {
        if (!active) return;
        setPredictHint(error.message);
      } finally {
        if (active) setPredicting(false);
      }
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [phone, providers, current]);

  const selectedProvider = useMemo(() => {
    return providers.find((item) => `${item.code}::${item.currency}` === providerKey) || providers[0] || null;
  }, [providers, providerKey]);

  React.useEffect(() => {
    if (!current || !selectedProvider || !amount || !phone.trim()) {
      setRoutePreview(null);
      setPreviewError('');
      setPreviewLoading(false);
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError('');
      try {
        const clean = phone.replace(/\s/g, '').replace(/^0/, '');
        const full = clean.startsWith('+') ? clean : `${current.prefix}${clean}`;
        const res = await fetch('/api/mobile-money-router', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            country: current.code,
            currency: selectedProvider.currency || current.defaultCurrency,
            phoneNumber: full,
            provider: selectedProvider.code,
            operationType,
            operation,
            execute: false,
            ...(routingMode !== 'auto' ? { forceRail: routingMode } : {})
          })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Prévisualisation indisponible');
        if (!active) return;
        setRoutePreview(data?.recommendation || null);
      } catch (error) {
        if (!active) return;
        setRoutePreview(null);
        setPreviewError(error.message);
      } finally {
        if (active) setPreviewLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [current, selectedProvider, amount, phone, operationType, operation, routingMode]);

  React.useEffect(() => {
    if (!result) return undefined;
    const initial = getPawaPayFinalData(result);
    const resourceId = initial?.depositId || initial?.payoutId || '';
    const endpoint = initial?.depositId ? '/api/pawapay/deposits' : initial?.payoutId ? '/api/pawapay/payouts' : '';
    const initialStatus = initial?.status || '';

    if (!resourceId || !endpoint || !['ACCEPTED', 'PROCESSING', 'ENQUEUED', 'IN_RECONCILIATION'].includes(initialStatus)) {
      return undefined;
    }

    let active = true;
    const interval = setInterval(async () => {
      try {
        const idKey = endpoint.includes('/deposits') ? 'depositId' : 'payoutId';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', [idKey]: resourceId })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !active || !data) return;

        const finalData = getPawaPayFinalData(data);
        const finalStatus = finalData?.status || data?.status || '';
        setResult(data);

        if (['COMPLETED', 'FAILED', 'REJECTED'].includes(finalStatus)) {
          clearInterval(interval);
        }
      } catch (_) {
        // Ignore a polling tick and try again on next cycle.
      }
    }, 3500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [result]);

  const displayMessage = getPawaPayDisplayMessage(result);
  const finalData = getPawaPayFinalData(result);
  const resultStatus = finalData?.status || result?.status || '';
  const resultTone = finalData?.error || resultStatus === 'FAILED' || resultStatus === 'REJECTED' ? 'danger' : getPawaPayStatusTone(resultStatus);
  const instructionBlocks = operation === 'deposit' ? (selectedProvider?.instructions || []) : [];
  const shouldShowInstructions = operation === 'deposit' && selectedProvider && ['ACCEPTED', 'PROCESSING', 'COMPLETED'].includes(resultStatus || '');
  const directFallbackRail = mapPawaPayProviderToDirectRail(selectedProvider?.providerCode || '');
  const trackingId = finalData?.depositId || finalData?.payoutId || `${operationType}-${current?.code || 'N/A'}-${selectedProvider?.providerCode || 'N/A'}`;

  React.useEffect(() => {
    if (!result || !selectedProvider || !current) return;
    onTracked?.({
      railLabel: 'Mobile Money PawaPay',
      selectedRail: result?.selectedRail || 'pawapay',
      operation: operationType,
      country: current.code,
      countryLabel: formatPawaPayCountryName(current.countryConfig),
      countryFlag: current.countryConfig?.flag || '',
      provider: selectedProvider.providerCode || '',
      providerLabel: selectedProvider.displayName || selectedProvider.providerCode || '',
      providerLogo: selectedProvider.logo || '',
      amount,
      currency: selectedProvider.currency || current.defaultCurrency || '',
      status: resultStatus || 'UNKNOWN',
      externalId: finalData?.depositId || finalData?.payoutId || finalData?.referenceId || '',
      message: result?.reason || displayMessage,
      createdAt: new Date().toISOString(),
      id: trackingId
    });
  }, [result, selectedProvider, current, operationType, amount, resultStatus, finalData, displayMessage, onTracked, trackingId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!current || !selectedProvider) return;

    const clean = phone.replace(/\s/g, '').replace(/^0/, '');
    const full = clean.startsWith('+') ? clean : `${current.prefix}${clean}`;
    const payload = {
      amount,
      country: current.code,
      currency: selectedProvider.currency || current.defaultCurrency,
      phoneNumber: full,
      provider: selectedProvider.code,
      customerMessage: 'Buttertech',
      clientReferenceId: `SH-${Date.now()}`
    };

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/mobile-money-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          operationType,
          operation,
          execute: true,
          ...(routingMode !== 'auto' ? { forceRail: routingMode } : {})
        })
      });
      const data = await res.json().catch(() => null);
      setResult(data || { error: 'Réponse vide PawaPay' });
      const trackedData = getPawaPayFinalData(data || {});
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
      <InfoPills items={[
        ...(selectedProvider?.status ? [{ label: `Statut ${selectedProvider.status}`, tone: getPawaPayStatusTone(selectedProvider.status) }] : []),
        ...(selectedProvider?.minAmount && selectedProvider?.maxAmount ? [{ label: `Limites ${selectedProvider.minAmount}-${selectedProvider.maxAmount} ${selectedProvider.currency || current?.defaultCurrency || ''}`, tone: 'info' }] : []),
        ...(directFallbackRail && operation === 'payout' ? [{ label: `Fallback direct ${directFallbackRail.toUpperCase()}`, tone: 'warn' }] : []),
        ...(predicting ? [{ label: 'Prédiction en cours', tone: 'warn' }] : []),
        ...(configLoading ? [{ label: 'Chargement des marchés', tone: 'warn' }] : [])
      ]} />
      <select value={operation} onChange={e => setOperation(e.target.value)}
        style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px', backgroundColor: '#fff' }}>
        <option value="payout">Payout</option>
        <option value="deposit">Deposit</option>
      </select>
      <select value={routingMode} onChange={e => setRoutingMode(e.target.value)}
        style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px', backgroundColor: '#fff' }}>
        <option value="auto">Auto · choisir le meilleur rail</option>
        <option value="pawapay">Forcer PawaPay</option>
        {directFallbackRail && operation === 'payout' ? <option value={directFallbackRail}>Forcer {directFallbackRail.toUpperCase()} direct</option> : null}
      </select>
      <select value={country} onChange={e => setCountry(e.target.value)}
        style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px', backgroundColor: '#fff' }}>
        {availableCountries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
      </select>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '80px', height: '42px', borderRadius: '10px', border: `1.5px solid ${GOLD}`, backgroundColor: '#fffdf8', fontWeight: '800', color: '#b45309', fontSize: '13px' }}>
          {current?.prefix || '---'}
        </div>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Numéro mobile" required
          style={{ flex: 1, height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      </div>
      <select value={providerKey} onChange={e => setProviderKey(e.target.value)} required
        style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px', backgroundColor: '#fff' }}>
        <option value="" disabled>{configError ? 'Provider indisponible' : 'Choisir un provider'}</option>
        {providers.map((item) => (
          <option key={`${item.code}-${item.currency}`} value={`${item.code}::${item.currency}`}>
            {item.label} · {item.currency} · {item.status}
          </option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {current?.countryConfig?.flag ? <RailBadge label={formatPawaPayCountryName(current.countryConfig)} imageUrl={current.countryConfig.flag} tint="#faf5ff" /> : null}
        {selectedProvider?.displayName ? <RailBadge label={selectedProvider.displayName} imageUrl={selectedProvider.logo} tint="#f5f3ff" /> : null}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 92px', gap: '8px' }}>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant" min="1" step="any" required
          style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '42px', borderRadius: '10px', backgroundColor: '#f4f4f5', border: '1.5px solid #e5e7eb', fontWeight: '800', fontSize: '13px', color: '#27272a' }}>
          {selectedProvider?.currency || current?.defaultCurrency || '---'}
        </div>
      </div>
      {selectedProvider?.nameDisplayedToCustomer && operation === 'deposit' && (
        <div style={{ fontSize: '12px', color: '#52525b' }}>
          Nom affiché au client: <strong>{selectedProvider.nameDisplayedToCustomer}</strong>
        </div>
      )}
      {(routePreview || previewLoading || previewError) && (
        <div style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #ddd6fe', backgroundColor: '#f5f3ff', display: 'grid', gap: '6px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#4c1d95' }}>
            Mode Auto / résumé avant envoi
          </div>
          {previewLoading ? <div style={{ fontSize: '12px', color: '#6d28d9' }}>Analyse du rail en cours...</div> : null}
          {previewError ? <div style={{ fontSize: '12px', color: '#991b1b' }}>{previewError}</div> : null}
          {routePreview ? (
            <>
              <div style={{ fontSize: '12px', color: '#3f3f46' }}>
                Rail choisi: <strong>{String(routePreview.selectedRail || 'pawapay').toUpperCase()}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#3f3f46' }}>
                Provider: <strong>{routePreview.provider || selectedProvider.providerCode}</strong> · Statut PawaPay: <strong>{routePreview.pawaPayStatus || selectedProvider.status || 'UNKNOWN'}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#3f3f46' }}>
                Motif: {routePreview.reason}
              </div>
            </>
          ) : null}
        </div>
      )}
      {predictHint && (
        <div style={{ fontSize: '12px', color: predictHint.includes('hors configuration') || predictHint.includes('indisponible') ? '#991b1b' : '#166534' }}>
          {predictHint}
        </div>
      )}
      {configError && (
        <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', fontSize: '12px', color: '#991b1b', fontFamily: 'monospace', wordBreak: 'break-word' }}>
          {configError}
        </div>
      )}
      {result && (
        <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: resultTone === 'danger' ? '#fef2f2' : resultTone === 'warn' ? '#fff7ed' : '#f0fdf4', border: `1px solid ${resultTone === 'danger' ? '#fecaca' : resultTone === 'warn' ? '#fed7aa' : '#bbf7d0'}`, fontSize: '12px', color: resultTone === 'danger' ? '#991b1b' : resultTone === 'warn' ? '#9a3412' : '#166534', fontFamily: 'monospace', wordBreak: 'break-word' }}>
          {resultTone === 'danger' ? `❌ ${displayMessage}` : displayMessage || JSON.stringify(result).substring(0, 180)}
        </div>
      )}
      {shouldShowInstructions && instructionBlocks.length > 0 && (
        <div style={{ display: 'grid', gap: '8px', marginTop: '4px' }}>
          {instructionBlocks.map((block) => (
            <div key={block.id} style={{ borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#fafafa', padding: '10px 12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#18181b', marginBottom: '6px' }}>{block.title}</div>
              <div style={{ display: 'grid', gap: '4px', fontSize: '12px', color: '#3f3f46' }}>
                {block.steps.map((step, index) => (
                  <div key={`${block.id}-${index}`}>{index + 1}. {step.text || step.template || 'Étape'}</div>
                ))}
              </div>
              {block.quickLink && (
                <a href={block.quickLink} style={{ display: 'inline-block', marginTop: '8px', fontSize: '12px', fontWeight: '700', color: '#5B2ABF', textDecoration: 'none' }}>
                  Ouvrir le raccourci USSD
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      <button type="submit" disabled={loading || !providerKey || configLoading}
        style={{ height: '46px', borderRadius: '10px', backgroundColor: loading ? '#6b7280' : '#5B2ABF', color: '#fff', border: 'none', fontWeight: '800', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '⏳ Traitement...' : 'Lancer via PawaPay'}
      </button>
    </form>
  );
}

// Formulaire Virement Bancaire
function BankTransferForm({ rail, onSubmit, loading, result }) {
  const isSepa = rail === 'sepa';
  const [name, setName] = useState('');
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      rail,
      amount: Math.round(parseFloat(amount) * 100),
      currency: isSepa ? 'EUR' : 'USD',
      beneficiaryName: name,
      iban: isSepa ? iban : undefined,
      bic: isSepa ? bic : undefined,
      accountNumber: !isSepa ? account : undefined,
      dryRun: true,
    });
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom du bénéficiaire" required
        style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      {isSepa ? <>
        <input type="text" value={iban} onChange={e => setIban(e.target.value)} placeholder="IBAN (ex: FR76...)" required
          style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
        <input type="text" value={bic} onChange={e => setBic(e.target.value)} placeholder="BIC / SWIFT"
          style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      </> : <>
        <input type="text" value={account} onChange={e => setAccount(e.target.value)} placeholder={rail === 'interac' ? 'Email ou numéro Interac' : 'Numéro de compte / SWIFT'}
          style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      </>}
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Montant (${isSepa ? 'EUR' : 'CAD/USD'})`} min="1" step="any" required
        style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      {result && (
        <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: result.error ? '#fef2f2' : '#f0fdf4', border: `1px solid ${result.error ? '#fecaca' : '#bbf7d0'}`, fontSize: '12px', color: result.error ? '#991b1b' : '#166534', fontFamily: 'monospace' }}>
          {result.error ? `❌ ${result.error}` : JSON.stringify(result).substring(0, 150)}
        </div>
      )}
      <button type="submit" disabled={loading}
        style={{ height: '46px', borderRadius: '10px', backgroundColor: loading ? '#6b7280' : BLACK, color: GOLD, border: 'none', fontWeight: '800', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '⏳ Traitement...' : 'Initier le virement'}
      </button>
    </form>
  );
}

function PixForm({ onTracked }) {
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [result, setResult] = useState(null);
  const [pixConfig, setPixConfig] = useState({ loading: true, ready: false, missing: [], warnings: [] });

  React.useEffect(() => {
    let active = true;
    const loadPixConfig = async () => {
      try {
        const res = await fetch('/api/paygate/pix/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'preflight' })
        });
        const data = await res.json().catch(() => null);
        if (!active) return;
        setPixConfig({
          loading: false,
          ready: !!data?.ready,
          missing: Array.isArray(data?.missing) ? data.missing : [],
          warnings: Array.isArray(data?.warnings) ? data.warnings : []
        });
      } catch (_) {
        if (!active) return;
        setPixConfig({
          loading: false,
          ready: false,
          missing: ['PIX preflight indisponible'],
          warnings: []
        });
      }
    };

    loadPixConfig();
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    if (!result?.providerIntentId) return;
    onTracked?.({
      id: `ledger-${result.providerIntentId}`,
      railLabel: 'Pix Brasil',
      selectedRail: 'PIX_BR',
      operation: 'PAYMENT',
      country: 'BR',
      countryLabel: 'BR - Brésil',
      countryFlag: BRAZIL_FLAG,
      provider: 'stripe',
      providerLabel: 'Stripe Pix',
      amount,
      currency: 'BRL',
      status: String(result.status || '').toUpperCase(),
      externalId: result.providerIntentId,
      message: result.copyPasteCode ? 'QR Pix généré. Paiement en attente de confirmation bancaire.' : 'Intention Pix créée.',
      createdAt: new Date().toISOString()
    });
  }, [result, amount, onTracked]);

  React.useEffect(() => {
    if (!result?.providerIntentId || !['requires_action', 'processing', 'requires_confirmation'].includes(String(result.status || '').toLowerCase())) {
      return undefined;
    }

    let active = true;
    const interval = setInterval(async () => {
      try {
        setPolling(true);
        const res = await fetch('/api/paygate/pix/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerIntentId: result.providerIntentId })
        });
        const data = await res.json().catch(() => null);
        if (!active || !data?.ok) return;
        setResult((current) => ({ ...current, ...data }));
        if (['succeeded', 'canceled', 'requires_payment_method'].includes(String(data.status || '').toLowerCase())) {
          clearInterval(interval);
        }
      } catch (_) {
        // Ignore a polling tick and retry on next pass.
      } finally {
        if (active) setPolling(false);
      }
    }, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [result]);

  const createPixIntent = async (e) => {
    e.preventDefault();
    if (!pixConfig.ready) {
      setResult({ ok: false, error: 'Pix non configuré. Vérifiez STRIPE_SECRET_KEY et STRIPE_PIX_WEBHOOK_SECRET.' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/paygate/pix/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: Math.round(Number(amount) * 100),
          customerEmail: email,
          orderId: orderId || `SH-PIX-${Date.now()}`,
          description: description || 'Smith-Heffa Pix payment'
        })
      });
      const data = await res.json().catch(() => null);
      setResult(data);
    } catch (error) {
      setResult({ ok: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (!result?.copyPasteCode || typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(result.copyPasteCode);
  };

  const refreshStatus = async () => {
    if (!result?.providerIntentId) return;
    setPolling(true);
    try {
      const res = await fetch('/api/paygate/pix/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerIntentId: result.providerIntentId })
      });
      const data = await res.json().catch(() => null);
      if (data) setResult((current) => ({ ...current, ...data }));
    } finally {
      setPolling(false);
    }
  };

  const status = String(result?.status || '').toLowerCase();
  const isSuccess = status === 'succeeded';
  const isFailure = ['canceled', 'requires_payment_method'].includes(status);
  const pixOperational = pixConfig.ready && pixConfig.missing.length === 0;

  return (
    <form onSubmit={createPixIntent} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
      <InfoPills items={[
        { label: pixConfig.loading ? 'Vérification Pix…' : pixOperational ? 'Pix operational' : 'Pix config missing', tone: pixConfig.loading ? 'warn' : pixOperational ? 'info' : 'danger' },
        { label: 'Rail local Brésil', tone: 'info' },
        { label: 'QR Code + Pix Copia e Cola', tone: 'warn' },
        { label: 'Webhook asynchrone requis', tone: 'info' }
      ]} />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <RailBadge label="BR - Brésil" imageUrl={BRAZIL_FLAG} tint="#f0fdf4" />
        <RailBadge label="Stripe Pix" tint="#f5f3ff" />
      </div>
      {(!pixOperational || pixConfig.warnings.length > 0) && (
        <div style={{ padding: '10px 12px', borderRadius: '10px', border: `1px solid ${pixOperational ? '#fed7aa' : '#fecaca'}`, backgroundColor: pixOperational ? '#fff7ed' : '#fef2f2', color: pixOperational ? '#9a3412' : '#991b1b', display: 'grid', gap: '6px', fontSize: '12px' }}>
          <div><strong>{pixOperational ? 'Pix prêt avec avertissements' : 'Pix en attente de configuration'}</strong></div>
          {pixConfig.missing.map((item) => <div key={`missing-${item}`}>Manquant: {item}</div>)}
          {pixConfig.warnings.map((item) => <div key={`warning-${item}`}>Avertissement: {item}</div>)}
        </div>
      )}
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant (BRL)" min="1" step="any" required style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email client (optionnel)" style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Référence commande (optionnel)" style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description marchande" style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      {result && (
        <div style={{ padding: '10px 12px', borderRadius: '10px', border: `1px solid ${isFailure ? '#fecaca' : isSuccess ? '#bbf7d0' : '#bfdbfe'}`, backgroundColor: isFailure ? '#fef2f2' : isSuccess ? '#f0fdf4' : '#eff6ff', color: isFailure ? '#991b1b' : isSuccess ? '#166534' : '#1d4ed8', display: 'grid', gap: '8px', fontSize: '12px' }}>
          <div><strong>{result.ok ? 'Pix prêt' : 'Erreur Pix'}</strong></div>
          <div>{result.message || result.error || `Statut Stripe: ${result.status}`}</div>
          {result.providerIntentId ? <div>Intent: <span style={{ fontFamily: 'monospace' }}>{result.providerIntentId}</span></div> : null}
          {result.qrCodeUrl ? <img src={result.qrCodeUrl} alt="QR Code Pix" style={{ width: '180px', maxWidth: '100%', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '8px' }} /> : null}
          {result.copyPasteCode ? (
            <div style={{ display: 'grid', gap: '8px' }}>
              <textarea readOnly value={result.copyPasteCode} rows={3} style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #d4d4d8', padding: '10px 12px', fontSize: '12px', fontFamily: 'monospace', resize: 'vertical', minHeight: '88px' }} />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" onClick={copyPixCode} style={{ height: '38px', borderRadius: '10px', backgroundColor: '#fff', color: '#1d4ed8', border: '1px solid #93c5fd', fontWeight: '800', fontSize: '12px', cursor: 'pointer', padding: '0 12px' }}>
                  Copier le code Pix
                </button>
                {result.hostedInstructionsUrl ? (
                  <a href={result.hostedInstructionsUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', height: '38px', borderRadius: '10px', backgroundColor: '#fff', color: '#1d4ed8', border: '1px solid #93c5fd', fontWeight: '800', fontSize: '12px', textDecoration: 'none', padding: '0 12px' }}>
                    Ouvrir les instructions Stripe
                  </a>
                ) : null}
                <button type="button" onClick={refreshStatus} disabled={polling} style={{ height: '38px', borderRadius: '10px', backgroundColor: '#fff', color: '#1d4ed8', border: '1px solid #93c5fd', fontWeight: '800', fontSize: '12px', cursor: polling ? 'not-allowed' : 'pointer', padding: '0 12px' }}>
                  {polling ? '⏳ Vérification...' : 'Rafraîchir le statut'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
      <button type="submit" disabled={loading || !pixConfig.ready} style={{ height: '46px', borderRadius: '10px', backgroundColor: loading || !pixConfig.ready ? '#6b7280' : '#16a34a', color: '#fff', border: 'none', fontWeight: '800', fontSize: '14px', cursor: loading || !pixConfig.ready ? 'not-allowed' : 'pointer' }}>
        {loading ? '⏳ Génération Pix...' : 'Créer un paiement Pix'}
      </button>
    </form>
  );
}

// Card générique
function RailCard({ icon, label, desc, accentColor, children }) {
  return (
    <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '16px', padding: '22px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: `3px solid ${accentColor || GOLD}` }}>
      <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>{label}
      </h3>
      <p style={{ margin: '0 0 4px', color: '#52525b', fontSize: '13px', lineHeight: '1.5' }}>{desc}</p>
      {children}
    </div>
  );
}

function UniversalCheckoutForm({ onTracked }) {
  const [form, setForm] = useState({
    useCase: 'FLIGHT',
    sourceCountry: 'CM',
    sourceCurrency: 'XAF',
    destinationCountry: 'FR',
    destinationCurrency: 'EUR',
    amountSource: '',
    customerPhone: '',
    customerEmail: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const pixPrefillActive = String(form.sourceCountry || '').toUpperCase() === 'BR' || String(form.sourceCurrency || '').toUpperCase() === 'BRL';

  React.useEffect(() => {
    if (!pixPrefillActive) return;
    setForm((current) => {
      const nextCountry = 'BR';
      const nextCurrency = 'BRL';
      if (current.sourceCountry === nextCountry && current.sourceCurrency === nextCurrency) {
        return current;
      }
      return {
        ...current,
        sourceCountry: nextCountry,
        sourceCurrency: nextCurrency
      };
    });
  }, [pixPrefillActive]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/checkout/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ...(String(form.sourceCountry || '').toUpperCase() === 'BR' && String(form.sourceCurrency || '').toUpperCase() === 'BRL' ? { sourceRail: 'PIX_BR' } : {}),
          merchantId: 'smith-heffa-platform',
          amountDestination: form.amountSource
        })
      });
      const data = await res.json().catch(() => null);
      setResult(data);
      if (data?.ok) {
        onTracked?.({
          id: `universal-${data.checkoutId}`,
          railLabel: 'Smith-Heffa Universal Checkout',
          selectedRail: data?.route?.sourceRail || 'ROUTED',
          operation: form.useCase,
          country: form.sourceCountry,
          countryLabel: `${form.sourceCountry} → ${form.destinationCountry}`,
          provider: data?.route?.destinationRail || '',
          providerLabel: data?.route?.sourceRail || '',
          amount: form.amountSource,
          currency: form.sourceCurrency,
          status: data.status,
          externalId: data.checkoutId,
          message: data.message,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      setResult({ ok: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
      <InfoPills items={[
        { label: 'Aucune donnée de paiement conservée', tone: 'info' },
        { label: 'Confirmation forte obligatoire', tone: 'warn' },
        ...(String(form.sourceCountry || '').toUpperCase() === 'BR' && String(form.sourceCurrency || '').toUpperCase() === 'BRL' ? [{ label: 'Source préremplie PIX_BR', tone: 'info' }] : [])
      ]} />
      {String(form.sourceCountry || '').toUpperCase() === 'BR' && String(form.sourceCurrency || '').toUpperCase() === 'BRL' ? (
        <div style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', color: '#166534', display: 'grid', gap: '4px', fontSize: '12px' }}>
          <div><strong>Préremplissage Brésil actif</strong></div>
          <div>Le checkout proposera automatiquement le rail source <strong>PIX_BR</strong> côté UI et côté API.</div>
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
        <select value={form.useCase} onChange={(e) => update('useCase', e.target.value)} style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px', backgroundColor: '#fff' }}>
          <option value="RIDE">Ride</option>
          <option value="FLIGHT">Flight</option>
          <option value="HOTEL">Hotel</option>
          <option value="MERCHANT">Merchant</option>
          <option value="TRANSFER">Transfer</option>
          <option value="ACADEMY">Academy</option>
        </select>
        <input type="number" value={form.amountSource} onChange={(e) => update('amountSource', e.target.value)} placeholder="Montant" min="1" step="any" required style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
        <input type="text" value={form.sourceCountry} onChange={(e) => update('sourceCountry', e.target.value.toUpperCase())} placeholder="Pays source" required style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
        <input type="text" value={form.sourceCurrency} onChange={(e) => update('sourceCurrency', e.target.value.toUpperCase())} placeholder="Devise source" required style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
        <input type="text" value={form.destinationCountry} onChange={(e) => update('destinationCountry', e.target.value.toUpperCase())} placeholder="Pays destination" required style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
        <input type="text" value={form.destinationCurrency} onChange={(e) => update('destinationCurrency', e.target.value.toUpperCase())} placeholder="Devise destination" required style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      </div>
      <input type="tel" value={form.customerPhone} onChange={(e) => update('customerPhone', e.target.value)} placeholder="Téléphone client (optionnel)" style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      <input type="email" value={form.customerEmail} onChange={(e) => update('customerEmail', e.target.value)} placeholder="Email client (optionnel)" style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      <input type="text" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Description métier" style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      {result && (
        <div style={{ padding: '10px 12px', borderRadius: '10px', border: `1px solid ${result.ok ? '#bbf7d0' : '#fecaca'}`, backgroundColor: result.ok ? '#f0fdf4' : '#fef2f2', color: result.ok ? '#166534' : '#991b1b', fontSize: '12px', display: 'grid', gap: '4px' }}>
          <div><strong>{result.ok ? 'Checkout routé' : 'Erreur checkout'}</strong></div>
          <div>{result.message || result.error}</div>
          {result.route ? <div>Source: <strong>{result.route.sourceRail}</strong> · Destination: <strong>{result.route.destinationRail}</strong></div> : null}
          {result.route?.fallback?.destination?.length ? <div>Fallback destination: <strong>{result.route.fallback.destination.join(' → ')}</strong></div> : null}
          {result.route?.fallback?.source?.length ? <div>Fallback source: <strong>{result.route.fallback.source.join(' → ')}</strong></div> : null}
          {result.nextAction ? <div>Étape suivante: {result.nextAction}</div> : null}
        </div>
      )}
      <button type="submit" disabled={loading} style={{ height: '46px', borderRadius: '10px', backgroundColor: loading ? '#6b7280' : BLACK, color: GOLD, border: 'none', fontWeight: '800', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '⏳ Routage...' : 'Préparer le checkout Smith-Heffa'}
      </button>
    </form>
  );
}

function VoiceHelperForm() {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const parseIntent = async (text) => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/voice/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json().catch(() => null);
      setResult(data);
    } catch (error) {
      setResult({ ok: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const startVoice = async () => {
    if (typeof window === 'undefined') return;
    const VoiceRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!VoiceRecognition) {
      setResult({ ok: false, error: 'Reconnaissance vocale non disponible sur ce navigateur.' });
      return;
    }

    const recognition = new VoiceRecognition();
    recognition.lang = 'fr-FR';
    recognition.maxAlternatives = 1;
    recognition.onresult = async (event) => {
      const text = event.results?.[0]?.[0]?.transcript || '';
      setTranscript(text);
      await parseIntent(text);
    };
    recognition.onerror = () => {
      setResult({ ok: false, error: 'La capture vocale a échoué. Utilisez le champ texte si besoin.' });
    };
    recognition.start();
  };

  const submit = async (e) => {
    e.preventDefault();
    await parseIntent(transcript);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
      <InfoPills items={[
        { label: 'La voix guide seulement', tone: 'warn' },
        { label: 'Aucune exécution automatique', tone: 'info' }
      ]} />
      <button type="button" onClick={startVoice} style={{ height: '42px', borderRadius: '10px', backgroundColor: '#111827', color: '#fff', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
        🎙️ Parler à Smith-Heffa
      </button>
      <input type="text" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder='Ex: "Paie mon Yango" ou "Billet avion Douala Paris"' style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      {result && (
        <div style={{ padding: '10px 12px', borderRadius: '10px', border: `1px solid ${result.ok ? '#bbf7d0' : '#fecaca'}`, backgroundColor: result.ok ? '#f0fdf4' : '#fef2f2', color: result.ok ? '#166534' : '#991b1b', fontSize: '12px', display: 'grid', gap: '4px' }}>
          <div><strong>{result.ok ? 'Intent détecté' : 'Erreur voice helper'}</strong></div>
          {result.intent ? <div>Type: <strong>{result.intent.type}</strong> · Provider: <strong>{result.intent.provider}</strong></div> : null}
          <div>{result.message || result.error}</div>
        </div>
      )}
      <button type="submit" disabled={loading || !transcript.trim()} style={{ height: '46px', borderRadius: '10px', backgroundColor: loading ? '#6b7280' : '#0f766e', color: '#fff', border: 'none', fontWeight: '800', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '⏳ Analyse...' : 'Préparer une intention vocale'}
      </button>
    </form>
  );
}

export default function Dashboard() {
  const [interacUser, setInteracUser] = useState(null);
  const [interacVerified, setInteracVerified] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [fdxConsents, setFdxConsents] = useState([]);
  const [fdxAccounts, setFdxAccounts] = useState([]);
  const [fdxAuditEvents, setFdxAuditEvents] = useState([]);
  const [fdxFeedback, setFdxFeedback] = useState(null);
  const [fdxBusy, setFdxBusy] = useState(false);

  // Gestion retour flow Interac Hub
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('interac_auth') === 'success') {
      const info = {
        given_name:  p.get('interac_given_name')  || '',
        family_name: p.get('interac_family_name') || '',
        email:       p.get('interac_email')       || '',
      };
      setInteracVerified(true);
      setInteracUser(info);
      window.history.replaceState({}, '', '/dashboard');
      setTimeout(() => {
        const el = document.getElementById('interac-transfer-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
    if (p.get('interac_error')) {
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});
  const [trackedTransactions, setTrackedTransactions] = useState([]);
  const [trackerRailFilter, setTrackerRailFilter] = useState('ALL');
  const [trackerCountryFilter, setTrackerCountryFilter] = useState('ALL');

  const pushTransaction = React.useCallback((entry) => {
    if (!entry?.id) return;
    setTrackedTransactions((currentItems) => {
      const next = [...currentItems];
      const index = next.findIndex((item) => item.id === entry.id);
      const historyEntry = {
        status: entry.status || 'UNKNOWN',
        at: entry.createdAt || new Date().toISOString(),
        message: entry.message || ''
      };
      if (index >= 0) {
        const existing = next[index];
        const existingHistory = Array.isArray(existing.history) ? existing.history : [];
        const lastStatus = existingHistory[existingHistory.length - 1]?.status;
        const history = lastStatus === historyEntry.status
          ? existingHistory
          : [...existingHistory, historyEntry];
        next[index] = { ...existing, ...entry, history };
      } else {
        next.unshift({ ...entry, history: [historyEntry] });
      }
      return next.slice(0, 12);
    });
  }, []);

  const trackerRailOptions = useMemo(() => {
    return ['ALL', ...Array.from(new Set(trackedTransactions.map((item) => item.selectedRail || item.railLabel).filter(Boolean)))];
  }, [trackedTransactions]);

  const trackerCountryOptions = useMemo(() => {
    return ['ALL', ...Array.from(new Set(trackedTransactions.map((item) => item.country).filter(Boolean)))];
  }, [trackedTransactions]);

  const filteredTrackedTransactions = useMemo(() => {
    return trackedTransactions.filter((item) => {
      const railValue = item.selectedRail || item.railLabel;
      const railOk = trackerRailFilter === 'ALL' || railValue === trackerRailFilter;
      const countryOk = trackerCountryFilter === 'ALL' || item.country === trackerCountryFilter;
      return railOk && countryOk;
    });
  }, [trackedTransactions, trackerRailFilter, trackerCountryFilter]);

  const loadFdxData = React.useCallback(async () => {
    const [meRes, consentsRes, accountsRes, auditRes, ledgerRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/fdx/v6/consents'),
      fetch('/api/fdx/v6/accounts'),
      fetch('/api/fdx/v6/audit/events'),
      fetch('/api/paygate/ledger/recent')
    ]);

    const me = await meRes.json().catch(() => null);
    if (!me?.ok) {
      window.location.href = '/auth/login';
      return;
    }

    const consents = await consentsRes.json().catch(() => ({ consents: [] }));
    const accounts = await accountsRes.json().catch(() => ({ accounts: [] }));
    const audit = await auditRes.json().catch(() => ({ events: [] }));
    const ledger = await ledgerRes.json().catch(() => ({ items: [] }));

    setSessionUser(me.user || null);
    setFdxConsents(Array.isArray(consents.consents) ? consents.consents : []);
    setFdxAccounts(Array.isArray(accounts.accounts) ? accounts.accounts : []);
    setFdxAuditEvents(Array.isArray(audit.events) ? audit.events : []);
    setTrackedTransactions((currentItems) => {
      const next = [...currentItems];
      for (const item of Array.isArray(ledger.items) ? ledger.items : []) {
        const index = next.findIndex((existing) => existing.id === item.id);
        if (index >= 0) {
          next[index] = { ...next[index], ...item };
          continue;
        }
        next.push({
          ...item,
          history: [{ status: item.status || 'UNKNOWN', at: item.createdAt || new Date().toISOString(), message: item.message || '' }]
        });
      }
      return next
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 12);
    });
  }, []);

  React.useEffect(() => {
    loadFdxData().catch(() => {
      window.location.href = '/auth/login';
    });
  }, [loadFdxData]);

  const createDemoConsent = async () => {
    setFdxBusy(true);
    setFdxFeedback(null);
    try {
      const res = await fetch('/api/fdx/v6/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationType: 'TIME_BOUND',
          durationPeriod: 180,
          lookbackPeriod: 90,
          resources: [
            {
              resourceType: 'ACCOUNT',
              resourceId: fdxAccounts[0]?.accountId || 'acct-demo',
              dataClusters: ['ACCOUNT_DETAILED', 'TRANSACTIONS']
            }
          ]
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || data?.error || 'Création du consentement impossible');
      setFdxFeedback({ type: 'success', msg: `Consentement créé: ${data.id}` });
      await loadFdxData();
    } catch (error) {
      setFdxFeedback({ type: 'error', msg: error.message });
    } finally {
      setFdxBusy(false);
    }
  };

  const revokeConsent = async (consentId) => {
    setFdxBusy(true);
    setFdxFeedback(null);
    try {
      const res = await fetch(`/api/fdx/v6/consents/${consentId}/revocation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'BUSINESS_RULE', initiator: 'DATA_ACCESS_PLATFORM' })
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || data?.error || 'Révocation impossible');
      }
      setFdxFeedback({ type: 'success', msg: `Consentement révoqué: ${consentId}` });
      await loadFdxData();
    } catch (error) {
      setFdxFeedback({ type: 'error', msg: error.message });
    } finally {
      setFdxBusy(false);
    }
  };

  const post = async (id, url, body) => {
    setLoading(l => ({ ...l, [id]: true }));
    setResults(r => ({ ...r, [id]: null }));
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.redirected) { window.location.href = res.url; return; }
      const data = await res.json().catch(() => null);
      if (data?.url) { window.location.href = data.url; return; }
      if (data?.checkoutUrl) { window.location.href = data.checkoutUrl; return; }
      setResults(r => ({ ...r, [id]: data }));
      return data;
    } catch (err) {
      const failure = { error: err.message };
      setResults(r => ({ ...r, [id]: failure }));
      return failure;
    } finally {
      setLoading(l => ({ ...l, [id]: false }));
    }
  };

  const btnStyle = (color, textColor = '#fff') => ({
    width: '100%', height: '46px', borderRadius: '10px', backgroundColor: color, color: textColor,
    border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '12px'
  });

  const resultBox = (id) => results[id] && (
    <div style={{ padding: '8px 12px', borderRadius: '8px', marginTop: '10px', backgroundColor: results[id]?.error ? '#fef2f2' : '#f0fdf4', border: `1px solid ${results[id]?.error ? '#fecaca' : '#bbf7d0'}`, fontSize: '12px', color: results[id]?.error ? '#991b1b' : '#166534', fontFamily: 'monospace', wordBreak: 'break-all' }}>
      {results[id]?.error ? `❌ ${results[id].error}` : results[id]?.status || results[id]?.message || JSON.stringify(results[id]).substring(0, 150)}
    </div>
  );

  const sectionTitle = (label) => (
    <h2 style={{ fontSize: '13px', fontWeight: '800', color: '#09090b', marginBottom: '16px', paddingBottom: '10px', borderBottom: `2px solid ${GOLD}`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      {label}
    </h2>
  );

  return (
    <>
      <Head><title>Enterprise Payment Rail · Smith-Heffa</title></Head>
      <main style={{ minHeight: '100vh', backgroundColor: '#f4f4f4', color: '#111', fontFamily: 'system-ui, sans-serif', padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Badge env */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#eefbf4', border: '1px solid #c3e8d1', color: '#1b5e3a', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '24px', textTransform: 'uppercase' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
          ENV : PRODUCTION SECURE · BUTTERTECH
        </div>

        <div style={{ width: '100%', maxWidth: '1140px', backgroundColor: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 60px -20px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb' }}>

          {/* Header */}
          <section style={{ backgroundColor: BLACK, color: '#fff', padding: '28px 32px', borderBottom: `4px solid ${GOLD}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>💳 Enterprise Payment Rail</h1>
              <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>Console d'orchestration unifiée · 9 rails de paiement</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <a
                href="/account/delete"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#fbbf24',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '14px',
                  border: '1px solid rgba(251,191,36,0.35)',
                  textDecoration: 'none'
                }}
              >
                Account & Data Deletion
              </a>
              <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/auth/login'; }}
                style={{ backgroundColor: '#27272a', color: '#fff', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', border: `1px solid #3f3f46`, cursor: 'pointer' }}>
                Déconnexion
              </button>
            </div>
          </section>

          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

            {/* ─── INTERNATIONAL ─── */}
            <div>
              {sectionTitle('🌍 Paiements Internationaux')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

                <RailCard icon="💳" label="Stripe Checkout" desc="Cartes bancaires (Visa, Mastercard, Amex). Bac à sable Buttertech." accentColor="#635BFF">
                  {resultBox('stripe')}
                  <button onClick={() => post('stripe', '/api/applepay-checkout', { amount: 5000, currency: 'usd' })}
                    disabled={loading.stripe} style={btnStyle('#635BFF')}>
                    {loading.stripe ? '⏳...' : 'Payer avec Stripe'}
                  </button>
                </RailCard>

                <RailCard icon="🍏" label="Apple Pay" desc="Paiement biométrique via l'écosystème Apple. Checkout Stripe Sandbox." accentColor="#000">
                  {resultBox('applepay')}
                  <button onClick={() => post('applepay', '/api/applepay-checkout', { amount: 5000, currency: 'usd' })}
                    disabled={loading.applepay} style={btnStyle('#000')}>
                    {loading.applepay ? '⏳...' : 'Payer avec Apple Pay'}
                  </button>
                </RailCard>

                <RailCard icon="🅿️" label="PayPal" desc="Portefeuille électronique international. Fallback Stripe si PayPal indisponible." accentColor="#003087">
                  {resultBox('paypal')}
                  <button onClick={() => post('paypal', '/api/paypal-checkout', { amount: 5000, currency: 'usd' })}
                    disabled={loading.paypal} style={btnStyle('#003087')}>
                    {loading.paypal ? '⏳...' : 'Payer avec PayPal'}
                  </button>
                </RailCard>

                <RailCard icon="🇧🇷" label="Pix Brasil" desc="Rail instantané Brésil via Stripe Pix. QR Code, Pix copia e cola, confirmation webhook." accentColor="#16a34a">
                  <PixForm onTracked={pushTransaction} />
                </RailCard>

              </div>
            </div>

            {/* ─── MOBILE MONEY AFRIQUE ─── */}
            <div>
              {sectionTitle('🧠 Smith-Heffa Universal Checkout')}
              <div style={{ fontSize: '13px', color: '#52525b', marginBottom: '16px' }}>
                Paiement local, règlement mondial. Smith-Heffa route l’intention sans exécuter de transaction avant confirmation forte.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <RailCard icon="🌐" label="Universal Checkout" desc="Routage cross-rail pour billets, trajets, marchands, Academy et transferts." accentColor="#111827">
                  <UniversalCheckoutForm onTracked={pushTransaction} />
                </RailCard>
                <RailCard icon="🎙️" label="Voice Helper" desc="La voix prépare l’intention. Smith-Heffa n’exécute jamais un paiement par la voix seule." accentColor="#0f766e">
                  <VoiceHelperForm />
                </RailCard>
              </div>

              {sectionTitle('📱 Mobile Money Afrique')}
              <div style={{ fontSize: '13px', color: '#52525b', marginBottom: '16px' }}>
                PawaPay agrège les marchés Mobile Money activés sur ton compte. Les rails directs Orange, MTN et M-Pesa restent conservés comme couche de résilience opérateur.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

                <RailCard icon="🟣" label="Mobile Money PawaPay" desc="Rail agrégé Afrique. Sandbox prêt pour deposit, payout et callbacks dédiés." accentColor="#5B2ABF">
                  <PawaPayForm onTracked={pushTransaction} />
                </RailCard>

                <RailCard icon="🟠" label="Orange Money" desc="Rail direct Orange Money. Disponible au même niveau que le rail agrégé." accentColor="#FF6600">
                  <MobileMoneyForm provider="orange" color="#FF6600"
                    onSubmit={body => post('orange', '/api/mobile-money-payout', body)}
                    loading={!!loading.orange} result={results.orange} onTracked={pushTransaction} />
                </RailCard>

                <RailCard icon="🟡" label="MTN MoMo" desc="Rail direct MTN Mobile Money. Disponible pour fallback, tests ciblés et futur rail unitaire." accentColor="#FFC107">
                  <MobileMoneyForm provider="mtn" color="#FFC107"
                    onSubmit={body => post('mtn', '/api/mobile-money-payout', body)}
                    loading={!!loading.mtn} result={results.mtn} onTracked={pushTransaction} />
                </RailCard>

                <RailCard icon="🟢" label="M-Pesa" desc="KE · TZ · MZ — Mobile Money Safaricom." accentColor="#00A550">
                  <MobileMoneyForm provider="mpesa" color="#00A550"
                    onSubmit={body => post('mpesa', '/api/mobile-money-payout', body)}
                    loading={!!loading.mpesa} result={results.mpesa} onTracked={pushTransaction} />
                </RailCard>

                <RailCard icon="📮" label="Campost" desc="Rail souverain local Cameroun. Préparation de l’intention et readiness API sans toucher au cœur existant." accentColor="#14532d">
                  <CampostForm onTracked={pushTransaction} />
                </RailCard>

              </div>
            </div>

            <div>
              {sectionTitle('🧭 Suivi Transactions')}
              <div style={{ fontSize: '13px', color: '#52525b', marginBottom: '16px' }}>
                Vue consolidée des transactions récentes, du rail choisi par le routeur, et de l’évolution de statut.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                <select value={trackerRailFilter} onChange={(e) => setTrackerRailFilter(e.target.value)}
                  style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px', backgroundColor: '#fff' }}>
                  {trackerRailOptions.map((item) => (
                    <option key={item} value={item}>{item === 'ALL' ? 'Tous les rails' : item}</option>
                  ))}
                </select>
                <select value={trackerCountryFilter} onChange={(e) => setTrackerCountryFilter(e.target.value)}
                  style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px', backgroundColor: '#fff' }}>
                  {trackerCountryOptions.map((item) => (
                    <option key={item} value={item}>{item === 'ALL' ? 'Tous les pays' : item}</option>
                  ))}
                </select>
              </div>
              <TransactionTracker items={filteredTrackedTransactions} />
            </div>

            {/* ─── VIREMENTS BANCAIRES ─── */}
            <div>
              {sectionTitle('🏦 Virements Bancaires')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

                <RailCard icon="🏦" label="SEPA Virement" desc="Zone Euro · Délai J+1 · IBAN requis · Mode simulation activé." accentColor="#1a56db">
                  <BankTransferForm rail="sepa"
                    onSubmit={body => post('sepa', '/api/bank-transfer-payout', body)}
                    loading={!!loading.sepa} result={results.sepa} />
                </RailCard>

                <RailCard icon="🌐" label="SWIFT / Wire" desc="International · Multi-devises · Délai 1-3 jours · Mode simulation activé." accentColor="#374151">
                  <BankTransferForm rail="swift"
                    onSubmit={body => post('swift', '/api/bank-transfer-payout', body)}
                    loading={!!loading.swift} result={results.swift} />
                </RailCard>

                <RailCard icon="🍁" label="Interac e-Transfer" desc="Canada uniquement · CAD · Instantané · Email ou numéro de téléphone." accentColor="#ef4444">
                  <div style={{marginBottom:'12px'}}>
                    <InteracHubButton onVerified={(info) => {
                      setInteracUser(info);
                      setInteracVerified(true);
                    }} />
                  </div>
                  <BankTransferForm rail="interac"
                    interacPreFill={interacUser}
                    onSubmit={body => post('interac', '/api/interac/etransfer', {
                      ...body,
                      recipientName: body.beneficiaryName,
                      recipientEmail: body.accountNumber,
                      dryRun: false
                    })}
                    loading={!!loading.interac} result={results.interac} />
                </RailCard>

              </div>
            </div>

            <div>
              {sectionTitle('🛡️ FDX Control Center')}
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '16px' }}>

                <RailCard icon="📘" label="Consentements FDX" desc="Création, consultation et révocation des consentements provider alignés FDX v6.5." accentColor="#0f766e">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '12px', color: '#52525b' }}>
                      Utilisateur: <strong>{sessionUser?.email || 'chargement...'}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={loadFdxData} style={{ ...btnStyle('#18181b', '#fff'), width: 'auto', marginTop: 0, padding: '0 14px' }}>Rafraîchir</button>
                      <button onClick={createDemoConsent} disabled={fdxBusy} style={{ ...btnStyle('#0f766e', '#fff'), width: 'auto', marginTop: 0, padding: '0 14px' }}>
                        {fdxBusy ? '⏳...' : 'Créer un consentement'}
                      </button>
                    </div>
                  </div>

                  {fdxFeedback && (
                    <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: fdxFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${fdxFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`, color: fdxFeedback.type === 'success' ? '#166534' : '#991b1b', fontSize: '12px', fontWeight: '700', marginBottom: '10px' }}>
                      {fdxFeedback.msg}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {fdxConsents.length === 0 && (
                      <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#fafafa', border: '1px solid #e5e7eb', fontSize: '12px', color: '#52525b' }}>
                        Aucun consentement FDX pour le moment.
                      </div>
                    )}
                    {fdxConsents.map((consent) => (
                      <div key={consent.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px', backgroundColor: '#fcfcfc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '13px' }}>{consent.id}</strong>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: consent.status === 'ACTIVE' ? '#166534' : '#991b1b', backgroundColor: consent.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${consent.status === 'ACTIVE' ? '#bbf7d0' : '#fecaca'}`, borderRadius: '999px', padding: '4px 8px' }}>
                            {consent.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#52525b', lineHeight: '1.6' }}>
                          Durée: {consent.durationType} {consent.durationPeriod ? `· ${consent.durationPeriod} jours` : ''}
                        </div>
                        <div style={{ fontSize: '12px', color: '#52525b', lineHeight: '1.6' }}>
                          Clusters: {(consent.resources || []).flatMap((resource) => resource.dataClusters || []).join(', ') || 'N/A'}
                        </div>
                        {consent.status === 'ACTIVE' && (
                          <button onClick={() => revokeConsent(consent.id)} disabled={fdxBusy} style={{ ...btnStyle('#991b1b', '#fff'), width: 'auto', marginTop: '10px', padding: '0 14px' }}>
                            Révoquer
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </RailCard>

                <div style={{ display: 'grid', gap: '16px' }}>
                  <RailCard icon="🏦" label="Comptes FDX" desc="Sous-ensemble provider FDX branché sur le ledger utilisateur et les transactions existantes." accentColor="#1d4ed8">
                    {fdxAccounts.length === 0 ? (
                      <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#fafafa', border: '1px solid #e5e7eb', fontSize: '12px', color: '#52525b' }}>
                        Aucun compte exposé.
                      </div>
                    ) : fdxAccounts.map((account) => (
                      <div key={account.accountId} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px', backgroundColor: '#fcfcfc', fontSize: '12px', color: '#27272a', lineHeight: '1.7' }}>
                        <div><strong>{account.nickname}</strong></div>
                        <div>Account ID: {account.accountId}</div>
                        <div>Display: {account.accountNumberDisplay}</div>
                        <div>Balance: {account.currentBalance} USD</div>
                      </div>
                    ))}
                  </RailCard>

                  <RailCard icon="🧾" label="Audit Trail Signé" desc="Événements de conformité récents avec signature HMAC côté serveur." accentColor="#7c3aed">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflow: 'auto' }}>
                      {fdxAuditEvents.length === 0 && (
                        <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#fafafa', border: '1px solid #e5e7eb', fontSize: '12px', color: '#52525b' }}>
                          Aucun événement d'audit pour cette session.
                        </div>
                      )}
                      {fdxAuditEvents.map((event) => (
                        <div key={event.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px', backgroundColor: '#fcfcfc' }}>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#18181b' }}>{event.category} · {event.action}</div>
                          <div style={{ fontSize: '11px', color: '#52525b', marginTop: '4px' }}>
                            {event.resourceType}{event.resourceId ? ` · ${event.resourceId}` : ''} · {new Date(event.createdAt).toLocaleString()}
                          </div>
                          <div style={{ fontSize: '11px', color: '#3f3f46', fontFamily: 'monospace', marginTop: '6px', wordBreak: 'break-all' }}>
                            sig={event.signature || 'unsigned'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </RailCard>
                </div>

              </div>
            </div>

          </div>

          {/* Footer SecOps */}
          <div style={{ backgroundColor: BLACK, padding: '18px 32px', borderTop: `4px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Infrastructure certifiée par</span>
            <SecOps />
          </div>

        </div>
      </main>
    </>
  );
}
