import SwiftUI

#if os(iOS)
import UIKit
private typealias PlatformImage = UIImage
#elseif os(macOS)
import AppKit
private typealias PlatformImage = NSImage
#endif

/// Displays a server's favicon fetched from common paths, falling back to a
/// coloured rounded-rect with the first letter of the display name.
struct ServerIconView: View {
    let serverURL: String
    let displayName: String
    let fallbackColor: Color
    var size: CGFloat = 36

    @State private var iconImage: PlatformImage?
    @State private var probed = false

    var body: some View {
        Group {
            if let iconImage {
                #if os(iOS)
                Image(uiImage: iconImage)
                    .resizable()
                    .scaledToFill()
                #elseif os(macOS)
                Image(nsImage: iconImage)
                    .resizable()
                    .scaledToFill()
                #endif
            } else {
                Text(String(displayName.prefix(1)).uppercased())
                    .font(.system(size: size * 0.42, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(fallbackColor)
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: size * 0.22))
        .task(id: serverURL) {
            guard !probed else { return }
            await probe()
        }
    }

    // MARK: - Favicon probing

    private static let candidatePaths = [
        "favicon.ico",
        "favicon.png",
        "logo.png",
    ]

    private func probe() async {
        defer { probed = true }

        let base = serverURL.hasSuffix("/") ? serverURL : "\(serverURL)/"

        for path in Self.candidatePaths {
            guard let url = URL(string: "\(base)\(path)") else { continue }
            do {
                let (data, response) = try await URLSession.shared.data(from: url)
                guard let http = response as? HTTPURLResponse,
                      http.statusCode == 200,
                      !data.isEmpty,
                      PlatformImage(data: data) != nil
                else { continue }
                iconImage = PlatformImage(data: data)
                return
            } catch {
                continue
            }
        }
    }
}
