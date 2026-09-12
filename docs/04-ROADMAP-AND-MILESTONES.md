# 04. Gerçekçi Geliştirme Yol Haritası ve Etaplar (Roadmap & Milestones)

Bu doküman, kullanıcının *"daha sakin, daha yavaş gidelim, her şeyi anında yapmak yerine parçalara bölelim"* yaklaşımına tam uyumlu olarak hazırlanmış; her adımı test edilebilir, gerçekçi ve modüler geliştirme etaplarını (sprint/faz) tanımlar.

---

## 🧭 Temel Yaklaşım: "Önce Temel Çalışsın, Sonra Katman Ekleyelim"

Oyun geliştirmede en sık yapılan hata tüm arayüzü, 3D/2D grafikleri, veritabanını ve yapay zekayı aynı anda yazmaya çalışıp tıkanmaktır.  
**Bizim stratejimiz:** Önce matematik ve simülasyon kuralları tıkır tıkır çalışacak, ardından 2D pist ve arayüz giydirilecek, en son ses ve dilemma motoruyla heyecan cilası atılacaktır.

---

## 🏁 Faz 0: Altyapı, Git ve Netlify Kurulumu (Tamamlanma: Hemen)

**Hedef:** Projenin temiz bir GitHub reposuna bağlanması, Netlify CI/CD otomasyonu ve dokümanların yerleşmesi.

- [x] Detaylı araştırma ve mimari dokümantasyonun hazırlanması (`docs/` klasörü).
- [x] `.gitignore` ve Netlify SPA yönlendirme ayarlarının (`netlify.toml`) oluşturulması.
- [ ] Git reposunun başlatılması (`git init`) ve GitHub `semih-aydin/PitWall-Formula-Manager.git` reposuna bağlanması.
- [ ] İlk boş Vite + React + TypeScript iskeletinin ayağa kaldırılması ve Netlify'da ilk başarılı "Hello World" canlı derlemesinin alınması.

---

## 🏎️ Faz 1: Çekirdek Simülasyon Motoru (Headless Engine) (1-2 Hafta)

**Hedef:** Henüz hiçbir grafik arayüzü olmadan, arka planda (Web Worker veya saf TypeScript içinde) 22 aracın yarışabildiği saf matematik motorunun yazılması.

### Yapılacaklar:
1. **Veri Modelleri (TypeScript Tipleri):**
   - Araç (`Car`), Pilot (`Driver`), Takım (`Team`), Pist (`Track`), Lastik (`TireCompound`).
2. **Tur Zamanı Matematiği:**
   - Temel araç gücü + pilot yeteneği + lastik hamuru avantajı.
   - 2026 Aktif Aero (Düzlükte X-Mode hızı, virajda Z-Mode).
   - 2026 Batarya Yönetimi: Tur başına tüketim ve 1 saniye altındaki araç için Manual Override Mode (MOM) tetikleyicisi.
3. **Lastik Aşınması & Uçurum (The Cliff):**
   - Her tur %2 aşınma; %20 altına indiğinde tur süresine +2.5 saniye eklenmesi.
4. **Çıktı / Doğrulama:**
   - Konsolda (veya basit bir test sayfasında) 50 turluk simülasyon koşturulup sıralama tablosunun mantıklı sonuçlar ürettiğinin doğrulanması.

---

## 📊 Faz 2: Canlı Telemetri & 2D Pist Radarı (2 Hafta)

**Hedef:** Saf matematik motorunu şık, neon ve karanlık modda çalışan NASA telemetri masasıyla birleştirmek.

### Yapılacaklar:
1. **Canlı Sıralama Kulesi (Live Timing Tower):**
   - 22 pilotun anlık P1-P22 sıralaması.
   - Liderle fark (Gap: +2.4s) ve öndekiyle aralık (Interval: +0.6s).
   - Lastik hamur simgeleri (🔴 Soft, 🟡 Medium, ⚪ Hard) ve lastik turları.
