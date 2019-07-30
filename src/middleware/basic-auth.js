async function requireAuth(req, res, next) {
  const authToken = req.get('Authorization') || '';
  let basicToken;

  if (!authToken.toLowerCase().startsWith('basic ')) {
    return res.status(401).json({
      error: 'missing basic token'
    });
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
    return res.status(401).json({
      error: 'unauthorized request'
    });
  }

  try {
    const user = await req.app.get('db')('thingful_users')
      .where({ user_name: tokenUser })
      .first();

    if (!user || tokenPassword !== user.password) {
      return res.status(401).json({ error: 'unauthorized request' });
    }

    req.user = user;

    next();
  }
  catch (e) {
    next();
  }
}

module.exports = {
  requireAuth
};