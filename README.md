# ➗ MatheMeister 5. Sınıf — Schriftliche Division (4 & 5 Haneli Sayıları 3 Haneliye Bölme)

Almanya **Gymnasium 5. Sınıf (5. Klasse)** matematik müfredatına birebir uygun, **Kareli Defter (*Kästchenheft*)** formatında hazırlanan interaktif bölme (*Schriftliche Division*) eğitim ve alıştırma uygulaması.

## 🌟 Özellikler

1. **🇩🇪 Almanya Gymnasium Notasyonu (*Kästchenheft*)**:
   - Türkiye'deki dikey bölme çizgisi yerine Almanya'daki okullarda zorunlu tutulan **`Dividend : Divisor = Quotient`** yan yana kareli defter düzenini kullanır.
   - Her rakam kendi karesine (*Kästchen*) basamak değeri (*Stellenwert*) korunarak yerleştirilir.
2. **🇹🇷 + 🇩🇪 Çift Dilli Anlatım (Türkçe & Almanca)**:
   - Sağ üstteki dil seçici ile açıklamaları **Türkçe + Almanca bir arada**, **sadece Türkçe** veya **sadece Almanca** görebilirsiniz. Böylece öğrenci okulda öğretmenin kullandığı terimleri (*Dividend, Divisor, Quotient, Rest, Überschlag, Herunterholen, Umkehraufgabe/Probe*) Türkçe mantığıyla birlikte öğrenir.
3. **🔍 Adım Adım Öğren Modu (*Lernmodus*)**:
   - **4 Altın Adım Döngüsü**: `1. Böl (Dividieren)` ➔ `2. Çarp (Multiplizieren)` ➔ `3. Çıkar (Subtrahieren)` ➔ `4. İndir (Herunterholen)`
   - **Kendi Sorunu Çöz**: Ev ödevindeki herhangi bir 4 veya 5 haneli sayıyı ve 3 haneli böleni yazıp adım adım nasıl çözüldüğünü izleyebilirsiniz.
   - **Yuvarlama İpucu (*Überschlag-Trick*)**: 3 haneli böleni yüzlüğe/onluğa yuvarlayarak zihinden tahmin etme taktiklerini gösterir.
4. **✏️ Kareli Defterde Sen Çöz! (*Übungsmodus*)**:
   - 4 farklı zorluk seviyesi: *4 Hane Kalansız*, *5 Hane Kalansız*, *Sıfır Tuzaklı (Null im Ergebnis)* ve *Kalanlı (Mit Rest)*.
   - Öğrenci her adımı bizzat kendisi doldurur, takıldığında **İpucu Ver (*Tipp*)** veya **Hızlı Deneme Çarpanı (*Nebenrechnung*)** aracını kullanabilir.
5. **💡 Gymnasium Sırları & Taktikler**:
   - Sınavlarda (*Klassenarbeit*) en çok sorulan **"Bölümde Sıfır Tuzağı (*Null-Falle*)"** ve **"Sağlama (*Die Probe*)"** kurallarını örneklerle anlatır.

---

## 🌐 GitHub Pages (`github.io`) Üzerinde Ücretsiz Yayınlama Rehberi

Bu proje tamamen statik (`index.html`, `style.css`, `app.js`) olduğu için **GitHub Pages** üzerinde hiçbir ek kuruluma gerek kalmadan doğrudan çalışır:

### Yöntem 1: GitHub Web Arayüzü ile (En Kolay - 1 Dakika)
1. [github.com/new](https://github.com/new) adresine gidin.
2. **Repository name** kısmına örneğin `mathe-bolme` (veya istediğiniz bir isim) yazın, **Public** seçin ve **Create repository** butonuna tıklayın.
3. Açılan sayfada **"uploading an existing file"** linkine tıklayın.
4. Bu klasördeki `index.html`, `style.css`, `app.js` ve `README.md` dosyalarını sürükleyip bırakın ve **Commit changes** butonuna basın.
5. Repository sayfasının üst menüsünden **Settings** ⚙️ sekmesine tıklayın.
6. Sol menüden **Pages** bölümüne girin.
7. **Build and deployment** altındaki **Branch** seçeneğini `None` yerine **`main`** (ve `/root`) olarak seçip **Save** butonuna basın.
8. 1 dakika içinde siteniz şu adreste yayına girecektir:
   `https://<github-kullanici-adiniz>.github.io/mathe-bolme/`

### Yöntem 2: Git Komutlarıyla Terminalden Yükleme
```bash
git init
git add index.html style.css app.js README.md
git commit -m "Initial commit: Gymnasium 5. Klasse Schriftliche Division App"
git branch -M main
git remote add origin https://github.com/<KULLANICI_ADINIZ>/<REPO_ADINIZ>.git
git push -u origin main
```
Ardından yine **Settings → Pages → Branch: `main`** seçerek yayına alabilirsiniz.
