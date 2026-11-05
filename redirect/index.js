export default {
  fetch(req) {
    const u = new URL(req.url);
    u.hostname = u.hostname.replace(/^peta-syariah\./, "shariacompass.");
    return Response.redirect(u.toString(), 301);
  },
};
