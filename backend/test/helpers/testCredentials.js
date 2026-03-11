import crypto from 'node:crypto';

export function randomPassword() {
  return 'P' + crypto.randomBytes(12).toString('hex') + '1';
}

export function randomHash() {
  return crypto.randomBytes(32).toString('hex');
}

export function randomSecret() {
  return crypto.randomBytes(32).toString('hex');
}
