import express from "express";
import Save from "./forms.controller.js";

const router = express.Router();

router.post("/save", Save);

export default router;
