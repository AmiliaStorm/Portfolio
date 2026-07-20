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

pageSections.forEach((section) => {
  observer.observe(section);
});
window.onload = () => {

const cellCursor = document.querySelector(".cell-cursor");
const cellNucleus = document.querySelector(".cell-cursor__nucleus");

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

let cellX = mouseX;
let cellY = mouseY;

window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;

    cellCursor?.classList.add("visible");
});

document.addEventListener("mouseleave", () => {
    cellCursor?.classList.remove("visible");
});

function animateCellCursor() {
    const followSpeed = 0.13;

    cellX += (mouseX - cellX) * followSpeed;
    cellY += (mouseY - cellY) * followSpeed;

    if (cellCursor) {
        cellCursor.style.left = `${cellX}px`;
        cellCursor.style.top = `${cellY}px`;
    }

    if (cellNucleus) {
        const differenceX = mouseX - cellX;
        const differenceY = mouseY - cellY;

        const nucleusX = Math.max(-5, Math.min(5, differenceX * 0.06));
        const nucleusY = Math.max(-5, Math.min(5, differenceY * 0.06));

        cellNucleus.style.transform =
            `translate(${nucleusX}px, ${nucleusY}px)`;
    }

    requestAnimationFrame(animateCellCursor);
}

animateCellCursor();

const interactiveElements = document.querySelectorAll(
    "a, button, .project-card"
);

interactiveElements.forEach((element) => {
    element.addEventListener("mouseenter", () => {
        cellCursor?.classList.add("hovering");
    });

    element.addEventListener("mouseleave", () => {
        cellCursor?.classList.remove("hovering");
    });
});

  };
