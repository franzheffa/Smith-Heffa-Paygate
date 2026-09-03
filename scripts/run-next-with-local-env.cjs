#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const command = process.argv[2];

if (!['dev', 'build', 'start'].includes(command)) {
  console.error(`Unsupported Next.js command: ${command || '<missing>'}`);
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, '..');
const nextBin = path.join(projectRoot, 'node_modules', '.bin', 'next');

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function normalizeValue(value) {
  let normalized = String(value ?? '').trim();

  while (
    normalized.length >= 2 &&
    ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  normalized = normalized.replace(/\r/g, '');

  if (!normalized.includes('BEGIN PRIVATE KEY')) {
    normalized = normalized.replace(/\\n+$/g, '').trimEnd();
  }

  return normalized;
}

function parseEnvFile(filePath) {
  const entries = {};
  const content = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);
    entries[key] = normalizeValue(value);
  }

  return entries;
}

function loadFallbackEnv() {
  const fallbackFiles = [
    '.env.local',
    '.env.development.local',
    '.env.vercel.current',
    '.env.vercel.interac',
    '.env.vercel.production',
    '.env.example',
  ];

  const merged = {};

  for (const relativePath of fallbackFiles) {
    const absolutePath = path.join(projectRoot, relativePath);
    if (!fileExists(absolutePath)) continue;

    const parsed = parseEnvFile(absolutePath);
    for (const [key, value] of Object.entries(parsed)) {
      if (!(key in merged) && value !== '') {
        merged[key] = value;
      }
    }
  }

  return merged;
}

const env = {
  ...loadFallbackEnv(),
  ...process.env,
};

if (!process.env.DATABASE_URL && env.DATABASE_URL) {
  console.log('[local-env] Loaded DATABASE_URL fallback for local runtime.');
}

if (!process.env.INTERAC_CLIENT_ID && env.INTERAC_CLIENT_ID) {
  console.log('[local-env] Loaded Interac fallback variables for local runtime.');
}

const child = spawn(nextBin, [command], {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
