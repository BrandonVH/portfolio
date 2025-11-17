import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


// async function loadData() { // read csv file, async so the application is responsive to user requests while data loads
//   const data = await d3.csv('loc.csv');
//   console.log(data);
//   return data;
// }

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}   

// Extract data about commits in a separate variable for easy access. We will compute this after reading the CSV file. First, we’ll use the d3.groups() method to group the data by the commit property
function processCommits(data) { 
  return d3
    .groups(data, (d) => d.commit)  
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', { // provides a way to add properties that don’t show up when you print an object
        value: lines,
        enumerable: false,   // hide from iteration and JSON
        writable: false,     // prevent reassignment
        configurable: false  // prevent deletion/redefinition
      });

      return ret;
    })
    .sort((a, b) => a.datetime - b.datetime); // sort commits by datetime to update the scatter plot properly for scrolling feature
}

// display the total lines of code and commits
function renderCommitInfo(data, commits) {
  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Add total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Add total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Number of files
  dl.append('dt').text('Number of files');
  dl.append('dd').text(d3.groups(data, d => d.file).length);

  // Maximum file length
  dl.append('dt').text('Maximum file length');
  dl.append('dd').text(Math.max(...data.map(d => d.line)));

  // Longest line length
  dl.append('dt').text('Longest line length');
  dl.append('dd').text(Math.max(...data.map(d => d.length)));
}

// Time of day as Y axis and date as X
function renderScatterPlot(data, commits) {
    // Sort commits by total lines in descending order (so smaller circles load on top of larger ones, larger ones loaded first)
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    const width = 1000;
    const height = 600;
    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    // // Instead of a linear scale, which is meant for any type of quantitative data, we use a time scale which handles dates and times automatically
    // // We can use d3.extent() to find the minimum and maximum date in one go
    // // We can use scale.nice() to extend the domain to the nearest “nice” values
    // const xScale = d3
    //     .scaleTime()
    //     .domain(d3.extent(commits, (d) => d.datetime))
    //     .range([0, width])
    //     .nice();

    // const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]); // standard linear scale that maps the hour of day (0 to 24) to the Y axis (height to 0 since 0 is the top of the svg and height is the bottom)

    // Calculate the range of edited lines across all commits. This needs to be done inside the renderScatterPlot function, before adding the r attribute to dots
    // For dot sizes
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3
        .scaleSqrt()
        .domain([minLines, maxLines])
        .range([2, 30]); // linear scale for circle radius (use scaleSqrt since circle area grows with the square of radius. A commit with twice the edits would appear four times larger)
    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle')
        .data(sortedCommits, (d) => d.id)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
        });

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Add gridlines BEFORE the axes
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .attr('opacity', 0.2); 

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // Create the axes (Format the Y axis to look like actual times)
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add X axis
    svg
        .append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    // Add Y axis
    svg
        .append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    // createBrushSelector(svg) doesn't work here
    const brush = d3.brush()
        .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
        .on('start brush end', brushed);

     svg.append('g')
        .attr('class', 'brush')
        .call(brush);
}

// Tooltip shows data for point when hovered
function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
  time.textContent = commit.time 
  author.textContent = commit.author 
  lines.textContent = commit.totalLines
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

// move tooltip to mouse
function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

// brushing is a technique that allows you to select multiple circle elements at once (not sure where to call this)
function createBrushSelector(svg) {
  svg.call(d3.brush());
  svg.selectAll('.dots, .overlay ~ *').raise(); // Raise dots and everything after overlay so the rectangle from brush doesn't block them
}

// allows rectangle from brush to select circles
function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }
  // TODO: return true if commit is within brushSelection
  // and false if not
  const [x0, x1] = selection.map((d) => d[0]); 
  const [y0, y1] = selection.map((d) => d[1]); 
  const x = xScale(commit.datetime); 
  const y = yScale(commit.hourFrac); 
  return x >= x0 && x <= x1 && y >= y0 && y <= y1; 
}

// display number of selected commits
function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

