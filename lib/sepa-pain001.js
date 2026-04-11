/**
 * lib/sepa-pain001.js
 * Generateur SEPA PAIN.001 ISO 20022 Credit Transfer
 * Compatible Subsembly SEPA API format
 * BUTTERTECH INC - Smith-Heffa-Paygate
 */

function pad2(n) { return String(n).padStart(2, '0'); }

function isoDateTime() {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()) + 'T'
       + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
}
function isoDate() {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate());
}

export function generatePain001({
  msgId, debtorName, debtorIban, debtorBic,
  creditorName, creditorIban, creditorBic,
  amount, remittanceInfo, endToEndId
}) {
  const amt = Number(amount).toFixed(2);
  const e2e = endToEndId || ('E2E-' + Date.now());
  const clean = (v) => String(v || '').replace(/\s/g, '').toUpperCase();
  const bic2 = creditorBic ? ('\n        <CdtrAgt><FinInstnId><BIC>' + creditorBic + '</BIC></FinInstnId></CdtrAgt>') : '';
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03"\n'
    + '          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n'
    + '  <CstmrCdtTrfInitn>\n'
    + '    <GrpHdr>\n'
    + '      <MsgId>' + msgId + '</MsgId>\n'
    + '      <CreDtTm>' + isoDateTime() + '</CreDtTm>\n'
    + '      <NbOfTxs>1</NbOfTxs>\n'
    + '      <CtrlSum>' + amt + '</CtrlSum>\n'
    + '      <InitgPty><Nm>' + debtorName + '</Nm></InitgPty>\n'
    + '    </GrpHdr>\n'
    + '    <PmtInf>\n'
    + '      <PmtInfId>' + msgId + '-PMT</PmtInfId>\n'
    + '      <PmtMtd>TRF</PmtMtd>\n'
    + '      <NbOfTxs>1</NbOfTxs>\n'
    + '      <CtrlSum>' + amt + '</CtrlSum>\n'
    + '      <PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl></PmtTpInf>\n'
    + '      <ReqdExctnDt>' + isoDate() + '</ReqdExctnDt>\n'
    + '      <Dbtr><Nm>' + debtorName + '</Nm></Dbtr>\n'
    + '      <DbtrAcct><Id><IBAN>' + clean(debtorIban) + '</IBAN></Id></DbtrAcct>\n'
    + '      <DbtrAgt><FinInstnId><BIC>' + debtorBic + '</BIC></FinInstnId></DbtrAgt>\n'
    + '      <CdtTrfTxInf>\n'
    + '        <PmtId><EndToEndId>' + e2e + '</EndToEndId></PmtId>\n'
    + '        <Amt><InstdAmt Ccy="EUR">' + amt + '</InstdAmt></Amt>\n'
    + bic2 + '\n'
    + '        <Cdtr><Nm>' + creditorName + '</Nm></Cdtr>\n'
    + '        <CdtrAcct><Id><IBAN>' + clean(creditorIban) + '</IBAN></Id></CdtrAcct>\n'
    + '        <RmtInf><Ustrd>' + (remittanceInfo || 'Smith-Heffa Paygate') + '</Ustrd></RmtInf>\n'
    + '      </CdtTrfTxInf>\n'
    + '    </PmtInf>\n'
    + '  </CstmrCdtTrfInitn>\n'
    + '</Document>';
}

export function validateIban(iban) {
  const c = String(iban || '').replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(c)) return false;
  const r = c.slice(4) + c.slice(0, 4);
  const n = r.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  let rem = 0;
  for (const ch of n) rem = (rem * 10 + Number(ch)) % 97;
  return rem === 1;
}

export function validateBic(bic) {
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(String(bic || '').toUpperCase());
}
