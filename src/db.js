// Cloudflare D1 SQLite DB

/**
  await env.PB.put(short, content, {
    expirationTtl: expire,
    metadata: {
      postedAt: createDate,
      passwd: passwd,
      filename: filename,
      lastModified: now,
    },
  })
*/

export async function DB_Put(short, content, metadata, env) {
  return env.DB.prepare(
    "INSERT INTO pastes (short, content, metadata) VALUES (?, ?, ?)",
  ).run(short, content, JSON.stringify(metadata))
}

export async function DB_Get(short, env) {
  const item_db = env.DB.prepare("SELECT * FROM pastes WHERE short = ?").get(
    short,
  )

  // Check existence
  if (!item_db) {
    return null
  }

  return item_db.content
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
  const item_db = env.DB.prepare("SELECT * FROM pastes WHERE short = ?").get(
    short,
  )

  // Check existence
  if (!item_db) {
    return null
  }

  const metadata = JSON.parse(item_db.metadata)

  const item = {
    value: item_db.content,
    metadata: metadata,
  }

  return item
}

export async function DB_Delete(short, env) {
  return env.DB.prepare("DELETE FROM pastes WHERE short = ?").run(short)
}
