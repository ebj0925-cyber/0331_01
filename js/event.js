const eventData = {
  kyobo: [
    { img: "./img/event/event01.jpg", alt: "교보문고 이벤트 1", link: "#" },
    { img: "./img/event/event02.jpg", alt: "교보문고 이벤트 2", link: "#" },
    { img: "./img/event/event03.jpg", alt: "교보문고 이벤트 3", link: "#" },
    { img: "./img/event/event04.jpg", alt: "교보문고 이벤트 4", link: "#" },
    { img: "./img/event/event05.jpg", alt: "교보문고 이벤트 5", link: "#" },
    { img: "./img/event/event06.jpg", alt: "교보문고 이벤트 6", link: "#" }
  ],
  ebook: [
    { img: "./img/event/event11.jpg", alt: "eBook 이벤트 1", link: "#" },
    { img: "./img/event/event12.jpg", alt: "eBook 이벤트 2", link: "#" },
    { img: "./img/event/event13.jpg", alt: "eBook 이벤트 3", link: "#" }
  ],
  hottracks: [
    { img: "./img/event/event21.jpg", alt: "핫트랙스 이벤트 1", link: "#" },
    { img: "./img/event/event22.jpg", alt: "핫트랙스 이벤트 2", link: "#" },
    { img: "./img/event/event23.jpg", alt: "핫트랙스 이벤트 3", link: "#" }
  ]
};

function initEventSection() {
  const section = document.querySelector(".event_section");
  if (!section) return;

  const track = section.querySelector("#eventTrack");
  const tabs = section.querySelectorAll(".event_tab");
  const prevBtn = section.querySelector(".event_arrow.prev");
  const nextBtn = section.querySelector(".event_arrow.next");
  const view = section.querySelector(".event_view");

  if (!track || !tabs.length || !prevBtn || !nextBtn || !view) return;

  let currentCategory = "kyobo";
  let currentPage = 0;
  let itemsPerView = getItemsPerView();

  function getItemsPerView() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function renderItems(category) {
    const items = eventData[category] || [];

    track.innerHTML = items.map(item => `
      <li class="event_item">
        <a href="${item.link}" class="event_link">
          <img src="${item.img}" alt="${item.alt}">
        </a>
      </li>
    `).join("");

    currentPage = 0;
    itemsPerView = getItemsPerView();
    updateSlider();
  }

  function updateSlider() {
    const items = track.querySelectorAll(".event_item");
    const totalItems = items.length;

    if (!totalItems) {
      track.style.transform = "translateX(0)";
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    const firstItem = items[0];
    const trackStyle = window.getComputedStyle(track);
    const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || 0);
    const itemWidth = firstItem.offsetWidth;
    const maxPage = Math.max(0, totalItems - itemsPerView);

    if (currentPage > maxPage) {
      currentPage = maxPage;
    }

    const moveX = (itemWidth + gap) * currentPage;
    track.style.transform = `translateX(-${moveX}px)`;

    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= maxPage;
  }

  function updateActiveTab(clickedTab) {
    tabs.forEach(tab => tab.classList.remove("active"));
    clickedTab.classList.add("active");
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const category = tab.dataset.category;
      if (!category || category === currentCategory) return;

      currentCategory = category;
      updateActiveTab(tab);
      renderItems(currentCategory);
    });
  });

  prevBtn.addEventListener("click", () => {
    if (currentPage > 0) {
      currentPage -= 1;
      updateSlider();
    }
  });

  nextBtn.addEventListener("click", () => {
    const totalItems = (eventData[currentCategory] || []).length;
    const maxPage = Math.max(0, totalItems - itemsPerView);

    if (currentPage < maxPage) {
      currentPage += 1;
      updateSlider();
    }
  });

  window.addEventListener("resize", () => {
    itemsPerView = getItemsPerView();
    updateSlider();
  });

  renderItems(currentCategory);
}