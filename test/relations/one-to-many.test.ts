import { random, datatype } from 'faker'
import { factory, primaryKey, manyOf } from '@mswjs/data'

test('supports one-to-many relation', () => {
  const db = factory({
    user: {
      id: primaryKey(datatype.uuid),
      posts: manyOf('post'),
    },
    post: {
      id: primaryKey(datatype.uuid),
      title: random.words,
    },
  })

  const firstPost = db.post.create({
    title: 'First post',
  })
  const secondPost = db.post.create({
    title: 'Second post',
  })
  const user = db.user.create({
    posts: [firstPost, secondPost],
  })

  expect(user.posts).toHaveLength(2)

  const posts = user.posts.map((post) => post.title)
  expect(posts).toEqual(['First post', 'Second post'])
})

test('supports querying through one-to-many relation', () => {
  const db = factory({
    user: {
      id: primaryKey(String),
      posts: manyOf('post'),
    },
    post: {
      id: primaryKey(datatype.uuid),
      title: random.words,
    },
  })

  db.user.create({
    id: 'user-1',
    posts: [
      db.post.create({ title: 'First post' }),
      db.post.create({ title: 'Second post' }),
    ],
  })

  db.user.create({
    id: 'user-2',
    posts: [db.post.create({ title: 'Third post' })],
  })

  db.user.create({
    id: 'user-3',
    posts: [
      db.post.create({ title: 'Second post' }),
      db.post.create({ title: 'Fourth post' }),
    ],
  })

  const users = db.user.findMany({
    where: {
      posts: {
        title: {
          in: ['First post', 'Second post'],
        },
      },
    },
  })
  expect(users).toHaveLength(2)

  const userIds = users.map((user) => user.id)
  expect(userIds).toEqual(['user-1', 'user-3'])
})

test('supports querying through a nested one-to-many relation', () => {
  const db = factory({
    user: {
      id: primaryKey(String),
      activity: {
        posts: manyOf('post'),
      },
    },
    post: {
      id: primaryKey(String),
    },
  })

  const user = db.user.create({
    id: 'user-1',
    activity: {
      posts: [
        db.post.create({ id: 'post-1' }),
        db.post.create({ id: 'post-2' }),
      ],
    },
  })

  const result = db.user.findFirst({
    where: {
      activity: {
        posts: {
          id: {
            equals: 'post-2',
          },
        },
      },
    },
  })

  expect(result).toEqual(user)
})

test('does not throw any error if an entity with one-to-many relation is created without it', () => {
  const db = factory({
    user: {
      id: primaryKey(datatype.uuid),
      posts: manyOf('post'),
    },
    post: {
      id: primaryKey(datatype.uuid),
      title: random.words,
    },
  })

  expect(() => db.user.create()).not.toThrow()
})

test('updates the relational value via the ".update()" model method', () => {
  const db = factory({
    user: {
      id: primaryKey(datatype.uuid),
      posts: manyOf('post'),
    },
    post: {
      id: primaryKey(datatype.uuid),
      title: random.words,
    },
  })

  const firstPost = db.post.create({ title: 'First post' })
  const secondPost = db.post.create({ title: 'Second post' })
  const user = db.user.create({
    id: 'abc-123',
    posts: [firstPost],
  })
  const refetchUser = () => {
    return db.user.findFirst({
      where: {
        id: { equals: 'abc-123' },
      },
    })
  }

  expect(user.posts).toEqual([firstPost])
  expect(refetchUser()).toEqual({
    id: 'abc-123',
    posts: [firstPost],
  })

  // Update the "posts" relational property.
  const updatedUser = db.user.update({
    where: {
      id: { equals: 'abc-123' },
    },
    data: {
      posts: [secondPost],
    },
  })

  expect(updatedUser).toEqual({
    id: 'abc-123',
    posts: [secondPost],
  })
  expect(refetchUser()).toEqual({
    id: 'abc-123',
    posts: [secondPost],
  })
})

test('throws an exception when updating a relational value via a compatible object', () => {
  const db = factory({
    user: {
      id: primaryKey(datatype.uuid),
      posts: manyOf('post'),
    },
    post: {
      id: primaryKey(datatype.uuid),
      title: random.words,
    },
  })
  const firstPost = db.post.create({
    title: 'First post',
  })
  const user = db.user.create({
    id: 'abc-123',
    posts: [firstPost],
  })
  const refetchUser = () => {
    return db.user.findFirst({
      where: {
        id: { equals: 'abc-123' },
      },
    })
  }

  expect(user.posts).toEqual([firstPost])
  expect(refetchUser()).toEqual({
    id: 'abc-123',
    posts: [firstPost],
  })

  expect(() =>
    db.user.update({
      where: {
        id: { equals: 'abc-123' },
      },
      data: {
        posts: [
          {
            id: 'post-1',
            title: 'Compatible object',
          },
        ],
      },
    }),
  ).toThrow(
    'Failed to add relational property "posts" on "user": referenced entity with the id "post-1" does not exist.',
  )
})
