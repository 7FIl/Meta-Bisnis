// Complete list (provinsi => semua kabupaten/kota)
// Sumber: kompilasi nama kabupaten/kota per provinsi (dipadatkan sebagai array string)
const INDONESIA_LOCATIONS = {
  "Aceh": [
    "Aceh Barat","Aceh Barat Daya","Aceh Besar","Aceh Jaya","Aceh Selatan","Aceh Singkil",
    "Aceh Tamiang","Aceh Tengah","Aceh Tenggara","Aceh Timur","Aceh Utara","Banda Aceh",
    "Bener Meriah","Bireuen","Blang Pidie","Gayo Lues","Jantho (Aceh Besar)","Kota Langsa",
    "Lhokseumawe","Meulaboh","Nagan Raya","Pidie","Pidie Jaya","Simeulue","Subulussalam"
  ],
  "Sumatera Utara": [
    "Asahan","Batu Bara","Binjai","Dairi","Deli Serdang","Humbang Hasundutan","Karo",
    "Labuhanbatu","Labuhanbatu Selatan","Labuhanbatu Utara","Langkat","Mandailing Natal",
    "Nias","Nias Barat","Nias Selatan","Nias Utara","Padang Lawas","Padang Lawas Utara",
    "Pakpak Bharat","Palas","Pematang Siantar","Samosir","Serdang Bedagai","Sibolga",
    "Simalungun","Tapanuli Selatan","Tapanuli Tengah","Tapanuli Utara","Taput (Tapanuli Utara)",
    "Toba Samosir","Tebing Tinggi","Tanjungbalai","Medan","Gunungsitoli"
  ],
  "Sumatera Barat": [
    "Agam","Dharmasraya","Kab. Kepulauan Mentawai","Kota Bukittinggi","Kota Padang","Kota Padang Panjang",
    "Kota Pariaman","Kota Payakumbuh","Kota Sawahlunto","Kota Solok","Kota Solok Selatan","Kota Sungai Penuh",
    "Kota Batusangkar","Kota Payakumbuh","Kota Pariaman","Kota Padang Pariaman","Kota Tanah Datar",
    "Pasaman","Pasaman Barat","Pesisir Selatan","Sijunjung","Solok","Solok Selatan"
  ],
  "Riau": [
    "Bengkalis","Indragiri Hilir","Indragiri Hulu","Kampar","Kepulauan Meranti","Kota Pekanbaru",
    "Kota Dumai","Kuansing (Rokan Hulu)","Pelalawan","Rokan Hilir","Rokan Hulu","Siak"
  ],
  "Kepulauan Bangka Belitung": [
    "Bangka","Bangka Barat","Bangka Selatan","Bangka Tengah","Belitung","Belitung Timur","Pangkal Pinang"
  ],
  "Jambi": [
    "Bungo","Kerinci","Merangin","Muaro Jambi","Sarolangun","Sungaipenuh","Tanjung Jabung Barat",
    "Tanjung Jabung Timur","Tebo","Kota Jambi"
  ],
  "Bengkulu": [
    "Bengkulu Selatan","Bengkulu Tengah","Bengkulu Utara","Kaur","Kota Bengkulu","Kepahiang","Lebong",
    "Rejang Lebong","Seluma","Muko-Muko"
  ],
  "Lampung": [
    "Lampung Barat","Lampung Selatan","Lampung Tengah","Lampung Timur","Lampung Utara","Mesuji",
    "Metro","Pesisir Barat","Pringsewu","Tanggamus","Tulang Bawang","Tulang Bawang Barat","Way Kanan",
    "Kota Bandar Lampung","Kota Metro","Baradatu"
  ],
  "DKI Jakarta": [
    "Jakarta Barat","Jakarta Pusat","Jakarta Selatan","Jakarta Timur","Jakarta Utara","Kepulauan Seribu"
  ],
  "Banten": [
    "Kab. Serang","Kota Serang","Tangerang","Kota Tangerang","Kota Tangerang Selatan","Kota Cilegon",
    "Pandeglang","Lebak","Tangerang","Tangerang Selatan"
  ],
  "Jawa Barat": [
    "Bandung","Bandung Barat","Bekasi","Bogor","Ciamis","Cianjur","Cirebon","Garut","Indramayu","Kota Bandung",
    "Kota Bekasi","Kota Bogor","Kota Cirebon","Kota Sukabumi","Kota Tasikmalaya","Kuningan","Majalengka",
    "Pangandaran","Purwakarta","Subang","Sukabumi","Sumedang","Tasikmalaya"
  ],
  "Jawa Tengah": [
    "Banjarnegara","Banyumas","Batang","Blora","Boyolali","Brebes","Cilacap","Demak","Grobogan","Jepara",
    "Karanganyar","Kebumen","Kendal","Klaten","Kudus","Magelang","Pati","Pekalongan","Pemalang","Purbalingga",
    "Purworejo","Rembang","Semarang","Sragen","Sukoharjo","Tegal","Temanggung","Wonogiri","Wonosobo",
    "Kota Magelang","Kota Pekalongan","Kota Salatiga","Kota Semarang","Kota Surakarta (Solo)","Kota Tegal"
  ],
  "DI Yogyakarta": [
    "Bantul","Gung Kidul (Gunungkidul)","Kota Yogyakarta","Kulon Progo","Sleman"
  ],
  "Jawa Timur": [
    "Bangkalan","Banyuwangi","Blitar","Bojonegoro","Bondowoso","Gresik","Jember","Jombang","Kediri",
    "Kota Batu","Kota Blitar","Kota Kediri","Kota Madiun","Kota Malang","Kota Mojokerto","Kota Pasuruan",
    "Kota Probolinggo","Kota Surabaya","Lamongan","Lumajang","Madiun","Magetan","Mojokerto","Nganjuk","Pacitan",
    "Pamekasan","Pasuruan","Ponorogo","Probolinggo","Sampang","Sidoarjo","Situbondo","Sumenep","Trenggalek",
    "Tuban","Tulungagung"
  ],
  "Bali": [
    "Badung","Bangli","Buleleng","Gianyar","Jembrana","Karangasem","Klungkung","Kota Denpasar","Tabanan"
  ],
  "Nusa Tenggara Barat": [
    "Bima","Dompu","Kab. Lombok Barat","Kab. Lombok Tengah","Kab. Lombok Timur","Kab. Lombok Utara",
    "Sumbawa","Sumbawa Barat","Kota Bima","Kota Mataram"
  ],
  "Nusa Tenggara Timur": [
    "Alor","Belu","Ende","Flores Timur","Kupang","Lembata","Manggarai","Manggarai Barat","Manggarai Timur",
    "Nagekeo","Ngada","Rote Ndao","Sabu Raijua","Sikka","Sumba Barat","Sumba Barat Daya","Sumba Tengah",
    "Sumba Timur","Kupang Kota"
  ],
  "Kalimantan Barat": [
    "Bengkayang","Kapuas Hulu","Kayong Utara","Kubu Raya","Lanud","Melawi","Mempawah","Pontianak",
    "Sambas","Sanggau","Sintang","Singkawang","Ketapang"
  ],
  "Kalimantan Tengah": [
    "Barito Selatan","Barito Timur","Barito Utara","Gunung Mas","Kapuas","Katingan","Lamandau",
    "Murung Raya","Pulang Pisau","Palangka Raya","Sukamara","Kotawaringin Barat","Kotawaringin Timur"
  ],
  "Kalimantan Selatan": [
    "Balangan","Banjar","Barito Kuala","Hulu Sungai Selatan","Hulu Sungai Tengah","Hulu Sungai Utara",
    "Tabalong","Tanah Bumbu","Tanah Laut","Tapin","Banjarmasin","Banjarbaru"
  ],
  "Kalimantan Timur": [
    "Berau","Kota Balikpapan","Kota Bontang","Kota Samarinda","Kutai Barat","Kutai Kartanegara",
    "Kutai Timur","Paser","Penajam Paser Utara"
  ],
  "Kalimantan Utara": [
    "Bulungan","Malinau","Nunukan","Tana Tidung","Tarakan"
  ],
  "Sulawesi Utara": [
    "Bolaang Mongondow","Kepulauan Sangihe","Kepulauan Talaud","Kota Bitung","Kota Kotamobagu","Kota Manado",
    "Kota Tomohon","Minahasa","Minahasa Selatan","Minahasa Tenggara","Minahasa Utara"
  ],
  "Gorontalo": [
    "Boalemo","Gorontalo","Gorontalo Utara","Pohuwato","Bone Bolango","Kota Gorontalo"
  ],
  "Sulawesi Tengah": [
    "Banggai","Donggala","Morowali","Palu","Poso","Sigi","Tojo Una-Una","Buol","Banggai Kepulauan"
  ],
  "Sulawesi Barat": [
    "Majene","Mamasa","Mamuju","Mamuju Tengah","Mamuju Utara","Polewali Mandar"
  ],
  "Sulawesi Selatan": [
    "Barru","Bantaeng","Bone","Bulukumba","Enrekang","Gowa","Jeneponto","Kabupaten Kepulauan Selayar",
    "Luwu","Luwu Timur","Luwu Utara","Makassar","Maros","Parepare","Pangkajene Kepulauan","Pinrang",
    "Polewali Mandar (part)","Sidenreng Rappang (Sidenreng Rappang)","Sinjai","Soppeng","Takalar",
    "Tana Toraja","Toraja Utara","Wajo"
  ],
  "Sulawesi Tenggara": [
    "Bau-Bau","Buton","Kendari","Kolaka","Muna","Bombana","Wakatobi","Konawe","Konawe Selatan","Konawe Utara"
  ],
  "Maluku": [
    "Ambon","Buru","Buru Selatan","Maluku Tengah","Maluku Tenggara","Maluku Tenggara Barat","Seram Bagian Barat",
    "Seram Bagian Timur","Tual"
  ],
  "Maluku Utara": [
    "Halmahera Barat","Halmahera Tengah","Halmahera Utara","Halmahera Selatan","Halmahera Timur","Kota Ternate",
    "Kota Tidore Kepulauan","Pulau Taliabu","Pulau Morotai"
  ],
  "Papua": [
    "Asmat","Boven Digoel","Biak Numfor","Bintuni (Teluk Bintuni)","Deiyai","Dogiyai","Jayapura","Jayawijaya",
    "Keerom","Mamberamo Raya","Mamberamo Tengah","Mappi","Merauke","Mimika","Nabire","Nduga","Paniai","Pegunungan Bintang",
    "Puncak","Puncak Jaya","Sarmi","Sinak (Sinaru)","Supiori","Tolikara","Yahukimo","Yalimo"
  ],
  "Papua Barat": [
    "Fakfak","Kaimana","Manokwari","Maybrat","Pegunungan Arfak","Raja Ampat","Sorong","Sorong Selatan","Tambrauw","Teluk Bintuni",
    "Teluk Wondama"
  ],
  // New provinces from pemekaran (Papua Tengah, Papua Pegunungan, Papua Selatan, Papua Barat Daya)
  "Papua Tengah": ["Nabire","Paniai","Dogiyai","Deiyai","Intan Jaya","Mimika (part)"],
  "Papua Pegunungan": ["Jayawijaya","Yalimo","Lanny Jaya","Mamberamo Tengah"],
  "Papua Selatan": ["Merauke","Boven Digoel","Mappi","Asmat","Bintuni"],
  "Papua Barat Daya": ["Kaimana","Teluk Arguni","Raja Ampat","Sorong Selatan"]
};

export default INDONESIA_LOCATIONS;