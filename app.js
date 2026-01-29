pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");
const textLayerDiv = document.getElementById("textLayer");

let pdfDoc = null;
let pageNum = 1;
let scale = 1.3;
let fontScale = 1;
let utterance = null;
let spans = [];

document.getElementById("pdfInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  pdfDoc = await pdfjsLib.getDocument(url).promise;
  pageNum = 1;
  renderPage();
});

async function renderPage() {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport }).promise;

  textLayerDiv.innerHTML = "";
  spans = [];

  const textContent = await page.getTextContent();

  pdfjsLib.renderTextLayer({
    textContent,
    container: textLayerDiv,
    viewport,
    textDivs: []
  }).promise.then(() => {
    spans = [...textLayerDiv.querySelectorAll("span")];
    applyFontScale();
  });
}

/* ===== Trang ===== */
function prevPage() {
  if (pageNum > 1) {
    pageNum--;
    renderPage();
  }
}

function nextPage() {
  if (pageNum < pdfDoc.numPages) {
    pageNum++;
    renderPage();
  }
}

/* ===== Zoom ===== */
function zoomIn() {
  scale += 0.1;
  renderPage();
}

function zoomOut() {
  scale = Math.max(0.6, scale - 0.1);
  renderPage();
}

/* ===== Font ===== */
function fontUp() {
  fontScale += 0.1;
  applyFontScale();
}

function fontDown() {
  fontScale = Math.max(0.7, fontScale - 0.1);
  applyFontScale();
}

function applyFontScale() {
  spans.forEach(s => {
    s.style.transform = `scale(${fontScale})`;
    s.style.transformOrigin = "left top";
  });
}

/* ===== ĐỌC + KARAOKE ===== */
function toggleSpeak() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    clearHighlight();
    return;
  }

  const text = spans.map(s => s.textContent).join(" ");
  if (!text) return;

  utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "vi-VN";

  utterance.onboundary = e => {
    if (e.name !== "word") return;
    highlightByCharIndex(e.charIndex);
  };

  utterance.onend = clearHighlight;

  speechSynthesis.speak(utterance);
}

function highlightByCharIndex(index) {
  let count = 0;
  clearHighlight();

  for (const span of spans) {
    const len = span.textContent.length;
    if (count + len >= index) {
      span.classList.add("highlight");
      span.scrollIntoView({ block: "center", behavior: "smooth" });
      break;
    }
    count += len;
  }
}

function clearHighlight() {
  spans.forEach(s => s.classList.remove("highlight"));
}
