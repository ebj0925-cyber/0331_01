(() => {
  const BEST_KAKAO_REST_API_KEY = "801fbc3a08ceb5e92a5011b08f71352b";
  const BEST_KAKAO_BOOK_API_URL = "https://dapi.kakao.com/v3/search/book";
  const BEST_NO_IMAGE_PATH = "./img/common/no-image.png";

  const BEST_BOOKS = [
    {
      rank: 1,
      title: "완벽한 원시인",
      badge: "교보문고 Best 1",
      changeText: "-",
      changeType: "same",
    },
    {
      rank: 2,
      title: "괴테는 모든 것을 말했다",
      badge: "",
      changeText: "-",
      changeType: "same",
    },
    {
      rank: 3,
      title: "프로젝트 헤일메리",
      badge: "",
      changeText: "-",
      changeType: "same",
    },
    {
      rank: 4,
      title: "무례한 세상에서 나를 지키는 법",
      badge: "",
      changeText: "4",
      changeType: "up",
    },
    {
      rank: 5,
      title: "박태웅의 AI 강의 2026",
      badge: "",
      changeText: "52 급상승",
      changeType: "up",
    },
    {
      rank: 6,
      title: "인생을 위한 최소한의 생각",
      badge: "",
      changeText: "1",
      changeType: "up",
    },
    {
      rank: 7,
      title: "해커스 토익 기출 VOCA",
      badge: "",
      changeText: "3",
      changeType: "down",
    },
    {
      rank: 8,
      title: "MIND 프로그램",
      badge: "",
      changeText: "NEW",
      changeType: "new",
    },
    {
      rank: 9,
      title: "부처님 말씀대로 살아보니",
      badge: "",
      changeText: "2",
      changeType: "up",
    },
    {
      rank: 10,
      title: "나의 완벽한 장례식",
      badge: "",
      changeText: "4",
      changeType: "down",
    },
  ];

  /* =========================
     include 로드
  ========================= */
  function loadBestSection(targetId, filePath) {
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
  function getBestHighResImageUrl(thumbnailUrl) {
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

  function normalizeBestText(text = "") {
    return text
      .replace(/\s+/g, "")
      .replace(/[^\w가-힣]/g, "")
      .toLowerCase()
      .trim();
  }

  function stripBestHtml(text = "") {
    return text.replace(/<[^>]*>/g, "").trim();
  }

  function createBestFallbackBook(item) {
    return {
      ...item,
      title: item.title,
      image: BEST_NO_IMAGE_PATH,
      link: "#",
    };
  }

  function getBestChangeClass(changeType) {
    if (changeType === "up") return "is_up";
    if (changeType === "down") return "is_down";
    if (changeType === "new") return "is_new";
    return "is_same";
  }

  function getBestChangePrefix(changeType) {
    if (changeType === "up") return "▲ ";
    if (changeType === "down") return "▼ ";
    return "";
  }

  /* =========================
     초기 실행
  ========================= */
  async function initMainBest() {
    try {
      const bestBooks = await fetchBestBooks(BEST_BOOKS);
      renderBestBooks("bestBookList", bestBooks);
    } catch (error) {
      console.error("main_best 초기화 오류:", error);
    }
  }

  /* =========================
     카카오 API 통신
  ========================= */
  async function fetchBestBooks(bookList) {
    const results = await Promise.all(
      bookList.map((item) => fetchSingleBestBook(item)),
    );

    return results.filter(Boolean);
  }

  async function fetchSingleBestBook(item) {
    const url = `${BEST_KAKAO_BOOK_API_URL}?target=title&query=${encodeURIComponent(item.title)}&size=10`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `KakaoAK ${BEST_KAKAO_REST_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`카카오 책 검색 실패: ${item.title}`);
      }

      const data = await response.json();
      const docs = data.documents || [];

      if (!docs.length) {
        return createBestFallbackBook(item);
      }

      const bestMatch = findBestMatchingBook(docs, item.title);

      return {
        ...item,
        title: stripBestHtml(bestMatch.title || item.title),
        image:
          getBestHighResImageUrl(bestMatch.thumbnail) || BEST_NO_IMAGE_PATH,
        link: bestMatch.url || "#",
      };
    } catch (error) {
      console.error(`도서 조회 오류: ${item.title}`, error);
      return createBestFallbackBook(item);
    }
  }

  function findBestMatchingBook(docs, targetTitle) {
    const normalizedTarget = normalizeBestText(targetTitle);

    const exactMatch = docs.find((book) => {
      return (
        normalizeBestText(stripBestHtml(book.title || "")) === normalizedTarget
      );
    });

    if (exactMatch) return exactMatch;

    const includesMatch = docs.find((book) => {
      return normalizeBestText(stripBestHtml(book.title || "")).includes(
        normalizedTarget,
      );
    });

    return includesMatch || docs[0];
  }

  /* =========================
     렌더링
  ========================= */
  function renderBestBooks(targetId, items = []) {
    const target = document.getElementById(targetId);
    if (!target) return;

    if (!items.length) {
      target.innerHTML = `<li class="main_best_empty">도서 데이터가 없습니다.</li>`;
      return;
    }

    target.innerHTML = items.map(createBestBookItem).join("");
  }

  function createBestBookItem(item) {
    const changeClass = getBestChangeClass(item.changeType);
    const changePrefix = getBestChangePrefix(item.changeType);

    return `
      <li class="main_best_item">
        <a href="${item.link}" class="main_best_link" target="_blank" rel="noopener noreferrer">
          <div class="main_best_thumb">
            <img src="${item.image}" alt="${item.title}" onerror="this.src='${BEST_NO_IMAGE_PATH}'">
            ${item.badge ? `<span class="main_best_badge">${item.badge}</span>` : ""}
          </div>

          <div class="main_best_info">
            <div class="main_best_meta">
              <span class="main_best_rank">${item.rank}</span>
              <span class="main_best_change ${changeClass}">${changePrefix}${item.changeText}</span>
            </div>
            <p class="main_best_book_title">${item.title}</p>
          </div>
        </a>
      </li>
    `;
  }

  document.addEventListener("DOMContentLoaded", initMainBest);
})();
