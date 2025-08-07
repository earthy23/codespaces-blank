// Loading optimization utilities for better UX
export const LOADING_TIMEOUTS = {
  FAST: 2000, // For simple API calls
  MEDIUM: 4000, // For complex data loading
  SLOW: 8000, // For file uploads or heavy operations
};

export const createTimeoutPromise = <T>(
  promise: Promise<T>,
  timeout: number,
  fallbackData?: T,
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        if (fallbackData !== undefined) {
          // If fallback data is provided, resolve with it instead of rejecting
          return Promise.resolve(fallbackData);
        }
        reject(new Error("Operation timed out"));
      }, timeout),
    ),
  ]);
};

export const withFallback = async <T>(
  asyncOperation: () => Promise<T>,
  fallbackData: T,
  timeout: number = LOADING_TIMEOUTS.FAST,
): Promise<T> => {
  try {
    return await createTimeoutPromise(asyncOperation(), timeout, fallbackData);
  } catch (error) {
    console.warn("Operation failed, using fallback data:", error);
    return fallbackData;
  }
};

export const createLoadingState = (initialLoading = false) => {
  let loading = initialLoading;
  const subscribers: Array<(loading: boolean) => void> = [];

  return {
    get isLoading() {
      return loading;
    },
    setLoading(value: boolean) {
      loading = value;
      subscribers.forEach((callback) => callback(loading));
    },
    subscribe(callback: (loading: boolean) => void) {
      subscribers.push(callback);
      return () => {
        const index = subscribers.indexOf(callback);
        if (index > -1) subscribers.splice(index, 1);
      };
    },
  };
};
