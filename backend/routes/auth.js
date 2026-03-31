const express = require("express");
const router = express.Router();
const { authenticateUser, issueToken } = require("../middleware/auth");

router.post("/login", (req, res) => {
  const username =
    typeof req.body.username === "string" ? req.body.username.trim() : "";
  const password =
    typeof req.body.password === "string" ? req.body.password : "";

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "Usuario y contraseña son obligatorios",
    });
  }

  const user = authenticateUser(username, password);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Credenciales inválidas",
    });
  }

  const token = issueToken(user);

  return res.json({
    success: true,
    data: {
      token,
      user: {
        username: user.username,
        role: user.role,
      },
    },
  });
});

module.exports = router;
