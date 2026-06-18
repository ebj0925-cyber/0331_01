
/* =========================
   공통 유틸
========================= */
function stripHTML(text = "") {
  return text.replace(/<[^>]*>/g, "").trim();
}

function formatPrice(price) {
  if (!price) return "가격 정보 없음";
  return `${Number(price).toLocaleString()}원`;
}

/* =========================
   메인 비주얼 JSON 불러오기
========================= */
async function loadMainVisualData() {
  try {
    const response = await fetch("./json/main_visual.json");
    if (!response.ok) {
      throw new Error("main_visual.json 파일을 불러오지 못했습니다.");
    }

    const data = await response.json();
    renderMainSlider(data.mainBanners);
    renderSidePromo(data.sidePromo);
    renderQuickMenu(data.quickMenus);
    renderMiniBanner(data.miniBanner);
  } catch (error) {
    console.error(error);
  }
}

function renderMainSlider(banners) {
  const slider = document.getElementById("mainSlider");
  if (!slider || !banners || banners.length === 0) return;

  slider.innerHTML = `
    <div class="main_slider">
      <div class="main_slider_track">
        ${banners
      .map(
        (item) => `
          <div class="main_slide">
            <a href="${item.link}">
              <img src="${item.image}" alt="${item.alt}">
            </a>
          </div>
        `
      )
      .join("")}
      </div>

      <div class="main_slider_control">
        <button class="slider_btn prev" type="button" aria-label="이전 배너">‹</button>
        <span class="slider_count">01 / ${String(banners.length).padStart(2, "0")}</span>
        <button class="slider_btn next" type="button" aria-label="다음 배너">›</button>
      </div>
    </div>
  `;

  const track = slider.querySelector(".main_slider_track");
  const slides = slider.querySelectorAll(".main_slide");
  const prevBtn = slider.querySelector(".prev");
  const nextBtn = slider.querySelector(".next");
  const count = slider.querySelector(".slider_count");

  let current = 0;
  let autoSlide;

  function updateSlider() {
    track.style.transform = `translateX(-${current * 100}%)`;
    count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(
      slides.length
    ).padStart(2, "0")}`;
  }

  function nextSlide() {
    current = (current + 1) % slides.length;
    updateSlider();
  }

  function prevSlide() {
    current = (current - 1 + slides.length) % slides.length;
    updateSlider();
  }

  function startAutoSlide() {
    autoSlide = setInterval(nextSlide, 3500);
  }

  function stopAutoSlide() {
    clearInterval(autoSlide);
  }

  nextBtn.addEventListener("click", nextSlide);
  prevBtn.addEventListener("click", prevSlide);

  slider.addEventListener("mouseenter", stopAutoSlide);
  slider.addEventListener("mouseleave", startAutoSlide);

  updateSlider();
  startAutoSlide();
}

function renderSidePromo(item) {
  const sidePromo = document.getElementById("sidePromo");
  if (!sidePromo || !item) return;

  sidePromo.innerHTML = `
    <div class="side_promo_card">
      <a href="${item.link}">
        <div class="side_promo_img">
          <img src="${item.image}" alt="${item.title}">
        </div>
        <div class="side_promo_txt">
          <span>${item.brand}</span>
          <strong>${item.title}</strong>
        </div>
      </a>
    </div>
  `;
}

function renderQuickMenu(items) {
  const quickMenu = document.getElementById("quickMenu");
  if (!quickMenu || !items || items.length === 0) return;

  quickMenu.innerHTML = items
    .map(
      (item) => `
      <li class="quick_item">
        <a href="${item.link}" class="quick_link">
          <span class="quick_icon">
            <img src="${item.icon}" alt="${item.name}">
          </span>
          <span class="quick_label">${item.name}</span>
        </a>
      </li>
    `
    )
    .join("");
}

function renderMiniBanner(item) {
  const miniBanner = document.getElementById("miniBanner");
  if (!miniBanner || !item) return;

  miniBanner.innerHTML = `
    <div class="mini_banner_box">
      <a href="${item.link}">
        <img src="${item.image}" alt="${item.alt}">
      </a>
    </div>
  `;
}

/* =========================
   카카오 책 API
========================= */
async function fetchBooks(query, size = 8) {
  const url = `${KAKAO_BOOK_API_URL}?target=title&query=${encodeURIComponent(query)}&size=${size}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error("카카오 책 API 요청 실패");
  }

  const data = await response.json();
  return data.documents || [];
}

