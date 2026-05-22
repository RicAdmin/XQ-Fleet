import { LEGAL_COMPANY } from '#/lib/legal/company'
import { h2, h3, p, ul } from '#/lib/legal/sections'
import type { LegalLocaleContent } from '#/lib/legal/types'

export const privacyMsLocale: LegalLocaleContent = {
  code: 'ms',
  label: 'Bahasa Malaysia',
  title: 'Dasar Privasi',
  documentLabel: 'Dokumen 3: Dasar Privasi',
  companyIntro: [
    'Dikendalikan oleh Xiao Qiang Holidays Sdn Bhd',
    `No. Pendaftaran Syarikat ${LEGAL_COMPANY.registrationNo}`,
    `${LEGAL_COMPANY.kpkLn}  |  ${LEGAL_COMPANY.ma}`,
    '26 & 28, Tingkat 1, Jalan Pandak Mayah 4, Mukim Kuah, 07000 Langkawi, Kedah, Malaysia',
  ],
  footerText: `Soalan? Hubungi ${LEGAL_COMPANY.name} di ${LEGAL_COMPANY.address}. Laman web: ${LEGAL_COMPANY.website}`,
  sections: [
    h2('1. Tentang Dasar Ini'),
    p(
      'Dasar Privasi ini menerangkan bagaimana Xiao Qiang Holidays Sdn Bhd (No. Pendaftaran Syarikat 201301017811), berniaga sebagai XQ Car Rental ("Syarikat", "kami", atau "kita"), mengumpul, menggunakan, mendedahkan, dan melindungi data peribadi anda apabila anda menggunakan laman web, aplikasi mudah alih, dan perkhidmatan kami.',
    ),
    p(
      'Dasar ini hendaklah dibaca bersama Notis PDPA kami, yang menyatakan hak berkanun anda di bawah Akta Perlindungan Data Peribadi 2010 ("APDP").',
    ),
    h2('2. Maklumat Yang Kami Kumpul'),
    p(
      'Kami mengumpul data peribadi yang anda berikan secara langsung, data yang dihasilkan melalui penggunaan perkhidmatan kami, serta data daripada pihak ketiga di mana dibenarkan.',
    ),
    h3('2.1 Maklumat Yang Anda Berikan'),
    ul(
      'Nama penuh, jantina, tarikh lahir, dan kewarganegaraan.',
      'Dokumen pengenalan (pasport, MyKad, atau ID kerajaan lain).',
      'Butiran lesen memandu, termasuk Permit Memandu Antarabangsa jika berkenaan.',
      'Maklumat hubungan (alamat e-mel, nombor telefon, alamat pos).',
      'Maklumat pembayaran (butiran kad diproses melalui gerbang pembayaran patuh PCI; kami tidak menyimpan nombor kad penuh).',
      'Sejarah tempahan dan surat-menyurat khidmat pelanggan.',
      'Maklumat hubungan kecemasan jika disediakan.',
    ),
    h3('2.2 Maklumat Yang Dihasilkan Melalui Penggunaan Perkhidmatan'),
    ul(
      'Data GPS kenderaan dan telematik, termasuk lokasi, kelajuan, jarak perjalanan, dan peristiwa brek keras, di mana Kenderaan dilengkapi sistem sedemikian.',
      'Fotograf diambil semasa penyerahan dan pemulangan kenderaan.',
      'Rakaman CCTV di pejabat dan lokasi pengambilan kami.',
      'Analitik laman web, kuki, alamat IP, jenis pelayar, dan pengecam peranti.',
    ),
    h3('2.3 Maklumat Daripada Pihak Ketiga'),
    ul(
      'Penyedia saringan penipuan dan pengesahan identiti.',
      'Penerbit kad kredit dan pemproses pembayaran.',
      'Syarikat insurans, berkaitan dengan tuntutan.',
      'Pihak berkuasa, di mana dikehendaki secara undang-undang.',
    ),
    h2('3. Bagaimana Kami Menggunakan Maklumat Anda'),
    p('Kami menggunakan data peribadi anda untuk tujuan berikut:'),
    ul(
      'Memproses tempahan, pembayaran, dan bayaran balik.',
      'Mengesahkan identiti, kelayakan memandu, dan mengesan penipuan.',
      'Penyerahan kenderaan, pemulihan, dan pengurusan insiden.',
      'Pentadbiran insurans dan pemprosesan tuntutan.',
      'Khidmat pelanggan dan komunikasi.',
      'Pematuhan undang-undang Malaysia, termasuk pelaporan kepada pihak berkuasa jika dikehendaki.',
      'Pemulihan jumlah tertunggak, termasuk kerosakan, denda, dan caj yang tidak dibayar.',
      'Penambahbaikan perkhidmatan, analitik dalaman, dan jaminan kualiti.',
      'Komunikasi pemasaran, jika anda telah bersetuju atau dibenarkan oleh undang-undang.',
    ),
    h2('4. Asas Undang-Undang Untuk Pemprosesan'),
    p('Kami memproses data peribadi berdasarkan satu atau lebih daripada asas undang-undang berikut di bawah APDP:'),
    ul(
      'Pelaksanaan kontrak kami dengan anda.',
      'Pematuhan obligasi undang-undang.',
      'Persetujuan anda (yang boleh ditarik balik pada bila-bila masa).',
      'Kepentingan sah kami dalam mengendalikan, mengamankan, dan menambah baik perkhidmatan kami.',
    ),
    h2('5. Pendedahan Maklumat Anda'),
    p(
      'Kami boleh mendedahkan data peribadi anda kepada kategori penerima berikut, hanya seperlunya bagi tujuan yang dinyatakan dalam Dasar ini:',
    ),
    ul(
      'Rakan kongsi armada dan pembekal kenderaan pihak ketiga.',
      'Pemproses pembayaran dan institusi kewangan.',
      'Syarikat insurans dan penilai kerugian insurans.',
      'Penyedia pengesahan identiti dan saringan penipuan.',
      'Penasihat undang-undang, juruaudit, dan perunding profesional di bawah obligasi kerahsiaan.',
      'Pihak berkuasa kerajaan, pengawal selia, dan penguat kuasa undang-undang, jika dikehendaki secara undang-undang.',
      'Agensi pemulihan hutang, jika jumlah masih tidak dibayar.',
      'Mahkamah dan tribunal, berkaitan dengan prosiding undang-undang.',
    ),
    p('Kami tidak menjual data peribadi anda kepada pihak ketiga untuk tujuan pemasaran.'),
    h2('6. Pemindahan Antarabangsa Data'),
    p(
      'Apabila kami memindahkan data peribadi ke luar Malaysia (contohnya, kepada penyedia perkhidmatan awan atau pemproses pembayaran antarabangsa), kami memastikan bahawa pihak penerima menyediakan tahap perlindungan setara seperti yang dikehendaki di bawah APDP, melalui perlindungan kontrak atau persetujuan subjek data.',
    ),
    h2('7. Penyimpanan Data'),
    p(
      'Kami menyimpan data peribadi hanya selama diperlukan untuk memenuhi tujuan pengumpulanannya, termasuk keperluan undang-undang, perakaunan, dan pelaporan.',
    ),
    ul(
      'Rekod tempahan dan sewaan: tujuh (7) tahun dari tamat Tempoh Sewaan, selaras dengan keperluan cukai dan perakaunan Malaysia.',
      'Salinan dokumen pengenalan: tiga (3) tahun dari interaksi terakhir, melainkan dikehendaki lebih lama untuk tujuan undang-undang atau insurans.',
      'Rakaman CCTV: tiga puluh (30) hari melainkan disimpan bagi insiden tertentu.',
      'Data GPS kenderaan dan telematik: sembilan puluh (90) hari melainkan disimpan bagi insiden atau tuntutan tertentu.',
      'Data pemasaran: sehingga anda menarik balik persetujuan atau menyahlanggan.',
    ),
    h2('8. Keselamatan Data'),
    p(
      'Kami melaksanakan langkah teknikal dan organisasi yang munasabah untuk melindungi data peribadi daripada kehilangan, penyalahgunaan, akses tanpa kebenaran, pendedahan, pengubahan, dan pemusnah. Ini termasuk kawalan akses, pemprosesan pembayaran disulitkan, penyimpanan selamat, dan obligasi kerahsiaan kakitangan.',
    ),
    p(
      'Tiada kaedah penghantaran atau penyimpanan yang benar-benar selamat. Walaupun kami mengambil semua langkah munasabah untuk melindungi data anda, kami tidak dapat menjamin keselamatan mutlak.',
    ),
    h2('9. Hak Anda'),
    p('Tertakluk kepada APDP, anda mempunyai hak berikut berkenaan dengan data peribadi anda:'),
    ul(
      'Hak akses: untuk meminta salinan data peribadi yang kami simpan tentang anda.',
      'Hak pembetulan: untuk meminta pembetulan data yang tidak tepat atau tidak lengkap.',
      'Hak menarik balik persetujuan: untuk menarik balik persetujuan yang diberikan sebelum ini, tertakluk kepada sekatan undang-undang atau kontrak.',
      'Hak menghadkan pemprosesan: untuk meminta kami menghadkan penggunaan tertentu terhadap data anda.',
      'Hak menghalang pemasaran langsung: untuk menolak komunikasi pemasaran pada bila-bila masa.',
    ),
    p(
      'Untuk melaksanakan mana-mana hak ini, hubungi kami menggunakan butiran dalam Seksyen 12. Kami boleh mengenakan bayaran yang munasabah untuk permintaan akses seperti dibenarkan di bawah APDP.',
    ),
    h2('10. Kuki dan Teknologi Penjejakan'),
    p('Laman web kami menggunakan kuki dan teknologi serupa untuk:'),
    ul(
      'Membolehkan fungsi laman web yang penting.',
      'Mengingati pilihan anda.',
      'Menganalisis trafik laman web dan tingkah laku pengguna.',
      'Menyampaikan iklan yang relevan, jika berkenaan.',
    ),
    p(
      'Anda boleh melumpuhkan kuki melalui tetapan pelayar, walaupun sesetengah ciri Platform mungkin tidak berfungsi dengan baik sebagai akibatnya.',
    ),
    h2('11. Privasi Kanak-Kanak'),
    p(
      'Perkhidmatan kami tidak ditujukan kepada orang di bawah umur lapan belas (18) tahun. Kami tidak sengaja mengumpul data peribadi daripada kanak-kanak. Jika anda percaya seorang kanak-kanak telah memberikan data peribadi kepada kami, sila hubungi kami supaya tindakan sewajarnya boleh diambil.',
    ),
    h2('12. Hubungan dan Aduan'),
    p('Untuk pertanyaan tentang Dasar Privasi ini, melaksanakan hak anda, atau membuat aduan, hubungi Pegawai Perlindungan Data kami:'),
    p(
      `${LEGAL_COMPANY.name}\nUntuk perhatian: Pegawai Perlindungan Data\n${LEGAL_COMPANY.address}\nLaman web: ${LEGAL_COMPANY.website}`,
    ),
    p(
      'Jika anda tidak berpuas hati dengan respons kami, anda boleh mengemukakan aduan kepada Pesuruhjaya Perlindungan Data Peribadi Malaysia di www.pdp.gov.my.',
    ),
    h2('13. Perubahan Kepada Dasar Ini'),
    p(
      'Kami boleh mengemas kini Dasar Privasi ini dari semasa ke semasa. Perubahan material akan dimaklumkan melalui Platform atau melalui e-mel. Versi semasa dikenalpasti melalui tarikh kuat kuasa di bahagian atas dokumen ini.',
    ),
  ],
}
