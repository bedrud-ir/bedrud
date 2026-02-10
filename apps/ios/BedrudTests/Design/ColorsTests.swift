import XCTest
import SwiftUI
@testable import Bedrud

final class ColorsTests: XCTestCase {

    // MARK: - All Color Constants Are Accessible

    func testBackgroundColorExists() {
        let color = BedrudColors.background
        XCTAssertNotNil(color)
    }

    func testForegroundColorExists() {
        let color = BedrudColors.foreground
        XCTAssertNotNil(color)
    }

    func testCardColorExists() {
        let color = BedrudColors.card
        XCTAssertNotNil(color)
    }

    func testCardForegroundColorExists() {
        let color = BedrudColors.cardForeground
        XCTAssertNotNil(color)
    }

    func testMutedColorExists() {
        let color = BedrudColors.muted
        XCTAssertNotNil(color)
    }

    func testMutedForegroundColorExists() {
        let color = BedrudColors.mutedForeground
        XCTAssertNotNil(color)
    }

    func testPrimaryColorExists() {
        let color = BedrudColors.primary
        XCTAssertNotNil(color)
    }

    func testPrimaryForegroundColorExists() {
        let color = BedrudColors.primaryForeground
        XCTAssertNotNil(color)
    }

    func testSecondaryColorExists() {
        let color = BedrudColors.secondary
        XCTAssertNotNil(color)
    }

    func testSecondaryForegroundColorExists() {
        let color = BedrudColors.secondaryForeground
        XCTAssertNotNil(color)
    }

    func testAccentColorExists() {
        let color = BedrudColors.accent
        XCTAssertNotNil(color)
    }

    func testAccentForegroundColorExists() {
        let color = BedrudColors.accentForeground
        XCTAssertNotNil(color)
    }

    func testDestructiveColorExists() {
        let color = BedrudColors.destructive
        XCTAssertNotNil(color)
    }

    func testDestructiveForegroundColorExists() {
        let color = BedrudColors.destructiveForeground
        XCTAssertNotNil(color)
    }

    func testBorderColorExists() {
        let color = BedrudColors.border
        XCTAssertNotNil(color)
    }

    func testInputColorExists() {
        let color = BedrudColors.input
        XCTAssertNotNil(color)
    }

    func testRingColorExists() {
        let color = BedrudColors.ring
        XCTAssertNotNil(color)
    }
}
