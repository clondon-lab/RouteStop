import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center bg-red-50 p-8">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-6 border border-red-200">
            <div className="text-red-600 text-xl font-bold mb-2">Something went wrong</div>
            <div className="text-gray-700 text-sm font-mono bg-gray-100 rounded p-3 overflow-auto max-h-48">
              {this.state.error.message}
            </div>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
