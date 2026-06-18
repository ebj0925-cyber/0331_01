const KAKAO_CONFIG = {
  REST_API_KEY: "801fbc3a08ceb5e92a5011b08f71352b",
};
const KAKAO_BOOK_API_URL = "https://dapi.kakao.com/v3/search/book";

/* =========================
   데모용 주문 저장소
========================= */
const ORDER_STORAGE_KEY = "kyoboBookCloneOrders";

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
  const parts = String(isbnString).split(" ").filter(Boolean);
  return parts[parts.length - 1] || isbnString;
}

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, "").trim();
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
        Authorization: `KakaoAK ${KAKAO_CONFIG.REST_API_KEY}`,
      },
    }
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
      normalizeDigits(book.isbn).includes(targetDigits)
    ) || data.documents[0];

  return matchedBook;
}

async function fetchBooksByAuthor(author) {
  if (!author) return [];

  const headers = {
    Authorization: `KakaoAK ${KAKAO_CONFIG.REST_API_KEY}`,
  };

  const response = await fetch(
    `${KAKAO_BOOK_API_URL}?target=person&query=${encodeURIComponent(author)}&size=20`,
    { headers }
  );

  if (!response.ok) {
    throw new Error("작가의 다른 책 조회에 실패했습니다.");
  }

  const data = await response.json();
  let books = data.documents || [];

  if (!books.length) {
    const fallbackResponse = await fetch(
      `${KAKAO_BOOK_API_URL}?query=${encodeURIComponent(author)}&size=20`,
      { headers }
    );

    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      books = (fallbackData.documents || []).filter((item) => {
        return item.authors?.some((name) => {
          const a = normalizeText(name);
          const b = normalizeText(author);
          return a === b || a.includes(b) || b.includes(a);
        });
      });
    }
  }

  return books;
}

/* =========================
   JSON 생성 + 서버 전송
========================= */
function createOrderPayload(book, actionType = "cart") {
  const qtyInput = document.getElementById("qtyInput");
  const quantity = Math.max(1, Number(qtyInput?.value || 1));
  const unitPrice = Number(book.sale_price || book.price || 0);

  return {
    actionType, // cart | buy
    isbn: getDisplayIsbn(book.isbn),
    title: book.title || "도서명",
    author: book.authors?.join(", ") || "저자 정보 없음",
    publisher: book.publisher || "출판사 정보 없음",
    quantity,
    unitPrice,
    totalPrice: unitPrice * quantity,
    createdAt: new Date().toISOString()
  };
}

function saveOrderData(payload) {
  const savedOrders = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || "[]");
  savedOrders.push(payload);
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(savedOrders));
  return savedOrders;
}

