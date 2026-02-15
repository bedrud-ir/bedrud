#!/bin/bash
set -e

PROJECT="Bedrud.xcodeproj"
SCHEME="Bedrud"
DESTINATION="platform=iOS Simulator,name=iPhone 17 Pro"
RESULT_BUNDLE="TestResults.xcresult"

echo "Building for testing with coverage..."
xcodebuild build-for-testing \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -destination "$DESTINATION" \
  -enableCodeCoverage YES \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO

echo "Running tests..."
xcodebuild test-without-building \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -destination "$DESTINATION" \
  -enableCodeCoverage YES \
  -resultBundlePath "$RESULT_BUNDLE" \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO

echo "Generating coverage report..."
xcrun xccov view --report "$RESULT_BUNDLE" | tee coverage-report.txt

echo "Done! Check coverage-report.txt for details."
