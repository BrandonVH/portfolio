import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50); // use the d3.arc() function from the D3 Shape module to create the path for our circle. 
// This works with two parts: first, we create an arc generator which is a function that takes data and returns a path string. 
// We’ll configure it to produce arcs based on a radius of 50 by adding .innerRadius(0).outerRadius(50). If you instead want to create a donut chart, 
// it’s as easy as changing the inner radius to something other than 0

// let arc = arcGenerator({ // We then generate an arc by providing a starting angle (0) and an ending angle in radians (2 * Math.PI) to create a full circle
//   startAngle: 0,
//   endAngle: 2 * Math.PI,
// });

// d3.select('svg').append('path').attr('d', arc).attr('fill', 'red'); // append circle to svg. The path element can draw any shape (we are using arc)

// let data = [1, 2]; // draw pie chart with 2 slices, 33.3% and 66.6%
// let total = 0;
// for (let d of data) {
//   total += d;
// }

// let angle = 0; // calculate start and end angles for each slice
// let arcData = [];
// for (let d of data) {
//   let endAngle = angle + (d / total) * 2 * Math.PI; // in radians, not degrees
//   arcData.push({ startAngle: angle, endAngle });
//   angle = endAngle;
// }

// let arcs = arcData.map((d) => arcGenerator(d)); // calculate path elements for each slice

// Now let’s clean up the code a bit. D3 actually provides a higher level primitive for what we just did: the d3.pie() function. 
// Just like d3.arc(), d3.pie() is a function that returns another function, which we can use to generate the start and end angles for 
// each slice in our pie chart instead of having to do it ourselves. This sliceGenerator() function takes an array of data values and returns an array of objects, 
// each of whom represents a slice of the pie and contains the start and end angles for it. We still feed these objects to our arcGenerator() to create the paths for the slices, 
// but we don’t have to create them manually. It looks like this:
// let data = [
//   { value: 1, label: 'apples' },
//   { value: 2, label: 'oranges' },
//   { value: 3, label: 'mangos' },
//   { value: 4, label: 'pears' },
//   { value: 5, label: 'limes' },
//   { value: 5, label: 'cherries' },
// ];

let projects = await fetchJSON('../lib/projects.json'); // fetch your project data
// let rolledData = d3.rollups( // use the d3.rollups() function to group our projects by year and count the number of projects in each bucket (returns 2d list)
//   projects,
//   (v) => v.length,
//   (d) => d.year,
// );
// let data = rolledData.map(([year, count]) => {
//   return { value: count, label: year };
// });
// let sliceGenerator = d3.pie().value((d) => d.value); // let sliceGenerator know how to access values in the data
// let arcData = sliceGenerator(data);
// let arcs = arcData.map((d) => arcGenerator(d));

// // let colors = ['gold', 'purple'];
// let colors = d3.scaleOrdinal(d3.schemeTableau10); // colors for future slices are automatically chosen (this is a function so do colors(idx) instead of colors[idx])
// arcs.forEach((arc, idx) => { // translate arcs array into path elements
//   // TODO, fill in step for appending path to svg using D3
//   d3.select('svg')
//     .append('path')
//     .attr('d', arc)
//     .attr('fill', colors(idx)) // Fill in the attribute for fill color via indexing the colors variable
// });

// let legend = d3.select('.legend');
// data.forEach((d, idx) => {
//   legend
//     .append('li')
//     .attr('style', `--color:${colors(idx)};`) // set the style attribute while passing in parameters (child span element uses --color variable)
//     .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
// });

let query = ''; // First, declare a variable that will hold the search query:
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('change', (event) => {
  // update query value
  query = event.target.value;
  // TODO: filter the projects (use the array.filter() function, which returns a new array containing only the elements that pass the test implemented by the provided function)
  // let filteredProjects = projects.filter((project) => 
  //   project.title.toLowerCase().includes(query),
  // );
  
  // use the Object.values() function to get an array of all the values of a project, and then join them into a single string, which we can then search in the same way
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // TODO: render updated projects!
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects) // update pie chart
});

// condense all code above into 1 function (WE CANNOT FILTER BY SEARCH AND PIE CHART AT THE SAME TIME SINCE THE EVENT LISTENER ABOVE FOR THE SEARCH INPUT ONLY APPLIES
// TO THE projects.json FILE DATA, NOT TO THE DATA ALREADY FILTERED BY THE PIE CHART)
function renderPieChart(projectsGiven) {
  let newSVG = d3.select('svg'); // remove old paths
  newSVG.selectAll('path').remove();

  let newLegend = d3.select('.legend'); // remove old li on legend
  newLegend.selectAll('li').remove();

  // re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  // re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year }; // TODO
  });
  // re-calculate slice generator, arc data, arc, etc.
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  // TODO: clear up paths and legends
  let colors = d3.scaleOrdinal(d3.schemeTableau10); // colors for future slices are automatically chosen (this is a function so do colors(idx) instead of colors[idx])
  let selectedIndex = -1;
  newArcs.forEach((arc, idx) => { // translate arcs array into path elements
    // TODO, fill in step for appending path to svg using D3
    d3.select('svg')
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx)) // Fill in the attribute for fill color via indexing the colors variable
      .on('click', () => { // Add a click event to your <path> which will set selectedIndex to the index of the wedge that was clicked.
          selectedIndex = selectedIndex === idx ? -1 : idx; // A selected index should be unselected if it is clicked while it is selected
          newSVG
            .selectAll('path')
            .attr('class', (_, i) => ( // filter idx to find correct pie slice and apply CSS
              i === selectedIndex ? 'selected' : ''
            ));

          newLegend // change color of legend circle 
            .selectAll('li')
            .attr('class', (_, i) => (
              i === selectedIndex ? 'selected' : ''
            ))

          if (selectedIndex === -1) {
            renderProjects(projects, projectsContainer, 'h2');
          } 
          else {
            let selectedYear = newData[selectedIndex].label;
            let filteredProjects = projects.filter(p => p.year === selectedYear);
            renderProjects(filteredProjects, projectsContainer, 'h2');
          }
      });
  });

  let legend = d3.select('.legend');
  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)};`) // set the style attribute while passing in parameters (child span element uses --color variable)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
  });

  // update paths and legends, refer to steps 1.4 and 2.2
}

// Call this function on page load
renderPieChart(projects);

// const projects = await fetchJSON('../lib/projects.json'); // Use the fetchJSON function to load the project data from a JSON file. (we do this earlier)
const projectsContainer = document.querySelector('.projects'); // Select the container where you want to render the project articles. (by class)
renderProjects(projects, projectsContainer, 'h2'); // Call the renderProjects function to dynamically display the fetched projects























