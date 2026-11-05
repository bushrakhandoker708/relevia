import ErrorBoundary from './ErrorBoundary.jsx';
/**
 * Higher-Order Component wrapper for functional components
 * @param {React.Component} Component - Component to wrap
 * @param {Object} errorBoundaryProps - Props to pass to ErrorBoundary
 * @returns {React.Component} Wrapped component
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

/**
 * Hook for manually triggering error boundary (for testing)
 * @returns {Function} Function to trigger error
 */
export const useErrorHandler = () => {
  return (error) => {
    throw error;
  };
};

