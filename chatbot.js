// ====== CONFIG ======
const CLINIC_NAME = "Rivisa Naturopathy Clinic";
const DOCTOR_NAME = "Dr. Rita Parekh, NDDY";
const CITY = "Surat, Gujarat";

const HOURS_TEXT = "Mon–Fri, 12:00 PM–5:00 PM (IST). 30-min slots with 15-min buffer.";

// WhatsApp number: digits only (no +)
const WHATSAPP_NUMBER = "919374519723";
// Call button
const CALL_NUMBER = "+919374519723";

// Direct WhatsApp template (fallback)
const DIRECT_TEMPLATE =
`Hello ${CLINIC_NAME},

I’d like to request a WhatsApp call with ${DOCTOR_NAME}.
City: ${CITY}

Name:
Phone:
Concern:
Since when:
Preferred: Online / In-clinic / Either
Preferred day/time:

Clinic hours: ${HOURS_TEXT}`;

// ====== Helpers ======
function waLinkFromText(text) {
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
function setHref(id, href) {
  const el = document.getElementById(id);
  if (el) el.setAttribute("href", href);
}
function addBubble(chatArea, text, who="bot") {
  const div = document.createElement("div");
  div.className = `bubble ${who === "user" ? "user" : ""}`;
  div.textContent = text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}
function addChoices(chatArea, choices, onPick) {
  const wrap = document.createElement("div");
  wrap.className = "choices";
  choices.forEach(label => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.type = "button";
    btn.textContent = label;
    btn.onclick = () => onPick(label);
    wrap.appendChild(btn);
  });
  chatArea.appendChild(wrap);
  chatArea.scrollTop = chatArea.scrollHeight;
}
function normalizePhone(input) {
  const digits = (input || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.length === 10) return "91" + digits; // assume India
  return digits;
}

// ====== Wire up existing buttons ======
setHref("waBtn", waLinkFromText(DIRECT_TEMPLATE));
setHref("waDirect", waLinkFromText(DIRECT_TEMPLATE));
setHref("callBtn", `tel:${CALL_NUMBER}`);

// ====== Modal controls ======
const modal = document.getElementById("chatbotModal");
const chatArea = document.getElementById("chatArea");
const freeText = document.getElementById("freeText");
const sendFreeText = document.getElementById("sendFreeText");

const openChatbotBtns = ["openChatbot", "openChatbot2"]
  .map(id => document.getElementById(id))
  .filter(Boolean);

const closeBackdrop = document.getElementById("closeChatbot");
const closeX = document.getElementById("closeChatbotX");

function openModal(mode = "menu") {
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  startChat(mode);
}
function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

openChatbotBtns.forEach(btn => btn.addEventListener("click", () => openModal("menu")));
closeBackdrop.addEventListener("click", closeModal);
closeX.addEventListener("click", closeModal);

// ====== State ======
let state = "menu";
let learnViewed = [];
let booking = {
  concern: "",
  duration: "",
  mode: "",
  name: "",
  phone: "",
  preferredTime: ""
};

