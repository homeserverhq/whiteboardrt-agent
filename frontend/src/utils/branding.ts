const HIDDEN_CLASS = "whiteboardrt-agent-hidden";

const hideBrandedMenuEntries = () => {
  document.querySelectorAll(".dropdown-menu-item__text").forEach((element) => {
    const text = (element.textContent || "").trim();
    if (text === "Excalifont" || text === "Excalidraw links") {
      const item = element.closest("button") || element.parentElement;
      item?.classList.add(HIDDEN_CLASS);
    }
  });
};

export const installBrandingCleanup = (): (() => void) => {
  hideBrandedMenuEntries();
  const observer = new MutationObserver(hideBrandedMenuEntries);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
};
