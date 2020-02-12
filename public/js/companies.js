const drawBuildings = buildings => {
  build = buildings;

  const chart = { width: 800, height: 600 };
  const margin = { top: 10, right: 10, left: 100, bottom: 150 };

  const height = chart.height - (margin.top + margin.bottom);
  const width = chart.width - (margin.left + margin.right);

  const y = d3
    .scaleLinear()
    .domain([0, _.maxBy(build, "CMP").CMP])
    .range([height, 0]);

  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(_.map(build, "Name"))
    .paddingInner(0.3)
    .paddingOuter(0.3);

  const c = d3.scaleOrdinal(d3.schemeCategory10);

  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", chart.width)
    .attr("height", chart.height);

  g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  g.append("text")
    .text("Companies")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .attr("class", "x axislable");

  g.append("text")
    .text("CMP (₹)")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .attr("class", "y axislable");

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

  newRects = rectangles
    .enter()
    .append("rect")
    .attr("x", (b, i) => x(b.Name))
    .attr("y", b => y(b.CMP))
    .attr("width", x.bandwidth)
    .attr("height", b => y(0) - y(b.CMP))
    .attr("fill", b => c(b.Name));
};

const formatData = ({ Name, ...numerics }) => {
  _.forEach(numerics, (v, k) => (numerics[k] = parseInt(v)));
  return { Name, ...numerics };
};

const main = () => {
  buildings = d3.csv("data/companies.csv", formatData).then(drawBuildings);
};
window.onload = main;
