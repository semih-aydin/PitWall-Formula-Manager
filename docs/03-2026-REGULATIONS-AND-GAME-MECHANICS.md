# 03. 2026 Regülasyonları ve Oyun Mekanikleri (2026 Regulations & Game Mechanics)

Bu doküman, 2026 FIA regülasyonlarının getirdiği devrimsel kuralları (Aktif Aero ve Manual Override) ve **PitWall: Formula Manager** oyununun tüm taktiksel sistemlerini detaylandırır.

> **Tasarım Prensibi:** Amacımız binlerce satır formülle oyuncuyu boğmak değil; **gerçek bir F1 baş stratejistinin önündeki telemetri masasında yaşadığı o yüksek adrenalin ve karar alma hissiyatını** tarayıcı üzerinde akıcı ve etkileyici şekilde yaşatmaktır.

---

## 1. 2026 Regülasyonları: DRS Tarih Oldu, Sahne Aktif Aero ve MOM'da!

2026 araçlarında geleneksel arka kanat DRS (Drag Reduction System) mekanizması tamamen kaldırılmıştır. Yerine iki temel teknoloji gelmiştir:

### A. Aktif Aerodinamik (Active Aero: Z-Mode & X-Mode)

2026 araçlarında hem ön hem de arka kanatlar aktif olarak hareket edebilmektedir:

1. **Z-Mode (Cornering / Yüksek Yere Basma Modu):**
   - Virajlarda, frenleme bölgelerinde ve teknik sektörlerde varsayılan moddur.
   - Kanatlar maksimum yere basma gücü (downforce) üreterek yüksek viraj hızı ve stabilite sağlar.
2. **X-Mode (Straight-Line / Düşük Sürtünme Modu):**
   - Belirlenen düzlük sektörlerine girildiğinde araçların kanatları düzleşir; sürtünme (drag) minimuma iner ve son hız sıçrar.
   - **Eski DRS'ten Farkı:** X-Mode'u açmak için öndeki araca 1 saniye yakın olmak **gerekmez**. Düzlük bölgesinde pistteki tüm 22 araç X-Mode'a geçebilir.
3. **Oyundaki Hissiyatı:**
   - 2D pist haritasında düzlüğe çıkan aracın üzerinde küçük bir `[X-MODE]` neon göstergesi yanar, aracın rengi hafif parlar ve hız vektörü düzlük boyunca artar.

---

### B. 2026 Güç Ünitesi & Manual Override Mode (MOM / Overtake Modu)

2026 motorlarında güç üretimi devrim geçirmiştir: İçten Yanmalı Motor (ICE: ~400 kW) ile Elektrik Motoru (MGU-K: ~350 kW) neredeyse **%50 - %50 eşit güç** üretir. Bu durum batarya yönetimini yarışın 1 numaralı stratejik silahı haline getirmiştir.

#### Manual Override Mode (MOM) Nasıl Çalışır?
- Normalde düzlükte 290 km/h hıza ulaşıldığında öndeki lider aracın elektrik desteği kademeli olarak düşer (derating).
- Ancak arkadaki takip eden araç, viraj çıkışındaki tespit noktasında (detection point) öndeki araca **1.0 saniyenin altındaysa**, ona **Manual Override Mode (MOM)** hakkı tanınır.
- MOM aktif edildiğinde arkadaki araç 337 km/h hıza kadar 350 kW'lık tam elektrik gücünü boşaltmaya devam eder; bu da düzlük sonunda net bir geçiş avantajı (Overtake Delta) yaratır.

#### Stratejistin Ekranındaki MOM Hissiyatı:
- Ekranın altındaki pilot telemetrisinde **Batarya Şarj Barı (SoC: State of Charge: %0 - %100)** yer alır.
- Stratejist pilota 3 farklı ERS emri verebilir:
  1. ` Harvest / Charge` (Bataryayı doldur, atağa hazırlan).
  2. ` Balanced` (Standart tur tüketimi).
  3. ` Overtake / MOM Deploy` (Bataryayı düzlükte tamamen boşalt, geçişi tamamla veya arkadakini kopar!).
- Yanlış zamanda bataryayı bitirirsen (derate), düzlük sonunda rakibine kolay yem olursun!

---

## 2. The Tactical Cockpit (Ana Arayüz Tasarımı)

Ekran 3 ana taktiksel bölmeye ayrılmıştır:

