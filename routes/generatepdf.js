import path from "path";
import puppeteer from "puppeteer";
import { Router } from "express";
import pool from "../db/pool.js";
import ejs from "ejs";
import { fileURLToPath } from "url";

const router = Router();

// Fix __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/spd/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Get SPD data
    const result = await pool.query(
      "SELECT * FROM spd WHERE nomor_spd = $1",
      [id]
    );

    const spd = result.rows[0];
    if (!spd) {
      return res.sendStatus(404);
    }

    // 2️⃣ Render EJS to HTML
    const html = await ejs.renderFile(
      path.join(__dirname, "../views/template.ejs"),
      { spd } // always pass object
    );

    // 3️⃣ Launch Puppeteer (Railway safe)
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // 4️⃣ Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "6mm",
        bottom: "6mm",
        left: "6mm",
        right: "6mm",
      },
    });

    await browser.close();

    // 5️⃣ Send PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=spd-${id}.pdf`
    );

    res.send(pdf);

  } catch (err) {
    console.error("GENERATE PDF ERROR:", err);
    res.sendStatus(500);
  }
});

export default router;
