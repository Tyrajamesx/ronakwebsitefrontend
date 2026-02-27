import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.state.error = error;
        this.state.errorInfo = errorInfo;
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Something went wrong.</h1>
                    <div className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full overflow-auto">
                        <h2 className="text-xl font-semibold mb-2">Error:</h2>
                        <pre className="text-red-300 mb-4 whitespace-pre-wrap">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <h2 className="text-xl font-semibold mb-2">Component Stack:</h2>
                        <pre className="text-gray-400 text-sm whitespace-pre-wrap">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-3 bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
