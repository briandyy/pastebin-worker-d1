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

export function safeAccess(obj, prop, defaultValue) {
  if (obj && typeof obj === "object" && prop in obj) {
    return obj[prop]
  } else {
    return defaultValue
  }
}

const expiredItemTemplate = {
  value: "Expired paste",
  metadata: {
    expirationTtl: 0,
    postedAt: Date.toString(Date.now() / 1000 + 10), // let Client Cache reset in 10 seconds
    passwd: "",
    filename: "",
    lastModified: Date.toString(Date.now() / 1000 + 10),
  },
}

const NotExistItemTemplate = {
  value: "Not found",
  metadata: {
    expirationTtl: 0,
    postedAt: Date.toString(0), // Client never cache this
    passwd: "",
    filename: "",
    lastModified: Date.toString(0),
  },
}

function isExpired(item, env) {
  // return true if item is expired
  const realMetadata = JSON.parse(item.metadata)
  // Use postedAt, or use lastModified is existing
  if (realMetadata.lastModified === undefined) {
    var lastModified = realMetadata.postedAt
  } else {
    var lastModified = realMetadata.lastModified
  }
  const lastModifiedUnix = Date.parse(lastModified) / 1000 // In seconds
  const shouldExpireTime = lastModifiedUnix + realMetadata.expirationTtl
  const nowUnix = Date.now() / 1000
  return nowUnix > shouldExpireTime
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
    return NotExistItemTemplate
  }

  if (isExpired(item_db, env)) {
    await DB_Delete(short, env)
    return expiredItemTemplate // This function is not used to check if the paste exists
    // So it's okay to return non-null expiredItemTemplate
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
