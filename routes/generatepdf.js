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
    const { data: spd, error } = await supabase
      .from("spd")
      .select(`
        *,
        pegawai (
          nip,
          nama,
          pangkat,
          jabatan
        )
      `)
      .eq("nomor_spd", id)
      .single();

    if (error || !spd) {
      return res.sendStatus(404);
    }

    const spdFormatted = {
      ...spd,
      nip_pegawai: spd.pegawai.nip,
      nama: spd.pegawai.nama,
      pangkat: spd.pegawai.pangkat,
      jabatan: spd.pegawai.jabatan,
      tanggal_berangkat: formatTanggal(spd.tanggal_berangkat),
      tanggal_kembali: formatTanggal(spd.tanggal_kembali),
    };

    const html = await ejs.renderFile(
      path.join(__dirname, "../views/template.ejs"),
      { spdFormatted }
    );

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      scale: 0.8,
      margin: {
        top: "6mm",
        bottom: "0mm",
        left: "6mm",
        right: "6mm",
      },
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=spd-${id}.pdf`,
    });

    res.send(pdf);

    await browser.close();

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

export default router;