import SwiftUI

struct InstanceSwitcherSheet: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @Environment(\.dismiss) private var dismiss

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
                        dismiss()
                    } label: {
                        HStack(spacing: 12) {
                            Circle()
                                .fill(Color(hex: instance.iconColorHex) ?? BedrudColors.primary)
                                .frame(width: 32, height: 32)
                                .overlay(
                                    Text(String(instance.displayName.prefix(1)).uppercased())
                                        .font(BedrudTypography.footnote.bold())
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
                                Image(systemName: "checkmark")
                                    .foregroundStyle(BedrudColors.primary)
                                    .fontWeight(.semibold)
                            }
                        }
                    }
                }

                Button {
                    showAddInstance = true
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundStyle(BedrudColors.primary)

                        Text("Add Server")
                            .font(BedrudTypography.body)
                            .foregroundStyle(BedrudColors.primary)
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
                AddInstanceView()
                    .environmentObject(instanceManager)
            }
        }
    }
}