// ====== Learn Tree Content ======
const LEARN = {
  "What is naturopathy?": {
    answer:
      "Naturopathy supports the body’s natural healing through diet, lifestyle changes, and natural therapies. The goal is to address root causes and build sustainable habits.",
    next: [
      "What can naturopathy help with?",
      "What happens in a first consultation?",
      "Is naturopathy safe?",
      "Book a WhatsApp Call"
    ]
  },
  "What can naturopathy help with?": {
    answer:
      "Many people consult for lifestyle and chronic concerns like diabetes support, weight management, digestion (acidity/bloating), stress & sleep, and joint/body pain support. A personalized plan depends on your history and routine.",
    next: [
      "Do you treat diabetes and obesity?",
      "Do you give diet plans?",
      "How long does it take to see results?",
      "Book a WhatsApp Call"
    ]
  },
  "What happens in a first consultation?": {
    answer:
      "The first consultation reviews your symptoms, routine, diet, sleep, stress, and medical history. Based on this, the doctor outlines a practical plan and recommends follow-ups to track progress.",
    next: [
      "Online vs in-clinic — what’s the difference?",
      "How should I prepare?",
      "Book a WhatsApp Call"
    ]
  },
  "Is naturopathy safe?": {
    answer:
      "Naturopathy often focuses on safe lifestyle and dietary guidance. If you have medical conditions or take medications, recommendations must be personalized. For urgent symptoms, seek immediate medical care.",
    next: [
      "Can I do this along with my current medicines?",
      "Book a WhatsApp Call",
      "Ask another question"
    ]
  },
  "Can I do this along with my current medicines?": {
    answer:
      "Often yes — lifestyle and diet changes can complement ongoing care. Please share your current medicines and conditions during consultation so recommendations are appropriate.",
    next: [
      "Book a WhatsApp Call",
      "Ask another question"
    ]
  },
  "Do you treat diabetes and obesity?": {
    answer:
      "We support metabolic health with structured diet + lifestyle routines and follow-up guidance. The aim is steady improvement and sustainable habits. For individualized advice, please request a consultation.",
    next: [
      "Book a WhatsApp Call",
      "Ask another question"
    ]
  },
  "Do you give diet plans?": {
    answer:
      "Yes — plans are personalized to your routine, preferences, and goals. The focus is realistic changes you can maintain long-term.",
    next: [
      "Book a WhatsApp Call",
      "Ask another question"
    ]
  },
  "How long does it take to see results?": {
    answer:
      "It varies by condition, duration, and consistency. Some people notice changes within weeks; others need longer. Follow-ups help track progress and adjust the plan.",
    next: [
      "Book a WhatsApp Call",
      "Ask another question"
    ]
  },
  "Online vs in-clinic — what’s the difference?": {
    answer:
      "Online consultations are convenient and work well for guidance-based care. In-clinic visits may be preferred if you want in-person assessment. You can choose what suits you.",
    next: [
      "Book a WhatsApp Call",
      "Ask another question"
    ]
  },
  "How should I prepare?": {
    answer:
      "If possible, note your symptoms, diet routine, sleep schedule, medicines/supplements, and any recent lab reports. This helps make the consultation more productive.",
    next: [
      "Book a WhatsApp Call",
      "Ask another question"
    ]
  }
};

// ====== Conversation entry ======
function startChat(mode="menu") {
  chatArea.innerHTML = "";
  learnViewed = [];
  booking = { concern:"", duration:"", mode:"", name:"", phone:"", preferredTime:"" };
  state = mode;

  addBubble(chatArea, `Hi 👋 Welcome to ${CLINIC_NAME}.`);
  addBubble(chatArea, `I can answer quick questions or help you request a WhatsApp call with ${DOCTOR_NAME}.`);

  if (mode === "learn") startLearn();
  else showMenu();
}

function showMenu() {
  state = "menu";
  addBubble(chatArea, "What would you like to do?");
  addChoices(chatArea, ["Learn about Naturopathy", "Book a WhatsApp Call"], (pick) => {
    addBubble(chatArea, pick, "user");
    if (pick === "Learn about Naturopathy") startLearn();
    else startBooking();
  });
}

// ====== Learn mode ======
function startLearn() {
  state = "learn";
  addBubble(chatArea, "Choose a question:");
  addChoices(chatArea, [
    "What is naturopathy?",
    "What can naturopathy help with?",
    "What happens in a first consultation?",
    "Is naturopathy safe?",
    "Book a WhatsApp Call"
  ], (pick) => {
    addBubble(chatArea, pick, "user");
    if (pick === "Book a WhatsApp Call") return startBooking();
    handleLearnPick(pick);
  });
}

function handleLearnPick(question) {
  const node = LEARN[question];
  if (!node) {
    addBubble(chatArea, "Please tap one of the options, or request a WhatsApp call.", "bot");
    return startLearn();
  }
  learnViewed.push(question);

  addBubble(chatArea, node.answer, "bot");

  const next = node.next || ["Ask another question", "Book a WhatsApp Call"];
  addChoices(chatArea, next, (pick) => {
    addBubble(chatArea, pick, "user");
    if (pick === "Book a WhatsApp Call") return startBooking();
    if (pick === "Ask another question") return startLearn();
    handleLearnPick(pick);
  });
}

// ====== Booking mode ======
function startBooking() {
  state = "book_concern";
  addBubble(chatArea, `Great — we’ll request a WhatsApp call. Clinic hours: ${HOURS_TEXT}`);
  addBubble(chatArea, "What are you looking for help with?");
  addChoices(chatArea, [
    "Diabetes / metabolic health",
    "Lifestyle disorders / weight",
    "Acidity / digestive issues",
    "Stress / sleep",
    "Joint pain / body pain",
    "Other"
  ], (pick) => {
    booking.concern = pick;
    addBubble(chatArea, pick, "user");
    askDuration();
  });
}

