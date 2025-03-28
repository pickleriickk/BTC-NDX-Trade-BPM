const db = require('../db');
const { comparePassword } = require('../login/encrypt');

module.exports.auth = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const existingUser = await db.findOne(db.users, { email });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await comparePassword(
      password,
      existingUser.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    req.existingUser = existingUser; // Add existingUser to request object
    next();
  } catch (error) {
    res.error(500, error, req);
  }
};
