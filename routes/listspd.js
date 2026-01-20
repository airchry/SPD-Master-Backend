import { Router } from "express";
import supabase from "../supabase.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("spd")
      .select(`
        nomor_spd,
        nama_kegiatan,
        tanggal_berangkat,
        tanggal_kembali,
        pegawai (
          id,
          nama,
          nip
        )
      `)
      .order("nomor_spd", { ascending: true });

    if (error) throw error;

    const result = data.map(row => ({
      id: row.pegawai.id,
      nama: row.pegawai.nama,
      nip: row.pegawai.nip,
      nomor_spd: row.nomor_spd,
      nama_kegiatan: row.nama_kegiatan,
      tanggal_berangkat: row.tanggal_berangkat,
      tanggal_kembali: row.tanggal_kembali,
    }));

    return res.json(result);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
});

export default router;
