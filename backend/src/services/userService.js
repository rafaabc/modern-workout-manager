import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { validateUsername, validatePassword } from '../utils/validators.js';

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(salt + password)
    .digest('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = createHash('sha256')
    .update(salt + password)
    .digest('hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  const candidateBuffer = Buffer.from(candidate, 'hex');
  return timingSafeEqual(hashBuffer, candidateBuffer);
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
    register({ username, password }) {
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

      const existing = userRepository.findByUsername(username);
      if (existing) {
        const error = new Error('Username already exists');
        error.status = 409;
        throw error;
      }

      const hashedPassword = hashPassword(password);
      return userRepository.create({ username, password: hashedPassword });
    },

    login({ username, password }) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
      }

      const user = userRepository.findByUsername(username);
      if (!user) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
      }

      if (!verifyPassword(password, user.password)) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
      }

      const secret = getJwtSecret();
      const token = jwt.sign({ userId: user.id, username: user.username }, secret);
      return { token };
    },
  };
}
