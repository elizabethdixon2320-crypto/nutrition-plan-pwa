(function () {
  "use strict";

  function roundChartValue(value, digits = 1) {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function formatChartNumber(value, digits = 0) {
    return new Intl.NumberFormat("zh-CN", {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0
    }).format(value);
  }

  function chartShortDate(dateKey) {
    const [, month, day] = dateKey.split("-");
    return `${Number(month)}/${Number(day)}`;
  }

  function renderWeightChart(weights) {
    const data = weights.slice(-10);
    const width = 400;
    const height = 230;
    const pad = { left: 22, right: 22, top: 26, bottom: 32 };
    const values = data.map((item) => Number(item.value));
    const min = Math.min(...values) - 0.18;
    const max = Math.max(...values) + 0.18;
    const range = Math.max(max - min, 0.5);
    const xStep = (width - pad.left - pad.right) / Math.max(data.length - 1, 1);
    const yFor = (value) => pad.top + ((max - value) / range) * (height - pad.top - pad.bottom);
    const points = data.map((item, index) => ({
      x: pad.left + index * xStep,
      y: yFor(item.value),
      ...item
    }));
    const path = points
      .map((point, index) => `${index ? "L" : "M"} ${roundChartValue(point.x)} ${roundChartValue(point.y)}`)
      .join(" ");
    const gridLines = [0.2, 0.5, 0.8].map((ratio) => {
      const y = pad.top + ratio * (height - pad.top - pad.bottom);
      return `<line class="chart-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" />`;
    }).join("");
    const pointNodes = points.map((point, index) => `
      <circle class="chart-point ${index === points.length - 1 ? "last" : ""}" cx="${point.x}" cy="${point.y}" r="${index === points.length - 1 ? 4.5 : 3.4}" />
    `).join("");
    const labelNodes = points.map((point, index) => (
      index % 2 === 0 || index === points.length - 1
        ? `<text class="chart-label" x="${point.x}" y="${height - 8}" text-anchor="middle">${chartShortDate(point.date)}</text>`
        : ""
    )).join("");
    const first = points[0];
    const last = points[points.length - 1];

    return `
      <svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="最近十次体重趋势">
        ${gridLines}
        <path class="chart-line" d="${path}" />
        ${pointNodes}
        ${labelNodes}
        <text class="chart-label" x="${first.x}" y="${first.y - 12}" text-anchor="start">${formatChartNumber(first.value, 1)}</text>
        <text class="chart-note" x="${last.x - 6}" y="${last.y - 15}" text-anchor="end">${formatChartNumber(last.value, 1)}kg · 今天</text>
      </svg>
    `;
  }

  Object.assign(window, { renderWeightChart });
})();
