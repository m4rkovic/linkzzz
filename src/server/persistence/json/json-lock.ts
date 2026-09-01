import "server-only";

type Task = () => Promise<void>;

export class JsonFileLock {
  private queue: Promise<void> = Promise.resolve();

  async run<T>(operation: () => Promise<T>): Promise<T> {
    let release: (() => void) | undefined;
    const previous = this.queue;

    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;

    try {
      return await operation();
    } finally {
      release?.();
    }
  }
}

const fileLocks = new Map<string, JsonFileLock>();

export function getJsonFileLock(filePath: string) {
  const existing = fileLocks.get(filePath);

  if (existing) {
    return existing;
  }

  const lock = new JsonFileLock();
  fileLocks.set(filePath, lock);
  return lock;
}

export async function runSequential(tasks: Task[]) {
  for (const task of tasks) {
    await task();
  }
}
