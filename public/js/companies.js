const frequentlyMoveCompanies = (src, dest) => {
  setInterval(() => {
    const c = src.shift();
    if (c) dest.push(c);
    else [src, dest] = [dest, src];
  }, 1000);
};

const domains = [
  "CMP",
  "PE",
  "MarketCap",
  "DivYld",
  "QNetProfit",
  "QSales",
  "ROCE"
];

const UPDATE_INTERVAL = 1000;
const chart = { width: 800, height: 600 };
const margin = { top: 10, right: 10, left: 100, bottom: 150 };

const height = chart.height - (margin.top + margin.bottom);
const width = chart.width - (margin.left + margin.right);

const generateAxis = (build, context, width, height) => {
  const y = d3
    .scaleLinear()
    .domain([0, _.get(_.maxBy(build, context), context, 0)])
    .range([height, 0]);

  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(_.map(build, "Name"))
    .paddingInner(0.3)
    .paddingOuter(0.3);

  return { x, y };
};

const setXAxisText = (g, width, height) => {
  g.append("text")
    .text("Companies")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .attr("class", "x axislable");
};

const setYAxisText = (g, context, width, height) => {
  g.append("text")
    .text(`${context} (₹)`)
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .attr("class", "y axislable");
};

const init = () => {
  const c = d3.scaleOrdinal(d3.schemeCategory10);

  svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", chart.width)
    .attr("height", chart.height);

  g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  g.selectAll(".x-axis text")
    .attr("transform", "rotate(-45)")
    .attr("x", -5)
    .attr("y", 10)
    .attr("text-anchor", "end");
};

const updateCompanies = (companies, domain) => {
  const svg = d3.select("#chart-area svg");
  svg.select(".y.axislable").text(domain);

  setXAxisText(g, width, height);
  setYAxisText(g, domain, width, height);

  const { x, y } = generateAxis(companies, domain, width, height);

  const xAxis = d3.axisBottom(x);
  svg.select(".x-axis").call(xAxis);

  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);

  const yAxis = d3
    .axisLeft(y)
    .tickFormat(d => d + "₹")
    .ticks(10);

  svg.select(".y-axis").call(yAxis);

  g.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  rectangles = g.selectAll("rect").data(buildings);

  svg
    .selectAll("rect")
    .data(companies)
    .exit()
    .remove();

  svg
    .selectAll("rect")
    .data(companies)
    .transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .attr("x", c => x(c.Name))
    .attr("width", x.bandwidth)
    .attr("y", c => y(c[domain]))
    .attr("height", c => y(0) - y(c[domain]));
};

const formatData = ({ Name, ...numerics }) => {
  _.forEach(numerics, (v, k) => (numerics[k] = parseInt(v)));
  return { Name, ...numerics };
};

const start = companies => {
  init();
  let i = 0;
  setInterval(
    () => updateCompanies(companies, domains[i++ % domains.length]),
    UPDATE_INTERVAL
  );
  frequentlyMoveCompanies(companies, []);
};

const main = () => {
  buildings = d3.csv("data/companies.csv", formatData).then(companies => {
    start();
  });
};

window.onload = main;
