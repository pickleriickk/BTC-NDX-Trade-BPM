const db = require('../db');
const { encryptPassword, comparePassword } = require('./encrypt');

module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await db.findOne(db.users, { email });

    if (existingUser) {
      const isPasswordValid = await comparePassword(
        password,
        existingUser.password,
      );
      if (!isPasswordValid) {
        return res.error(401, null, req, 'Invalid password');
      }
      await db.update(
        db.users,
        { email },
        { $set: { lastLoginDate: new Date().getTime() } },
      );
      res.respond(req, {
        exists: true,
        action: 'login',
        message: 'User exists, proceed to login',
      });
    } else {
      // User doesn't exist - create new user
      const newUser = {
        email,
        password: await encryptPassword(password),
        createdAt: new Date().getTime(),
        lastLoginDate: new Date().getTime(),
        balance: 1000,
        initialBalance: 1000,
      };

      await db.insert(db.users, newUser);
      res.respond(req, {
        exists: false,
        action: 'register',
        message: 'User registered successfully',
      });
    }
  } catch (error) {
    res.error(500, error, req);
  }
};
