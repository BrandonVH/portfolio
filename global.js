console.log('IT’S ALIVE!');

// GETTING ELEMENTS INTO A JAVASCRIPT VARIABLE -------------------------
// Element	JS
// <html>	document.documentElement
// <body>	document.body
// <head>	document.head

// Via ids (avoid doing this)
// <button id="test_button">Click me</button>
// console.log(test_button);

// Via selector (See all links on a page)
// let allLinks = document.querySelectorAll('a'); (or just document.querySelector())
// console.log(allLinks);

// Get closest ancestor with a class
// let container = element.closest("select, article");

// Creating new elements (way 1) ---------------------------------------
// let p = document.createElement("p");
// p.textContent = "Hello";
// document.body.append(p);

// (way 2)
// document.body.insertAdjacentHTML("beforeend", `<p>Hello</p>`);

// Manipulating Elements ------------------------------------------------
// Style Classes
// a.classList.add("current");

// CSS
// el.style.setProperty("--value", value);


// Metadata Attributes
// h1.id = slugify(h1.textContent);
// a.setAttribute("target", "_blank");

// Properties
// checkbox.indeterminate = true;

// DOM Tree Position
// code.before(a);
// a.append(code);

// Content
// h1.textContent = "Hi there";
// p.innerHTML = "Yo <em>sup?</em>";

// earlier we had to manually put class="current" in the anchor element of the current page for the nav bar. This automates that process
// function $$(selector, context = document) {
//   return Array.from(context.querySelectorAll(selector));
// }

// let navLinks = $$("nav a") // We will use the $$ function we defined earlier to get an array of all our nav links. Remember that the CSS selector nav a will get all <a> elements inside a <nav> element, which is what we want. Putting it together, $$("nav a") will get us an array of all our nav links, which we can assign to a variable, e.g. navLinks

// To find the link to the current page, we need three pieces of information:
// The array.find() method gives us the first array element that passes a test. For example, [1, 2, 3, 4].find(n => n > 2) will return 3 (try it in the console!).
// The location object, which has information about the current page, such as location.host and location.pathname.
// When we get references to <a> elements, they also include these URL properties (host, pathname, etc.). Even if the link is relative, the values of these properties will be after it has been resolved to an absolute URL, using the URL of the current page as a base. The browser needs to resolve it to an absolute URL anyway to make it work, so exposing these properties is a convenience for us.
// A link to the current page will have the same host and pathname as the current page.
// Putting it together, we can get the link to the current page via:
// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname, // (a) represents each object in the array
// );

// Add the current class to the current page link (?. is an optional chaining operator that helps reduce errors, same functionality as .)
// if (currentLink) {
//   // or if (currentLink !== undefined)
//   currentLink?.classList.add('current');
// }

// But why stop here? Wasn’t it tedious to need to copy-pasta the navigation to all pages? And imagine the horror of adding a new page to our site: we’d have to update every single page!
// We can automate this too! Client-side JS is not the best way to handle site-wide templating, but it’s good as a temporary fix, and as a learning exercise.
// First, remove the navigation menu from all pages, since we’re going to be adding it with JS. Also remove your code from Step 2 
// (or comment it out by selecting it and pressing Cmd/Ctrl + /), since we’ll now be adding the current class at the same time as we add the links.

// Save and preview: you should now have a navigation menu on every page that is added automatically!
// However, there is a bit of a wart. Try your menu on different pages.
// Oh no, the links only work properly on the home page!
// That is because we had previously used different relative URLs for different pages,
// but now we are trying to use the same one across the entire website.
// Let’s try to do with JS what we previously did manually (sensing a theme here?).
// Previously, for any page that was not the home page, we added ../ to the URL, right?
// But this approach breaks when we deploy the site using GitHub Pages, which hosts the site under a subdirectory like /portfolio/ (dependent on what you named your repo).
// So instead of figuring out whether we’re on the home page,
// let’s detect whether we are running the site locally (on localhost) or on GitHub Pages,
// and use that to adjust the base URL for all links.
// We can do this by checking the current hostname and defining a constant BASE_PATH accordingly
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")?"/":"/portfolio/"; // / for local server and /portfolio/ for GitHub Pages repo name

