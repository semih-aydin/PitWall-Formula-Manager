# PitWall: Formula Manager 🏎️⚡

> **"Sen araba sürmüyorsun. Sen pit duvarında, önünde 15 ekran yanıp sönen, kulağında telsiz cızırtısı olan Baş Stratejistsin."**

**PitWall: Formula Manager**, oyuncuyu 3D grafik modelleme yükü altına sokmadan; **Motorsport Manager derinliği** ile **F1 Canlı Zamanlama (Live Timing)** ekranının taktiksel heyecanını birleştiren modern bir web tabanlı yarış stratejisi simülasyonudur.

2026 regülasyonlarına sadık kalarak inşa edilen oyunda eski nesil DRS yerine **Aktif Aerodinamik (X-Mode & Z-Mode)** ve **Manual Override / Overtake Modu (MOM)** bulunmaktadır.

---

## 🎯 Temel Felsefe ve Öne Çıkan Özellikler

1. **The Tactical Cockpit (Komuta Merkezi):**
   - **Sol Panel:** 22 araçlık Canlı Sıralama Kulesi (Live Timing), aralıklar (+Gap, +Interval), lastik türü, lastik yaşı ve sektör renkleri (Mor, Yeşil, Sarı).
   - **Orta Panel:** 2D Vektör Pist Radarı, neon araç akışı ve devrimsel **"The Rejoin Ghost" (Hayalet Çıkış Göstergesi)**: Pite şu an girersen hangi aracın önünde/arkasında çıkacağını canlı hesaplar.
   - **Sağ Panel:** Doppler Yağmur Radarı, 4 lastiğin anlık sıcaklık ve aşınması, batarya (SoC) durumu.

2. **2026 Dinamikleri (Active Aero & Overtake Mode):**
   - **Z-Mode:** Virajlarda maksimum yere basma gücü.
   - **X-Mode:** Düzlüklerde düşük sürüklenme (tüm araçlar düzlükte açabilir).
   - **Manual Override Mode (MOM / Overtake):** %50 elektrik gücü desteğiyle 1.0 saniye altındaki aracı avlamak için batarya püskürtme.

3. **Dilemma Motoru (Kritik Karar Anları):**
   - Safety Car double-stack ikilemi, yağmur başlangıcında "Crossover" kumarı, takım emirleri (Multi-21 gerilimi) ve mekanik arıza uyarıları. 10 saniyelik kalp atışı sayacıyla anlık strateji seçimi.

4. **Telsiz & Pilot Psikolojisi:**
   - Web Audio API ile prosedürel telsiz cızırtısı ve anonslar.
   - Aşınmış lastikle pistte tuttuğunda pilotun sana telsizden isyan etmesi, güven kaybı ve spin/lock-up riski.

---

## 📚 Kapsamlı Dokümantasyon Dizini

Kullanıcı araştırması ve mimari planlama doğrultusunda hazırlanan detaylı dokümanlar:

* 📄 [**01. Ücretsiz Teknoloji Yığını ve Netlify Mimarisi**](./docs/01-TECH-STACK-AND-COST.md)  
  *Geliştirme, barındırma, Netlify CI/CD, Web Workers ve Web Audio mimarisiyle 0$ bütçe stratejisi.*

* 📄 [**02. Yasal Koruma ve Marka (IP) Stratejisi**](./docs/02-LEGAL-AND-IP-STRATEGY.md)  
  *FOM ve FIA telif risklerinden korunma, parodi isimlendirme ve Topluluk Roster (JSON Import/Export) hukuki kalkanı.*

* 📄 [**03. 2026 Regülasyonları ve Oyun Mekanikleri**](./docs/03-2026-REGULATIONS-AND-GAME-MECHANICS.md)  
  *X-Mode / Z-Mode, Manual Override batarya simülasyonu, Lastik Uçurumu (The Cliff), Rejoin Ghost ve Dilemma motoru detayları.*

* 📄 [**04. Gerçekçi Geliştirme Yol Haritası ve Etaplar**](./docs/04-ROADMAP-AND-MILESTONES.md)  
  *Acele etmeden, sakin ve modüler parçalara bölünmüş 5 aşamalı geliştirme takvimi.*

---

## 🚀 Hızlı Başlangıç (Geliştirici)

```bash
# Bağımlılıkları yükle (proje kurulumu sonrası)
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Üretim derlemesi al (Netlify için)
npm run build
```

---

## 🌐 Dağıtım (Deployment)

Proje [Netlify](https://www.netlify.com/) üzerinde barındırılmaktadır. `main` dalına (branch) yapılan her push işlemi Netlify tarafından otomatik olarak derlenip anında dünya çapındaki CDN noktalarına dağıtılır.
