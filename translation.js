document.addEventListener("DOMContentLoaded", () => {
  const codons = [
    { sequence: "AUG", aminoAcid: "Methionine", code: "Met" },
    { sequence: "GCU", aminoAcid: "Alanine", code: "Ala" },
    { sequence: "UUU", aminoAcid: "Phenylalanine", code: "Phe" },
    { sequence: "AAC", aminoAcid: "Asparagine", code: "Asn" },
    { sequence: "CCA", aminoAcid: "Proline", code: "Pro" },
    { sequence: "GAU", aminoAcid: "Aspartic acid", code: "Asp" }
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

  if (
    !translationCodon ||
    translationBases.length !== 3 ||
    !translationArrow ||
    !translationResult ||
    !translationName ||
    !translationCode ||
    !translationHistory
  ) {
    console.error("Translation HTML elements were not found.");
    return;
  }

  let codonIndex = 0;

  function updateBase(element, base) {
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
        updateBase(translationBases[index], base);
      });

    translationName.textContent = currentCodon.aminoAcid;
    translationCode.textContent = currentCodon.code;

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

  console.log("Translation animation started.");
  runTranslation();
});
