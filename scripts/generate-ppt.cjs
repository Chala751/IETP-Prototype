// IETP Academic Presentation — Blue/White Professional Theme
// Run: node scripts/generate-ppt.cjs
"use strict";
const PptxGenJS = require("pptxgenjs");
const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
  navy:     "0D2B5E",
  blue:     "1565C0",
  mid:      "1976D2",
  sky:      "42A5F5",
  pale:     "BBDEFB",
  vPale:    "E8F4FD",
  white:    "FFFFFF",
  offW:     "F5F8FF",
  green:    "1B5E20",
  mGreen:   "388E3C",
  lGreen:   "4CAF50",
  pGreen:   "E8F5E9",
  orange:   "D84315",
  lOrange:  "FF7043",
  pOrange:  "FBE9E7",
  red:      "B71C1C",
  pRed:     "FFEBEE",
  yellow:   "F57F17",
  pYellow:  "FFF8E1",
  dark:     "212121",
  body:     "37474F",
  muted:    "78909C",
  gray:     "ECEFF1",
  dgray:    "90A4AE",
};

const TOTAL = 10;
const SW    = 13.33;
const SH    = 7.5;
const FF    = "Calibri";

// ── Core helpers ───────────────────────────────────────────────────────────────

function bg(slide) { slide.background = { color: C.white }; }

/** Blue header bar used on slides 2-10 */
function hdr(slide, num, text) {
  slide.addShape(pptx.ShapeType.rect, { x:0, y:0, w:SW, h:0.06, fill:{ color:C.sky } });
  slide.addShape(pptx.ShapeType.rect, { x:0, y:0.06, w:SW, h:0.84, fill:{ color:C.navy } });
  // Accent right stripe
  slide.addShape(pptx.ShapeType.rect, { x:SW-0.35, y:0.06, w:0.35, h:0.84, fill:{ color:C.blue } });
  // Number badge
  slide.addShape(pptx.ShapeType.ellipse, { x:0.28, y:0.17, w:0.52, h:0.52, fill:{ color:C.sky }, line:{ color:C.white, width:0.5 } });
  slide.addText(num.toString(), { x:0.28, y:0.17, w:0.52, h:0.52, fontSize:15, bold:true, color:C.navy, align:"center", valign:"middle", fontFace:FF });
  // Title
  slide.addText(text, { x:0.96, y:0.1, w:11.7, h:0.66, fontSize:22, bold:true, color:C.white, fontFace:FF, valign:"middle" });
}

function ftr(slide, num) {
  slide.addShape(pptx.ShapeType.rect, { x:0, y:7.32, w:SW, h:0.02, fill:{ color:C.pale } });
  slide.addText(
    `IoT-Based Light Intensity Monitoring and Smart Control System  ·  Slide ${num} of ${TOTAL}`,
    { x:0, y:7.34, w:SW, h:0.16, fontSize:7.5, color:C.muted, align:"center", fontFace:FF }
  );
}

function card(slide, x, y, w, h, opts={}) {
  const { fill=C.white, border=C.pale, bw=0.75, rad=0.1 } = opts;
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill:{ color:fill }, line:{ color:border, width:bw }, rectRadius:rad });
}

/** Card with a solid coloured top banner */
function bannerCard(slide, x, y, w, h, bannerColor, bannerH=0.38) {
  card(slide, x, y, w, h, { fill:C.white, border:bannerColor, bw:0.75 });
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h:bannerH+0.06, fill:{ color:bannerColor }, line:{ color:bannerColor, width:0 }, rectRadius:0.1 });
  slide.addShape(pptx.ShapeType.rect,      { x, y:y+bannerH-0.04, w, h:0.1, fill:{ color:bannerColor }, line:{ color:bannerColor, width:0 } });
}

function iconCircle(slide, emoji, x, y, size=0.65, bg=C.vPale, border=C.pale) {
  slide.addShape(pptx.ShapeType.ellipse, { x, y, w:size, h:size, fill:{ color:bg }, line:{ color:border, width:0.75 } });
  slide.addText(emoji, { x, y, w:size, h:size, fontSize:size*16, align:"center", valign:"middle" });
}

function arrowR(slide, x, y, color=C.sky) {
  slide.addShape(pptx.ShapeType.rightArrow, { x, y, w:0.42, h:0.34, fill:{ color }, line:{ color } });
}

function divLine(slide, x, y, w, color=C.pale) {
  slide.addShape(pptx.ShapeType.rect, { x, y, w, h:0.018, fill:{ color } });
}

function numBullet(slide, items, x, y, spacing=0.52, sz=12, color=C.body) {
  items.forEach((txt, i) => {
    slide.addShape(pptx.ShapeType.ellipse, { x, y:y+i*spacing, w:0.3, h:0.3, fill:{ color:C.blue } });
    slide.addText((i+1).toString(), { x, y:y+i*spacing, w:0.3, h:0.3, fontSize:9.5, bold:true, color:C.white, align:"center", valign:"middle", fontFace:FF });
    slide.addText(txt, { x:x+0.4, y:y+i*spacing+0.02, w:5.5, h:0.28, fontSize:sz, color, fontFace:FF });
  });
}

function dotBullets(slide, items, x, y, w, sz=11.5, color=C.body, spacing=0.42) {
  items.forEach((txt, i) => {
    slide.addShape(pptx.ShapeType.ellipse, { x, y:y+i*spacing+0.1, w:0.1, h:0.1, fill:{ color:C.sky } });
    slide.addText(txt, { x:x+0.2, y:y+i*spacing, w:w-0.2, h:0.38, fontSize:sz, color, fontFace:FF });
  });
}

function kpiCard(slide, x, y, w, h, value, unit, label, bgColor, textColor=C.white) {
  card(slide, x, y, w, h, { fill:bgColor, border:bgColor, bw:0 });
  slide.addText(value, { x, y:y+0.12, w, h:0.55, fontSize:28, bold:true, color:textColor, align:"center", fontFace:FF });
  slide.addText(unit,  { x, y:y+0.62, w, h:0.22, fontSize:10, color:textColor, align:"center", fontFace:FF, transparency:20 });
  slide.addShape(pptx.ShapeType.rect, { x:x+0.2, y:y+0.84, w:w-0.4, h:0.015, fill:{ color:C.white, transparency:60 } });
  slide.addText(label, { x, y:y+0.88, w, h:0.28, fontSize:9.5, bold:true, color:textColor, align:"center", fontFace:FF });
}

