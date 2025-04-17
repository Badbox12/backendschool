// types/controllerTypes.ts

/**
 * Standardized controller response format
 * @template T - Type of the data payload
 */
export type ControllerResponse<T = unknown> = {
    /** Whether the operation was successful */
    success: boolean;
    /** Response data (present when success is true) */
    data?: T;
    /** Error message (present when success is false) */
    error?: string;
    /** HTTP status code */
    statusCode?: number;
    /** Optional metadata for paginated responses */
    meta?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  
  /** Common HTTP status codes enum */
  export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    INTERNAL_SERVER_ERROR = 500,
    SERVICE_UNAVAILABLE = 503
  }
  
  /**
   * Utility function to create consistent controller responses
   * @template T - Type of the data payload
   */
  export const createResponse = <T = unknown>({
    success,
    data,
    error,
    statusCode,
    meta
  }: {
    success: boolean;
    data?: T;
    error?: string;
    statusCode?: number;
    meta?: ControllerResponse['meta'];
  }): ControllerResponse<T> => ({
    success,
    ...(data !== undefined && { data }),
    ...(error && { error }),
    statusCode: statusCode ?? (success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR),
    ...(meta && { meta })
  });
  
  // Example usage:
  // Successful response:
  // const successResponse = createResponse({ success: true, data: { id: 1 } });
  
  // Error response:
  // const errorResponse = createResponse({ 
  //   success: false, 
  //   error: 'Item not found',
  //   statusCode: HttpStatus.NOT_FOUND
  // });