# Proje Durumu — Akşam Ne Yesem?

## Mevcut durum

Akşam Ne Yesem?, elinizdeki malzemelere ve tercihlerinize göre uygun yemekleri keşfetmenizi sağlayan yerel bir yemek öneri uygulamasıdır.

- Paket adı: `aksam-ne-yesem`
- Tarif kataloğu: 255 tarif
- Veritabanı: `data/aksam-ne-yesem.db`
- Veritabanı teknolojisi: SQLite + Drizzle ORM
- Uygulama: Next.js App Router, React, TypeScript ve Tailwind CSS
- API route'ları: `/api/suggest` ve `/api/recipe`
- Regression testleri: `scripts/test-recommendations.ts`
- Son doğrulama: recommendation testleri, lint ve production build başarılı

## Mimari ve veri akışı

```text
OneriClient
  -> POST /api/suggest
  -> parseSuggestionRequest
  -> getRecommendations
  -> recipe-repository
  -> SQLite + Drizzle tarif kataloğu
```

Tarif detay akışı:

```text
OneriClient
  -> POST /api/recipe
  -> parseRecipeRequest
  -> recipe-repository
  -> recipe-mapper
  -> kişi sayısına göre ölçeklenmiş tarif
```

Tarifler ve öneriler yerel katalogdan deterministik olarak üretilir; runtime sırasında harici bir yemek üretim servisine ihtiyaç yoktur.

## Önemli dosyalar

- `app/api/suggest/route.ts`: Yerel öneri listesini döndürür.
- `app/api/recipe/route.ts`: Katalogdan seçilen tarifin detayını döndürür.
- `components/OneriClient.tsx`: Öneri, filtre, tarif detay ve geçmiş akışı.
- `components/MalzemeGirisi.tsx`: Elle malzeme girişi ve sık kullanılan malzemeler.
- `lib/requests.ts`: İstek gövdelerini doğrular ve temizler.
- `lib/db.ts`: `data/aksam-ne-yesem.db` için server-side Drizzle bağlantısı.
- `lib/recipe-repository.ts`: Tarif, ingredient, adım ve diyet sorguları.
- `lib/recommendations.ts`: Normalization, ingredient matching, coverage, scoring, filtreleme ve exclusion.
- `lib/recipe-mapper.ts`: Database tariflerini response modeline ve porsiyon ölçeklemeye dönüştürür.
- `db/schema.ts`: SQLite + Drizzle şeması.
- `db/seed.ts`: Idempotent tarif kataloğu seed'i.
- `scripts/test-recommendations.ts`: Recommendation regression testleri.

Eksik tarif malzemeleri `lib/shopping.ts` üzerinden `foof-shopping-list` localStorage anahtarında tutulur; ana sayfada miktarlarıyla işaretlenebilir, silinebilir veya tamamen temizlenebilir.

Favori tarifler `lib/favorites.ts` üzerinden `foof-favorites` localStorage anahtarında tutulur; tarifin o anki ölçeklenmiş porsiyon bilgisi korunur ve ana sayfadan kaldırılabilir.

Tarif hazırlanış ilerlemesi `lib/steps.ts` üzerinden `foof-recipe-steps` localStorage anahtarında tarif adına göre tutulur; adımlar işaretlenebilir, yenileme sonrası korunur ve tarif kartından sıfırlanabilir.

Haftalık yemek planı `lib/week-plan.ts` üzerinden `foof-week-plan` localStorage anahtarında tutulur; tarif detayından gün seçilerek eklenir ve ana sayfada gün bazında kaldırılabilir.

Tarif metadata alanları `recipes` tablosunda tutulur: `mealType`, `cookingMethod`, `budgetLevel`, `caloriesPerServing`, `proteinGrams` ve `isFreezerFriendly`. Alanlar geriye dönük uyumlu olarak nullable/varsayılanlıdır; mevcut tarifler metadata olmadan da çalışır.

`estimatedCostPerServing` alanı küratörlü tariflerde yaklaşık TL/porsiyon maliyetini taşır. Bu değer tarif kartında yaklaşık olarak gösterilir; kalori ve protein alanları doğrulanmış veri yoksa boş bırakılır.

## Recommendation davranışı

Dolaptakiler modunda en az bir kullanıcı malzemesiyle eşleşen tarifler gösterilir. Sıralama şu önceliklerle yapılır:

1. `ingredientCoverage`: Kaç farklı kullanıcı malzemesi karşılanıyor?
2. `matchScore`: Tarifin gerekli malzemelerinin ne kadarı karşılanıyor?
3. Eşleşen ingredient sayısı
4. Hazırlama süresi
5. Tarif adı

Ingredient matching normalization ve token-aware eşleşme kullanır. Bu sayede `tavuk`, `tavuk göğsü` gibi anlamlı alt türler eşleşebilir. Diyet, mutfak, süre, öğün, pişirme yöntemi, bütçe, `excludeNames` ve `excludeIngredients` filtreleri recommendation/repository katmanında uygulanır.

Genel `Bana Öner` modunda ingredient filtresi uygulanmaz; diğer filtreler çalışmaya devam eder. Dolaptakiler modunda öneri geçmişi uygun tariflerin tamamını dışlarsa, uygun tarifleri yeniden kullanabilen güvenli fallback uygulanır.

## Tarif kataloğu ve veritabanı

Katalog 255 tarif içerir. Türk, İtalyan, Asya, Meksika, Akdeniz ve diğer desteklenen mutfaklar; kahvaltı, çorba, ana yemek, salata/meze, hamur işi ve tatlı kategorileri bulunur. Diyet etiketleri, süreler, kişi sayıları ve ingredient miktarları seed verisinde tutulur.

`db/seed.ts` slug değerleri üzerinden idempotent çalışır ve mevcut tarifleri korur. Veritabanı dosyası `data/aksam-ne-yesem.db` olarak tutulur; mevcut katalog yeni dosya adına taşınarak korunmuştur.

```bash
npm run db:migrate
npm run db:seed
```

## Kullanıcı verileri

Kimlik doğrulama olmadığı için anonim kullanıcı geçmişi ve tercihleri tarayıcı localStorage'ında tutulur. Geriye dönük uyumluluk nedeniyle şu anahtarlar değiştirilmemelidir:

- `foof-suggestion-history`
- `foof-made`
- `foof-suggested`
- `foof-theme`

## Doğrulama komutları

```bash
npm run test:recommendations
npm run lint
npm run build
```

Bu dosya, Akşam Ne Yesem? uygulamasının güncel SQLite + Drizzle tabanlı yerel recommendation mimarisini ve 255 tariflik kataloğunu yansıtır.