// ══════════════════════════════════════════════════════════════════════════════
// Slide 1 – Title
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();

  // Left blue panel
  slide_rect(s, 0, 0, 7.2, SH, C.navy);
  slide_rect(s, 0, 0, 7.2, 0.06, C.sky);
  // Decorative circles on left panel
  s.addShape(pptx.ShapeType.ellipse, { x:-1.2, y:4.8, w:3.5, h:3.5, fill:{ color:C.blue, transparency:70 }, line:{ color:C.sky, width:0.5, transparency:50 } });
  s.addShape(pptx.ShapeType.ellipse, { x:5.0, y:-1.0, w:3.0, h:3.0, fill:{ color:C.sky, transparency:75 }, line:{ color:C.pale, width:0.5, transparency:50 } });

  // University badge
  s.addShape(pptx.ShapeType.roundRect, { x:0.5, y:0.28, w:4.8, h:0.36, fill:{ color:C.blue }, line:{ color:C.sky, width:0.5 }, rectRadius:0.06 });
  s.addText("Final Year Engineering Project  ·  2026", { x:0.5, y:0.28, w:4.8, h:0.36, fontSize:10, color:C.pale, align:"center", fontFace:FF, bold:true });

  // Main title
  s.addText("IoT-Based Light Intensity", { x:0.4, y:0.9, w:6.5, h:0.78, fontSize:32, bold:true, color:C.white, fontFace:FF });
  s.addText("Monitoring and Smart", { x:0.4, y:1.65, w:6.5, h:0.65, fontSize:28, bold:true, color:C.sky, fontFace:FF });
  s.addText("Control System", { x:0.4, y:2.28, w:6.5, h:0.65, fontSize:28, bold:true, color:C.sky, fontFace:FF });
  s.addShape(pptx.ShapeType.rect, { x:0.4, y:3.05, w:3.5, h:0.05, fill:{ color:C.sky } });
  s.addText("With Web Application", { x:0.4, y:3.18, w:6.3, h:0.32, fontSize:14, color:C.pale, fontFace:FF });

  // Feature badges
  const feats = [["📡","Real-time Monitoring"],["💡","Smart Control"],["⚡","Energy Efficient"],["🌐","IoT Enabled"]];
  feats.forEach(([icon, lbl], i) => {
    const fy = 3.72 + i * 0.52;
    s.addShape(pptx.ShapeType.roundRect, { x:0.4, y:fy, w:4.8, h:0.4, fill:{ color:C.blue, transparency:30 }, line:{ color:C.sky, width:0.5, transparency:40 }, rectRadius:0.06 });
    s.addText(icon + "  " + lbl, { x:0.5, y:fy+0.04, w:4.6, h:0.32, fontSize:12, color:C.white, fontFace:FF });
  });

  // Links
  s.addText("🔗  Wokwi Simulation: wokwi.com/projects/464159002953560065", { x:0.4, y:5.9, w:6.5, h:0.28, fontSize:9, color:C.pale, fontFace:FF });
  s.addText("🌐  Web Dashboard: ietp-prototype.vercel.app/light",           { x:0.4, y:6.22, w:6.5, h:0.28, fontSize:9, color:C.pale, fontFace:FF });
  s.addText("Prepared by the IETP Project Team",                            { x:0.4, y:6.7, w:6.5, h:0.28, fontSize:9, color:C.dgray, fontFace:FF, italic:true });

  // Right side – decorative IoT dashboard illustration
  slide_rect(s, 7.2, 0, SW-7.2, SH, C.offW);

  // Monitor shape
  s.addShape(pptx.ShapeType.roundRect, { x:7.65, y:0.9, w:5.2, h:3.4, fill:{ color:C.white }, line:{ color:C.pale, width:1 }, rectRadius:0.15 });
  s.addShape(pptx.ShapeType.rect, { x:7.65, y:0.9, w:5.2, h:0.45, fill:{ color:C.navy }, line:{ color:C.navy, width:0 } });
  s.addShape(pptx.ShapeType.roundRect, { x:7.65, y:0.9, w:5.2, h:0.45, fill:{ color:C.navy }, line:{ color:C.navy, width:0 }, rectRadius:0.1 });
  s.addShape(pptx.ShapeType.rect, { x:7.65, y:1.1, w:5.2, h:0.25, fill:{ color:C.navy }, line:{ color:C.navy, width:0 } });
  s.addText("IoT Light Dashboard", { x:7.65, y:0.92, w:5.2, h:0.38, fontSize:11, bold:true, color:C.white, align:"center", fontFace:FF });

  // Dashboard content inside monitor
  // Header bar in monitor
  s.addShape(pptx.ShapeType.rect, { x:7.8, y:1.42, w:4.9, h:0.55, fill:{ color:C.vPale }, line:{ color:C.pale, width:0.3 } });
  s.addText("Current Intensity", { x:7.9, y:1.45, w:1.8, h:0.2, fontSize:7, color:C.muted, fontFace:FF });
  s.addText("68%", { x:7.9, y:1.63, w:1.0, h:0.25, fontSize:14, bold:true, color:C.blue, fontFace:FF });
  s.addText("Threshold", { x:9.0, y:1.45, w:1.2, h:0.2, fontSize:7, color:C.muted, fontFace:FF });
  s.addText("40%", { x:9.0, y:1.63, w:1.0, h:0.25, fontSize:14, bold:true, color:C.green, fontFace:FF });
  s.addText("Status", { x:10.2, y:1.45, w:1.2, h:0.2, fontSize:7, color:C.muted, fontFace:FF });
  s.addShape(pptx.ShapeType.roundRect, { x:10.2, y:1.6, w:1.2, h:0.28, fill:{ color:C.lGreen }, rectRadius:0.04 });
  s.addText("BRIGHT", { x:10.2, y:1.6, w:1.2, h:0.28, fontSize:8, bold:true, color:C.white, align:"center", fontFace:FF });

  // Chart bars in monitor
  const bars = [0.35, 0.55, 0.45, 0.7, 0.85, 0.68, 0.6, 0.75, 0.5, 0.8];
  bars.forEach((h, i) => {
    const bx = 7.85 + i * 0.46;
    const bh = h * 1.1;
    const by = 2.98 - bh + 0.12;
    s.addShape(pptx.ShapeType.rect, { x:bx, y:by, w:0.34, h:bh, fill:{ color:i === 6 ? C.blue : C.pale }, line:{ color:C.border||C.pale, width:0 } });
  });
  s.addShape(pptx.ShapeType.rect, { x:7.85, y:3.1, w:4.6, h:0.015, fill:{ color:C.pale } });
  s.addText("Light Intensity Over Time", { x:7.85, y:3.13, w:4.6, h:0.18, fontSize:7.5, color:C.muted, fontFace:FF, align:"center" });

  // Monitor stand
  s.addShape(pptx.ShapeType.rect, { x:9.6, y:4.3, w:0.45, h:0.45, fill:{ color:C.dgray }, line:{ color:C.dgray, width:0 } });
  s.addShape(pptx.ShapeType.rect, { x:9.05, y:4.72, w:1.55, h:0.12, fill:{ color:C.dgray }, line:{ color:C.dgray, width:0 } });

  // IoT device nodes below monitor
  const nodes = [["ESP32","📟",C.orange],["LDR","🔆",C.yellow],["LED","💡",C.mGreen],["Cloud","☁️",C.blue]];
  nodes.forEach(([lbl, icon, color], i) => {
    const nx = 7.7 + i * 1.35;
    s.addShape(pptx.ShapeType.roundRect, { x:nx, y:5.1, w:1.1, h:0.9, fill:{ color:C.vPale }, line:{ color:color, width:0.75 }, rectRadius:0.1 });
    s.addText(icon, { x:nx, y:5.12, w:1.1, h:0.42, fontSize:16, align:"center" });
    s.addText(lbl,  { x:nx, y:5.55, w:1.1, h:0.28, fontSize:9, bold:true, color:color, align:"center", fontFace:FF });
    if (i < 3) {
      s.addShape(pptx.ShapeType.rightArrow, { x:nx+1.1, y:5.44, w:0.24, h:0.18, fill:{ color:C.sky }, line:{ color:C.sky } });
    }
  });

  s.addText("System Performance: Reliable  ·  Uptime: 98 %  ·  Latency: 1.2 s", {
    x:7.5, y:6.2, w:5.6, h:0.28, fontSize:8.5, color:C.muted, align:"center", fontFace:FF, italic:true
  });

  // Tech stack row
  [["Next.js",C.navy],["ESP32",C.orange],["MongoDB",C.mGreen],["Vercel",C.sky],["REST",C.mid]].forEach(([t,c],i) => {
    const bx = 7.55 + i * 1.13;
    s.addShape(pptx.ShapeType.roundRect, { x:bx, y:6.65, w:1.0, h:0.3, fill:{ color:c }, rectRadius:0.05 });
    s.addText(t, { x:bx, y:6.65, w:1.0, h:0.3, fontSize:8.5, bold:true, color:C.white, align:"center", fontFace:FF });
  });

  s.addNotes("Welcome slide. Introduce the project title, the problem domain (smart lighting), and your team. Mention that this is a full-stack IoT project combining ESP32 hardware, a REST API, and a Next.js web dashboard. Point to the live Wokwi simulation and the deployed web application links shown at the bottom.");
}

// helper – plain rectangle (no radius)
function slide_rect(slide, x, y, w, h, color) {
  slide.addShape(pptx.ShapeType.rect, { x, y, w, h, fill:{ color }, line:{ color, width:0 } });
}

