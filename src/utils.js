function errorHandler(err, req, res, next) {
    console.error(err.stack);

    res.status(500).json({
        success: false,
        code: 500,
        message: 'Internal Server Error',
    });
}

function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

export { errorHandler, asyncHandler };
