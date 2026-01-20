import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Router } from "express";
import supabase from "../supabase.js";

const router = Router();

router.post("/login", passport.authenticate("local"), (req, res) => {
  console.log("Login hit!");

  res.json({
    success: true,
    user: req.user,
  });
});

router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

router.get("/me", (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" })
    }
    res.json(req.user);
})

passport.use(new LocalStrategy(
  async (username, password, cb) => {
    try {
      const { data: user, error } = await supabase
      .from("logindata")
      .select("username, password")
      .eq("username", username)
      .single();

      if (error || !user) {
        return cb(null, false, { message: 'Incorrect username.' });
      }

      if (password !== user.password) {
        return cb(null, false, { message: 'Incorrect password.' });
      }

      return cb(null, user);
    } catch (err) {
      return cb(err);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.username));

passport.deserializeUser(async (username, done) => {
  try {
    const { data: user, error } = await supabase
      .from("logindata")
      .select("*")
      .eq("username", username)
      .single();
    if (error) return done(error);
    done(null, user);
  } catch (err) {
    done(err);
  }
});


export default router;