// ══════════════════════════════════════════════════════════════════════════════
// Slide 2 – Problem Statement
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s); hdr(s, 2, "Problem Statement"); ftr(s, 2);

  // Left: problem bullets
  s.addText("Why do we need this system?", { x:0.35, y:1.1, w:6.0, h:0.35, fontSize:13, bold:true, color:C.navy, fontFace:FF });
  divLine(s, 0.35, 1.45, 5.8, C.pale);

  const problems = [
    ["⚡", "Energy Wastage",       "Traditional lighting remains ON regardless of natural light levels, leading to unnecessary electricity consumption."],
    ["🔧", "Manual Operation",     "Occupants must physically switch lights ON/OFF, causing inconvenience and human error."],
    ["📉", "No Real-Time Monitor", "Facility managers have no visibility into current light conditions or historical usage patterns."],
    ["🤖", "Lack of Automation",   "No threshold-based logic exists to automatically adjust lighting based on ambient conditions."],
  ];
  problems.forEach(([icon, title, desc], i) => {
    const cy = 1.6 + i * 1.3;
    card(s, 0.35, cy, 6.1, 1.12, { fill:C.pRed, border:C.red, bw:0.5 });
    s.addShape(pptx.ShapeType.roundRect, { x:0.35, y:cy, w:0.72, h:1.12, fill:{ color:C.red }, line:{ color:C.red, width:0 }, rectRadius:0.1 });
    s.addShape(pptx.ShapeType.rect, { x:0.72, y:cy, w:0.35, h:1.12, fill:{ color:C.red }, line:{ color:C.red, width:0 } });
    s.addText(icon, { x:0.35, y:cy+0.24, w:0.72, h:0.55, fontSize:20, align:"center" });
    s.addText(title, { x:1.15, y:cy+0.1, w:5.1, h:0.32, fontSize:12, bold:true, color:C.red, fontFace:FF });
    s.addText(desc,  { x:1.15, y:cy+0.45, w:5.1, h:0.58, fontSize:10.5, color:C.body, fontFace:FF });
  });

  // Right: Comparison visual
  s.addText("System Comparison", { x:7.0, y:1.1, w:5.9, h:0.35, fontSize:13, bold:true, color:C.navy, fontFace:FF, align:"center" });
  divLine(s, 7.0, 1.45, 5.9, C.pale);

  // Traditional box
  card(s, 7.1, 1.6, 2.7, 4.65, { fill:C.pRed, border:C.red, bw:1 });
  slide_rect(s, 7.1, 1.6, 2.7, 0.42, C.red);
  s.addShape(pptx.ShapeType.roundRect, { x:7.1, y:1.6, w:2.7, h:0.42, fill:{ color:C.red }, line:{ color:C.red, width:0 }, rectRadius:0.1 });
  s.addShape(pptx.ShapeType.rect, { x:7.1, y:1.8, w:2.7, h:0.22, fill:{ color:C.red }, line:{ color:C.red, width:0 } });
  s.addText("Traditional System", { x:7.1, y:1.62, w:2.7, h:0.38, fontSize:11, bold:true, color:C.white, align:"center", fontFace:FF });
  const trad = ["💡 Always ON", "Manual switches only", "No data collection", "No remote access", "High energy bills", "No automation"];
  trad.forEach((t, i) => {
    s.addShape(pptx.ShapeType.ellipse, { x:7.3, y:2.2+i*0.52+0.08, w:0.12, h:0.12, fill:{ color:C.red } });
    s.addText(t, { x:7.5, y:2.2+i*0.52, w:2.2, h:0.38, fontSize:10.5, color:C.body, fontFace:FF });
  });
  s.addShape(pptx.ShapeType.roundRect, { x:7.25, y:5.85, w:2.4, h:0.3, fill:{ color:C.red }, rectRadius:0.05 });
  s.addText("⚠  Energy Wastage", { x:7.25, y:5.85, w:2.4, h:0.3, fontSize:10, bold:true, color:C.white, align:"center", fontFace:FF });

  // Arrow between
  s.addShape(pptx.ShapeType.rightArrow, { x:9.98, y:3.6, w:0.56, h:0.5, fill:{ color:C.sky }, line:{ color:C.sky } });

  // Smart box
  card(s, 10.65, 1.6, 2.4, 4.65, { fill:C.pGreen, border:C.mGreen, bw:1 });
  slide_rect(s, 10.65, 1.6, 2.4, 0.42, C.mGreen);
  s.addShape(pptx.ShapeType.roundRect, { x:10.65, y:1.6, w:2.4, h:0.42, fill:{ color:C.mGreen }, line:{ color:C.mGreen, width:0 }, rectRadius:0.1 });
  s.addShape(pptx.ShapeType.rect, { x:10.65, y:1.8, w:2.4, h:0.22, fill:{ color:C.mGreen }, line:{ color:C.mGreen, width:0 } });
  s.addText("Smart System", { x:10.65, y:1.62, w:2.4, h:0.38, fontSize:11, bold:true, color:C.white, align:"center", fontFace:FF });
  const smart = ["💡 Threshold-based", "Remote web control", "Real-time dashboard", "REST API driven", "Energy efficient", "Fully automated"];
  smart.forEach((t, i) => {
    s.addShape(pptx.ShapeType.ellipse, { x:10.82, y:2.2+i*0.52+0.08, w:0.12, h:0.12, fill:{ color:C.mGreen } });
    s.addText(t, { x:11.0, y:2.2+i*0.52, w:1.95, h:0.38, fontSize:10.5, color:C.body, fontFace:FF });
  });
  s.addShape(pptx.ShapeType.roundRect, { x:10.8, y:5.85, w:2.1, h:0.3, fill:{ color:C.mGreen }, rectRadius:0.05 });
  s.addText("✅  Saves Energy", { x:10.8, y:5.85, w:2.1, h:0.3, fontSize:10, bold:true, color:C.white, align:"center", fontFace:FF });

  s.addNotes("Explain the three core problems: (1) Traditional lighting wastes energy because there is no feedback from the environment. (2) Manual operation is inefficient and unreliable. (3) There is no monitoring or automation capability. The comparison on the right shows how our smart system addresses each of these. Use this slide to justify the need for the project.");
}

