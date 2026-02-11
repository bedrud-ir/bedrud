#if os(iOS)
import SwiftUI
import UIKit
import AVKit
import LiveKit

// MARK: - Preview View Controller

/// Inline video renderer that also serves as the PiP source view anchor.
final class PiPPreviewViewController: UIViewController, VideoRenderer {
    let displayLayer = AVSampleBufferDisplayLayer()

    var isAdaptiveStreamEnabled: Bool { false }
    var adaptiveStreamSize: CGSize { .zero }

    override func viewDidLoad() {
        super.viewDidLoad()
        displayLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(displayLayer)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        displayLayer.frame = view.bounds
        CATransaction.commit()
    }

    nonisolated func render(frame: LiveKit.VideoFrame) {
        guard let sampleBuffer = frame.toCMSampleBuffer() else { return }
        DispatchQueue.main.async { [weak self] in
            self?.displayLayer.sampleBufferRenderer.enqueue(sampleBuffer)
        }
    }
}

// MARK: - Video Call View Controller (PiP Window)

/// Renders frames into the floating PiP window.
final class PiPVideoCallViewController: AVPictureInPictureVideoCallViewController, VideoRenderer {
    let displayLayer = AVSampleBufferDisplayLayer()

    var isAdaptiveStreamEnabled: Bool { false }
    var adaptiveStreamSize: CGSize { .zero }

    override func viewDidLoad() {
        super.viewDidLoad()
        displayLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(displayLayer)
        preferredContentSize = CGSize(width: 1080, height: 1920)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        displayLayer.frame = view.bounds
        CATransaction.commit()
    }

    nonisolated func render(frame: LiveKit.VideoFrame) {
        guard let sampleBuffer = frame.toCMSampleBuffer() else { return }
        let rotatedSize = frame.rotatedSize
        DispatchQueue.main.async { [weak self, rotatedSize] in
            self?.displayLayer.sampleBufferRenderer.enqueue(sampleBuffer)
            self?.preferredContentSize = rotatedSize
        }
    }
}

// MARK: - PiPView (SwiftUI Bridge)

struct PiPView: UIViewControllerRepresentable {
    let track: VideoTrack

    func makeUIViewController(context: Context) -> PiPPreviewViewController {
        let previewController = PiPPreviewViewController()
        let videoCallController = PiPVideoCallViewController()

        track.add(videoRenderer: previewController)
        track.add(videoRenderer: videoCallController)

        let contentSource = AVPictureInPictureController.ContentSource(
            activeVideoCallSourceView: previewController.view,
            contentViewController: videoCallController
        )
        let pipController = AVPictureInPictureController(contentSource: contentSource)
        pipController.canStartPictureInPictureAutomaticallyFromInline = true

        context.coordinator.pipController = pipController
        context.coordinator.videoCallController = videoCallController
        context.coordinator.track = track

        return previewController
    }

    func updateUIViewController(_ uiViewController: PiPPreviewViewController, context: Context) {}

    static func dismantleUIViewController(_ uiViewController: PiPPreviewViewController, coordinator: Coordinator) {
        if let track = coordinator.track {
            track.remove(videoRenderer: uiViewController)
            if let vc = coordinator.videoCallController {
                track.remove(videoRenderer: vc)
            }
        }
        coordinator.pipController = nil
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    final class Coordinator {
        var pipController: AVPictureInPictureController?
        var videoCallController: PiPVideoCallViewController?
        var track: VideoTrack?
    }
}

// MARK: - Helper Extensions

extension VideoRotation {
    var rotationAngle: CGFloat {
        switch self {
        case ._0: return 0
        case ._90: return .pi / 2
        case ._180: return .pi
        case ._270: return 3 * .pi / 2
        }
    }
}

extension VideoFrame {
    var rotatedSize: CGSize {
        switch rotation {
        case ._0, ._180:
            CGSize(width: CGFloat(dimensions.width), height: CGFloat(dimensions.height))
        case ._90, ._270:
            CGSize(width: CGFloat(dimensions.height), height: CGFloat(dimensions.width))
        }
    }
}

#endif
