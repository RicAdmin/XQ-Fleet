import { LEGAL_COMPANY } from '#/lib/legal/company'
import { h2, h3, p, table, ul } from '#/lib/legal/sections'
import type { LegalLocaleContent } from '#/lib/legal/types'

export const refundPolicyMsLocale: LegalLocaleContent = {
  code: 'ms',
  label: 'Bahasa Malaysia',
  title: 'Dasar Pembatalan & Bayaran Balik',
  documentLabel: 'Dokumen 4: Dasar Pembatalan & Bayaran Balik',
  companyIntro: [
    'Dikendalikan oleh Xiao Qiang Holidays Sdn Bhd',
    `No. Pendaftaran Syarikat ${LEGAL_COMPANY.registrationNo}`,
    `${LEGAL_COMPANY.kpkLn}  |  ${LEGAL_COMPANY.ma}`,
    '26 & 28, Tingkat 1, Jalan Pandak Mayah 4, Mukim Kuah, 07000 Langkawi, Kedah, Malaysia',
  ],
  footerText: `Soalan? Hubungi ${LEGAL_COMPANY.name} di ${LEGAL_COMPANY.address}. Laman web: ${LEGAL_COMPANY.website}`,
  sections: [
    h2('1. Permohonan'),
    p(
      'Dasar Pembatalan & Bayaran Balik ini terpakai kepada semua tempahan yang dibuat melalui Platform XQ Car Rental yang dikendalikan oleh Xiao Qiang Holidays Sdn Bhd. Ia merupakan sebahagian daripada kontrak antara anda dan Syarikat dan hendaklah dibaca bersama Terma & Syarat Laman Web.',
    ),
    h2('2. Pembatalan Oleh Pelanggan'),
    p(
      'Pembatalan hendaklah dihantar secara bertulis melalui e-mel atau melalui fungsi pembatalan di Platform. Pembatalan berkuat kuasa pada tarikh Syarikat menerima permintaan bertulis, dikira berbanding tarikh dan masa pengambilan berjadual yang dinyatakan dalam pengesahan tempahan.',
    ),
    h3('2.1 Jadual Bayaran Balik'),
    p('Jadual bayaran balik berikut terpakai:'),
    table(
      ['Masa pembatalan (sebelum pengambilan)', 'Bayaran balik'],
      [
        ['14 hari atau lebih', 'Bayaran balik 100% yuran sewaan'],
        ['7 hingga 13 hari', 'Bayaran balik 50% yuran sewaan'],
        ['Kurang daripada 7 hari', 'Tiada bayaran balik'],
        ['Tidak hadir pada hari pengambilan', 'Tiada bayaran balik'],
      ],
    ),
    h3('2.2 Yuran Pentadbiran'),
    p(
      'Semua bayaran balik tertakluk kepada yuran pentadbiran tidak boleh dikembalikan sebanyak RM 30 untuk menampung kos pemprosesan pembayaran. Bayaran balik diproses selepas ditolak yuran ini.',
    ),
    h3('2.3 Caj Yang Tidak Boleh Dikembalikan'),
    p('Berikut tidak boleh dikembalikan tidak kira masa pembatalan:'),
    ul(
      'Yuran tempahan dan caj platform, jika berkenaan.',
      'Yuran penghantaran dan pengumpulan yang telah ditanggung.',
      'Caj gerbang pembayaran dan pemindahan bank.',
      'Tempahan promosi atau diskaun yang diberi tanda secara jelas tidak boleh dikembalikan pada masa tempahan.',
    ),
    h2('3. Tidak Hadir'),
    p(
      'Jika Pelanggan gagal datang untuk pengambilan kenderaan dalam masa empat (4) jam daripada masa pengambilan berjadual tanpa notis terlebih dahulu, tempahan terbatal secara automatik dan tiada bayaran balik akan dikeluarkan. Kenderaan dibebaskan untuk disewakan semula selepas tempoh ini.',
    ),
    h2('4. Pengubahsuaian Tempahan'),
    p('Pengubahsuaian tempahan (pertukaran tarikh, kategori kenderaan, lokasi pengambilan) dibenarkan tertakluk kepada ketersediaan dan mungkin tertakluk kepada pelarasan harga:'),
    ul(
      'Pengubahsuaian diminta 14 hari atau lebih sebelum pengambilan: percuma tertakluk kepada ketersediaan.',
      'Pengubahsuaian diminta 7 hingga 13 hari sebelum pengambilan: tertakluk kepada yuran pengubahsuaian RM 50 dan perbezaan harga.',
      'Pengubahsuaian diminta kurang daripada 7 hari sebelum pengambilan: dikira sebagai tempahan baharu dan pembatalan yang asal.',
    ),
    p(
      'Pengubahsuaian yang mengakibatkan jumlah keseluruhan berkurangan tidak akan dikembalikan perbezaannya setelah dalam tetingkap 7 hari.',
    ),
    h2('5. Pulangan Awal'),
    p(
      'Memulangkan Kenderaan sebelum masa pulangan yang dipersetujui tidak memberikan hak kepada Pelanggan mendapat bayaran balik bagi hari sewaan tidak terpakai melainkan dipersetujui secara bertulis terlebih dahulu.',
    ),
    h2('6. Pembatalan Oleh Syarikat'),
    p(
      'Dalam kejarang peristiwa Syarikat membatalkan tempahan yang disahkan atas sebarang sebab dalam kawalannya (termasuk ketiadaan kenderaan di mana tiada gantian setara), Pelanggan akan menerima:',
    ),
    ul(
      'Bayaran balik penuh semua jumlah yang dibayar, termasuk mana-mana yuran pentadbiran.',
      'Di mana secara munasabah boleh dilakukan, tawaran kenderaan alternatif setara atau kategori lebih tinggi pada harga asal.',
    ),
    p(
      'Liabiliti Syarikat bagi pembatalan sedemikian adalah terhad kepada jumlah yang dibayar oleh Pelanggan bagi tempahan. Syarikat tidak bertanggungjawab atas kerugian tidak langsung seperti terlepas penerbangan, sambungan feri, kos penginapan, atau pengaturan pengangkutan alternatif.',
    ),
    h2('7. Pembatalan Oleh Force Majeure'),
    p(
      'Di mana tempahan tidak dapat dipenuhi kerana peristiwa force majeure (termasuk bencana alam, banjir, pandemik, sekatan kerajaan, kekecohan awam, gangguan feri yang menjejaskan akses ke Langkawi, atau acara lain di luar kawalan munasabah), Syarikat akan:',
    ),
    ul(
      'Menawarkan untuk menjadualkan semula tempahan ke tarikh yang boleh diterima bersama dalam masa enam (6) bulan, tanpa yuran pengubahsuaian.',
      'Di mana penjadualan semula tidak praktikal, memberikan bayaran balik penuh selepas ditolak caj pihak ketiga yang tidak dapat dipulihkan (seperti yuran gerbang pembayaran).',
    ),
    h2('8. Kaedah dan Masa Bayaran Balik'),
    p('Bayaran balik diproses ke kaedah pembayaran asal digunakan untuk tempahan. Garis masa pemprosaan adalah seperti berikut:'),
    ul(
      'Kad kredit dan debit: 7 hingga 21 hari bekerja, bergantung kepada penerbit kad.',
      'Pemindahan bank (FPX, perbankan dalam talian): 5 hingga 14 hari bekerja.',
      'E-dompet dan kaedah pembayaran digital lain: 3 hingga 10 hari bekerja.',
    ),
    p(
      'Syarikat tidak bertanggungjawab atas kelewatan yang disebabkan oleh institusi kewangan atau pemproses pembayaran. Pelanggan bertanggungjawab atas sebarang kerugian pertukaran mata wang.',
    ),
    h2('9. Caj yang Dipertikai dan Caj Balik (Chargebacks)'),
    p(
      'Pelanggan dikehendaki menghubungi Syarikat dahulu untuk menyelesaikan sebarang pertikaian pembayaran sebelum memulakan chargeback dengan penerbit kad. Memulakan chargeback tidak wajar boleh mengakibatkan:',
    ),
    ul(
      'Penangguhan akaun Pelanggan.',
      'Tindakan pemulihan bagi jumlah yang dipertikai ditambah yuran chargeback.',
      'Pelaporan kepada pangkalan data pencegahan penipuan jika berkenaan.',
    ),
    h2('10. Hubungan'),
    p(
      'Permintaan pembatalan dan bayaran balik hendaklah dihantar kepada Syarikat di alamat yang disenaraikan di laman web kami, dengan nombor rujukan tempahan dinyatakan dengan jelas.',
    ),
  ],
}
