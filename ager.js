const tabs = document.querySelectorAll(".tab");
const snippets = document.querySelectorAll(".snippet");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => {
      item.classList.remove("active");
    });

    snippets.forEach((snippet) => {
      snippet.classList.remove("active");
    });

    tab.classList.add("active");

    const selectedSnippet = document.getElementById(
      tab.dataset.tab
    );

    if (selectedSnippet) {
      selectedSnippet.classList.add("active");
    }
  });
});