// ══════════════════════════════════════════════════════════════════════════════
// Slide 3 – Project Objectives
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s); hdr(s, 3, "Project Objectives"); ftr(s, 3);

  s.addText("Four clearly defined engineering objectives guide this project:", {
    x:0.35, y:1.05, w:12.6, h:0.32, fontSize:12, color:C.muted, fontFace:FF, italic:true
  });

  const objs = [
    { num:"01", icon:"🔆", color:C.yellow,  pColor:C.pYellow, title:"Measure Ambient Light",
      detail:"Use an LDR / BH750 photoresistor connected to the ESP32 ADC (12-bit, 0–4095 range) to continuously sense and convert ambient light intensity into a percentage (0–100 %).",
      tech:"ESP32  ·  LDR Sensor  ·  ADC" },
    { num:"02", icon:"💡", color:C.orange,  pColor:C.pOrange, title:"Automatic LED Control",
      detail:"Implement threshold-based logic so the LED turns ON when ambient light falls below the user-defined threshold and OFF when sufficient natural light is available.",
      tech:"GPIO  ·  Threshold Logic  ·  Auto/Manual Modes" },
    { num:"03", icon:"🖥️", color:C.blue,    pColor:C.vPale,   title:"Web-Based Dashboard",
      detail:"Build a Next.js web application providing real-time light readings, threshold configuration, analytics charts, history table, and system health metrics accessible from any browser.",
      tech:"Next.js  ·  React  ·  Tailwind CSS  ·  MongoDB" },
    { num:"04", icon:"🔗", color:C.mGreen,  pColor:C.pGreen,  title:"REST API Communication",
      detail:"Enable bidirectional communication between the ESP32 firmware and the web dashboard using HTTP REST endpoints — the device POSTs sensor data, the dashboard GETs state updates.",
      tech:"HTTP REST  ·  JSON  ·  Next.js API Routes" },
  ];

  objs.forEach((o, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = 0.35 + col * 6.55;
    const cy = 1.5  + row * 2.7;
    card(s, cx, cy, 6.2, 2.48, { fill:o.pColor, border:o.color, bw:0.75 });

    // Number badge
    s.addShape(pptx.ShapeType.roundRect, { x:cx+0.18, y:cy+0.18, w:0.68, h:0.68, fill:{ color:o.color }, line:{ color:o.color, width:0 }, rectRadius:0.1 });
    s.addText(o.num, { x:cx+0.18, y:cy+0.18, w:0.68, h:0.68, fontSize:18, bold:true, color:C.white, align:"center", valign:"middle", fontFace:FF });

    // Icon circle (right of badge)
    s.addShape(pptx.ShapeType.ellipse, { x:cx+0.98, y:cy+0.22, w:0.56, h:0.56, fill:{ color:C.white }, line:{ color:o.color, width:0.5 } });
    s.addText(o.icon, { x:cx+0.98, y:cy+0.22, w:0.56, h:0.56, fontSize:18, align:"center", valign:"middle" });

    // Title
    s.addText(o.title, { x:cx+1.65, y:cy+0.22, w:4.35, h:0.55, fontSize:14, bold:true, color:o.color, fontFace:FF });

    // Divider
    divLine(s, cx+0.18, cy+0.95, 5.84, o.color);

    // Description
    s.addText(o.detail, { x:cx+0.18, y:cy+1.05, w:5.84, h:0.95, fontSize:10.5, color:C.body, fontFace:FF });

    // Tech pills
    s.addShape(pptx.ShapeType.roundRect, { x:cx+0.18, y:cy+2.05, w:5.84, h:0.28, fill:{ color:o.color }, rectRadius:0.06 });
    s.addText(o.tech, { x:cx+0.28, y:cy+2.06, w:5.64, h:0.26, fontSize:9, color:C.white, fontFace:FF, bold:true });
  });

  s.addNotes("Walk through each of the four objectives. Objective 1 is about sensing: the LDR converts light to voltage, the ESP32 ADC reads it as 0–4095, then converts to percentage. Objective 2 is automation: the firmware compares the reading against the threshold and switches the LED. Objective 3 is the web app: a full Next.js dashboard with charts, controls, and analytics. Objective 4 is the communication layer: HTTP POST from device to cloud, GET from dashboard to cloud.");
}

// ══════════════════════════════════════════════════════════════════════════════
// Slide 4 – Scope
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s); hdr(s, 4, "Project Scope"); ftr(s, 4);

  // Left content
  s.addText("What this project covers:", { x:0.35, y:1.05, w:6.5, h:0.35, fontSize:13, bold:true, color:C.navy, fontFace:FF });
  divLine(s, 0.35, 1.4, 6.2, C.pale);

  const scope = [
    ["🏠", "Indoor Smart Lighting Prototype",       "Designed for single-room installation using Wokwi simulation; scalable to real environments."],
    ["⚡", "Threshold-Based Automation",            "LED responds automatically when ambient light crosses the configurable threshold set by the user."],
    ["📊", "Real-Time Web Monitoring",              "Dashboard polls sensor data every 2.5 s and history every 6 s, showing live charts and metrics."],
    ["🌐", "Web Application Control",              "Any browser can view and control the system — no native app required; responsive mobile layout."],
    ["🔬", "Simulation-Based Validation",          "Validated using Wokwi ESP32 simulator before hardware deployment — safe and repeatable testing."],
    ["📡", "Wi-Fi REST API Communication",          "ESP32 sends JSON payloads over HTTPS to Next.js API routes hosted on Vercel."],
  ];

  scope.forEach(([icon, title, desc], i) => {
    const cy = 1.52 + i * 0.93;
    card(s, 0.35, cy, 6.2, 0.82, { fill:C.vPale, border:C.pale, bw:0.5 });
    s.addShape(pptx.ShapeType.roundRect, { x:0.35, y:cy, w:0.7, h:0.82, fill:{ color:C.blue }, line:{ color:C.blue, width:0 }, rectRadius:0.1 });
    s.addShape(pptx.ShapeType.rect, { x:0.7, y:cy, w:0.35, h:0.82, fill:{ color:C.blue }, line:{ color:C.blue, width:0 } });
    s.addText(icon, { x:0.35, y:cy+0.17, w:0.7, h:0.45, fontSize:17, align:"center" });
    s.addText(title, { x:1.15, y:cy+0.06, w:5.2, h:0.3, fontSize:11.5, bold:true, color:C.navy, fontFace:FF });
    s.addText(desc,  { x:1.15, y:cy+0.38, w:5.2, h:0.38, fontSize:10, color:C.body, fontFace:FF });
  });

  // Right: Smart home illustration (geometric)
  s.addText("Application Domains", { x:7.1, y:1.05, w:5.85, h:0.35, fontSize:13, bold:true, color:C.navy, fontFace:FF, align:"center" });
  divLine(s, 7.1, 1.4, 5.85, C.pale);

  const domains = [
    ["🏠","Smart Homes",      C.blue,    "Automated residential lighting based on daylight."],
    ["🏢","Office Buildings", C.navy,    "Energy management in commercial spaces."],
    ["🏫","Classrooms",       C.mGreen,  "Adaptive lighting in educational institutions."],
    ["🏥","Hospitals",        C.orange,  "Consistent illumination for patient care areas."],
    ["🏭","Industrial",       C.yellow,  "Safety lighting in warehouses and factories."],
    ["🌆","Smart Campuses",   C.mid,     "Campus-wide IoT lighting infrastructure."],
  ];

  domains.forEach(([icon, name, color, desc], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const dx = 7.15 + col * 3.0;
    const dy = 1.55 + row * 1.8;
    card(s, dx, dy, 2.75, 1.58, { fill:C.white, border:color, bw:0.75 });
    slide_rect(s, dx, dy, 2.75, 0.35, color);
    s.addShape(pptx.ShapeType.roundRect, { x:dx, y:dy, w:2.75, h:0.35, fill:{ color }, line:{ color, width:0 }, rectRadius:0.1 });
    s.addShape(pptx.ShapeType.rect, { x:dx, y:dy+0.2, w:2.75, h:0.15, fill:{ color }, line:{ color, width:0 } });
    s.addText(icon + "  " + name, { x:dx+0.1, y:dy+0.04, w:2.55, h:0.28, fontSize:10.5, bold:true, color:C.white, fontFace:FF });
    s.addText(desc, { x:dx+0.12, y:dy+0.45, w:2.5, h:0.92, fontSize:10, color:C.body, fontFace:FF });
  });

  s.addNotes("Explain what is IN scope: single-room lighting, threshold automation, real-time web monitoring via REST API, and simulation-based testing. Also note what is OUT of scope: multi-room, MQTT, PCB hardware. The application domains on the right show how this prototype can be extended to real-world use cases.");
}

