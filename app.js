"use strict";

const source = document.getElementById("source");
const output = document.getElementById("output");
const status = document.getElementById("status");
const fontSelect = document.getElementById("font");
const sourceSize = document.getElementById("sourceSize");
const outputSize = document.getElementById("outputSize");
const mapping = document.getElementById("mapping");

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");

let convertTimer = null;

const chordRegex =
  /^(?:[A-G](?:#|b)?(?:(?:maj|min|m|dim|aug|sus|add)\d*|\d+)?(?:[#b]\d+)?(?:\/[A-G](?:#|b)?)?|N\.?C\.?|[\(\)\[\]\-|:])+$/i;

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function applySettings() {
  source.style.fontFamily = `"${fontSelect.value}", Arial, sans-serif`;
  source.style.fontSize = `${Number(sourceSize.value) || 18}px`;
  output.style.fontSize = `${Number(outputSize.value) || 16}px`;
}

function scheduleConvert(delay = 60) {
  window.clearTimeout(convertTimer);
  convertTimer = window.setTimeout(convert, delay);
}

function applySettingsAndConvert() {
  applySettings();
  scheduleConvert(0);
}

function getPlainText() {
  return source.value
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n");
}

function getSourceFont() {
  const style = getComputedStyle(source);

  return [
    style.fontStyle,
    style.fontWeight,
    style.fontSize,
    style.fontFamily
  ].join(" ");
}

function measure(text) {
  context.font = getSourceFont();
  return context.measureText(text).width;
}

function isChordLine(line) {
  const tokens = line
    .trim()
    .split(/\s+/u)
    .filter(Boolean);

  return tokens.length > 0 && tokens.every((token) => chordRegex.test(token));
}

function getChordTokens(line) {
  const tokens = [];
  const regex = /\S+/gu;
  let match;

  while ((match = regex.exec(line)) !== null) {
    tokens.push({
      text: match[0],
      start: match.index
    });
  }

  return tokens;
}

function buildLyricPositions(line) {
  const characters = Array.from(line);
  const positions = [{ index: 0, x: 0 }];

  let prefix = "";

  for (let index = 0; index < characters.length; index += 1) {
    prefix += characters[index];

    positions.push({
      index: index + 1,
      x: measure(prefix)
    });
  }

  return positions;
}

function mapXToIndex(x, positions) {
  if (!positions.length) return 0;

  if (mapping.value === "before") {
    let selected = positions[0];

    for (const position of positions) {
      if (position.x > x) break;
      selected = position;
    }

    return selected.index;
  }

  if (mapping.value === "after") {
    const selected =
      positions.find((position) => position.x >= x) ??
      positions[positions.length - 1];

    return selected.index;
  }

  let selected = positions[0];
  let bestDistance = Math.abs(x - selected.x);

  for (const position of positions) {
    const distance = Math.abs(x - position.x);

    if (distance < bestDistance) {
      selected = position;
      bestDistance = distance;
    }
  }

  return selected.index;
}

function renderChordLine(chordLine, lyricLine) {
  const tokens = getChordTokens(chordLine);
  const lyricPositions = buildLyricPositions(lyricLine);
  const cells = [];

  let previousEnd = 0;

  for (const token of tokens) {
    const tokenX = measure(chordLine.slice(0, token.start));
    let column = mapXToIndex(tokenX, lyricPositions);

    if (column < previousEnd) {
      column = previousEnd + 1;
    }

    while (cells.length < column) {
      cells.push(" ");
    }

    for (const character of Array.from(token.text)) {
      cells[column] = character;
      column += 1;
    }

    previousEnd = column;
  }

  return cells.join("").replace(/\s+$/u, "");
}

function findNextLyricLine(lines, chordIndex) {
  const nextIndex = chordIndex + 1;

  if (nextIndex >= lines.length) {
    return null;
  }

  const nextLine = lines[nextIndex];

  if (!nextLine.trim() || isChordLine(nextLine)) {
    return null;
  }

  return nextLine;
}

function convert() {
  const text = getPlainText();

  if (!text.trim()) {
    output.value = "";
    setStatus("");
    return;
  }

  const lines = text.split("\n");

  const result = lines.map((line, index) => {
    if (!isChordLine(line)) {
      return line.replace(/\s+$/u, "");
    }

    const lyricLine = findNextLyricLine(lines, index);

    if (!lyricLine) {
      return line.replace(/\s+$/u, "");
    }

    return renderChordLine(line, lyricLine);
  });

  output.value = result.join("\n");
  setStatus("Output updated.");
}

async function copyOutput() {
  if (!output.value) {
    setStatus("There is no output to copy.", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(output.value);
    setStatus("Output copied to the clipboard.");
  } catch {
    output.focus();
    output.select();
    setStatus("Output selected. Press Ctrl/Cmd + C to copy it.");
  }
}

function downloadOutput() {
  if (!output.value) {
    setStatus("There is no output to download.", true);
    return;
  }

  const blob = new Blob([output.value], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "chord-alignment.txt";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
  setStatus("TXT file downloaded.");
}

function clearAll() {
  window.clearTimeout(convertTimer);

  source.value = "";
  output.value = "";

  setStatus("");
  source.focus();
}

source.addEventListener("input", () => scheduleConvert());
source.addEventListener("paste", () => scheduleConvert(0));

document.getElementById("copy").addEventListener("click", copyOutput);
document.getElementById("download").addEventListener("click", downloadOutput);
document.getElementById("clear").addEventListener("click", clearAll);

fontSelect.addEventListener("change", applySettingsAndConvert);
sourceSize.addEventListener("input", applySettingsAndConvert);
outputSize.addEventListener("input", applySettings);
mapping.addEventListener("change", () => scheduleConvert(0));

applySettings();

source.value = [
  "C        G",
  "Your eyes drift into the distance",
  "Am          F",
  "A song remains from the night"
].join("\n");

convert();
