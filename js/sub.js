const KAKAO_REST_API_KEY = "801fbc3a08ceb5e92a5011b08f71352b";
const KAKAO_BOOK_API_URL = "https://dapi.kakao.com/v3/search/book";

let currentSalePrice = 0;

/* =========================
   공통 유틸
========================= */
function formatPrice(price) {
  return `${Number(price || 0).toLocaleString("ko-KR")}원`;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return dateString.slice(0, 10).replace(/-/g, ".");
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function getDisplayIsbn(isbnString) {
  if (!isbnString) return "-";
  const parts = isbnString.split(" ").filter(Boolean);
  return parts[parts.length - 1] || isbnString;
}

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function getHighResImageUrl(thumbnailUrl) {
  if (!thumbnailUrl) return "./img/common/no-image.jpg";

  try {
    const urlObj = new URL(thumbnailUrl);

    if (urlObj.searchParams.has("fname")) {
      return urlObj.searchParams.get("fname");
    }
  } catch (error) {
    console.error("썸네일 URL 파싱 에러:", error);
  }

  return thumbnailUrl.replace("R120x174", "R500x500");
}

/* =========================
   카카오 API 호출
========================= */
async function fetchBookByIsbn(isbn) {
  const response = await fetch(
    `${KAKAO_BOOK_API_URL}?target=isbn&query=${encodeURIComponent(isbn)}`,
    {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("카카오 책 API 호출에 실패했습니다.");
  }

  const data = await response.json();

  if (!data.documents || data.documents.length === 0) {
    throw new Error("해당 ISBN의 도서를 찾지 못했습니다.");
  }

  const targetDigits = normalizeDigits(isbn);

  const matchedBook =
    data.documents.find((book) =>
      normalizeDigits(book.isbn).includes(targetDigits),
    ) || data.documents[0];

  return matchedBook;
}

/* =========================
   책 정보 렌더링
========================= */
function renderBook(book) {
  const title = book.title || "도서명";
  const authors = book.authors?.length
    ? book.authors.join(", ")
    : "저자 정보 없음";
  const publisher = book.publisher || "출판사 정보 없음";
  const date = formatDate(book.datetime);
  const isbn = getDisplayIsbn(book.isbn);
  const contents = book.contents?.trim() || "책 소개가 준비 중입니다.";
  const thumbnail = getHighResImageUrl(book.thumbnail);
  const status = book.status || "판매중";

  const price = Number(book.price || 0);
  const salePrice = Number(book.sale_price || 0) || price;

  currentSalePrice = salePrice;

  // 상태
  const subStatus = document.getElementById("subStatus");
  if (subStatus) {
    subStatus.textContent = status;
  }

  // 제목
  const subTitle = document.getElementById("subTitle");
  if (subTitle) {
    subTitle.textContent = title;
    document.title = `${title} | book_koybo`;
  }

  // 메타 정보
  const subMeta = document.getElementById("subMeta");
  if (subMeta) {
    subMeta.textContent = `${authors} · ${publisher} · ${date}`;
  }

  // ISBN
  const subIsbn = document.getElementById("subIsbn");
  if (subIsbn) {
    subIsbn.textContent = `ISBN ${isbn}`;
  }

  // 책 소개 위 / 아래 둘 다
  const subContents = document.getElementById("subContents");
  const subContentsDetail = document.getElementById("subContentsDetail");

  if (subContents) {
    subContents.textContent = contents;
  }

  if (subContentsDetail) {
    subContentsDetail.textContent = contents;
  }

  // 표지 이미지
  const subCoverArea = document.getElementById("subCoverArea");
  if (subCoverArea) {
    subCoverArea.innerHTML = `
      <div class="sub_cover_img_box">
        <img src="${thumbnail}" alt="${title}">
      </div>
    `;
  }

  // 가격
  const subPrice = document.getElementById("subPrice");
  const subSalePrice = document.getElementById("subSalePrice");

  if (subPrice) {
    subPrice.textContent = formatPrice(price || salePrice);
  }

  if (subSalePrice) {
    subSalePrice.textContent = formatPrice(salePrice);
  }

  updateTotalPrice();
}

/* =========================
   수량 / 총금액
========================= */
function updateTotalPrice() {
  const qtyInput = document.getElementById("qtyInput");
  const totalPrice = document.getElementById("totalPrice");

  if (!qtyInput || !totalPrice) return;

  const quantity = Number(qtyInput.value || 1);
  totalPrice.textContent = formatPrice(currentSalePrice * quantity);
}

function bindQuantityButtons() {
  const qtyInput = document.getElementById("qtyInput");
  const qtyMinus = document.getElementById("qtyMinus");
  const qtyPlus = document.getElementById("qtyPlus");

  if (!qtyInput || !qtyMinus || !qtyPlus) return;

  qtyMinus.addEventListener("click", () => {
    let quantity = Number(qtyInput.value || 1);
    quantity = Math.max(1, quantity - 1);
    qtyInput.value = quantity;
    updateTotalPrice();
  });

  qtyPlus.addEventListener("click", () => {
    let quantity = Number(qtyInput.value || 1);
    quantity += 1;
    qtyInput.value = quantity;
    updateTotalPrice();
  });
}

/* =========================
   하단 탭 active 처리
========================= */
function bindDetailTabs() {
  const tabButtons = document.querySelectorAll(".detail_tab_menu button");

  if (!tabButtons.length) return;

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

/* =========================
   초기 실행
========================= */
async function initSubPage() {
  try {
    bindQuantityButtons();
    bindDetailTabs();

    const isbn = getQueryParam("isbn");

    if (!isbn) {
      throw new Error("URL에 isbn 값이 없습니다.");
    }

    const book = await fetchBookByIsbn(isbn);
    renderBook(book);
  } catch (error) {
    console.error("sub 페이지 초기화 오류:", error);

    const subTitle = document.getElementById("subTitle");
    const subContents = document.getElementById("subContents");
    const subContentsDetail = document.getElementById("subContentsDetail");
    const subCoverArea = document.getElementById("subCoverArea");

    if (subTitle) {
      subTitle.textContent = "도서 정보를 불러오지 못했습니다.";
    }

    if (subContents) {
      subContents.textContent = error.message;
    }

    if (subContentsDetail) {
      subContentsDetail.textContent = error.message;
    }

    if (subCoverArea) {
      subCoverArea.innerHTML = `
        <div class="sub_cover_img_box">
          <img src="./img/common/no-image.jpg" alt="이미지 없음">
        </div>
      `;
    }
  }
}

document.addEventListener("DOMContentLoaded", initSubPage);
