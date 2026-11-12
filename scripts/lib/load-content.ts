import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

async function readJson(path: string): Promise<unknown> {
  const raw = await readFile(path, 'utf8')
  try {
    return JSON.parse(raw) as unknown
  } catch (error) {
    throw new Error(`JSON inválido en ${path}: ${(error as Error).message}`)
  }
}

async function readJsonDir(dir: string): Promise<unknown[]> {
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return []
  }

  const files = entries.filter((name) => name.endsWith('.json')).sort()
  const items: unknown[] = []
  for (const file of files) {
    items.push(await readJson(join(dir, file)))
  }
  return items
}

export interface RawContentBundle {
  version: 1
  modules: unknown
  lessons: unknown[]
  exercises: unknown[]
  skills: unknown
  repertoire: unknown[]
}

export async function loadContentFromDisk(
  rootDir = process.cwd(),
): Promise<RawContentBundle> {
  const contentDir = join(rootDir, 'content')
  const [modules, lessons, exercises, skills, repertoire] = await Promise.all([
    readJson(join(contentDir, 'modules.json')),
    readJsonDir(join(contentDir, 'lessons')),
    readJsonDir(join(contentDir, 'exercises')),
    readJson(join(contentDir, 'skills.json')),
    readJsonDir(join(contentDir, 'repertoire')),
  ])

  return {
    version: 1,
    modules,
    lessons,
    exercises,
    skills,
    repertoire,
  }
}
