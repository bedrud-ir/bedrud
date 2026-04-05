mod app;

slint::include_modules!();

fn main() -> anyhow::Result<()> {
    env_logger::init();
    let window = AppWindow::new()?;
    window.run()?;
    Ok(())
}