function showOrderToast(message) {
  const toast = document.getElementById("orderToast");
  if (!toast) return;

  clearTimeout(showOrderToast.timer);
  toast.textContent = message;
  toast.classList.add("show");

  showOrderToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function sendOrderData(book, actionType = "cart") {
  const payload = createOrderPayload(book, actionType);

  try {
    const savedOrders = saveOrderData(payload);
    console.log("저장 성공:", savedOrders);
    showOrderToast(actionType === "buy" ? "구매 정보가 저장되었습니다." : "장바구니에 담겼습니다.");
  } catch (error) {
    console.error("저장 오류:", error);
    showOrderToast("데이터 저장 중 오류가 발생했습니다.");
  }
}

function bindPurchaseButtons(book) {
  const cartBtn = document.querySelector(".btn_cart");
  const buyBtn = document.querySelector(".btn_buy");
  const giftBtn = document.querySelector(".btn_gift");
  const pickupBtn = document.querySelector(".btn_pickup");

  if (cartBtn) {
    cartBtn.onclick = () => sendOrderData(book, "cart");
  }

  if (buyBtn) {
    buyBtn.onclick = () => sendOrderData(book, "buy");
  }

  if (giftBtn) {
    giftBtn.onclick = () => showOrderToast("선물하기 기능은 준비 중입니다.");
  }

  if (pickupBtn) {
    pickupBtn.onclick = () => showOrderToast("바로드림 서비스는 준비 중입니다.");
  }
}

/* =========================
   작가의 다른 책 렌더링
========================= */
async function renderAuthorBooks(book) {
  const authorBookList = document.getElementById("authorBookList");
  if (!authorBookList) return;

  const firstAuthor = book.authors?.[0];
  if (!firstAuthor) {
    authorBookList.textContent = "작가 정보가 없습니다.";
    return;
  }

  try {
    const authorBooks = await fetchBooksByAuthor(firstAuthor);

    const currentIsbn = normalizeDigits(book.isbn);
    const currentTitle = normalizeText(book.title);

    const filteredBooks = authorBooks
      .filter((item) => {
        const itemIsbn = normalizeDigits(item.isbn);
        const itemTitle = normalizeText(item.title);

        const sameIsbn =
          itemIsbn &&
          currentIsbn &&
          (itemIsbn.includes(currentIsbn) || currentIsbn.includes(itemIsbn));

        const sameTitle =
          itemTitle &&
          currentTitle &&
          itemTitle === currentTitle;

        return !sameIsbn && !sameTitle;
      })
      .slice(0, 4);

    if (!filteredBooks.length) {
      authorBookList.textContent = "같은 작가의 다른 책 정보가 없습니다.";
      return;
    }

    authorBookList.innerHTML = `
      <ul class="author_other_book_list">
        ${filteredBooks
          .map((item) => {
            const itemTitle = item.title || "제목 정보 없음";
            const itemAuthor = item.authors?.length
              ? item.authors.join(", ")
              : firstAuthor;
            const itemIsbn = getDisplayIsbn(item.isbn);
            const itemThumb = getHighResImageUrl(item.thumbnail);

            return `
              <li class="author_other_book_item">
                <a href="./sub.html?isbn=${encodeURIComponent(itemIsbn)}" class="author_other_book_link">
                  <div class="author_other_book_thumb">
                    <img src="${itemThumb}" alt="${itemTitle}">
                  </div>
                  <div class="author_other_book_info">
                    <p class="author_other_book_name">${itemTitle}</p>
                    <p class="author_other_book_author">${itemAuthor}</p>
                  </div>
                </a>
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  } catch (error) {
    console.error(error);
    authorBookList.textContent = "같은 작가의 다른 책을 불러오지 못했습니다.";
  }
}

/* =========================
   책 정보 렌더링
========================= */
async function renderBook(book) {
  const title = book.title || "도서명";
  const authors = book.authors?.length
    ? book.authors.join(", ")
    : "저자 정보 없음";
  const translators = book.translators?.length
    ? book.translators.join(", ")
    : "-";
  const publisher = book.publisher || "출판사 정보 없음";
  const date = formatDate(book.datetime);
  const isbn = getDisplayIsbn(book.isbn);
  const contents = book.contents?.trim() || "책 소개가 준비 중입니다.";
  const thumbnail = getHighResImageUrl(book.thumbnail);
  const status = book.status || "판매중";

  const price = Number(book.price || 0);
  const salePrice = Number(book.sale_price || 0) || price;

  currentSalePrice = salePrice;

  /* ===== 상단 영역 ===== */
  const subStatus = document.getElementById("subStatus");
  if (subStatus) {
    subStatus.textContent = status;
  }

  const subTitle = document.getElementById("subTitle");
  if (subTitle) {
    subTitle.textContent = title;
    document.title = `${title} | Kyobo Book Clone`;
  }

  const subMeta = document.getElementById("subMeta");
  if (subMeta) {
    subMeta.textContent = `${authors} · ${publisher} · ${date}`;
  }

  const subIsbn = document.getElementById("subIsbn");
  if (subIsbn) {
    subIsbn.textContent = `ISBN ${isbn}`;
  }

  const subContents = document.getElementById("subContents");
  if (subContents) {
    subContents.textContent = contents;
  }

  const subContentsDetail = document.getElementById("subContentsDetail");
  if (subContentsDetail) {
    subContentsDetail.textContent = contents;
  }

  const subCoverArea = document.getElementById("subCoverArea");
  if (subCoverArea) {
    subCoverArea.innerHTML = `
      <div class="sub_cover_img_box">
        <img src="${thumbnail}" alt="${title}">
      </div>
    `;
  }

  const subTabSalePrice = document.getElementById("subTabSalePrice");
  const subMainSalePrice = document.getElementById("subMainSalePrice");
  const subPrice = document.getElementById("subPrice");
  const subBookUrl = document.getElementById("subBookUrl");

  if (subTabSalePrice) {
    subTabSalePrice.textContent = formatPrice(salePrice);
  }

  if (subMainSalePrice) {
    subMainSalePrice.textContent = formatPrice(salePrice);
  }

  if (subPrice) {
    subPrice.textContent = formatPrice(price || salePrice);
  }

  if (subBookUrl) {
    subBookUrl.href = book.url || "#";
  }

  /* ===== 하단 상세 정보 ===== */
  const subAuthor = document.getElementById("subAuthor");
  const subTranslator = document.getElementById("subTranslator");
  const subPublisherDetail = document.getElementById("subPublisherDetail");
  const subPubDateDetail = document.getElementById("subPubDateDetail");
  const subIsbnDetail = document.getElementById("subIsbnDetail");
  const subBookStatus = document.getElementById("subBookStatus");

  if (subAuthor) {
    subAuthor.textContent = authors;
  }

  if (subTranslator) {
    subTranslator.textContent = translators;
  }

  if (subPublisherDetail) {
    subPublisherDetail.textContent = publisher;
  }

  if (subPubDateDetail) {
    subPubDateDetail.textContent = date;
  }

  if (subIsbnDetail) {
    subIsbnDetail.textContent = isbn;
  }

  if (subBookStatus) {
    subBookStatus.textContent = status;
  }

  updateTotalPrice();
  bindPurchaseButtons(book);
  await renderAuthorBooks(book);
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
  const tabButtons = document.querySelectorAll(".detail_tab_menu .detail_tab");
  const panels = document.querySelectorAll(".sub_detail_contents .detail_panel");

  if (!tabButtons.length || !panels.length) return;

  tabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      panels.forEach((panel) => panel.classList.remove("active"));

      button.classList.add("active");

      if (panels[index]) {
        panels[index].classList.add("active");
      }
    });
  });
}

