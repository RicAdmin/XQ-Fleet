import { LEGAL_COMPANY } from '#/lib/legal/company'
import { h2, h3, p, ul } from '#/lib/legal/sections'
import type { LegalLocaleContent } from '#/lib/legal/types'

export const pdpaMsLocale: LegalLocaleContent = {
  code: 'ms',
  label: 'Bahasa Malaysia',
  title: 'Notis Perlindungan Data Peribadi',
  documentLabel: 'Dokumen 5: Notis Akta Perlindungan Data Peribadi 2010 (APDP)',
  companyIntro: [
    'Dikendalikan oleh Xiao Qiang Holidays Sdn Bhd',
    `No. Pendaftaran Syarikat ${LEGAL_COMPANY.registrationNo}`,
    `${LEGAL_COMPANY.kpkLn}  |  ${LEGAL_COMPANY.ma}`,
    '26 & 28, Tingkat 1, Jalan Pandak Mayah 4, Mukim Kuah, 07000 Langkawi, Kedah, Malaysia',
  ],
  footerText: `Soalan? Hubungi ${LEGAL_COMPANY.name} di ${LEGAL_COMPANY.address}. Laman web: ${LEGAL_COMPANY.website}`,
  sections: [
    h2('1. Tujuan Notis Ini'),
    p(
      'Notis Perlindungan Data Peribadi ini ("Notis") dikeluarkan oleh Xiao Qiang Holidays Sdn Bhd (No. Pendaftaran Syarikat 201301017811), berniaga sebagai XQ Car Rental ("Syarikat"), selaras dengan Akta Perlindungan Data Peribadi 2010 ("APDP").',
    ),
    p(
      'Notis ini memaklumkan anda tentang data peribadi yang kami kumpul, tujuan kami menggunakan data tersebut, hak anda, dan cara untuk menghubungi kami berkenaan data peribadi anda.',
    ),
    p(
      'Notis ini hendaklah dibaca bersama Dasar Privasi kami, yang memberikan maklumat lanjut tentang amalan data kami.',
    ),
    h2('2. Data Peribadi Yang Kami Kumpul'),
    p('Syarikat mengumpul dan memproses kategori data peribadi berikut:'),
    ul(
      'Data pengenalan: nama penuh, tarikh lahir, jantina, kewarganegaraan, nombor dokumen pengenalan (pasport, MyKad, atau setara), dan salinan dokumen tersebut.',
      'Kelayakan memandu: nombor lesen memandu, negara pengeluar, tarikh luput, dan butiran Permit Memandu Antarabangsa (IDP).',
      'Data hubungan: alamat kediaman, alamat pos, alamat e-mel, dan nombor telefon.',
      'Data kewangan: butiran kad pembayaran (diproses melalui gerbang pembayaran patuh PCI), alamat bil, dan sejarah transaksi.',
      'Data tempahan dan sewaan: sejarah tempahan, pilihan kenderaan, lokasi ambil dan pulang, serta tempoh sewaan.',
      'Data penggunaan kenderaan: lokasi GPS, jarak perjalanan, data telematik, dan rekod insiden (jika Kenderaan dilengkapi sistem sedemikian).',
      'Data visual: fotograf diambil semasa serahan dan pemulangan kenderaan, serta rakaman CCTV di premis kami.',
      'Data komunikasi: surat-menyurat dengan pasukan khidmat pelanggan kami, termasuk e-mel, mesej WhatsApp, dan rekod panggilan.',
      'Data hubungan kecemasan: nama dan butiran hubungan orang yang anda lantik.',
    ),
    h2('3. Tujuan Pemprosesan'),
    p('Data peribadi anda dikumpul dan diproses untuk tujuan berikut:'),
    ul(
      'Untuk memproses dan mengurus tempahan anda, termasuk mengesahkan kelayakan, identiti, dan lesen memandu.',
      'Untuk memproses pembayaran, bayaran balik, deposit, dan pemulihan jumlah tertunggak.',
      'Untuk mengendalikan serahan kenderaan, pemulangan, pemeriksaan, dan pengurusan insiden.',
      'Untuk mentadbir perlindungan insurans dan memproses tuntutan insurans.',
      'Untuk menjawab pertanyaan anda dan memberikan khidmat pelanggan.',
      'Untuk mencegah dan mengesan penipuan, pengubahan wang haram, dan aktiviti haram lain.',
      'Untuk mematuhi obligasi undang-undang dan kawal selia kami di bawah undang-undang Malaysia, termasuk cukai, perakaunan, dan keperluan pelaporan.',
      'Untuk menguatkuasakan terma dan syarat kami dan mengejar pemulihan hutang.',
      'Untuk menambah baik perkhidmatan kami dan menjalankan analitik dalaman serta jaminan kualiti.',
      'Untuk menghantar komunikasi pemasaran tentang perkhidmatan kami, jika anda telah bersetuju atau dibenarkan oleh undang-undang.',
      'Untuk bekerjasama dengan polis, mahkamah, dan pihak berkuasa kawal selia sebagaimana dikehendaki oleh undang-undang.',
    ),
    h2('4. Sumber Data Peribadi'),
    p('Kami mengumpul data peribadi:'),
    ul(
      'Secara langsung daripada anda apabila anda membuat akaun, membuat tempahan, berkomunikasi dengan kami, atau menggunakan perkhidmatan kami.',
      'Secara automatik apabila anda menggunakan laman web kami atau kenderaan kami yang dilengkapi sistem telematik.',
      'Daripada pihak ketiga, termasuk pemproses pembayaran, penyedia pengesahan identiti, penyedia saringan penipuan, syarikat insurans, dan pihak berkuasa, jika dibenarkan.',
    ),
    h2('5. Data Wajib dan Sukarela'),
    p(
      'Kebanyakan data peribadi yang kami minta adalah wajib untuk membolehkan kami menyediakan perkhidmatan kami. Jika anda tidak memberikan data ini, kami tidak akan dapat:',
    ),
    ul(
      'Mengesahkan identiti dan kelayakan memandu anda.',
      'Memproses tempahan anda atau menyerahkan kenderaan kepada anda.',
      'Memproses perlindungan insurans bagi pihak anda.',
      'Mematuhi obligasi undang-undang kami.',
    ),
    p(
      'Sesetengah data adalah sukarela (seperti pilihan pemasaran dan butiran hubungan kecemasan). Anda boleh menolak untuk memberikan data sukarela tanpa menjejaskan keupayaan kami menyediakan perkhidmatan sewaan kepada anda.',
    ),
    h2('6. Pendedahan Data Peribadi'),
    p('Kami boleh mendedahkan data peribadi anda kepada kategori pihak ketiga berikut:'),
    ul(
      'Syarikat dalam kumpulan kami, anak syarikat, dan syarikat bersekutu.',
      'Rakan kongsi armada dan pembekal kenderaan pihak ketiga yang memenuhi sebahagian tempahan anda.',
      'Pemproses pembayaran, bank, dan institusi kewangan.',
      'Syarikat insurans, broker insurans, dan penilai kerugian.',
      'Penyedia pengesahan identiti, semakan kredit, dan saringan penipuan.',
      'Penyedia perkhidmatan IT, penyedia pengehosan awan, dan vendor perisian yang menyokong operasi kami.',
      'Penasihat undang-undang, akauntan, juruaudit, dan perunding profesional lain di bawah obligasi kerahsiaan.',
      'Agensi pemulihan hutang, jika jumlah masih tertunggak.',
      'Badan kerajaan, pengawal selia, mahkamah, dan penguat kuasa undang-undang, jika dikehendaki oleh undang-undang.',
      'Mana-mana pihak kepada siapa kami boleh memindahkan perniagaan atau aset kami sekiranya berlaku jualan, penggabungan, atau penstrukturan semula.',
    ),
    h2('7. Pemindahan Data Peribadi Ke Luar Malaysia'),
    p(
      'Sebahagian penyedia perkhidmatan yang kami libatkan (termasuk penyedia pengehosan awan dan pemproses pembayaran) mungkin berada di luar Malaysia. Apabila data peribadi dipindahkan ke luar Malaysia, kami memastikan bahawa:',
    ),
    ul(
      'Negara penerima menyediakan tahap perlindungan setara dengan APDP, atau',
      'Langkah perlindungan kontrak yang sesuai disediakan untuk melindungi data anda, atau',
      'Anda telah memberikan persetujuan untuk pemindahan tersebut.',
    ),
    h2('8. Penyimpanan Data Peribadi'),
    p(
      'Kami menyimpan data peribadi hanya selama diperlukan untuk tujuan yang dinyatakan dalam Notis ini atau sebagaimana dikehendaki oleh undang-undang. Tempoh penyimpanan diperincikan dalam Dasar Privasi kami.',
    ),
    h2('9. Hak Anda Di Bawah APDP'),
    p('Anda mempunyai hak berikut berkenaan data peribadi anda:'),
    h3('9.1 Hak Akses'),
    p(
      'Anda boleh meminta salinan data peribadi yang kami simpan tentang anda. Kami boleh mengenakan fi yang ditetapkan untuk memproses permintaan anda, sebagaimana dibenarkan di bawah APDP.',
    ),
    h3('9.2 Hak Pembetulan'),
    p(
      'Anda boleh meminta pembetulan data peribadi yang tidak tepat, tidak lengkap, mengelirukan, atau lapuk.',
    ),
    h3('9.3 Hak Menarik Balik Persetujuan'),
    p(
      'Anda boleh menarik balik persetujuan yang diberikan sebelum ini untuk pemprosesan data peribadi anda. Penarikan balik tidak menjejaskan kesahan pemprosesan yang dilakukan sebelum penarikan balik, dan mungkin menjejaskan keupayaan kami menyediakan perkhidmatan kepada anda.',
    ),
    h3('9.4 Hak Menghadkan Pemprosesan'),
    p('Anda boleh meminta kami menghadkan pemprosesan data peribadi anda dalam keadaan tertentu.'),
    h3('9.5 Hak Menghalang Pemasaran Langsung'),
    p(
      'Anda boleh, pada bila-bila masa dan tanpa caj, meminta kami berhenti menggunakan data peribadi anda untuk tujuan pemasaran langsung.',
    ),
    h2('10. Cara Menjalankan Hak Anda'),
    p(
      'Untuk menjalankan mana-mana hak yang dinyatakan di atas, atau untuk sebarang soalan atau aduan berkenaan data peribadi anda, sila hubungi Pegawai Perlindungan Data kami:',
    ),
    p(
      `Pegawai Perlindungan Data\n${LEGAL_COMPANY.name}\n${LEGAL_COMPANY.address}\nLaman web: ${LEGAL_COMPANY.website}`,
    ),
    p(
      'Kami akan membalas permintaan anda dalam tempoh dua puluh satu (21) hari dari tarikh kami menerima permintaan yang sah, sebagaimana dikehendaki di bawah APDP. Permintaan yang kompleks mungkin memerlukan masa tambahan, dan kami akan memaklumkan anda sewajarnya.',
    ),
    h2('11. Aduan Kepada Pesuruhjaya'),
    p(
      'Jika anda tidak berpuas hati dengan pengendalian data peribadi anda atau permintaan anda, anda boleh mengemukakan aduan kepada Pesuruhjaya Perlindungan Data Peribadi Malaysia:',
    ),
    p(
      'Jabatan Perlindungan Data Peribadi (JPDP)\nKementerian Komunikasi dan Digital, Malaysia\nLaman web: www.pdp.gov.my',
    ),
    h2('12. Persetujuan'),
    p(
      'Dengan menyerahkan data peribadi anda kepada Syarikat melalui mana-mana saluran perkhidmatan kami (termasuk laman web, aplikasi mudah alih, telefon, e-mel, WhatsApp, atau secara bersemuka), anda bersetuju dengan pengumpulan, penggunaan, dan pendedahan data peribadi anda selaras dengan Notis ini.',
    ),
    p(
      'Apabila anda memberikan data peribadi pihak ketiga (seperti pemandu tambahan atau hubungan kecemasan), anda mengesahkan bahawa anda telah mendapat persetujuan orang tersebut untuk kami memproses data peribadi mereka selaras dengan Notis ini.',
    ),
    h2('13. Kemas Kini Notis Ini'),
    p(
      'Kami boleh mengemas kini Notis ini dari semasa ke semasa untuk mencerminkan perubahan amalan kami atau undang-undang yang terpakai. Versi semasa dikenalpasti melalui tarikh kuat kuasa. Perubahan material akan dimaklumkan melalui Platform atau melalui e-mel.',
    ),
  ],
}
