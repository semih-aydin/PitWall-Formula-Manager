# 05. Ekip İş Bölümü ve Sorumluluk Dağılımı: Semih & Efe

Bu doküman, **PitWall: Formula Manager** projesini ortak geliştiren **Semih** ve **Efe** arasındaki teknik iş bölümünü, modül sahipliklerini, git iş akışını ve Faz 4 ile Faz 5 kapsamındaki görev dağılımını detaylandırır.

---

## 1. Temel Rol Dağılımı ve Uzmanlık Alanları

İki kişilik bağımsız oyun geliştirme sürecinde hız kazanmak ve kod çakışmalarını (merge conflict) sıfıra indirmek için görevler **Motor/Matematik (Engine & Core)** ve **Arayüz/Deneyim (UI/UX & Graphics)** ekseninde ikiye bölünmüştür:

```
+-------------------------------------------------------------------------+
|                       PITWALL: FORMULA MANAGER                          |
+-------------------------------------------------------------------------+
|                                                                         |
|   SEMİH (Lead Systems & Engine)          EFE (Lead UI/UX & Frontend)    |
|   ----------------------------           ---------------------------    |
|   * Simülasyon Motoru (Headless)         * Taktik Kokpit Bileşenleri    |
|   * Tur Zamanı & Lastik Fiziği           * 2D Pist Radarı & SVG Katmanı |
|   * 2026 MOM & Aero Matematiği           * Dilemma Karar Pencereleri    |
|   * Kaos & Hava Durumu Olasılıkları      * Pit Stop Refleks Minigame    |
|   * JSON Roster Import/Export            * Responsive & Mobil Uyum     |
|   * Web Audio API Ses Sentezi            * Olay Akışı Filtreleri        |
|   * Netlify CI/CD & Git Mimarisi         * Görsel Efektler & Temalar    |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## 2. Kişi Bazlı Detaylı Görev Dağılımı

### A. SEMİH — Sistem Mimarı & Simülasyon Motoru Geliştiricisi
**Ana Odak:** Simülasyonun matematiksel tutarlılığı, yarış mantığı, veri altyapısı ve dağıtım.

1. **Çekirdek Yarış Motoru (`src/engine/`):**
   - **Dinamik Hava Durumu Modeli:** Pist ıslaklık yüzdesi (%0 kuru asfalt -> %100 su birikintisi), yağmurun tur süresine etkisi ve hamur geçiş eşikleri (Slick -> Inter -> Wet crossover süreleri).
   - **Güvenlik Aracı ve VSC Mekaniği:** Kazalardan sonra yarış bayrağını sarıya çekme, araç hızlarını delta sınırına çekme ve pite giriş avantaj sürelerini hesaplama.
   - **Kaos ve Arıza Olasılık Motoru:** Fren kilitleme (lock-up), spin atma, motor aşırı ısınması ve pit bijon sıkışması (2.4s yerine 8.9s pit kaybı) olasılık algoritmaları.
   - **Gelişmiş Pil Dağıtım Stratejisi:** 2026 350kW MOM bataryasının viraj çıkışlarında pilot agresifliğine göre harcanması ve rejeneratif frenleme (MGU-K) şarj eğrisi.

2. **Veri Mimarisi ve Dışa/İçe Aktarım (`src/data/`):**
   - **Özel Kadro (Custom Roster) Sistemi:** Kullanıcıların kendi takımlarını ve pilotlarını yükleyebileceği `roster.json` şeması, doğrulama (validation) fonksiyonları ve `localStorage` kalıcı hafıza servisi.
   - **Yeni Pist Verileri:** Spa-Francorchamps, Suzuka ve Austin COTA pistlerinin sektör uzunlukları, taban tur süreleri ve 2026 düzlük aero bölgeleri.

3. **Prosedürel Ses Altyapısı (`src/audio/`):**
   - Telsiz parazit filtreleri, pit tabancası pnömatik tork sesleri ve motor devir yükselme osilatör sentezi.

4. **DevOps & Dağıtım:**
   - Netlify CI/CD yapılandırması, Git branch yönetimi ve sürüm etiketleme (Release tags).

---

### B. EFE — Taktik Arayüz & Görsel Deneyim Tasarımcısı
**Ana Odak:** Oyuncunun NASA telemetri masasında hissetmesi, görsel estetik, animasyonlar ve refleks anları.

1. **Taktik Kokpit ve Telemetri Bileşenleri (`src/components/`):**
   - **Gelişmiş Canlı Sıralama Kulesi (`LiveTimingTower.tsx`):**
     - Sektör 1, 2, 3 sürelerinin mor (en hızlı tur), yeşil (kişisel en iyi) ve sarı renklerle anlık yanıp sönmesi.
     - Pit stop planlanan araçların yanına animasyonlu `[BOX]` rozetleri.
   - **Gelişmiş Pilot Telemetri Kartı (`DriverTelemetryCard.tsx`):**
     - 4 lastiğin (Sol Ön, Sağ Ön, Sol Arka, Sağ Arka) bağımsız sıcaklık ve aşınma grafiği.
     - 2026 MOM aktifken parlayan mavi/cyan enerji patlama göstergesi.
   - **Telsiz & Olay Akışı Filtreleme (`EventFeed.tsx`):**
     - Telsiz kayıtları için "Yalnızca Bizim Takım", "Sarı Bayrak & Güvenlik Aracı", "Tüm Olaylar" filtre sekmeleri.

2. **2D Pist Radarı ve Harita Çizimleri (`src/components/CircuitRadar.tsx` & `src/data/circuitGeometry.ts`):**
   - Yeni eklenecek pistlerin (Spa, Suzuka, COTA) 2B SVG koordinatlarının vektörel çizimi.
   - Harita üzerinde araçların arkasında X-Mode düzlük modundayken parlayan neon rüzgar çizgileri (slipstream efektleri).
   - Yağmur başladığında pist yüzeyinin parlaması ve yağmur damlası dalgalanmaları (Doppler radar katmanı).

3. **Etkileşimli Karar ve Refleks Anları (Dilemma Modalları):**
   - **10 Saniyelik Karar Modalı (The Dilemma Screen):** Güvenlik aracı çıktığında ekranın kararıp 10 saniyelik kalp atışı sayacıyla strateji seçimi sunduğu modal pencere.
   - **Pit Stop Refleks Minigame'i:** Araç pite girdiğinde yeşil ışık yandığı anda tıklandığında -0.5s kazandıran, erken veya geç basıldığında bijon sıkışması cezası veren mini refleks arayüzü.

4. **Responsive & Mobil Ekran Uyumluluğu:**
   - iPad, tablet ve küçük dizüstü ekranlarında sütunların (Timing Tower ve Radar) daralıp genişleyebilmesini sağlayan Tailwind düzenlemeleri.

---

## 3. Faz 4 ve Faz 5 İçin Somut Eylem Planı (Sprint Takvimi)

### Faz 4: Kaos, Yağmur Radarı ve Dilemma Motoru (Sıradaki Adım)
| Görev | Sorumlu | Teslim Edilecek Dosyalar / Çıktı |
| :--- | :--- | :--- |
| Hava Durumu & Islaklık Matematiği | **Semih** | `src/engine/WeatherEngine.ts` |
| Güvenlik Aracı (SC & VSC) Mantığı | **Semih** | `src/engine/SafetyCarEngine.ts` |
| Radar Üzeri Yağmur Katmanı (Doppler) | **Efe** | `src/components/WeatherRadarOverlay.tsx` |
| 10sn Geri Sayımlı Dilemma Penceresi | **Efe** | `src/components/DilemmaModal.tsx` |
| Pit Stop Refleks Mini-Oyunu | **Efe** | `src/components/PitStopMinigame.tsx` |
| Mekanik Arıza ve Ceza Entegrasyonu | **Semih** | `src/engine/RaceSimulation.ts` güncellemesi |

### Faz 5: Sezon İlerlemesi, Topluluk Roster'ı ve Final Cilası
| Görev | Sorumlu | Teslim Edilecek Dosyalar / Çıktı |
| :--- | :--- | :--- |
| JSON Kadro Yükleyici & Doğrulayıcı | **Semih** | `src/utils/rosterValidator.ts` |
| Özel Kadro İçe/Dışa Aktarma Modalı | **Efe** | `src/components/RosterManagerModal.tsx` |
| Şampiyona Puan ve Sezon Tablosu | **Semih** | `src/engine/ChampionshipEngine.ts` |
| Sezon Sonu Podyum ve Kupa Ekranı | **Efe** | `src/components/SeasonPodium.tsx` |
| Netlify Production & Performans Testi | **Ortak** | Canlı URL doğrulaması ve 60 FPS garantisi |

---

## 4. Ortak Çalışma Kuralları (Git & Kod Standartları)

İki geliştiricinin birbiriyle çakışmadan çalışabilmesi için belirlenen bağlayıcı kurallar:

1. **Branch (Dal) Kuralı:**
   - `main` dalına doğrudan deneysel kod yazılmaz.
   - Her özellik için yeni dal açılır:
     - Semih'in dalları: `feat/weather-engine`, `feat/safety-car`, `feat/roster-json`
     - Efe'nin dalları: `feat/dilemma-modal`, `feat/circuit-spa`, `feat/pit-minigame`
   - Geliştirme bitince `npm run build` hatasız geçtikten sonra `main` ile birleştirilir (merge).

2. **Kesinlikle Sıfır Emoji Kuralı:**
   - Oyun arayüzünde, bileşenlerde, log kayıtlarında veya terminal çıktılarında hiçbir emoji kullanılmayacaktır.
   - Görsel simgeler için daima `lucide-react` vektör ikonları ve CSS renk rozetleri tercih edilecektir.

3. **Öğrenci İşi Türkçe Yorum Satırları:**
   - Yazılan her fonksiyonun ve hesaplama mantığının üzerine, takım arkadaşının kolayca anlayabileceği samimi, eğitici Türkçe yorum satırları bırakılacaktır.

4. **Tek Sorumluluk İlkesi (Modülerlik):**
   - Efe bir arayüz bileşeni yazarken motor matematiğini doğrudan bileşenin içine gömmemeli, Semih'in `src/engine/` altındaki fonksiyonlarını çağırmalıdır.
   - Semih bir motor fonksiyonu yazarken React state'lerine bağımlı olmamalı, saf TypeScript fonksiyonları (`pure functions`) üretmelidir.

---

## 5. İletişim ve Kontrol Rutini

- **Haftalık 15 Dakika Senkronizasyonu:** Her sprint başlangıcında hangi görevlerin o hafta `main` dalına gireceği kararlaştırılır.
- **Her Commit Öncesi Kontrol Listesi:**
  - [ ] `npm run build` komutu 0 hata veriyor mu?
  - [ ] Yeni kodda hiç emoji var mı? (Gerekirse regex taraması yapılır)
  - [ ] Türkçe açıklayıcı yorum satırları eklendi mi?
  - [ ] Netlify canlı önizlemesinde ekran kırılması var mı?
