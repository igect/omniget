use std::path::Path;

#[test]
fn load_plugin_dlls() {
    let plugins_dir = Path::new(r"C:\Users\nahid\AppData\Roaming\wtf.tonho.omniget\plugins");
    for name in &["courses", "telegram", "convert"] {
        let dll_path = plugins_dir.join(name).join(format!("omniget_plugin_{}.dll", name));
        eprintln!("\n=== {} ===", dll_path.display());
        unsafe {
            match libloading::Library::new(&dll_path) {
                Ok(lib) => {
                    eprintln!("  LoadLibrary: OK");
                    match lib.get::<extern "C" fn() -> u32>(b"omniget_plugin_abi_version") {
                        Ok(abi_fn) => {
                            let abi = abi_fn();
                            eprintln!("  ABI version: {}", abi);
                        }
                        Err(e) => eprintln!("  ABI symbol ERR: {}", e),
                    }
                    match lib.get::<extern "C" fn() -> *mut std::ffi::c_void>(b"omniget_plugin_init") {
                        Ok(_init_fn) => {
                            eprintln!("  init symbol: OK");
                        }
                        Err(e) => eprintln!("  init symbol ERR: {}", e),
                    }
                }
                Err(e) => eprintln!("  LoadLibrary FAILED: {}", e),
            }
        }
    }
}
