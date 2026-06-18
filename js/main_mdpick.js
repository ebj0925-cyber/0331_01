let mdPickInitialized = false;

function initMdPick() {
  if (mdPickInitialized) return;

  const tabsEl = document.getElementById("mdPickTabs");
  const listEl = document.getElementById("mdPickBooks");
  const moreEl = document.getElementById("mdPickMore");
  const prevBtn = document.getElementById("mdPickPrev");
  const nextBtn = document.getElementById("mdPickNext");
  const viewEl = document.getElementById("mdPickView");
  const trackEl = document.getElementById("mdPickBooks");

  if (
    !tabsEl ||
    !listEl ||
    !moreEl ||
    !prevBtn ||
    !nextBtn ||
    !viewEl ||
    !trackEl
  ) {
    return;
  }

  mdPickInitialized = true;

  fetch("./json/mdpick.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("mdpick.json 파일을 불러오지 못했습니다.");
      }
      return response.json();
    })
    .then((data) => {
      renderMdPickTabs(data.tabs, data.activeTab);
      renderMdPickProducts(data.products);
      moreEl.href = data.moreLink || "#";
      setupMdPickSlider();
    })
    .catch((error) => {
      console.error(error);
    });

  function renderMdPickTabs(tabs, activeTab) {
    tabsEl.innerHTML = tabs
      .map((tab) => {
        const activeClass = tab === activeTab ? "is_active" : "";
        return `<span class="md_pick_tab ${activeClass}">${tab}</span>`;
      })
      .join("");
  }

  function renderMdPickProducts(products) {
    listEl.innerHTML = products
      .map((item) => {
        return `
          <li class="md_pick_item">
            <a href="${item.link || "#"}" class="md_pick_link">
              <div class="md_pick_thumb">
                <img src="${item.image}" alt="${item.name}">
              </div>
              <p class="md_pick_name">${item.name}</p>
            </a>
          </li>
        `;
      })
      .join("");
  }

  function setupMdPickSlider() {
    let currentIndex = 0;

    function updateSlider() {
      const items = trackEl.querySelectorAll(".md_pick_item");
      if (!items.length) return;

      const trackStyle = window.getComputedStyle(trackEl);
      const gap =
        parseFloat(trackStyle.gap) || parseFloat(trackStyle.columnGap) || 0;
      const itemWidth = items[0].getBoundingClientRect().width + gap;
      const visibleCount = Math.max(
        1,
        Math.floor((viewEl.clientWidth + gap) / itemWidth),
      );
      const maxIndex = Math.max(0, items.length - visibleCount);

      if (currentIndex > maxIndex) {
        currentIndex = maxIndex;
      }

      trackEl.style.transform = `translateX(-${currentIndex * itemWidth}px)`;

      prevBtn.classList.toggle("is_disabled", currentIndex === 0);
      nextBtn.classList.toggle("is_disabled", currentIndex >= maxIndex);
    }

    prevBtn.addEventListener("click", () => {
      if (prevBtn.classList.contains("is_disabled")) return;
      currentIndex -= 1;
      updateSlider();
    });

    nextBtn.addEventListener("click", () => {
      if (nextBtn.classList.contains("is_disabled")) return;
      currentIndex += 1;
      updateSlider();
    });

    window.addEventListener("resize", updateSlider);
    updateSlider();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initMdPick();

  const observer = new MutationObserver(() => {
    initMdPick();

    if (document.getElementById("mdPickBooks")) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});
