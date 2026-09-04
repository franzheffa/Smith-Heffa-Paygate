import Head from 'next/head';
import { useEffect, useState } from 'react';

const ui = {
  page: { minHeight: '100vh', padding: '32px 16px 56px', background: 'linear-gradient(135deg,#f7f4ea,#fffdf8 45%,#eef6ff)', color: '#111827', fontFamily: 'Georgia, ui-serif, serif' },
  wrap: { maxWidth: '1120px', margin: '0 auto', display: 'grid', gap: '24px' },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '22px', padding: '22px', boxShadow: '0 16px 44px -34px rgba(15,23,42,.45)' },
  input: { height: '44px', width: '100%', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '12px', background: '#fff', fontSize: '14px' },
  button: { height: '46px', border: 0, borderRadius: '12px', background: '#0f172a', color: '#fff', padding: '0 16px', fontWeight: 700, cursor: 'pointer' },
};

function Pill({ tone = 'info', children }) {
  const colors = { info: ['#eff6ff', '#1d4ed8'], ok: ['#ecfdf5', '#166534'], warn: ['#fff7ed', '#9a3412'], error: ['#fef2f2', '#991b1b'] };
  const [background, color] = colors[tone] || colors.info;
  return <span style={{ display: 'inline-flex', padding: '5px 9px', borderRadius: '999px', background, color, fontSize: '12px', fontWeight: 700 }}>{children}</span>;
}

function carrier(offer) {
  return String(offer?.summary?.primary_carrier || offer?.owner?.name || offer?.slices?.[0]?.segments?.[0]?.operating_carrier?.name || 'Carrier').trim();
}

function normalizePlace(place) {
  const code = String(place?.iata_code || place?.iata_city_code || place?.code || '').trim().toUpperCase();
  const city = String(place?.city_name || place?.city?.name || '').trim();
  const airport = String(place?.name || place?.airport_name || '').trim();
  return { code, label: [city, airport, code].filter((value, index, values) => value && values.indexOf(value) === index).join(' - ') || code };
}

