# 02. Yasal Koruma ve Fikri Mülkiyet (IP) Stratejisi

Bu doküman, **PitWall: Formula Manager** projesinin Formula One Licensing B.V. (FOM), FIA veya mevcut yarış takımlarıyla herhangi bir telif hakkı (copyright), ticari marka (trademark) veya haksız rekabet davasına maruz kalmaması için uygulayacağımız **hukuki zırh stratejisini** detaylandırır.

---

## 1. Risk Analizi: FOM ve FIA Neleri Korur?

Formula 1 yönetimi (Liberty Media / FOM) ve FIA, dünyadaki fikri mülkiyet haklarını en sert ve agresif koruyan kurumlardan biridir.

### ❌ Kesinlikle Yasak ve Tehlikeli Olanlar (Telifli Unsurlar):
1. **Marka İsimleri:**
   - `"Formula 1"`, `"Formula One"`, `"F1"` (Özellikle "F1 Manager" ifadesi Frontier Developments ve FOM adına tescillidir).
   - Resmi F1 logosu, FIA logosu.
2. **Takım İsimleri ve Logoları:**
   - *"Scuderia Ferrari", "Oracle Red Bull Racing", "Mercedes-AMG Petronas", "McLaren F1 Team"* vb.
   - Şahlanan at, gümüş ok, boğa gibi tescilli takım armaları ve logoları.
3. **Pilot İsimleri ve Kişisel Haklar:**
   - Gerçek pilotların isimleri (*"Max Verstappen", "Lewis Hamilton", "Charles Leclerc"*) ve fotoğrafları/yüz modellemeleri (kişilik hakları ve ticari imaj hakkı koruması altındadır).
4. **Resmi Yarış İsimleri:**
   - *"Formula 1 Grand Prix de Monaco"*, *"Rolex British Grand Prix"* gibi tescilli etkinlik adları.

---

## 2. Hukuki Güvenceler ve Çözüm Yolları

Motorsport Manager, Football Manager, Pro Evolution Soccer (PES) ve Basketball GM gibi dev projelerin yıllardır başarıyla kullandığı yasal koruma yöntemlerini projemize entegre ediyoruz.

### A. Proje İsmi Güvenliği
- **İsim:** `PitWall: Formula Manager`
- **Hukuki Durum:** **GÜVENLİ.**
  - "Pit Wall" (Pit Duvarı) jenerik bir motorsporları terimidir.
  - "Formula" kelimesi motorsporlarında genel bir kategori tanımıdır (Formula 2, Formula 3, Formula Ford, Formula Student, Formula E vb.). Tek başına "Formula" kelimesi üzerinde FOM tekel kuramaz.
  - **Kritik Kural:** Projenin hiçbir yerinde, URL'sinde veya logosunda `"F1"` kısaltması yer almayacaktır.

### B. Clean-Room (Kurgusal / Parodi) Grid Mimarisi
Oyun varsayılan olarak tescilli hiçbir ticari marka içermeyen, ancak motorsporları tutkunlarının kimin kim olduğunu hemen anlayacağı zekice kurgusal/parodi isimlerle gelecektir:

#### Örnek 2026 Grid Tablosu (Varsayılan Oyun İçi):

