export const notifyPartnerMainLayoutChange = () => {
  if (typeof document === "undefined") return;
  const scrollRoot = document.getElementById("platform-main-scroll-root");
  scrollRoot?.dispatchEvent(new Event("scroll", { bubbles: true }));
};

export const schedulePartnerMainLayoutChange = () => {
  notifyPartnerMainLayoutChange();
  if (typeof window === "undefined") return;
  [150, 300].forEach((delay) => {
    window.setTimeout(notifyPartnerMainLayoutChange, delay);
  });
};
