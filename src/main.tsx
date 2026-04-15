import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@/lib/api-client";

// Apply backend origin for both dev and production when provided.
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
setBaseUrl(configuredApiBaseUrl);


class AppErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{ hasError: boolean; errorMessage?: string }
> {
	constructor(props: { children: React.ReactNode }) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: unknown) {
		return {
			hasError: true,
			errorMessage: error instanceof Error ? error.message : "Unknown client error",
		};
	}

	componentDidCatch(error: unknown) {
		console.error("Frontend crashed:", error);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen flex items-center justify-center bg-background p-6">
					<div className="w-full max-w-xl rounded-lg border bg-card p-6 shadow">
						<h1 className="text-xl font-semibold text-destructive">Frontend crashed</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							The app hit a runtime error. Reload the page after checking backend status.
						</p>
						<pre className="mt-4 max-h-48 overflow-auto rounded bg-muted p-3 text-xs text-foreground">
							{this.state.errorMessage}
						</pre>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

createRoot(document.getElementById("root")!).render(
	<AppErrorBoundary>
		<App />
	</AppErrorBoundary>,
);
