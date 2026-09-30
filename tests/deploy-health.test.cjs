const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const bash=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'bash';
test('deployment waits through HTTP errors and stale versions, but rejects persistent failure', {skip:process.platform==='win32'&&!fs.existsSync(bash)},()=>{
 const script=`
set -eu
source deploy/health.sh
counter=$(mktemp)
trap 'rm -f "$counter"' EXIT
node() { "$NODE_BINARY" "$@"; }
sleep() { :; }
curl() {
 local n
 n=$(cat "$counter"); n=$((n+1)); echo "$n" > "$counter"
 case "$n" in
  1) echo 'curl: (22) HTTP 404' >&2; return 22 ;;
  2) echo '{"ok":true,"version":"2.0.0"}' ;;
  3) echo '<html>Ancienne page</html>' ;;
  *) echo '{"ok":true,"version":"2.1.0"}' ;;
 esac
}
echo 0 > "$counter"
wait_health 2.1.0 http://localhost/api/health
test "$(cat "$counter")" = 4
curl() { echo 'curl: (22) HTTP 502' >&2; return 22; }
if wait_health 2.1.0 http://localhost/api/health; then exit 1; fi
`;
 const result=spawnSync(bash,['-c',script],{cwd:path.join(__dirname,'..'),env:{...process.env,NODE_BINARY:process.execPath.replaceAll('\\','/')},encoding:'utf8',timeout:15000});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
 assert.match(result.stdout,/Service prêt/);
 assert.match(result.stderr,/Dernière réponse : curl: \(22\) HTTP 502/);
});