| Gerçek Karşılığı | Oyun İçi Kurgusal Takım | Renk Teması | Örnek Pilot 1 | Örnek Pilot 2 |
| :--- | :--- | :--- | :--- | :--- |
| **Ferrari** | *Scuderia Rossa* | Kırmızı / Beyaz | C. Leconte (#16) | L. Hampton (#44) |
| **Red Bull Ford** | *Viper Racing / Bulls GP*| Lacivert / Sarı | M. Van Der Berg (#1) | L. Lawson (#30) |
| **Mercedes** | *Silver Arrows / Stuttgart*| Gümüş / Turkuaz | G. Russell (#63) | K. Antonelli (#12) |
| **McLaren** | *Papaya GP* | Turuncu / Antrasit | L. Nova (#4) | O. Pastore (#81) |
| **Aston Martin** | *British Racing Green* | Yarış Yeşili / Lime | F. Alvarez (#14) | L. Stroll (#18) |
| **Audi (Sauber)** | *Ingolstadt Speedworks* | Gümüş / Neon Kırmızı | N. Hülkenberg (#27) | G. Bortoleto (#5) |
| **Williams** | *Grove Heritage* | Koyu Mavi | A. Albon (#23) | C. Sainz (#55) |
| **Cadillac / Andretti** | *Apex American Racing* | Beyaz / Mavi / Kırmızı | C. Herta (#26) | V. Bottas (#77) |
| **Alpine** | *Dieppe Blue / Tricolore* | Mavi / Pembe | P. Gasly (#10) | J. Doohan (#7) |
| **Haas** | *Kannapolis Dynamics* | Beyaz / Kırmızı / Siyah | E. Ocon (#31) | O. Bearman (#87) |
| **Racing Bulls** | *Faenza Veloce* | Beyaz / Mavi | Y. Tsunoda (#22) | I. Hadjar (#6) |

*Bu sayede telif hakkı ihlali sıfıra indirilirken mizahi ve keyifli bir motorsporları evreni yaratılır.*

---

## 3. Pistler ve Coğrafi Haklar

### Hukuki Kural:
Pistlerin asfalt çizgileri, viraj yarıçapları ve GPS koordinatları **fiziksel coğrafi gerçekliktir**; bir yolun krokisi telif hakkına tabi tutulamaz. Ancak pistin ticari ismi ve logosu korunur.

### Uygulama: Coğrafi ve İkonik İsimlendirme:
- **Monaco GP** ➡️ *Monte Carlo Bay Circuit*
- **Spa-Francorchamps** ➡️ *Ardennes Forest Circuit*
- **Monza** ➡️ *Royal Temple of Speed (Lombardia)*
- **Silverstone** ➡️ *Northamptonshire Airfield Circuit*
- **Suzuka** ➡️ *Mie Figure-8 Ring*
- **Interlagos** ➡️ *São Paulo Autodrome*
- **Austin (COTA)** ➡️ *Lone Star Circuit (Texas)*

---

## 4. "Altın Kalkan": Topluluk Roster (JSON Import/Export) Sistemi

Football Manager ve PES'in telif davalarından tamamen muaf olmasını sağlayan en büyük mekanizma budur:

```
[ PitWall Web Oyunu (Temiz & Kurgusal) ]
             ▲
             │  (Kullanıcı Kendi Cihazından Yükler)
             ▼
[ Kullanıcı Dosyası: "2026_Real_Grid.json" ]
```

### Nasıl Çalışır?
1. PitWall sunucusunda veya kaynak kodunda gerçek pilot ve takım adları **ASLA** bulunmaz.
2. Oyun içine tek tıkla çalışan bir **"Kadro İçe / Dışa Aktar" (Custom Roster)** düğmesi yerleştirilir.
3. Topluluk üyeleri veya oyuncunun kendisi bir `roster.json` dosyası hazırlayıp oyuna aktardığında veriler yalnızca kullanıcının kendi tarayıcısının `localStorage` alanına yazılır.
4. **Hukuki Sonuç:** Geliştirici hiçbir telifli materyal dağıtmadığı için FOM veya FIA geliştiriciye karşı herhangi bir yasal yaptırım uygulayamaz; sorumluluk tamamen yerel dosyayı yükleyen son kullanıcıya aittir.

---

## 5. Açık Kaynak Lisansı

Projenin GitHub'da yayınlanması için tavsiye edilen lisans:
- **MIT Lisansı:** Geliştiricilere tam özgürlük sunar, "olduğu gibi" (as-is) temin edildiği için herhangi bir ticari sorumluluk yüklemez ve projenin topluluk tarafından büyümesini sağlar.
