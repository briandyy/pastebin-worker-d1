import { parsePath, WorkerError } from "../common.js"
import { DB_Put, DB_Get, DB_GetWithMetadata, DB_Delete } from "../db.js"

export async function handleDelete(request, env, ctx) {
  const url = new URL(request.url)
  const { short, passwd } = parsePath(url.pathname)
  const item = await DB_GetWithMetadata(short)
  if (item.value === null) {
    throw new WorkerError(404, `paste of name '${short}' not found`)
  } else {
    if (passwd !== item.metadata?.passwd) {
      throw new WorkerError(403, `incorrect password for paste '${short}`)
    } else {
      await DB_Delete(short)
      return new Response("the paste will be deleted in seconds")
    }
  }
}
