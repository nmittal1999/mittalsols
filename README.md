# Mittal Solutions

One-page website for **Mittal Solutions**, an India-based firm that provides business process services to overseas and domestic clients.

## Local preview

Open `index.html` in a browser, or serve the folder with any static file server.

The contact form posts to `/api/contact`, which is a Cloudflare Pages Function. For full form testing, use Pages locally or a deployed Pages project:

```bash
npx wrangler pages dev .
```

## Contact form

The contact section includes:

- Direct email: `business@mittalsols.com`
- A working form that sends messages to that address through `functions/api/contact.js`

Delivery order used by the function:

1. **Resend** if `RESEND_API_KEY` is set in Cloudflare Pages environment variables
2. **Web3Forms** if `WEB3FORMS_ACCESS_KEY` is set
3. **FormSubmit** fallback to `business@mittalsols.com` (confirm the first delivery email when prompted)

Optional environment variables:

- `CONTACT_TO_EMAIL` (defaults to `business@mittalsols.com`)
- `CONTACT_FROM_EMAIL` (Resend verified sender)

## Deploy

This project is set up for [Cloudflare Pages](https://pages.cloudflare.com/). Connect the repository and deploy with no build step (static output plus Functions).

Related files:

- `functions/_middleware.js` injects social preview meta tags
- `functions/api/contact.js` handles contact form submissions
- `robots.txt` and `sitemap.xml` for search indexing
- `_headers` for Pages header rules

## Contact

business@mittalsols.com
