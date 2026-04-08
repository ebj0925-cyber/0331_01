function initHeader() {
  const brandMoreWrap = document.querySelector(".brand_more_wrap");
  const brandMoreToggle = document.querySelector(".brand_more_toggle");

  if (!brandMoreWrap || !brandMoreToggle) return;

  brandMoreToggle.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const isOpen = brandMoreWrap.classList.toggle("open");
    brandMoreToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  document.addEventListener("click", function (e) {
    if (!brandMoreWrap.contains(e.target)) {
      brandMoreWrap.classList.remove("open");
      brandMoreToggle.setAttribute("aria-expanded", "false");
    }
  });
}