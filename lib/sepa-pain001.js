/**
 * lib/sepa-pain001.js
 * Générateur SEPA PAIN.001 ISO 20022 (Credit Transfer)
 * Compatible Subsembly SEPA API format
 * BUTTERTECH INC — Smith-Heffa-Paygate
 */

function pad2(n) { return String(n).padStart(2, '0'); }

function isoDateTime() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}
function isoDate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

export function generatePain001({ msgId, debtorName, debtorIban, debtorBic, creditorName, creditorIban, creditorBic, amount, remittanceInfo = 'Smith-Heffa Paygate', endToEndId }) {
  const amt = Number(amount).toFixed(2);
  const e2e = endToEndId || `E2E-${Date.now()}`;
  const clean = (v) => String(v || '').replace(/\s/g, '').toUpperCase();
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${isoDateTime()}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${amt}</CtrlSum>
      <InitgPty><Nm>${debtorName}</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${msgId}-PMT</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${amt}</CtrlSum>
      <PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl></PmtTpInf>
      <ReqdExctnDt>${isoDate()}</ReqdExctnDt>
      <Dbtr><Nm>${debtorName}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${clean(debtorIban)}</IBAN></Id></DbtrAcct>
      <DbtrAgt><FinInstnId><BIC>${debtorBic}</BIC></FinInstnId></DbtrAgt>
      <CdtTrfTxInf>
        <PmtId><EndToEndId>${e2e}</EndToEndId></PmtId>
        <Amt><InstdAmt Ccy="EUR">${amt}</InstdAmt></Amt>${creditorBic ? `
        <CdtrAgt><FinInstnId><BIC>${creditorBic}</BIC></FinInstnId></CdtrAgt>` : ''}
        <Cdtr><Nm>${creditorName}</Nm></Cdtr>
        <CdtrAcct><Id><IBAN>${clean(creditorIban)}</IBAN></Id></CdtrAcct>
        <RmtInf><Ustrd>${remittanceInfo}</Ustrd></RmtInf>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
}

export function validateIban(iban) {
  const c = String(iban || '').replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(c)) return false;
  const r = c.slice(4) + c.slice(0, 4);
  const n = r.replace(/[A-Z]/g, (ch) => ch.charCodeAt(0) - 55);
  let rem = 0;
  for (const ch of n) rem = (rem * 10 + Number(ch)) % 97;
  return rem === 1;
}

export function validateBic(bic) {
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(String(bic || '').toUpperCase());
}
