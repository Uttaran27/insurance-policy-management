const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const readPage = (query) => {
    const parsedPage = Number.parseInt(query.page, 10);
    const parsedLimit = Number.parseInt(query.limit, 10);

    const page = Number.isInteger(parsedPage) && parsedPage > 0
        ? parsedPage
        : DEFAULT_PAGE;
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;

    return {
        page,
        limit,
        skip: (page - 1) * limit
    };
};

module.exports = { readPage };
