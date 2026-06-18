async function loadIncludes() {
  await Promise.all([
    loadHTML("#header-include", "./fragments/header.html"),
    loadHTML("#main-visual-include", "./fragments/main_visual.html"),
    loadHTML("#main-books-include", "./fragments/main_books.html"),
    loadHTML("#footer-include", "./fragments/footer.html")
  ]);

  if (typeof initHeader === "function") initHeader();
  if (typeof initMainVisual === "function") initMainVisual();
  if (typeof initMainBooks === "function") initMainBooks();
  if (typeof initFooter === "function") initFooter();
}