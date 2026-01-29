let pdfDoc = null;
let pageNum = 1;
let pageText = "";

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");
const textLayer = document.getElementById("textLayer");

document.getElementById("pdfInput").addEventListener("change", loadPDF);
document.getElementById("next").onclick = () => renderPage(pageNum + 1);
document.getElementById("prev").onclick = () => renderPage(pageNum - 1);
document.getElementById("speak").onclick = speakText;

const rateSlider = document.getElementById("rate");
rateSlider.oninput = () =>
  document.getElementById("rateVal").innerText = rateSlider.value + "x";

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
  const viewport = page.getViewport({ scale: 1.3 });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: ctx,
    viewport
  }).promise;

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

// ===== TTS =====
let voices = [];
speechSynthesis.onvoiceschanged = () => {
  voices = speechSynthesis.getVoices();
  const select = document.getElementById("voice");
  select.innerHTML = "";
  voices.forEach(v => {
    const opt = document.createElement("option");
    opt.text = v.name;
    opt.value = v.name;
    select.appendChild(opt);
  });
};

function speakText() {
  if (!pageText) return;

  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(pageText);
  utter.rate = parseFloat(rateSlider.value);

  const selected = document.getElementById("voice").value;
  utter.voice = voices.find(v => v.name === selected);

  speechSynthesis.speak(utter);
}
