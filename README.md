# Mark Lumaino Portfolio

A responsive developer portfolio for GitHub Pages, built with semantic HTML, modern CSS, and vanilla JavaScript. There are no build steps or package dependencies.

## Local preview

Open `index.html` directly in a browser, or serve the folder with any static server. For example:

```text
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Customize

- Replace `assets/Mark_Lumaino_Updated_CV.docx` with a newer CV when needed, or update the Download CV link in `index.html`.
- Replace the project links currently pointing to `#contact` with real live demo and repository URLs.
- Replace `YOUR_USERNAME` in the Open Graph URL with the GitHub username used for Pages.
- Add project screenshots under `assets/images/` and swap the CSS project artwork for image elements if desired.
- Update the contact, availability, experience, and project copy to reflect current information.

The downloadable CV is `assets/Mark_Lumaino_Updated_CV.docx`. The existing real contact details and avatar have been retained from the original repository. No project URLs were invented.

## Deploy to GitHub Pages

1. Push the repository to GitHub.
2. In the repository, open **Settings > Pages**.
3. Set the source to **Deploy from a branch**, select the default branch, and choose the `/ (root)` folder.
4. Save and wait for GitHub Pages to publish the site.
5. Replace the placeholder domain in the metadata once the Pages URL is known.

The root `.nojekyll` file is included so GitHub Pages serves the static files as-is. `404.html` provides a matching fallback page.
