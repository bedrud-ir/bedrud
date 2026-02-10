import SwiftUI

struct AddInstanceView: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @EnvironmentObject private var instanceStore: InstanceStore

    @State private var serverURL = ""
    @State private var displayName = ""
    @State private var isChecking = false
    @State private var errorMessage: String?
    @State private var navigateToLogin = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "server.rack")
                        .font(.system(size: 48))
                        .foregroundStyle(BedrudColors.primary)

                    Text("Bedrud")
                        .font(BedrudTypography.largeTitle)
                        .foregroundStyle(BedrudColors.foreground)

                    Text("Connect to a server to get started")
                        .font(BedrudTypography.subheadline)
                        .foregroundStyle(BedrudColors.mutedForeground)
                }
                .padding(.top, 60)
                .padding(.bottom, 20)

                VStack(spacing: 20) {
                    // Existing servers
                    if !instanceStore.instances.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("YOUR SERVERS")
                                .font(BedrudTypography.caption)
                                .foregroundStyle(BedrudColors.mutedForeground)
                                .tracking(0.5)

                            ForEach(instanceStore.instances) { instance in
                                ServerRowButton(
                                    instance: instance,
                                    isActive: instance.id == instanceStore.activeInstanceId
                                ) {
                                    instanceManager.switchTo(instance.id)
                                    navigateToLogin = true
                                }
                            }
                        }

                        divider
                    }

                    // Add server form
                    addServerForm
                }
                .padding(.horizontal, 24)

                Spacer()
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .background(BedrudColors.background)
        .toolbar(.hidden, for: .navigationBar)
        .navigationDestination(isPresented: $navigateToLogin) {
            LoginView()
        }
    }

    // MARK: - Add Server Form

    private var addServerForm: some View {
        VStack(alignment: .leading, spacing: 16) {
            if !instanceStore.instances.isEmpty {
                Text("ADD NEW SERVER")
                    .font(BedrudTypography.caption)
                    .foregroundStyle(BedrudColors.mutedForeground)
                    .tracking(0.5)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Server URL")
                    .font(BedrudTypography.caption)
                    .foregroundStyle(BedrudColors.mutedForeground)

                TextField("https://meet.example.com", text: $serverURL)
                    .textFieldStyle(BedrudTextFieldStyle())
                    .keyboardType(.URL)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .onChange(of: serverURL) { _, _ in
                        errorMessage = nil
                    }
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Display Name")
                    .font(BedrudTypography.caption)
                    .foregroundStyle(BedrudColors.mutedForeground)

                TextField("My Server", text: $displayName)
                    .textFieldStyle(BedrudTextFieldStyle())
                    .autocorrectionDisabled()
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(BedrudTypography.caption)
                    .foregroundStyle(BedrudColors.destructive)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            Button(action: addServer) {
                if isChecking {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text("Add Server")
                        .font(BedrudTypography.body.bold())
                }
            }
            .buttonStyle(BedrudPrimaryButtonStyle())
            .disabled(isChecking || serverURL.isEmpty || displayName.isEmpty)
        }
    }

    private var divider: some View {
        HStack(spacing: 12) {
            Rectangle()
                .fill(BedrudColors.border)
                .frame(height: 1)
            Text("or")
                .font(BedrudTypography.caption)
                .foregroundStyle(BedrudColors.mutedForeground)
            Rectangle()
                .fill(BedrudColors.border)
                .frame(height: 1)
        }
    }

    // MARK: - Actions

    private func addServer() {
        var url = serverURL.trimmingCharacters(in: .whitespacesAndNewlines)
        if !url.hasPrefix("http://") && !url.hasPrefix("https://") {
            url = "https://\(url)"
        }
        if !url.hasSuffix("/") {
            url += "/"
        }

        isChecking = true
        errorMessage = nil

        Task {
            do {
                try await instanceManager.addInstance(
                    serverURL: url,
                    displayName: displayName.trimmingCharacters(in: .whitespaces)
                )
                navigateToLogin = true
            } catch {
                errorMessage = "Could not reach server: \(error.localizedDescription)"
            }
            isChecking = false
        }
    }
}

// MARK: - Server Row

private struct ServerRowButton: View {
    let instance: Instance
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Text(String(instance.displayName.prefix(1)).uppercased())
                    .font(BedrudTypography.headline)
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(parseSwitcherColor(instance.iconColorHex))
                    .clipShape(RoundedRectangle(cornerRadius: 10))

                VStack(alignment: .leading, spacing: 2) {
                    Text(instance.displayName)
                        .font(BedrudTypography.headline)
                        .foregroundStyle(BedrudColors.foreground)
                    Text(instance.serverURL)
                        .font(BedrudTypography.caption)
                        .foregroundStyle(BedrudColors.mutedForeground)
                        .lineLimit(1)
                }

                Spacer()

                if isActive {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(BedrudColors.primary)
                }

                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(BedrudColors.mutedForeground)
            }
            .padding(12)
            .background(BedrudColors.card)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isActive ? BedrudColors.primary.opacity(0.3) : BedrudColors.border, lineWidth: 1)
            )
        }
    }

    private func parseSwitcherColor(_ hex: String) -> Color {
        let cleaned = hex.trimmingCharacters(in: .init(charactersIn: "#"))
        guard cleaned.count == 6,
              let val = UInt64(cleaned, radix: 16) else {
            return BedrudColors.primary
        }
        return Color(
            red: Double((val >> 16) & 0xFF) / 255,
            green: Double((val >> 8) & 0xFF) / 255,
            blue: Double(val & 0xFF) / 255
        )
    }
}
