import SwiftUI

struct AddInstanceView: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @EnvironmentObject private var instanceStore: InstanceStore

    @State private var serverHost = "bedrud.xyz"
    @State private var displayName = "Bedrud Home"
    @State private var insecure = false
    @State private var isChecking = false
    @State private var errorMessage: String?
    @State private var navigateToLogin = false

    private var scheme: String { insecure ? "http" : "https" }

    /// The full URL that would be saved, used for duplicate checking.
    private var resolvedURL: String {
        var host = serverHost.trimmingCharacters(in: .whitespacesAndNewlines)
        for prefix in ["https://", "http://"] {
            if host.hasPrefix(prefix) { host = String(host.dropFirst(prefix.count)) }
        }
        host = host.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        return "\(scheme)://\(host)/"
    }

    private var isDuplicate: Bool {
        instanceStore.instances.contains { $0.serverURL.lowercased() == resolvedURL.lowercased() }
    }

    var body: some View {
        Form {
            // Header
            Section {
                VStack(spacing: 10) {
                    Image(systemName: "server.rack")
                        .font(.system(size: 48, weight: .light))
                        .foregroundStyle(.tint)

                    Text("Bedrud")
                        .font(.largeTitle.bold())

                    Text("Connect to a server to get started")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
                .listRowBackground(Color.clear)
            }

            // Existing servers
            if !instanceStore.instances.isEmpty {
                Section {
                    ForEach(instanceStore.instances) { instance in
                        Button {
                            instanceManager.switchTo(instance.id)
                            navigateToLogin = true
                        } label: {
                            HStack(spacing: 12) {
                                ServerIconView(
                                    serverURL: instance.serverURL,
                                    displayName: instance.displayName,
                                    fallbackColor: parseSwitcherColor(instance.iconColorHex)
                                )

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(instance.displayName)
                                        .font(.body)
                                    Text(instance.serverURL)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }

                                Spacer()

                                if instance.id == instanceStore.activeInstanceId {
                                    Image(systemName: "checkmark")
                                        .font(.body.weight(.semibold))
                                        .foregroundStyle(.tint)
                                }
                            }
                        }
                        .tint(.primary)
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                deleteInstance(instance)
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                } header: {
                    Text("Your Servers")
                } footer: {
                    Text("Tap a server to sign in. Swipe to remove.")
                }
            }

            // Add server form
            Section {
                HStack(spacing: 0) {
                    Text("\(scheme)://")
                        .font(.footnote.monospaced())
                        .foregroundStyle(.secondary)
                        .padding(.trailing, 4)

                    TextField("meet.example.com", text: $serverHost)
                        .autocorrectionDisabled()
                        #if os(iOS)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        #endif
                        .onChange(of: serverHost) { _, _ in
                            errorMessage = nil
                        }
                }

                TextField("Display Name", text: $displayName)
                    .autocorrectionDisabled()

                Toggle(isOn: $insecure) {
                    Label("Insecure (no TLS)", systemImage: "lock.open")
                }
                .tint(.red)
            } header: {
                Text(instanceStore.instances.isEmpty ? "Server" : "Add New Server")
            } footer: {
                if insecure {
                    Label(
                        "Connection will not be encrypted. Only use for local or development servers.",
                        systemImage: "exclamationmark.triangle.fill"
                    )
                    .foregroundStyle(.red)
                }
            }
            .animation(.default, value: insecure)

            // Duplicate warning
            if isDuplicate && !serverHost.isEmpty {
                Section {
                    Label("A server with this address already exists.", systemImage: "exclamationmark.circle.fill")
                        .foregroundStyle(.orange)
                        .font(.footnote)
                }
            }

            // Error
            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "xmark.circle.fill")
                        .foregroundStyle(.red)
                        .font(.footnote)
                }
            }

            // Action
            Section {
                Button(action: addServer) {
                    Group {
                        if isChecking {
                            ProgressView()
                        } else {
                            Text("Add Server")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .font(.body.bold())
                }
                .disabled(isChecking || serverHost.isEmpty || displayName.isEmpty || isDuplicate)
            }
        }
        .formStyle(.grouped)
        #if os(iOS)
        .scrollDismissesKeyboard(.interactively)
        .toolbar(.hidden, for: .navigationBar)
        #endif
        .navigationDestination(isPresented: $navigateToLogin) {
            LoginView()
        }
    }

    // MARK: - Actions

    private func addServer() {
        isChecking = true
        errorMessage = nil

        Task {
            do {
                try await instanceManager.addInstance(
                    serverURL: resolvedURL,
                    displayName: displayName.trimmingCharacters(in: .whitespaces)
                )
                // Clear the form for the next add
                serverHost = ""
                displayName = ""
                insecure = false
                navigateToLogin = true
            } catch {
                errorMessage = "Could not reach server: \(error.localizedDescription)"
            }
            isChecking = false
        }
    }

    private func deleteInstance(_ instance: Instance) {
        Task {
            await instanceManager.removeInstance(instance.id)
        }
    }

    private func parseSwitcherColor(_ hex: String) -> Color {
        let cleaned = hex.trimmingCharacters(in: .init(charactersIn: "#"))
        guard cleaned.count == 6,
              let val = UInt64(cleaned, radix: 16) else { return .accentColor }
        return Color(
            red: Double((val >> 16) & 0xFF) / 255,
            green: Double((val >> 8) & 0xFF) / 255,
            blue: Double(val & 0xFF) / 255
        )
    }
}
