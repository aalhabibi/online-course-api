const express = require("express");

const {
  registerValidation,
  loginValidator,
  refreshTokinValidator,
} = require("../middleware/authValidators");

const {
  registerUser,
  loginUser,
  refreshToken,
  loginUserWithFacebook,
  loginUserWithGoogle,
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/tokenValidator");

const { User } = require("../models/user");

const passport = require("passport");

const FacebookStrategy = require("passport-facebook").Strategy;
const GoogleStrategy = require("passport-google-oauth2").Strategy;

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:3000/auth/facebook/callback",
      profileFields: ["first_name", "last_name", "email"],
      passReqToCallback: true,
    },
    async function (req, accessToken, refreshToken, profile, cb) {
      const user = await User.findOne({ email: profile._json.email });
      if (!user) {
        const newUser = new User({
          fullName: profile._json.first_name + " " + profile._json.last_name,
          email: profile._json.email,
        });
        if (req.body.role) newUser.role = req.body.role;

        newUser.save();
        console.log(newUser);
      }
      return cb(null, profile);
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
      passReqToCallback: true,
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
    },
    async function (req, accessToken, refreshToken, profile, cb) {
      const user = await User.findOne({ email: profile._json.email });
      if (!user) {
        const newUser = new User({
          fullName: profile._json.name,
          email: profile._json.email,
        });
        if (req.body.role) newUser.role = req.body.role;

        newUser.save();
        console.log(newUser);
      }
      return cb(null, profile);
      // console.log(profile);
    }
  )
);

const router = express.Router();

router.post("/register", registerValidation, async (req, res) => {
  await registerUser(req, res);
});

router.post("/login", loginValidator, async (req, res) => {
  await loginUser(req, res);
});

router.post("/refresh-token", refreshTokinValidator, async (req, res) => {
  await refreshToken(req, res);
});

router.get("/test", verifyToken, async (req, res) => {
  res.send(req.user);
});

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  async (req, res) => {
    await loginUserWithFacebook(req, res);
  }
);

router.get("/google", passport.authenticate("google"));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    await loginUserWithGoogle(req, res);
  }
);

module.exports = router;
