# 01. Teknoloji Yığını ve 0$ Bütçe Mimarisi (Tech Stack & Cost)

Bu doküman, **PitWall: Formula Manager** projesinin geliştirilmesinden yayına alınmasına, binlerce oyuncu tarafından oynanmasından veri depolanmasına kadar **tamamen 0$ (sıfır maliyet)** ile nasıl hayata geçirileceğinin teknik mimarisini açıklar.

---

## 1. Temel Soru: Bu Oyun Gerçekten Tamamen Ücretsiz Yapılabilir mi?

**KESİNLİKLE EVET.**  
Oyunun yapısı (3D modelleme yerine minimalist 2D vektörel çizimler, telemetri arayüzü ve akıllı veri yönetimi) web dünyasının en güçlü ücretsiz altyapılarına kusursuz uyum sağlamaktadır.

### Maliyet Kalemleri ve 0$ Çözümleri:

| Alan | Geleneksel Maliyet | PitWall 0$ Stratejisi | Sağlayıcı / Araç |
| :--- | :--- | :--- | :--- |
| **Barındırma & CDN** | $20 - $100 / ay | $0 (Aylık 100GB bant genişliği, limitsiz CDN) | **Netlify Free Tier** |
| **Derleme & CI/CD** | $15 / ay | $0 (Aylık 300 dakika otomatik derleme) | **Netlify + GitHub Actions** |
| **Geliştirme Motoru** | Unity / Unreal Lisansı | $0 (Açık kaynak web standartları) | **Vite + React + TypeScript** |
| **Grafik & Görselleştirme** | 3D Assetler ($1000+) | $0 (Vektörel Spline + Geometrik Parçacıklar) | **HTML5 Canvas / PixiJS (WebGL)** |
| **Ses Tasarımı** | Stüdyo & Telifli Sesler | $0 (Prosedürel ses sentezleme + CC0) | **Web Audio API + Freesound** |
| **Veri Depolama & Kayıt**| Sunucu & Cloud DB ($25/ay)| $0 (Kullanıcı cihazında sınırsız depolama) | **IndexedDB (Dexie.js) + LocalStorage** |
| **Alan Adı (Domain)** | $10 - $20 / yıl | $0 (Netlify ücretsiz `*.netlify.app` alt alanı) | Opsiyonel: İleride istenirse özel domain |

---

## 2. Barındırma Altyapısı: Netlify

Kullanıcının tercihi olan **Netlify**, modern tek sayfa web uygulamaları (SPA) için endüstri standardı bir barındırma platformudur.

### Netlify Avantajları:
1. **GitHub Otomatik Dağıtımı (Continuous Deployment):**
   - GitHub deposuna (`semih-aydin/PitWall-Formula-Manager`) yapılan her `git push` sonrası Netlify projeyi saniyeler içinde derler ve dünya genelindeki CDN sunucularına dağıtır.
2. **Ücretsiz SSL & Güvenlik:**
   - Let's Encrypt SSL sertifikası tamamen otomatik ve ücretsizdir.
3. **Önizleme Dağıtımları (Deploy Previews):**
   - Açılan her Pull Request için ayrı bir canlı test bağlantısı oluşturulur.
4. **Sunucusuz Fonksiyon Desteği (Netlify Functions):**
   - İlerleyen aşamalarda "Günün Mücadelesi" (Daily Race Challenge) için hafif bir skor tablosu (Leaderboard) backend'i gerekirse, Netlify Functions (aylık 125.000 ücretsiz çağrı) ile tek kuruş ödemeden çalıştırılabilir.

---

## 3. Ön Yüz ve Render Mimarisi (Frontend & Rendering)

### A. Çekirdek Kütüphaneler:
- **Vite:** Süper hızlı derleme ve yerel geliştirme ortamı.
- **React 19 & TypeScript:** Katı tip güvenliği ile yarış matematiği, pilot durumları ve telemetri verilerinin hatasız yönetimi.
- **Tailwind CSS v4:** NASA telemetri odası hissi veren neon, koyu mod (dark mode) ve monospaced veri ızgaraları.
- **Lucide Icons:** Lastik hamurları, hava durumu simgeleri ve telemetri sembolleri için minimalist ikon seti.

