import { Router } from "express";
import supabase from "../supabase.js";
import PDFDocument from "pdfkit";

const router = Router();

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

    const spdFormatted = {
      nomor_spd: spd.nomor_spd,
      nama: spd.nama ?? "",
      nip: spd.nip ?? "",
      nama_kegiatan: spd.nama_kegiatan ?? "",
      tanggal_berangkat: formatTanggal(spd.tanggal_berangkat),
      tanggal_kembali: formatTanggal(spd.tanggal_kembali),
    };

    // 🔑 OPEN PDF DI TAB (INLINE)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="spd-${id}.pdf"`
    );

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    doc.fontSize(14).text("SURAT PERJALANAN DINAS", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(11);
    doc.text(`Nomor SPD : ${spdFormatted.nomor_spd}`);
    doc.text(`Nama      : ${spdFormatted.nama}`);
    doc.text(`NIP       : ${spdFormatted.nip}`);
    doc.text(`Kegiatan  : ${spdFormatted.nama_kegiatan}`);
    doc.text(
      `Tanggal   : ${spdFormatted.tanggal_berangkat} s.d ${spdFormatted.tanggal_kembali}`
    );

    doc.end();

  } catch (err) {
    console.error("PDFKit ERROR:", err);
    res.status(500).json({ message: "PDF generation failed" });
  }
});

export default router;
