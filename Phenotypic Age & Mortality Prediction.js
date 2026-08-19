/* =========================================================
   Biological Age Predictor
   Standalone project-page interactions
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     Current year
  ======================================================= */

  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }


  /* =======================================================
     Smooth scrolling for internal links
  ======================================================= */

  const internalLinks =
    document.querySelectorAll('a[href^="#"]');


  internalLinks.forEach((link) => {

    link.addEventListener("click", (event) => {

      const selector =
        link.getAttribute("href");


      if (!selector || selector === "#") {
        return;
      }


      const target =
        document.querySelector(selector);


      if (!target) {
        return;
      }


      event.preventDefault();


      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    });

  });


  /* =======================================================
     Animate AUC result bars
  ======================================================= */

  const resultsSection =
    document.querySelector("#results");

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

    animateAucBars();

  }


  /* =======================================================
     Reveal sections while scrolling
  ======================================================= */

  const revealTargets =
    document.querySelectorAll(
      ".section, .profile-grid"
    );


  revealTargets.forEach((element) => {

    element.classList.add(
      "reveal"
    );

  });


  if (
    "IntersectionObserver" in window
  ) {

    const revealObserver =
      new IntersectionObserver(

        (entries, observer) => {

          entries.forEach((entry) => {

            if (entry.isIntersecting) {

              entry.target.classList.add(
                "visible"
              );

              observer.unobserve(
                entry.target
              );

            }

          });

        },

        {
          threshold: 0.08
        }

      );


    revealTargets.forEach((element) => {

      revealObserver.observe(
        element
      );

    });

  } else {

    revealTargets.forEach((element) => {

      element.classList.add(
        "visible"
      );

    });

  }


  /* =======================================================
     Active navigation state
  ======================================================= */

  const navLinks =
    document.querySelectorAll(
      '.topbar nav a[href^="#"]'
    );


  const navSections =
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
    navSections.length &&
    "IntersectionObserver" in window
  ) {

    const navObserver =
      new IntersectionObserver(

        (entries) => {

          const visible =
            entries
              .filter(
                (entry) =>
                  entry.isIntersecting
              )
              .sort(
                (a, b) =>
                  b.intersectionRatio -
                  a.intersectionRatio
              );


          if (!visible.length) {
            return;
          }


          const activeId =
            `#${visible[0].target.id}`;


          navLinks.forEach((link) => {

            link.classList.toggle(
              "active",
              link.getAttribute("href") ===
                activeId
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


    navSections.forEach((section) => {

      navObserver.observe(
        section
      );

    });

  }

});