// The location.hostname property gives us the domain of the current page.
// If we’re working locally, it will be "localhost" or "127.0.0.1".
// If we’re on GitHub Pages, it will be something like "yourusername.github.io".
// Then, when creating the links, we’ll check if the URL is relative (i.e. does not start with "http"), and if so, we’ll prefix it with the BASE_PATH. This ensures that all internal links work properly both locally and when deployed.
// if (!url.startsWith('http')) {
//   url = BASE_PATH + url;
// }
// url = !url.startsWith('http') ? BASE_PATH + url : url; (does same thing as above 3 lines)

// As we saw in the slides, there are many ways to design a data structure to hold the association of URLs (relative or absolute) and page titles. Let’s go with an array of objects for now, but if you want to use a different one (and handle the code differences) you’re welcome to!
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/BrandonVH', title: 'Profile' }
];

// Then, create a new <nav> element (via document.createElement()) and add it inside <body> at the beginning (via element.prepend()).:
let nav = document.createElement('nav');
document.body.prepend(nav);

// Then we will use a for .. of loop to iterate over the pages on our site and add <a> elements in the <nav> for each of them. It will look like this:
for (let p of pages) {
  let url = p.url;
  url = !url.startsWith('http') ? BASE_PATH + url : url; // We don't need to put ../ in front of urls depending on file location anymore
  let title = p.title;
  // next step: create link and add it to nav (does same thing as 4 lines below, but we use 4 lines so we can use the if statement to add 'current' class to a)
  // nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`); ()

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);

  // a.classList.toggle(
  //   'current',
  //   a.host === location.host && a.pathname === location.pathname,
  // );

  // Does same thing as code above
  if (a.host === location.host && a.pathname === location.pathname) { // Similarly, we can add target="_blank" to external links (such as the GitHub link) by setting a.target = "_blank" to those links for which a.host is not the same as location.host.
    a.classList.add('current');
  }
}

// Adding html for dark mode switch
// We want our switch to have three states: Automatic (the default, adapts to the OS color scheme), Light, and Dark. The heavy lifting is already done in the CSS, so all the switch needs to do is set the color-scheme property appropriately on the root element.
// First we need to add the form controls for selecting the color scheme. A good option is a <select> element (plus <option> elements inside it), which creates a dropdown menu.
// For the value attribute of your <option> elements, use the actual values each option should set the color-scheme property to (light dark, light, dark), 
// so that you don’t need to do any conversion in JS.
document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
      <option value="light dark">Automatic</option>
			<option value="light">Light</option>
      <option value="dark">Dark</option>
		</select>
	</label>`,
);


// We now have all the UI in place, but nothing happens when we change the theme. Here comes the fun part: making it work!
// The first step is to attach an input event listener to our <select> element so we can run JS code when the user changes it. To do that, we first need to get a reference to the <select> element via document.querySelector(selector) and assign it to a variable (I called it select).
// Then, we’d use the addEventListener() function to add a listener for the input event:
let select = document.querySelector('select')
select.addEventListener('input', function (event) {
  document.documentElement.style.setProperty('color-scheme', event.target.value); /* document.documentElement.setAttribute('color-scheme', event.target.value); doesn't work because setAttribute is used to change html attributes like class or id, not css*/
  console.log('color scheme changed to', event.target.value);
  localStorage.colorScheme = event.target.value; // save user preference
});

// Notice that if you refresh the page, the color scheme goes back to automatic. How can we persist this across page loads?
// We will use the localStorage object for this. It’s a simple object (its keys can only contain strings), but anything you put in it will persist across page loads or even browser sessions.
// There are two components to persisting the user’s preference:
// Adding the user’s preference to localStorage when they change it. This is as simple as localStorage.colorScheme = event.target.value in our event listener.
// Reading the user’s preference from localStorage when the page loads. For that, we need a conditional that would check if localStorage includes a colorScheme key ("colorScheme" in localStorage), and if it does, we’d set the color scheme to that value (just like any object, we can read that value via localStorage.colorScheme). Don’t forget to update the <select> element to match (by setting select.value), otherwise the user experience will be very confusing!
if (localStorage.colorScheme){
  document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
  let select = document.querySelector('select');
  select.value = localStorage.colorScheme;
}























