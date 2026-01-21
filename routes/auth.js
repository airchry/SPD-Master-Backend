import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Router } from "express";
import supabase from "../supabase.js";

const router = Router();

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Passport error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (!user) {
      return res.status(401).json({
        message: info?.message || "Login failed",
      });
    }

    req.login(user, (err) => {
      if (err) {
        console.error("req.login error:", err);
        return res.status(500).json({ message: "Login error" });
      }

      res.json({
        success: true,
        user,
      });
    });
  })(req, res, next);
});

router.post("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy();
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
    console.log("Trying login for:", username);

    try {
      const { data: user, error } = await supabase
        .from("logindata")
        .select("username, password")
        .eq("username", username)
        .single();

      console.log("Supabase user:", user, "Error:", error);

      if (error || !user) {
        return cb(null, false, { message: 'Incorrect username.' });
      }

      if (password !== user.password) {
        console.log("Password mismatch:", password, user.password);
        return cb(null, false, { message: 'Incorrect password.' });
      }

      console.log("Login successful:", user);
      return cb(null, user);
    } catch (err) {
      console.error("LocalStrategy error:", err);
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