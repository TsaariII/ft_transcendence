const { ERROR_CODES } = require('@sharedErr');

function formatValidationError(error) {
    // Take the firts validation issue if present
    const issue = (error.validation && error.validation[0]) || {};

    // Ajv usually gives paths like "/username" or "/body/username"
    const path = issue.instancePath || '';
    const segments = typeof path === 'string'
        ? paths.split('/').filter(Boolean)
        : [];
    const field = segments[segments.length - 1] || '';
    // Base HTTP status for validation errors if anything weird 400
    const base = ERROR_CODES && ERROR_CODES.VALIDATION_FAILED
        ? ERROR_CODES.VALIDATION_FAILED()
        : {code: 400, message: 'Invalid input'};
    let message;
    switch (field)
    {
        case 'username':
        case 'password':
            message = 'Invalid username or password';
            break;
        case 'alias':
            message = 'Invalid alias';
            break;
        default:
            message = 'Validation error';
            break;
    }
    return {
        code: base.code,
        error: 'VALIDATION_FAILED',
        message
    };
}

// Fallback formatter for unexpected server errors
function formatServerError(error) {
    const base = ERROR_CODES && ERROR_CODES.SERVER_ERROR
        ? ERROR_CODES.SERVER_ERROR
        : {code: 500, message: 'Unexpected server error'};
    return {
        code: base.code,
        error: 'SERVER_ERROR',
        message: (error && error.message) || base.message
    };
}

module.exports = {
    formatValidationError,
    formatServerError
};
