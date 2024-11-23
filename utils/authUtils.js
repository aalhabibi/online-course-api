const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/refreshToken");

async function generateTokens(loggingUser) {
  const accessToken = jwt.sign(
    {
      id: loggingUser._id,
      fullName: loggingUser.fullName,
      email: loggingUser.email,
      role: loggingUser.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "10m" }
  );
  const refreshToken = jwt.sign(
    {
      id: loggingUser._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  const refreshTokenDB = new RefreshToken({
    userId: loggingUser._id,
    token: refreshToken,
  });
  refreshTokenDB.save();
  return { accessToken, refreshToken };
}

module.exports = { generateTokens };
