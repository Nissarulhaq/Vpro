
//IF Api Errors Came those will come In This formate
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went Wrong",
    errors = [],
    stack = ""
  ) {
    super(message)
    this.statusCode = statusCode,
      this.data = null,
      this.message = message,
      this.errors = errors,
      this.success = false
    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export { ApiError }