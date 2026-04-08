async function loadHTML(selector, filePath) {
  const target = document.querySelector(selector);
  if (!target) return;

  try {
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`불러오기 실패: ${filePath}`);
    }

    const html = await response.text();
    target.innerHTML = html;
  } catch (error) {
    console.error(error);
    target.innerHTML = `<p style="padding:20px;">콘텐츠를 불러오지 못했습니다.</p>`;
  }
}

async function loadIncludes() {
  await Promise.all([
    loadHTML("#header-include", "./fragments/header.html"),
    loadHTML("#main-visual-include", "./fragments/main_visual.html"),
    loadHTML("#main-books-include", "./fragments/main_books.html"),
    loadHTML("#main-books02-include", "./fragments/main_books02.html"),
    loadHTML("#main-best-include", "./fragments/main_best.html"),
    loadHTML("#mdpick-include", "./fragments/mdpick.html"),
    loadHTML("#event-include", "./fragments/event.html"),
    loadHTML("#footer-include", "./fragments/footer.html"),
  ]);

  if (typeof initHeader === "function") initHeader();
  if (typeof initMainVisual === "function") initMainVisual();
  if (typeof initMainBooks === "function") initMainBooks();
  if (typeof initMainBest === "function") initMainBest();
  if (typeof initMdPick === "function") initMdPick();
  if (typeof initEventSection === "function") initEventSection();
  if (typeof initFooter === "function") initFooter();
  if (typeof initMainBooks02 === "function") initMainBooks02();
}

document.addEventListener("DOMContentLoaded", loadIncludes);