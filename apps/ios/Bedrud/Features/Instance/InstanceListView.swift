import SwiftUI

struct InstanceListView: View {
    @EnvironmentObject private var instanceManager: InstanceManager

    @State private var showAddInstance: Bool = false

    private var instances: [Instance] {
        instanceManager.store.instances
    }

    private var activeId: String? {
        instanceManager.store.activeInstanceId
    }

    var body: some View {
        NavigationStack {
            List {
                ForEach(instances) { instance in
                    Button {
                        instanceManager.switchTo(instance.id)
                    } label: {
                        HStack(spacing: 12) {
                            Circle()
                                .fill(Color(hex: instance.iconColorHex) ?? BedrudColors.primary)
                                .frame(width: 36, height: 36)
                                .overlay(
                                    Text(String(instance.displayName.prefix(1)).uppercased())
                                        .font(BedrudTypography.headline)
                                        .foregroundStyle(.white)
                                )

                            VStack(alignment: .leading, spacing: 2) {
                                Text(instance.displayName)
                                    .font(BedrudTypography.body)
                                    .foregroundStyle(BedrudColors.foreground)

                                Text(instance.serverURL)
                                    .font(BedrudTypography.caption)
                                    .foregroundStyle(BedrudColors.mutedForeground)
                                    .lineLimit(1)
                            }

                            Spacer()

                            if instance.id == activeId {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(BedrudColors.primary)
                            }
                        }
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        Button(role: .destructive) {
                            Task { await instanceManager.removeInstance(instance.id) }
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                }
            }
            .navigationTitle("Servers")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showAddInstance = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showAddInstance) {
                AddInstanceView()
                    .environmentObject(instanceManager)
            }
        }
    }
}

// MARK: - Color hex init

extension Color {
    init?(hex: String) {
        var hex = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hex = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex

        guard hex.count == 6,
              let intVal = UInt64(hex, radix: 16)
        else { return nil }

        let r = Double((intVal >> 16) & 0xFF) / 255.0
        let g = Double((intVal >> 8) & 0xFF) / 255.0
        let b = Double(intVal & 0xFF) / 255.0

        self.init(red: r, green: g, blue: b)
    }
}
