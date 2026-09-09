"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Önceki sürümlerin servis çalışanı eski JavaScript paketini tutabiliyor.
    // Uygulama çevrimdışı önbellek kullanmadığı için kayıtları kaldırıp bir kez
    // yenilemek, kullanıcının her zaman güncel arayüzü almasını sağlar.
    void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      if (registrations.length === 0) return;

      await Promise.all(registrations.map((registration) => registration.unregister()));
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
      window.location.reload();
    });
  }, []);

  return null;
}
