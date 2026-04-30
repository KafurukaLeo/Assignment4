export function deprecatev1(req, res, next) {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', "Sat, 01 Jan 2026 00:00:00 GMT");
    res.setHeader("Link", '</api/v2>; rel="successor-version"');
    next();
}
//# sourceMappingURL=deprecation.middleware.js.map