import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateUsername, validatePassword } from '../../../src/utils/validators.js';

describe('validateUsername', () => {
  it('should return valid for a username with 3+ characters', () => {
    const result = validateUsername('abc');
    assert.equal(result.valid, true);
    assert.equal(result.error, undefined);
  });

  it('should return valid for a long username', () => {
    const result = validateUsername('john_doe_123');
    assert.equal(result.valid, true);
  });

  it('should return invalid for empty string', () => {
    const result = validateUsername('');
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });

  it('should return invalid for null', () => {
    const result = validateUsername(null);
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });

  it('should return invalid for undefined', () => {
    const result = validateUsername(undefined);
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });

  it('should return invalid for username shorter than 3 characters', () => {
    const result = validateUsername('ab');
    assert.equal(result.valid, false);
    assert.match(result.error, /at least 3 characters/);
  });

  it('should return invalid for whitespace-only username shorter than 3 chars', () => {
    const result = validateUsername('  ');
    assert.equal(result.valid, false);
  });

  it('should return invalid for non-string input', () => {
    const result = validateUsername(123);
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });
});

describe('validatePassword', () => {
  it('should return valid for a password with 8+ chars, letters and numbers', () => {
    const result = validatePassword('Secret123');
    assert.equal(result.valid, true);
    assert.equal(result.error, undefined);
  });

  it('should return valid for a long password with letters and numbers', () => {
    const result = validatePassword('MyVeryLongPassword123');
    assert.equal(result.valid, true);
  });

  it('should return invalid for empty string', () => {
    const result = validatePassword('');
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });

  it('should return invalid for null', () => {
    const result = validatePassword(null);
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });

  it('should return invalid for undefined', () => {
    const result = validatePassword(undefined);
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });

  it('should return invalid for password shorter than 8 characters', () => {
    const result = validatePassword('Short1');
    assert.equal(result.valid, false);
    assert.match(result.error, /at least 8 characters/);
  });

  it('should return invalid for password without letters', () => {
    const result = validatePassword('12345678');
    assert.equal(result.valid, false);
    assert.match(result.error, /at least one letter/);
  });

  it('should return invalid for password without numbers', () => {
    const result = validatePassword('NoNumbers');
    assert.equal(result.valid, false);
    assert.match(result.error, /at least one number/);
  });

  it('should return invalid for non-string input', () => {
    const result = validatePassword(12345678);
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });
});
