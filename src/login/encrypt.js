const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Encrypts a password using bcrypt
 * @param {string} password - The plain text password to encrypt
 * @returns {Promise<string>} The hashed password
 * @throws {Error} If password is missing or encryption fails
 */
const encryptPassword = async (password) => {
  if (!password) {
    throw new Error('Password is required');
  }

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw new Error('Password encryption failed');
  }
};

/**
 * Compares a plain text password with a hashed password
 * @param {string} password - The plain text password to check
 * @param {string} hash - The hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

module.exports = {
  encryptPassword,
  comparePassword,
};
