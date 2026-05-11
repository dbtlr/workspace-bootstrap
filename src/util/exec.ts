import { spawn } from 'node:child_process';
import { once } from 'node:events';

export type ExecResult = { stdout: string; stderr: string; code: number };

export type ExecOptions = {
  cwd?: string;
  env?: Record<string, string | undefined>;
  inherit?: boolean;
};

export const exec = async (
  command: string,
  args: string[],
  options: ExecOptions = {},
): Promise<ExecResult> => {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: options.inherit ? 'inherit' : 'pipe',
  });

  let stdout = '';
  let stderr = '';

  child.stdout?.on('data', (chunk: Buffer) => {
    stdout += chunk.toString();
  });

  child.stderr?.on('data', (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  const [exitCode] = await once(child, 'close');
  const code = typeof exitCode === 'number' ? exitCode : 0;
  return { code, stderr, stdout };
};

export const which = async (command: string): Promise<boolean> => {
  try {
    const result = await exec(process.platform === 'win32' ? 'where' : 'which', [command]);
    return result.code === 0;
  } catch {
    return false;
  }
};