// display stats about languages in selected commits 
function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }
}

let data = await loadData();
let commits = processCommits(data);

// Instead of a linear scale, which is meant for any type of quantitative data, we use a time scale which handles dates and times automatically
// We can use d3.extent() to find the minimum and maximum date in one go
// We can use scale.nice() to extend the domain to the nearest “nice” values
// Make sure to initialize with let instead of const since we are updating them later for brush selection
// Declare them outside of renderScatterPlot() to make them global variables so they can be used by isCommitSelected()
let xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, 1000])
    .nice();

let yScale = d3.scaleLinear().domain([0, 24]).range([600, 0]); // standard linear scale that maps the hour of day (0 to 24) to the Y axis (height to 0 since 0 is the top of the svg and height is the bottom)

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);



// FOR INTERACTIVE TIMELINE VISUALIZATION ----------------------------------------------------------------------------------
let commitProgress = 100; // represent the maximum time we want to show as a percentage of the total time:
let timeScale = d3 // time scale to map the percentage to a date
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);
const slider = document.querySelector("#commit-progress");
const timeEl = document.querySelector("#commit-time");
let filteredCommits = commits;

// We want to display the file details for the commits we filtered. Obtain the file names and lines associated with each file
function updateFileDisplay(filteredCommits) {
  let lines = filteredCommits.flatMap(d => d.lines);
  let files = d3.groups(lines, d => d.file)
                .map(([name, lines]) => ({ name, lines }))
                .sort((a, b) => b.lines.length - a.lines.length);

  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, d => d.name)
    .join(
      enter => enter.append('div').call(div => {
        const dt = div.append('dt');
        dt.append('code');
        dt.append('small');        // add the line-count element
        div.append('dd');          // for unit viz
      })
    );

  // put filename + line count into the <dt>
  filesContainer
    .select('dt')
    .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);

  // create ordinal scale to map technology id to colors
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  // unit visualization inside <dd>
  filesContainer
    .select('dd')
    .selectAll('div')
    .data(d => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', (d) => `--color: ${colors(d.type)}`);
}

// UPDATE SCATTER PLOT BASED ON FILTER
function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // CHANGE: we should clear out the existing xAxis and then create a new one.
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);
  const yAxisGroup = svg.select('g.y-axis');
  yAxisGroup.selectAll('*').remove();
  yAxisGroup.call(yAxis);
  svg.select('.x-axis').call(xAxis);
  svg.select('.y-axis').call(yAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id) // When we move the slider, circles jump around a lot. This is because D3 doesn’t know which data items correspond to which previous data items, so it does not necessarily reuse the right <circle> element for the same commit. To tell D3 which data items correspond to which previous data items, we can give each circle a key that uniquely identifies the data item. A good candidate for that in this case would be the commit id.
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

function onTimeSliderChange() { // update slider and textContent of time element that displays time
    commitProgress = +slider.value; // Update the commitProgress variable to the slider value.
    commitMaxTime = timeScale.invert(commitProgress); // Update the commitMaxTime variable to the date corresponding to the slider value using d3.invert().
    timeEl.textContent = commitMaxTime.toLocaleString();
    filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
    updateScatterPlot(data, filteredCommits);
    updateFileDisplay(filteredCommits)
}
slider.addEventListener("input", onTimeSliderChange);
onTimeSliderChange();

// Generate some filler text for each commit.
d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );

// Use Scrollama to automatically update our scatter plot as we scroll past commits
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

// Add this to the bottom of your JS file to use the library
function onStepEnter(response) {
  const commit = d3.select(response.element).datum();   // 🔥 original commit data
  
  // make sure commits are sorted by datetime in processCommits()
  const idx = commits.indexOf(commit);

  const filtered = commits.slice(0, idx + 1);

  updateScatterPlot(data, filtered);

  // console.log(commit);    
  // console.log(commit.date);
  // console.log(response.element.__data__.datetime);
}
const scroller = scrollama();
scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
  })
  .onStepEnter(onStepEnter);






























