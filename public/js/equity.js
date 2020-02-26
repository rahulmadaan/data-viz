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

  const line = field =>
    d3
      .line()
      .x(q => x(q.Time))
      .y(q => y(q[field]));

  svgGroup
    .append("path")
    .attr("class", "close")
    .attr("d", line("Close")(quotes));

  svgGroup
    .append("path")
    .attr("class", "avg")
    .attr("d", line("sma")(_.filter(quotes, "sma")));
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

const sum = list => {
  return list.reduce((acc, ele) => acc + ele.Close, 0);
};

const analyseData = (quotes, period = 100, offset = 0) => {
  for (let index = period + offset; index <= quotes.length; index++) {
    const sets = _.slice(quotes, index - period - offset, index - offset);
    const sma = _.round(
      _.reduce(
        sets,
        (acc, element) => {
          return acc + element.Close;
        },
        0
      ) / period
    );
    quotes[index - 1].sma = sma;
  }
  return quotes;
};

const updatePeriodAndOffset = quotes => {
  let period = 100;
  let offset = 1;
  d3.select("#sma-period-input").on("input", () => {
    period = +d3.select("#sma-period-input").node().value || 100;
    analyseData(quotes, period, offset);
    updateChart(quotes);
  });

  d3.select("#sma-offset-input").on("input", () => {
    offset = +d3.select("#sma-offset-input").node().value || 1;
    analyseData(quotes, period, +offset);
    updateChart(quotes);
  });
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

const eventTemplate = (date, closePrice, sma, type) => {
  return {
    Date: date,
    Close: closePrice,
    sma,
    transactionType: type
  };
};

const extractEvents = quotes => {
  // 55
  let events = [];
  let flag = "long";
  for (let index = 0; index < quotes.length; index++) {
    let quote = quotes[index];
    if (quote.sma) {
      if (quote.sma < quote.Close && flag === "long") {
        events.push(eventTemplate(quote.Date, quote.Close, quote.sma, "Buy"));
        flag = "short";
      }
      if (quote.sma > quote.Close && flag === "short") {
        events.push(eventTemplate(quote.Date, quote.Close, quote.sma, "Sell"));
        flag = "long";
      }
    }
  }
  return events;
};

const getTransactionDetails = (buy, sell) => {
  return {
    Date: buy.Date,
    "P/L": sell.Close - buy.Close
  };
};

const extractTransactions = quotes => {
  const events = extractEvents(quotes);
  const transactions = [];
  if (events.length % 2 != 0) {
    let lastEvent = events[events.length - 1];
    lastEvent.transactionType = "Sell";
    events.push(lastEvent);
  }
  for (let index = 0; index < events.length - 1; index = index + 2) {
    transactions.push(getTransactionDetails(events[index], events[index + 1]));
  }
  return transactions;
};

const createTable = transactions => {
  let table = d3.select("#table").append("table");
  let header = table.append("thead").append("tr");
  header
    .selectAll("th")
    .data(["Date", "P/L"])
    .enter()
    .append("th")
    .text(d => d);

  let tablebody = table.append("tbody");
  rows = tablebody
    .selectAll("tr")
    .data(transactions)
    .enter()
    .append("tr");

  // We built the rows using the nested array - now each row has its own array.
  cells = rows
    .selectAll("td")
    // each row has data associated; we get it and enter it for the cells.
    .data(d => {
      console.log(d);
      return d;
    })
    .enter()
    .append("td")
    .text(d => d);
};

const main = () => {
  d3.csv("/data/NSEI.csv", q => {
    return {
      ...q,
      Close: +q.Close,
      Time: new Date(q.Date)
    };
  }).then(quotes => {
    quotes = analyseData(quotes);
    initChart();
    updatePeriodAndOffset(quotes);
    const transactions = extractTransactions(quotes);
    createTable(transactions);
    slider(quotes);
    updateChart(quotes);
  });
};

window.onload = main;
