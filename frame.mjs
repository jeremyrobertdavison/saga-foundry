/** Render the bundled page even when Foundry serves .html as text/plain. */
export function creatorDocument(html, assetBase) {
 if (!/<head(?:\s[^>]*)?>/i.test(html) || !/id=["']root["']/i.test(html)) {
  throw new Error('The SAGA creator page is missing or invalid. Reinstall the complete module ZIP.');
 }
 const escaped=String(assetBase).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
 return html.replace(/<head(?:\s[^>]*)?>/i,match=>`${match}\n<base href="${escaped}">`);
}
