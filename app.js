let pdfDoc = null;
let pageNum = 1;
let pageText = "";

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");
const textLayer = document.getElementById("textLayer");

const voiceSelect = document.getElementById("voice");
const rateSlider = document.getElementById("rate");

document.getElementById("pdfInput").addEventListener("change", loadPDF);
document.getElementById("next").onclick = () => renderPage(pageNum + 1);
document.getElementById("prev").onclick = () => renderPage(pageNum - 1);
document.getElementById("speak").onclick = speakSelectedOrPage;

rateSlider.oninput = () =>
  document.getElementById("rateVal").innerText = rateSlider.value + "x";

// ================= PDF =================
async function loadPDF(e) {
  const file = e.target.files[0];
  if (!file) return;

  const buffer = await file.arrayBuffer();
  pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
  pageNum = 1;
  renderPage(pageNum);
}

async function renderPage(num) {
  if (!pdfDoc || num < 1 || num > pdfDoc.numPages) return;
  pageNum = num;

  const page = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: 1.4 });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport }).promise;

  const textContent = await page.getTextContent();
  pageText = textContent.items.map(i => i.str).join(" ");

  textLayer.innerHTML = "";
  textLayer.style.width = canvas.width + "px";
  textLayer.style.height = canvas.height + "px";

  pdfjsLib.renderTextLayer({
    textContent,
    container: textLayer,
    viewport,
    textDivs: []
  });

  document.getElementById("pageInfo").innerText =
    `${pageNum} / ${pdfDoc.numPages}`;
}

// ================= TTS =================
let voices = [];

function loadVoices() {
  voices = speechSynthesis.getVoices();

  // 👉 LỌC RIÊNG TIẾNG VIỆT
  const viVoices = voices.filter(v =>
    v.lang.toLowerCase().includes("vi")
  );

  voiceSelect.innerHTML = "";

  viVoices.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.text = `🇻🇳 ${v.name}`;
    voiceSelect.appendChild(opt);
  });

  // fallback nếu máy không có tiếng Việt
  if (viVoices.length === 0) {
    const opt = document.createElement("option");
    opt.text = "⚠️ Chưa cài giọng tiếng Việt";
    voiceSelect.appendChild(opt);
  }
}

speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// ================= ĐỌC PHẦN ĐƯỢC QUÉT =================
function speakSelectedOrPage() {
  let text = window.getSelection().toString().trim();

  if (!text) {
    text = pageText; // nếu không quét → đọc cả trang
  }

  if (!text) return;

  speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = parseFloat(rateSlider.value);

  const selectedVoice = voices.find(v => v.name === voiceSelect.value);
  if (selectedVoice) utter.voice = selectedVoice;

  speechSynthesis.speak(utter);
}
