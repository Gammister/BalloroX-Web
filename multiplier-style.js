/* Permanent field multiplier typography. Presentation only. */
(() => {
  const suffixFonts = new Map();

  function getSuffixFont(context, font, size) {
    const key = `${font}|${context.textBaseline}`;
    if (suffixFonts.has(key)) return suffixFonts.get(key);
    const digit = context.measureText("0");
    context.font = font.replace(/^[\d]+\s+/, "500 ");
    const glyph = context.measureText("x");
    const digitHeight = digit.actualBoundingBoxAscent + digit.actualBoundingBoxDescent;
    const glyphHeight = glyph.actualBoundingBoxAscent + glyph.actualBoundingBoxDescent;
    // Match visible glyph height rather than em size (x-height is naturally lower).
    const scale = digitHeight > 0 && glyphHeight > 0 ? 0.58 * digitHeight / glyphHeight : 0.58;
    const suffixFont = context.font.replace(/[\d.]+px/, `${size * scale}px`);
    context.font = suffixFont;
    const suffixMetrics = context.measureText("x");
    const center = (suffixMetrics.actualBoundingBoxDescent - suffixMetrics.actualBoundingBoxAscent) / 2;
    context.font = font;
    if (suffixFonts.size >= 128) suffixFonts.delete(suffixFonts.keys().next().value);
    suffixFonts.set(key, { font: suffixFont, scale, center });
    return suffixFonts.get(key);
  }

  function draw(context, method, text, x, y) {
    const match = String(text).match(/^([\d.,]+)x$/i);
    const font = context.font;
    const size = Number.parseFloat(font.match(/([\d.]+)px/)?.[1]);
    if (!match || !size) {
      context[method](text, x, y);
      return;
    }
    const number = match[1];
    context.save();
    const suffix = getSuffixFont(context, font, size);
    const numberMetrics = context.measureText(number);
    const numberWidth = numberMetrics.width;
    const numberCenter = (numberMetrics.actualBoundingBoxDescent - numberMetrics.actualBoundingBoxAscent) / 2;
    // Align the visible glyph centers; a shared text baseline does not do this.
    const centerOffset = Number.isFinite(numberCenter - suffix.center) ? numberCenter - suffix.center : 0;
    context.font = suffix.font;
    const suffixWidth = context.measureText("x").width;
    const gap = size * 0.025;
    const width = numberWidth + suffixWidth + gap;
    const left = context.textAlign === "center" ? x - width / 2
      : ["right", "end"].includes(context.textAlign) ? x - width : x;
    context.textAlign = "left";
    context.font = font;
    context[method](number, left, y);
    context.font = suffix.font;
    // Scale the outline with the smaller glyph, preserving the number's outline.
    context.lineWidth *= Math.min(1, suffix.scale);
    context[method]("x", left + numberWidth + gap, y + centerOffset);
    context.restore();
  }

  window.BalloroMultiplierStyle = { draw };
})();
