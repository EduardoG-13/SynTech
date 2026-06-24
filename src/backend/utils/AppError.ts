export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    // Necessário para manter o prototype correto quando estendendo classes nativas no TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
