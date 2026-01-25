import path from "path";
import puppeteer from "puppeteer";
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

    // Render EJS
    const html = await ejs.renderFile(
      path.join(__dirname, "../views/template.ejs"),
      {
        spdFormatted: {
          ...spd,
          tanggal_berangkat: formatTanggal(spd.tanggal_berangkat),
          tanggal_kembali: formatTanggal(spd.tanggal_kembali),
        },
      }
    );

    // Launch Puppeteer (NORMAL)
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // Open in new tab (NOT download)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="spd-${id}.pdf"`
    );

    res.end(pdf);
  } catch (err) {
    console.error("PDF ERROR FULL:", err);
    res.status(500).json({
      message: "Failed to generate PDF",
      error: err.message,
    });
  }
});

export default router;