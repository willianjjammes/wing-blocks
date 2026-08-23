export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    // Registo relativo: o scope do service worker passa a ser a pasta onde o jogo vive.
    void navigator.serviceWorker.register("sw.js");
  });
}
