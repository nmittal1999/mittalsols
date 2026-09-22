// Source and credits to: https://github.com/pew/cloudflare-pages-social-preview
class ElementHandler {
  constructor(ogtag) {
    this.ogtag = ogtag
  }
  element(element) {
    element.append(this.ogtag, { html: true })
  }
}

export async function onRequest(context) {
  const { request, next } = context
  const res = await next()
  const { searchParams, pathname } = new URL(request.url)

  if (!(pathname === '/index.html' || pathname === '/')) {
    return res
  }

  const metatitle = "Mittal Solutions | Business Process Services"
  const metadescription = "Mittal Solutions is an India-based firm delivering business process services to overseas and domestic clients."

  let name = searchParams.get('myQuery')
  let ogtag

  ogtag = `
    <meta property="og:title" content="${metatitle}" />
    <meta property="og:description" content="${metadescription}" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${request.url}" />
    <meta property="og:image" content="${new URL(request.url).origin}/img/preview.png?${name ? 'myQuery=' + name : 'default'}" />

    <meta property="og:image:height" content="630" />
    <meta property="og:image:width" content="1200" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${metatitle}" />
    <meta name="twitter:description" content="${metadescription}" />

    <meta name="description" content="${metadescription}" />
  `

  return new HTMLRewriter().on('head', new ElementHandler(ogtag)).transform(res)
}
