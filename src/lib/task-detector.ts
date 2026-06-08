const YT_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|.+\/)?([a-zA-Z0-9_-]{11,}).*$/;

interface TaskLike {
  title?: string | null;
  description?: string | null;
  platform?: string | null;
  postUrl?: string | null;
  targetUrl?: string | null;
}

function getText(task: TaskLike): string {
  return ((task.title ?? '') + ' ' + (task.description ?? '')).toLowerCase();
}

function isYtTask(task: TaskLike): boolean {
  if (task.platform === 'youtube') return true;
  const url: string = (task.postUrl ?? task.targetUrl ?? '');
  return YT_URL_REGEX.test(url);
}

export function isYtLike(task: TaskLike): boolean {
  return isYtTask(task) && getText(task).includes('like');
}

export function isYtSubscribe(task: TaskLike): boolean {
  return isYtTask(task) && (getText(task).includes('subscribe') || getText(task).includes('sub'));
}

export function isYtComment(task: TaskLike): boolean {
  return isYtTask(task) && getText(task).includes('comment');
}
