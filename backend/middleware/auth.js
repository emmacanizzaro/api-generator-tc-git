const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

function buildUsersFromEnv() {
  const users = [];

  const adminUser = process.env.AUTH_ADMIN_USER || "admin";
  const adminPass = process.env.AUTH_ADMIN_PASS || "change_me";
  users.push({ username: adminUser, password: adminPass, role: "admin" });

  const viewerUser = process.env.AUTH_VIEWER_USER;
  const viewerPass = process.env.AUTH_VIEWER_PASS;

  if (viewerUser && viewerPass) {
    users.push({ username: viewerUser, password: viewerPass, role: "viewer" });
  }

  return users;
}

function getUsers() {
  return buildUsersFromEnv();
}

function issueToken(user) {
  return jwt.sign(
    {
      sub: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function authenticateUser(username, password) {
  const users = getUsers();
  return users.find(
    (u) => u.username === username && u.password === password,
  );
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Token requerido",
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      username: payload.sub,
      role: payload.role,
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Token inválido o expirado",
    });
  }
}

function requireRole(allowedRoles) {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "No tiene permisos para esta operación",
      });
    }

    return next();
  };
}

module.exports = {
  authenticateUser,
  issueToken,
  requireAuth,
  requireRole,
};
