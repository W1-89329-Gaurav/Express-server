const jwt = require("jsonwebtoken");
const JWT_SECRET = "Sunbeam@DMCFeb2025"; 

function createToken(user) {
  const payload = { id: user.id };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
  return token;
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    console.log("token verification failed:", err);
    return null;
  }
}


function jwtAuth(req, resp, next) {

  const nonProtectedUrls = ["/user/signin", "/user/signup"];
  if (nonProtectedUrls.indexOf(req.url) >= 0) {
    next();
    return;
  }

  if (!req.headers.authorization)
    resp.status(403).send("Unauthoized Access - No authorization header");

  const [bearer, token] = req.headers.authorization.split(" ");
  const decoded = verifyToken(token);
  //console.log("incoming user token:", decoded);
  if (!decoded) resp.status(403).send("Unauthoized Access - Invalid token");
  else {
    
    req.user = { id: decoded.id };
    next();
  }
}

module.exports = {
  createToken,
  jwtAuth,
};
