const AuthService = require('./auth-service');

async function requireAuth(req, res, next) {
  const missingToken = { error: 'missing bearer token' };
  const unauthorizedRequest = { error: 'unauthorized request' };
  const authToken = req.get('Authorization') || '';
  const db = req.app.get('db');
  let bearerToken;

  if (!authToken.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json(missingToken);
  }
  else {
    bearerToken = authToken.split(' ')[1];
  }

  try {
    const payload = AuthService.verifyJWT(bearerToken);

    try{
      const user = await AuthService.getUserByUserName(
        db,
        payload.sub
      );
  
      if (!user) {
        return res.status(401).json(unauthorizedRequest);
      }
  
      req.user = user;
      next();
    }
    catch(e) {
      console.error(e);
      next(e);
    }
    
  }
  catch (e) {
    res.status(401).json(unauthorizedRequest);
  }
}

module.exports = {
  requireAuth
};