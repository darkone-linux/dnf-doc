{
  pkgs ? import <nixpkgs> { },
}:

pkgs.mkShell {
  name = "dnf-doc";

  packages = with pkgs; [
    
    # JS toolchain (Astro/Starlight) — npm est inclus dans nodejs
    nodejs_24

    # Task runner
    just

    # Deployment
    git
    rsync

    # Codegen (src/generator Rust crate)
    cargo
    rustc
  ];

  shellHook = ''
    if [ ! -d node_modules ]; then
      npm install
    fi
  '';
}