/* =========================
   메인 카드 섹션
========================= */
function renderCardArea(books, query) {
  const cardContainer = document.getElementById("cardContainer");
  const mainSectionTitle = document.getElementById("mainSectionTitle");
  const mainSectionDesc = document.getElementById("mainSectionDesc");

  if (!cardContainer) return;

  if (mainSectionTitle) {
    mainSectionTitle.textContent = `${query} 추천 도서`;
  }

  if (mainSectionDesc) {
    mainSectionDesc.textContent = `카카오 API로 불러온 ${query} 관련 도서입니다.`;
  }

  if (!books.length) {
    cardContainer.innerHTML = `<div class="loading_box">도서를 불러오지 못했습니다.</div>`;
    return;
  }

  cardContainer.innerHTML = books
    .map((book) => {
      const title = stripHTML(book.title);
      const author = Array.isArray(book.authors) ? book.authors.join(", ") : "저자 정보 없음";
      const publisher = book.publisher || "출판사 정보 없음";
      const thumbnail = book.thumbnail || "./img/common/no-image.png";
      const price = book.sale_price || book.price;

      return `
        <article class="book_card">
          <a href="${book.url}" target="_blank" rel="noopener noreferrer">
            <div class="book_img">
              <img src="${thumbnail}" alt="${title}">
            </div>
            <div class="book_info">
              <h3 class="book_title">${title}</h3>
              <p class="book_author">${author}</p>
              <p class="book_publisher">${publisher}</p>
              <strong class="book_price">${formatPrice(price)}</strong>
            </div>
          </a>
        </article>
      `;
    })
    .join("");
}

async function loadMainBooks(query) {
  const cardContainer = document.getElementById("cardContainer");
  if (!cardContainer) return;

  cardContainer.innerHTML = `<div class="loading_box">도서를 불러오는 중입니다.</div>`;

  try {
    const books = await fetchBooks(query, 8);
    renderCardArea(books, query);
  } catch (error) {
    console.error(error);
    cardContainer.innerHTML = `<div class="loading_box">도서를 불러오지 못했습니다.</div>`;
  }
}

function bindCategoryTabs() {
  const tabButtons = document.querySelectorAll(".tab_btn");
  if (!tabButtons.length) return;

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      loadMainBooks(button.dataset.query);
    });
  });
}

/* =========================
   추천 책장
========================= */
function renderShelf(trackId, books) {
  const track = document.getElementById(trackId);
  if (!track) return;

  if (!books.length) {
    track.innerHTML = `<div class="loading_box shelf_loading">도서를 불러오지 못했습니다.</div>`;
    return;
  }

  track.innerHTML = books
    .map((book) => {
      const title = stripHTML(book.title);
      const author = Array.isArray(book.authors) ? book.authors.join(", ") : "저자 정보 없음";
      const thumbnail = book.thumbnail || "./img/common/no-image.png";
      const price = book.sale_price || book.price;

      return `
        <article class="shelf_book">
          <a href="${book.url}" target="_blank" rel="noopener noreferrer">
            <div class="shelf_book_img">
              <img src="${thumbnail}" alt="${title}">
            </div>
            <div class="shelf_book_info">
              <h4>${title}</h4>
              <p>${author}</p>
              <strong>${formatPrice(price)}</strong>
            </div>
          </a>
        </article>
      `;
    })
    .join("");
}

async function loadShelfBooks(trackId, query) {
  const track = document.getElementById(trackId);
  if (!track) return;

  track.innerHTML = `<div class="loading_box shelf_loading">불러오는 중...</div>`;

  try {
    const books = await fetchBooks(query, 10);
    renderShelf(trackId, books);
  } catch (error) {
    console.error(error);
    track.innerHTML = `<div class="loading_box shelf_loading">도서를 불러오지 못했습니다.</div>`;
  }
}

function bindShelfArrows() {
  const arrows = document.querySelectorAll(".shelf_arrow");
  if (!arrows.length) return;

  arrows.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;
      const track = document.getElementById(targetId);
      if (!track) return;

      const moveSize = 420;
      const direction = button.classList.contains("next") ? 1 : -1;

      track.scrollBy({
        left: moveSize * direction,
        behavior: "smooth"
      });
    });
  });
}

/* =========================
   초기 실행
========================= */
function initMainVisual() {
  loadMainVisualData();
  bindCategoryTabs();
  bindShelfArrows();
  loadMainBooks("한국문학");
  loadShelfBooks("shelf01", "힐링 에세이");
  loadShelfBooks("shelf02", "베스트셀러");
}