2. **2D Vektör Pist Çizimi (HTML5 Canvas):**
   - Örnek 1 ikonik pist (Örn: *Monte Carlo Bay* veya *Royal Temple Monza*).
   - Vektör çizgi üzerinde koordinat bazında kayan 22 renkli araç noktası.
   - Düzlüğe çıkıldığında araç üzerinde yanan `[X-MODE]` simgesi.
3. **The Rejoin Ghost (Hayalet Çıkış Göstergesi Prototipleri):**
   - Pit süresi (22s) hesaplanarak, pite girildiğinde çıkılacak noktanın haritada saydam parlayan bir nokta olarak render edilmesi.
4. **Simülasyon Hız Kontrolü:**
   - `[ 1x ]`, `[ 3x ]`, `[ 5x ]`, `[ 16x ]` hız butonları.

---

## 📻 Faz 3: Stratejist Kontrolleri & Telsiz Hissiyatı (1-2 Hafta)

**Hedef:** Oyuncunun yarışın gidişatına müdahale edebilmesini sağlamak ve telsiz sesleriyle adrenalin pompalamak.

### Yapılacaklar:
1. **Alt Kontrol Paneli (Pit Wall Masası):**
   - `BOX THIS LAP` düğmesi (Lastik seçimi: Soft / Medium / Hard).
   - Sürüş Modu: `Conserve` (Lastiği koru) ↔ `Standard` ↔ `Push` (Agresif sürüş).
   - ERS / MOM Modu: `Charge` ↔ `Deploy Overtake` (Bataryayı düzlükte boşalt).
2. **Web Audio API Entegrasyonu:**
   - Telsiz tuşuna basıldığında gelen telsiz cızırtısı (Bandpass filtrelenmiş beyaz gürültü).
   - Çift frekanslı pit telsiz başlangıç/bitiş bip tonları.
3. **Pilot Moral & Telsiz Mesajları:**
   - Lastik aşındığında pilotun telaşlı bildirimleri (*"Tires are dead mate!"*).

---

## ⚡ Faz 4: Kaos, Yağmur Radarı ve Dilemma Motoru (2 Hafta)

**Hedef:** Yarışın tekdüze geçmesini engelleyen beklenmedik olayların eklenmesi.

### Yapılacaklar:
1. **Dinamik Hava & Doppler Radarı:**
   - Piste yaklaşan yağmur bulutu animasyonu.
   - Pist ıslaklık yüzdesi ve Slick ➡️ Inter ➡️ Wet crossover geçişleri.
2. **Kaos Olayları:**
   - Spin atma, fren kilitleme (lock-up) duman animasyonu.
   - Safety Car (SC) ve Virtual Safety Car (VSC) sarı bayrak rejimleri.
   - Pit stop hataları (sağ arka bijon sıkışması: 2.3s yerine 8.5s pit süresi).
3. **Dilemma Motoru (10 Saniyelik Karar Anları):**
   - Ekranın kararması, kalp atışı sesi ve geri sayımlı modal pencere.
   - Örn: SC anında *Double-Stack mi, Pistte Kalmak mı?* seçimi.

---

## 🏆 Faz 5: Sezon İlerlemesi, Topluluk Roster'ı ve Netlify Yayını (2 Hafta)

**Hedef:** Tekil yarıştan tam bir sezona geçiş ve oyunu tüm dünyaya açma.

### Yapılacaklar:
1. **Şampiyona Puan Durumu:**
   - Pilotlar ve Takımlar Klasmanı.
   - Sezon sonu hedefleri ve kazanılan bütçe.
2. **Fabrika & AR-GE Geliştirmeleri:**
   - Aero (Viraj hızı), Güç Ünitesi (Düzlük ve batarya verimi), Pit Ekibi eğitimi.
3. **Topluluk Roster (JSON Import/Export):**
   - Kullanıcıların kendi kadrolarını oluşturabileceği veya gerçek isimleri tek tıkla yükleyebileceği yasal koruma kalkanı.
4. **Netlify Canlı Dağıtımı & Mobil Testler:**
   - Masaüstü ve mobilde kusursuz ölçeklenme.
