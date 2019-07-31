const express = require('express');
const AuthService = require('./auth-service');

const authRouter = express.Router();
const jsonBodyParser = express.json();

authRouter
  .post('/login', jsonBodyParser, async (req, res, next) => {
    const { user_name, password } = req.body;
    const loginUser = { user_name, password };

    const invalidLoginError = {
      error: 'invalid login'
    };

    for (const key in loginUser) {
      if (!loginUser[key])
        return res.status(400)
          .json({ error: `missing ${key}` });
    }

    try {
      const dbUser = await AuthService.getUserByUserName(req.app.get('db'), loginUser.user_name);

      if (!dbUser) {
        return res.status(400)
          .json(invalidLoginError);
      }

      const compareMatch = await AuthService.comparePasswords(loginUser.password, dbUser.password);
      if (!compareMatch) {
        return res.status(400)
          .json(invalidLoginError);
      }

      const sub = dbUser.user_name;
      const payload = { user_id: dbUser.id };
      res.send({
        authToken: AuthService.createJWT(sub, payload)
      });
    }
    catch (e) {
      next();
    }
  });

module.exports = authRouter;