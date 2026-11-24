# Danasabe Ahmad | Portfolio

Personal portfolio website of **Danasabe Ahmad**, Software Developer and Computer Science student in Sokoto, Nigeria.

Live site: https://danasabeahmad.netlify.app

## Built with
- HTML, CSS and vanilla JavaScript (no frameworks)
- Dark and light theme, responsive layout, accessible navigation
- Netlify Forms for the contact form (spam protected)
- Hosted on Netlify, deployed automatically from this repository

## Project structure
```
assets/
  css/style.css      all styles
  js/script.js       interactions (theme, menu, filter, form)
  js/theme-init.js   sets the saved theme before the page paints
  images/            logo, photos, favicons, social preview
  cv/                downloadable CV
pages/               about, projects, services, contact
index.html           home page
success.html         shown if the form is sent without JavaScript
404.html             page not found
_headers             security and caching headers (Netlify)
sitemap.xml          pages for search engines
robots.txt
```

## Run locally
Open the folder in VS Code and start the **Live Server** extension. The contact form only sends once the site is deployed on Netlify.

## Update the site
```
git add .
git commit -m "Describe what you changed"
git push
```
Netlify publishes the new version automatically within about a minute.

## Contact
danasabeahmad3@gmail.com
