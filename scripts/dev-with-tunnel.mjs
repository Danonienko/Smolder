// Starts `wrangler dev` together with the named cloudflared tunnel configured in
// ~/.cloudflared/config.yml. Ctrl+C stops both processes.
import { spawn, spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const tunnelName = process.env.CLOUDFLARED_TUNNEL ?? 'smolder';

const children = [];
let shuttingDown = false;

function run(label, command, args) {
	const child = spawn(command, args, { stdio: 'inherit', shell: isWindows });
	child.on('error', (err) => {
		console.error(`[${label}] failed to start: ${err.message}`);
	});
	child.on('exit', (code) => {
		if (!shuttingDown) {
			console.log(`[${label}] exited with code ${code}; stopping.`);
			shutdown(code ?? 1);
		}
	});
	children.push({ label, child });
	return child;
}

function killTree(child) {
	if (!child.pid || child.exitCode !== null) return;
	if (isWindows) {
		spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
	} else {
		child.kill('SIGTERM');
	}
}

function shutdown(code = 0) {
	if (shuttingDown) return;
	shuttingDown = true;
	for (const { child } of children) killTree(child);
	process.exitCode = code;
	setTimeout(() => process.exit(code), 500).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

run('tunnel', 'cloudflared', ['tunnel', 'run', tunnelName]);
run('wrangler', 'wrangler', ['dev']);
