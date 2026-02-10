import SwiftUI

struct InstanceSwitcherSheet: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @Environment(\.dismiss) private var dismiss

    @State private var showAddInstance = false

    private var instances: [Instance] {
        instanceManager.store.instances
    }

    private var activeId: String? {
        instanceManager.store.activeInstanceId
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(instances) { instance in
                        Button {
                            instanceManager.switchTo(instance.id)
                            dismiss()
                        } label: {
                            HStack(spacing: 12) {
                                ServerIconView(
                                    serverURL: instance.serverURL,
                                    displayName: instance.displayName,
                                    fallbackColor: parseSwitcherColor(instance.iconColorHex),
                                    size: 32
                                )

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(instance.displayName)
                                        .font(.body)

                                    Text(instance.serverURL)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(1)
                                }

                                Spacer()

                                if instance.id == activeId {
                                    Image(systemName: "checkmark")
                                        .font(.body.weight(.semibold))
                                        .foregroundStyle(.tint)
                                }
                            }
                        }
                        .tint(.primary)
                    }
                }

                Section {
                    Button {
                        showAddInstance = true
                    } label: {
                        Label("Add Server", systemImage: "plus.circle.fill")
                            .font(.body)
                    }
                }
            }
            .navigationTitle("Switch Server")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .sheet(isPresented: $showAddInstance) {
                NavigationStack {
                    AddInstanceView()
                        .environmentObject(instanceManager)
                        .environmentObject(instanceManager.store)
                }
            }
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
