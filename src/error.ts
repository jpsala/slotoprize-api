class HttpException extends Error {
  status: number;
  message: string;
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.message = message
  }
}

class ParamRequiredException extends HttpException {
  constructor(message: string) {
    super(404, `Parameter ${message} is required`)
  }
}

export default ParamRequiredException
