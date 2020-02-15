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

const drawBuildings = buildings => {
  const context = domains[0];
  build = buildings;

  const { x, y } = generateAxis(buildings, context, width, height);
  const c = d3.scaleOrdinal(d3.schemeCategory10);

  svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", chart.width)
    .attr("height", chart.height);

  g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  setXAxisText(g, width, height);
  setYAxisText(g, context, width, height);

  rectangles = g.selectAll("rect").data(buildings);

  const yAxis = d3
    .axisLeft(y)
    .tickFormat(d => d + "₹")
    .ticks(10);

  const xAxis = d3.axisBottom(x);

  g.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);

  g.selectAll(".x-axis text")
    .attr("transform", "rotate(-45)")
    .attr("x", -5)
    .attr("y", 10)
    .attr("text-anchor", "end");

  newC = rectangles
    .enter()
    .append("rect")
    .attr("x", (b, i) => x(b.Name))
    .attr("y", b => y(b[context]))
    .attr("width", x.bandwidth)
    .attr("height", b => y(0) - y(b[context]))
    .attr("fill", b => c(b.Name));
};

const updateCompanies = (companies, domain) => {
  const svg = d3.select("#chart-area svg");
  svg.select(".y.axislable").text(domain);

  const y = d3
    .scaleLinear()
    .domain([0, _.maxBy(companies, domain)[domain]])
    .range([height, 0]);

  const yAxis = d3
    .axisLeft(y)
    .tickFormat(d => d + "₹")
    .ticks(10);

  svg.select(".y-axis").call(yAxis);

  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(_.map(companies, "Name"))
    .padding(0.3);

  const xAxis = d3.axisBottom(x);
  svg.select(".x-axis").call(xAxis);

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

  svg
    .selectAll("rect")
    .data(companies)
    .exit()
    .remove();
};

const formatData = ({ Name, ...numerics }) => {
  _.forEach(numerics, (v, k) => (numerics[k] = parseInt(v)));
  return { Name, ...numerics };
};

const main = () => {
  buildings = d3.csv("data/companies.csv", formatData).then(companies => {
    drawBuildings(companies);
    let i = 0;
    setInterval(() => {
      updateCompanies(companies, domains[i % domains.length]);
      i = i + 1;
    }, 1000);
    // setInterval(() => {
    //   domains.shift();
    // }, 3000);
    frequentlyMoveCompanies(companies, []);
  });
};

window.onload = main;
