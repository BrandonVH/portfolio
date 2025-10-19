import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json'); // Use the fetchJSON function to load the project data from a JSON file.
const projectsContainer = document.querySelector('.projects'); // Select the container where you want to render the project articles. (by class)
renderProjects(projects, projectsContainer, 'h2'); // Call the renderProjects function to dynamically display the fetched projects























