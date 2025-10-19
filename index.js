// create a new index.js file to dynamically fetch and display the latest projects on the home page. This file will utilize our reusable fetchJSON and renderProjects functions you’ve already created.

import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json'); // Use the fetchJSON function to load all project data, then filter the first three projects for display
const latestProjects = projects.slice(0, 3); // Ensure your HTML includes a container with the class projects
const projectsContainer = document.querySelector('.projects'); // Identify the container where the latest projects will be displayed
renderProjects(latestProjects, projectsContainer, 'h2'); // Use the renderProjects function to dynamically display the filtered projects

const githubData = await fetchGitHubData('BrandonVH'); // Call the fetchGitHubData function and retrieve the GitHub data for the specified user

const profileStats = document.querySelector('#profile-stats'); // Select the container element where the GitHub profile stats will be displayed

if (profileStats) {
  profileStats.innerHTML = `
        <dl>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
    `;
}





