### B. 2D Pist Motoru (Pist Radarı):
- 3D modeller (FBX, OBJ) ve ağır dokular yerine **HTML5 2D Canvas** veya **PixiJS (WebGL 2D)** kullanılacaktır.
- **Neden?**
  - Monaco veya Spa gibi ikonik pistler, SVG / Spline eğrileri olarak matematiksel vektör formatında saklanır (dosya boyutu sadece 5-10 KB!).
  - 22 araç, bu eğri üzerinde koordinat bazında (örneğin pistin %42.6'sında) hareket eden ışıldayan neon kapsüller olarak çizilir.
  - 60 FPS akıcılıkta çalışır ve pil tasarrufu sağlar; mobil cihazlarda dahi aşırı ısınma yapmaz.

---

## 4. Web Workers Mimarisi (Simülasyon Performansı)

Yarış oyunlarında 1x hızdan 16x veya 32x hıza çıkıldığında en büyük tehlike, ana arayüzün (UI thread) donması ve kare atlamasıdır.

### Çözüm: Headless Simulation in a Web Worker
```
[ Browser UI Thread (60 FPS) ]
       │  ▲
       │  │ (Anlık Araç Pozisyonları, Telemetri Durumu)
       ▼  │
[ Web Worker (Fizik & Simülasyon Çekirdeği) ]
   ├── 22 Aracın Tur Süresi & Mesafe Matematiği
   ├── Lastik Isısı, Aşınması ve "Cliff" Hesaplamaları
   ├── Batarya Şarj Seviyesi (SoC) & Manual Override Kontrolü
   └── AI Karar Motoru (Undercut, Pit zamanlaması)
```
- Arayüz tamamen serbest kalır; 16x hızda dahi butonlara basıldığında anında tepki verir, animasyonlar yağ gibi akar.

---

## 5. Prosedürel Ses Tasarımı (Web Audio API)

Strateji oyunlarında atmosferin %50'si sestir: Telsiz hışırtısı, bip sesleri ve motor uğultusu. Ağır ses dosyaları indirmek yerine tarayıcının yerleşik **Web Audio API** özelliği kullanılacaktır:

1. **Telsiz Cızırtısı & Hışırtı (Radio Static):**
   - Prosedürel beyaz gürültü (White Noise) üretilip `BiquadFilterNode` (Bandpass filtre) ile daraltılarak gerçek bir telsiz frekansı sesi oluşturulur.
2. **Pilot / Mühendis Bip Tonları (Radio Chimes):**
   - `OscillatorNode` kullanılarak Formula telsizlerinin başlangıç ve bitişindeki ikonik frekans tonları (800Hz / 1200Hz) sentetik olarak sıfır dosya boyutuyla çalınır.
3. **Telsiz Anonsları (Web Speech API):**
   - Tarayıcının yerel metin okuma motoru telsiz filtresinden geçirilerek anlık dinamik cümleler söyletilebilir (*"Lewis, box this lap, box confirm"*).

---

## 6. Veri Saklama ve Kayıt Sistemi

- **IndexedDB (Dexie.js sarmalayıcısı ile):**
  - Kullanıcının sezonluk kariyer ilerlemesi, takım geliştirmeleri, fabrika AR-GE seviyeleri ve pilot sözleşmeleri oyuncunun tarayıcısında depolanır.
  - Sınırsız depolama alanı, sıfır sunucu faturası.
- **Topluluk Roster Import/Export (JSON):**
  - Kullanıcılar kendi yarattıkları veya topluluktan indirdikleri kadro dosyalarını tek tıkla yükleyip indirebilir.

---

## Özet
PitWall, modern web teknolojilerinin sunduğu en verimli araçları kullanarak **1 kuruş bile harcamadan**, yüksek performanslı, binlerce oyuncuya hizmet verebilecek ölçekte kurulacaktır.
