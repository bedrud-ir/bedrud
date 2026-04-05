mod api;
mod app;
mod auth;
mod store;

slint::include_modules!();

fn main() -> anyhow::Result<()> {
    env_logger::init();
    let window = AppWindow::new()?;
    window.run()?;
    Ok(())
}
