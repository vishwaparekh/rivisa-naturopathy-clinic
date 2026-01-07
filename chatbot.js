// ====== CONFIG ======
const CLINIC_NAME = "Rivisa Naturopathy Clinic";
const DOCTOR_NAME = "Dr. Rita Parekh, NDDY";
const CITY = "Surat, Gujarat";
const HOURS_TEXT = "Mon–Fri, 12:00 PM–5:00 PM (IST).";

// WhatsApp number: digits only (no +)
const WHATSAPP_NUMBER = "919374519723";

// ====== Helpers ======
function waLinkFromText(text) {
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
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

// ====== Modal controls ======
const modal = document.getElementById("chatbotModal");
const chatArea = document.getElementById("chatArea");
const freeText = document.getElementById("freeText");
const sendFreeText = document.getElementById("sendFreeText");

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

if (closeBackdrop) closeBackdrop.addEventListener("click", closeModal);
if (closeX) closeX.addEventListener("click", closeModal);

// Floating chat button (FAB)
const chatFab = document.getElementById("chatFab");
if (chatFab) chatFab.addEventListener("click", () => openModal("menu"));

// Hamburger menu toggle
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
if (menuBtn && menu) {
  menuBtn.addEventListener("click", () => menu.classList.toggle("show"));
}

// Popular question buttons open learn + answer immediately
document.querySelectorAll(".popq").forEach(btn => {
  btn.addEventListener("click", () => {
    const q = btn.getAttribute("data-q");
    openModal("learn");
    setTimeout(() => handleLearnPick(q), 150);
  });
});

// ====== State ======
let state = "menu";
let booking = {
  concern: "",
  duration: "",
  mode: "",
  name: "",
  preferredTime: ""
};

// ====== Learn Tree ======
const LEARN = {
  "What is naturopathy?": {
    answer:
      "Naturopathy supports the body’s natural healing through diet, lifestyle changes, and natural therapies. The aim is to address root causes and build sustainable habits.",
    next: ["What can naturopathy help with?", "What happens in a first consultation?", "Is naturopathy safe?", "Book an appointment"]
  },
  "What can naturopathy help with?": {
    answer:
      "Many people consult for lifestyle and chronic concerns such as metabolic health (including diabetes support), weight management, digestive discomfort, stress/sleep, and joint/body pain support. Plans are personalized to your routine.",
    next: ["Do you give diet plans?", "How long does it take to see results?", "Book an appointment", "Ask another question"]
  },
  "What happens in a first consultation?": {
    answer:
      "A first consultation reviews symptoms, routine, diet, sleep, stress, and relevant history. The doctor outlines a practical plan and recommends follow-ups to track progress and adjust as needed.",
    next: ["How should I prepare?", "Online vs in-clinic — what’s the difference?", "Book an appointment", "Ask another question"]
  },
  "Is naturopathy safe?": {
    answer:
      "Naturopathy often focuses on safe lifestyle and dietary guidance. If you have medical conditions or take medications, recommendations must be personalized. For urgent symptoms, seek immediate medical care.",
    next: ["Can I do this along with my current medicines?", "Book an appointment", "Ask another question"]
  },
  "Can I do this along with my current medicines?": {
    answer:
      "Often yes — lifestyle and diet guidance can complement ongoing care. Share your current medicines and conditions during consultation so recommendations are appropriate.",
    next: ["Book an appointment", "Ask another question"]
  },
  "Do you give diet plans?": {
    answer:
      "Yes — plans are personalized to your routine, preferences, and goals. The focus is realistic changes you can maintain long-term.",
    next: ["Book an appointment", "Ask another question"]
  },
  "How long does it take to see results?": {
    answer:
      "It varies by condition, duration, and consistency. Some people notice changes within weeks; others need longer. Follow-ups help track progress and refine the plan.",
    next: ["Book an appointment", "Ask another question"]
  },
  "How should I prepare?": {
    answer:
      "If possible, note your symptoms, diet routine, sleep schedule, medicines/supplements, and any recent lab reports. This helps make the consultation more productive.",
    next: ["Book an appointment", "Ask another question"]
  },
  "Online vs in-clinic — what’s the difference?": {
    answer:
      "Online consultations are convenient for guidance-based care. In-clinic visits may be preferred for in-person assessment. You can choose what suits you.",
    next: ["Book an appointment", "Ask another question"]
  }
};

// ====== Start ======
function startChat(mode="menu") {
  chatArea.innerHTML = "";
  booking = { concern:"", duration:"", mode:"", name:"", preferredTime:"" };
  state = mode;

  addBubble(chatArea, `Hi 👋 Welcome to ${CLINIC_NAME}.`);
  addBubble(chatArea, `I can answer quick questions or help you book via WhatsApp with ${DOCTOR_NAME}.`);

  if (mode === "learn") startLearn();
  else showMenu();
}

function showMenu() {
  state = "menu";
  addBubble(chatArea, "What would you like to do?");
  addChoices(chatArea, ["Learn about naturopathy", "Book an appointment"], (pick) => {
    addBubble(chatArea, pick, "user");
    if (pick === "Learn about naturopathy") startLearn();
    else startBooking();
  });
}

// ====== Learn ======
function startLearn() {
  state = "learn";
  addBubble(chatArea, "Choose a question:");
  addChoices(chatArea, [
    "What is naturopathy?",
    "What can naturopathy help with?",
    "What happens in a first consultation?",
    "Is naturopathy safe?",
    "Book an appointment"
  ], (pick) => {
    addBubble(chatArea, pick, "user");
    if (pick === "Book an appointment") return startBooking();
    handleLearnPick(pick);
  });
}

function handleLearnPick(question) {
  const node = LEARN[question];
  if (!node) {
    addBubble(chatArea, "Please tap one of the options above, or book an appointment.", "bot");
    return startLearn();
  }

  addBubble(chatArea, node.answer, "bot");
  addChoices(chatArea, node.next || ["Book an appointment", "Ask another question"], (pick) => {
    addBubble(chatArea, pick, "user");
    if (pick === "Book an appointment") return startBooking();
    if (pick === "Ask another question") return startLearn();
    handleLearnPick(pick);
  });
}

// ====== Booking ======
function startBooking() {
  state = "book_concern";
  addBubble(chatArea, `Great — booking is via WhatsApp. Clinic hours: ${HOURS_TEXT}`);
  addBubble(chatArea, "What do you want help with?");
  addChoices(chatArea, [
    "Diabetes / metabolic health",
    "Lifestyle / weight",
    "Acidity / digestive issues",
    "Stress / sleep",
    "Joint / body pain",
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
    askNameRequired();
  });
}

function askNameRequired() {
  state = "book_name";
  addBubble(chatArea, "Your full name (required). Please type it below and tap Send.");
}

function askPreferredTime() {
  state = "book_time";
  addBubble(chatArea, "Any preferred day/time? (optional). Example: “Tue 2–4 PM”. Type below or Skip.");
  addChoices(chatArea, ["Skip"], (pick) => {
    booking.preferredTime = "(no preference)";
    addBubble(chatArea, pick, "user");
    finishBooking();
  });
}

function finishBooking() {
  state = "book_done";

  const msg =
`Hello ${CLINIC_NAME},

I’d like to book an appointment with ${DOCTOR_NAME}.

Name: ${booking.name}
Concern: ${booking.concern}
Since: ${booking.duration}
Preferred: ${booking.mode}
Preferred day/time: ${booking.preferredTime}

City: ${CITY}
Hours: ${HOURS_TEXT}`;

  addBubble(chatArea, "Perfect ✅ I’ve prepared a short WhatsApp message.", "bot");
  addBubble(chatArea, "After WhatsApp opens, please tap Send ✅", "bot");

  const link = document.createElement("a");
  link.className = "btn btn-primary";
  link.style.width = "100%";
  link.href = waLinkFromText(msg);
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Open WhatsApp Message";
  chatArea.appendChild(link);

  const again = document.createElement("button");
  again.className = "btn btn-ghost";
  again.style.width = "100%";
  again.textContent = "Ask a question instead";
  again.onclick = () => startLearn();
  chatArea.appendChild(again);

  chatArea.scrollTop = chatArea.scrollHeight;
}

// ====== Free text handler ======
function handleFreeText(text) {
  if (!text) return;
  addBubble(chatArea, text, "user");

  if (state === "book_name") {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      addBubble(chatArea, "Please enter your full name.", "bot");
      return;
    }
    booking.name = trimmed;
    askPreferredTime();
    return;
  }

  if (state === "book_time") {
    booking.preferredTime = text.trim() || "(no preference)";
    finishBooking();
    return;
  }

  addBubble(chatArea, "Please use the options above, or choose Book an appointment.", "bot");
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