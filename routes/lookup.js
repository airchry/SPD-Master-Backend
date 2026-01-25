import { Router } from "express";
import supabase from "../supabase.js";

const router = Router();

router.get("/pegawai", async (req, res) => {
  const { namaPeg } = req.query;

  try {
    if (!namaPeg) {
      return res.status(400).json({ value: "" });
    }

    const { data, error } = await supabase
      .from("pegawai")
      .select("*")
      .ilike("nama", `%${namaPeg}%`)
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({ value: "" });
    }

    return res.json({ value: data[0] });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.get("/ppk", async (req, res) => {
  const { namaPPK } = req.query;

  try {
    if (!namaPPK) {
      return res.status(400).json({ value: "" });
    }

    const { data, error } = await supabase
      .from("pegawai")
      .select("*")
      .ilike("nama", `%${namaPPK}%`)
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({ value: "" });
    }

    return res.json({ value: data[0] });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
});


router.get("/kepala", async (req, res) => {
  const { namaKepala } = req.query;

  try {
    if (!namaKepala) {
      return res.status(400).json({ value: "" });
    }

    const { data, error } = await supabase
      .from("pegawai")
      .select("*")
      .ilike("nama", `%${namaKepala}%`)
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({ value: "" });
    }

    return res.json({ value: data[0] });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
});


router.get("/pilihpegawai", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("pegawai")
      .select("nama")
      .order("nama", { ascending: true });

    if (error) throw error;

    const unique = [...new Set(data.map(d => d.nama))]
      .map(nama => ({ nama }));

    res.json(unique);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/filterspd", async (req, res) => {
  try {
    const { namaPeg } = req.query;

    const { data: pegawai, error: pegError } = await supabase
      .from("pegawai")
      .select("id, nama, nip")
      .ilike("nama", `%${namaPeg}%`)
      .limit(1)
      .maybeSingle();

    if (pegError) throw pegError;
    if (!pegawai) {
      return res.status(404).json({ message: "Pegawai not found" });
    }

    const { data, error } = await supabase
      .from("spd")
      .select(`nomor_spd, nama_kegiatan, tanggal_berangkat, tanggal_kembali,
        pegawai:user_id (nip, nama)`
      )
      .eq("user_id", pegawai.id);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("FILTER SPD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});



export default router;
