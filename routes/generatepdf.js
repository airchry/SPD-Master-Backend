import path from "path";
import puppeteer from "puppeteer";
import { Router } from "express";
import supabase from "../supabase.js";
import ejs from "ejs";
import { fileURLToPath } from "url";

const router = Router();

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
  const { id } = req.params;

  try {
    // 1️⃣ Ambil data SPD (SAMA seperti pool.query lama)
    const { data: spd, error } = await supabase
      .from("spd")
      .select("*")
      .eq("nomor_spd", id)
      .maybeSingle();

    if (error || !spd) {
      console.error("SPD NOT FOUND:", error);
      return res.sendStatus(404);
    }

    // 2️⃣ Ambil data pegawai (query TERPISAH)
    let pegawai = null;

    if (spd.user_id) {
      const { data, error } = await supabase
        .from("pegawai")
        .select("nip, nama, pangkat, jabatan")
        .eq("id", spd.user_id)
        .maybeSingle();

      if (!error) {
        pegawai = data;
      }
    }

    // 3️⃣ Gabungkan & format (AMAN)
    const spdFormatted = {
      ...spd,
      nip_pegawai: pegawai?.nip ?? "",
      nama: pegawai?.nama ?? "",
      pangkat: pegawai?.pangkat ?? "",
      jabatan: pegawai?.jabatan ?? "",
      tanggal_berangkat: formatTanggal(spd.tanggal_berangkat),
      tanggal_kembali: formatTanggal(spd.tanggal_kembali),
    };

    // 4️⃣ Render EJS
    const html = await ejs.renderFile(("../views/template.ejs"),
      { spd: spdFormatted }
    );

    // 5️⃣ Generate PDF
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      scale: 0.8,
      margin: {
        top: "6mm",
        bottom: "6mm",
        left: "6mm",
        right: "6mm",
      },
    });

    await browser.close();

    // 6️⃣ Kirim PDF
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