// ══════════════════════════════════════════════════════════════════════════════
// Slide 5 – General Architecture
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s); hdr(s, 5, "General Architecture"); ftr(s, 5);

  // Three top columns
  const cols = [
    { title:"A.  Software", color:C.blue, icon:"🖥️",
      sub: "Why Web Application?",
      items:["Accessible from any device","Real-time UI updates","Easy to scale & maintain","Cross-platform compatibility","JSON API integration","Next.js 16 + React 19","MongoDB Atlas database","Vercel serverless hosting"] },
    { title:"B.  Hardware", color:C.orange, icon:"📟",
      sub: "Why ESP32 & LDR?",
      items:["ESP32: Built-in Wi-Fi, low power","12-bit ADC (0–4095 range)","LDR: low cost, simple, analogue sensing","High performance, GPIO output","Wokwi simulator compatible","LED output on digital GPIO","Breadboard prototype","3.3V operating voltage"] },
    { title:"C.  Communication", color:C.mGreen, icon:"📡",
      sub: "Why REST API?",
      items:["Simple HTTP request/response","No broker required (vs MQTT)","Natively compatible with Next.js","Easy to debug with standard tools","JSON payload format","HTTPS over Wi-Fi","Stateless, scalable","Works behind firewalls"] },
  ];

  cols.forEach(({ title, color, icon, sub, items }, i) => {
    const cx = 0.3 + i * 4.36;
    bannerCard(s, cx, 1.08, 4.15, 4.35, color, 0.42);
    s.addText(icon + "  " + title, { x:cx+0.15, y:1.1, w:3.8, h:0.38, fontSize:12.5, bold:true, color:C.white, fontFace:FF });
    s.addShape(pptx.ShapeType.roundRect, { x:cx+0.15, y:1.56, w:3.8, h:0.26, fill:{ color:C.vPale }, rectRadius:0.04 });
    s.addText(sub, { x:cx+0.15, y:1.57, w:3.8, h:0.24, fontSize:9.5, bold:true, color:color, align:"center", fontFace:FF });
    items.forEach((item, j) => {
      s.addShape(pptx.ShapeType.ellipse, { x:cx+0.2, y:1.92+j*0.39+0.1, w:0.1, h:0.1, fill:{ color } });
      s.addText(item, { x:cx+0.4, y:1.92+j*0.39, w:3.6, h:0.36, fontSize:10, color:C.body, fontFace:FF });
    });
  });

  // Architecture flow diagram
  s.addText("System Architecture Flow", { x:0.3, y:5.58, w:12.73, h:0.32, fontSize:12, bold:true, color:C.navy, fontFace:FF, align:"center" });
  divLine(s, 0.3, 5.9, 12.73, C.pale);

  const arch = [
    { lbl:"LDR Sensor",    sub:"Analog voltage",     color:C.yellow,  icon:"🔆" },
    { lbl:"ESP32",         sub:"ADC + firmware",     color:C.orange,  icon:"📟" },
    { lbl:"REST API",      sub:"POST /api/light",    color:C.blue,    icon:"📡" },
    { lbl:"MongoDB",       sub:"lightState / data",  color:C.mGreen,  icon:"🗄️" },
    { lbl:"Web Dashboard", sub:"Next.js + React",    color:C.navy,    icon:"🖥️" },
    { lbl:"User Browser",  sub:"Real-time control",  color:C.mid,     icon:"👤" },
  ];

  arch.forEach(({ lbl, sub, color, icon }, i) => {
    const bx = 0.38 + i * 2.15;
    card(s, bx, 6.0, 1.9, 1.12, { fill:C.vPale, border:color, bw:0.75 });
    s.addText(icon, { x:bx, y:6.02, w:1.9, h:0.42, fontSize:18, align:"center" });
    s.addText(lbl,  { x:bx+0.05, y:6.46, w:1.8, h:0.26, fontSize:9.5, bold:true, color:color, align:"center", fontFace:FF });
    s.addText(sub,  { x:bx+0.05, y:6.72, w:1.8, h:0.22, fontSize:8.5, color:C.muted, align:"center", fontFace:FF });
    if (i < arch.length - 1) {
      s.addShape(pptx.ShapeType.rightArrow, { x:bx+1.9, y:6.47, w:0.24, h:0.18, fill:{ color:C.sky }, line:{ color:C.sky } });
    }
  });

  s.addNotes("Explain the three layers of the architecture. Software: Next.js web app handles both the frontend dashboard and backend API routes. Hardware: ESP32 reads the LDR via ADC and controls the LED GPIO. Communication: HTTP REST over Wi-Fi is used because it requires no broker, integrates naturally with Next.js, and is easy to debug. The flow diagram at the bottom shows the end-to-end data path from sensor to browser.");
}

// ══════════════════════════════════════════════════════════════════════════════
// Slide 6 – Working Principle
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s); hdr(s, 6, "Working Principle"); ftr(s, 6);

  // 6-step flow
  const steps = [
    { n:"1", icon:"🔆", title:"LDR Senses Light",      desc:"Photoresistor voltage changes with ambient illumination",           color:C.yellow },
    { n:"2", icon:"📟", title:"ESP32 Reads ADC",        desc:"12-bit ADC samples the LDR: raw value 0–4095",                    color:C.orange },
    { n:"3", icon:"🔢", title:"ADC Converts Value",     desc:"value% = (4095−raw)/4095 × 100 → percentage 0–100",              color:C.mid },
    { n:"4", icon:"⚖️", title:"Compare with Threshold", desc:"If value ≥ threshold → status = Bright, else status = Dark",     color:C.blue },
    { n:"5", icon:"💡", title:"LED ON / OFF Control",   desc:"Auto mode: LED ON when Dark; OFF when Bright. Manual overrides.", color:C.mGreen },
    { n:"6", icon:"📡", title:"Data Sent via REST API", desc:"ESP32 POSTs JSON to /api/light every ~2 s; dashboard polls",     color:C.navy },
  ];

  steps.forEach(({ n, icon, title, desc, color }, i) => {
    const bx = 0.3 + i * 2.16;
    // Connector line
    if (i > 0) {
      s.addShape(pptx.ShapeType.rect, { x:bx-0.14, y:2.1, w:0.14, h:0.04, fill:{ color:C.sky } });
    }
    // Step box
    card(s, bx, 1.2, 2.0, 2.6, { fill:C.vPale, border:color, bw:1 });
    // Top color header
    slide_rect(s, bx, 1.2, 2.0, 0.42, color);
    s.addShape(pptx.ShapeType.roundRect, { x:bx, y:1.2, w:2.0, h:0.42, fill:{ color }, line:{ color, width:0 }, rectRadius:0.1 });
    s.addShape(pptx.ShapeType.rect, { x:bx, y:1.4, w:2.0, h:0.22, fill:{ color }, line:{ color, width:0 } });
    s.addText("STEP " + n, { x:bx, y:1.22, w:2.0, h:0.38, fontSize:10.5, bold:true, color:C.white, align:"center", fontFace:FF });
    // Icon
    s.addText(icon, { x:bx, y:1.65, w:2.0, h:0.55, fontSize:26, align:"center" });
    // Title
    s.addText(title, { x:bx+0.1, y:2.23, w:1.8, h:0.45, fontSize:10.5, bold:true, color, align:"center", fontFace:FF });
    // Desc
    s.addText(desc,  { x:bx+0.1, y:2.7, w:1.8, h:0.85, fontSize:9.5, color:C.body, align:"center", fontFace:FF });
    // Arrow (except last)
    if (i < steps.length - 1) {
      s.addShape(pptx.ShapeType.rightArrow, { x:bx+2.0, y:2.07, w:0.15, h:0.25, fill:{ color:C.sky }, line:{ color:C.sky } });
    }
  });

  // Threshold logic diagram
  s.addText("Threshold Decision Logic", { x:0.3, y:4.0, w:7.5, h:0.34, fontSize:12, bold:true, color:C.navy, fontFace:FF });
  divLine(s, 0.3, 4.34, 7.3, C.pale);

  // ADC range bar
  s.addShape(pptx.ShapeType.rect, { x:0.5, y:4.55, w:6.8, h:0.45, fill:{ color:C.pRed }, line:{ color:C.red, width:0.5 } });
  s.addShape(pptx.ShapeType.rect, { x:0.5+6.8*0.4, y:4.55, w:6.8*0.6, h:0.45, fill:{ color:C.pGreen }, line:{ color:C.mGreen, width:0.5 } });
  // Threshold marker
  s.addShape(pptx.ShapeType.rect, { x:0.5+6.8*0.4-0.04, y:4.42, w:0.08, h:0.7, fill:{ color:C.blue }, line:{ color:C.blue, width:0 } });
  s.addShape(pptx.ShapeType.downArrow, { x:0.5+6.8*0.4-0.1, y:4.35, w:0.2, h:0.22, fill:{ color:C.blue }, line:{ color:C.blue } });
  s.addText("Threshold (40 %)", { x:0.5+6.8*0.4-0.9, y:4.15, w:1.8, h:0.22, fontSize:9, bold:true, color:C.blue, align:"center", fontFace:FF });

  s.addText("0 (Dark)",     { x:0.5, y:5.05, w:1.2, h:0.24, fontSize:9.5, color:C.red, fontFace:FF, bold:true });
  s.addText("LED → ON",     { x:1.5, y:5.05, w:2.2, h:0.24, fontSize:9.5, color:C.red, fontFace:FF });
  s.addText("100 (Bright)", { x:6.2, y:5.05, w:1.4, h:0.24, fontSize:9.5, color:C.mGreen, fontFace:FF, bold:true, align:"right" });
  s.addText("LED → OFF",    { x:4.6, y:5.05, w:1.5, h:0.24, fontSize:9.5, color:C.mGreen, fontFace:FF, align:"right" });

  // LED modes table
  card(s, 0.3, 5.45, 7.4, 1.6, { fill:C.vPale, border:C.pale });
  s.addText("LED Mode Decision Table", { x:0.45, y:5.52, w:7.1, h:0.28, fontSize:11, bold:true, color:C.navy, fontFace:FF });
  const modeRows = [["Mode","Condition","LED Status","Use Case"],
    ["auto","value ≥ threshold","OFF","Normal energy-saving"],
    ["auto","value < threshold","ON","Room too dark"],
    ["on","(any)","ON","Force on override"],
    ["off","(any)","OFF","Force off override"]];
  modeRows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const rx = 0.45 + ci * 1.82;
      const ry = 5.85 + ri * 0.31;
      const isHdr = ri === 0;
      const textColor = isHdr ? C.white : (ci===2 ? (cell==="ON" ? C.mGreen : cell==="OFF" ? C.red : C.body) : C.body);
      if (isHdr) {
        slide_rect(s, rx-0.05, ry, 1.82, 0.28, C.blue);
      }
      s.addText(cell, { x:rx, y:ry+0.02, w:1.7, h:0.26, fontSize:9.5, bold:isHdr||ci===2, color:isHdr?C.white:textColor, fontFace:FF });
    });
  });

  // Right side: ADC visualisation
  s.addText("ADC Range Visualisation", { x:8.0, y:4.0, w:5.0, h:0.34, fontSize:12, bold:true, color:C.navy, fontFace:FF, align:"center" });
  divLine(s, 8.0, 4.34, 5.0, C.pale);

  const adcBars = [
    { label:"Very Dark",   val:8,  color:C.red },
    { label:"Dim",         val:25, color:C.orange },
    { label:"Balanced",    val:50, color:C.yellow },
    { label:"Bright",      val:72, color:C.lGreen },
    { label:"Very Bright", val:95, color:C.mGreen },
  ];
  adcBars.forEach(({ label, val, color }, i) => {
    const by = 4.55 + i * 0.52;
    s.addText(label,          { x:8.05, y:by+0.1, w:1.35, h:0.28, fontSize:9.5, color:C.body, fontFace:FF });
    s.addShape(pptx.ShapeType.rect, { x:9.45, y:by+0.06, w:val*0.033, h:0.32, fill:{ color }, line:{ color, width:0 } });
    s.addText(val + "%",      { x:9.45+val*0.033+0.05, y:by+0.1, w:0.5, h:0.28, fontSize:9.5, color, fontFace:FF, bold:true });
  });

  s.addNotes("Walk through the 6 steps in order. Emphasise step 3 — the ADC conversion formula. Step 4 is the threshold comparison — this is the core of the automation. The threshold bar diagram shows the cutoff point visually. The mode table on the bottom-left explains how ledMode (auto/on/off) interacts with the threshold. The ADC range bars on the right map raw percentage values to human-readable intensity labels.");
}

