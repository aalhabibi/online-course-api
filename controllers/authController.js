const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user");
const { validationResult } = require("express-validator");
const RefreshToken = require("../models/refreshToken");
const { generateTokens } = require("../utils/authUtils");

async function registerUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  await bcrypt.hash(req.body.password, 10, async (err, hash) => {
    if (err) console.log(err);
    else {
      const newUser = new User({
        fullName: req.body.fullName,
        email: req.body.email,
        password: hash,
      });
      if (req.body.role) newUser.role = req.body.role;

      newUser.save();
      res.status(200).json({ message: "User registered successfully" });
    }
  });
}

async function loginUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const loggingUser = await User.findOne({ email: req.body.email });

  if (!loggingUser.password) {
    return res.status(400).json({
      message:
        "This email is registered using social media. Please login using the platform registered from.",
    });
  }

  if (await bcrypt.compare(req.body.password, loggingUser.password)) {
    const tokens = await generateTokens(loggingUser);

    try {
      res.status(200).json({
        message: "Login Successful",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        fullName: loggingUser.fullName,
        role: loggingUser.role,
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  } else {
    res.status(400).json({ message: "Wrong Password" });
  }
}

async function refreshToken(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const refreshToken = await RefreshToken.findOne({
    token: req.body.refreshToken,
  });

  if (!refreshToken)
    return res.status(400).json({ message: "Invalid refresh token" });
  let userId;
  const jwtRefreshSecret = process.env.REFRESH_TOKEN_SECRET;

  jwt.verify(refreshToken.token, jwtRefreshSecret, (err, payload) => {
    if (err) {
      console.log(err);
      return res.status(403).json({ message: "Invalid token" });
    }

    userId = payload.id;
  });

  const user = await User.findOne({ _id: userId });

  const tokens = await generateTokens(user);

  try {
    res.status(200).json({
      message: "Token refreshed successfully",
      newAccessToken: tokens.accessToken,
      newRefreshToken: tokens.refreshToken,
      fullName: user.fullName,
      role: user.role,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

async function loginUserWithFacebook(req, res) {
  const loggingUser = await User.findOne({ email: req.user._json.email });
  const tokens = await generateTokens(loggingUser);

  try {
    res.status(200).json({
      message: "Login Successful",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      fullName: loggingUser.fullName,
      role: loggingUser.role,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

async function loginUserWithGoogle(req, res) {
  const loggingUser = await User.findOne({ email: req.user._json.email });

  const tokens = await generateTokens(loggingUser);

  try {
    res.status(200).json({
      message: "Login Successful",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      fullName: loggingUser.fullName,
      role: loggingUser.role,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  loginUserWithFacebook,
  loginUserWithGoogle,
};
