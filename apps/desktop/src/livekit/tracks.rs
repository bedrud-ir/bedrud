//! Video frame format conversion.
//! I420 (YUV planar) → RGBA for Slint's SharedPixelBuffer.

/// Convert I420 YUV planes to RGBA bytes.
/// Returns Vec<u8> of length width * height * 4.
pub fn i420_to_rgba(
    y_plane: &[u8],
    u_plane: &[u8],
    v_plane: &[u8],
    width: usize,
    height: usize,
) -> Vec<u8> {
    let mut rgba = vec![255u8; width * height * 4];

    for row in 0..height {
        for col in 0..width {
            let yv = y_plane[row * width + col] as f32;
            let uv = u_plane[(row / 2) * (width / 2) + (col / 2)] as f32 - 128.0;
            let vv = v_plane[(row / 2) * (width / 2) + (col / 2)] as f32 - 128.0;

            let r = (yv + 1.402 * vv).clamp(0.0, 255.0) as u8;
            let g = (yv - 0.344_136 * uv - 0.714_136 * vv).clamp(0.0, 255.0) as u8;
            let b = (yv + 1.772 * uv).clamp(0.0, 255.0) as u8;

            let idx = (row * width + col) * 4;
            rgba[idx] = r;
            rgba[idx + 1] = g;
            rgba[idx + 2] = b;
            rgba[idx + 3] = 255;
        }
    }
    rgba
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn i420_to_rgba_pure_black() {
        // Y=16, U=128, V=128 → near-black in BT.601
        let width = 2usize;
        let height = 2usize;
        let y_plane = vec![16u8; width * height];
        let u_plane = vec![128u8; (width / 2) * (height / 2)];
        let v_plane = vec![128u8; (width / 2) * (height / 2)];

        let rgba = i420_to_rgba(&y_plane, &u_plane, &v_plane, width, height);
        assert_eq!(rgba.len(), width * height * 4);
        // Y=16 maps to near-black (not pure 0,0,0 due to BT.601 offset)
        assert!(rgba[0] < 30, "R should be near 0, got {}", rgba[0]);
        assert!(rgba[3] == 255, "Alpha must be 255");
    }

    #[test]
    fn i420_to_rgba_correct_size() {
        let w = 4usize;
        let h = 4usize;
        let y = vec![128u8; w * h];
        let u = vec![128u8; (w / 2) * (h / 2)];
        let v = vec![128u8; (w / 2) * (h / 2)];
        let rgba = i420_to_rgba(&y, &u, &v, w, h);
        assert_eq!(rgba.len(), w * h * 4);
    }
}