// ══════════════════════════════════════════════════════════════════════════════
// Slide 7 – Performance & Results
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s); hdr(s, 7, "Performance & Results"); ftr(s, 7);

  s.addText("System performed reliably in simulation with real-time monitoring and automated control.",
    { x:0.35, y:1.04, w:12.6, h:0.3, fontSize:11.5, color:C.muted, fontFace:FF, italic:true, align:"center" });

  // KPI cards — row 1
  const kpis = [
    { val:"1.2",  unit:"seconds",    lbl:"API Latency",         color:C.blue    },
    { val:"1 Hz", unit:"per second", lbl:"Sensor Update Rate",  color:C.mid     },
    { val:"300",  unit:"ms",         lbl:"LED Response Delay",  color:C.orange  },
    { val:"98%",  unit:"success",    lbl:"Packet Success Rate", color:C.mGreen  },
    { val:"4–6",  unit:"seconds",    lbl:"Wi-Fi Reconnection",  color:C.navy    },
    { val:"±2%",  unit:"variation",  lbl:"ADC Accuracy",        color:C.yellow  },
  ];
  kpis.forEach(({ val, unit, lbl, color }, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    kpiCard(s, 0.35 + col * 2.22, 1.45 + row * 1.35, 2.0, 1.22, val, unit, lbl, color);
  });

  // Performance bar chart (visual)
  s.addText("Performance Overview", { x:7.0, y:1.04, w:5.9, h:0.32, fontSize:12, bold:true, color:C.navy, fontFace:FF, align:"center" });

  const perfData = [
    { label:"Packet\nSuccess",  val:98, max:100, color:C.mGreen  },
    { label:"ADC\nAccuracy",    val:98, max:100, color:C.blue     },
    { label:"System\nUptime",   val:96, max:100, color:C.mid      },
    { label:"Threshold\nAdh.",  val:94, max:100, color:C.orange   },
    { label:"Avg\nIntensity",   val:68, max:100, color:C.yellow   },
  ];

  const chartBase = { x: 7.1, y: 1.5, barW: 0.88, gap: 0.18, maxH: 3.6 };
  // Y axis
  slide_rect(s, chartBase.x, chartBase.y, 0.025, chartBase.maxH, C.dgray);
  // X axis
  slide_rect(s, chartBase.x, chartBase.y + chartBase.maxH, 5.9, 0.025, C.dgray);

  // Grid lines
  [25, 50, 75, 100].forEach(v => {
    const gy = chartBase.y + chartBase.maxH * (1 - v/100);
    slide_rect(s, chartBase.x+0.03, gy, 5.85, 0.012, C.gray);
    s.addText(v + "%", { x:chartBase.x+0.05, y:gy-0.13, w:0.55, h:0.25, fontSize:8, color:C.muted, fontFace:FF, align:"right" });
  });

  perfData.forEach(({ label, val, color }, i) => {
    const bx = chartBase.x + 0.65 + i * (chartBase.barW + chartBase.gap);
    const bh = (val / 100) * chartBase.maxH;
    const by = chartBase.y + chartBase.maxH - bh;
    // Shadow
    slide_rect(s, bx+0.04, by+0.04, chartBase.barW, bh, C.gray);
    // Bar
    slide_rect(s, bx, by, chartBase.barW, bh, color);
    // Value label on bar
    s.addText(val + "%", { x:bx, y:by-0.28, w:chartBase.barW, h:0.26, fontSize:10.5, bold:true, color, align:"center", fontFace:FF });
    // Category label
    s.addText(label, { x:bx-0.1, y:chartBase.y+chartBase.maxH+0.06, w:chartBase.barW+0.2, h:0.42, fontSize:8.5, color:C.body, align:"center", fontFace:FF });
  });

  // Dashboard mockup strip at bottom
  card(s, 0.35, 5.45, 12.6, 1.65, { fill:C.vPale, border:C.pale });
  slide_rect(s, 0.35, 5.45, 12.6, 0.35, C.navy);
  s.addShape(pptx.ShapeType.roundRect, { x:0.35, y:5.45, w:12.6, h:0.35, fill:{ color:C.navy }, line:{ color:C.navy, width:0 }, rectRadius:0.1 });
  s.addShape(pptx.ShapeType.rect, { x:0.35, y:5.62, w:12.6, h:0.18, fill:{ color:C.navy }, line:{ color:C.navy, width:0 } });
  s.addText("📊  Live Dashboard Data Snapshot — Simulation Results", { x:0.5, y:5.47, w:12.3, h:0.3, fontSize:10.5, bold:true, color:C.white, fontFace:FF });

  const snapshots = [
    ["Current Intensity","68%",C.blue],["Threshold","40%",C.sky],["Status","BRIGHT",C.mGreen],
    ["LED State","OFF",C.mGreen],["Source","Device",C.orange],["Device","ESP32-Wokwi",C.navy],
  ];
  snapshots.forEach(([lbl, val, color], i) => {
    const sx = 0.6 + i * 2.1;
    s.addText(lbl, { x:sx, y:5.9, w:1.9, h:0.22, fontSize:8, color:C.muted, fontFace:FF });
    s.addText(val, { x:sx, y:6.12, w:1.9, h:0.35, fontSize:13.5, bold:true, color, fontFace:FF });
  });
  s.addText("✔  System performed reliably with 98% packet success rate and sub-second LED response", {
    x:0.6, y:6.65, w:12.1, h:0.3, fontSize:10, color:C.muted, fontFace:FF, italic:true, align:"center"
  });

  s.addNotes("Present the measured performance results. Key highlights: 98% packet success rate confirms reliable Wi-Fi communication; LED response of 300 ms is well within the 1-second acceptable threshold; API latency of 1.2 seconds is caused by polling interval, not network delay. The bar chart shows all percentage-based metrics above 90%, which is excellent. The data snapshot at the bottom shows a representative reading captured during simulation testing.");
}

