import { ApiResponse, ResponseData } from '../../common/types';

// Helper to resolve success responses
function resolveSuccess(
  messageText: string | undefined,
  code: number,

  data: ResponseData
): ApiResponse {
  const message =
    messageText !== null && messageText !== undefined ? messageText : '';
  return {
    status: 'success',
    message,
    code,
    responseData: data,
  };
}

// Helper to resolve failure responses
function resolveFailure(
  messageText: string | undefined,
  code: number
): ApiResponse {
  const message =
    messageText !== null && messageText !== undefined ? messageText : '';
  return {
    status: 'failure',
    message,
    code,
    responseData: null,
  };
}

export { resolveFailure, resolveSuccess };
