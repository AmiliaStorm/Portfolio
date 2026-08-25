const sage = document.getElementById("sage");
const sageBody = document.getElementById("sageBody");
const sageBubble = document.getElementById("sageBubble");
const sagePanel = document.getElementById("sagePanel");
const sageClose = document.getElementById("sageClose");
const sageMessages = document.getElementById("sageMessages");
const sageForm = document.getElementById("sageForm");
const sageInput = document.getElementById("sageInput");
const actionButtons = document.querySelectorAll("[data-sage-action]");

const state = {
  panelOpen: false,
  activeSection: "hero",
  currentX: window.innerWidth - 180,
  currentY: 180,
  targetX: window.innerWidth - 180,
  targetY: 180,
  lastMoveAt: 0,
  currentTargetElement: null,
  bubbleTimeout: null
};

const localKnowledge = {
  projects:
    "Amilia’s strongest highlighted projects include COVID-19 single-cell transcriptomics, the Biological Age Predictor, and the Cell Function Explorer.",
  skills:
    "Amilia’s portfolio combines bioinformatics, data analysis, machine learning, software development, and scientific visualization.",
  about:
    "Amilia is a bioinformatics student focused on computational biology, scientific software, and turning biological complexity into understandable tools and insights.",
  cv:
    "A full resume/CV link can be added here next — for now I can guide visitors to the About section and projects."
};

function addMessage(role, text) {
  const message = document.createElement("div");
  message.className =
    role === "user"
      ? "sage__message sage__message--user"
      : "sage__message sage__message--sage";

  message.textContent = text;
  sageMessages.appendChild(message);
  sageMessages.scrollTop = sageMessages.scrollHeight;
}

function showBubble(text, duration = 2600) {
  sageBubble.textContent = text;
  sageBubble.classList.add("is-visible");

  clearTimeout(state.bubbleTimeout);
  state.bubbleTimeout = setTimeout(() => {
    if (!state.panelOpen) {
      sageBubble.classList.remove("is-visible");
    }
  }, duration);
}

function openPanel() {
  state.panelOpen = true;
  sagePanel.classList.add("is-open");
  sagePanel.setAttribute("aria-hidden", "false");
  sage.classList.add("sage--active");
  sageBubble.classList.remove("is-visible");
  sageInput.focus();
}

function closePanel() {
  state.panelOpen = false;
  sagePanel.classList.remove("is-open");
  sagePanel.setAttribute("aria-hidden", "true");
  sage.classList.remove("sage--active");
}

function togglePanel() {
  if (state.panelOpen) {
    closePanel();
  } else {
    openPanel();
  }
}

function clearHighlight() {
  if (state.currentTargetElement) {
    state.currentTargetElement.classList.remove("sage-highlight");
    state.currentTargetElement = null;
  }
}

function highlightElement(element) {
  clearHighlight();

  if (!element) return;

  state.currentTargetElement = element;
  element.classList.add("sage-highlight");

  setTimeout(() => {
    clearHighlight();
  }, 2400);
}

function goToSection(id) {
  const section = document.getElementById(id);
  if (!section) return;

  section.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  highlightElement(section);
}

function handleAction(action) {
  switch (action) {
    case "projects":
      addMessage("sage", localKnowledge.projects);
      goToSection("projects");
      showBubble("Let me show you the projects ✦", 2200);
      break;

    case "skills":
      addMessage("sage", localKnowledge.skills);
      goToSection("skills");
      showBubble("Here are the key skills.", 2200);
      break;

    case "about":
      addMessage("sage", localKnowledge.about);
      goToSection("about");
      showBubble("This section gives more context.", 2200);
      break;

    case "cv":
      addMessage("sage", localKnowledge.cv);
      showBubble("We can add a full CV link next.", 2200);
      break;

    default:
      addMessage("sage", "I’m still learning how to help with that.");
  }
}