function PlaceField({ label, value, onChange, onSelect }) {
  const [places, setPlaces] = useState([]);
  useEffect(() => {
    const query = String(value || '').trim();
    if (query.length < 2) { setPlaces([]); return undefined; }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/duffel/places?query=${encodeURIComponent(query)}&limit=8`, { signal: controller.signal });
        const data = await response.json().catch(() => null);
        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data?.places) ? data.places : [];
        setPlaces(rows.map(normalizePlace).filter((place) => place.code));
      } catch (error) { if (error.name !== 'AbortError') setPlaces([]); }
    }, 250);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [value]);
  return <div style={{ position: 'relative', display: 'grid', gap: '5px' }}>
    <label style={{ fontSize: '12px', fontWeight: 700, color: '#4b5563' }}>{label}</label>
    <input style={ui.input} value={value} onChange={(event) => onChange(event.target.value)} placeholder="City or airport" autoComplete="off" required />
    {places.length ? <div style={{ position: 'absolute', zIndex: 5, top: '71px', width: '100%', overflow: 'hidden', border: '1px solid #d1d5db', borderRadius: '12px', background: '#fff', boxShadow: '0 12px 25px -15px rgba(15,23,42,.45)' }}>
      {places.map((place) => <button key={`${place.code}-${place.label}`} type="button" onClick={() => { onSelect(place.code); setPlaces([]); }} style={{ display: 'block', width: '100%', border: 0, padding: '10px 12px', background: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '13px' }}>{place.label}</button>)}
    </div> : null}
  </div>;
}

function Itinerary({ slice, title }) {
  const segments = Array.isArray(slice?.segments) ? slice.segments : [];
  return <div style={{ display: 'grid', gap: '7px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '14px', background: '#fff' }}>
    <strong style={{ fontSize: '13px' }}>{title}</strong>
    <div style={{ fontSize: '13px', color: '#374151' }}>{slice?.origin?.iata_code || '?'} to {slice?.destination?.iata_code || '?'} | {slice?.duration || 'Duration not provided'} | {Math.max(0, segments.length - 1)} stop(s)</div>
    {segments.map((segment, index) => <div key={segment.id || index} style={{ paddingTop: index ? '8px' : 0, borderTop: index ? '1px solid #f1f5f9' : 0, color: '#4b5563', fontSize: '12px', lineHeight: 1.55 }}>
      <strong>{segment?.marketing_carrier?.name || segment?.operating_carrier?.name || 'Carrier'} {segment?.marketing_carrier_flight_number || segment?.operating_carrier_flight_number || ''}</strong><br />
      {segment?.origin?.iata_code || '?'} {segment?.departing_at ? `(${new Date(segment.departing_at).toLocaleString()})` : ''} to {segment?.destination?.iata_code || '?'} {segment?.arriving_at ? `(${new Date(segment.arriving_at).toLocaleString()})` : ''}<br />
      {segment?.aircraft?.name ? `Aircraft: ${segment.aircraft.name}` : ''}{segment?.passengers?.[0]?.cabin_class ? ` | Cabin: ${segment.passengers[0].cabin_class}` : ''}
    </div>)}
  </div>;
}

export default function TravelHub() {
  const [readiness, setReadiness] = useState({ loading: true });
  const [search, setSearch] = useState({ tripType: 'one_way', origin: '', destination: '', departure_date: '', return_date: '', passenger_count: 1, cabin_class: 'economy', direct_only: false });
  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [passengers, setPassengers] = useState([]);
  const [checkoutForm, setCheckoutForm] = useState({ sourceCountry: '', sourceCurrency: '', destinationCountry: '' });
  const [checkout, setCheckout] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    fetch('/api/duffel/readiness').then((response) => response.json()).then((data) => setReadiness({ loading: false, ...data })).catch((error) => setReadiness({ loading: false, ok: false, error: error.message }));
  }, []);

  const submitSearch = async (event) => {
    event.preventDefault();
    if (search.tripType === 'round_trip' && (!search.return_date || search.return_date <= search.departure_date)) { setResult({ ok: false, error: 'Return date must be after the outbound date.' }); return; }
    setSearching(true); setResult(null); setReviewing(false); setCheckout(null); setBooking(null);
    const slices = [{ origin: search.origin.trim().toUpperCase(), destination: search.destination.trim().toUpperCase(), departure_date: search.departure_date }];
    if (search.tripType === 'round_trip') slices.push({ origin: search.destination.trim().toUpperCase(), destination: search.origin.trim().toUpperCase(), departure_date: search.return_date });
    try {
      const response = await fetch('/api/duffel/offer-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slices, passenger_count: Number(search.passenger_count) || 1, cabin_class: search.cabin_class, direct_only: search.direct_only }) });
      setResult((await response.json().catch(() => null)) || { ok: false, error: 'No response body returned.' });
    } catch (error) { setResult({ ok: false, error: error.message }); } finally { setSearching(false); }
  };

  const offers = Array.isArray(result?.data?.offers) ? result.data.offers : [];
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId) || offers[0] || null;
  const instantPayment = selectedOffer?.payment_requirements?.requires_instant_payment === true;
  useEffect(() => { setSelectedOfferId(offers[0]?.id || ''); }, [result]);

  const beginReview = () => {
    setPassengers(Array.from({ length: Math.max(1, Number(search.passenger_count) || 1) }, (_, index) => passengers[index] || ({ id: `passenger_${index + 1}`, type: 'adult', given_name: '', family_name: '', born_on: '', gender: '' })));
    setCheckout(null); setBooking(null); setReviewing(true);
  };
  const updatePassenger = (index, key, value) => setPassengers((current) => current.map((passenger, passengerIndex) => passengerIndex === index ? { ...passenger, [key]: value } : passenger));
  const prepareCheckout = async () => {
    if (!checkoutForm.sourceCountry || !checkoutForm.sourceCurrency || !checkoutForm.destinationCountry) { setCheckout({ ok: false, error: 'Provide the source country, source currency, and destination country.' }); return; }
    setCheckout({ loading: true });
    try {
      const response = await fetch('/api/checkout/universal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ useCase: 'FLIGHT', merchantId: 'duffel-flight', sourceCountry: checkoutForm.sourceCountry, sourceCurrency: checkoutForm.sourceCurrency, destinationCountry: checkoutForm.destinationCountry, destinationCurrency: selectedOffer.total_currency, amountSource: selectedOffer.total_amount, amountDestination: selectedOffer.total_amount, description: `Duffel flight ${selectedOffer.id}`, metadata: { provider: 'DUFFEL', type: 'FLIGHT', selected_offer_id: selectedOffer.id, confirmed_amount: selectedOffer.total_amount, confirmed_currency: selectedOffer.total_currency, trip_type: search.tripType, itineraries: selectedOffer.slices?.map((slice) => ({ origin: slice.origin?.iata_code, destination: slice.destination?.iata_code, duration: slice.duration })), passenger_count: passengers.length } }) });
      setCheckout((await response.json().catch(() => null)) || { ok: false, error: 'Unable to prepare checkout.' });
    } catch (error) { setCheckout({ ok: false, error: error.message }); }
  };
  const confirmHold = async () => {
    if (!checkout?.ok || instantPayment) return;
    setBooking({ loading: true });
    try {
      const response = await fetch('/api/duffel/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ selected_offer_id: selectedOffer.id, expected_amount: selectedOffer.total_amount, expected_currency: selectedOffer.total_currency, passengers, paygate_checkout_id: checkout.checkoutId, confirm_hold_booking: true }) });
      setBooking((await response.json().catch(() => null)) || { ok: false, error: 'Unable to validate the booking.' });
    } catch (error) { setBooking({ ok: false, error: error.message }); }
  };

  return <><Head><title>Smith-Heffa Travel Hub</title></Head><main style={ui.page}><div style={ui.wrap}>
    <section style={{ ...ui.card, background: 'radial-gradient(circle at top left,#fff6d6,#fff 45%,#eef7ff)' }}><Pill tone={readiness.ok ? 'ok' : readiness.loading ? 'warn' : 'error'}>{readiness.loading ? 'Duffel verification in progress' : readiness.ok ? `Duffel ${readiness.environment} ready` : 'Duffel setup required'}</Pill><h1 style={{ margin: '16px 0 8px', fontSize: '40px', lineHeight: 1.05 }}>Smith-Heffa Travel Hub</h1><p style={{ margin: 0, color: '#374151', lineHeight: 1.7 }}>Search real Duffel availability by city or airport, compare full itineraries, and prepare Universal Checkout without taking a payment.</p><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}><Pill>Flights</Pill><Pill tone={readiness.environment === 'live' && !readiness.liveBookingEnabled ? 'ok' : 'warn'}>{readiness.environment === 'live' ? readiness.liveBookingEnabled ? 'Live hold enabled' : 'Live booking kill switch active' : 'Test hold mode'}</Pill></div></section>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '18px' }}><form onSubmit={submitSearch} style={ui.card}><div style={{ display: 'grid', gap: '14px' }}><div><div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6b7280' }}>Flight Search</div><strong style={{ fontSize: '24px' }}>Search Duffel offers</strong></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>{[['one_way', 'One way'], ['round_trip', 'Round trip']].map(([value, label]) => <label key={value} style={{ padding: '10px', border: `1px solid ${search.tripType === value ? '#0f172a' : '#d1d5db'}`, borderRadius: '12px', cursor: 'pointer', fontSize: '14px' }}><input type="radio" name="tripType" checked={search.tripType === value} onChange={() => setSearch((current) => ({ ...current, tripType: value }))} /> {label}</label>)}</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}><PlaceField label="Origin city or airport" value={search.origin} onChange={(origin) => setSearch((current) => ({ ...current, origin }))} onSelect={(origin) => setSearch((current) => ({ ...current, origin }))} /><PlaceField label="Destination city or airport" value={search.destination} onChange={(destination) => setSearch((current) => ({ ...current, destination }))} onSelect={(destination) => setSearch((current) => ({ ...current, destination }))} /></div><div style={{ display: 'grid', gridTemplateColumns: search.tripType === 'round_trip' ? '1fr 1fr' : '1fr', gap: '12px' }}><div><label style={{ fontSize: '12px', fontWeight: 700 }}>Outbound date</label><input style={ui.input} type="date" value={search.departure_date} onChange={(event) => setSearch((current) => ({ ...current, departure_date: event.target.value }))} required /></div>{search.tripType === 'round_trip' ? <div><label style={{ fontSize: '12px', fontWeight: 700 }}>Return date</label><input style={ui.input} type="date" min={search.departure_date || undefined} value={search.return_date} onChange={(event) => setSearch((current) => ({ ...current, return_date: event.target.value }))} required /></div> : null}</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}><div><label style={{ fontSize: '12px', fontWeight: 700 }}>Passengers</label><input style={ui.input} type="number" min="1" max="9" value={search.passenger_count} onChange={(event) => setSearch((current) => ({ ...current, passenger_count: event.target.value }))} /></div><div><label style={{ fontSize: '12px', fontWeight: 700 }}>Cabin class</label><select style={ui.input} value={search.cabin_class} onChange={(event) => setSearch((current) => ({ ...current, cabin_class: event.target.value }))}><option value="economy">Economy</option><option value="premium_economy">Premium Economy</option><option value="business">Business</option><option value="first">First</option></select></div></div><label style={{ fontSize: '14px' }}><input type="checkbox" checked={search.direct_only} onChange={(event) => setSearch((current) => ({ ...current, direct_only: event.target.checked }))} /> Direct flights only</label><button type="submit" style={ui.button} disabled={searching}>{searching ? 'Searching Duffel...' : 'Search flights'}</button></div></form><aside style={ui.card}><div style={{ display: 'grid', gap: '12px' }}><div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6b7280' }}>Integration State</div><strong style={{ fontSize: '24px' }}>Deployment-safe rollout</strong><p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#374151' }}>Search is server-side. Live search and live hold creation are separate configuration decisions.</p><div>Environment: <code>{readiness.environment || 'unknown'}</code></div><div>Orders: <code>{readiness.modules?.orders || 'unknown'}</code></div><div>Webhook: <code>{readiness.webhookUrl || '/api/duffel/webhooks/inbound'}</code></div>{!readiness.ok && !readiness.loading ? <div style={{ color: '#991b1b', fontSize: '13px' }}>{readiness.error || 'Duffel is not configured.'}</div> : null}</div></aside></section>
    <section style={ui.card}><div style={{ display: 'grid', gap: '12px' }}><div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6b7280' }}>Search Results</div>{!result ? <span style={{ color: '#6b7280', fontSize: '14px' }}>No search executed yet.</span> : result.ok === false ? <div style={{ padding: '12px', borderRadius: '14px', background: '#fef2f2', color: '#991b1b', fontSize: '13px' }}>{result.error || 'Duffel returned an error.'}</div> : <><div>Found <strong>{offers.length}</strong> provider offers.</div><div style={{ display: 'grid', gap: '10px' }}>{offers.map((offer) => <button key={offer.id} type="button" onClick={() => { setSelectedOfferId(offer.id); setReviewing(false); }} style={{ padding: '16px', border: offer.id === selectedOfferId ? '2px solid #0f172a' : '1px solid #e5e7eb', borderRadius: '16px', background: '#fcfcfd', cursor: 'pointer', textAlign: 'left' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}><strong>{carrier(offer)}</strong><strong>{offer.total_amount} {offer.total_currency}</strong></div><div style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>{(offer.slices || []).map((slice, index) => <Itinerary key={slice.id || index} slice={slice} title={search.tripType === 'round_trip' ? index === 0 ? 'OUTBOUND' : 'RETURN' : 'ITINERARY'} />)}</div><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}><Pill>{search.cabin_class.replace('_', ' ')}</Pill><Pill tone={offer.payment_requirements?.requires_instant_payment ? 'warn' : 'ok'}>{offer.payment_requirements?.requires_instant_payment ? 'Instant payment required' : 'Hold may be available'}</Pill><Pill>Expires {offer.expires_at ? new Date(offer.expires_at).toLocaleString() : 'provider validation required'}</Pill></div></button>)}</div>{selectedOffer ? <section style={{ display: 'grid', gap: '12px', padding: '16px', border: '1px solid #c7d7ea', borderRadius: '18px', background: '#f8fbff' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}><strong>Selected: {carrier(selectedOffer)}</strong><strong>{selectedOffer.total_amount} {selectedOffer.total_currency}</strong></div>{!reviewing ? <button type="button" style={ui.button} onClick={beginReview}>Continue to booking review</button> : <><strong>Passenger details</strong>{passengers.map((passenger, index) => <div key={passenger.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '8px' }}><input style={ui.input} value={passenger.given_name} onChange={(event) => updatePassenger(index, 'given_name', event.target.value)} placeholder="Given name" required /><input style={ui.input} value={passenger.family_name} onChange={(event) => updatePassenger(index, 'family_name', event.target.value)} placeholder="Family name" required /><input style={ui.input} type="date" value={passenger.born_on} onChange={(event) => updatePassenger(index, 'born_on', event.target.value)} required /><select style={ui.input} value={passenger.gender} onChange={(event) => updatePassenger(index, 'gender', event.target.value)} required><option value="">Gender</option><option value="f">Female</option><option value="m">Male</option></select></div>)}<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '8px' }}><input style={ui.input} value={checkoutForm.sourceCountry} onChange={(event) => setCheckoutForm((current) => ({ ...current, sourceCountry: event.target.value.toUpperCase() }))} placeholder="Source country" /><input style={ui.input} value={checkoutForm.sourceCurrency} onChange={(event) => setCheckoutForm((current) => ({ ...current, sourceCurrency: event.target.value.toUpperCase() }))} placeholder="Source currency" /><input style={ui.input} value={checkoutForm.destinationCountry} onChange={(event) => setCheckoutForm((current) => ({ ...current, destinationCountry: event.target.value.toUpperCase() }))} placeholder="Destination country" /></div><button type="button" style={{ ...ui.button, background: '#1d4ed8' }} onClick={prepareCheckout} disabled={checkout?.loading}>{checkout?.loading ? 'Preparing checkout...' : 'Prepare Smith-Heffa checkout'}</button>{checkout && !checkout.loading ? <div style={{ padding: '12px', borderRadius: '14px', background: checkout.ok ? '#ecfdf5' : '#fef2f2', color: checkout.ok ? '#166534' : '#991b1b', fontSize: '13px' }}>{checkout.ok ? `Checkout prepared via ${checkout.route?.sourceRail || 'Paygate'}. No payment has been taken.` : checkout.error || 'Checkout preparation failed.'}</div> : null}{instantPayment ? <div style={{ padding: '12px', borderRadius: '14px', background: '#fff7ed', color: '#9a3412', fontSize: '13px' }}>This fare requires immediate payment. The hold flow is intentionally unavailable.</div> : <button type="button" style={{ ...ui.button, background: !checkout?.ok || booking?.loading ? '#6b7280' : '#166534' }} onClick={confirmHold} disabled={!checkout?.ok || booking?.loading}>{booking?.loading ? 'Booking in progress...' : 'Confirm hold booking'}</button>}{booking && !booking.loading ? <div style={{ padding: '12px', borderRadius: '14px', background: booking.ok ? '#ecfdf5' : '#fef2f2', color: booking.ok ? '#166534' : '#991b1b', fontSize: '13px' }}><strong>{booking.ok ? 'Hold order created' : booking.code || 'Booking error'}</strong><br />{booking.ok ? `Reference: ${booking.order?.booking_reference || booking.order?.id || 'pending'}` : booking.error}</div> : null}</>}</section> : null}</>}</div></section>
  </div></main></>;
}
