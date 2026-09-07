import crypto from 'crypto';
import { prisma } from './prisma';

export function hashIdempotencyKey(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function publicCheckout(checkout) {
  return {
    id: checkout.id,
    service: checkout.service,
    offerId: checkout.offerId,
    rail: checkout.rail,
    currency: checkout.currency,
    state: checkout.state,
    pricingVersion: checkout.pricingVersion,
    fxSource: checkout.fxSource,
    fxRate: checkout.fxRate,
    fxTimestamp: checkout.fxTimestamp?.toISOString?.() || checkout.fxTimestamp || null,
    minorUnits: {
      providerFare: checkout.providerFareMinor.toString(),
      fixedTicketingFee: checkout.platformTicketFeeMinor.toString(),
      platformTransactionFee: checkout.platformTransactionFeeMinor.toString(),
      providerFee: checkout.providerFeeMinor.toString(),
      total: checkout.totalMinor.toString(),
    },
    createdAt: checkout.createdAt?.toISOString?.() || checkout.createdAt,
    updatedAt: checkout.updatedAt?.toISOString?.() || checkout.updatedAt,
  };
}

export async function saveQuotedCheckout({ id, ownerUid, offerId, rail, pricing, idempotencyKey }) {
  return prisma.mobileCheckout.upsert({
    where: { ownerUid_idempotencyKeyHash: { ownerUid, idempotencyKeyHash: hashIdempotencyKey(idempotencyKey) } },
    create: {
      id, ownerUid, service: 'FLIGHT', offerId, rail, currency: pricing.currency,
      providerFareMinor: BigInt(pricing.minorUnits.providerFare),
      platformTicketFeeMinor: BigInt(pricing.minorUnits.fixedTicketingFee),
      platformTransactionFeeMinor: BigInt(pricing.minorUnits.platformTransactionFee),
      providerFeeMinor: BigInt(pricing.minorUnits.providerFee), totalMinor: BigInt(pricing.minorUnits.total),
      pricingVersion: pricing.pricingVersion, fxSource: pricing.fxSource, fxRate: pricing.fxRate,
      fxTimestamp: pricing.fxTimestamp ? new Date(pricing.fxTimestamp) : null, state: 'PRICE_VALIDATED',
      idempotencyKeyHash: hashIdempotencyKey(idempotencyKey),
    },
    update: {},
  });
}

export async function listOwnerActivity(ownerUid, take = 50) {
  const rows = await prisma.mobileCheckout.findMany({
    where: { ownerUid }, orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(take, 1), 100),
  });
  return rows.map(publicCheckout);
}
