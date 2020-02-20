const c = d3.scaleOrdinal(d3.schemeCategory10);
const margin = {
  left: 100,
  right: 10,
  top: 10,
  bottom: 150
};

const chartSize = { width: 1200, height: 750 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const formatSliderContents = ({ begin, end }) => {
  return Date(begin) + "" + Date(end);
};

const formatDate = date => {
  var d = new Date(date * 1000),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
};

const updateChart = quotes => {
  const svg = d3.select("#chart-area svg");
  const svgGroup = d3.select(".equity");
  svgGroup.selectAll("path").remove();
  const x = d3
    .scaleTime()
    .range([0, width])
    .domain([new Date(_.first(quotes).Date), new Date(_.last(quotes).Date)]);

  const xAxis = d3.axisBottom(x);

  const y = d3
    .scaleLinear()
    .domain([
      _.get(_.minBy(quotes, "Close"), "Close", 0),
      _.get(_.maxBy(quotes, "Close"), "Close", 0)
    ])
    .range([height, 0]);

  const yAxis = d3.axisLeft(y).ticks(10);

  svg.select(".y.axis-label").text("Close");
  svg.select(".y.axis").call(yAxis);
  svg.select(".x.axis").call(xAxis);

  const line = d3
    .line()
    .x(q => x(new Date(q.Date)))
    .y(q => y(q.Close));

  const lineAvg = d3
    .line()
    .x(q => x(new Date(q.Date)))
    .y(q => y(q.SMA));

  svgGroup
    .append("path")
    .attr("class", "close")
    .attr("d", line(quotes));

  svgGroup
    .append("path")
    .attr("class", "avg")
    .attr("d", lineAvg(quotes.filter(q => q.SMA)));
};

const initChart = function() {
  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", chartSize.width)
    .attr("height", chartSize.height);

  const svgGroup = svg
    .append("g")
    .attr("class", "equity")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const xAxisLabel = svgGroup
    .append("text")
    .attr("class", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .text("TIME");

  const yAxisLabel = svgGroup
    .append("text")
    .attr("class", "y axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .text("CLOSE");

  const appendYAxis = svgGroup.append("g").attr("class", "y axis");

  const appendXAxis = svgGroup
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`);

  const transformXAxisText = svgGroup
    .selectAll(".x.axis text")
    .attr("transform", "rotate(-40)")
    .attr("x", -5)
    .attr("y", 10);
};

const calculateSMA = (prices, days) => {
  const total = prices.reduce((a, b) => a + b, 0);
  let res = total / days;
  return res;
};

const getLastPrices = (day, quotes) => {
  const res = _.takeRight(_.take(quotes, day), 100);
  return res.map(q => q.Close);
};

const analyseData = quotes => {
  for (let day = 100; day < quotes.length; day++) {
    quotes[day].SMA = calculateSMA(getLastPrices(day, quotes), 100);
  }
};

const slider = quotes => {
  const toLocale = date => new Date(date).toLocaleString();
  const minDate = _.first(quotes).Time;
  const maxDate = _.last(quotes).Time;
  const slider = createD3RangeSlider(
    minDate.getTime(),
    maxDate.getTime(),
    "#slider-container"
  );

  slider.onChange(function(newRange) {
    const startDate = newRange.begin;
    const endDate = newRange.end;

    d3.select("#date-range").text(
      `${toLocale(startDate)} - ${toLocale(endDate)}`
    );

    const range = quotes.filter(x => {
      return x.Time.getTime() >= startDate && x.Time.getTime() <= endDate;
    });
    updateChart(range);
  });
  slider.range(minDate.getTime(), maxDate.getTime());
};

const updateSmaPeriod = quotes => {
  const input = +d3.select("#sma-period-input").node().value;
  analyseData(quotes, input);
};

const main = () => {
  d3.csv("/data/NSEI.csv", q => {
    return {
      ...q,
      Close: +q.Close,
      Time: new Date(q.Date)
    };
  }).then(quotes => {
    analyseData(quotes);
    initChart();
    slider(quotes);
    updateChart(quotes);
  });
};

window.onload = main;
