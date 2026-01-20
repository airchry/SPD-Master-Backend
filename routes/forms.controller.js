import supabase from "../supabase.js";

async function Save(req, res) {
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

  if (!userId) {
    return res.status(400).json({ error: "Pegawai tidak ada" });
  }

  try {
    const { data: nomorSpd, error } = await supabase.rpc(
      "get_next_nomor_spd",
      {
        p_kode_kantor: kode_kantor,
        p_tahun: tahun
      }
    );

    if (error) throw error;

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

    if (insertError) throw insertError;

    res.json({
      message: "SPD berhasil dibuat",
      nomorSPD: `SPD-${nomorSpd}/${kode_kantor}/${tahun}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal membuat SPD" });
  }
}

export default Save;
