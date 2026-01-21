import supabase from "../supabase.js";

async function Save(req, res) {
  try {
    const {
      userId,
      namaKeg,
      angkutan,
      tempatBerangkat,
      tempatTujuan,
      lamaPerjalanan,
      tanggalBerangkat,
      tanggalKembali,
      namaPPK,
      namaKepala
    } = req.body;

    const kode_kantor = "KPP.0503";
    const tahun = new Date().getFullYear();

    // 1️⃣ Validasi dasar
    if (!userId) {
      return res.status(400).json({ error: "Pegawai tidak ada" });
    }

    // 2️⃣ Ambil nomor SPD berikutnya (SAMA seperti kode pool.query lama)
    const { data, error } = await supabase.rpc("get_next_nomor_spd", {
      p_kode_kantor: kode_kantor,
      p_tahun: tahun
    });

    if (error) {
      console.error("RPC ERROR:", error);
      return res.status(500).json({ error: "Gagal mengambil nomor SPD" });
    }

    /**
     * IMPORTANT:
     * rpc Supabase biasanya return ARRAY
     * Contoh:
     * data = [{ get_next_nomor_spd: 5 }]
     */
    const nomorSpd =
      Array.isArray(data)
        ? data[0]?.get_next_nomor_spd ?? data[0]?.next_nomor
        : data;

    if (!nomorSpd) {
      return res.status(500).json({ error: "Nomor SPD tidak valid" });
    }

    // 3️⃣ Insert ke tabel spd
    const { error: insertError } = await supabase
      .from("spd")
      .insert({
        user_id: userId,
        nomor_spd: nomorSpd,
        nama_kegiatan: namaKeg,
        nama_angkutan: angkutan,
        tempat_berangkat: tempatBerangkat,
        tempat_tujuan: tempatTujuan,
        lama_perjalanan: lamaPerjalanan,
        tanggal_berangkat: tanggalBerangkat,
        tanggal_kembali: tanggalKembali,
        nama_ppk: namaPPK,
        nama_kepala: namaKepala,
        kode_kantor,
        tahun
      });

    if (insertError) {
      console.error("INSERT ERROR:", insertError);
      return res.status(500).json({ error: "Gagal menyimpan SPD" });
    }

    // 4️⃣ Response sukses
    return res.json({
      message: "SPD berhasil dibuat",
      nomorSPD: `SPD-${nomorSpd}/${kode_kantor}/${tahun}`
    });

  } catch (err) {
    console.error("SAVE SPD ERROR:", err);
    return res.status(500).json({
      error: "Terjadi kesalahan saat menyimpan SPD"
    });
  }
}

export default Save;