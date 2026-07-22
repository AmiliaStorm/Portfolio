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

    navigationToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
  });

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");

      navigationToggle.setAttribute(
        "aria-expanded",
        "false"
      );
    });
  });
}

/* ==================================================
   Active navigation links
   ================================================== */

const pageSections =
  document.querySelectorAll("main section[id]");

if ("IntersectionObserver" in window) {
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
}

/* ==================================================
   Cell cursor
   ================================================== */

const cellCursor =
  document.querySelector(".cell-cursor");

const cellNucleus =
  document.querySelector(".cell-cursor__nucleus");

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

    const nucleusX = Math.max(
      -5,
      Math.min(5, differenceX * 0.06)
    );

    const nucleusY = Math.max(
      -5,
      Math.min(5, differenceY * 0.06)
    );

    cellNucleus.style.transform =
      `translate(${nucleusX}px, ${nucleusY}px)`;
  }

  requestAnimationFrame(animateCellCursor);
}

if (cellCursor) {
  animateCellCursor();
}

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

/* ==================================================
   Translation animation
   ================================================== */

const codons = [
  {
    sequence: "AUG",
    aminoAcid: "Methionine",
    code: "Met",
  },
  {
    sequence: "GCU",
    aminoAcid: "Alanine",
    code: "Ala",
  },
  {
    sequence: "UUU",
    aminoAcid: "Phenylalanine",
    code: "Phe",
  },
  {
    sequence: "AAC",
    aminoAcid: "Asparagine",
    code: "Asn",
  },
  {
    sequence: "CCA",
    aminoAcid: "Proline",
    code: "Pro",
  },
  {
    sequence: "GAU",
    aminoAcid: "Aspartic acid",
    code: "Asp",
  },
];

const translationCodon =
  document.querySelector(".translation-codon");

const translationBases =
  document.querySelectorAll(
    ".translation-codon .base"
  );

const translationArrow =
  document.querySelector(".translation-down-arrow");

const translationResult =
  document.querySelector(".translation-result");

const translationName =
  document.querySelector(
    ".translation-result .amino-name"
  );

const translationCode =
  document.querySelector(
    ".translation-result .amino-code"
  );

const translationHistory =
  document.querySelector(".translation-history");

let codonIndex = 0;

function setBase(element, base) {
  if (!element) {
    return;
  }

  element.textContent = base;
  element.className =
    `base base--${base.toLowerCase()}`;
}

function addHistoryItem(codon) {
  if (!translationHistory) {
    return;
  }

  const item = document.createElement("div");

  item.className = "translation-history-item";

  const title = document.createElement("strong");
  const code = document.createElement("span");

  title.textContent =
    `${codon.sequence} → ${codon.aminoAcid}`;

  code.textContent = codon.code;

  item.append(title, code);
  translationHistory.prepend(item);

  while (translationHistory.children.length > 3) {
    translationHistory.lastElementChild?.remove();
  }
}

function runTranslation() {
  const currentCodon = codons[codonIndex];

  translationCodon.classList.remove(
    "is-joining",
    "is-complete"
  );

  translationArrow.classList.remove("is-visible");
  translationResult.classList.remove("is-visible");

  currentCodon.sequence
    .split("")
    .forEach((base, index) => {
      setBase(translationBases[index], base);
    });

  translationName.textContent =
    currentCodon.aminoAcid;

  translationCode.textContent =
    currentCodon.code;

  window.setTimeout(() => {
    translationCodon.classList.add("is-joining");
  }, 500);

  window.setTimeout(() => {
    translationCodon.classList.add("is-complete");
    translationArrow.classList.add("is-visible");
  }, 1100);

  window.setTimeout(() => {
    translationResult.classList.add("is-visible");
  }, 1500);

  window.setTimeout(() => {
    addHistoryItem(currentCodon);
  }, 2300);

  window.setTimeout(() => {
    codonIndex =
      (codonIndex + 1) % codons.length;

    runTranslation();
  }, 3400);
}

const translationElementsExist =
  translationCodon &&
  translationBases.length === 3 &&
  translationArrow &&
  translationResult &&
  translationName &&
  translationCode &&
  translationHistory;

if (translationElementsExist) {
  runTranslation();
} else {
  console.error(
    "Translation animation could not find the required HTML elements."
  );
}

console.log("index.js is running");
