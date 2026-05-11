import { spawn } from "node:child_process";

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
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: options.inherit ? "inherit" : "pipe",
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      resolvePromise({ stdout, stderr, code: code ?? 0 });
    });
  });
};

export const which = async (command: string): Promise<boolean> => {
  try {
    const result = await exec(process.platform === "win32" ? "where" : "which", [command]);
    return result.code === 0;
  } catch {
    return false;
  }
};
