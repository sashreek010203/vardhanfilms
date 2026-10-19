# Vardhan Dhaimodkar — portfolio website

A static website: plain HTML, CSS and JS, with no build step and no server code.
All content lives in `content/*.json` and is edited through forms in
[Pages CMS](https://pagescms.org). For day-to-day updates, see **[HOW-TO-UPDATE.md](HOW-TO-UPDATE.md)**.

```
index.html            page skeleton
assets/css/style.css  design
assets/js/site.js     reads /content and builds the page
assets/media/         photos and the CV (uploads from the editor land here)
content/profile.json  name, bio, contact, education, showreel…
content/work.json     every project (with optional video link)
content/awards.json   laurels
.pages.yml            turns the JSON files into editor forms
```

## One-time setup (about 10 minutes)

1. **Put the site on GitHub.** Create a free account and a new **public**
   repository, e.g. `vardhan-films`. Upload everything in this folder
   (*Add file → Upload files*), including the hidden `.pages.yml` and
   `.nojekyll` files. Do **not** upload the two original PDFs from the top
   level; the CV is already in `assets/media/`.
2. **Turn on hosting.** In the repository go to *Settings → Pages*, set
   *Source: Deploy from a branch*, choose branch `main` and folder `/ (root)`, then save.
   The site goes live at `https://<username>.github.io/vardhan-films/`.
3. **Connect the editor.** Go to https://app.pagescms.org, sign in with
   GitHub, install the Pages CMS app on the repository when asked, and open it.
   The three editable sections appear.
4. *(Optional)* **Custom domain** such as `vardhanfilms.com`: buy it from any
   registrar, then add it under *Settings → Pages → Custom domain* and follow
   GitHub's DNS instructions.

Netlify, Cloudflare Pages or Vercel also work. Connect the same GitHub
repository with no build command and the publish directory set to `/`.

## Previewing locally

The page loads its content with `fetch`, so open it through a local server,
not by double-clicking `index.html`:

```
python3 -m http.server 8000   # then visit http://localhost:8000
```
