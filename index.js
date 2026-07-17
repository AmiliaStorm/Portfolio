const navigationToggle = document.querySelector(".nav-toggle");
const navigation = document.querySelector(".nav");
const navigationLinks = document.querySelectorAll(".nav__link");
const currentYear = document.querySelector("#current-year");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

if (navigationToggle && navigation) {
  navigationToggle.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("open");

    navigationToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
      navigationToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const pageSections = document.querySelectorAll("main section[id]");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      navigationLinks.forEach((link) => {
        link.classList.remove("active");

        const target = link.getAttribute("href");

        if (target === `#${entry.target.id}`) {
          link.classList.add("active");
        }
      });
    });
  },
  {
    rootMargin: "-35% 0px -55% 0px",
  }
);

pageSections.forEach((section) => observer.observe(section));
