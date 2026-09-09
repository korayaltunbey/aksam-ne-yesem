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
- Diyet, toplam süre, mutfak/yöre, öğün, pişirme yöntemi ve bütçe filtreleri
- Seçili tercihlere uygun sonuç vermeyecek filtre seçeneklerini pasif gösterme
- Eksik malzemeleri gösterme ve alışveriş listesine ekleme
- Favoriler, haftalık yemek planı, adım takibi ve tarif kopyalama
- Aynı tarifleri tekrar önermeme ve “yaptım” listesi
- Açık/koyu tema
- 255 tariflik yerel SQLite kataloğu

## Kullanıcı verileri

Hesap sistemi bulunmaz. Favoriler, alışveriş listesi, haftalık plan, tema ve geçmiş yalnızca kullandığın tarayıcının `localStorage` alanında saklanır. Başka bir cihazda otomatik görünmezler.

## Yerelde Docker ile çalıştırma

Docker Desktop kuruluysa aşağıdaki iki komut yeterlidir:

```bash
docker build -t aksam-ne-yesem .
docker run --rm -p 3000:3000 aksam-ne-yesem
```

Ardından [http://localhost:3000](http://localhost:3000) adresini aç.

Bu yol Node.js, npm, SQLite veya C++ derleme araçlarını bilgisayarına kurdurmaz; tüm bağımlılıklar Docker konteynerinde hazırlanır.

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
