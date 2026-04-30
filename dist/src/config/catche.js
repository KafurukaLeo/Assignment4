import compression from 'compression';
// Enable gzip compression
export const cache = compression();
// Optional: custom cache headers middleware
export const cacheHeaders = (duration) => {
    return (req, res, next) => {
        res.set('Cache-Control', `public, max-age=${duration}`);
        next();
    };
};
export const setCacheHeaders = cacheHeaders;
//# sourceMappingURL=catche.js.map