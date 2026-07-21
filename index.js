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
const codons = [
  {
    sequence: "AUG",
    aminoAcid: "Methionine",
    code: "Met"
  },
  {
    sequence: "GCU",
    aminoAcid: "Alanine",
    code: "Ala"
  },
  {
    sequence: "UUU",
    aminoAcid: "Phenylalanine",
    code: "Phe"
  },
  {
    sequence: "AAC",
    aminoAcid: "Asparagine",
    code: "Asn"
  },
  {
    sequence: "CCA",
    aminoAcid: "Proline",
    code: "Pro"
  },
  {
    sequence: "GAU",
    aminoAcid: "Aspartic acid",
    code: "Asp"
  }
];

const codonBases = document.querySelector(".codon-bases");
const baseElements = document.querySelectorAll(".codon-bases .base");
const codonArrow = document.querySelector(".codon-arrow");
const aminoCard = document.querySelector(".amino-card");
const aminoName = document.querySelector(".amino-name");
const aminoCode = document.querySelector(".amino-code");

let codonIndex = 0;

function setBaseStyle(element, base) {
  element.className = `base base--${base.toLowerCase()}`;
  element.textContent = base;
}

function showCodon() {
  const currentCodon = codons[codonIndex];

  codonBases.classList.remove("is-joining", "is-complete");
  codonArrow.classList.remove("is-visible");
  aminoCard.classList.remove("is-visible");

  currentCodon.sequence.split("").forEach((base, index) => {
    setBaseStyle(baseElements[index], base);
  });

  aminoName.textContent = currentCodon.aminoAcid;
  aminoCode.textContent = currentCodon.code;

  setTimeout(() => {
    codonBases.classList.add("is-joining");
  }, 500);

  setTimeout(() => {
    codonBases.classList.add("is-complete");
    codonArrow.classList.add("is-visible");
  }, 1200);

  setTimeout(() => {
    aminoCard.classList.add("is-visible");
  }, 1600);

  setTimeout(() => {
    codonIndex = (codonIndex + 1) % codons.length;
    showCodon();
  }, 3600);
}

if (
  codonBases &&
  baseElements.length === 3 &&
  codonArrow &&
  aminoCard
) {
  showCodon();
}
const codons = [
  {
    sequence: "AUG",
    aminoAcid: "Methionine",
    code: "Met"
  },
  {
    sequence: "GCU",
    aminoAcid: "Alanine",
    code: "Ala"
  },
  {
    sequence: "UUU",
    aminoAcid: "Phenylalanine",
    code: "Phe"
  },
  {
    sequence: "AAC",
    aminoAcid: "Asparagine",
    code: "Asn"
  },
  {
    sequence: "CCA",
    aminoAcid: "Proline",
    code: "Pro"
  },
  {
    sequence: "GAU",
    aminoAcid: "Aspartic acid",
    code: "Asp"
  }
];

const translationCodon =
  document.querySelector(".translation-codon");

const translationBases =
  document.querySelectorAll(".translation-codon .base");

const translationArrow =
  document.querySelector(".translation-down-arrow");

const translationResult =
  document.querySelector(".translation-result");

const translationName =
  document.querySelector(".translation-result .amino-name");

const translationCode =
  document.querySelector(".translation-result .amino-code");

const translationHistory =
  document.querySelector(".translation-history");

let codonIndex = 0;

function setBase(element, base) {
  element.textContent = base;
  element.className = `base base--${base.toLowerCase()}`;
}

function addHistoryItem(codon) {
  const item = document.createElement("div");

  item.className = "translation-history-item";

  item.innerHTML = `
    <strong>${codon.sequence} → ${codon.aminoAcid}</strong>
    <span>${codon.code}</span>
  `;

  translationHistory.prepend(item);

  while (translationHistory.children.length > 3) {
    translationHistory.lastElementChild.remove();
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

  setTimeout(() => {
    translationCodon.classList.add("is-joining");
  }, 500);

  setTimeout(() => {
    translationCodon.classList.add("is-complete");
    translationArrow.classList.add("is-visible");
  }, 1100);

  setTimeout(() => {
    translationResult.classList.add("is-visible");
  }, 1500);

  setTimeout(() => {
    addHistoryItem(currentCodon);
  }, 2300);

  setTimeout(() => {
    codonIndex = (codonIndex + 1) % codons.length;
    runTranslation();
  }, 3400);
}
console.log({
  translationCodon,
  translationBasesCount: translationBases.length,
  translationArrow,
  translationResult,
  translationName,
  translationCode,
  translationHistory
});
if (
  translationCodon &&
  translationBases.length === 3 &&
  translationArrow &&
  translationResult &&
  translationName &&
  translationCode &&
  translationHistory
) {
  runTranslation();
} else {
  console.error(
    "Translation animation could not find the required HTML elements."
  );
}
console.log("index.js is running");