// ══════════════════════════════════════════════════════════════════════════════
// Slide 8 – Drawbacks / Limitations
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s); hdr(s, 8, "Drawbacks / Limitations"); ftr(s, 8);

  s.addText("Honest assessment of current limitations for academic review:", {
    x:0.35, y:1.04, w:12.6, h:0.3, fontSize:11.5, color:C.muted, fontFace:FF, italic:true
  });

  const limits = [
    { icon:"📶", title:"Wi-Fi Dependency",           desc:"System requires stable Wi-Fi. Any network dropout causes sensor data loss and breaks real-time monitoring until reconnection (4–6 s).",    color:C.orange },
    { icon:"〰️", title:"No Hysteresis Control",      desc:"Without hysteresis dead-band logic, the LED may flicker rapidly when light intensity oscillates near the threshold boundary.",              color:C.red    },
    { icon:"🔊", title:"LDR Sensor Noise",            desc:"The LDR exhibits ±2% ADC noise due to electrical interference. A digital BH750 lux sensor would provide more accurate and stable readings.", color:C.yellow },
    { icon:"🔒", title:"Limited Security",            desc:"REST endpoints do not implement TLS certificate pinning or device-level API key authentication. Suitable for prototype; not production.",    color:C.mid    },
    { icon:"🖥️", title:"Simulation Only",            desc:"All testing performed in Wokwi. Real hardware may show different ADC characteristics, Wi-Fi signal strength, and timing behaviour.",         color:C.navy   },
    { icon:"💾", title:"No Persistent Config",        desc:"Threshold and LED mode settings reset to defaults on ESP32 reboot. These should be stored in EEPROM/NVS for persistent configuration.",     color:C.blue   },
  ];

  limits.forEach(({ icon, title, desc, color }, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = 0.35 + col * 6.5;
    const cy = 1.45 + row * 1.85;
    card(s, cx, cy, 6.15, 1.68, { fill:C.pYellow, border:color, bw:0.75 });
    // Warning stripe
    slide_rect(s, cx, cy, 0.62, 1.68, color);
    s.addShape(pptx.ShapeType.roundRect, { x:cx, y:cy, w:0.62, h:1.68, fill:{ color }, line:{ color, width:0 }, rectRadius:0.1 });
    s.addShape(pptx.ShapeType.rect, { x:cx+0.48, y:cy, w:0.14, h:1.68, fill:{ color }, line:{ color, width:0 } });
    s.addText(icon, { x:cx+0.04, y:cy+0.42, w:0.54, h:0.55, fontSize:18, align:"center" });
    // Warning badge
    s.addShape(pptx.ShapeType.roundRect, { x:cx+0.76, y:cy+0.1, w:0.55, h:0.25, fill:{ color }, rectRadius:0.04 });
    s.addText("⚠", { x:cx+0.76, y:cy+0.1, w:0.55, h:0.25, fontSize:9, color:C.white, align:"center", fontFace:FF });
    s.addText(title, { x:cx+1.38, y:cy+0.08, w:4.62, h:0.32, fontSize:12, bold:true, color, fontFace:FF });
    s.addText(desc,  { x:cx+0.78, y:cy+0.48, w:5.22, h:0.95, fontSize:10.5, color:C.body, fontFace:FF });
  });

  // Bottom note
  card(s, 0.35, 7.02, 12.6, 0.32, { fill:C.pOrange, border:C.orange, bw:0.5 });
  s.addText("📌  Note: All limitations above have identified solutions — see Slide 9 (Future Improvements) for the roadmap.",
    { x:0.55, y:7.04, w:12.2, h:0.28, fontSize:10, color:C.orange, fontFace:FF, bold:true });

  s.addNotes("Be transparent about each limitation. The most critical ones for academic review are: (1) hysteresis — explain what it is (a dead-band to prevent rapid switching near the threshold), (2) security — the REST API uses no device authentication, and (3) simulation-only validation. Emphasise that these are known limitations with planned solutions, not design failures. The note at the bottom links to the next slide's roadmap.");
}

// ══════════════════════════════════════════════════════════════════════════════
// Slide 9 – Future Improvements
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s); hdr(s, 9, "Future Improvements"); ftr(s, 9);

  s.addText("Planned enhancements to evolve this prototype into a production-ready system:", {
    x:0.35, y:1.04, w:12.6, h:0.3, fontSize:11.5, color:C.muted, fontFace:FF, italic:true
  });

  const improvements = [
    { n:1, icon:"📨", color:C.orange, title:"MQTT Integration",           desc:"Replace REST polling with MQTT pub/sub via HiveMQ broker for near-instant (<100 ms) device-to-cloud push messaging." },
    { n:2, icon:"📱", color:C.blue,   title:"Mobile Application",         desc:"Build a React Native (Android/iOS) companion app with push notifications for threshold breach alerts." },
    { n:3, icon:"🔲", color:C.navy,   title:"PCB Hardware Design",         desc:"Replace breadboard prototype with a custom PCB using KiCad — includes proper pull-down resistors and voltage regulation." },
    { n:4, icon:"🤖", color:C.mGreen, title:"Machine Learning Analytics", desc:"Train a time-series model to predict light patterns and pre-schedule LED control, reducing sensor read frequency." },
    { n:5, icon:"🔒", color:C.red,    title:"TLS / JWT Security",         desc:"Add TLS certificate pinning on ESP32 and JWT-based API authentication for secure device-to-cloud communication." },
    { n:6, icon:"🏢", color:C.mid,    title:"Multi-Room Scalability",      desc:"Extend the dashboard to manage multiple ESP32 nodes across rooms with a device registry and floor-plan view." },
    { n:7, icon:"📐", color:C.yellow, title:"Sensor Calibration",         desc:"Implement per-device lux calibration using a reference BH750 sensor to normalise readings across hardware units." },
  ];

  const colItems = [improvements.slice(0, 4), improvements.slice(4)];
  colItems.forEach((col, ci) => {
    col.forEach(({ n, icon, color, title, desc }, i) => {
      const cy = 1.45 + i * 1.38;
      const cx = ci === 0 ? 0.35 : 7.0;
      const cw = ci === 0 ? 6.3 : 6.0;
      card(s, cx, cy, cw, 1.22, { fill:C.vPale, border:color, bw:0.75 });
      // Number circle
      s.addShape(pptx.ShapeType.ellipse, { x:cx+0.18, y:cy+0.25, w:0.52, h:0.52, fill:{ color } });
      s.addText(n.toString(), { x:cx+0.18, y:cy+0.25, w:0.52, h:0.52, fontSize:14, bold:true, color:C.white, align:"center", valign:"middle", fontFace:FF });
      // Icon badge
      s.addShape(pptx.ShapeType.roundRect, { x:cx+0.82, y:cy+0.28, w:0.48, h:0.48, fill:{ color:C.white }, line:{ color, width:0.5 }, rectRadius:0.06 });
      s.addText(icon, { x:cx+0.82, y:cy+0.28, w:0.48, h:0.48, fontSize:16, align:"center", valign:"middle" });
      // Content
      s.addText(title, { x:cx+1.42, y:cy+0.1, w:cw-1.55, h:0.32, fontSize:12, bold:true, color, fontFace:FF });
      s.addText(desc,  { x:cx+1.42, y:cy+0.46, w:cw-1.55, h:0.65, fontSize:10, color:C.body, fontFace:FF });
    });
  });

  // Priority badge at top-right
  card(s, 10.7, 1.08, 2.28, 0.56, { fill:C.pGreen, border:C.mGreen, bw:0.75 });
  s.addText("🚀  Priority: MQTT  +  Security  +  PCB", { x:10.75, y:1.13, w:2.18, h:0.46, fontSize:9, bold:true, color:C.green, fontFace:FF });

  s.addNotes("Discuss the roadmap. Prioritise: (1) MQTT for real-time push, eliminating polling overhead; (2) TLS/JWT for security before any real deployment; (3) PCB design to replace the breadboard prototype. Machine learning and mobile apps are medium-term. Multi-room scalability is a long-term goal. Sensor calibration should happen as soon as real hardware is tested. This shows the examiner that you have thought beyond the prototype stage.");
}

