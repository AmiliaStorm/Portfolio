/* =========================================================
   Biological Age Predictor
   Interactive project page functionality
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     Code tabs
  ======================================================= */

  const tabButtons =
    document.querySelectorAll(".code-tab");

  const codeSnippets =
    document.querySelectorAll(".code-snippet");


  tabButtons.forEach((button) => {

    button.addEventListener("click", () => {

      const targetId =
        button.dataset.tab;


      // Remove active state from all tabs

      tabButtons.forEach((tab) => {
        tab.classList.remove("active");
      });


      // Hide all code blocks

      codeSnippets.forEach((snippet) => {
        snippet.classList.remove("active");
      });


      // Activate selected tab

      button.classList.add("active");


      const targetSnippet =
        document.getElementById(targetId);


      if (targetSnippet) {
        targetSnippet.classList.add("active");
      }

    });

  });


  /* =======================================================
     Animate AUC bars when results enter viewport
  ======================================================= */

  const aucBars =
    document.querySelectorAll(".auc-fill");


  const animateAucBars = () => {

    aucBars.forEach((bar) => {

      const targetWidth =
        bar.dataset.width;

      if (targetWidth) {
        bar.style.width =
          `${targetWidth}%`;
      }

    });

  };


  const resultsSection =
    document.querySelector("#results");


  if (
    resultsSection &&
    "IntersectionObserver" in window
  ) {

    const resultsObserver =
      new IntersectionObserver(

        (entries, observer) => {

          entries.forEach((entry) => {

            if (entry.isIntersecting) {

              animateAucBars();

              observer.unobserve(
                entry.target
              );

            }

          });

        },

        {
          threshold: 0.25
        }

      );


    resultsObserver.observe(
      resultsSection
    );

  } else {

    // Fallback for older browsers

    animateAucBars();

  }


  /* =======================================================
     Smooth internal navigation
  ======================================================= */

  const internalLinks =
    document.querySelectorAll(
      'a[href^="#"]'
    );


  internalLinks.forEach((link) => {

    link.addEventListener(
      "click",
      (event) => {

        const targetId =
          link.getAttribute("href");


        if (
          !targetId ||
          targetId === "#"
        ) {
          return;
        }


        const target =
          document.querySelector(
            targetId
          );


        if (!target) {
          return;
        }


        event.preventDefault();


        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }
    );

  });


  /* =======================================================
     Highlight navigation section
  ======================================================= */

  const navLinks =
    document.querySelectorAll(
      ".topbar nav a[href^='#']"
    );


  const observedSections =
    [...navLinks]
      .map((link) => {

        const selector =
          link.getAttribute("href");

        return document.querySelector(
          selector
        );

      })
      .filter(Boolean);


  if (
    observedSections.length > 0 &&
    "IntersectionObserver" in window
  ) {

    const navigationObserver =
      new IntersectionObserver(

        (entries) => {

          const visibleEntries =
            entries.filter(
              (entry) =>
                entry.isIntersecting
            );


          if (
            visibleEntries.length === 0
          ) {
            return;
          }


          const mostVisible =
            visibleEntries.sort(
              (a, b) =>
                b.intersectionRatio -
                a.intersectionRatio
            )[0];


          const activeId =
            `#${mostVisible.target.id}`;


          navLinks.forEach((link) => {

            const linkTarget =
              link.getAttribute("href");


            link.classList.toggle(
              "active",
              linkTarget === activeId
            );

          });

        },

        {
          rootMargin:
            "-30% 0px -55% 0px",

          threshold: [
            0,
            0.2,
            0.5,
            0.8
          ]
        }

      );


    observedSections.forEach(
      (section) => {

        navigationObserver.observe(
          section
        );

      }
    );

  }


  /* =======================================================
     Current year
  ======================================================= */

  const yearElement =
    document.getElementById("year");


  if (yearElement) {

    yearElement.textContent =
      new Date().getFullYear();

  }

});
