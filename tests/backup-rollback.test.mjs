import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..');
const backupScript = join(repoRoot, 'scripts', 'backup.sh');
const rollbackScript = join(repoRoot, 'scripts', 'rollback.sh');

function runScript(script, args, env = {}) {
  return new Promise((resolvePromise, reject) => {
    execFile(script, args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        ...env,
      },
      timeout: 15_000,
    }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolvePromise({ stdout, stderr });
    });
  });
}

test('backup dry-run prints a staging plan without creating backup output', async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), 'toolhub-backup-data-'));
  const backupRoot = await mkdtemp(join(tmpdir(), 'toolhub-backup-out-'));

  try {
    const { stdout, stderr } = await runScript(backupScript, ['--env', 'staging'], {
      XINXIANPAI_STAGING_DATA_ROOT: dataRoot,
      XINXIANPAI_BACKUP_ROOT: backupRoot,
    });

    assert.equal(stderr, '');
    assert.match(stdout, /DRY RUN: backup helper/);
    assert.match(stdout, /Environment: staging/);
    assert.match(stdout, /Planned actions with --execute:/);
    assert.match(stdout, /No secrets, environment files with real values, production deploys, service commands, or migrations will run\./);
    assert.deepEqual(await readdir(backupRoot), []);
  } finally {
    await rm(dataRoot, { recursive: true, force: true });
    await rm(backupRoot, { recursive: true, force: true });
  }
});

test('production backup execute requires explicit confirmation', async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), 'toolhub-prod-backup-data-'));
  const backupRoot = await mkdtemp(join(tmpdir(), 'toolhub-prod-backup-out-'));

  try {
    await assert.rejects(
      runScript(backupScript, ['--env', 'prod', '--execute'], {
        XINXIANPAI_PROD_DATA_ROOT: dataRoot,
        XINXIANPAI_BACKUP_ROOT: backupRoot,
      }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /Production backup execute mode requires CONFIRM_PROD_BACKUP=1/);
        return true;
      },
    );
  } finally {
    await rm(dataRoot, { recursive: true, force: true });
    await rm(backupRoot, { recursive: true, force: true });
  }
});

test('rollback dry-run reports a missing backup without modifying staging data', async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), 'toolhub-rollback-data-'));
  const backupRoot = await mkdtemp(join(tmpdir(), 'toolhub-rollback-out-'));
  const missingBackup = join(tmpdir(), `toolhub-missing-backup-${Date.now()}`);

  try {
    const { stdout, stderr } = await runScript(rollbackScript, ['--env', 'staging', '--backup', missingBackup], {
      XINXIANPAI_STAGING_DATA_ROOT: dataRoot,
      XINXIANPAI_BACKUP_ROOT: backupRoot,
    });

    assert.equal(stderr, '');
    assert.match(stdout, /DRY RUN: rollback helper/);
    assert.match(stdout, /Environment: staging/);
    assert.match(stdout, /Backup validation status: missing backup directory/);
    assert.match(stdout, /No secrets, production deploys, service commands, or migrations will run\./);
    assert.deepEqual(await readdir(dataRoot), []);
    assert.deepEqual(await readdir(backupRoot), []);
  } finally {
    await rm(dataRoot, { recursive: true, force: true });
    await rm(backupRoot, { recursive: true, force: true });
  }
});

test('production rollback execute requires explicit confirmation', async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), 'toolhub-prod-rollback-data-'));
  const backupRoot = await mkdtemp(join(tmpdir(), 'toolhub-prod-rollback-out-'));
  const missingBackup = join(tmpdir(), `toolhub-missing-prod-backup-${Date.now()}`);

  try {
    await assert.rejects(
      runScript(rollbackScript, ['--env', 'prod', '--backup', missingBackup, '--execute'], {
        XINXIANPAI_PROD_DATA_ROOT: dataRoot,
        XINXIANPAI_BACKUP_ROOT: backupRoot,
      }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /Production rollback execute mode requires CONFIRM_PROD_ROLLBACK=1/);
        return true;
      },
    );
  } finally {
    await rm(dataRoot, { recursive: true, force: true });
    await rm(backupRoot, { recursive: true, force: true });
  }
});
