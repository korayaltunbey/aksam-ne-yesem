// /oneri sayfası (sunucu bileşeni).
// URL'deki ?mode= parametresini okur ve hangi modun açılacağını
// istemci bileşeni olan OneriClient'a ilk değer olarak iletir.

import type { SuggestionMode } from "@/lib/types";
import OneriClient from "@/components/OneriClient";

// searchParams artık bir Promise: istemciden gelen sorgu parametreleri buradan çözülür
interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OneriPage({ searchParams }: Props) {
  const params = await searchParams;
  // Yalnızca bilinen iki değer kabul edilir, aksi halde dolap varsayılır
  const modeParam = typeof params.mode === "string" ? params.mode : "dolap";
  const initialMode: SuggestionMode = modeParam === "bana" ? "bana" : "dolap";
  const initialFavoriteName =
    typeof params.favorite === "string" ? params.favorite : undefined;
  const initialPlannedName =
    typeof params.planned === "string" ? params.planned : undefined;

  return (
    <OneriClient
      initialMode={initialMode}
      initialFavoriteName={initialFavoriteName}
      initialPlannedName={initialPlannedName}
    />
  );
}