function askDuration() {
  state = "book_duration";
  addBubble(chatArea, "Since when has this been happening?");
  addChoices(chatArea, ["< 1 week", "1–4 weeks", "1–6 months", "> 6 months"], (pick) => {
    booking.duration = pick;
    addBubble(chatArea, pick, "user");
    askMode();
  });
}

function askMode() {
  state = "book_mode";
  addBubble(chatArea, "Preferred consultation type?");
  addChoices(chatArea, ["Online", "In-clinic (Surat)", "Either is fine"], (pick) => {
    booking.mode = pick;
    addBubble(chatArea, pick, "user");
    askName();
  });
}

function askName() {
  state = "book_name";
  addBubble(chatArea, "Your name? (optional — type it below and tap Send, or Skip)");
  addChoices(chatArea, ["Skip"], (pick) => {
    addBubble(chatArea, pick, "user");
    booking.name = "(not shared)";
    askPhone();
  });
}

function askPhone() {
  state = "book_phone";
  addBubble(chatArea, "Phone number for WhatsApp call (required). Please type it below and tap Send.");
}

function askPreferredTime() {
  state = "book_time";
  addBubble(chatArea, "Any preferred day/time? (optional). Example: “Tue 2–4 PM”. Type below or Skip.");
  addChoices(chatArea, ["Skip"], (pick) => {
    addBubble(chatArea, pick, "user");
    booking.preferredTime = "(not shared)";
    finishBooking();
  });
}

function finishBooking() {
  state = "book_done";

  const learnSummary = learnViewed.length
    ? `Learned about: ${[...new Set(learnViewed)].slice(0,6).join(", ")}`
    : "Learned about: (none)";

  const msg =
`Hello ${CLINIC_NAME},

I’d like to request a WhatsApp call with ${DOCTOR_NAME}.
City: ${CITY}

Name: ${booking.name}
Phone: ${booking.phone}
Concern: ${booking.concern}
Since: ${booking.duration}
Preferred: ${booking.mode}
Preferred day/time: ${booking.preferredTime}

Clinic hours: ${HOURS_TEXT}

${learnSummary}

Notes (optional):`;

  addBubble(chatArea, "Perfect ✅ I’ve prepared your WhatsApp call request.", "bot");
  addBubble(chatArea, "After WhatsApp opens, please tap Send ✅", "bot");

  const link = document.createElement("a");
  link.className = "btn btn-primary btn-full";
  link.href = waLinkFromText(msg);
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Open WhatsApp Message";
  chatArea.appendChild(link);

  const again = document.createElement("button");
  again.className = "btn btn-ghost btn-full";
  again.textContent = "Learn more about naturopathy";
  again.onclick = () => startLearn();
  chatArea.appendChild(again);

  chatArea.scrollTop = chatArea.scrollHeight;
}

// ====== Free text handler ======
function handleFreeText(text) {
  if (!text) return;
  addBubble(chatArea, text, "user");

  if (state === "book_name") {
    booking.name = text;
    askPhone();
    return;
  }

  if (state === "book_phone") {
    const normalized = normalizePhone(text);
    if (!normalized || normalized.length < 11) {
      addBubble(chatArea, "Please enter a valid phone number (10 digits is okay).", "bot");
      return;
    }
    booking.phone = normalized;
    askPreferredTime();
    return;
  }

  if (state === "book_time") {
    booking.preferredTime = text;
    finishBooking();
    return;
  }

  // Learn/menu: keep users on buttons
  addBubble(chatArea, "Please tap one of the options above, or request a WhatsApp call.", "bot");
}

// send handlers
sendFreeText.addEventListener("click", () => {
  handleFreeText(freeText.value.trim());
  freeText.value = "";
});
freeText.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleFreeText(freeText.value.trim());
    freeText.value = "";
  }
});

// Open Learn mode from homepage
const openLearn = document.getElementById("openLearn");
if (openLearn) openLearn.addEventListener("click", () => openModal("learn"));

// Popular question buttons: open chatbot and answer selected Q
document.querySelectorAll(".popq").forEach(btn => {
  btn.addEventListener("click", () => {
    const q = btn.getAttribute("data-q");
    openModal("learn");
    setTimeout(() => {
      handleLearnPick(q);
    }, 150);
  });
});
