import crypto from 'crypto';
import { prisma } from './prisma';

export function webhookPayloadHash(payload) {
  return crypto.createHash('sha256').update(Buffer.isBuffer(payload) ? payload : JSON.stringify(payload)).digest('hex');
}

export async function beginProviderWebhookEvent(input) {
  try {
    const event = await prisma.providerWebhookEvent.create({ data: { ...input, processingStatus: 'PROCESSING' } });
    return { duplicate: false, event };
  } catch (error) {
    if (error?.code === 'P2002') return { duplicate: true, event: null };
    throw error;
  }
}

export async function finishProviderWebhookEvent(id, processingStatus = 'PROCESSED') {
  return prisma.providerWebhookEvent.update({ where: { id }, data: { processingStatus, processedAt: new Date() } });
}
