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

type ProxyRequest struct {
	URL    string            `json:"url"`
	Method string            `json:"method"`
	Params map[string]string `json:"params"`
	Body   string            `json:"body"`
}

type ProxyResponse struct {
	Status  int               `json:"status"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
	OK      bool              `json:"ok"`
}

func handleProxy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ProxyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Method == "" {
		req.Method = http.MethodGet
	}

	parsedURL, err := url.Parse(req.URL)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, ProxyResponse{
			Status: 0, Headers: map[string]string{}, Body: fmt.Sprintf("invalid URL: %s", err), OK: false,
		})
		return
	}

	if len(req.Params) > 0 {
		q := parsedURL.Query()
		for k, v := range req.Params {
			q.Set(k, v)
		}
		parsedURL.RawQuery = q.Encode()
	}

	var bodyReader io.Reader
	if req.Body != "" && req.Method != http.MethodGet && req.Method != http.MethodHead {
		bodyReader = strings.NewReader(req.Body)
	}

	proxyReq, err := http.NewRequest(req.Method, parsedURL.String(), bodyReader)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, ProxyResponse{
			Status: 0, Headers: map[string]string{}, Body: fmt.Sprintf("failed to create request: %s", err), OK: false,
		})
		return
	}

	if bodyReader != nil {
		proxyReq.Header.Set("Content-Type", "application/json")
	}

	client := &http.Client{}
	resp, err := client.Do(proxyReq)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, ProxyResponse{
			Status: 0, Headers: map[string]string{}, Body: fmt.Sprintf("request failed: %s", err), OK: false,
		})
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	headers := make(map[string]string)
	for k, vv := range resp.Header {
		if len(vv) > 0 {
			headers[k] = vv[0]
		}
	}

	writeJSON(w, http.StatusOK, ProxyResponse{
		Status:  resp.StatusCode,
		Headers: headers,
		Body:    string(respBody),
		OK:      resp.StatusCode >= 200 && resp.StatusCode < 300,
	})
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func main() {
	http.HandleFunc("/api/request", handleProxy)
	http.HandleFunc("/api/health", handleHealth)

	fs := http.FileServer(http.Dir("./dist"))
	http.Handle("/", fs)

	addr := ":8080"
	log.Printf("Server listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
