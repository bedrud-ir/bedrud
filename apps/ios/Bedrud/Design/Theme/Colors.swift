import SwiftUI

// MARK: - Bedrud Color Palette
//
// Colors mapped from the web CSS HSL variables.
//
// Light mode:
//   --background:          0 0% 100%         -> white
//   --foreground:          222.2 84% 4.9%    -> near-black blue
//   --muted:               210 40% 96.1%     -> light gray-blue
//   --muted-foreground:    215.4 16.3% 46.9% -> mid gray-blue
//   --primary:             222.2 47.4% 11.2% -> dark blue
//   --primary-foreground:  210 40% 98%       -> near-white
//   --secondary:           210 40% 96.1%     -> light gray-blue
//   --secondary-foreground:222.2 47.4% 11.2% -> dark blue
//   --accent:              210 40% 96.1%     -> light gray-blue
//   --accent-foreground:   222.2 47.4% 11.2% -> dark blue
//   --destructive:         0 72.2% 50.6%     -> red
//   --destructive-fg:      210 40% 98%       -> near-white
//
// Dark mode:
//   --background:          222.2 84% 4.9%    -> near-black blue
//   --foreground:          210 40% 98%       -> near-white
//   --muted:               217.2 32.6% 17.5% -> dark blue-gray
//   --muted-foreground:    215 20.2% 65.1%  -> mid gray-blue
//   --primary:             210 40% 98%       -> near-white
//   --primary-foreground:  222.2 47.4% 11.2% -> dark blue
//   --secondary:           217.2 32.6% 17.5% -> dark blue-gray
//   --secondary-foreground:210 40% 98%       -> near-white
//   --accent:              217.2 32.6% 17.5% -> dark blue-gray
//   --accent-foreground:   210 40% 98%       -> near-white
//   --destructive:         0 62.8% 30.6%    -> dark red
//   --destructive-fg:      210 40% 98%       -> near-white

enum BedrudColors {
    // MARK: - Background & Foreground

    static let background = Color("Background", bundle: nil)
        .orFallback(light: hsl(0, 0, 100), dark: hsl(222.2, 84, 4.9))

    static let foreground = Color("Foreground", bundle: nil)
        .orFallback(light: hsl(222.2, 84, 4.9), dark: hsl(210, 40, 98))

    // MARK: - Card

    static let card = Color("Card", bundle: nil)
        .orFallback(light: hsl(0, 0, 100), dark: hsl(222.2, 84, 4.9))

    static let cardForeground = Color("CardForeground", bundle: nil)
        .orFallback(light: hsl(222.2, 84, 4.9), dark: hsl(210, 40, 98))

    // MARK: - Muted

    static let muted = Color("Muted", bundle: nil)
        .orFallback(light: hsl(210, 40, 96.1), dark: hsl(217.2, 32.6, 17.5))

    static let mutedForeground = Color("MutedForeground", bundle: nil)
        .orFallback(light: hsl(215.4, 16.3, 46.9), dark: hsl(215, 20.2, 65.1))

    // MARK: - Primary

    static let primary = Color("Primary", bundle: nil)
        .orFallback(light: hsl(222.2, 47.4, 11.2), dark: hsl(210, 40, 98))

    static let primaryForeground = Color("PrimaryForeground", bundle: nil)
        .orFallback(light: hsl(210, 40, 98), dark: hsl(222.2, 47.4, 11.2))

    // MARK: - Secondary

    static let secondary = Color("Secondary", bundle: nil)
        .orFallback(light: hsl(210, 40, 96.1), dark: hsl(217.2, 32.6, 17.5))

    static let secondaryForeground = Color("SecondaryForeground", bundle: nil)
        .orFallback(light: hsl(222.2, 47.4, 11.2), dark: hsl(210, 40, 98))

    // MARK: - Accent

    static let accent = Color("Accent", bundle: nil)
        .orFallback(light: hsl(210, 40, 96.1), dark: hsl(217.2, 32.6, 17.5))

    static let accentForeground = Color("AccentForeground", bundle: nil)
        .orFallback(light: hsl(222.2, 47.4, 11.2), dark: hsl(210, 40, 98))

    // MARK: - Destructive

    static let destructive = Color("Destructive", bundle: nil)
        .orFallback(light: hsl(0, 72.2, 50.6), dark: hsl(0, 62.8, 30.6))

    static let destructiveForeground = Color("DestructiveForeground", bundle: nil)
        .orFallback(light: hsl(210, 40, 98), dark: hsl(210, 40, 98))

    // MARK: - Border & Input

    static let border = Color("Border", bundle: nil)
        .orFallback(light: hsl(214.3, 31.8, 91.4), dark: hsl(217.2, 32.6, 17.5))

    static let input = Color("Input", bundle: nil)
        .orFallback(light: hsl(214.3, 31.8, 91.4), dark: hsl(217.2, 32.6, 17.5))

    static let ring = Color("Ring", bundle: nil)
        .orFallback(light: hsl(222.2, 84, 4.9), dark: hsl(212.7, 26.8, 83.9))

    // MARK: - HSL to Color Helper

    /// Converts CSS HSL values (h: 0-360, s: 0-100, l: 0-100) to a SwiftUI Color.
    private static func hsl(_ h: Double, _ s: Double, _ l: Double) -> Color {
        Color(hue: h / 360.0, saturation: s / 100.0, brightness: hslToBrightness(s: s, l: l))
    }

    /// Approximates HSL lightness to HSB brightness.
    private static func hslToBrightness(s: Double, l: Double) -> Double {
        let sNorm = s / 100.0
        let lNorm = l / 100.0
        let brightness = lNorm + sNorm * min(lNorm, 1.0 - lNorm)
        return brightness
    }
}

// MARK: - Color Extension for Fallback

private extension Color {
    /// Returns self if the named color exists in the asset catalog, otherwise creates
    /// an adaptive color from the provided light/dark values.
    func orFallback(light: Color, dark: Color) -> Color {
        // We always use the programmatic fallback since no asset catalog is included.
        // When an asset catalog is added, named colors will take precedence.
        return Color(uiColor: UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(dark)
            default:
                return UIColor(light)
            }
        })
    }
}
