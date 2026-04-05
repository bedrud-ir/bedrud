class BedrudDesktop < Formula
  desc "Native desktop client for the Bedrud self-hosted video meeting platform"
  homepage "https://bedrud.ir"
  version "0.1.0"
  license "Apache-2.0"

  if Hardware::CPU.arm?
    url "https://github.com/bedrud-ir/bedrud/releases/download/v#{version}/bedrud-desktop-macos-arm64.tar.gz"
    sha256 "ARM64_SHA256_PLACEHOLDER"
  else
    url "https://github.com/bedrud-ir/bedrud/releases/download/v#{version}/bedrud-desktop-macos-x86_64.tar.gz"
    sha256 "X86_64_SHA256_PLACEHOLDER"
  end

  def install
    bin.install "bedrud-desktop"
  end

  def caveats
    <<~EOS
      Bedrud Desktop requires a running Bedrud server to connect to.
      For self-hosting instructions, see:
        https://bedrud-ir.github.io/bedrud/getting-started/installation/

      On first launch, macOS Gatekeeper may block the app since it is not
      notarized. Right-click the binary and select "Open" to bypass this.
    EOS
  end

  test do
    assert_predicate bin/"bedrud-desktop", :exist?
    assert_predicate bin/"bedrud-desktop", :executable?
  end
end
