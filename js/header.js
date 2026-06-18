function initHeader() {
  const brandMoreWrap = document.querySelector(".brand_more_wrap");
  const brandMoreToggle = document.querySelector(".brand_more_toggle");
  const menuBtn = document.querySelector(".menu_btn");
  const allMenuOverlay = document.querySelector(".all_menu_overlay");
  const allMenuPanel = document.querySelector(".all_menu_panel");
  const allMenuClose = document.querySelector(".all_menu_close");

  function openAllMenu() {
    allMenuOverlay.classList.add("open");
    allMenuPanel.classList.add("open");
    allMenuOverlay.setAttribute("aria-hidden", "false");
    allMenuPanel.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("all_menu_open");
  }

  function closeAllMenu() {
    allMenuOverlay.classList.remove("open");
    allMenuPanel.classList.remove("open");
    allMenuOverlay.setAttribute("aria-hidden", "true");
    allMenuPanel.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("all_menu_open");
  }

  if (brandMoreWrap && brandMoreToggle) {
    brandMoreToggle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = brandMoreWrap.classList.toggle("open");
      brandMoreToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  if (menuBtn && allMenuOverlay && allMenuPanel && allMenuClose) {
    menuBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openAllMenu();
    });

    allMenuClose.addEventListener("click", closeAllMenu);
    allMenuOverlay.addEventListener("click", closeAllMenu);
  }

  document.addEventListener("click", function (e) {
    if (brandMoreWrap && brandMoreToggle && !brandMoreWrap.contains(e.target)) {
      brandMoreWrap.classList.remove("open");
      brandMoreToggle.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && allMenuPanel?.classList.contains("open")) {
      closeAllMenu();
    }
  });
}