/* =========================
   에러 화면 처리
========================= */
function renderErrorState(message) {
  const subTitle = document.getElementById("subTitle");
  const subContents = document.getElementById("subContents");
  const subContentsDetail = document.getElementById("subContentsDetail");
  const subCoverArea = document.getElementById("subCoverArea");
  const subTabSalePrice = document.getElementById("subTabSalePrice");
  const subMainSalePrice = document.getElementById("subMainSalePrice");
  const subPrice = document.getElementById("subPrice");
  const totalPrice = document.getElementById("totalPrice");

  const subAuthor = document.getElementById("subAuthor");
  const subTranslator = document.getElementById("subTranslator");
  const subPublisherDetail = document.getElementById("subPublisherDetail");
  const subPubDateDetail = document.getElementById("subPubDateDetail");
  const subIsbnDetail = document.getElementById("subIsbnDetail");
  const subBookStatus = document.getElementById("subBookStatus");
  const authorBookList = document.getElementById("authorBookList");

  if (subTitle) {
    subTitle.textContent = "도서 정보를 불러오지 못했습니다.";
  }

  if (subContents) {
    subContents.textContent = message;
  }

  if (subContentsDetail) {
    subContentsDetail.textContent = message;
  }

  if (subCoverArea) {
    subCoverArea.innerHTML = `
      <div class="sub_cover_img_box">
        <img src="./img/common/no-image.jpg" alt="이미지 없음">
      </div>
    `;
  }

  if (subTabSalePrice) subTabSalePrice.textContent = "0원";
  if (subMainSalePrice) subMainSalePrice.textContent = "0원";
  if (subPrice) subPrice.textContent = "0원";
  if (totalPrice) totalPrice.textContent = "0원";

  if (subAuthor) subAuthor.textContent = "-";
  if (subTranslator) subTranslator.textContent = "-";
  if (subPublisherDetail) subPublisherDetail.textContent = "-";
  if (subPubDateDetail) subPubDateDetail.textContent = "-";
  if (subIsbnDetail) subIsbnDetail.textContent = "-";
  if (subBookStatus) subBookStatus.textContent = "-";

  if (authorBookList) {
    authorBookList.textContent = "같은 작가의 다른 책 정보를 불러오지 못했습니다.";
  }
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
    await renderBook(book);
  } catch (error) {
    console.error("sub 페이지 초기화 오류:", error);
    renderErrorState(error.message);
  }
}

