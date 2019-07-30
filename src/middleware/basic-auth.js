async function requireAuth(req, res, next) {
  const authToken = req.get('Authorization') || '';
  let basicToken;

  if (!authToken.toLowerCase().startsWith('basic ')) {
    return res.status(401).json({
      error: 'Missing basic token.'
    });
  }
  else {
    basicToken = authToken.split(' ')[1];
    // console.log(basicToken);
  }

  const [tokenUser, tokenPassword] = Buffer
    .from(basicToken, 'base64')
    .toString()
    .split(':');


  // console.log(tokenUser, tokenPassword);

  if (!tokenUser || !tokenPassword) {
    return res.status(401).json({
      error: 'Unauthorized Request.'
    });
  }

  next();
}

module.exports = {
  requireAuth
};