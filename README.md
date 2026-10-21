# Ethan White — personal site

Plain HTML/CSS/JS. No build step, no frameworks.

## Files
- `index.html` — Home
- `blog.html` — Blog list
- `resume.html` — Resume
- `posts/double-pendulum.html` — Sample post with the simulation
- `posts/_template.html` — Copy this to start a new post (files starting with `_` are not published by GitHub Pages)
- `assets/style.css` — All styling, colors at the top
- `assets/pendulum.js` — The simulation
- `assets/og-image.png` — Link preview card (shows when the site is shared on LinkedIn, Slack, iMessage)
- `assets/icons/` — Email, LinkedIn, and GitHub icons in the footer
- `ethan-white-resume.pdf` — Linked from the Download PDF button

## Before you publish
1. Replace `ethan-white-resume.pdf` with your corrected resume (keep the same file name).

## Put it online (GitHub Pages, free)
1. On GitHub, create a new **public** repository named exactly `ewhites.github.io`.
2. Click **Add file → Upload files**, drag in everything in this folder (keep the `assets` and `posts` folders), and commit.
3. Go to **Settings → Pages**. Under "Build and deployment", set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**, and save.
4. After a minute or two, the site is live at **https://ewhites.github.io**.

## Add a blog post
1. Copy `posts/_template.html` to `posts/your-post-name.html` and fill in everything marked `CHANGE ME`.
2. In `blog.html`, copy one `<li>` block and paste it at the top of the list. Change the date, tag, link, title, and summary.
3. Do the same in the "Latest writing" list on `index.html`.
4. Upload the changed files to GitHub. The site updates in about a minute.

Tags and their colors: `physics` (blue), `project` (green), `paper` (red), `note` (yellow).