```
┌─────────────────────────┬───────────────────────────────┬─────────────────────────┐
│ SOL: CANLI SIRALAMA     │ ORTA: 2D PİST RADARI          │ SAĞ: HAVA & TELEMETRİ   │
│ (Live Timing Tower)     │ (Circuit Vector & Rejoin)     │ (Doppler & Car Status)  │
│                         │                               │                         │
│ P1  [#1 VER]  Soft (3L) │          ╭──────────╮         │ ️ Yağmur: Turn 4 (4T) │
│     Gap: Leader         │         ╱            ╲        │ Track Wet: 12% (Kuru)   │
│ P2  [#16 LEC] Med (14L) │        │   2D PİST    │        │                         │
│     Gap: +1.4s Int:+1.4 │        │   RADARI     │        │  Lastik: FL FR RL RR  │
│ P3  [#4 NOR]  Hard (2L) │         ╲    REJOIN ╱       │     88% 84% 76% 72%     │
│     Gap: +3.2s Int:+1.8 │          ╰──────────╯         │                         │
│                         │                               │  Battery (SoC): 68%   │
│  S1: 28.1  S2: 32.4 │  Araçlar (Neon Kapsüller)   │ ️ Motor Isısı: 98°C    │
└─────────────────────────┴───────────────────────────────┴─────────────────────────┘
│ ALT PANEL: STRATEJİST EMİRLERİ (Pilot 1 & Pilot 2)                                │
│ [BOX THIS LAP]  [PUSH / CONSERVE]  [MOM OVERTAKE DEPLOY]  [TIRE PLAN: A -> B]     │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. "The Rejoin Ghost" (Hayalet Çıkış Göstergesi)

Stratejistin en kritik kararı şudur: *"Şu an pite girersem piste kimin arkasında dönerim? Trafiğe takılır mıyım?"*

### Mekanik:
- Sistem pistteki ortalama pit stop kaybını (Örn: Monaco'da 22.1 saniye, Monza'da 24.5 saniye) arka planda sürekli hesaplar.
- Pist haritasında kendi aracının mevcut konumundan 22 saniye gerideki noktaya **parlayan saydam bir "Hayalet Nokta" (Ghost Marker)** yerleştirilir.
- Stratejist tek bir bakışla:
  - *"Eğer şimdi pite girersem, tam Albon ile Tsunoda'nın arasındaki boşluğa, temiz havaya çıkıyorum!"* ya da
  - *"Sakın girme! Çıkışta 5 araçlık DRS/X-Mode treninin tam arkasına düşüyoruz!"* kararını 1 saniyede verir.

---

## 4. Lastik Fiziği ve "The Cliff" (Uçurum)

Lastik yönetimi oyunun taktik omurgasıdır:

1. **Lineer Aşınma Bölgesi (%100 -> %30):**
   - Tur başına aracın temposu yaklaşık `0.05s` ile `0.08s` arası yavaşlar. Pilot durumu telsizden idare edebilir.
2. **The Cliff (Uçurum Eşiği: <%20):**
   - Lastik sağlığı %20'nin altına indiğinde kauçuk tabakası biter.
   - **Sonuç:** Tur başına aniden **+2.5 saniye** kayıp başlar! Fren mesafesi uzar, kilitlenme (lock-up) dumanları yükselir ve virajda spin atma veya lastik patlama riski katlanır.
3. **Taktiksel Çatışma:**
   - **Undercut:** Rakibinden 1 tur önce pite gelip taze hamurla hızlı tur atarak rakip pite girdiğinde önüne fırlamak.
   - **Overcut:** Rakip pite erken girip pistteki trafiğe takıldığında, temiz havada eski lastikle zorlayıp farkı açmak.

---

## 5. Dinamik Hava Durumu ve Crossover Kumarı

- **Doppler Radarı:** Ekranda piste yaklaşan renkli bir bulut kütlesi hareket eder. *"Turn 4'e 3 tur sonra hafif yağmur ulaşıyor."*
- **Pist Islaklık Yüzdesi (%0 Kuru -> %100 Sel):**
  - **%0 - %20:** Slick (Yumuşak, Orta, Sert) lastikler en hızlı.
  - **%20 - %65 (Inter Crossover):** Geçiş lastiği (Intermediate - Yeşil) devreye girer. Kuru lastikte kalanlar buz üstünde gibi kayar (+8 saniye kayıp).
  - **>%65 (Wet Crossover):** Yoğun yağmur lastiği (Full Wet - Mavi).
- **Stratejistin Kumarı:** Yağmur 2 tur sonra duracak mı, yoksa sağanağa mı dönecek? 1 tur erken pite girmek sana yarışı kazandırabilir ya da kuru asfaltta Inter lastiği 2 turda parçalatabilir.

---

## 6. Dilemma Motoru (Kritik Karar Anları)

Yarışın belirli dönüm noktalarında ekran hafifçe kararır, kulaklıkta kalp atışı sesi yükselir ve stratejistin önüne **10 saniyelik geri sayımla** bir seçim penceresi açılır:

### Örnek Senaryolar:
1. **Safety Car & Double-Stack:**
   - *"34. turda kaza oldu, SC çıktı! İki pilotun da peş peşe pite geliyor. İkisini birden aynı tur içeri alacak mısın (arkadaki 3 saniye bekler), yoksa arkadakini pistte tutup liderliği ona mı teslim edeceksin?"*
2. **Multi-21 / Takım Emirleri:**
   - *"Genç yeteneğin arkadan taze lastiklerle roket gibi geliyor. Öndeki kıdemli yıldız pilotuna 'Çekil, arkadaşın geçsin' emri verecek misin? (Yıldızın morali -30 düşer, basın toplantısında olay çıkar)."*
3. **Mekanik Tehlike (Su Pompası / Sıcaklık Alarmı):**
   - *"Motor sıcaklığı 125°C'ye vurdu! Motoru kısarsan tur başına 1.5s kaybedersin. Kısmazsan %50 ihtimalle motor duman atıp patlar."*

---

## 7. 22 Araçlık Yaşayan AI Grid

Pistteki diğer 20 bot araç rastgele hareket etmez; 11 takımın kendi karakteristik strateji felsefeleri vardır:
- **Agresif AI (Örn: Bulls GP):** Arkada kaldığı an undercut dener, MOM bataryasını ilk fırsatta boşaltır.
- **Muhafazakar AI (Örn: Papaya GP):** Lastiği sonuna kadar saklar, tek pit-stop disiplinini korur.
- **Kaos AI (Arka Sıralar):** Yağmur çiselediğinde herkesten önce kumar oynar; SC çıktığında pistte kalarak arkasına tren takar.