// ══════════════════════════════════════════════════════════════════════════════
// Slide 10 – Conclusion
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();

  // Split background
  slide_rect(s, 0, 0, SW, SH, C.white);
  slide_rect(s, 7.3, 0, SW-7.3, SH, C.vPale);

  // Top accent
  slide_rect(s, 0, 0, SW, 0.06, C.sky);
  // Header
  slide_rect(s, 0, 0.06, SW, 0.84, C.navy);
  s.addShape(pptx.ShapeType.ellipse, { x:0.28, y:0.17, w:0.52, h:0.52, fill:{ color:C.sky }, line:{ color:C.white, width:0.5 } });
  s.addText("10", { x:0.28, y:0.17, w:0.52, h:0.52, fontSize:15, bold:true, color:C.navy, align:"center", valign:"middle", fontFace:FF });
  s.addText("Conclusion", { x:0.96, y:0.1, w:11.7, h:0.66, fontSize:22, bold:true, color:C.white, fontFace:FF, valign:"middle" });

  ftr(s, 10);

  // Left: conclusion points
  s.addText("Project Summary", { x:0.4, y:1.05, w:6.6, h:0.38, fontSize:14, bold:true, color:C.navy, fontFace:FF });
  divLine(s, 0.4, 1.43, 6.6, C.pale);

  const conclusions = [
    { icon:"✅", color:C.mGreen,  title:"Successful Smart Lighting Automation",
      desc:"The system reliably automates LED control based on real-time ambient light readings, demonstrating energy-efficient smart lighting without manual intervention." },
    { icon:"🔗", color:C.blue,   title:"Reliable ESP32 + REST API Integration",
      desc:"Bidirectional communication between ESP32 firmware and Next.js API routes achieves 98% packet success rate with sub-1-second API latency over Wi-Fi." },
    { icon:"📊", color:C.mid,    title:"Real-Time Monitoring Achieved",
      desc:"The web dashboard provides live charts, KPI analytics, history tables, and system health metrics — all updating automatically every 2.5 seconds." },
    { icon:"🌆", color:C.navy,   title:"Foundation for Smart Environments",
      desc:"This prototype demonstrates a scalable architecture suitable for expansion to smart homes, classrooms, campuses, and commercial buildings." },
  ];
  conclusions.forEach(({ icon, color, title, desc }, i) => {
    const cy = 1.55 + i * 1.35;
    card(s, 0.35, cy, 6.6, 1.22, { fill:C.vPale, border:color, bw:0.75 });
    s.addShape(pptx.ShapeType.roundRect, { x:0.35, y:cy, w:0.65, h:1.22, fill:{ color }, line:{ color, width:0 }, rectRadius:0.1 });
    s.addShape(pptx.ShapeType.rect, { x:0.65, y:cy, w:0.35, h:1.22, fill:{ color }, line:{ color, width:0 } });
    s.addText(icon, { x:0.35, y:cy+0.3, w:0.65, h:0.55, fontSize:20, align:"center" });
    s.addText(title, { x:1.1, y:cy+0.08, w:5.7, h:0.35, fontSize:12, bold:true, color, fontFace:FF });
    s.addText(desc,  { x:1.1, y:cy+0.48, w:5.7, h:0.65, fontSize:10.5, color:C.body, fontFace:FF });
  });

  // Right: project summary cards + links
  s.addText("Project At a Glance", { x:7.5, y:1.05, w:5.5, h:0.38, fontSize:14, bold:true, color:C.navy, fontFace:FF, align:"center" });
  divLine(s, 7.5, 1.43, 5.5, C.pale);

  // Stat cards
  const stats = [
    ["98%",  "Packet Success Rate",   C.mGreen ],
    ["1.2s", "API Latency",          C.blue   ],
    ["300ms","LED Response",          C.orange ],
    ["2.5s", "Dashboard Refresh",    C.mid    ],
  ];
  stats.forEach(([val, lbl, color], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = 7.55 + col * 2.75;
    const sy = 1.55 + row * 1.05;
    card(s, sx, sy, 2.5, 0.88, { fill:C.white, border:color, bw:1 });
    s.addText(val, { x:sx, y:sy+0.06, w:2.5, h:0.42, fontSize:22, bold:true, color, align:"center", fontFace:FF });
    s.addText(lbl, { x:sx, y:sy+0.52, w:2.5, h:0.28, fontSize:9, color:C.muted, align:"center", fontFace:FF });
  });

  // Tech stack used
  s.addText("Technologies Used", { x:7.5, y:3.78, w:5.5, h:0.3, fontSize:11, bold:true, color:C.navy, fontFace:FF, align:"center" });
  const techs = [["ESP32","📟",C.orange],["LDR","🔆",C.yellow],["Next.js","⚛",C.navy],
                 ["MongoDB","🗄️",C.mGreen],["REST","📡",C.blue],["Vercel","🚀",C.mid]];
  techs.forEach(([name, icon, color], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const tx = 7.55 + col * 1.85;
    const ty = 4.15 + row * 0.9;
    card(s, tx, ty, 1.65, 0.75, { fill:C.white, border:color, bw:0.75 });
    s.addText(icon, { x:tx, y:ty+0.04, w:0.55, h:0.55, fontSize:16, align:"center" });
    s.addText(name, { x:tx+0.52, y:ty+0.12, w:1.05, h:0.5, fontSize:11, bold:true, color, fontFace:FF, valign:"middle" });
  });

  // Links
  card(s, 7.45, 5.98, 5.6, 0.78, { fill:C.navy, border:C.navy });
  s.addText("🔗  Project Links", { x:7.6, y:6.04, w:5.3, h:0.25, fontSize:10, bold:true, color:C.sky, fontFace:FF });
  s.addText("Wokwi Simulation:  wokwi.com/projects/464159002953560065", { x:7.6, y:6.3, w:5.3, h:0.2, fontSize:9, color:C.pale, fontFace:FF });
  s.addText("Web Dashboard:  ietp-prototype.vercel.app/light",          { x:7.6, y:6.5, w:5.3, h:0.2, fontSize:9, color:C.pale, fontFace:FF });

  // Thank you text
  s.addText("Thank You", { x:0.35, y:7.0, w:6.6, h:0.3, fontSize:15, bold:true, color:C.navy, align:"center", fontFace:FF, italic:true });

  s.addNotes("Deliver a strong, confident conclusion. Summarise the four main achievements: (1) working threshold-based automation, (2) reliable REST API communication, (3) real-time web monitoring, (4) scalable architecture. Quote the 98% success rate as evidence of reliability. Invite questions, and if asked, you can demonstrate the live dashboard at ietp-prototype.vercel.app/light or show the Wokwi simulation.");
}

// ── Write ──────────────────────────────────────────────────────────────────────
pptx.writeFile({ fileName: "IETP_Presentation.pptx" })
  .then(() => console.log("✅  IETP_Presentation.pptx created successfully."))
  .catch(err => { console.error("Error:", err); process.exit(1); });
