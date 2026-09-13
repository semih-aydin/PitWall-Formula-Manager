# PitWall: Formula Manager

> **"Sen araba sürmüyorsun. Sen pit duvarında, önünde 15 ekran yanıp sönen, kulağında telsiz cızırtısı olan Baş Stratejistsin."**

**PitWall: Formula Manager**, oyuncuyu 3D grafik modelleme yükü altına sokmadan; **Motorsport Manager derinliği** ile canlı zamanlama (Live Timing) ekranının taktiksel heyecanını birleştiren modern bir web tabanlı yarış stratejisi simülasyonudur.

2026 regülasyonlarına sadık kalarak inşa edilen oyunda eski nesil DRS yerine **Aktif Aerodinamik (X-Mode & Z-Mode)** ve **Manual Override / Overtake Modu (MOM)** bulunmaktadır.

---

## Temel Felsefe ve Öne Çıkan Özellikler

1. **The Tactical Cockpit (Komuta Merkezi):**
   - **Sol Panel:** 22 araçlık Canlı Sıralama Kulesi (Live Timing), aralıklar (+Gap, +Interval), lastik türü, lastik yaşı ve sektör renkleri.
   - **Orta Panel:** 2D Vektör Pist Radarı, neon araç akışı ve devrimsel **"The Rejoin Ghost" (Hayalet Çıkış Göstergesi)**: Pite şu an girersen hangi aracın önünde/arkasında çıkacağını canlı hesaplar.
   - **Sağ Panel:** Anlık telemetri, lastik aşınması & sıcaklığı, batarya (SoC) durumu ve Undercut/Overcut taktik danışmanı.

2. **2026 Dinamikleri (Active Aero & Overtake Mode):**
   - **Z-Mode:** Virajlarda maksimum yere basma gücü.
   - **X-Mode:** Düzlüklerde düşük sürüklenme (tüm araçlar düzlükte açabilir).
   - **Manual Override Mode (MOM / Overtake):** 350kW elektrik gücü desteğiyle 1.0 saniye altındaki aracı avlamak için batarya püskürtme.

3. **Dilemma Motoru (Kritik Karar Anları):**
   - Safety Car double-stack ikilemi, yağmur başlangıcında "Crossover" kumarı, takım emirleri ve mekanik arıza uyarıları.

4. **Telsiz & Ses Motoru:**
   - Web Audio API ile tamamen prosedürel telsiz cızırtısı, F1 takım telsizi açılış/kapanış tonları ve tehlike sirenleri (harici dosya gerektirmez).

---

## Dokümantasyon Dizini

- [**01. Ücretsiz Teknoloji Yığını ve Netlify Mimarisi**](./docs/01-TECH-STACK-AND-COST.md)
  *Geliştirme, barındırma, Netlify CI/CD, Web Workers ve Web Audio mimarisiyle 0$ bütçe stratejisi.*

- [**02. Yasal Uyarı ve Fikri Mülkiyet Bildirimi**](./docs/02-LEGAL-DISCLAIMER.md)
  *Bağımsız kurgusal içerik bildirimi, marka feragatnamesi ve topluluk modlama altyapısı koşulları.*

- [**03. 2026 Regülasyonları ve Oyun Mekanikleri**](./docs/03-2026-REGULATIONS-AND-GAME-MECHANICS.md)
  *X-Mode / Z-Mode, Manual Override batarya simülasyonu, Lastik Uçurumu (The Cliff), Rejoin Ghost ve Dilemma motoru detayları.*

- [**04. Gerçekçi Geliştirme Yol Haritası ve Etaplar**](./docs/04-ROADMAP-AND-MILESTONES.md)
  *Acele etmeden, sakin ve modüler parçalara bölünmüş 5 aşamalı geliştirme takvimi.*

- [**05. Ekip İş Bölümü ve Sorumluluk Dağılımı: Semih & Efe**](./docs/05-TEAM-DIVISION-OF-LABOR.md)
  *Semih (Sistem & Motor Mimarisi) ve Efe (Taktik Arayüz & Görsel Deneyim) arasındaki modüler görev paylaşımı.*

---

## Hızlı Başlangıç (Geliştirici)

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Üretim derlemesi al (Netlify için)
npm run build
```

---

## Dağıtım (Deployment)

Proje [Netlify](https://www.netlify.com/) üzerinde barındırılmaktadır. `main` dalına (branch) yapılan her push işlemi Netlify tarafından otomatik olarak derlenip anında dünya çapındaki CDN noktalarına dağıtılır.

---

## Yasal Sorumluluk Reddi (Legal Disclaimer)

PitWall: Formula Manager is an independent, fictional motorsport simulation game created for entertainment and educational purposes. All team names, driver personas, sponsors, vehicle liveries, and graphical representations featured in the base software are entirely fictional.

"Formula 1", "F1", "FIA", "Grand Prix", and related marks and logos are registered trademarks of Formula One Licensing B.V., the Fédération Internationale de l'Automobile, or their respective copyright holders. This project is not affiliated with, endorsed by, sponsored by, or connected to Formula One Licensing B.V., the FIA, or any real-world racing team.