document.addEventListener("DOMContentLoaded", initSubPage);

/* =========================
   review
========================= */
function getScoreText(score) {
  return `${score}점`;
}

function renderReviewSummary(summary) {
  const averageEl = document.getElementById("reviewAverage");
  const totalCountEl = document.getElementById("reviewTotalCount");

  if (averageEl) {
    averageEl.textContent = Number(summary.averageScore || 0).toFixed(1);
  }

  if (totalCountEl) {
    totalCountEl.textContent = `${summary.totalCount || 0}개`;
  }
}

function renderReviewKeywords(keywords) {
  const keywordListEl = document.getElementById("reviewKeywordList");
  if (!keywordListEl) return;

  if (!keywords || !keywords.length) {
    keywordListEl.innerHTML = "";
    return;
  }

  keywordListEl.innerHTML = keywords
    .map(
      (item) => `
        <div class="review_keyword_item">
          <span class="review_keyword_label">${item.label}</span>
          <strong class="review_keyword_percent">${item.percent}%</strong>
        </div>
      `
    )
    .join("");
}

function renderReviewList(reviews) {
  const reviewListEl = document.getElementById("reviewList");
  if (!reviewListEl) return;

  if (!reviews || !reviews.length) {
    reviewListEl.innerHTML = `<div class="review_empty">등록된 리뷰가 없습니다.</div>`;
    return;
  }

  reviewListEl.innerHTML = reviews
    .map(
      (review) => `
        <div class="review_item">
          <div class="review_item_top">
            <div class="review_user_meta">
              <span class="review_user_type">${review.type}</span>
              <span class="review_user_id">${review.user}</span>
              <span class="review_date">${review.date}</span>
            </div>
            <div class="review_score">${getScoreText(review.score)}</div>
          </div>
          <div class="review_keyword_badge">${review.keyword}</div>
          <p class="review_content">${review.content}</p>
        </div>
      `
    )
    .join("");
}

function loadReviewsFromJs() {
  const currentBookReview = window.COMMON_REVIEW_DATA || {};

  renderReviewSummary(currentBookReview.summary || {});
  renderReviewKeywords(currentBookReview.keywords || []);
  renderReviewList(currentBookReview.reviews || []);
}

document.addEventListener("DOMContentLoaded", function () {
  loadReviewsFromJs();
});

function initDetailTabScroll() {
  const tabs = document.querySelectorAll(".detail_tab");

  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetSelector = tab.dataset.target;
      const target = document.querySelector(targetSelector);

      if (!target) return;

      tabs.forEach((btn) => btn.classList.remove("active"));
      tab.classList.add("active");

      const targetTop = target.getBoundingClientRect().top + window.pageYOffset - 100;

      window.scrollTo({
        top: targetTop,
        behavior: "smooth"
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initDetailTabScroll();
});
