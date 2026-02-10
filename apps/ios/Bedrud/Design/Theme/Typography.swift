import SwiftUI

// MARK: - Bedrud Typography
//
// Centralized font definitions for the Bedrud iOS app.
// Uses the system font (SF Pro) with semantic sizing.

enum BedrudTypography {
    /// Large title - 34pt bold
    static let largeTitle: Font = .system(size: 34, weight: .bold, design: .default)

    /// Title - 28pt bold
    static let title: Font = .system(size: 28, weight: .bold, design: .default)

    /// Title 2 - 22pt semibold
    static let title2: Font = .system(size: 22, weight: .semibold, design: .default)

    /// Title 3 - 20pt semibold
    static let title3: Font = .system(size: 20, weight: .semibold, design: .default)

    /// Headline - 17pt semibold
    static let headline: Font = .system(size: 17, weight: .semibold, design: .default)

    /// Subheadline - 15pt regular
    static let subheadline: Font = .system(size: 15, weight: .regular, design: .default)

    /// Body - 17pt regular
    static let body: Font = .system(size: 17, weight: .regular, design: .default)

    /// Callout - 16pt regular
    static let callout: Font = .system(size: 16, weight: .regular, design: .default)

    /// Footnote - 13pt regular
    static let footnote: Font = .system(size: 13, weight: .regular, design: .default)

    /// Caption - 12pt regular
    static let caption: Font = .system(size: 12, weight: .regular, design: .default)

    /// Caption 2 - 11pt regular
    static let caption2: Font = .system(size: 11, weight: .regular, design: .default)

    // MARK: - Monospaced (for code/technical text)

    /// Monospaced body
    static let monoBody: Font = .system(size: 17, weight: .regular, design: .monospaced)

    /// Monospaced caption
    static let monoCaption: Font = .system(size: 12, weight: .regular, design: .monospaced)
}
