import { LEGAL_COMPANY } from '#/lib/legal/company'
import { h2, p, signature, ul } from '#/lib/legal/sections'
import type { LegalLocaleContent } from '#/lib/legal/types'

export const rentalAgreementMsLocale: LegalLocaleContent = {
  code: 'ms',
  label: 'Bahasa Malaysia',
  title: 'Kontrak Sewaan Kenderaan',
  documentLabel: 'Dokumen 2: Kontrak Sewaan Kenderaan',
  companyIntro: [
    'Dikendalikan oleh Xiao Qiang Holidays Sdn Bhd',
    `No. Pendaftaran Syarikat ${LEGAL_COMPANY.registrationNo}`,
    `${LEGAL_COMPANY.kpkLn}  |  ${LEGAL_COMPANY.ma}`,
    '26 & 28, Tingkat 1, Jalan Pandak Mayah 4, Mukim Kuah, 07000 Langkawi, Kedah, Malaysia',
  ],
  footerText: `Soalan? Hubungi ${LEGAL_COMPANY.name} di ${LEGAL_COMPANY.address}. Laman web: ${LEGAL_COMPANY.website}`,
  sections: [
    h2('1. Pihak dan Permohonan'),
    p(
      'Kontrak Sewaan Kenderaan ini ("Kontrak") dimeterai antara Xiao Qiang Holidays Sdn Bhd (No. Pendaftaran Syarikat 201301017811), berniaga sebagai XQ Car Rental ("Syarikat"), dan penyewa yang dinamakan dalam pengesahan tempahan dan rekod penyerahan kenderaan ("Penyewa").',
    ),
    p(
      'Kontrak ini berkuat kuasa pada titik penyerahan kenderaan dan kekal berkuat kuasa sehingga Kenderaan dipulangkan kepada Syarikat dan penyesuaian akhir bagi caj selesai. Ia beroperasi sebagai tambahan kepada Terma & Syarat Laman Web dan mendahului sekiranya terdapat percanggahan berkenaan sewaan itu sendiri.',
    ),
    h2('2. Kelayakan Pemandu'),
    p('Penyewa dan mana-mana pemandu tambahan yang dibenarkan hendaklah:'),
    ul(
      'Berumur sekurang-kurangnya dua puluh satu (21) tahun.',
      'Memegang lesen memandu yang sah yang telah dikeluarkan sekurang-kurangnya satu (1) tahun.',
      'Memiliki Permit Memandu Antarabangsa (IDP) yang sah jika lesen dikeluarkan di luar Malaysia dan tidak dalam bahasa Inggeris.',
      'Menyerahkan lesen fizikal asal dan pengenalan bergambar daripada kerajaan (pasport atau MyKad) semasa penyerahan kenderaan.',
    ),
    p(
      'Hanya orang yang diisytiharkan dan diluluskan oleh Syarikat dibenarkan memandu Kenderaan. Membenarkan mana-mana orang tanpa kelulusan memandu membatalkan liputan insurans dan menjadikan Penyewa sepenuhnya bertanggungjawab atas sebarang kerugian atau kerosakan akibatnya.',
    ),
    h2('3. Tempoh Sewaan'),
    p(
      'Tempoh Sewaan bermula pada masa pengambilan yang dipersetujui dan tamat pada masa pulangan yang dipersetujui seperti dinyatakan dalam pengesahan tempahan.',
    ),
    p(
      'Caj sewaan dikira atas asas 24 jam dari masa pengambilan. Tempoh tangguh enam puluh (60) minit diberikan untuk lewat pulang. Pulangan selepas tempoh tangguh dikenakan seperti berikut:',
    ),
    ul(
      '61 minit hingga 4 jam lewat: 25% daripada kadar sewaan harian.',
      '4 hingga 8 jam lewat: 50% daripada kadar sewaan harian.',
      'Lebih 8 jam lewat: kadar sewaan harian penuh bagi setiap blok 24 jam.',
    ),
    p(
      'Lanjutan Tempoh Sewaan hendaklah diminta dan disahkan secara bertulis oleh Syarikat sekurang-kurangnya empat (4) jam sebelum masa pulangan berjadual. Kelulusan tertakluk kepada ketersediaan kenderaan.',
    ),
    h2('4. Pengambilan, Penghantaran, dan Pulangan'),
    p(
      'Lokasi piawai pengambilan dan pulangan adalah pejabat Syarikat di 26 & 28, Tingkat 1, Jalan Pandak Mayah 4, Mukim Kuah, 07000 Langkawi.',
    ),
    p(
      'Penghantaran dan pengumpulan di lokasi lain di Pulau Langkawi (termasuk lapangan terbang, terminal feri, dan hotel) boleh diatur tertakluk kepada ketersediaan dan caj yang berkenaan yang didedahkan semasa tempahan.',
    ),
    p('Pengambilan atau pulangan luar waktu perlu diatur terlebih dahulu dan tertakluk kepada yuran perkhidmatan luar waktu.'),
    p(
      'Kedua-dua pihak hendaklah menjalankan pemeriksaan bersama ke atas Kenderaan semasa penyerahan dan semasa pulangan. Penyewa digalakkan mengambil fotograf pada kedua-dua titik. Sebarang kerosakan tidak dicatat semasa penyerahan tetapi dikenal pasti semasa pulangan dianggap berlaku semasa Tempoh Sewaan melainkan Penyewa dapat menunjukkan sebaliknya.',
    ),
    h2('5. Sekatan Geografi (Langkawi Sahaja)'),
    p(
      'Kenderaan adalah semata-mata untuk kegunaan di dalam pulau Langkawi. Penyewa tidak boleh, dalam apa jua keadaan:',
    ),
    ul(
      'Mengangkut Kenderaan dengan feri, tongkang, atau apa-apa cara ke Semenanjung Malaysia atau pulau lain.',
      'Membenarkan Kenderaan dipandu ke atas mana-mana feri atau vesel.',
      'Membawa Kenderaan keluar daripada sempadan geografi Langkawi.',
    ),
    p('Sebarang pelanggaran fasal ini merupakan pelanggaran asas Kontrak ini. Penyewa akan bertanggungjawab untuk:'),
    ul(
      'Penalti RM 2,000 bagi setiap kejadian.',
      'Semua kos pemulihan yang ditanggung oleh Syarikat.',
      'Liabiliti penuh bagi sebarang kerosakan, kehilangan, atau kecurian Kenderaan semasa penggunaan tanpa kebenaran, dengan liputan insurans terbatal.',
      'Kerugian hasil sewaan semasa pemulihan.',
    ),
    h2('6. Penggunaan Yang Dibenarkan dan Dilarang'),
    p('Kenderaan hanya boleh digunakan untuk pengangkutan peribadi, bukan komersial, yang sah dalam Langkawi.'),
    p('Penyewa tidak boleh menggunakan Kenderaan untuk perkara berikut:'),
    ul(
      'Tujuan menyalahi undang-undang dalam apa jua bentuk.',
      'Perlumbaan, rali, ujian kelajuan, atau aktiviti sukan bermotor apa jua jenis.',
      'Pengangkutan penumpang komersial, perkhidmatan teksi, atau platform perkongsian kereta termasuk tetapi tidak terhad kepada Grab, AirAsia Ride, atau InDrive.',
      'Arahan memandu atau latihan memandu.',
      'Menunda mana-mana kenderaan, treler, atau objek.',
      'Membawa penumpang atau kargo yang melebihi kapasiti yang dinilai Kenderaan.',
      'Memandu luar jalan utama, termasuk memandu di pantai.',
      'Mengangkut bahan berbahaya, mudah terbakar, atau dilarang.',
      'Penyeludupan atau pemerdagangan, serta apa-apa aktiviti yang melanggar undang-undang Malaysia.',
      'Memandu di bawah pengaruh alkohol, dadah, atau sebarang bahan yang menjejaskan keupayaan memandu.',
    ),
    h2('7. Dasar Bahan Api'),
    p(
      'Kenderaan disediakan dengan tangki bahan api penuh dan hendaklah dipulangkan dengan tangki penuh jenis bahan api yang sama seperti yang dinyatakan pada rekod penyerahan.',
    ),
    p('Jika Kenderaan dipulangkan dengan kurang daripada tangki penuh, Penyewa akan dikenakan:'),
    ul(
      'Kos kekurangan pada harga runcit pam semasa.',
      'Yuran pentadbiran penambahan bahan api RM 50.',
    ),
    p(
      'Penggunaan gred bahan api yang salah adalah tanggungjawab penuh Penyewa, termasuk semua kos pembaikan, tunda, dan kehilangan hasil sewaan.',
    ),
    h2('8. Jarak Tempuh'),
    p(
      'Jarak tempuh tidak terhad dalam Langkawi untuk Tempoh Sewaan, tertakluk kepada sekatan geografi dalam Fasal 5.',
    ),
    h2('9. Tol, Touch \'n Go, dan Parkir'),
    p(
      'Penyewa bertanggungjawab atas semua caj tol, potongan tol elektronik, yuran parkir, dan penalti parkir yang ditanggung semasa Tempoh Sewaan.',
    ),
    p(
      'Di mana kad Touch \'n Go disediakan, Penyewa bertanggungjawab mengekalkan baki mencukupi dan untuk sebarang caj tol dipotong. Kad hendaklah dipulangkan pada akhir Tempoh Sewaan.',
    ),
    p(
      'Caj tol atau parkir tertunggak dikenal pasti selepas pulangan kenderaan akan dikenakan kepada kaedah pembayaran Penyewa, dengan yuran pentadbiran RM 50 bagi setiap transaksi.',
    ),
    h2('10. Saman Jalan Raya dan Denda'),
    p(
      'Penyewa sepenuhnya bertanggungjawab atas semua saman jalan raya, kompaun, dan denda dikeluarkan berkenaan Kenderaan semasa Tempoh Sewaan, tanpa mengira bila Syarikat dimaklumkan oleh pihak berkuasa berkenaan.',
    ),
    p(
      'Syarikat akan mengenakan jumlah asal saman ditambah yuran pemprosesan pentadbiran RM 50 bagi setiap saman. Penyewa mengekalkan hak untuk menyanggah saman secara langsung dengan pihak berkuasa pengeluar.',
    ),
    h2('11. Merokok, Haiwan Kesayangan, dan Kebersihan'),
    p('Merokok, penggunaan vape, dan penggunaan rokok elektronik di dalam Kenderaan adalah dilarang keras.'),
    p('Haiwan kesayangan tidak dibenarkan di dalam Kenderaan tanpa kelulusan bertulis terlebih dahulu.'),
    p('Caj bagi pelanggaran fasal ini:'),
    ul(
      'Merokok atau vape di dalam Kenderaan: RM 500 yuran pembersihan dan penghilang bau secara mendalam.',
      'Pengangkutan haiwan kesayangan tanpa kelulusan: RM 300 yuran pembersihan.',
      'Penkotoran berlebihan (pasir, lumpur, makanan, atau tumpahan cecair) memerlukan pembersihan profesional: RM 150 hingga RM 500 bergantung kepada keseriusan.',
    ),
    h2('12. Keadaan dan Penyelenggaraan Kenderaan'),
    p('Penyewa hendaklah:'),
    ul(
      'Menggunakan penjagaan munasabah dalam mengoperasikan dan menyimpan Kenderaan.',
      'Mematuhi semua undang-undang lalu lintas jalan raya Malaysia.',
      'Memantau penunjuk amaran pada papan pemuka dan berhenti memandu dengan segera jika lampu amaran menyala.',
      'Memeriksa minyak enjin, cecair pendingin, dan keadaan tayar bagi sewaan melebihi tujuh (7) hari.',
      'Hanya menggunakan gred bahan api yang ditetapkan semasa penyerahan.',
      'Mengunci Kenderaan dan menjamin semua tingkap ketika tidak dijaga.',
      'Tidak meninggalkan kunci dalam Kenderaan ketika tidak dijaga.',
    ),
    p(
      'Penyewa bertanggungjawab atas kerosakan disebabkan kecuaian terhadap kewajipan ini, termasuk kerosakan enjin akibat meneruskan memandu semasa lampu amaran menyala.',
    ),
    h2('13. Kemalangan, Kecurian, Kerosakan, dan Kerosakan Mekanikal'),
    p('Sekiranya kemalangan, kecurian, kerosakan, penyitaan, atau kerosakan, Penyewa mesti:'),
    ul(
      'Berhenti memandu serta-merta dan memastikan keselamatan semua orang.',
      'Memberitahu Syarikat melalui telefon dalam masa tiga puluh (30) minit daripada insiden.',
      'Membuat laporan polis dalam masa dua puluh empat (24) jam bagi apa-apa kemalangan, kecurian, atau kerosakan melibatkan pihak ketiga.',
      'Menjaga semua bukti, termasuk fotograf tempat kejadian, kenderaan terlibat, dan sebarang dokumentasi.',
      'Mendapatkan butiran hubungan dan insurans semua pihak terlibat.',
      'Tidak mengakui liabiliti atau membuat tawaran penyelesaian kepada mana-mana pihak.',
      'Tidak mengarahkan apa-apa pembaikan tanpa persetujuan bertulis Syarikat terlebih dahulu.',
      'Bekerjasama sepenuhnya dengan Syarikat, syarikat insurans, dan pihak berkuasa.',
    ),
    p(
      'Kegagalan mematuhi prosedur ini boleh mengakibatkan penafian liputan insurans dan dikenakan tanggungan kewangan penuh ke atas Penyewa.',
    ),
    h2('14. Insurans dan Liabiliti'),
    p(
      'Kenderaan diliputi oleh insurans motor pihak ketiga seperti dikehendaki di bawah undang-undang Malaysia. Liputan komprehensif dan opsyen Collision Damage Waiver (CDW), jika ditawarkan, tertakluk kepada terma pemberi insurans, deductible, serta jumlah lebihan yang didedahkan semasa tempahan.',
    ),
    p('Insurans TIDAK meliputi, dan Penyewa kekal bertanggungjawab sepenuhnya untuk:'),
    ul(
      'Kerosakan disebabkan memandu di bawah pengaruh alkohol atau dadah.',
      'Kerosakan disebabkan pemandu tanpa kelulusan.',
      'Kerosakan daripada memandu gila-gila, cuai, atau menyalahi undang-undang.',
      'Kerosakan tayar, rim, dan roda (tusukan, bahagian sisi, kerosakan kerb).',
      'Kerosakan cermin depan, tingkap, dan cermin sisi.',
      'Kerosakan bahagian bawah daripada memandu luar jalan utama, banjir air, atau langgar bump terlaju.',
      'Kerosakan pedalaman, kemasukan air, dan kerosakan akibat meninggalkan tingkap terbuka.',
      'Kerosakan semasa penggunaan geografi tanpa kelulusan (Fasal 5).',
      'Kehilangan barang persendirian dalam Kenderaan.',
      'Insiden kenderaan tunggal tanpa laporan polis.',
    ),
    p(
      'Penyewa bertanggungjawab atas jumlah lebih insurans yang didedahkan semasa tempahan bagi apa-apa kerugian yang dilindungi, tanpa mengira kesilapan.',
    ),
    h2('15. Kunci Terkunci, Kehilangan Kunci, dan Bantuan Tepi Jalan'),
    p('Asas bantuan tepi jalan untuk rosak mekanikal disertakan di dalam Langkawi semasa waktu perniagaan.'),
    p('Caj dikenakan untuk:'),
    ul(
      'Kunci hilang atau rosak: RM 500 hingga RM 2,500 bergantung pada model kenderaan.',
      'Bantuan kunci terkunci: RM 100 dalam waktu perniagaan, RM 200 luar waktu.',
      'Panggilan minyak salah jenis: kos menguras dan mengisi tambah RM 200 caj perkhidmatan.',
      'Panggilan tayar pecah akibat kerb atau lubang jalan: RM 150 caj perkhidmatan tambah kos penggantian tayar.',
    ),
    h2('16. Pemandu Tambahan, Tempat Duduk Kanak-Kanak, dan Aksesori'),
    p('Pemandu tambahan mesti diisytiharkan dan diluluskan sebelum memandu. Yuran pemandu tambahan mungkin dikenakan.'),
    p(
      'Tempat duduk kanak-kanak dan aksesori lain dibekalkan tertakluk kepada ketersediaan dan yuran sewaan yang berkenaan. Penyewa bertanggungjawab untuk pemasangan dan penggunaan yang betul serta bertanggungjawab ke atas kehilangan atau kerosakan.',
    ),
    h2('17. Pulangan Awal'),
    p(
      'Pulangan awal Kenderaan tidak memberikan hak kepada Penyewa untuk bayaran balik hari tidak terpakai melainkan dipersetujui secara bertulis terlebih dahulu.',
    ),
    h2('18. Pemerolehan Semula'),
    p('Syarikat boleh menyita semula Kenderaan tanpa notis sekiranya:'),
    ul(
      'Pelanggaran apa-apa terma material dalam Kontrak ini.',
      'Penggunaan geografi tanpa kebenaran disyaki.',
      'Penipuan atau identiti palsu disyaki.',
      'Tidak membayar sebarang jumlah tertunggak.',
      'Kenderaan digunakan dengan cara membahayakan keselamatan atau berisiko kerugian.',
    ),
    p('Semua kos pemerolehan semula dibayar oleh Penyewa.'),
    h2('19. Tandatangan dan Penerimaan'),
    p(
      'Dengan menandatangani rekod penyerahan kenderaan, Penyewa mengesahkan penerimaan Kontrak ini dan mengaku menerima Kenderaan dalam keadaan yang direkodkan.',
    ),
    signature(
      'Nama Penyewa: ______________________________________________',
      'No. KP / Pasport: ____________________________________________',
      'No. Lesen Memandu: ________________________________________',
      'Tandatangan: _______________________________________________',
      'Tarikh: _________________________________________________',
      '',
      'Bagi dan atas nama Xiao Qiang Holidays Sdn Bhd',
      'Wakil Diberi Kuasa: _______________________________________',
      'Tandatangan: _______________________________________________',
      'Tarikh: _________________________________________________',
    ),
  ],
}
