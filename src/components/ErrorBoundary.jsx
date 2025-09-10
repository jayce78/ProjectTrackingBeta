import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, err: error };
  }
  componentDidCatch(error, info) {
    console.error("UI Crash:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.err || "")}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
