const KAKAO_REST_API_KEY = "801fbc3a08ceb5e92a5011b08f71352b";
const KAKAO_BOOK_API_URL = "https://dapi.kakao.com/v3/search/book";
const NO_IMAGE_PATH = "./img/common/no-image.png";
const BOOK_SCROLL_AMOUNT = 360;

const EDITOR_PICK_TITLES = [
  "아쿠아리움이 문을 닫으면",
  "베러티",
  "메이블 이야기",
  "우리의 열 번째 여름",
  "순수 박물관",
  "맨 끝줄 소년",
];

const PUBLISHER_PICK_TITLES = [
  "이토록 찬란한 육아",
  "나는 주저앉고 싶을 때마다 문장을 따라 걸었다",
  "참과 영혼",
  "나의 완벽한 장례식",
  "더블 클릭",
  "어린 임금의 눈물",
];

const HOT_PICK_TITLES = [
  "내 이름은 빨강 1",
  "박태웅의 AI 강의 2026",
  "킬리만자로의 눈",
  "미국은 왜 전쟁을 멈추지 못하는가",
  "살면서 한번은 벽돌책",
  "소유하기, 소유되기",
];

const KYOBO_MADE_TITLES = [
  "우리가 사랑한 도시",
  "벌거벗은 세계사: 라이벌편",
  "근접한 세계",
  "미식가의 메뉴판",
  "위험한 그림들",
  "신경 쓰이는 사람",
];

/* =========================
   include 로드
========================= */
function loadSection(targetId, filePath) {
  const target = document.getElementById(targetId);
  if (!target) return Promise.resolve();

  return fetch(filePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`${filePath} 파일을 불러오지 못했습니다.`);
      }
      return response.text();
    })
    .then((html) => {
      target.innerHTML = html;
    })
    .catch((error) => {
      console.error(error);
    });
}

/* =========================
   공통 유틸
========================= */
function getHighResImageUrl(thumbnailUrl) {
  if (!thumbnailUrl) return "";

  try {
    const urlObj = new URL(thumbnailUrl);
    if (urlObj.searchParams.has("fname")) {
      return urlObj.searchParams.get("fname");
    }
  } catch (error) {
    console.error("URL 파싱 에러:", error);
  }

  return thumbnailUrl.replace("R120x174", "R500x500");
}

function normalizeText(text = "") {
  return text
    .replace(/\s+/g, "")
    .replace(/[^\w가-힣]/g, "")
    .toLowerCase()
    .trim();
}

function stripHtml(text = "") {
  return text.replace(/<[^>]*>/g, "").trim();
}

function getBookIsbn(isbnString = "") {
  return isbnString.split(" ").filter(Boolean).pop() || "";
}

function createFallbackBook(title) {
  return {
    title,
    image: NO_IMAGE_PATH,
    isbn: "",
  };
}

/* =========================
   초기 실행
========================= */
async function initMainBooks() {
  try {
    const [editorBooks, publisherBooks, hotBooks, kyoboBooks] =
      await Promise.all([
        fetchBooksByTitleList(EDITOR_PICK_TITLES),
        fetchBooksByTitleList(PUBLISHER_PICK_TITLES),
        fetchBooksByTitleList(HOT_PICK_TITLES),
        fetchBooksByTitleList(KYOBO_MADE_TITLES),
      ]);

    renderMainBookShelf("editorPickBooks", editorBooks);
    renderMainBookShelf("publisherPickBooks", publisherBooks);
    renderMainBookShelf("hotPickBooks", hotBooks);
    renderMainBookShelf("kyoboMadeBooks", kyoboBooks);

    bindMainBookSliders();
  } catch (error) {
    console.error("main_books 초기화 오류:", error);
  }
}

/* =========================
   카카오 API 통신
========================= */
async function fetchBooksByTitleList(titleList) {
  const results = await Promise.all(
    titleList.map((title) => fetchSingleBookByTitle(title))
  );

  return results.filter(Boolean);
}

async function fetchSingleBookByTitle(title) {
  const url = `${KAKAO_BOOK_API_URL}?target=title&query=${encodeURIComponent(title)}&size=10`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`카카오 책 검색 실패: ${title}`);
    }

    const data = await response.json();
    const docs = data.documents || [];

    if (!docs.length) {
      return createFallbackBook(title);
    }

    const bestMatch = findBestMatchingBook(docs, title);

    return {
      title: stripHtml(bestMatch.title || title),
      image: getHighResImageUrl(bestMatch.thumbnail) || NO_IMAGE_PATH,
      isbn: getBookIsbn(bestMatch.isbn),
    };
  } catch (error) {
    console.error(`도서 조회 오류: ${title}`, error);
    return createFallbackBook(title);
  }
}

function findBestMatchingBook(docs, targetTitle) {
  const normalizedTarget = normalizeText(targetTitle);

  const exactMatch = docs.find((book) => {
    return normalizeText(stripHtml(book.title || "")) === normalizedTarget;
  });

  if (exactMatch) return exactMatch;

  const includesMatch = docs.find((book) => {
    return normalizeText(stripHtml(book.title || "")).includes(normalizedTarget);
  });

  return includesMatch || docs[0];
}

/* =========================
   렌더링
========================= */
function renderMainBookShelf(targetId, items = []) {
  const target = document.getElementById(targetId);
  if (!target) return;

  if (!items.length) {
    target.innerHTML = `<li class="main_book_empty">도서 데이터가 없습니다.</li>`;
    return;
  }

  target.innerHTML = items.map(createMainBookItem).join("");
}

function createMainBookItem(item) {
  const detailLink = item.isbn ? `./sub.html?isbn=${item.isbn}` : "#";

  return `
    <li class="main_book_item">
      <a href="${detailLink}" class="main_book_link">
        <div class="main_book_thumb">
          <img src="${item.image}" alt="${item.title}" onerror="this.src='${NO_IMAGE_PATH}'">
        </div>
        <p class="main_book_title">${item.title}</p>
      </a>
    </li>
  `;
}

/* =========================
   슬라이더
========================= */
function bindMainBookSliders() {
  const sliders = document.querySelectorAll(".main_books_slider");

  sliders.forEach((slider) => {
    if (slider.dataset.bound === "true") return;

    const view = slider.querySelector(".main_books_view");
    const prevBtn = slider.querySelector(".main_books_arrow.prev");
    const nextBtn = slider.querySelector(".main_books_arrow.next");

    if (!view || !prevBtn || !nextBtn) return;

    prevBtn.addEventListener("click", () => {
      view.scrollBy({
        left: -BOOK_SCROLL_AMOUNT,
        behavior: "smooth",
      });
    });

    nextBtn.addEventListener("click", () => {
      view.scrollBy({
        left: BOOK_SCROLL_AMOUNT,
        behavior: "smooth",
      });
    });

    slider.dataset.bound = "true";
  });
}

document.addEventListener("DOMContentLoaded", initMainBooks);