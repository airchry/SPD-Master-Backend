import express from "express";
import cors from "cors";
import formRoutes from "./routes/forms.js";
import lookUpRoutes from "./routes/lookup.js";
import listSpd from "./routes/listspd.js";
import auth from "./routes/auth.js";
import generatepdf from "./routes/generatepdf.js";
import passport from "passport";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.SERVER_PORT || 3000;

app.use(cors({
  origin: "https://spdmasterfront.vercel.app",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "some-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none"
  }
}));


app.use(passport.initialize());
app.use(passport.session());


app.use("/api/forms", formRoutes);
app.use("/api/lookup", lookUpRoutes);
app.use("/api/listspd", listSpd);
app.use("/api", auth);
app.use("/api", generatepdf);

app.listen(port, () => {
  console.log(`Listening to port ${port}.`);
});