function getResponseForInput(input) {
  const q = input.toLowerCase();

  if (q.includes("project")) {
    return {
      reply: localKnowledge.projects,
      action: "projects"
    };
  }

  if (q.includes("skill") || q.includes("tools") || q.includes("technology")) {
    return {
      reply: localKnowledge.skills,
      action: "skills"
    };
  }

  if (q.includes("about") || q.includes("who is") || q.includes("amilia")) {
    return {
      reply: localKnowledge.about,
      action: "about"
    };
  }

  if (q.includes("cv") || q.includes("resume")) {
    return {
      reply: localKnowledge.cv,
      action: "cv"
    };
  }

  if (q.includes("cell")) {
    return {
      reply:
        "The Cell Function Explorer is one of the most visually distinctive projects — it focuses on interactive biological visualization and is still evolving.",
      action: "projects"
    };
  }

  if (q.includes("data") || q.includes("machine learning")) {
    return {
      reply:
        "A strong example is the Biological Age Predictor, which combines biomarker data, mortality modelling and machine learning.",
      action: "projects"
    };
  }

  return {
    reply:
      "I can currently help with projects, skills, and basic portfolio navigation. Next I’ll be connected to a richer knowledge base and AI backend.",
    action: null
  };
}

function getSafeZone(sectionName) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const map = {
    hero: { x: vw - 170, y: 170, radiusX: 55, radiusY: 38 },
    projects: { x: vw - 170, y: 240, radiusX: 60, radiusY: 40 },
    skills: { x: 140, y: 240, radiusX: 45, radiusY: 36 },
    about: { x: vw - 180, y: vh - 220, radiusX: 52, radiusY: 35 },
    footer: { x: 150, y: vh - 180, radiusX: 45, radiusY: 30 }
  };

  return map[sectionName] || map.hero;
}

function setNewTarget() {
  const zone = getSafeZone(state.activeSection);

  const offsetX = (Math.random() * 2 - 1) * zone.radiusX;
  const offsetY = (Math.random() * 2 - 1) * zone.radiusY;

  state.targetX = zone.x + offsetX;
  state.targetY = zone.y + offsetY;
}

function animate() {
  const dx = state.targetX - state.currentX;
  const dy = state.targetY - state.currentY;

  state.currentX += dx * 0.03;
  state.currentY += dy * 0.03;

  sage.style.transform = `translate3d(${state.currentX}px, ${state.currentY}px, 0)`;

  const now = performance.now();

  if (!state.panelOpen && now - state.lastMoveAt > 3600) {
    setNewTarget();
    state.lastMoveAt = now;
  }

  requestAnimationFrame(animate);
}

function observeSections() {
  const observed = [];

  const hero = document.querySelector(".hero");
  if (hero) {
    hero.dataset.sageSection = "hero";
    observed.push(hero);
  }

  ["projects", "skills", "about"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.dataset.sageSection = id;
      observed.push(el);
    }
  });

  const footer = document.querySelector(".footer");
  if (footer) {
    footer.dataset.sageSection = "footer";
    observed.push(footer);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visible.length) return;

      const nextSection = visible[0].target.dataset.sageSection;
      if (!nextSection || nextSection === state.activeSection) return;

      state.activeSection = nextSection;
      setNewTarget();

      if (!state.panelOpen) {
        const hints = {
          hero: "Hi — I’m SAGE ✦",
          projects: "Want help choosing a project?",
          skills: "These are the core skill areas.",
          about: "This section gives more background.",
          footer: "Need a link or contact point?"
        };

        showBubble(hints[nextSection] || "I’m here if you need me.", 1800);
      }
    },
    {
      threshold: [0.3, 0.55, 0.75]
    }
  );

  observed.forEach((el) => observer.observe(el));
}

sageBody.addEventListener("click", togglePanel);
sageClose.addEventListener("click", closePanel);

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.sageAction;
    handleAction(action);
  });
});

sageForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = sageInput.value.trim();
  if (!message) return;

  addMessage("user", message);

  const result = getResponseForInput(message);

  setTimeout(() => {
    addMessage("sage", result.reply);

    if (result.action) {
      handleAction(result.action);
    }
  }, 420);

  sageInput.value = "";
});

document.addEventListener("click", (event) => {
  const clickedInsidePanel = sagePanel.contains(event.target);
  const clickedBody = sageBody.contains(event.target);

  if (!clickedInsidePanel && !clickedBody && state.panelOpen) {
    closePanel();
  }
});

window.addEventListener("resize", () => {
  setNewTarget();
});

window.addEventListener("load", () => {
  state.currentX = window.innerWidth - 180;
  state.currentY = 170;
  state.targetX = state.currentX;
  state.targetY = state.currentY;

  observeSections();
  showBubble("Hi — I’m SAGE ✦", 2500);

  setTimeout(() => {
    showBubble("Click me to explore the portfolio.", 2600);
  }, 4200);

  requestAnimationFrame(animate);
});
