const drawBuildings = buildings => {
  build = buildings;

  const chart = { width: 600, height: 400 };
  const margin = { top: 10, right: 10, left: 100, bottom: 150 };

  const height = chart.height - (margin.top + margin.bottom);
  const width = chart.width - (margin.left + margin.right);

  const y = d3
    .scaleLinear()
    .domain([0, _.maxBy(build, "height").height])
    .range([0, height]);

  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(_.map(build, "name"))
    .paddingInner(0.3)
    .paddingOuter(0.3);

  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", chart.width)
    .attr("height", chart.height);

  g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  g.append("text")
    .text("Tall Buildings")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .attr("class", "x axislable");

  g.append("text")
    .text("Height (m)")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .attr("class", "y axislable");

  rectangles = g.selectAll("rect").data(buildings);

  const yAxis = d3
    .axisLeft(y)
    .tickFormat(d => d + "m")
    .ticks(3);

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
    .attr("x", (b, i) => x(b.name))
    .attr("width", x.bandwidth)
    .attr("height", b => y(b.height));
};
const main = () => {
  buildings = d3.json("data/buildings.json").then(drawBuildings);
};
window.onload = main;
