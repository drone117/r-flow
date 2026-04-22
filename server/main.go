/**
 * Go backend server for R-Flow.
 *
 * A standalone HTTP server for production use. Provides two features:
 *
 * 1. POST /api/request — Proxies HTTP requests server-side to avoid CORS.
 *    The browser sends the target URL, method, params, and body as JSON.
 *    This server makes the actual request and returns the response.
 *
 * 2. GET /api/health — Simple health check endpoint.
 *
 * 3. Static file serving — Serves the built frontend from ./dist on /.
 *    In production, the Vite build output (npm run build) goes into dist/,
 *    and this server serves those files directly.
 *
 * During development, the Vite dev server handles /api/request via the
 * requestProxy() plugin in vite.config.ts, so this server is not needed.
 *
 * Usage:
 *   go run server/main.go
 *   # Listens on :8080
 *
 * Request format (POST /api/request):
 *   {
 *     "url": "https://api.example.com/data",
 *     "method": "GET",
 *     "params": {"key": "value"},
 *     "body": "{\"key\": \"value\"}"
 *   }
 *
 * Response format:
 *   {
 *     "status": 200,
 *     "headers": {"content-type": "application/json", ...},
 *     "body": "...raw response body...",
 *     "ok": true
 *   }
 */
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
)

// ProxyRequest is the JSON payload sent by the browser's HTTP Request node.
type ProxyRequest struct {
	URL    string            `json:"url"`
	Method string            `json:"method"`
	Params map[string]string `json:"params"`
	Body   string            `json:"body"`
}

// ProxyResponse is the JSON response returned to the browser.
type ProxyResponse struct {
	Status  int               `json:"status"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
	OK      bool              `json:"ok"`
}

// handleProxy processes POST /api/request — proxies the HTTP request.
func handleProxy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Decode the request body
	var req ProxyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Default to GET if no method specified
	if req.Method == "" {
		req.Method = http.MethodGet
	}

	// Parse the target URL
	parsedURL, err := url.Parse(req.URL)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, ProxyResponse{
			Status: 0, Headers: map[string]string{}, Body: fmt.Sprintf("invalid URL: %s", err), OK: false,
		})
		return
	}

	// Append query parameters to the URL
	if len(req.Params) > 0 {
		q := parsedURL.Query()
		for k, v := range req.Params {
			q.Set(k, v)
		}
		parsedURL.RawQuery = q.Encode()
	}

	// Build the request body (only for methods that support a body)
	var bodyReader io.Reader
	if req.Body != "" && req.Method != http.MethodGet && req.Method != http.MethodHead {
		bodyReader = strings.NewReader(req.Body)
	}

	// Create the proxy request
	proxyReq, err := http.NewRequest(req.Method, parsedURL.String(), bodyReader)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, ProxyResponse{
			Status: 0, Headers: map[string]string{}, Body: fmt.Sprintf("failed to create request: %s", err), OK: false,
		})
		return
	}

	// Set Content-Type header if we're sending a body
	if bodyReader != nil {
		proxyReq.Header.Set("Content-Type", "application/json")
	}

	// Execute the request
	client := &http.Client{}
	resp, err := client.Do(proxyReq)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, ProxyResponse{
			Status: 0, Headers: map[string]string{}, Body: fmt.Sprintf("request failed: %s", err), OK: false,
		})
		return
	}
	defer resp.Body.Close()

	// Read the response body
	respBody, _ := io.ReadAll(resp.Body)

	// Collect response headers (take the first value for each key)
	headers := make(map[string]string)
	for k, vv := range resp.Header {
		if len(vv) > 0 {
			headers[k] = vv[0]
		}
	}

	// Return the proxied response
	writeJSON(w, http.StatusOK, ProxyResponse{
		Status:  resp.StatusCode,
		Headers: headers,
		Body:    string(respBody),
		OK:      resp.StatusCode >= 200 && resp.StatusCode < 300,
	})
}

// handleHealth responds to GET /api/health with a simple status check.
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// writeJSON is a helper that writes a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func main() {
	// Register API routes
	http.HandleFunc("/api/request", handleProxy)
	http.HandleFunc("/api/health", handleHealth)

	// Serve static files from ./dist (the Vite build output)
	fs := http.FileServer(http.Dir("./dist"))
	http.Handle("/", fs)

	addr := ":8080"
	log.Printf("Server listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
