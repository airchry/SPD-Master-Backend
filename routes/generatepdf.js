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

    const { data, error } = await supabase
      .from("spd")
      .select(`
        nomor_spd,
        nama_kegiatan,
        tanggal_berangkat,
        tanggal_kembali,
        nama_angkutan,
        tempat_berangkat,
        tempat_tujuan,
        lama_perjalanan,
        nama_ppk,
        nip_ppk,
        nama_kepala,
        nip_kepala,
        pegawai:user_id (
          nip,
          nama,
          pangkat,
          jabatan
        )
      `)
      .eq("nomor_spd", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "SPD not found" });
    }

    const spdFormatted = {
      nomor_spd: data.nomor_spd,
      nama_kegiatan: data.nama_kegiatan,
      nama_angkutan: data.nama_angkutan,
      tempat_berangkat: data.tempat_berangkat,
      tempat_tujuan: data.tempat_tujuan,
      lama_perjalanan: data.lama_perjalanan,

      tanggal_berangkat: formatTanggal(data.tanggal_berangkat),
      tanggal_kembali: formatTanggal(data.tanggal_kembali),

      nama_ppk: data.nama_ppk,
      nip_ppk: data.nip_ppk,
      nama_kepala: data.nama_kepala,
      nip_kepala: data.nip_kepala,

      nip: data.pegawai?.nip ?? "",
      nama: data.pegawai?.nama ?? "",
      pangkat: data.pegawai?.pangkat ?? "",
      jabatan: data.pegawai?.jabatan ?? "",
    };

    const today = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const html = await ejs.renderFile(
      path.join(__dirname, "../views/template.ejs"),
      { spdFormatted, today }
    );

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

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="spd-${id}.pdf"`
    );
    res.end(pdf);

  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});

export default router;