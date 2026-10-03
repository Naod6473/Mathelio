const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const bash=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'bash';

test('auto sync skips current revision, deploys the fetched script, and propagates failures', {skip:process.platform==='win32'&&!fs.existsSync(bash)},()=>{
 const script=`
set -euo pipefail
source deploy/auto-sync.sh
sha=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
deployed=0
mock_current="/var/www/mathelio/releases/$sha-123"
git() {
 case "$3" in
  fetch) return 0 ;;
  rev-parse) echo "$sha" ;;
  show) [[ "$4" == "$sha:deploy/update.sh" ]]; echo '# expected deployment script' ;;
  *) return 1 ;;
 esac
}
readlink() { echo "$mock_current"; }
bash() {
 [[ "$2" == "$sha" ]]
 grep -q 'expected deployment script' "$1"
 deployed=$((deployed+1))
 return 0
}
sync_once /unused /unused
[[ $deployed == 0 ]]
mock_current=/var/www/mathelio/releases/old
sync_once /unused /unused
[[ $deployed == 1 ]]
bash() { return 1; }
if sync_once /unused /unused; then echo 'failure swallowed'; exit 1; fi
git() { return 1; }
# Run unconditionally in a separate subshell: set -e must stop at fetch failure.
set +e
(set -e; sync_once /unused /unused)
status=$?
set -e
[[ $status != 0 ]]
`;
 const result=spawnSync(bash,['-c',script],{cwd:path.join(__dirname,'..'),encoding:'utf8',timeout:15000});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
 assert.match(result.stdout,/déjà à jour/);
 assert.match(result.stderr,/Échec du déploiement/);
});
