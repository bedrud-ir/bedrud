import XCTest
import KeychainAccess
@testable import Bedrud

@MainActor
final class PasswordChangeTests: XCTestCase {
    private var session: URLSession!
    private var client: APIClient!
    private var authManager: AuthManager!
    private var authAPI: AuthAPI!
    private var keychain: Keychain!

    override func setUp() {
        super.setUp()
        let id = UUID().uuidString
        session = URLSession.mock()
        client = APIClient(baseURL: "https://test.com/api", session: session)
        keychain = Keychain(service: "org.bedrud.tests.pwchange.\(id)")
        authAPI = AuthAPI(client: client)
        authManager = AuthManager(instanceId: "test", authAPI: authAPI, keychain: keychain)
        let tokens = AuthTokens(accessToken: TestHelpers.fakeJWT(), refreshToken: "r")
        authManager.loginWithTokens(tokens: tokens, user: TestHelpers.createUser())
    }

    override func tearDown() {
        MockURLProtocol.requestHandler = nil
        try? keychain.removeAll()
        session = nil; client = nil; authManager = nil; authAPI = nil; keychain = nil
        super.tearDown()
    }

    // MARK: - Endpoint Contract

    func testChangePasswordSendsPUTToCorrectPath() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/auth/password"))
            XCTAssertEqual(request.httpMethod, "PUT")
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, Data())
        }
        try await authAPI.changePassword(
            currentPassword: "oldpass",
            newPassword: "newpass123",
            authManager: authManager
        )
    }

    func testChangePasswordSendsAuthorizationHeader() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertNotNil(request.value(forHTTPHeaderField: "Authorization"))
            XCTAssertTrue(request.value(forHTTPHeaderField: "Authorization")!.hasPrefix("Bearer "))
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, Data())
        }
        try await authAPI.changePassword(
            currentPassword: "old",
            newPassword: "new123456",
            authManager: authManager
        )
    }

    func testChangePasswordSendsBodyWithBothPasswords() async throws {
        MockURLProtocol.requestHandler = { request in
            let body = String(data: request.httpBody ?? Data(), encoding: .utf8) ?? ""
            XCTAssertTrue(body.contains("currentPassword") || body.contains("current_password"))
            XCTAssertTrue(body.contains("oldpassword"))
            XCTAssertTrue(body.contains("newpassword"))
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, Data())
        }
        try await authAPI.changePassword(
            currentPassword: "oldpassword",
            newPassword: "newpassword",
            authManager: authManager
        )
    }

    // MARK: - Error Handling

    func testChangePasswordThrowsOn401() async {
        MockURLProtocol.requestHandler = { request in
            let res = HTTPURLResponse(url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil)!
            return (res, #"{"error":"wrong current password"}"#.data(using: .utf8)!)
        }
        do {
            try await authAPI.changePassword(
                currentPassword: "wrong",
                newPassword: "newpass",
                authManager: authManager
            )
            XCTFail("Should throw for 401")
        } catch { /* expected */ }
    }

    func testChangePasswordThrowsOn422() async {
        MockURLProtocol.requestHandler = { request in
            let res = HTTPURLResponse(url: request.url!, statusCode: 422, httpVersion: nil, headerFields: nil)!
            return (res, #"{"error":"password too short"}"#.data(using: .utf8)!)
        }
        do {
            try await authAPI.changePassword(
                currentPassword: "current",
                newPassword: "abc",
                authManager: authManager
            )
            XCTFail("Should throw for 422")
        } catch { /* expected */ }
    }

    func testChangePasswordThrowsOnNetworkError() async {
        MockURLProtocol.requestHandler = { _ in
            throw URLError(.notConnectedToInternet)
        }
        do {
            try await authAPI.changePassword(
                currentPassword: "cur",
                newPassword: "new",
                authManager: authManager
            )
            XCTFail("Should throw on network error")
        } catch { /* expected */ }
    }

    // MARK: - Validation Logic (UI-level, tested inline)

    func testPasswordLengthValidationLogic() {
        // Mirrors the validation in SettingsView.performPasswordChange()
        func isValidLength(_ password: String) -> Bool { password.count >= 8 }

        XCTAssertFalse(isValidLength("short"))
        XCTAssertFalse(isValidLength("7chars!"))
        XCTAssertTrue(isValidLength("8chars!!"))
        XCTAssertTrue(isValidLength("longenoughpassword"))
    }

    func testPasswordMismatchValidationLogic() {
        func passwordsMatch(_ a: String, _ b: String) -> Bool { a == b }

        XCTAssertTrue(passwordsMatch("same", "same"))
        XCTAssertFalse(passwordsMatch("abc", "def"))
        XCTAssertFalse(passwordsMatch("password", "Password"))
    }
}
