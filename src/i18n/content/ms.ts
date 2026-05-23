import type {
  BlogTip,
  Attraction,
  EssentialLocation,
  FaqItem,
  FaqCategory,
  PromoCard,
  CategoryCard,
  StepItem,
  WhyPerk,
} from '#/i18n/content/types'

export type LandingContent = {
  attrCats: readonly string[]
  blogTips: BlogTip[]
  attractions: Attraction[]
  essentialLocations: EssentialLocation[]
  faqs: FaqItem[]
  faqCats: FaqCategory[]
  promos: PromoCard[]
  categories: CategoryCard[]
  steps: StepItem[]
  whyMain: { big: string; bigSub: string; body: string; bullets: string[] }
  whyPerks: WhyPerk[]
}

export const msLandingContent: LandingContent = {
  attrCats: ['Semua', 'Pantai', 'Pengembaraan', 'Alam', 'Mercu tanda'],
  blogTips: [
    {
      id: 'ten-tips-driving-langkawi',
      slug: 'driving-langkawi-first-time',
      tag: 'Memandu',
      title: '10 tip penting memandu di Langkawi',
      excerpt:
        'Dari adab berpandu kiri hingga merempuh Pantai Cenang menjelang petang — asas penting setiap pengunjung perlu kenali.',
      img: '/image/Attractions/Sky%20bridge.png',
    },
    {
      id: 'book-rental-step-by-step',
      slug: 'book-car-rental-langkawi-online',
      tag: 'Panduan',
      title: 'Cara tempah sewa kereta XQ Car atas talian — langkah demi langkah',
      excerpt:
        'Ringkasan panduan visual bagi setiap skrin supaya pertama kali anda tempah rasanya sama lancar seperti kali kesepuluh.',
      img: '/image/Attractions/pantai%20cenang.png',
    },
    {
      id: 'monsoon-travel-langkawi',
      slug: 'langkawi-monsoon-season-car-rental',
      tag: 'Perancangan',
      title: 'Mengapa musim tengkujuh masa yang paling sunyi untuk menjelajah',
      excerpt:
        'Kurang sesak, lereng lagi hijau, dan kadar di luar pancaran utama — apa yang anda boleh jangka jika lawatan jatuh antara Mei dengan Jun.',
      img: '/image/Attractions/Kilim%20Geoforest%20Park.png',
    },
  ],
  attractions: [
    {
      n: '01',
      t: 'Langkawi Sky Bridge',
      c: 'Pengembaraan',
      d: 'Jambatan gantung lengkung 125 m menawarkan panorama meliputi kawasan pulau dan Laut Andaman.',
      airport: '18 km',
      jetty: '31 km',
      cenang: '20 km',
      kuah: '29 km',
      time: 'Pemanduan kira‑kira 32 minit',
      mapsUrl: 'https://www.google.com/maps/place/Langkawi+Sky+Bridge/@6.3860,99.6622,17z',
      img: '/image/Attractions/Sky%20bridge.png',
    },
    {
      n: '02',
      t: 'Langkawi Cable Car (SkyCab)',
      c: 'Pengembaraan',
      d: 'Pengangkutan menawan ke kemuncak Gunung Mat Cincang.',
      airport: '18 km',
      jetty: '31 km',
      cenang: '19 km',
      kuah: '28 km',
      time: 'Pemanduan kira‑kira 28 minit',
      mapsUrl: 'https://www.google.com/maps/place/Langkawi+Cable+Car/@6.3710,99.6719,17z',
      img: '/image/Attractions/Skycab.png',
    },
    {
      n: '03',
      t: 'Pantai Cenang',
      c: 'Pantai',
      d: 'Pantai bernyawa dengan pasir putih, sukan air dan kehidupan malam santai.',
      airport: '4 km',
      jetty: '22 km',
      cenang: 'Di sini',
      kuah: '19 km',
      time: 'Pemanduan kira‑kira 9 minit',
      mapsUrl: 'https://www.google.com/maps/place/Pantai+Cenang/@6.2913,99.7289,17z',
      img: '/image/Attractions/pantai%20cenang.png',
    },
    {
      n: '04',
      t: 'Kilim Geoforest Park',
      c: 'Alam',
      d: 'Taman geohutan bakau bergelar UNESCO, gua marin dan hidupan liar pelbagai bentuk.',
      airport: '24 km',
      jetty: '12 km',
      cenang: '29 km',
      kuah: '11 km',
      time: 'Pemanduan kira‑kira 28 minit',
      mapsUrl: 'https://www.google.com/maps/place/Kilim+Karst+Geoforest+Park/@6.4050,99.8582,17z',
      img: '/image/Attractions/Kilim%20Geoforest%20Park.png',
    },
    {
      n: '05',
      t: 'Tanjung Rhu Beach',
      c: 'Pantai',
      d: 'Pantai santai dengan air jernih dan suasana perlahan.',
      airport: '22 km',
      jetty: '25 km',
      cenang: '26 km',
      kuah: '24 km',
      time: 'Pemanduan kira‑kira 31 minit',
      mapsUrl: 'https://www.google.com/maps/place/Pantai+Tanjung+Rhu/@6.4581,99.8249,17z',
      img: '/image/Attractions/Tanjung%20Rhu.png',
    },
    {
      n: '06',
      t: 'Underwater World Langkawi',
      c: 'Mercu tanda',
      d: "Salah satu akuarium terbesar Malaysia.",
      airport: '5 km',
      jetty: '22 km',
      cenang: '1 km',
      kuah: '19 km',
      time: 'Pemanduan kira‑kira 10 minit',
      mapsUrl: 'https://www.google.com/maps/place/Underwater+World+Langkawi/@6.2878,99.7286,17z',
      img: '/image/Attractions/Underwater%20World.png',
    },
    {
      n: '07',
      t: 'Eagle Square (Dataran Lang)',
      c: 'Mercu tanda',
      d: 'Arca helang besar yang menjadi lambang serta memandang ke teluk.',
      airport: '17 km',
      jetty: '1 km',
      cenang: '22 km',
      kuah: '4 km',
      time: 'Pemanduan kira‑kira 21 minit',
      mapsUrl: 'https://www.google.com/maps/place/Eagle+Square+Langkawi/@6.3083,99.8520,17z',
      img: '/image/Attractions/Eagle%20Square.png',
    },
    {
      n: '08',
      t: 'Telaga Tujuh Waterfalls',
      c: 'Alam',
      d: 'Tujuh kolam semula jadi sesuai berendam, bersantai dan piknik ringkas.',
      airport: '18 km',
      jetty: '31 km',
      cenang: '20 km',
      kuah: '29 km',
      time: 'Pemanduan kira‑kira 28 minit',
      mapsUrl: 'https://www.google.com/maps/place/Air+Terjun+Telaga+Tujuh/@6.3818,99.6729,17z',
      img: '/image/Attractions/Telaga%20Tujuh%20Waterfall.png',
    },
    {
      n: '09',
      t: 'Langkawi Wildlife Park',
      c: 'Alam',
      d: 'Taman interaktif menghimpun ratusan spesies.',
      airport: '23 km',
      jetty: '11 km',
      cenang: '28 km',
      kuah: '10 km',
      time: 'Pemanduan kira‑kira 26 minit',
      mapsUrl: 'https://www.google.com/maps/place/Langkawi+Wildlife+Park/@6.3873,99.8619,17z',
      img: '/image/Attractions/Wildlife%20Park.png',
    },
    {
      n: '10',
      t: 'Pulau Payar Marine Park',
      c: 'Pantai',
      d: 'Terumbu karang dan lokasi snorkeling — perkhidmatan pemindahan bot dari Jetty Kuah.',
      airport: 'boat',
      jetty: 'boat',
      cenang: 'boat',
      kuah: 'boat',
      time: 'Perjalanan feri kira‑kira 45 minit',
      mapsUrl: 'https://www.google.com/maps/place/Pulau+Payar+Marine+Park/@6.0740,100.0562,17z',
      img: '/image/Attractions/Pulau%20Payar%20Marine%20Park.png',
    },
  ],
  essentialLocations: [
    {
      t: 'Langkawi Intl Airport',
      sub: 'Pintu 3 · LGK',
      meet: 'Luar kawasan ketibaan, berdekatan pintu utama',
      hours: 'Kaunter tersedia 24 jam',
      tag: 'Pengambilan',
      icon: 'airport',
      mapsUrl: 'https://maps.app.goo.gl/BSUAGPQsuR5oAFkt6',
    },
    {
      t: 'Langkawi Ferry Jetty',
      sub: 'Terminal Kuah',
      meet: 'Selepas kawasan keluar feri, berhampiran perhentian teksi',
      hours: '06:00 – 22:00',
      tag: 'Pengambilan',
      icon: 'jetty',
      mapsUrl: 'https://maps.app.goo.gl/FppwKtKuAusHUKJVA',
    },
    {
      t: 'Sultanah Maliha Hospital',
      sub: 'Hospital rujukan utama',
      meet: 'Jalan Kuah–Padang Matsirat',
      hours: 'Kecemasan 24 jam',
      tag: 'Perlu diketahui',
      icon: 'info',
      phone: '+60 4 966 3333',
      mapsUrl: 'https://maps.app.goo.gl/KmbasG1kWhUhKXZ46',
    },
    {
      t: 'Langkawi Police HQ',
      sub: 'IPD Langkawi',
      meet: 'Persiaran Mutiara, Kuah',
      hours: '24 jam',
      tag: 'Perlu diketahui',
      icon: 'info',
      phone: '+60 4 966 6222',
      mapsUrl: 'https://maps.app.goo.gl/GdeKj3xTT7X6iES28',
    },
  ],
  faqs: [
    {
      c: 'Eligibility',
      q: 'Apakah syarat menyewa kereta?',
      a:
        'Jika anda berumur antara 23 dan 65 tahun, mempunyai Lesen Memandu Malaysia atau Antarabangsa yang sah, serta mempunyai sekurang-kurangnya satu tahun pengalaman memandu, anda boleh meneruskan penyewaan.',
    },
    {
      c: 'Pickup & Extras',
      q: 'Boleh saya memandu kereta sewa ke mana sahaja dalam pulau ini?',
      a:
        'Ya. Kereta sewa membantu anda meneroka Langkawi secara menyeluruh. Menggunakan atau membawa keluar kereta daripada Pulau Langkawi tidak dibenarkan.',
    },
    {
      c: 'Booking & Pricing',
      q: 'Bagaimana kadar penyewaan dikira?',
      a:
        'Kadar ditetapkan mengikut blok 24 jam dengan diskaun tambahan untuk tempoh mingguan atau bulanan. Harga berubah mengikut musim dan jenis kenderaan — hubungi khidmat pelanggan untuk sebut harga terkini.',
    },
    {
      c: 'Insurance & Safety',
      q: 'Adakah insurans disertakan?',
      a:
        'Skop perlindungan bergantung pada kenderaan dan pilihan tempahan anda. Hubungi kami sebelum bertolak untuk mengesahkan butiran tepat bagi sewaan anda.',
    },
    {
      c: 'Pickup & Extras',
      q: 'Boleh saya mengambil kereta sewa di Lapangan Terbang Antarabangsa Langkawi?',
      a:
        'Ya — sewa kereta di lapangan terbang antara perkhidmatan utama kami. Pasukan akan bertemu anda luar Pintu 3 di Dewan Kedatangan Lapangan Terbang Antarabangsa Langkawi (LGK), tersedia 24 jam tanpa caj tambahan. Berikan nombor penerbangan semasa membuat pesanan serta kami mengurus urusan selebihnya.',
    },
    {
      c: 'Insurance & Safety',
      q: 'Bagaimana jika kenderaan rosak?',
      a:
        'Hubungi talian khidmat 24 jam pada +60 11 3521 5576 — kami pandu anda melalui langkah seterusnya.',
    },
    {
      c: 'Eligibility',
      q: 'Boleh saya menambah pemandu tambahan?',
      a:
        'Sudah tentu — beritahu kepada kami. Caj kecil dikenakan serta pemandu tambahan mestilah memenuhi syarat umur dan lesen sama seperti pemandu utama.',
    },
    {
      c: 'Booking & Pricing',
      q: 'Boleh saya menyewa beberapa jam sahaja?',
      a:
        'Minimum sewaan ialah satu hari namun kongsi keperluan khas — pasukan akan cuba memenuhi permohonan anda.',
    },
    {
      c: 'Booking & Pricing',
      q: 'Bagaimana saya boleh menukar atau membatalkan tempahan?',
      a:
        'Hubungi pasukan sokongan kami. Pembatalan lebih 48 jam sebelum masa pengambilan adalah percuma; pembatalan lewat kemudian mungkin dikenakan yuran nominal.',
    },
    {
      c: 'Pickup & Extras',
      q: 'Adakah Pulau Langkawi mesra keluarga? Adakah kerusi kanak-kanak disediakan?',
      a:
        'Sudah tentu — Pulau Langkawi mesra keluarga dan kami menyediakan kerusi kanak-kanak mengikut permintaan dengan yuran harian berskala kecil.',
    },
    {
      c: 'Insurance & Safety',
      q: 'Bagaimana jika saya lewat mengembalikan kereta sewa?',
      a:
        'Jika anda lewat melebihi 30 minit, kos lewat mungkin dikenakan. Maklumkan awal serta kami akan mencari penyelesaian bersama.',
    },
    {
      c: 'Eligibility',
      q: 'Dokumen apa perlu dibawa?',
      a:
        'Lesen memandu, pasport, dan kad debit/kredit untuk deposit keselamatan — sekian sahaja.',
    },
    {
      c: 'Booking & Pricing',
      q: 'Boleh menyewakan kereta sepanjang tempoh penginapan?',
      a:
        'Sudah tentu — kami menawarkan harga mingguan serta bulanan supaya anda meneroka pulau secara fleksibel.',
    },
    {
      c: 'Booking & Pricing',
      q: 'Apakah pilihan penyewaan kereta paling jimat di Langkawi?',
      a:
        'Kereta ekonomi bermula daripada RM 70 sehari serta inilah cara paling jimat untuk memandu sendiri dengan bebas. Tempahkan awal atau inap lebih tujuh malam untuk diskaun lanjut yang digunakan secara automatik semasa pembayaran.',
    },
  ],
  faqCats: [
    { id: 'All', label: 'Semua soalan' },
    { id: 'Booking & Pricing', label: 'Tempahan dan harga' },
    { id: 'Eligibility', label: 'Kelayakan dan pemandu' },
    { id: 'Pickup & Extras', label: 'Pengambilan dan tambahan' },
    { id: 'Insurance & Safety', label: 'Insurans dan keselamatan' },
  ],
  promos: [
    {
      cls: 'p2',
      tag: 'Rancangan awal',
      season: 'Tempah 1+ bulan dahulu',
      title: 'Tempah lebih awal',
      pct: 10,
      body:
        'Tempahkan sekurang-kurangnya satu bulan lebih awal dan dapatkan diskaun 10% untuk kenderaan terpilih — pastikan model yang anda mahukan masih ada sebelum kemuncak musim sibuk.',
      image: '/image/Langkawi Car Rental - Pick This Car.png',
    },
    {
      cls: 'p1',
      tag: 'Luar musim puncak',
      season: 'Empat musim penyewaan',
      title: 'Melancong di luar pancaran utama',
      pct: 20,
      body:
        'Struktur harga penyewaan mengikut empat zon musim. Nikmat kadar lebih rendah semasa luar musim puncak — pantai lebih sepi, jalan lebih lancar, dan ruang meneroka lebih besar.',
      image: '/image/Attractions/pantai cenang.png',
    },
    {
      cls: 'p3',
      tag: 'Jangka masa panjang',
      season: 'Sewa 7+ hari',
      title: 'Tinggal lebih lama',
      pct: 30,
      body:
        'Merancang penginapan panjang di Pulau Langkawi? Selepas tujuh hari pertama, kadar bagi hari sewa berikutnya boleh layak kepada diskaun sehingga 30%, sesuai bagi cuti seminggu dan pengembaraan santai di pulau ini.',
      image: '/image/Attractions/Tanjung Rhu.png',
    },
  ],
  categories: [
    {
      n: '01',
      key: 'small',
      title: 'Kecil',
      kicker: 'Ringan bandar dan jimat',
      body:
        'Kenderaan kecil sesuai solo, pasangan, dan perjalanan ringkas. Mudah dipark, jimat bahan api, serta lancar melepasi trafik di Pantai Cenang dan bandar utama.',
      fleetKeys: ['economy'],
      seats: '1–5 tempat duduk',
      bags: '1–2 bagasi',
      from: 70,
      dark: false,
      orange: false,
    },
    {
      n: '02',
      key: 'comfort',
      title: 'Keselesaan',
      kicker: 'Ruangan untuk kumpulan besar',
      body:
        'Kabin sejuk serta ruang meregang untuk semua, sesuai hari tepi pantai, pemanduan indah, dan percutian keluarga — MPV serta sedan luas menjamin keselesaan terbaik.',
      fleetKeys: ['mpv', 'economy'],
      seats: '5–8 tempat duduk',
      bags: '3–8 bagasi',
      from: 100,
      dark: true,
      orange: false,
    },
    {
      n: '03',
      key: 'adventure',
      title: 'Pengembaraan',
      kicker: 'Pantai tersembunyi dan jalan belakang',
      body:
        'SUV serta kenderaan serbaguna untuk cerun, titik pandang, dan hari beraktiviti tinggi — ruang simpanan luas untuk peralatan serta keperluan pengembaraan.',
      fleetKeys: ['suv', 'other'],
      seats: '2–7 tempat duduk',
      bags: '1–4 bagasi',
      from: 200,
      dark: false,
      orange: true,
    },
  ],
  steps: [
    {
      n: '01',
      t: 'Pilih kereta anda',
      d:
        'Tapis kapasiti penumpang, gaya pemanduan, atau kemudahan khas — bermula sedan kecil serta MPV sehingga SUV.',
    },
    {
      n: '02',
      t: 'Tempah dalam talian',
      d:
        'Masuk maklumat, pilih tarikh, dan selesaikan bayaran selamat. Pengesahan serta-merta dihantar ke peti mel anda.',
    },
    {
      n: '03',
      t: 'Ambil kereta sewa',
      d:
        'Kami berjumpa dengan anda di luar kawasan ketibaan lapangan terbang, Jetty Kuah, atau hotel untuk serahan pantas, semakan kenderaan, dan penukaran kunci.',
    },
    {
      n: '04',
      t: 'Nikmati memandu',
      d:
        'Teroka Langkawi mengikut masa sendiri. Pasukan tempatan boleh dihubungi melalui WhatsApp untuk panduan serta bantuan tepi jalan.',
    },
    {
      n: '05',
      t: 'Kembalikan kereta',
      d:
        'Serahkan kenderaan di lokasi yang dipersetuju. Kami lakukan pemeriksaan serta-merta serta sewaan dianggap selesai.',
    },
  ],
  whyMain: {
    big: '11 tahun',
    bigSub: 'di jalan raya utama Langkawi',
    body:
      'XQ Holidays bermula dengan gagasan mudah — iaitu berkongsi yang terbaik daripada Pulau Langkawi bersama dunia. Bermula seawal tahun 2015 armada milik kami diselenggara dengan teliti serta membantu pengunjung meneroka pulau secara selamat serta bebas.',
    bullets: [
      'Diservis rapi serta di pusat pengedar bertauliah',
      'Dicuci serta diperiksa di antara penyewaan',
      'Sebut harga awal tanpa kos tersembunyi',
      'Kenderaan mesra akses serta pilihan OKU tersedia',
    ],
  },
  whyPerks: [
    {
      t: 'Harga selesa di dompet',
      d:
        'Harga jelas serta memenuhi bajet apa pun serta menarik apabila memilih tempahan mingguan atau bulanan.',
      stat: '0',
      statLabel: 'yuran rahsia',
    },
    {
      t: 'Tempahan mudah',
      d:
        'Tempahkan dalam talian serta hantaran percuma ke lapangan terbang, Jetty Kuah, atau hotel pilihan anda.',
      stat: '<2 min',
      statLabel: 'balasan WhatsApp',
    },
    {
      t: 'Memandu dengan keyakinan',
      d:
        'Pasukan setempatan tersedia dalam WhatsApp untuk bantuan ambilan serta tips pulau.',
      stat: '24/7',
      statLabel: 'talian WhatsApp',
    },
    {
      t: 'Kereta bagi setiap pengembaraan',
      d:
        'Daripada sedan bandar kepada MPV keluarga — semua kenderaan disediakan serta dibersih serta disemak bagi setiap penyewaan.',
      stat: 'Armada',
      statLabel: 'keketersediaan semasa',
    },
  ],
}
