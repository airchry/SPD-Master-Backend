import { Router } from "express";
import supabase from "../supabase.js";
import PDFDocument from "pdfkit";

const router = Router();

/* ===============================
   Helper: format tanggal Indonesia
================================ */
function formatTanggal(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ===============================
   GET PDF SPD
================================ */
router.get("/spd/:id", async (req, res) => {
  try {
    const { id } = req.params;

    /* ===== 1️⃣ Ambil SPD ===== */
    const { data: spd, error } = await supabase
      .from("spd")
      .select("*")
      .eq("nomor_spd", id)
      .single();

    if (error || !spd) {
      return res.status(404).json({ message: "SPD not found" });
    }

    /* ===== 2️⃣ Ambil Pegawai (optional) ===== */
    let pegawai = null;
    if (spd.user_id) {
      const { data } = await supabase
        .from("pegawai")
        .select("nip, nama, pangkat, jabatan")
        .eq("id", spd.user_id)
        .maybeSingle();

      pegawai = data;
    }

    /* ===== 3️⃣ Bentuk spdFormatted ===== */
    const spdFormatted = {
      nomor_spd: spd.nomor_spd,
      nama: pegawai?.nama ?? "",
      nip: pegawai?.nip ?? "",
      pangkat: pegawai?.pangkat ?? "",
      jabatan: pegawai?.jabatan ?? "",
      nama_kegiatan: spd.nama_kegiatan,
      tempat_tujuan: spd.tempat_tujuan,
      lama_perjalanan: spd.lama_perjalanan,
      tanggal_berangkat: formatTanggal(spd.tanggal_berangkat),
      tanggal_kembali: formatTanggal(spd.tanggal_kembali),
    };

    /* ===== 4️⃣ Header Response ===== */
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="spd-${id}.pdf"`
    );

    /* ===== 5️⃣ Generate PDF ===== */
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    // ===== HEADER =====
    doc
      .fontSize(14)
      .text("SURAT PERJALANAN DINAS", { align: "center" });
    doc
      .fontSize(10)
      .text("PEMERINTAH KABUPATEN / KOTA XXXXX", { align: "center" });
    doc.moveDown(2);

    // ===== DATA UTAMA =====
    doc.fontSize(11);
    doc.text(`Nomor SPD       : ${spdFormatted.nomor_spd}`);
    doc.text(`Nama            : ${spdFormatted.nama}`);
    doc.text(`NIP             : ${spdFormatted.nip}`);
    doc.text(`Pangkat/Jabatan : ${spdFormatted.pangkat} / ${spdFormatted.jabatan}`);
    doc.moveDown();

    // ===== DATA PERJALANAN =====
    doc.text(`Kegiatan        : ${spdFormatted.nama_kegiatan}`);
    doc.text(`Tujuan          : ${spdFormatted.tempat_tujuan}`);
    doc.text(`Lama Perjalanan : ${spdFormatted.lama_perjalanan} hari`);
    doc.text(
      `Tanggal         : ${spdFormatted.tanggal_berangkat} s.d ${spdFormatted.tanggal_kembali}`
    );

    doc.moveDown(4);

    // ===== TANDA TANGAN =====
    doc.text("Pejabat Pembuat Komitmen,", { align: "right" });
    doc.moveDown(4);
    doc.text("( ____________________ )", { align: "right" });

    doc.end();

  } catch (err) {
    console.error("PDFKit error:", err);
    res.status(500).json({ message: "PDF generation failed" });
  }
});

export default router;
