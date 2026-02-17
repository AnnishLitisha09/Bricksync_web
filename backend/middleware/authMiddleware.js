const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header)
    return res.status(401).json({ message: "Authorization header missing" });

  if (!header.startsWith("Bearer "))
    return res.status(401).json({ message: "Invalid token format" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userid: decoded.userid,
      email: decoded.email,
    };

    next();

  } catch (err) {
    return res.status(403).json({ message: "Token expired or invalid" });
  }
};
