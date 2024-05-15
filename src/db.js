// Cloudflare D1 SQLite DB

/**
  await env.PB.put(short, content, {
    expirationTtl: expire,
    postedAt: createDate,
    passwd: passwd,
    filename: filename,
    lastModified: now,
  })
*/

function isExpired(item) {
  // return True if item is expired
  if (item.metadata.expirationTtl === undefined) {
    return false
  } else {
    const lastModified = item.metadata?.lastModified
    const lastModifiedUnix = Date.parse(lastModified) / 1000 // In seconds
    const shouldExpireTime = lastModifiedUnix + item.metadata.expirationTtl
    const nowUnix = Date.now() / 1000
    return nowUnix > shouldExpireTime
  }
}

export async function DB_Put(short, content, metadata, env) {
  return await env.DB.prepare(
    "INSERT OR REPLACE INTO pastes (short, content, metadata) VALUES (?, ?, ?)",
  )
    .bind(short, content, JSON.stringify(metadata))
    .run() // run and don't return actual result
}

export async function DB_Get(short, env) {
  const item_db = await env.DB.prepare("SELECT * FROM pastes WHERE short = ?")
    .bind(short)
    .first() // run and return first result

  // Check existence
  if (!item_db) {
    return null
  }

  if (isExpired(item_db, env)) {
    await DB_Delete(short, env)
    return null
  }

  return new Uint8Array(item_db.content)
}

/**
    const item = await env.PB.getWithMetadata(short)
    if (item.value === null) {
      throw new WorkerError(404, `paste of name '${short}' is not found`)
    } else {
      const date = item.metadata?.postedAt
      if (passwd !== item.metadata?.passwd) {
        throw new WorkerError(403, `incorrect password for paste '${short}`)
      } else {
        return makeResponse(
          await createPaste(env, content, isPrivate, expirationSeconds, short, date, newPasswd || passwd, filename),
        )
      }
    }
*/

export async function DB_GetWithMetadata(short, env) {
  const item_db = await env.DB.prepare("SELECT * FROM pastes WHERE short = ?")
    .bind(short)
    .first()

  // Check existence
  if (!item_db) {
    return null
  }

  if (isExpired(item_db, env)) {
    await DB_Delete(short, env)
    return null
  }

  const item = {
    value: new Uint8Array(item_db.content),
    metadata: JSON.parse(item_db.metadata),
  }

  return item
}

export async function DB_Delete(short, env) {
  return await env.DB.prepare("DELETE FROM pastes WHERE short = ?")
    .bind(short)
    .run() // Run and don't return actual result
}
