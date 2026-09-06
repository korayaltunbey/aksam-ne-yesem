# Katkıda Bulunma

Akşam Ne Yesem? katkılarına açıktır. Büyük değişikliklerden önce issue açarak öneriyi ve kapsamı paylaşın.

## Geliştirme kurulumu

1. Node.js 22.x kullanın. `.nvmrc` dosyası bu sürümü belirtir.
2. Bağımlılıkları kurun: `npm ci`
3. Yerel SQLite veritabanını hazırlayın:

```bash
npm run db:migrate
npm run db:seed
```

4. Geliştirme sunucusunu başlatın: `npm run dev`

## Değişiklik öncesi kontroller

```bash
npm run lint
npm run test:recommendations
npx tsc --noEmit
npm run build
```

Tarif verisi eklerken slug değerini benzersiz tutun, zorunlu malzeme miktarlarını belirtin ve diyet/metadata değerlerini tarifle uyumlu girin. SQLite dosyalarını veya `node_modules` klasörünü commit etmeyin.
