import Foundation

@MainActor
final class InstanceStore: ObservableObject {
    @Published private(set) var instances: [Instance] = []
    @Published var activeInstanceId: String?

    private let defaults: UserDefaults
    private let instancesKey = "bedrud_instances"
    private let activeInstanceIdKey = "bedrud_active_instance_id"

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        loadInstances()
        activeInstanceId = defaults.string(forKey: activeInstanceIdKey)
    }

    var activeInstance: Instance? {
        instances.first { $0.id == activeInstanceId }
    }

    // MARK: - CRUD

    func addInstance(_ instance: Instance) {
        instances.append(instance)
        if instances.count == 1 {
            setActive(instance.id)
        }
        save()
    }

    func removeInstance(_ id: String) {
        instances.removeAll { $0.id == id }
        if activeInstanceId == id {
            activeInstanceId = instances.first?.id
            defaults.set(activeInstanceId, forKey: activeInstanceIdKey)
        }
        save()
    }

    func setActive(_ id: String) {
        guard instances.contains(where: { $0.id == id }) else { return }
        activeInstanceId = id
        defaults.set(id, forKey: activeInstanceIdKey)
    }

    // MARK: - Persistence

    private func save() {
        if let data = try? JSONEncoder().encode(instances) {
            defaults.set(data, forKey: instancesKey)
        }
    }

    private func loadInstances() {
        guard let data = defaults.data(forKey: instancesKey),
              let decoded = try? JSONDecoder().decode([Instance].self, from: data)
        else { return }
        instances = decoded
    }
}
