/**
 * Retries an async operation with exponential backoff
 * 
 * @param {Function} operation - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms (default: 1000)
 * @param {number} maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} onRetry - Optional callback called on each retry
 * @returns {Promise} - The result of the operation
 */
export const retryWithBackoff = async (
  operation,
  maxRetries = 3,
  initialDelay = 1000,
  maxDelay = 10000,
  onRetry = null
) => {
  let retries = 0;
  let lastError = null;

  while (retries <= maxRetries) {
    try {
      if (retries > 0) {
        console.log(`Retry attempt ${retries}/${maxRetries}`);
      }
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (retries >= maxRetries) {
        console.log(`Failed after ${maxRetries} retries`);
        break;
      }

      // Calculate delay with exponential backoff and some jitter
      const delay = Math.min(
        initialDelay * Math.pow(2, retries) * (0.9 + Math.random() * 0.2),
        maxDelay
      );
      
      console.log(`Retry in ${Math.round(delay)}ms`);
      
      if (onRetry) {
        onRetry(error, retries, delay);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
  
  throw lastError;
}; 