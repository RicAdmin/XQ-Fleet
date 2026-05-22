import { LEGAL_COMPANY } from '#/lib/legal/company'
import { h2, p, ul } from '#/lib/legal/sections'
import type { LegalLocaleContent } from '#/lib/legal/types'

export const termsMsLocale: LegalLocaleContent = {
  code: 'ms',
  label: 'Bahasa Malaysia',
  title: 'Terma & Syarat Laman Web',
  documentLabel: 'Dokumen 1: Terma & Syarat Laman Web',
  companyIntro: [
    'Dikendalikan oleh Xiao Qiang Holidays Sdn Bhd',
    `No. Pendaftaran Syarikat ${LEGAL_COMPANY.registrationNo}`,
    `${LEGAL_COMPANY.kpkLn}  |  ${LEGAL_COMPANY.ma}`,
    '26 & 28, Tingkat 1, Jalan Pandak Mayah 4, Mukim Kuah, 07000 Langkawi, Kedah, Malaysia',
  ],
  footerText: `Soalan? Hubungi ${LEGAL_COMPANY.name} di ${LEGAL_COMPANY.address}. Laman web: ${LEGAL_COMPANY.website}`,
  sections: [
    h2('1. Pengenalan'),
    p(
      'Terma dan Syarat ini ("Syarat") mengawal penggunaan laman web, aplikasi mudah alih, sistem tempahan, dan perkhidmatan berkaitan yang dikendalikan oleh Xiao Qiang Holidays Sdn Bhd (No. Pendaftaran Syarikat 201301017811), berniaga sebagai XQ Car Rental ("Syarikat", "kami", atau "kita").',
    ),
    p(
      'Dengan mewujudkan akaun, menghantar tempahan, membuat pembayaran, atau menggunakan perkhidmatan kami, anda ("Pelanggan", "anda") mengesahkan bahawa anda telah membaca, memahami, dan bersetuju untuk terikat secara undang-undang dengan Syarat ini. Jika anda tidak setuju, anda hendaklah serta-merta menghentikan penggunaan Platform.',
    ),
    p(
      'Syarat ini terpakai kepada transaksi laman web sahaja. Syarat tambahan dalam Kontrak Sewa Kenderaan terpakai pada titik penyerahan kenderaan dan membentuk perjanjian terikat yang berasingan.',
    ),
    h2('2. Definisi'),
    p('Dalam Syarat ini, definisi berikut terpakai:'),
    ul(
      '"Syarikat" bermaksud Xiao Qiang Holidays Sdn Bhd, termasuk anak syarikatnya, syarikat bersekutu, pegawai, pekerja, ejen, kontraktor, dan rakan kongsi armada.',
      '"Pelanggan" bermaksud mana-mana orang atau entiti mengakses Platform, membuat tempahan, atau menggunakan mana-mana perkhidmatan yang disediakan oleh Syarikat.',
      '"Kenderaan" bermaksud mana-mana kenderaan motor yang disewa, dibekalkan, atau dikoordinasikan oleh Syarikat, termasuk kenderaan milik rakan kongsi armada pihak ketiga.',
      '"Tempahan" bermaksud mana-mana tempahan yang dihantar melalui Platform, sama ada disahkan, menunggu, atau ditolak.',
      '"Platform" bermaksud laman web Syarikat, sistem tempahan, aplikasi, saluran komunikasi, dan infrastruktur berkaitan.',
      '"Kontrak Sewaan" bermaksud perjanjian sewaan kenderaan berasingan yang dilaksanakan pada titik penyerahan kenderaan.',
      '"Tempoh Sewaan" bermaksud tempoh antara masa pengambilan yang dipersetujui dan masa pulangan yang dipersetujui seperti dinyatakan dalam pengesahan tempahan.',
    ),
    h2('3. Kelayakan'),
    p('Dengan membuat tempahan, anda mewakili dan menjamin bahawa:'),
    ul(
      'Anda berumur sekurang-kurangnya dua puluh satu (21) tahun.',
      'Anda telah memegang lesen memandu yang sah untuk sekurang-kurangnya satu (1) tahun.',
      'Lesen memandu anda diiktiraf di bawah undang-undang Malaysia, atau anda memiliki Permit Memandu Antarabangsa (IDP) yang sah bersama lesen asal anda.',
      'Anda mempunyai kapasiti undang-undang untuk mengikatkan diri kepada perjanjian.',
      'Anda tidak pernah dibatalkan hak memandu oleh mana-mana mahkamah, pihak berkuasa, atau syarikat insurans.',
      'Semua maklumat yang anda serahkan adalah benar, tepat, terkini, dan lengkap.',
    ),
    p(
      'Pemandu dari luar negara secara mutlak bertanggungjawab untuk memastikan pematuhan kepada undang-undang jalan raya Malaysia dan keperluan pengiktirafan lesen. Syarikat berhak menolak perkhidmatan jika kelayakan tidak dapat disahkan semasa penyerahan kenderaan.',
    ),
    h2('4. Bentuk Perkhidmatan'),
    p(
      'Syarikat beroperasi sebagai pengendali sewaan kenderaan, penyedia perkhidmatan pelancongan, dan platform tempahan. Sesetengah kenderaan mungkin dibekalkan oleh rakan kongsi armada pihak ketiga di bawah koordinasi Syarikat.',
    ),
    p(
      'Imej, perihalan, spesifikasi, warna, dan ciri kenderaan yang dipaparkan di Platform adalah untuk ilustrasi sahaja dan tidak membentuk jaminan atau jaminan khusus bagi unit tertentu yang akan anda terima.',
    ),
    p(
      'Syarikat berhak menggantikan kenderaan yang ditempah dengan kenderaan kategori sama setara atau lebih tinggi tanpa caj tambahan. Jika tiada kenderaan setara tersedia, bayaran balik penuh akan ditawarkan.',
    ),
    h2('5. Pembentukan dan Penerimaan Tempahan'),
    p(
      'Permohonan tempahan yang dihantar melalui Platform tidak membentuk penerimaan automatik. Tempahan menjadi kontrak mengikat hanya selepas kesemua perkara berikut:',
    ),
    ul(
      'Pengesahan pembayaran yang berjaya.',
      'Pengesahan identiti (di mana diperlukan).',
      'Pengeluaran pengesahan tempahan secara bertulis oleh Syarikat melalui e-mel atau cara elektronik lain.',
    ),
    p(
      'Syarikat berhak untuk menolak, membatalkan, atau mengubah mana-mana tempahan mengikut budi bicara mutlaknya, termasuk atas sebab penipuan disyaki, ketidakteraturan pembayaran, kesilapan harga, ketiadaan kenderaan, kebimbangan keselamatan, atau sekatan operasi. Dalam kes sedemikian, Pelanggan akan dimaklumkan dan mana-mana pembayaran yang dibuat akan dikembalikan sepenuhnya.',
    ),
    h2('6. Harga, Cukai, dan Pembayaran'),
    p(
      'Semua harga dinyatakan dalam Ringgit Malaysia (MYR) dan termasuk Cukai Jualan dan Perkhidmatan (SST) di mana terpakai, melainkan dinyatakan sebaliknya.',
    ),
    p(
      'Harga tertakluk kepada ketersediaan, pelarasan bermusim, dan harga dinamik. Syarikat berhak membetulkan kesilapan harga, kesilapan taip, atau kerosakan sistem pada bila-bila masa, termasuk selepas tempahan dihantar tetapi sebelum pengesahan.',
    ),
    p('Bayaran yang diproses melalui Platform mungkin termasuk:'),
    ul(
      'Caj sewaan bagi Tempoh Sewaan yang dipersetujui.',
      'Deposit keselamatan yang boleh dikembalikan.',
      'Caj penghantaran atau pengumpulan.',
      'Yuran pentadbiran atau pemprosesan.',
      'Tambahan pilihan seperti yuran pemandu tambahan atau sewaan tempat duduk kanak-kanak.',
    ),
    p(
      'Caj yang timbul semasa atau selepas Tempoh Sewaan (termasuk kerosakan, saman jalan raya, caj tol, ketidakpadanan bahan api, pembersihan, dan yuran lewat pulangan) dikawal oleh Kontrak Sewaan dan boleh dikenakan kepada kaedah pembayaran Pelanggan yang direkod.',
    ),
    h2('7. Deposit Keselamatan dan Pra-otorisasi'),
    p(
      'Deposit keselamatan yang boleh dikembalikan atau pra-otorisasi kad mungkin diperlukan sebelum penyerahan kenderaan. Amaun akan didedahkan dalam pengesahan tempahan atau pada titik penyerahan.',
    ),
    p('Pelanggan membenarkan Syarikat untuk memotong atau memulihkan daripada deposit amaun yang berkaitan dengan:'),
    ul(
      'Kerosakan kenderaan yang tidak dilindungi insurans.',
      'Jumlah lebih insurans (excess insurans).',
      'Pencemaran merokok atau pembersihan dalaman di luar haus lalus biasa.',
      'Aksesori atau kelengkapan yang hilang.',
      'Kekurangan bahan api dan caj pentadbiran penambahan bahan api.',
      'Saman jalan raya, denda parkir, dan caj tol.',
      'Kerugian hasil sewaan semasa masa henti kenderaan yang disebabkan oleh kerosakan yang boleh diattribusikan kepada Pelanggan, dikira mengikut kadar sewaan harian dan dihadkan kepada empat belas (14) hari.',
    ),
    p(
      'Garis masa pelepasan deposit bergantung kepada penerbit kad Pelanggan dan mungkin mengambil masa lima (5) hingga tiga puluh (30) hari bekerja selepas Tempoh Sewaan tamat dan penyesuaian akhir lengkap.',
    ),
    h2('8. Kod Promosi dan Diskaun'),
    p(
      'Kod promosi, baucar, dan diskaun dikeluarkan mengikut budi bicara mutlak Syarikat dan tertakluk kepada terma khusus setiap promosi.',
    ),
    p('Syarikat berhak untuk:'),
    ul(
      'Mengubah, menggantung, atau menamatkan promosi tanpa notis terlebih dahulu.',
      'Menolak kod yang digunakan dengan tidak sah.',
      'Membalikkan diskaun yang timbul daripada penyalahgunaan sistem atau penggunaan penipuan.',
      'Membatalkan tempahan yang melibatkan aktiviti promosi penipuan.',
    ),
    p('Promosi tidak bernilai tunai, tidak boleh dipindah milik, dan tidak boleh digabungkan melainkan dinyatakan dengan jelas.'),
    h2('9. Akaun Pelanggan'),
    p(
      'Di mana Platform menawarkan penciptaan akaun, anda bertanggungjawab untuk mengekalkan kerahsiaan kelayakan log masuk anda dan bagi semua aktiviti yang dilakukan di bawah akaun anda.',
    ),
    p(
      'Anda hendaklah memaklumkan Syarikat dengan segera tentang mana-mana akses tanpa kebenaran. Syarikat tidak bertanggungjawab atas kerugian yang timbul daripada kegagalan anda menjaga keselamatan akaun.',
    ),
    h2('10. Had Liabiliti'),
    p('Sejauh mana dibenarkan oleh undang-undang Malaysia, Syarikat mengecualikan liabiliti bagi:'),
    ul(
      'Kerugian tidak langsung, sampingan, atau akibat.',
      'Kehilangan keuntungan, peluang perniagaan, atau simpanan yang dijangkakan.',
      'Perjanjian pelancongan terlepas, penerbangan, feri, atau penginapan.',
      'Tekanan emosi atau kerugian reputasi.',
      'Kehilangan data atau gangguan perkhidmatan.',
    ),
    p(
      'Di mana liabiliti tidak boleh dikecualikan di bawah undang-undang yang terpakai (termasuk untuk kecederaan peribadi atau kematian disebabkan kecuaian), jumlah agregat liabiliti Syarikat tidak boleh melebihi jumlah keseluruhan yang dibayar oleh Pelanggan bagi tempahan berkenaan.',
    ),
    p(
      'Tiada apa-apa dalam Syarat ini menghadkan mana-mana hak yang tidak boleh dihad secara sah di bawah Akta Perlindungan Pengguna 1999 (Malaysia).',
    ),
    h2('11. Ganti Rugi'),
    p('Anda bersetuju untuk menanggung ganti rugi, mempertahan, dan membebaskan Syarikat daripada semua tuntutan, kerugian, kerosakan, penalti, kos, dan yuran guaman yang timbul daripada:'),
    ul(
      'Pelanggaran anda terhadap Syarat ini atau Kontrak Sewaan.',
      'Kelakuan penipuan atau salah nyata.',
      'Penyalahgunaan kenderaan, kecuaian, atau memandu tanpa kebenaran.',
      'Pelanggaran undang-undang yang dilakukan semasa Tempoh Sewaan.',
      'Kecederaan atau kerosakan kepada pihak ketiga oleh tindakan atau kecuaian anda.',
    ),
    h2('12. Force Majeure'),
    p(
      'Syarikat tidak bertanggungjawab atas sebarang kegagalan atau kelewatan dalam prestasi yang timbul daripada peristiwa di luar kawalan munasabahnya, termasuk bencana alam, banjir, pandemik, sekatan kerajaan, kekecohan awam, gangguan feri atau pengangkutan, kegagalan pembekal, atau insiden siber.',
    ),
    p(
      'Dalam peristiwa force majeure, Syarikat akan membuat usaha munasabah untuk menjadualkan semula tempahan atau mengeluarkan bayaran balik di mana penjadualan semula tidak praktikal.',
    ),
    h2('13. Komunikasi Elektronik'),
    p(
      'Anda bersetuju bahawa rekod elektronik, e-mel, mesej WhatsApp, pengakuan dalam talian, tandatangan digital, dan dokumen yang dimuat naik membentuk komunikasi undang-undang yang sah dan perjanjian yang boleh dikuatkuasakan di bawah Akta Perdagangan Elektronik 2006 dan Akta Tandatangan Digital 1997 (Malaysia).',
    ),
    p('Rekod digital yang disimpan oleh Syarikat boleh digunakan sebagai bukti dalam mana-mana pertikaian atau prosiding penguatkuasaan.'),
    h2('14. Hartanah Intelek'),
    p(
      'Semua kandungan di Platform, termasuk teks, grafik, logo, imej, fotografi, dan perisian, dimiliki oleh atau dilesen kepada Syarikat dan dilindungi di bawah undang-undang hak cipta dan tanda dagangan Malaysia serta antarabangsa.',
    ),
    p(
      'Anda tidak boleh menyalin, menghasilkan semula, mengubah suai, mengedar, atau mengeksploit secara komersial mana-mana kandungan daripada Platform tanpa persetujuan bertulis terlebih dahulu daripada Syarikat.',
    ),
    h2('15. Pembekal Pihak Ketiga'),
    p(
      'Syarikat boleh mendapatkan kenderaan atau perkhidmatan daripada rakan kongsi armada dan pengendali pihak ketiga. Walaupun Syarikat menggunakan penjagaan munasabah dalam memilih rakan kongsi, ia tidak bertanggungjawab atas kegagalan operasi pembekal, isu mekanikal di luar kawalan munasabah, atau tindakan atau kecuaian pihak ketiga.',
    ),
    h2('16. Undang-Undang Mentadbir dan Bidang Kuasa'),
    p(
      'Syarat ini hendaklah ditadbir oleh dan ditafsirkan mengikut undang-undang Malaysia. Mana-mana pertikaian yang timbul daripada atau berkaitan dengan Syarat ini atau penggunaan Platform hendaklah tertakluk kepada bidang kuasa eksklusif mahkamah Malaysia.',
    ),
    h2('17. Keterpisahan dan Lepasan'),
    p(
      'Jika mana-mana peruntukan dalam Syarat ini dianggap tidak sah atau tidak boleh dikuatkuasakan, peruntukan selebihnya akan terus berkuat kuasa penuh.',
    ),
    p(
      'Kegagalan Syarikat untuk menguatkuasakan mana-mana peruntukan tidak membentuk lepasan terhadap peruntukan tersebut atau mana-mana hak atau remedi lain.',
    ),
    h2('18. Pindaan'),
    p(
      'Syarikat berhak meminda Syarat ini pada bila-bila masa. Perubahan material akan dimaklumkan melalui Platform atau melalui e-mel. Penggunaan Platform yang berterusan selepas pindaan berkuat kuasa merupakan penerimaan Syarat yang disemak.',
    ),
    p('Setiap versi Syarat ini dikenalpasti mengikut tarikh kuat kuasa. Versi yang berkuat kuasa pada masa tempahan mentadbir tempahan tersebut.'),
    h2('19. Hubungan'),
    p('Untuk pertanyaan, aduan, atau notis berkaitan Syarat ini, hubungi:'),
    p(`${LEGAL_COMPANY.name}\n${LEGAL_COMPANY.address}\nLaman web: ${LEGAL_COMPANY.website}`),
  ],
}
