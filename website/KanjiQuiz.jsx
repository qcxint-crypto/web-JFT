import React, { useState, useEffect } from 'react';

const KanjiQuiz = () => {
  const allKanji = [
    { id: 1, kanji: '魚', reading: 'さかな', meaning: 'Ikan' },
    { id: 2, kanji: '肉', reading: 'にく', meaning: 'Daging' },
    { id: 3, kanji: '卵', reading: 'たまご', meaning: 'Telur' },
    { id: 4, kanji: '水', reading: 'みず', meaning: 'Air' },
    { id: 5, kanji: '食べます', reading: 'たべます', meaning: 'Makan' },
    { id: 6, kanji: '飲みます', reading: 'のみます', meaning: 'Minum' },
    { id: 7, kanji: '大きい', reading: 'おおきい', meaning: 'Besar' },
    { id: 8, kanji: '小さい', reading: 'ちいさい', meaning: 'Kecil' },
    { id: 9, kanji: '新しい', reading: 'あたらしい', meaning: 'Baru' },
    { id: 10, kanji: '古い', reading: 'ふるい', meaning: 'Lama, usang' },
    { id: 11, kanji: '～時', reading: 'じ', meaning: '~ jam' },
    { id: 12, kanji: '～分', reading: 'ふん', meaning: '~ menit' },
    { id: 13, kanji: '～半', reading: 'はん', meaning: '~ setengah' },
    { id: 14, kanji: '月曜日', reading: 'げつようび', meaning: 'Senin' },
    { id: 15, kanji: '火曜日', reading: 'かようび', meaning: 'Selasa' },
    { id: 16, kanji: '水曜日', reading: 'すいようび', meaning: 'Rabu' },
    { id: 17, kanji: '木曜日', reading: 'もくようび', meaning: 'Kamis' },
    { id: 18, kanji: '金曜日', reading: 'きんようび', meaning: 'Jumat' },
    { id: 19, kanji: '土曜日', reading: 'どようび', meaning: 'Sabtu' },
    { id: 20, kanji: '日曜日', reading: 'にちようび', meaning: 'Minggu' },
    { id: 21, kanji: '言います', reading: 'いいます', meaning: 'Berkata' },
    { id: 22, kanji: '話します', reading: 'はなします', meaning: 'Berbicara' },
    { id: 23, kanji: '読みます', reading: 'よみます', meaning: 'Membaca' },
    { id: 24, kanji: '見ます', reading: 'みます', meaning: 'Melihat' },
    { id: 25, kanji: '聞きます', reading: 'ききます', meaning: 'Mendengarkan' },
    { id: 26, kanji: '書きます', reading: 'かきます', meaning: 'Menulis' },
    { id: 27, kanji: '一', reading: 'いち', meaning: 'Satu' },
    { id: 28, kanji: '二', reading: 'に', meaning: 'Dua' },
    { id: 29, kanji: '三', reading: 'さん', meaning: 'Tiga' },
    { id: 30, kanji: '四', reading: 'よん', meaning: 'Empat' },
    { id: 31, kanji: '五', reading: 'ご', meaning: 'Lima' },
    { id: 32, kanji: '六', reading: 'ろく', meaning: 'Enam' },
    { id: 33, kanji: '七', reading: 'なな', meaning: 'Tujuh' },
    { id: 34, kanji: '八', reading: 'はち', meaning: 'Delapan' },
    { id: 35, kanji: '九', reading: 'きゅう', meaning: 'Sembilan' },
    { id: 36, kanji: '十', reading: 'じゅう', meaning: 'Sepuluh' },
    { id: 37, kanji: '～年', reading: 'ねん', meaning: '~ tahun' },
    { id: 38, kanji: '～月', reading: 'がつ', meaning: '~ bulan' },
    { id: 39, kanji: '～日', reading: 'にち', meaning: '~ tanggal' },
    { id: 40, kanji: '東', reading: 'ひがし', meaning: 'Timur' },
    { id: 41, kanji: '西', reading: 'にし', meaning: 'Barat' },
    { id: 42, kanji: '南', reading: 'みなみ', meaning: 'Selatan' },
    { id: 43, kanji: '北', reading: 'きた', meaning: 'Utara' },
    { id: 44, kanji: '～口', reading: 'ぐち', meaning: '~ pintu' },
    { id: 45, kanji: '東口', reading: 'ひがしぐち', meaning: 'Pintu timur' },
    { id: 46, kanji: '西口', reading: 'にしぐち', meaning: 'Pintu barat' },
    { id: 47, kanji: '南口', reading: 'みなみぐち', meaning: 'Pintu selatan' },
    { id: 48, kanji: '北口', reading: 'きたぐち', meaning: 'Pintu utara' },
    { id: 49, kanji: '買います', reading: 'かいます', meaning: 'Membeli' },
    { id: 50, kanji: '買い物', reading: 'かいもの', meaning: 'Belanja' },
    { id: 51, kanji: 'お金', reading: 'おかね', meaning: 'Uang' },
    { id: 52, kanji: '～円', reading: 'えん', meaning: '~ yen' },
    { id: 53, kanji: '百', reading: 'ひゃく', meaning: '100' },
    { id: 54, kanji: '千', reading: 'せん', meaning: '1000' },
    { id: 55, kanji: '万', reading: 'まん', meaning: '10000' },
    { id: 56, kanji: '百円', reading: 'ひゃくえん', meaning: '100 yen' },
    { id: 57, kanji: '千円', reading: 'せんえん', meaning: '1000 yen' },
    { id: 58, kanji: '一万円', reading: 'いちまんえん', meaning: '10000 yen' },
    { id: 59, kanji: '行きます', reading: 'いきます', meaning: 'Pergi' },
    { id: 60, kanji: '来ます', reading: 'きます', meaning: 'Datang' },
    { id: 61, kanji: '会います', reading: 'あいます', meaning: 'Bertemu' },
    { id: 62, kanji: '休みます', reading: 'やすみます', meaning: 'Libur, istirahat' },
    { id: 63, kanji: '日本', reading: 'にほん', meaning: 'Jepang' },
    { id: 64, kanji: '東京', reading: 'とうきょう', meaning: 'Tokyo' },
    { id: 65, kanji: '私', reading: 'わたし', meaning: 'Saya' },
    { id: 66, kanji: '父', reading: 'ちち', meaning: 'Ayah' },
    { id: 67, kanji: '母', reading: 'はは', meaning: 'Ibu' },
    { id: 68, kanji: '子供', reading: 'こども', meaning: 'Anak' },
    { id: 69, kanji: '男', reading: 'おとこ', meaning: 'Laki-laki' },
    { id: 70, kanji: '女', reading: 'おんな', meaning: 'Perempuan' },
    { id: 71, kanji: '人', reading: 'ひと', meaning: 'Orang' },
    { id: 72, kanji: 'お父さん', reading: 'おとうさん', meaning: 'Ayah (orang lain)' },
    { id: 73, kanji: 'お母さん', reading: 'おかあさん', meaning: 'Ibu (orang lain)' },
    { id: 74, kanji: '何人', reading: 'なんにん', meaning: 'Berapa orang?' },
    { id: 75, kanji: '国', reading: 'くに', meaning: 'Negara' },
    { id: 76, kanji: '外国', reading: 'がいこく', meaning: 'Luar negeri' },
    { id: 77, kanji: '～語', reading: 'ご', meaning: '~ Bahasa' },
    { id: 78, kanji: '日本語', reading: 'にほんご', meaning: 'Bahasa Jepang' },
    { id: 79, kanji: '英語', reading: 'えいご', meaning: 'Bahasa Inggris' },
    { id: 80, kanji: '中国語', reading: 'ちゅうごくご', meaning: 'Bahasa China' },
    { id: 81, kanji: '～人', reading: 'じん', meaning: '~ orang' },
    { id: 82, kanji: '日本人', reading: 'にほんじん', meaning: 'Orang Jepang' },
    { id: 83, kanji: '好き', reading: 'すき', meaning: 'Suka' },
    { id: 84, kanji: '本', reading: 'ほん', meaning: 'Buku' },
    { id: 85, kanji: '読書', reading: 'どくしょ', meaning: 'Bacaan' },
    { id: 86, kanji: '何', reading: 'なに', meaning: 'Apa?' },
    { id: 87, kanji: '春', reading: 'はる', meaning: 'Musim semi' },
    { id: 88, kanji: '夏', reading: 'なつ', meaning: 'Musim panas' },
    { id: 89, kanji: '秋', reading: 'あき', meaning: 'Musim gugur' },
    { id: 90, kanji: '冬', reading: 'ふゆ', meaning: 'Musim dingin' },
    { id: 91, kanji: '今', reading: 'いま', meaning: 'Sekarang' },
    { id: 92, kanji: '花', reading: 'はな', meaning: 'Bunga' },
    { id: 93, kanji: '海', reading: 'うみ', meaning: 'Laut' },
    { id: 94, kanji: '山', reading: 'やま', meaning: 'Gunung' },
    { id: 95, kanji: '川', reading: 'かわ', meaning: 'Sungai' },
    { id: 96, kanji: '今日', reading: 'きょう', meaning: 'Hari ini' },
    { id: 97, kanji: '天気', reading: 'てんき', meaning: 'Cuaca' },
    { id: 98, kanji: '晴れ', reading: 'はれ', meaning: 'Cerah' },
    { id: 99, kanji: '雨', reading: 'あめ', meaning: 'Hujan' },
    { id: 100, kanji: '雪', reading: 'ゆき', meaning: 'Salju' },
    { id: 101, kanji: '雲', reading: 'くも', meaning: 'Mendung' },
    { id: 102, kanji: '風', reading: 'かぜ', meaning: 'Angin' },
    { id: 103, kanji: '空', reading: 'そら', meaning: 'Langit' },
    { id: 104, kanji: '町', reading: 'まち', meaning: 'Kota' },
    { id: 105, kanji: '店', reading: 'みせ', meaning: 'Toko' },
    { id: 106, kanji: '人気', reading: 'にんき', meaning: 'Popularitas' },
    { id: 107, kanji: '多い', reading: 'おおい', meaning: 'Banyak' },
    { id: 108, kanji: '少ない', reading: 'すくない', meaning: 'Sedikit' },
    { id: 109, kanji: '高い', reading: 'たかい', meaning: 'Mahal' },
    { id: 110, kanji: '安い', reading: 'やすい', meaning: 'Murah' },
    { id: 111, kanji: '広い', reading: 'ひろい', meaning: 'Luas' },
    { id: 112, kanji: '道', reading: 'みち', meaning: 'Jalan' },
    { id: 113, kanji: '通り', reading: 'とおり', meaning: 'Jalan (depan)' },
    { id: 114, kanji: '右', reading: 'みぎ', meaning: 'Kanan' },
    { id: 115, kanji: '左', reading: 'ひだり', meaning: 'Kiri' },
    { id: 116, kanji: '一つ', reading: 'ひとつ', meaning: 'Satu buah' },
    { id: 117, kanji: '二つ', reading: 'ふたつ', meaning: 'Dua buah' },
    { id: 118, kanji: '赤い', reading: 'あかい', meaning: 'Merah' },
    { id: 119, kanji: '青い', reading: 'あおい', meaning: 'Biru' },
    { id: 120, kanji: '黒い', reading: 'くろい', meaning: 'Hitam' },
    { id: 121, kanji: '白い', reading: 'しろい', meaning: 'Putih' },
    { id: 122, kanji: '時間', reading: 'じかん', meaning: 'Waktu' },
    { id: 123, kanji: '場所', reading: 'ばしょ', meaning: 'Tempat' },
    { id: 124, kanji: '駅', reading: 'えき', meaning: 'Stasiun' },
    { id: 125, kanji: '日', reading: 'ひ', meaning: 'Matahari' },
    { id: 126, kanji: '出かけます', reading: 'でかけます', meaning: 'Meninggalkan rumah' },
    { id: 127, kanji: '待ちます', reading: 'まちます', meaning: 'Menunggu' },
    { id: 128, kanji: '止まります', reading: 'とまります', meaning: 'Berhenti' },
    { id: 129, kanji: '食事', reading: 'しょくじ', meaning: 'Makan bersama' },
    { id: 130, kanji: '仕事', reading: 'しごと', meaning: 'Pekerjaan' },
    { id: 131, kanji: '前', reading: 'まえ', meaning: 'Sebelum' },
    { id: 132, kanji: '後', reading: 'あと', meaning: 'Setelah' },
    { id: 133, kanji: '朝', reading: 'あさ', meaning: 'Pagi' },
    { id: 134, kanji: '昼', reading: 'ひる', meaning: 'Siang' },
    { id: 135, kanji: '夜', reading: 'よる', meaning: 'Malam' },
    { id: 136, kanji: '乗ります', reading: 'のります', meaning: 'Naik' },
    { id: 137, kanji: '学校', reading: 'がっこう', meaning: 'Sekolah' },
    { id: 138, kanji: '小学校', reading: 'しょうがっこう', meaning: 'SD' },
    { id: 139, kanji: '中学校', reading: 'ちゅうがっこう', meaning: 'SMP' },
    { id: 140, kanji: '高校', reading: 'こうこう', meaning: 'SMA' },
    { id: 141, kanji: '大学', reading: 'だいがく', meaning: 'Universitas' },
    { id: 142, kanji: '先生', reading: 'せんせい', meaning: 'Guru' },
    { id: 143, kanji: '学生', reading: 'がくせい', meaning: 'Murid, siswa' },
    { id: 144, kanji: '～年生', reading: 'ねんせい', meaning: 'Kelas ~' },
    { id: 145, kanji: '勉強', reading: 'べんきょう', meaning: 'Pelajaran' },
    { id: 146, kanji: '文化', reading: 'ぶんか', meaning: 'Kebudayaan' },
    { id: 147, kanji: '音楽', reading: 'おんがく', meaning: 'Musik' },
    { id: 148, kanji: '旅行', reading: 'りょこう', meaning: 'Wisata' },
    { id: 149, kanji: '留学', reading: 'りゅうがく', meaning: 'Belajar di luar negeri' },
    { id: 150, kanji: '友達', reading: 'ともだち', meaning: 'Teman' },
    { id: 151, kanji: '楽しい', reading: 'たのしい', meaning: 'Gembira' },
    { id: 152, kanji: '週', reading: 'しゅう', meaning: 'Minggu' },
    { id: 153, kanji: '～回', reading: 'かい', meaning: '~ kali' },
    { id: 154, kanji: '食べ物', reading: 'たべもの', meaning: 'Makanan' },
    { id: 155, kanji: '飲物', reading: 'のみもの', meaning: 'Minuman' },
    { id: 156, kanji: 'お茶', reading: 'おちゃ', meaning: 'Teh hijau' },
    { id: 157, kanji: 'お酒', reading: 'おさけ', meaning: 'Sake' },
    { id: 158, kanji: '作ります', reading: 'つくります', meaning: 'Membuat' },
    { id: 159, kanji: '持っていきます', reading: 'もっていきます', meaning: 'Membawa pergi' },
    { id: 160, kanji: 'お願いします', reading: 'おねがいします', meaning: 'Tolong' },
    { id: 161, kanji: '料理', reading: 'りょうり', meaning: 'Masakan' },
    { id: 162, kanji: '味', reading: 'あじ', meaning: 'Rasa' },
    { id: 163, kanji: '色', reading: 'いろ', meaning: 'Warna' },
    { id: 164, kanji: '野菜', reading: 'やさい', meaning: 'Sayuran' },
    { id: 165, kanji: '少し', reading: 'すこし', meaning: 'Sedikit' },
    { id: 166, kanji: '中', reading: 'なか', meaning: 'Dalam' },
    { id: 167, kanji: '入っています', reading: 'はいっています', meaning: 'Masuk' },
    { id: 168, kanji: '会社', reading: 'かいしゃ', meaning: 'Perusahaan' },
    { id: 169, kanji: '本社', reading: 'ほんしゃ', meaning: 'Kantor pusat' },
    { id: 170, kanji: '支社', reading: 'ししゃ', meaning: 'Kantor cabang' },
    { id: 171, kanji: '出張', reading: 'しゅっちょう', meaning: 'Dinas luar kota' },
    { id: 172, kanji: '空港', reading: 'くうこう', meaning: 'Bandara' },
    { id: 173, kanji: '出発', reading: 'しゅっぱつ', meaning: 'Keberangkatan' },
    { id: 174, kanji: '到着', reading: 'とうちゃく', meaning: 'Kedatangan' },
    { id: 175, kanji: '午前', reading: 'ごぜん', meaning: 'AM' },
    { id: 176, kanji: '午後', reading: 'ごご', meaning: 'PM' },
    { id: 177, kanji: '自分', reading: 'じぶん', meaning: 'Sendiri' },
    { id: 178, kanji: '電話', reading: 'でんわ', meaning: 'Telepon' },
    { id: 179, kanji: '電気', reading: 'でんき', meaning: 'Listrik' },
    { id: 180, kanji: '電車', reading: 'でんしゃ', meaning: 'Kereta' },
    { id: 181, kanji: '車', reading: 'くるま', meaning: 'Mobil' },
    { id: 182, kanji: '送ります', reading: 'おくります', meaning: 'Mengirim' },
    { id: 183, kanji: '使います', reading: 'つかいます', meaning: 'Menggunakan' },
    { id: 184, kanji: '借ります', reading: 'かります', meaning: 'Meminjam' },
    { id: 185, kanji: '体', reading: 'からだ', meaning: 'Badan' },
    { id: 186, kanji: '頭', reading: 'あたま', meaning: 'Kepala' },
    { id: 187, kanji: '目', reading: 'め', meaning: 'Mata' },
    { id: 188, kanji: '口', reading: 'くち', meaning: 'Mulut' },
    { id: 189, kanji: '耳', reading: 'みみ', meaning: 'Telinga' },
    { id: 190, kanji: '手', reading: 'て', meaning: 'Tangan' },
    { id: 191, kanji: '足', reading: 'あし', meaning: 'Kaki' },
    { id: 192, kanji: '上', reading: 'うえ', meaning: 'Atas' },
    { id: 193, kanji: '下', reading: 'した', meaning: 'Bawah' },
    { id: 194, kanji: '毎～', reading: 'まい', meaning: '~ setiap' },
    { id: 195, kanji: '毎朝', reading: 'まいあさ', meaning: 'Setiap pagi' },
    { id: 196, kanji: '毎日', reading: 'まいにち', meaning: 'Setiap hari' },
    { id: 197, kanji: '週末', reading: 'しゅうまつ', meaning: 'Akhir pekan' },
    { id: 198, kanji: '元気', reading: 'げんき', meaning: 'Sehat' },
    { id: 199, kanji: '外', reading: 'そと', meaning: 'Luar' },
    { id: 200, kanji: '起きます', reading: 'おきます', meaning: 'Bangun tidur' },
    { id: 201, kanji: '歩きます', reading: 'あるきます', meaning: 'Berjalan' },
    { id: 202, kanji: '走ります', reading: 'はしります', meaning: 'Berlari' },
    { id: 203, kanji: '泳ぎます', reading: 'およぎます', meaning: 'Berenang' },
    { id: 204, kanji: 'お祝い', reading: 'おいわい', meaning: 'Perayaan' },
    { id: 205, kanji: '誕生日', reading: 'たんじょうび', meaning: 'Ulang tahun' },
    { id: 206, kanji: '結婚', reading: 'けっこん', meaning: 'Pernikahan' },
    { id: 207, kanji: '絵', reading: 'え', meaning: 'Gambar, lukisan' },
    { id: 208, kanji: '写真', reading: 'しゃしん', meaning: 'Foto' },
    { id: 209, kanji: '時計', reading: 'とけい', meaning: 'Jam' },
    { id: 210, kanji: '着ます', reading: 'きます', meaning: 'Memakai pakaian' },
    { id: 211, kanji: '先～', reading: 'せん', meaning: '~ lalu' },
    { id: 212, kanji: '先週', reading: 'せんしゅう', meaning: 'Minggu lalu' },
    { id: 213, kanji: '今月', reading: 'こんげつ', meaning: 'Bulan ini' },
    { id: 214, kanji: '来年', reading: 'らいねん', meaning: 'Tahun depan' },
    { id: 215, kanji: '今年', reading: 'ことし', meaning: 'Tahun ini' },
    { id: 216, kanji: '去年', reading: 'きょねん', meaning: 'Tahun lalu' },
    { id: 217, kanji: '家', reading: 'いえ', meaning: 'Rumah' },
    { id: 218, kanji: '思います', reading: 'おもいます', meaning: 'Mengira' },
    { id: 219, kanji: '自己紹介', reading: 'じこしょうかい', meaning: 'Perkenalan' },
    { id: 220, kanji: '名前', reading: 'なまえ', meaning: 'Nama' },
    { id: 221, kanji: '意味', reading: 'いみ', meaning: 'Arti' },
    { id: 222, kanji: '本屋', reading: 'ほんや', meaning: 'Toko buku' },
    { id: 223, kanji: '近く', reading: 'ちかく', meaning: 'Dekat' },
    { id: 224, kanji: '住みます', reading: 'すみます', meaning: 'Tinggal' },
    { id: 225, kanji: '働きます', reading: 'はたらきます', meaning: 'Bekerja' },
    { id: 226, kanji: '～番目', reading: 'ばんめ', meaning: 'Urutan yang ~' },
    { id: 227, kanji: '兄', reading: 'あに', meaning: 'Kakak laki (sendiri)' },
    { id: 228, kanji: 'お兄さん', reading: 'おにいさん', meaning: 'Kakak laki (orang lain)' },
    { id: 229, kanji: '姉', reading: 'あね', meaning: 'Kakak perempuan (sendiri)' },
    { id: 230, kanji: 'お姉さん', reading: 'おねえさん', meaning: 'Kakak perempuan (orang lain)' },
    { id: 231, kanji: '弟', reading: 'おとうと', meaning: 'Adik laki (sendiri)' },
    { id: 232, kanji: '妹', reading: 'いもうと', meaning: 'Adik perempuan (sendiri)' },
    { id: 233, kanji: '家族', reading: 'かぞく', meaning: 'Keluarga' },
    { id: 234, kanji: '長い', reading: 'ながい', meaning: 'Panjang' },
    { id: 235, kanji: '短い', reading: 'みじかい', meaning: 'Pendek' },
    { id: 236, kanji: '低い', reading: 'ひくい', meaning: 'Rendah' },
    { id: 237, kanji: '上手', reading: 'じょうず', meaning: 'Pandai' },
    { id: 238, kanji: '歌', reading: 'うた', meaning: 'Lagu' },
    { id: 239, kanji: '歌います', reading: 'うたいます', meaning: 'Menyanyi' },
    { id: 240, kanji: '客', reading: 'きゃく', meaning: 'Tamu' },
    { id: 241, kanji: '注文', reading: 'ちゅうもん', meaning: 'Pesanan' },
    { id: 242, kanji: '洋食', reading: 'ようしょく', meaning: 'Makanan barat' },
    { id: 243, kanji: '和食', reading: 'わしょく', meaning: 'Makanan Jepang' },
    { id: 244, kanji: '牛肉', reading: 'ぎゅうにく', meaning: 'Daging sapi' },
    { id: 245, kanji: '地方', reading: 'ちほう', meaning: 'Daerah, wilayah' },
    { id: 246, kanji: '有名', reading: 'ゆうめい', meaning: 'Terkenal' },
    { id: 247, kanji: '生', reading: 'なま', meaning: 'Mentah' },
    { id: 248, kanji: '冷たい', reading: 'つめたい', meaning: 'Dingin (benda)' },
    { id: 249, kanji: 'ご飯', reading: 'ごはん', meaning: 'Nasi' },
    { id: 250, kanji: '塩', reading: 'しお', meaning: 'Garam' },
    { id: 251, kanji: '全部', reading: 'ぜんぶ', meaning: 'Semua' },
    { id: 252, kanji: '～方', reading: 'かた', meaning: 'Cara ~' },
    { id: 253, kanji: '食べ方', reading: 'たべかた', meaning: 'Cara makan' },
    { id: 254, kanji: '熱い', reading: 'あつい', meaning: 'Panas (benda)' },
    { id: 255, kanji: '苦手', reading: 'にがて', meaning: 'Tidak begitu suka' },
    { id: 256, kanji: '入れます', reading: 'いれます', meaning: 'Memasukkan' },
    { id: 257, kanji: '木', reading: 'き', meaning: 'Pohon' },
    { id: 258, kanji: '森', reading: 'もり', meaning: 'Hutan' },
    { id: 259, kanji: '島', reading: 'しま', meaning: 'Pulau' },
    { id: 260, kanji: '自然', reading: 'しぜん', meaning: 'Alam' },
    { id: 261, kanji: '船', reading: 'ふね', meaning: 'Kapal' },
    { id: 262, kanji: '暑い', reading: 'あつい', meaning: 'Panas (cuaca)' },
    { id: 263, kanji: '帰ります', reading: 'かえります', meaning: 'Pulang' },
    { id: 264, kanji: '予約します', reading: 'よやくします', meaning: 'Memesan' },
    { id: 265, kanji: '運転します', reading: 'うんてんします', meaning: 'Menyetir' },
    { id: 266, kanji: '～中', reading: 'ちゅう', meaning: 'Sedang/dalam ~' },
    { id: 267, kanji: '旅行中', reading: 'りょこうちゅう', meaning: 'Sedang wisata' },
    { id: 268, kanji: '観光地', reading: 'かんこうち', meaning: 'Tempat wisata' },
    { id: 269, kanji: '女性', reading: 'じょせい', meaning: 'Wanita' },
    { id: 270, kanji: '男性', reading: 'だんせい', meaning: 'Pria' },
    { id: 271, kanji: '動物', reading: 'どうぶつ', meaning: 'Hewan' },
    { id: 272, kanji: '空気', reading: 'くうき', meaning: 'Udara' },
    { id: 273, kanji: '料金', reading: 'りょうきん', meaning: 'Biaya, tarif' },
    { id: 274, kanji: '無料', reading: 'むりょう', meaning: 'Gratis' },
    { id: 275, kanji: '明るい', reading: 'あかるい', meaning: 'Terang' },
    { id: 276, kanji: '便利', reading: 'べんり', meaning: 'Praktis' },
    { id: 277, kanji: '一年中', reading: 'いちねんじゅう', meaning: 'Dalam satu tahun' },
    { id: 278, kanji: '受付', reading: 'うけつけ', meaning: 'Penerima tamu' },
    { id: 279, kanji: '広場', reading: 'ひろば', meaning: 'Lapangan' },
    { id: 280, kanji: '問題', reading: 'もんだい', meaning: 'Soal, masalah' },
    { id: 281, kanji: '同じ', reading: 'おなじ', meaning: 'Sama' },
    { id: 282, kanji: '集まります', reading: 'あつまります', meaning: 'Berkumpul' },
    { id: 283, kanji: '始まります', reading: 'はじまります', meaning: 'Mulai' },
    { id: 284, kanji: '終わります', reading: 'おわります', meaning: 'Selesai' },
    { id: 285, kanji: '中止します', reading: 'ちゅうしします', meaning: 'Membatalkan' },
    { id: 286, kanji: '教えます', reading: 'おしえます', meaning: 'Memberitahu' },
    { id: 287, kanji: 'お祭り', reading: 'おまつり', meaning: 'Perayaan' },
    { id: 288, kanji: '日本祭り', reading: 'にほんまつり', meaning: 'Perayaan Jepang' },
    { id: 289, kanji: '会場', reading: 'かいじょう', meaning: 'Ruang pertemuan' },
    { id: 290, kanji: '入場料', reading: 'にゅうじょうりょう', meaning: 'Tarif masuk' },
    { id: 291, kanji: '参加者', reading: 'さんかしゃ', meaning: 'Peserta' },
    { id: 292, kanji: '急ぎます', reading: 'いそぎます', meaning: 'Buru-buru' },
    { id: 293, kanji: '決めます', reading: 'きめます', meaning: 'Menentukan' },
    { id: 294, kanji: '知ります', reading: 'しります', meaning: 'Kenal, tahu' },
    { id: 295, kanji: '正月', reading: 'しょうがつ', meaning: 'Tahun baru' },
    { id: 296, kanji: '年末', reading: 'ねんまつ', meaning: 'Akhir tahun' },
    { id: 297, kanji: '年始', reading: 'ねんし', meaning: 'Awal tahun' },
    { id: 298, kanji: '親', reading: 'おや', meaning: 'Orang tua' },
    { id: 299, kanji: '忙しい', reading: 'いそがしい', meaning: 'Sibuk' },
    { id: 300, kanji: '特別', reading: 'とくべつ', meaning: 'Istimewa, spesial' },
    { id: 301, kanji: '帰国', reading: 'きこく', meaning: 'Pulang ke negara' },
    { id: 302, kanji: '喜びます', reading: 'よろこびます', meaning: 'Merasa senang' },
    { id: 303, kanji: '幸せ', reading: 'しあわせ', meaning: 'Bahagia' },
    { id: 304, kanji: '成長', reading: 'せいちょう', meaning: 'Pertumbuhan' },
    { id: 305, kanji: '長生き', reading: 'ながいき', meaning: 'Umur panjang' },
    { id: 306, kanji: '願い事', reading: 'ねがいこと', meaning: 'Keinginan, harapan' },
    { id: 307, kanji: '合格', reading: 'ごうかく', meaning: 'Lulus' },
    { id: 308, kanji: '試験', reading: 'しけん', meaning: 'Ujian' },
    { id: 309, kanji: '大人', reading: 'おとな', meaning: 'Orang dewasa' },
    { id: 310, kanji: '～式', reading: 'しき', meaning: 'Upacara ~' },
    { id: 311, kanji: '～市', reading: 'し', meaning: 'Kota ~' },
    { id: 312, kanji: '商品', reading: 'しょうひん', meaning: 'Barang dagangan' },
    { id: 313, kanji: '電気製品', reading: 'でんきせいひん', meaning: 'Peralatan listrik' },
    { id: 314, kanji: '電子レンジ', reading: 'でんしレンジ', meaning: 'Oven' },
    { id: 315, kanji: '～機', reading: 'き', meaning: 'Mesin ~' },
    { id: 316, kanji: '店員', reading: 'てんいん', meaning: 'Penjaga toko' },
    { id: 317, kanji: '調子', reading: 'ちょうし', meaning: 'Keadaan, kondisi' },
    { id: 318, kanji: '悪い', reading: 'わるい', meaning: 'Jelek' },
    { id: 319, kanji: '動きます', reading: 'うごきます', meaning: 'Bergerak' },
    { id: 320, kanji: '考えます', reading: 'かんがえます', meaning: 'Berpikir' },
    { id: 321, kanji: '音', reading: 'おと', meaning: 'Suara (benda)' },
    { id: 322, kanji: '出ます', reading: 'でます', meaning: 'Keluar' },
    { id: 323, kanji: '機能', reading: 'きのう', meaning: 'Fungsi' },
    { id: 324, kanji: '省エネ', reading: 'しょうエネ', meaning: 'Penghematan energi' },
    { id: 325, kanji: '日本製', reading: 'にほんせい', meaning: 'Produk buatan Jepang' },
    { id: 326, kanji: '重い', reading: 'おもい', meaning: 'Berat' },
    { id: 327, kanji: '軽い', reading: 'かるい', meaning: 'Ringan' },
    { id: 328, kanji: '静か', reading: 'しずか', meaning: 'Tenang' },
    { id: 329, kanji: '早く', reading: 'はやく', meaning: 'Cepat' },
    { id: 330, kanji: '方', reading: 'ほう', meaning: 'Arah' },
    { id: 331, kanji: '洗います', reading: 'あらいます', meaning: 'Mencuci' },
    { id: 332, kanji: '満足します', reading: 'まんぞくします', meaning: 'Puas' },
    { id: 333, kanji: '京都', reading: 'きょうと', meaning: 'Kyoto' },
    { id: 334, kanji: '神社', reading: 'じんじゃ', meaning: 'Kuil Shinto' },
    { id: 335, kanji: 'お寺', reading: 'おてら', meaning: 'Kuil Buddha' },
    { id: 336, kanji: '仏教', reading: 'ぶっきょう', meaning: 'Agama Buddha' },
    { id: 337, kanji: '歴史', reading: 'れきし', meaning: 'Sejarah' },
    { id: 338, kanji: '世界', reading: 'せかい', meaning: 'Dunia' },
    { id: 339, kanji: '中心', reading: 'ちゅうしん', meaning: 'Pusat' },
    { id: 340, kanji: '～世紀', reading: 'せいき', meaning: 'Abad ~' },
    { id: 341, kanji: '～的', reading: 'てき', meaning: 'Berbau ~' },
    { id: 342, kanji: '日本的', reading: 'にほんてき', meaning: 'Berbau Jepang' },
    { id: 343, kanji: '歴史的', reading: 'れきしてき', meaning: 'Bersejarah' },
    { id: 344, kanji: '飲食', reading: 'いんしょく', meaning: 'Makan minum' },
    { id: 345, kanji: '禁止', reading: 'きんし', meaning: 'Larangan' },
    { id: 346, kanji: '説明', reading: 'せつめい', meaning: 'Penjelasan' },
    { id: 347, kanji: '道具', reading: 'どうぐ', meaning: 'Peralatan' },
    { id: 348, kanji: '博物館', reading: 'はくぶつかん', meaning: 'Museum' },
    { id: 349, kanji: '必要', reading: 'ひつよう', meaning: 'Keperluan, kebutuhan' },
    { id: 350, kanji: '～階', reading: 'かい', meaning: 'Lantai ~' },
    { id: 351, kanji: '油', reading: 'あぶら', meaning: 'Minyak, oli' },
    { id: 352, kanji: '紙', reading: 'かみ', meaning: 'Kertas' },
    { id: 353, kanji: '温度', reading: 'おんど', meaning: 'Suhu, derajat' },
    { id: 354, kanji: '活動', reading: 'かつどう', meaning: 'Kegiatan, aktivitas' },
    { id: 355, kanji: '会議室', reading: 'かいぎしつ', meaning: 'Ruang rapat' },
    { id: 356, kanji: '寒い', reading: 'さむい', meaning: 'Dingin (suhu)' },
    { id: 357, kanji: '出します', reading: 'だします', meaning: 'Mengeluarkan' },
    { id: 358, kanji: '～度', reading: 'ど', meaning: '~ derajat' },
    { id: 359, kanji: '～点', reading: 'てん', meaning: 'Nilai ~' },
    { id: 360, kanji: '服', reading: 'ふく', meaning: 'Baju, pakaian' },
    { id: 361, kanji: '自転車', reading: 'じてんしゃ', meaning: 'Sepeda' },
    { id: 362, kanji: '自動車', reading: 'じどうしゃ', meaning: 'Mobil' },
    { id: 363, kanji: '売ります', reading: 'うります', meaning: 'Menjual' },
    { id: 364, kanji: '貸します', reading: 'かします', meaning: 'Meminjamkan' },
    { id: 365, kanji: '返します', reading: 'かえします', meaning: 'Mengembalikan' },
    { id: 366, kanji: '変わります', reading: 'かわります', meaning: 'Mengganti' },
    { id: 367, kanji: '～用', reading: 'よう', meaning: 'Urusan ~' },
    { id: 368, kanji: '子供用', reading: 'こどもよう', meaning: 'Urusan anak' },
    { id: 369, kanji: '人生', reading: 'じんせい', meaning: 'Kehidupan' },
    { id: 370, kanji: '歌手', reading: 'かしゅ', meaning: 'Penyanyi' },
    { id: 371, kanji: '選手', reading: 'せんしゅ', meaning: 'Atlet, pemain' },
    { id: 372, kanji: '画家', reading: 'がか', meaning: 'Pelukis' },
    { id: 373, kanji: '作家', reading: 'さっか', meaning: 'Pengarang' },
    { id: 374, kanji: '入学', reading: 'にゅうがく', meaning: 'Masuk sekolah' },
    { id: 375, kanji: '卒業', reading: 'そつぎょう', meaning: 'Lulus (sekolah)' },
    { id: 376, kanji: '病気', reading: 'びょうき', meaning: 'Sakit' },
    { id: 377, kanji: '若い', reading: 'わかい', meaning: 'Muda' },
    { id: 378, kanji: '生まれます', reading: 'うまれます', meaning: 'Lahir' },
    { id: 379, kanji: '思い出', reading: 'おもいで', meaning: 'Kenang-kenangan' },
    { id: 380, kanji: '生活', reading: 'せいかつ', meaning: 'Kehidupan' },
    { id: 381, kanji: '映画', reading: 'えいが', meaning: 'Film' },
    { id: 382, kanji: '夫', reading: 'おっと', meaning: 'Suami (sendiri)' },
    { id: 383, kanji: '妻', reading: 'つま', meaning: 'Istri (sendiri)' },
    { id: 384, kanji: '両親', reading: 'りょうしん', meaning: 'Orang tua' },
    { id: 385, kanji: '不便', reading: 'ふべん', meaning: 'Tidak praktis' },
    { id: 386, kanji: '選びます', reading: 'えらびます', meaning: 'Memilih' },
    { id: 387, kanji: '寝ます', reading: 'ねます', meaning: 'Tidur' },
    { id: 388, kanji: '試合', reading: 'しあい', meaning: 'Pertandingan' },
    { id: 389, kanji: '強い', reading: 'つよい', meaning: 'Kuat' },
    { id: 390, kanji: '弱い', reading: 'よわい', meaning: 'Lemah' },
    { id: 391, kanji: '勝ちます', reading: 'かちます', meaning: 'Menang' },
    { id: 392, kanji: '負けます', reading: 'まけます', meaning: 'Kalah' },
    { id: 393, kanji: '～対～', reading: 'たい', meaning: '~ lawan ~' },
    { id: 394, kanji: '庭', reading: 'にわ', meaning: 'Halaman' },
    { id: 395, kanji: '公園', reading: 'こうえん', meaning: 'Taman' },
    { id: 396, kanji: '病院', reading: 'びょういん', meaning: 'Rumah sakit' },
    { id: 397, kanji: '交通', reading: 'こうつう', meaning: 'Lalu lintas' },
    { id: 398, kanji: '通勤', reading: 'つうきん', meaning: 'Perjalanan ke kantor' },
    { id: 399, kanji: '安全', reading: 'あんぜん', meaning: 'Keselamatan' },
    { id: 400, kanji: '危ない', reading: 'あぶない', meaning: 'Bahaya' },
    { id: 401, kanji: '遠い', reading: 'とおい', meaning: 'Jauh' },
    { id: 402, kanji: '努めます', reading: 'つとめます', meaning: 'Bekerja keras' },
    { id: 403, kanji: '～以上', reading: 'いじょう', meaning: '~ lebih' },
    { id: 404, kanji: '～以下', reading: 'いか', meaning: '~ kurang' },
    { id: 405, kanji: '海外', reading: 'かいがい', meaning: 'Luar negeri' },
    { id: 406, kanji: '食生活', reading: 'しょくせいかつ', meaning: 'Susunan makanan' },
    { id: 407, kanji: '健康', reading: 'けんこう', meaning: 'Kesehatan' },
    { id: 408, kanji: '家庭料理', reading: 'かていりょうり', meaning: 'Masakan rumah tangga' },
    { id: 409, kanji: '材料', reading: 'ざいりょう', meaning: 'Bahan' },
    { id: 410, kanji: '量', reading: 'りょう', meaning: 'Jumlah, kuantitas' },
    { id: 411, kanji: '米', reading: 'こめ', meaning: 'Beras' },
    { id: 412, kanji: '～食', reading: 'しょく', meaning: 'Makan ~' },
    { id: 413, kanji: '朝食', reading: 'ちょうしょく', meaning: 'Makan pagi' },
    { id: 414, kanji: '昼食', reading: 'ちゅうしょく', meaning: 'Makan siang' },
    { id: 415, kanji: '夕食', reading: 'ゆうしょく', meaning: 'Makan malam' },
    { id: 416, kanji: '外食', reading: 'がいしょく', meaning: 'Makan di luar' },
    { id: 417, kanji: '定食', reading: 'ていしょく', meaning: 'Menu tetap' },
    { id: 418, kanji: '住所', reading: 'じゅうしょ', meaning: 'Alamat' },
    { id: 419, kanji: '訪問', reading: 'ほうもん', meaning: 'Kunjungan' },
    { id: 420, kanji: '経験', reading: 'けいけん', meaning: 'Pengalaman' },
    { id: 421, kanji: '親切', reading: 'しんせつ', meaning: 'Ramah' },
    { id: 422, kanji: '座ります', reading: 'すわります', meaning: 'Duduk' },
    { id: 423, kanji: '立ちます', reading: 'たちます', meaning: 'Berdiri' },
    { id: 424, kanji: '～観', reading: 'かん', meaning: 'Pandangan ~' },
    { id: 425, kanji: '約～', reading: 'やく', meaning: 'Kira-kira, sekitar' },
    { id: 426, kanji: '計画', reading: 'けいかく', meaning: 'Rencana, program' },
    { id: 427, kanji: '自信', reading: 'じしん', meaning: 'Percaya diri' },
    { id: 428, kanji: '方法', reading: 'ほうほう', meaning: 'Cara' },
    { id: 429, kanji: '目的', reading: 'もくてき', meaning: 'Tujuan' },
    { id: 430, kanji: '難しい', reading: 'むずかしい', meaning: 'Sulit' },
    { id: 431, kanji: '通じます', reading: 'つうじます', meaning: 'Menguasai, berhubungan' },
    { id: 432, kanji: '習います', reading: 'ならいます', meaning: 'Belajar kepada' },
    { id: 433, kanji: '学びます', reading: 'まなびます', meaning: 'Belajar' },
    { id: 434, kanji: '～級', reading: 'きゅう', meaning: 'Kelas, tingkat ~' },
    { id: 435, kanji: '初級', reading: 'しょきゅう', meaning: 'Kelas dasar' },
    { id: 436, kanji: '中級', reading: 'ちゅうきゅう', meaning: 'Kelas menengah' },
    { id: 437, kanji: '上級', reading: 'じょうきゅう', meaning: 'Kelas atas' },
    { id: 438, kanji: '相手', reading: 'あいて', meaning: 'Pasangan, lawan' },
    { id: 439, kanji: '気持ち', reading: 'きもち', meaning: 'Perasaan' },
    { id: 440, kanji: '恋人', reading: 'こいびと', meaning: 'Pacar' },
    { id: 441, kanji: '出会い', reading: 'であい', meaning: 'Pertemuan' },
    { id: 442, kanji: '最近', reading: 'さいきん', meaning: 'Akhir-akhir ini' },
    { id: 443, kanji: '最高', reading: 'さいこう', meaning: 'Teratas, tertinggi' },
    { id: 444, kanji: '出席', reading: 'しゅっせき', meaning: 'Kehadiran' },
    { id: 445, kanji: '招待', reading: 'しょうたい', meaning: 'Undangan' },
    { id: 446, kanji: '～合う', reading: 'あう', meaning: 'Cocok ~' },
    { id: 447, kanji: '社会人', reading: 'しゃかいじん', meaning: 'Anggota masyarakat' },
    { id: 448, kanji: '職場', reading: 'しょくば', meaning: 'Tempat kerja' },
    { id: 449, kanji: '給料', reading: 'きゅうりょう', meaning: 'Gaji' },
    { id: 450, kanji: '人間関係', reading: 'にんげんかんけい', meaning: 'Hubungan antar manusia' },
    { id: 451, kanji: '親友', reading: 'しんゆう', meaning: 'Teman karib' },
    { id: 452, kanji: '恋愛', reading: 'れんあい', meaning: 'Percintaan, asmara' },
    { id: 453, kanji: '相談', reading: 'そうだん', meaning: 'Musyawarah' },
    { id: 454, kanji: '心', reading: 'こころ', meaning: 'Hati' },
    { id: 455, kanji: '心配', reading: 'しんぱい', meaning: 'Khawatir' },
    { id: 456, kanji: '不安', reading: 'ふあん', meaning: 'Kegelisahan' },
    { id: 457, kanji: 'お客様', reading: 'おきゃくさま', meaning: 'Tamu' },
    { id: 458, kanji: '手続き', reading: 'てつづき', meaning: 'Prosedur' },
    { id: 459, kanji: '飛行機', reading: 'ひこうき', meaning: 'Pesawat terbang' },
    { id: 460, kanji: '変更', reading: 'へんこう', meaning: 'Perubahan' },
    { id: 461, kanji: '予定', reading: 'よてい', meaning: 'Rencana' },
    { id: 462, kanji: '利用', reading: 'りよう', meaning: 'Penggunaan, pemakaian' },
    { id: 463, kanji: '忘れ物', reading: 'わすれもの', meaning: 'Benda yang tertinggal' },
    { id: 464, kanji: '助けます', reading: 'たすけます', meaning: 'Menolong' },
    { id: 465, kanji: '～航空', reading: 'こうくう', meaning: 'Penerbangan ~' },
    { id: 466, kanji: '～便', reading: 'びん', meaning: 'Penerbangan, pos' },
    { id: 467, kanji: '体力', reading: 'たいりょく', meaning: 'Kekuatan' },
    { id: 468, kanji: '協力', reading: 'きょうりょく', meaning: 'Kerjasama' },
    { id: 469, kanji: '担当', reading: 'たんとう', meaning: 'Petugas' },
    { id: 470, kanji: '報告', reading: 'ほうこく', meaning: 'Melaporkan' },
    { id: 471, kanji: '連絡', reading: 'れんらく', meaning: 'Menghubungi' },
    { id: 472, kanji: '募集', reading: 'ぼしゅう', meaning: 'Penerimaan, perekrutan' },
    { id: 473, kanji: '輸出', reading: 'ゆしゅつ', meaning: 'Ekspor' },
    { id: 474, kanji: '輸入', reading: 'ゆにゅう', meaning: 'Impor' },
    { id: 475, kanji: '会話', reading: 'かいわ', meaning: 'Percakapan' },
    { id: 476, kanji: '形', reading: 'かたち', meaning: 'Bentuk' },
    { id: 477, kanji: '漢字', reading: 'かんじ', meaning: 'Kanji' },
    { id: 478, kanji: '答え', reading: 'こたえ', meaning: 'Jawaban' },
    { id: 479, kanji: '質問', reading: 'しつもん', meaning: 'Pertanyaan' },
    { id: 480, kanji: '正しい', reading: 'ただしい', meaning: 'Benar' },
    { id: 481, kanji: '読解', reading: 'どっかい', meaning: 'Bacaan' },
    { id: 482, kanji: '表現', reading: 'ひょうげん', meaning: 'Pengucapan' },
    { id: 483, kanji: '文', reading: 'ぶん', meaning: 'Kalimat' },
    { id: 484, kanji: '文型', reading: 'ぶんけい', meaning: 'Pola kalimat' },
    { id: 485, kanji: '文法', reading: 'ぶんぽう', meaning: 'Tata Bahasa' },
    { id: 486, kanji: 'もう一度', reading: 'もういちど', meaning: 'Sekali lagi' },
    { id: 487, kanji: '例', reading: 'れい', meaning: 'Contoh' },
    { id: 488, kanji: '練習', reading: 'れんしゅう', meaning: 'Latihan' },
    { id: 489, kanji: '～枚', reading: 'まい', meaning: '~ lembar' },
    { id: 490, kanji: '今週', reading: 'こんしゅう', meaning: 'Minggu ini' },
    { id: 491, kanji: '今度', reading: 'こんど', meaning: 'Lain kali' },
    { id: 492, kanji: '横', reading: 'よこ', meaning: 'Sebelah' },
    { id: 493, kanji: '押します', reading: 'おします', meaning: 'Menekan, mendorong' },
    { id: 494, kanji: '引きます', reading: 'ひきます', meaning: 'Menarik' },
    { id: 495, kanji: '温泉', reading: 'おんせん', meaning: 'Pemandian air panas' },
    { id: 496, kanji: '来週', reading: 'らいしゅう', meaning: 'Minggu depan' },
    { id: 497, kanji: '犬', reading: 'いぬ', meaning: 'Anjing' },
    { id: 498, kanji: '夕方', reading: 'ゆうがた', meaning: 'Sore' },
    { id: 499, kanji: '季節', reading: 'きせつ', meaning: 'Musim' },
    { id: 500, kanji: '昨日', reading: 'きのう', meaning: 'Kemarin' },
    { id: 501, kanji: '明日', reading: 'あした', meaning: 'Besok' },
    { id: 502, kanji: '食堂', reading: 'しょくどう', meaning: 'Kantin' },
    { id: 503, kanji: '銀行', reading: 'ぎんこう', meaning: 'Bank' },
    { id: 504, kanji: '受付', reading: 'うけつけ', meaning: 'Resepsionis' },
    { id: 505, kanji: '門', reading: 'もん', meaning: 'Pintu gerbang' },
    { id: 506, kanji: '登ります', reading: 'のぼります', meaning: 'Mendaki' },
    { id: 507, kanji: '教科書', reading: 'きょうかしょ', meaning: 'Buku panduan' },
    { id: 508, kanji: '教室', reading: 'きょうしつ', meaning: 'Ruang kelas' },
    { id: 509, kanji: '参加します', reading: 'さんかします', meaning: 'Berpartisipasi' },
    { id: 510, kanji: '用意します', reading: 'よういします', meaning: 'Menyiapkan' },
    { id: 511, kanji: '豚肉', reading: 'ぶたにく', meaning: 'Daging babi' },
    { id: 512, kanji: '皿', reading: 'さら', meaning: 'Piring' },
    { id: 513, kanji: 'お湯', reading: 'おゆ', meaning: 'Air panas' },
    { id: 514, kanji: '調理方法', reading: 'ちょうりほうほう', meaning: 'Cara memasak' },
    { id: 515, kanji: '甘い', reading: 'あまい', meaning: 'Manis' },
    { id: 516, kanji: '辛い', reading: 'からい', meaning: 'Pedas' },
    { id: 517, kanji: '数字', reading: 'すうじ', meaning: 'Angka, bilangan' },
    { id: 518, kanji: '机', reading: 'つくえ', meaning: 'Meja' },
    { id: 519, kanji: '都合', reading: 'つごう', meaning: 'Keadaan' },
    { id: 520, kanji: '用事', reading: 'ようじ', meaning: 'Keperluan' },
    { id: 521, kanji: '氏名', reading: 'しめい', meaning: 'Nama lengkap' },
    { id: 522, kanji: '理由', reading: 'りゆう', meaning: 'Alasan' },
    { id: 523, kanji: '別に', reading: 'べつに', meaning: 'Beda-beda' },
    { id: 524, kanji: '連絡先', reading: 'れんらくさき', meaning: 'Alamat yang dapat dihubungi' },
    { id: 525, kanji: '吸います', reading: 'すいます', meaning: 'Menghisap' },
    { id: 526, kanji: '取ります', reading: 'とります', meaning: 'Mengambil' },
    { id: 527, kanji: '伝えます', reading: 'つたえます', meaning: 'Menyampaikan' },
    { id: 528, kanji: '熱', reading: 'ねつ', meaning: 'Demam' },
    { id: 529, kanji: '薬', reading: 'くすり', meaning: 'Obat' },
    { id: 530, kanji: '医者', reading: 'いしゃ', meaning: 'Dokter' },
    { id: 531, kanji: '～才', reading: 'さい', meaning: 'Umur ~' },
    { id: 532, kanji: '眠い', reading: 'ねむい', meaning: 'Ngantuk' },
    { id: 533, kanji: '記入します', reading: 'きにゅうします', meaning: 'Mengisi di kertas' },
    { id: 534, kanji: '顔', reading: 'かお', meaning: 'Wajah' },
    { id: 535, kanji: '泣きます', reading: 'なきます', meaning: 'Menangis' },
    { id: 536, kanji: '会計', reading: 'かいけい', meaning: 'Pembayaran' },
    { id: 537, kanji: '電話番号', reading: 'でんわばんごう', meaning: 'Nomor telepon' },
    { id: 538, kanji: '牛乳', reading: 'ぎゅうにゅう', meaning: 'Susu sapi' },
    { id: 539, kanji: '禁煙', reading: 'きんえん', meaning: 'Larangan merokok' },
    { id: 540, kanji: '自由', reading: 'じゆう', meaning: 'Bebas' },
    { id: 541, kanji: '切ります', reading: 'きります', meaning: 'Memotong' },
    { id: 542, kanji: '焼きます', reading: 'やきます', meaning: 'Memanggang' },
    { id: 543, kanji: '旅館', reading: 'りょかん', meaning: 'Penginapan' },
    { id: 544, kanji: '遊びます', reading: 'あそびます', meaning: 'Bermain' },
    { id: 545, kanji: '調べます', reading: 'しらべます', meaning: 'Memeriksa' },
    { id: 546, kanji: '事故', reading: 'じこ', meaning: 'Kecelakaan' },
    { id: 547, kanji: '故障', reading: 'こしょう', meaning: 'Kerusakan' },
    { id: 548, kanji: '指定席', reading: 'していせき', meaning: 'Tempat duduk yang ditetapkan' },
    { id: 549, kanji: '光ります', reading: 'ひかります', meaning: 'Bercahaya, bersinar' },
    { id: 550, kanji: 'お知らせ', reading: 'おしらせ', meaning: 'Pengumuman' },
    { id: 551, kanji: '水道', reading: 'すいどう', meaning: 'Ledeng' },
    { id: 552, kanji: '工事', reading: 'こうじ', meaning: 'Konstruksi' },
    { id: 553, kanji: '場合', reading: 'ばあい', meaning: 'Kesempatan' },
    { id: 554, kanji: '条件', reading: 'じょうけん', meaning: 'Syarat-syarat, kondisi' },
    { id: 555, kanji: '開きます', reading: 'ひらきます', meaning: 'Membuka' },
    { id: 556, kanji: '生産します', reading: 'せいさんします', meaning: 'Memproduksi' },
    { id: 557, kanji: '体験', reading: 'たいけん', meaning: 'Percobaan' },
    { id: 558, kanji: '国際交流', reading: 'こくさいこうりゅう', meaning: 'Pertukaran budaya internasional' },
    { id: 559, kanji: '申し込みます', reading: 'もうしこみます', meaning: 'Melamar (pekerjaan)' },
    { id: 560, kanji: '昨年', reading: 'さくねん', meaning: 'Tahun lalu' },
    { id: 561, kanji: '毎年', reading: 'まいとし', meaning: 'Setiap tahun' },
    { id: 562, kanji: '袋', reading: 'ふくろ', meaning: 'Kantong plastik' },
    { id: 563, kanji: '店長', reading: 'てんちょう', meaning: 'Manajer toko' },
    { id: 564, kanji: '全員', reading: 'ぜんいん', meaning: 'Semuanya' },
    { id: 565, kanji: '習慣', reading: 'しゅうかん', meaning: 'Kebiasaan' },
    { id: 566, kanji: '普通', reading: 'ふつう', meaning: 'Biasa' },
    { id: 567, kanji: '暗い', reading: 'くらい', meaning: 'Gelap' },
    { id: 568, kanji: '怒ります', reading: 'おこります', meaning: 'Marah' },
    { id: 569, kanji: '入院します', reading: 'にゅういんします', meaning: 'Masuk rumah sakit' },
    { id: 570, kanji: '退院します', reading: 'たいいんします', meaning: 'Keluar rumah sakit' },
    { id: 571, kanji: '急に', reading: 'きゅうに', meaning: 'Tiba-tiba' },
    { id: 572, kanji: '営業します', reading: 'えいぎょうします', meaning: 'Buka (usaha)' },
    { id: 573, kanji: '案内します', reading: 'あんないします', meaning: 'Memandu' },
    { id: 574, kanji: '値段', reading: 'ねだん', meaning: 'Harga' },
    { id: 575, kanji: '価格', reading: 'かかく', meaning: 'Harga (formal)' },
    { id: 576, kanji: '消費税', reading: 'しょうひぜい', meaning: 'Pajak konsumen' },
    { id: 577, kanji: '税別', reading: 'ぜいべつ', meaning: 'Belum termasuk pajak' },
    { id: 578, kanji: '図書館', reading: 'としょかん', meaning: 'Perpustakaan' },
    { id: 579, kanji: '開きます', reading: 'あきます', meaning: 'Terbuka' },
    { id: 580, kanji: '閉まります', reading: 'しまります', meaning: 'Tertutup' },
    { id: 581, kanji: '利用します', reading: 'りようします', meaning: 'Menggunakan' },
    { id: 582, kanji: '窓口', reading: 'まどぐち', meaning: 'Konter, loket' },
    { id: 583, kanji: '郵便局', reading: 'ゆうびんきょく', meaning: 'Kantor pos' },
    { id: 584, kanji: '近所', reading: 'きんじょ', meaning: 'Tetangga' },
    { id: 585, kanji: '自動', reading: 'じどう', meaning: 'Otomatis' },
    { id: 586, kanji: '危険', reading: 'きけん', meaning: 'Bahaya' },
    { id: 587, kanji: '～種類', reading: 'しゅるい', meaning: '~ macam, jenis' },
    { id: 588, kanji: '消します', reading: 'けします', meaning: 'Memadamkan' },
    { id: 589, kanji: '捨てます', reading: 'すてます', meaning: 'Membuang' },
    { id: 590, kanji: '分けます', reading: 'わけます', meaning: 'Membagi' },
    { id: 591, kanji: '燃えます', reading: 'もえます', meaning: 'Terbakar' },
    { id: 592, kanji: '設定します', reading: 'せっていします', meaning: 'Menyeting' },
    { id: 593, kanji: '地震', reading: 'じしん', meaning: 'Gempa' },
    { id: 594, kanji: '台風', reading: 'たいふう', meaning: 'Angin topan' },
    { id: 595, kanji: '声', reading: 'こえ', meaning: 'Suara' },
    { id: 596, kanji: '大切', reading: 'たいせつ', meaning: 'Penting' },
    { id: 597, kanji: '進みます', reading: 'すすみます', meaning: 'Maju' },
    { id: 598, kanji: '授業', reading: 'じゅぎょう', meaning: 'Pelajaran' },
    { id: 599, kanji: '大変', reading: 'たいへん', meaning: 'Berat (perasaan)' },
    { id: 600, kanji: '困ります', reading: 'こまります', meaning: 'Susah' },
    { id: 601, kanji: '違います', reading: 'ちがいます', meaning: 'Salah, berbeda' },
    { id: 602, kanji: '慣れます', reading: 'なれます', meaning: 'Terbiasa' },
    { id: 603, kanji: '増えます', reading: 'ふえます', meaning: 'Bertambah' },
    { id: 604, kanji: '笑います', reading: 'わらいます', meaning: 'Tertawa' },
    { id: 605, kanji: '苦労します', reading: 'くろうします', meaning: 'Bersakit-sakit (dalam usaha)' },
    { id: 606, kanji: '希望', reading: 'きぼう', meaning: 'Harapan, keinginan' },
    { id: 607, kanji: '特に', reading: 'とくに', meaning: 'Terutama' },
    { id: 608, kanji: '建てます', reading: 'たてます', meaning: 'Mendirikan' },
    { id: 609, kanji: '続けます', reading: 'つづけます', meaning: 'Melanjutkan' },
    { id: 610, kanji: '役に立ちます', reading: 'やくにたちます', meaning: 'Bermanfaat' },
  ];

  const FIELDS = ['kanji', 'reading', 'meaning'];
  const FIELD_LABELS = {
    kanji: { ja: '漢字', id: 'Kanji' },
    reading: { ja: '読み方', id: 'Hiragana' },
    meaning: { ja: '意味', id: 'Arti' },
  };
  const STORAGE_KEY = 'used_kanji_ids';
  const STORAGE_TIMEOUT_MS = 1500;

  // --- Category tagging for smart distractors ---
  const getCategory = (e) => {
    const k = e.kanji, m = e.meaning.toLowerCase();
    if (k.endsWith('曜日')) return 'DAY';
    if (k.endsWith('ます') || k.endsWith('します')) return 'VERB';
    if (/い$/.test(k) && !k.endsWith('ます') && k.length <= 5) return 'ADJ';
    if (['一','二','三','四','五','六','七','八','九','十','百','千','万','億'].includes(k)) return 'NUM';
    if (m.includes('musim')) return 'SEASON';
    if (m.includes('timur')||m.includes('barat')||m.includes('selatan')||m.includes('utara')||m.includes('kanan')||m.includes('kiri')||m.includes('atas')||m.includes('bawah')) return 'DIR';
    if (m.includes('pintu')) return 'GATE';
    if (m.includes('ayah')||m.includes('ibu')||m.includes('kakak')||m.includes('adik')||m.includes('keluarga')||m.includes('suami')||m.includes('istri')||m.includes('orang tua')) return 'FAM';
    if (['体','頭','目','口','耳','手','足','顔','首','鼻'].includes(k)) return 'BODY';
    if (m.includes('daging')||m.includes('nasi')||m.includes('makan')||m.includes('sayur')||m.includes('garam')||m.includes('gula')||m.includes('susu')||m.includes('masakan')||m.includes('ikan')||m.includes('telur')) return 'FOOD';
    if (m.includes('sekolah')||m.includes('universitas')||m.includes('guru')||m.includes('murid')||m.includes('kelas')||m.includes('pelajaran')) return 'SCHOOL';
    if (m.includes('stasiun')||m.includes('bank')||m.includes('rumah sakit')||m.includes('toko')||m.includes('kantor')||m.includes('bandara')||m.includes('museum')||m.includes('perpustakaan')) return 'PLACE';
    if (m.includes('minggu')||m.includes('bulan')||m.includes('tahun')||m.includes('pagi')||m.includes('siang')||m.includes('malam')||m.includes('hari')||m.includes('sore')||m.includes('setiap')||m.includes('lalu')||m.includes('depan')) return 'TIME';
    if (m.includes('hujan')||m.includes('salju')||m.includes('angin')||m.includes('cuaca')||m.includes('langit')||m.includes('mendung')||m.includes('cerah')) return 'WEATHER';
    if (m.includes('bahasa')) return 'LANG';
    if (m.includes('merah')||m.includes('biru')||m.includes('hitam')||m.includes('putih')||m.includes('warna')) return 'COLOR';
    if (m.includes('kereta')||m.includes('mobil')||m.includes('sepeda')||m.includes('pesawat')||m.includes('kapal')||m.includes('lalu lintas')) return 'TRANSPORT';
    return 'OTHER';
  };

  // Score how similar a candidate is to the target for a given field
  const scoreSimilarity = (candidate, target, field) => {
    const a = target[field], b = candidate[field];
    if (a === b) return -999;
    let s = 0;
    if (field === 'meaning') {
      if (getCategory(candidate) === getCategory(target)) s += 15;
      const wa = a.toLowerCase().split(/[\s,()]+/).filter(w => w.length > 2);
      const wb = b.toLowerCase().split(/[\s,()]+/).filter(w => w.length > 2);
      for (const w of wa) { if (wb.some(x => x.includes(w) || w.includes(x))) s += 6; }
      if (Math.abs(a.length - b.length) <= 5) s += 2;
    } else if (field === 'reading') {
      if (a.length === b.length) s += 3;
      else if (Math.abs(a.length - b.length) <= 2) s += 1;
      if (a[0] === b[0]) s += 3;
      if (a.endsWith('ます') && b.endsWith('ます')) s += 6;
      else if (a.endsWith('い') && b.endsWith('い')) s += 5;
      else if (a.slice(-2) === b.slice(-2)) s += 4;
    } else {
      if (a.length === b.length) s += 4;
      else if (Math.abs(a.length - b.length) <= 1) s += 2;
      for (const ch of new Set(a)) { if (b.includes(ch)) s += 2; }
      if (a.endsWith('ます') && b.endsWith('ます')) s += 5;
      if (a.endsWith('い') && b.endsWith('い')) s += 4;
    }
    s += Math.random() * 4;
    return s;
  };

  // --- Storage helpers ---
  const hasStorage = () => typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function';
  const safeStorageGet = async (key) => {
    if (!hasStorage()) return null;
    try {
      const t = new Promise((_, r) => setTimeout(() => r(), STORAGE_TIMEOUT_MS));
      const result = await Promise.race([window.storage.get(key), t]);
      return result || null;
    } catch { return null; }
  };
  const safeStorageSet = (key, value) => { if (!hasStorage()) return; try { Promise.resolve(window.storage.set(key, value)).catch(() => {}); } catch {} };
  const safeStorageDelete = (key) => { if (!hasStorage()) return; try { Promise.resolve(window.storage.delete(key)).catch(() => {}); } catch {} };

  // --- State ---
  const [questionsPerSession, setQuestionsPerSession] = useState(50);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const safety = setTimeout(() => { if (!cancelled) { generateQuiz([]); setLoading(false); } }, STORAGE_TIMEOUT_MS + 200);
    const init = async () => {
      const result = await safeStorageGet(STORAGE_KEY);
      if (cancelled) return;
      let prev = [];
      if (result?.value) { try { const p = JSON.parse(result.value); if (Array.isArray(p)) prev = p; } catch {} }
      clearTimeout(safety);
      generateQuiz(prev);
      setLoading(false);
    };
    init();
    return () => { cancelled = true; clearTimeout(safety); };
  }, []);

  const pickRandom = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

  const generateQuiz = (previouslyUsedIds) => {
    const count = questionsPerSession;
    const available = allKanji.filter(k => !previouslyUsedIds.includes(k.id));
    const pool = available.length >= count ? available : allKanji;
    const selected = pickRandom(pool, count);

    const newQuestions = selected.map((entry) => {
      const questionField = FIELDS[Math.floor(Math.random() * 3)];
      const remaining = FIELDS.filter(f => f !== questionField);
      const answerField = remaining[Math.floor(Math.random() * 2)];
      const correctAnswer = entry[answerField];

      // Smart distractors: score & pick top 3 most similar
      const candidates = allKanji
        .filter(k => k.id !== entry.id && k[answerField] !== correctAnswer)
        .map(k => ({ val: k[answerField], score: scoreSimilarity(k, entry, answerField) }))
        .sort((a, b) => b.score - a.score);

      // Deduplicate values
      const seen = new Set([correctAnswer]);
      const wrongs = [];
      for (const c of candidates) {
        if (wrongs.length >= 3) break;
        if (!seen.has(c.val)) { wrongs.push(c.val); seen.add(c.val); }
      }

      const options = pickRandom([correctAnswer, ...wrongs], 4);

      return {
        id: entry.id, questionField, answerField,
        questionValue: entry[questionField], correctAnswer, options,
        entryKanji: entry.kanji, entryReading: entry.reading, entryMeaning: entry.meaning,
      };
    });

    setQuestions(newQuestions);
    const reset = available.length < count;
    const newUsedIds = reset ? selected.map(k => k.id) : [...previouslyUsedIds, ...selected.map(k => k.id)];
    safeStorageSet(STORAGE_KEY, JSON.stringify(newUsedIds));
  };

  const startQuiz = () => { setQuizStarted(true); setQuizEnded(false); setCurrentQuestion(0); setScore(0); setSelectedAnswer(null); setAnswered(false); };
  const handleAnswer = (answer) => { if (answered) return; setSelectedAnswer(answer); setAnswered(true); if (answer === questions[currentQuestion].correctAnswer) setScore(score + 1); };
  const nextQuestion = () => { if (currentQuestion + 1 < questions.length) { setCurrentQuestion(currentQuestion + 1); setSelectedAnswer(null); setAnswered(false); } else { setQuizEnded(true); } };

  const resetQuiz = async () => {
    setQuizStarted(false); setQuizEnded(false); setCurrentQuestion(0); setScore(0); setSelectedAnswer(null); setAnswered(false);
    const result = await safeStorageGet(STORAGE_KEY);
    let prev = [];
    if (result?.value) { try { const p = JSON.parse(result.value); if (Array.isArray(p)) prev = p; } catch {} }
    generateQuiz(prev);
  };

  const wipeProgress = () => { safeStorageDelete(STORAGE_KEY); generateQuiz([]); };

  const adjustCount = (delta) => {
    setQuestionsPerSession(prev => Math.min(allKanji.length, Math.max(5, prev + delta)));
  };
  const handleCountInput = (e) => {
    const v = parseInt(e.target.value);
    if (!isNaN(v)) setQuestionsPerSession(Math.min(allKanji.length, Math.max(5, v)));
    else if (e.target.value === '') setQuestionsPerSession(5);
  };

  // --- RENDER ---
  if (loading) return (<div style={s.container}><div style={s.loadingWrap}><p style={s.loadingText}>読み込み中…</p></div></div>);

  if (!quizStarted) {
    return (
      <div style={s.container}>
        <div style={s.startWrap}>
          <div style={s.brandStack}>
            <div style={s.brandKanji}>漢字</div>
            <div style={s.brandDivider} />
            <div style={s.brandLatin}>Kanji Quiz</div>
            <div style={s.brandSub}>JLPT N4 · {allKanji.length} Kosakata</div>
          </div>

          <div style={s.stepperWrap}>
            <div style={s.stepperLabel}>Jumlah Soal</div>
            <div style={s.stepperRow}>
              <button onClick={() => adjustCount(-5)} style={s.stepperBtn}>−</button>
              <input
                type="text"
                inputMode="numeric"
                value={questionsPerSession}
                onChange={handleCountInput}
                style={s.stepperInput}
              />
              <button onClick={() => adjustCount(5)} style={s.stepperBtn}>+</button>
            </div>
          </div>

          <div style={s.matrixBox}>
            <div style={s.matrixTitle}>Pola Pertanyaan</div>
            <div style={s.matrixRow}><span style={s.matrixQ}>漢字</span><span style={s.matrixArrow}>→</span><span style={s.matrixA}>Hiragana / Arti</span></div>
            <div style={s.matrixRow}><span style={s.matrixQ}>Hiragana</span><span style={s.matrixArrow}>→</span><span style={s.matrixA}>漢字 / Arti</span></div>
            <div style={s.matrixRow}><span style={s.matrixQ}>Arti</span><span style={s.matrixArrow}>→</span><span style={s.matrixA}>漢字 / Hiragana</span></div>
          </div>

          <button onClick={startQuiz} style={s.startButton}>始める · Mulai Quiz</button>
          <button onClick={wipeProgress} style={s.linkButton}>Reset progress kanji</button>
        </div>
      </div>
    );
  }

  if (quizEnded) {
    const percentage = Math.round((score / questions.length) * 100);
    let feedback = '', feedbackColor = '';
    if (percentage >= 90) { feedback = '素晴らしい · Excellent'; feedbackColor = '#a3d977'; }
    else if (percentage >= 75) { feedback = 'いい · Very Good'; feedbackColor = '#a3d977'; }
    else if (percentage >= 60) { feedback = 'まあまあ · Keep practicing'; feedbackColor = '#e8b86c'; }
    else { feedback = '頑張って · More practice needed'; feedbackColor = '#d97a6c'; }

    return (
      <div style={s.container}>
        <div style={s.resultWrap}>
          <div style={s.resultLabel}>結果 · Results</div>
          <div style={s.scoreRow}>
            <div style={s.scoreBig}>{score}</div>
            <div style={s.scoreSlash}>/</div>
            <div style={s.scoreTotal}>{questions.length}</div>
          </div>
          <div style={s.percentageBar}><div style={{ ...s.percentageFill, width: `${percentage}%`, background: feedbackColor }} /></div>
          <div style={s.percentage}>{percentage}%</div>
          <div style={{ ...s.feedback, color: feedbackColor }}>{feedback}</div>
          <button onClick={resetQuiz} style={s.startButton}>もう一度 · Quiz Baru</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return <div style={s.container}><p style={s.loadingText}>Loading...</p></div>;

  const q = questions[currentQuestion];
  const isCorrect = answered && selectedAnswer === q.correctAnswer;
  const qLabel = FIELD_LABELS[q.questionField];
  const aLabel = FIELD_LABELS[q.answerField];
  const isKanjiQ = q.questionField === 'kanji';
  const isReadingQ = q.questionField === 'reading';

  return (
    <div style={s.container}>
      <div style={s.topBar}>
        <div style={s.progressTrack}><div style={{ ...s.progressFillBar, width: `${((currentQuestion + 1) / questions.length) * 100}%` }} /></div>
        <div style={s.topMeta}>
          <span>Q{currentQuestion + 1} / {questions.length}</span>
          <span>Score: {score}</span>
        </div>
      </div>

      <div style={s.questionCard}>
        <div style={s.questionTypeRow}>
          <span style={s.typeBadge}>{qLabel.ja} <span style={s.typeBadgeLat}>{qLabel.id}</span></span>
          <span style={s.arrowSmall}>→</span>
          <span style={{ ...s.typeBadge, ...s.typeBadgeAnswer }}>{aLabel.ja} <span style={s.typeBadgeLat}>{aLabel.id}</span></span>
        </div>

        <div style={{
          ...s.questionDisplay,
          fontSize: isKanjiQ ? (q.questionValue.length > 4 ? '3em' : '5em') : (isReadingQ ? '2.6em' : '2.2em'),
          fontFamily: q.questionField === 'meaning' ? "'Cormorant Garamond', Georgia, serif" : "'Noto Serif JP', serif",
          fontStyle: q.questionField === 'meaning' ? 'italic' : 'normal',
          fontWeight: isKanjiQ ? 300 : 400,
        }}>
          {q.questionValue}
        </div>

        <div style={s.optionsContainer}>
          {q.options.map((option, idx) => {
            const isThis = selectedAnswer === option;
            const isRight = option === q.correctAnswer;
            let style = { ...s.optionButton };
            if (answered) {
              if (isRight) style = { ...style, ...s.optionCorrect };
              else if (isThis) style = { ...style, ...s.optionWrong };
              else style = { ...style, ...s.optionFaded };
            }
            return (
              <button key={idx} onClick={() => handleAnswer(option)} style={style} disabled={answered}>
                <span style={s.optionIndex}>{String.fromCharCode(65 + idx)}</span>
                <span style={{
                  ...s.optionText,
                  fontFamily: q.answerField === 'meaning' ? "'Cormorant Garamond', Georgia, serif" : "'Noto Serif JP', serif",
                  fontStyle: q.answerField === 'meaning' ? 'italic' : 'normal',
                  fontSize: q.answerField === 'kanji' ? '1.25em' : '1em',
                }}>{option}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div style={isCorrect ? s.feedbackCorrect : s.feedbackWrong}>
            <div style={s.feedbackTopLine}>
              {isCorrect ? '✓ 正解 · Benar' : '✗ 不正解 · Salah'}
            </div>
            <div style={s.feedbackDetail}>
              <div style={s.feedbackRow}><span style={s.feedbackKey}>漢字</span><span style={s.feedbackVal}>{q.entryKanji}</span></div>
              <div style={s.feedbackRow}><span style={s.feedbackKey}>読み方</span><span style={s.feedbackVal}>{q.entryReading}</span></div>
              <div style={s.feedbackRow}><span style={s.feedbackKey}>意味</span><span style={s.feedbackVal}>{q.entryMeaning}</span></div>
            </div>
          </div>
        )}

        {answered && (
          <button onClick={nextQuestion} style={s.nextButton}>
            {currentQuestion + 1 === questions.length ? '結果を見る · Lihat Hasil' : '次へ · Berikutnya'}
          </button>
        )}
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;500;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    </div>
  );
};

const s = {
  container: { minHeight: '100vh', background: 'radial-gradient(ellipse at top, #1a1410 0%, #0d0a08 60%, #060504 100%)', padding: '24px 16px', fontFamily: "'Noto Serif JP', 'Cormorant Garamond', Georgia, serif", color: '#e8e0d4', boxSizing: 'border-box', overflowX: 'hidden', maxWidth: '100vw' },
  loadingWrap: { display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#8a7d6a', fontSize: '1.1em', letterSpacing: '0.1em' },
  startWrap: { maxWidth: '520px', margin: '32px auto', textAlign: 'center' },
  brandStack: { marginBottom: '36px' },
  brandKanji: { fontSize: '4em', fontWeight: 300, color: '#e8d9b8', letterSpacing: '0.15em', fontFamily: "'Noto Serif JP', serif", lineHeight: 1 },
  brandDivider: { width: '40px', height: '1px', background: '#8a7d6a', margin: '16px auto' },
  brandLatin: { fontSize: '0.85em', letterSpacing: '0.4em', color: '#c4b69a', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" },
  brandSub: { fontSize: '0.75em', color: '#8a7d6a', letterSpacing: '0.2em', marginTop: '8px', fontFamily: "'JetBrains Mono', monospace" },

  // Stepper
  stepperWrap: { marginBottom: '28px', padding: '20px', background: 'rgba(232, 217, 184, 0.04)', border: '1px solid rgba(232, 217, 184, 0.1)', borderRadius: '2px' },
  stepperLabel: { fontSize: '0.7em', color: '#8a7d6a', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: "'JetBrains Mono', monospace" },
  stepperRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0' },
  stepperBtn: { width: '48px', height: '48px', background: 'rgba(232, 217, 184, 0.08)', border: '1px solid rgba(232, 217, 184, 0.2)', color: '#e8d9b8', fontSize: '1.4em', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' },
  stepperInput: { width: '80px', height: '48px', background: 'rgba(232, 217, 184, 0.03)', border: '1px solid rgba(232, 217, 184, 0.2)', borderLeft: 'none', borderRight: 'none', color: '#e8d9b8', fontSize: '1.4em', textAlign: 'center', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, outline: 'none' },

  matrixBox: { padding: '20px', background: 'rgba(232, 217, 184, 0.03)', border: '1px solid rgba(232, 217, 184, 0.08)', borderRadius: '2px', textAlign: 'left', marginBottom: '28px' },
  matrixTitle: { fontSize: '0.7em', color: '#8a7d6a', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: "'JetBrains Mono', monospace" },
  matrixRow: { display: 'grid', gridTemplateColumns: '80px 24px 1fr', alignItems: 'center', padding: '6px 0', fontSize: '0.9em', color: '#c4b69a' },
  matrixQ: { color: '#e8d9b8', fontWeight: 500 },
  matrixArrow: { color: '#6b5d48', textAlign: 'center' },
  matrixA: { color: '#a89c84' },
  startButton: { width: '100%', padding: '16px 24px', fontSize: '1em', fontWeight: 500, color: '#1a1410', background: 'linear-gradient(180deg, #e8d9b8 0%, #c4b69a 100%)', border: 'none', borderRadius: '2px', cursor: 'pointer', letterSpacing: '0.15em', fontFamily: "'Noto Serif JP', serif", boxShadow: '0 4px 24px rgba(232, 217, 184, 0.15)' },
  linkButton: { marginTop: '16px', background: 'transparent', border: 'none', color: '#6b5d48', fontSize: '0.75em', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", padding: '8px' },

  topBar: { maxWidth: '560px', margin: '0 auto 24px auto' },
  progressTrack: { width: '100%', height: '2px', background: 'rgba(232, 217, 184, 0.08)', overflow: 'hidden' },
  progressFillBar: { height: '100%', background: 'linear-gradient(90deg, #c4b69a 0%, #e8d9b8 100%)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' },
  topMeta: { display: 'flex', justifyContent: 'space-between', fontSize: '0.7em', color: '#8a7d6a', letterSpacing: '0.2em', marginTop: '10px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" },

  questionCard: { maxWidth: '560px', margin: '0 auto', padding: '28px 20px', background: 'rgba(232, 217, 184, 0.03)', border: '1px solid rgba(232, 217, 184, 0.1)', borderRadius: '2px', boxSizing: 'border-box' },
  questionTypeRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' },
  typeBadge: { padding: '5px 12px', border: '1px solid rgba(232, 217, 184, 0.2)', fontSize: '0.8em', color: '#c4b69a', letterSpacing: '0.1em', fontFamily: "'Noto Serif JP', serif", borderRadius: '2px' },
  typeBadgeAnswer: { background: 'rgba(232, 217, 184, 0.06)', color: '#e8d9b8' },
  typeBadgeLat: { fontSize: '0.75em', color: '#8a7d6a', marginLeft: '4px', fontFamily: "'JetBrains Mono', monospace" },
  arrowSmall: { color: '#6b5d48', fontSize: '0.9em' },
  questionDisplay: { textAlign: 'center', color: '#f4ead6', margin: '16px 0 32px 0', lineHeight: 1.2, minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', wordBreak: 'break-word', overflowWrap: 'break-word' },

  optionsContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' },
  optionButton: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 12px', background: 'rgba(232, 217, 184, 0.03)', border: '1px solid rgba(232, 217, 184, 0.15)', color: '#e8e0d4', borderRadius: '2px', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left', fontFamily: "'Noto Serif JP', serif", minHeight: '52px' },
  optionIndex: { fontSize: '0.65em', color: '#8a7d6a', fontFamily: "'JetBrains Mono', monospace", minWidth: '12px', flexShrink: 0 },
  optionText: { flex: 1, color: '#e8e0d4', fontSize: '0.95em' },
  optionCorrect: { borderColor: '#a3d977', background: 'rgba(163, 217, 119, 0.08)', color: '#c5e89e' },
  optionWrong: { borderColor: '#d97a6c', background: 'rgba(217, 122, 108, 0.08)', color: '#e8a89e' },
  optionFaded: { opacity: 0.35 },

  feedbackCorrect: { padding: '14px 16px', background: 'rgba(163, 217, 119, 0.06)', border: '1px solid rgba(163, 217, 119, 0.25)', color: '#a3d977', textAlign: 'center', fontSize: '0.9em', letterSpacing: '0.05em', marginBottom: '14px', borderRadius: '2px' },
  feedbackWrong: { padding: '14px 16px', background: 'rgba(217, 122, 108, 0.06)', border: '1px solid rgba(217, 122, 108, 0.25)', color: '#d97a6c', textAlign: 'center', fontSize: '0.9em', letterSpacing: '0.05em', marginBottom: '14px', borderRadius: '2px' },
  feedbackTopLine: { fontWeight: 500, marginBottom: '10px' },
  feedbackDetail: { display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', padding: '8px 12px', background: 'rgba(232, 217, 184, 0.04)', borderRadius: '2px' },
  feedbackRow: { display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '0.9em' },
  feedbackKey: { color: '#8a7d6a', fontSize: '0.8em', minWidth: '48px', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 },
  feedbackVal: { color: '#e8d9b8', fontWeight: 500 },

  nextButton: { width: '100%', padding: '14px', fontSize: '0.9em', fontWeight: 500, color: '#1a1410', background: 'linear-gradient(180deg, #e8d9b8 0%, #c4b69a 100%)', border: 'none', borderRadius: '2px', cursor: 'pointer', letterSpacing: '0.15em', fontFamily: "'Noto Serif JP', serif" },

  resultWrap: { maxWidth: '480px', margin: '48px auto', padding: '40px 24px', background: 'rgba(232, 217, 184, 0.03)', border: '1px solid rgba(232, 217, 184, 0.1)', textAlign: 'center', borderRadius: '2px' },
  resultLabel: { fontSize: '0.75em', color: '#8a7d6a', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '28px', fontFamily: "'JetBrains Mono', monospace" },
  scoreRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '12px', marginBottom: '24px', fontFamily: "'Cormorant Garamond', serif" },
  scoreBig: { fontSize: '4.5em', fontWeight: 300, color: '#e8d9b8', lineHeight: 1 },
  scoreSlash: { fontSize: '2.2em', color: '#6b5d48', fontWeight: 300 },
  scoreTotal: { fontSize: '1.8em', color: '#8a7d6a', fontWeight: 300 },
  percentageBar: { width: '100%', height: '3px', background: 'rgba(232, 217, 184, 0.08)', overflow: 'hidden', marginBottom: '12px' },
  percentageFill: { height: '100%', transition: 'width 0.6s ease' },
  percentage: { fontSize: '1.3em', color: '#c4b69a', fontWeight: 400, fontFamily: "'Cormorant Garamond', serif", margin: '8px 0 12px 0' },
  feedback: { fontSize: '1em', letterSpacing: '0.15em', marginBottom: '32px', fontFamily: "'Noto Serif JP', serif" },
};

export default KanjiQuiz;
