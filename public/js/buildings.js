const drawBuildings = buildings => {
  const SVG_HEIGHT = 400;
  const SVG_WIDTH = 400;
  build = buildings;

  const y = d3
    .scaleLinear()
    .domain([0, _.maxBy(build, "height").height])
    .range([0, 400]);

  x = d3
    .scaleBand()
    .range([0, SVG_WIDTH])
    .domain(_.map(build, "name"))
    .paddingInner(0.3)
    .paddingOuter(0.3);

  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", SVG_WIDTH)
    .attr("height", SVG_HEIGHT);

  rectangles = svg.selectAll("rect").data(buildings);

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
