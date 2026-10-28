#!/bin/sh
# Installs or upgrades Enclox:
#
#   curl -fsSL https://enclox.com/install.sh | sh
#
# Puts the server in $PREFIX/bin, the web console in $PREFIX/share/enclox/console, and the microVM
# files (Firecracker, jailer, guest kernel, base rootfs) in $DATA_DIR/vm, where the server looks.
# Uses sudo only when those folders aren't writable.
#
# Settings: ENCLOX_VERSION (a release tag such as v0.1.0; default the latest), PREFIX (default
# /usr/local), DATA_DIR (default /var/lib/enclox), ENCLOX_DOWNLOAD (a folder or URL holding the
# tarball, instead of GitHub).
set -eu

NAME=enclox-x86_64-linux
PREFIX=${PREFIX:-/usr/local}
DATA_DIR=${DATA_DIR:-/var/lib/enclox}
RELEASES=https://github.com/enclox/enclox-website/releases
if [ -n "${ENCLOX_DOWNLOAD:-}" ]; then
  URL=$ENCLOX_DOWNLOAD
elif [ -n "${ENCLOX_VERSION:-}" ]; then
  URL=$RELEASES/download/$ENCLOX_VERSION
else
  URL=$RELEASES/latest/download
fi

say() { echo "enclox: $*" >&2; }
fail() { say "$*"; exit 1; }

[ "$(uname -s)" = Linux ] && [ "$(uname -m)" = x86_64 ] || fail "needs Linux on x86_64, not $(uname -s) $(uname -m)"
for tool in curl tar sha256sum install; do
  command -v "$tool" >/dev/null || fail "needs $tool"
done
[ -e /dev/kvm ] || say "warning: no /dev/kvm here; functions run in microVMs and need KVM"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
say "downloading $URL/$NAME.tar.gz"
curl -fsSL -o "$tmp/$NAME.tar.gz" "$URL/$NAME.tar.gz" || fail "download failed"
curl -fsSL -o "$tmp/$NAME.tar.gz.sha256" "$URL/$NAME.tar.gz.sha256" || fail "checksum download failed"
(cd "$tmp" && sha256sum -c --quiet "$NAME.tar.gz.sha256") || fail "checksum mismatch; not installing"
tar -xzf "$tmp/$NAME.tar.gz" -C "$tmp"
src=$tmp/$NAME

if mkdir -p "$PREFIX/bin" "$PREFIX/share" "$DATA_DIR" 2>/dev/null && [ -w "$PREFIX/bin" ] && [ -w "$PREFIX/share" ] && [ -w "$DATA_DIR" ]; then
  SUDO=
else
  command -v sudo >/dev/null || fail "can't write to $PREFIX or $DATA_DIR, and there's no sudo"
  SUDO=sudo
  say "installing with sudo"
fi
$SUDO install -d "$PREFIX/bin" "$PREFIX/share/enclox" "$DATA_DIR/vm"
$SUDO install -m 755 "$src/enclox" "$PREFIX/bin/enclox"
$SUDO rm -rf "$PREFIX/share/enclox/console"
$SUDO cp -R "$src/console" "$PREFIX/share/enclox/console"
$SUDO install -m 755 "$src/vm/firecracker" "$src/vm/jailer" "$DATA_DIR/vm/"
$SUDO install -m 644 "$src/vm/vmlinux" "$src/vm/rootfs.ext4" "$DATA_DIR/vm/"

cat >&2 <<EOF

Installed Enclox to $PREFIX/bin/enclox, with its data in $DATA_DIR.

Start it as root (the jailer runs each microVM as its own user):

  sudo DATA_DIR=$DATA_DIR CONSOLE_DIR=$PREFIX/share/enclox/console CONSOLE_LISTEN=127.0.0.1:4567 $PREFIX/bin/enclox

The first start prints the root user's access key, once. The API listens on 127.0.0.1:4566 and
the console on http://127.0.0.1:4567. After an upgrade, recreate existing functions if the
release notes say their snapshots changed.
EOF
