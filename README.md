# Akşam Ne Yesem? 🍲

Elindeki malzemelere, damak tercihine ve ayırabileceğin süreye göre yemek önerileri sunan Türkçe web uygulaması.

## Hemen kullan

Uygulama yayında: **[aksam-ne-yesem-production.up.railway.app](https://aksam-ne-yesem-production.up.railway.app)**

Kullanmak için hesap oluşturman veya program kurman gerekmez. Bağlantıyı aç, tercihlerini seç ve tarifini al.

### Masaüstüne veya telefona ekleme

Uygulamayı Chrome ya da Edge ile açtıktan sonra tarayıcı menüsünden **Uygulama olarak yükle** seçeneğini kullanabilirsin. Böylece uygulama simgesi ana ekranında veya masaüstünde görünür ve ayrı bir pencere olarak açılır.

## Özellikler

- Dolaptaki malzemelerle tarif bulma veya malzemesiz öneri alma
- Kişi sayısına göre otomatik miktar ölçekleme
- Diyet, toplam süre, mutfak/yöre, öğün ve pişirme yöntemi filtreleri
- Eşleşen ve eksik malzemeleri açıklama; eksik malzemeler için alternatif önerileri
- Eksik malzeme listesini tek tuşla kopyalama ve alışveriş listesine ekleme
- Tekrarlanan malzemeleri miktarlarıyla birleştiren alışveriş listesi
- Favoriler, haftalık yemek planı, adım takibi, pişirme modu ve tarif kopyalama
- Aynı tarifleri tekrar önermeme ve “yaptım” listesi
- Açık/koyu tema
- 256 tariflik yerel SQLite kataloğu

## Kullanıcı verileri

Hesap sistemi bulunmaz. Favoriler, alışveriş listesi, haftalık plan, tema ve geçmiş yalnızca kullandığın tarayıcının `localStorage` alanında saklanır. Başka bir cihazda otomatik görünmezler.

## Docker ile kurulum

Bu yöntem Windows, macOS veya Linux'ta projeyi Docker konteyneri içinde çalıştırır.

1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) uygulamasını indirip kur.
2. Docker Desktop'ı aç ve çalışır duruma gelmesini bekle.
3. Terminali açıp projeyi indir:

   ```bash
   git clone https://github.com/korayaltunbey/aksam-ne-yesem.git
   cd aksam-ne-yesem
   ```

4. Docker imajını oluştur:

   ```bash
   docker build -t aksam-ne-yesem .
   ```

5. Uygulamayı başlat:

   ```bash
   docker run --rm -p 3000:3000 aksam-ne-yesem
   ```

6. Tarayıcıdan [http://localhost:3000](http://localhost:3000) adresini aç.

Uygulamayı durdurmak için terminal penceresinde `Ctrl + C` tuşlarına bas. Aynı anda 3000 portunu kullanan başka bir uygulama varsa `-p 3001:3000` kullanıp [http://localhost:3001](http://localhost:3001) adresini aç.

## Geliştirme kurulumu

Node.js **22.x** ve npm gerekir.

```bash
git clone https://github.com/korayaltunbey/aksam-ne-yesem.git
cd aksam-ne-yesem
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde açılır.

> `better-sqlite3` native bir Node modülüdür. Windows'ta Node 22 kullanılması önerilir. Hazır ikili bulunamadığında Visual Studio'nun **Desktop development with C++** iş yükü gerekebilir. Docker kurulumu bu gereksinimi ortadan kaldırır.

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusunu başlatır |
| `npm run build` | Production derlemesi üretir |
| `npm run start` | Production sunucusunu başlatır |
| `npm run lint` | ESLint kontrolünü çalıştırır |
| `npx tsc --noEmit` | TypeScript kontrolünü çalıştırır |
| `npm run test:recommendations` | Öneri ve filtre regresyon testlerini çalıştırır |
| `npm run db:migrate` | SQLite migrationlarını uygular |
| `npm run db:seed` | Tarif kataloğunu oluşturur veya günceller |

## Teknoloji

- Next.js 16, React 19 ve TypeScript
- Tailwind CSS 4
- SQLite, Drizzle ORM ve better-sqlite3
- Docker ile yayın paketi
- PWA manifesti ile tarayıcıdan uygulama olarak kurulum

## Mimari

```text
Tarayıcı
  → Next.js API route'ları
  → öneri ve filtreleme motoru
  → SQLite tarif kataloğu
```

Tarif kataloğu çalışma anında harici bir yapay zekâ veya yemek üretim servisine ihtiyaç duymaz.

## Yayınlama

Repository bir `Dockerfile` içerir. Railway, Render veya Docker destekleyen başka bir platform projeyi bu dosyayı kullanarak yayınlayabilir.

Railway’de güncel sürümü göndermek için:

```bash
railway up
```

## Katkı

Geliştirme kuralları ve kontrol listesi için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasına bak.

## Lisans

Bu repository için henüz bir lisans seçilmemiştir. Kodu yeniden dağıtmadan önce repository sahibiyle iletişime geçin.
