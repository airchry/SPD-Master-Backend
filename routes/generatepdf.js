import path from "path";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { Router } from "express";
import supabase from "../supabase.js";
import ejs from "ejs";
import { fileURLToPath } from "url";

const router = Router();

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatTanggal(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

router.get("/spd/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: spd, error } = await supabase
      .from("spd")
      .select("*")
      .eq("nomor_spd", id)
      .single();

    if (error || !spd) {
      return res.status(404).json({ message: "SPD not found" });
    }

    let html;
    try {
      html = await ejs.renderFile(
        path.join(__dirname, "../views/template.ejs"),
        { spdFormatted: spd }
      );
    } catch (e) {
      console.error("EJS ERROR:", e);
      return res.status(500).json({ message: "EJS render failed" });
    }

    const executablePath =
      (await chromium.executablePath()) || "/usr/bin/chromium-browser";

    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="spd-${id}.pdf"`
    );

    res.end(pdf);

  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});


export default router;
