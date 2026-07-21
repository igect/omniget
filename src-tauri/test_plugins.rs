use std::path::Path;
fn main() {
    let plugins_dir = Path::new(r"C:\Users\nahid\AppData\Roaming\wtf.tonho.omniget\plugins");
    for name in &["courses", "telegram", "convert"] {
        let dll = plugins_dir.join(name).join(format!("omniget_plugin_{}.dll", name));
        println!("=== {} ===", dll.display());
        unsafe {
            match libloading::Library::new(&dll) {
                Ok(lib) => {
                    println!("  LoadLibrary: OK");
                    match lib.get::<extern "C" fn() -> u32>(b"omniget_plugin_abi_version\0") {
                        Ok(abi_fn) => {
                            let abi = abi_fn();
                            println!("  ABI version: {}", abi);
                            match lib.get::<extern "C" fn() -> *mut std::ffi::c_void>(b"omniget_plugin_init\0") {
                                Ok(init_fn) => {
                                    println!("  init symbol: OK");
                                    let ptr = init_fn();
                                    println!("  init() returned: {:p}", ptr);
                                }
                                Err(e) => println!("  init symbol MISSING: {}", e),
                            }
                        }
                        Err(e) => println!("  ABI symbol MISSING: {}", e),
                    }
                }
                Err(e) => println!("  LoadLibrary FAILED: {}", e),
            }
        }
    }
}
