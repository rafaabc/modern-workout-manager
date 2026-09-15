import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import { validateUsername, validatePassword } from '../utils/validators.js';

const scryptAsync = promisify(scrypt);
const SCRYPT_KEYLEN = 64;

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

// This function only verifies pre-existing SHA256 hashes created before the scrypt
// migration; it never hashes a password for storage. A successful verification here
// immediately triggers a rehash to scrypt in login() (see verifyPassword below), so
// this path shrinks over time and can be deleted once no legacy hashes remain in Atlas.
async function verifyLegacySha256(password, salt, hash) {
  const candidate = createHash('sha256')
    .update(salt + password)
    .digest('hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  const candidateBuffer = Buffer.from(candidate, 'hex');
  if (hashBuffer.length !== candidateBuffer.length) {
    return false;
  }
  return timingSafeEqual(hashBuffer, candidateBuffer);
}

async function verifyScrypt(password, salt, hash) {
  const hashBuffer = Buffer.from(hash, 'hex');
  const candidateBuffer = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  if (hashBuffer.length !== candidateBuffer.length) {
    return false;
  }
  return timingSafeEqual(hashBuffer, candidateBuffer);
}

// Stored formats: "scrypt:<salt>:<hash>" (current) or legacy "<salt>:<hash>" (SHA256,
// pre-dating the scrypt migration). Legacy hashes are verified here and transparently
// rehashed to scrypt by login() on next successful sign-in.
async function verifyPassword(password, stored) {
  const parts = stored.split(':');
  if (parts.length === 3 && parts[0] === 'scrypt') {
    return verifyScrypt(password, parts[1], parts[2]);
  }
  const [salt, hash] = parts;
  return verifyLegacySha256(password, salt, hash);
}

function isLegacyHash(stored) {
  return stored.split(':').length !== 3;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  return secret;
}

export function createUserService(userRepository) {
  return {
    async register({ username, password }) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        const error = new Error(usernameValidation.error);
        error.status = 400;
        throw error;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        const error = new Error(passwordValidation.error);
        error.status = 400;
        throw error;
      }

      const existing = await userRepository.findByUsername(username);
      if (existing) {
        const error = new Error('Username already exists');
        error.status = 409;
        throw error;
      }

      const hashedPassword = await hashPassword(password);
      return userRepository.create({ username, password: hashedPassword });
    },

    async login({ username, password }) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
      }

      const user = await userRepository.findByUsername(username);
      if (!user) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
      }

      if (!(await verifyPassword(password, user.password))) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
      }

      // Transparently migrate legacy SHA256 hashes to scrypt now that we know the
      // plaintext password matches. No user-visible effect, no lockouts.
      if (isLegacyHash(user.password)) {
        await userRepository.updatePassword(username, await hashPassword(password));
      }

      const secret = getJwtSecret();
      const token = jwt.sign({ userId: user.id, username: user.username }, secret);
      return { token };
    },

    async changePassword({ username, currentPassword, newPassword }) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        const error = new Error(usernameValidation.error);
        error.status = 400;
        throw error;
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        const error = new Error(passwordValidation.error);
        error.status = 400;
        throw error;
      }

      const user = await userRepository.findByUsername(username);
      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      if (!currentPassword || !(await verifyPassword(currentPassword, user.password))) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
      }

      if (currentPassword === newPassword) {
        const error = new Error('New password must be different from current password');
        error.status = 400;
        throw error;
      }

      const hashedPassword = await hashPassword(newPassword);
      await userRepository.updatePassword(username, hashedPassword);
    },
  };
}
