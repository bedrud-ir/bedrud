import Foundation

// MARK: - API Errors

enum APIError: LocalizedError {
    case invalidURL
    case unauthorized
    case httpError(statusCode: Int, message: String)
    case decodingError(Error)
    case networkError(Error)
    case unknown

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .unauthorized:
            return "Unauthorized. Please log in again."
        case .httpError(let statusCode, let message):
            return "HTTP \(statusCode): \(message)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .unknown:
            return "An unknown error occurred"
        }
    }
}

// MARK: - API Error Response

private struct APIErrorResponse: Decodable {
    let error: String?
}

// MARK: - API Client

final class APIClient {
    let baseURL: String
    private let session: URLSession
    let decoder: JSONDecoder
    let encoder: JSONEncoder

    init(baseURL: String, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session

        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        self.decoder.dateDecodingStrategy = .iso8601

        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
    }

    // MARK: - Public Fetch (no auth)

    func fetch<T: Decodable>(
        _ endpoint: String,
        method: String = "GET",
        body: (any Encodable)? = nil
    ) async throws -> T {
        let request = try buildRequest(endpoint: endpoint, method: method, body: body, token: nil)
        return try await perform(request)
    }

    // MARK: - Authenticated Fetch

    func authFetch<T: Decodable>(
        _ endpoint: String,
        method: String = "GET",
        body: (any Encodable)? = nil,
        authManager: AuthManager
    ) async throws -> T {
        guard let token = try await authManager.getValidAccessToken() else {
            throw APIError.unauthorized
        }

        let request = try buildRequest(endpoint: endpoint, method: method, body: body, token: token)

        do {
            return try await perform(request)
        } catch APIError.unauthorized {
            // Attempt token refresh and retry once
            guard let refreshedToken = try await authManager.refreshAccessToken() else {
                throw APIError.unauthorized
            }
            let retryRequest = try buildRequest(
                endpoint: endpoint, method: method, body: body, token: refreshedToken
            )
            return try await perform(retryRequest)
        }
    }

    /// Authenticated fetch that discards the response body (for fire-and-forget endpoints).
    func authFetchVoid(
        _ endpoint: String,
        method: String = "GET",
        body: (any Encodable)? = nil,
        authManager: AuthManager
    ) async throws {
        guard let token = try await authManager.getValidAccessToken() else {
            throw APIError.unauthorized
        }

        let request = try buildRequest(endpoint: endpoint, method: method, body: body, token: token)
        try await performVoid(request)
    }

    // MARK: - Request Building

    private func buildRequest(
        endpoint: String,
        method: String,
        body: (any Encodable)?,
        token: String?
    ) throws -> URLRequest {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method

        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try encoder.encode(AnyEncodable(body))
        }

        return request
    }

    // MARK: - Response Handling

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await executeRequest(request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown
        }

        try validateResponse(httpResponse, data: data)

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    private func performVoid(_ request: URLRequest) async throws {
        let (data, response) = try await executeRequest(request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown
        }

        try validateResponse(httpResponse, data: data)
    }

    private func executeRequest(_ request: URLRequest) async throws -> (Data, URLResponse) {
        do {
            return try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }
    }

    private func validateResponse(_ response: HTTPURLResponse, data: Data) throws {
        guard (200...299).contains(response.statusCode) else {
            if response.statusCode == 401 {
                throw APIError.unauthorized
            }

            let message: String
            if let errorResponse = try? decoder.decode(APIErrorResponse.self, from: data) {
                message = errorResponse.error ?? "HTTP error"
            } else {
                message = "HTTP error! status: \(response.statusCode)"
            }

            throw APIError.httpError(statusCode: response.statusCode, message: message)
        }
    }
}

// MARK: - AnyEncodable Wrapper

private struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void

    init(_ value: any Encodable) {
        self._encode = { encoder in
            try value.encode(to: encoder)
        }
    }

    func encode(to encoder: Encoder) throws {
        try _encode(encoder)
    }
}
