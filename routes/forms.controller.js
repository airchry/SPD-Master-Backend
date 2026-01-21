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
      nipPPK,
      namaKepala,
      nipKepala
    } = req.body;

    const kode_kantor = "KPP.0503";
    const tahun = new Date().getFullYear();

    // 1️⃣ Basic validation
    if (!userId) return res.status(400).json({ error: "Pegawai tidak ada" });

    // 2️⃣ Calculate next SPD number
    const { data: lastSPD, error: lastError } = await supabase
      .from("spd")
      .select("nomor_spd")
      .eq("kode_kantor", kode_kantor)
      .eq("tahun", tahun)
      .order("nomor_spd", { ascending: false })
      .limit(1);

    if (lastError) {
      console.error("Error fetching last SPD:", lastError);
      return res.status(500).json({ error: "Gagal menghitung nomor SPD" });
    }

    const nomorSpd = (lastSPD?.[0]?.nomor_spd ?? 0) + 1;

    // 3️⃣ Insert into SPD table including created_at
    const { data: insertedData, error: insertError } = await supabase
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
        nip_ppk: nipPPK,
        nama_kepala: namaKepala,
        nip_kepala: nipKepala,
        kode_kantor,
        tahun,
        created_at: new Date().toISOString() // explicitly include created_at
      })
      .select(); // returns the inserted row including created_at

    if (insertError) {
      console.error("Error inserting SPD:", insertError);
      return res.status(500).json({ error: "Gagal menyimpan SPD" });
    }

    // 4️⃣ Success response
    const createdRow = insertedData[0];
    return res.json({
      message: "SPD berhasil dibuat",
      nomorSPD: `SPD-${nomorSpd}/${kode_kantor}/${tahun}`,
      createdAt: createdRow.created_at
    });

  } catch (err) {
    console.error("SAVE SPD ERROR:", err);
    return res.status(500).json({ error: "Terjadi kesalahan saat menyimpan SPD" });
  }
}

export default Save;
