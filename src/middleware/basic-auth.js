const bcrypt = require('bcryptjs');


async function requireAuth(req, res, next) {
  const missingBasicToken = { error: 'missing basic token' };
  const unauthorizedRequest = { error: 'unauthorized request' };
  const authToken = req.get('Authorization') || '';
  let basicToken;

  if (!authToken.toLowerCase().startsWith('basic ')) {
    return res.status(401).json(missingBasicToken);
  }
  else {
    basicToken = authToken.split(' ')[1];
    // basicToken = authToken.slice('basic '.length, authToken.length);
  }

  const [tokenUser, tokenPassword] = Buffer
    .from(basicToken, 'base64')
    .toString()
    .split(':');

  // console.log(tokenUser, tokenPassword);

  if (!tokenUser || !tokenPassword) {
    return res.status(401).json(unauthorizedRequest);
  }

  try {
    const user = await req.app.get('db')('thingful_users')
      .where({ user_name: tokenUser })
      .first();

    // if (!user || tokenPassword !== user.password) {
    if (!user) {
      return res.status(401).json(unauthorizedRequest);
    }

    // req.user = user;
    // next();

    try {
      const passwordMatch = await bcrypt.compare(tokenPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json(unauthorizedRequest);
      }

      req.user = user;
      next();
    }
    catch (e) {
      next();
    }
  }
  catch (e) {
    next();
  }
}

module.exports = {
  requireAuth
};