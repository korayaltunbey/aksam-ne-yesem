# Akşam Ne Yesem?

Elindeki malzemelere, damak tercihine ve ayırabileceğin zamana göre yemek önerileri sunan yerel bir Next.js uygulaması.

## Öne çıkan özellikler

- Dolaptaki malzemelerle veya genel olarak yemek önerme
- Diyet, mutfak/yöre, süre, öğün, pişirme yöntemi ve bütçe filtreleri
- Malzeme eşleşmesi ve eksik temel malzeme sayısına göre sıralama
- Kişi sayısına göre otomatik porsiyon ölçekleme
- Tarif detayları, adım ilerlemesi ve kopyalama
- Favoriler, alışveriş listesi ve haftalık yemek planı
- Daha önce önerilen veya yapılan yemekleri tekrar önermeme
- Açık/koyu tema
- Harici bir yemek üretim servisi gerektirmeyen yerel SQLite katalogu

## Teknoloji

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- SQLite, Drizzle ORM ve better-sqlite3

## Gereksinimler

- Node.js 22 veya daha yeni bir sürüm
- npm

`better-sqlite3` native bir Node modülüdür. Windows'ta hazır binary kullanılamazsa Visual Studio'nun **Desktop development with C++** workload'u gerekebilir.

## Kurulum

Projeyi klonlayın:

```bash
git clone <REPOSITORY_URL>
cd aksam-ne-yesem
```

Bağımlılıkları lock dosyasına bağlı olarak kurun:

```bash
npm ci
```

Yerel SQLite veritabanını oluşturup katalogu yükleyin:

```bash
npm run db:migrate
npm run db:seed
```

Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Tarayıcıdan [http://localhost:3000](http://localhost:3000) adresini açın.

## Ağdan erişim

Aynı ağdaki başka bir cihazdan test etmek için:

```bash
npm run dev -- --hostname 0.0.0.0
```

Ardından bilgisayarın yerel IP adresini kullanın:

```text
http://BILGISAYAR_IP_ADRESI:3000
```

IP adresi değişirse `next.config.ts` içindeki `allowedDevOrigins` değerini güncelleyin. Windows Güvenlik Duvarı, Node.js için özel ağ erişimini engelliyorsa izin verilmesi gerekir.

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production derlemesi |
| `npm run start` | Production sunucusu |
| `npm run lint` | ESLint kontrolü |
| `npx tsc --noEmit` | TypeScript kontrolü |
| `npm run test:recommendations` | Recommendation regression testleri |
| `npm run db:generate` | Yeni Drizzle migrationı üretir |
| `npm run db:migrate` | SQLite migrationlarını uygular |
| `npm run db:seed` | Tarif katalogunu idempotent şekilde yükler |

## Veritabanı

Çalışma zamanı veritabanı `data/aksam-ne-yesem.db` dosyasında tutulur. Bu dosya yereldir ve `.gitignore` ile repository dışında bırakılır. Yeni bir kurulumda migration ve seed komutlarını çalıştırmak yeterlidir.

Seed katalogunda tarifler için slug, malzeme, miktar, adım, diyet, öğün, pişirme yöntemi, bütçe ve uygun olduğunda tahmini porsiyon maliyeti metadata'sı bulunur. Kalori ve protein alanları doğrulanmış veri yoksa boş bırakılır.

## Yerel kullanıcı verileri

Kimlik doğrulama olmadığı için favoriler, alışveriş listesi, haftalık plan, adım ilerlemesi, tema ve geçmiş tarayıcı `localStorage` alanında tutulur. Bu veriler başka bilgisayara otomatik taşınmaz.

## Proje yapısı

| Dosya veya klasör | Görevi |
| --- | --- |
| `app/api/suggest/route.ts` | Öneri endpoint'i |
| `app/api/recipe/route.ts` | Tarif detay endpoint'i |
| `components/OneriClient.tsx` | Öneri ve tarif detay akışı |
| `components/TarifKarti.tsx` | Tarif detay kartı ve adım ilerlemesi |
| `lib/recommendations.ts` | Eşleşme, scoring, filtreleme ve exclusion |
| `lib/recipe-repository.ts` | SQLite tarif sorguları |
| `lib/shopping.ts` | Alışveriş listesi store'u |
| `lib/favorites.ts` | Favori tarif store'u |
| `lib/week-plan.ts` | Haftalık plan store'u |
| `db/schema.ts` | Drizzle SQLite şeması |
| `db/seed.ts` | Tarif katalogu seed'i |
| `drizzle/` | Veritabanı migrationları |
| `scripts/test-recommendations.ts` | Regression testleri |

## Katkı

Geliştirme kurulumu ve kontrol listesi için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasına bakın. Her push ve pull request için GitHub Actions üzerinde lint, typecheck, database seed, recommendation testleri ve production build çalışır.

## Lisans

Bu repository için henüz bir lisans seçilmemiştir. Kullanım ve dağıtım koşulları belirlenene kadar kodu public bir projede yeniden dağıtmadan önce repository sahibiyle iletişime geçin.
