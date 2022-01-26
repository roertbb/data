import { datatype } from 'faker'
import { factory, primaryKey, nullable } from '../../src'
import { OperationErrorType } from '../../src/errors/OperationError'
import { getThrownError } from '../testUtils'

test('returns all matching entities', () => {
  const db = factory({
    user: {
      id: primaryKey(datatype.uuid),
      followersCount: Number,
    },
  })

  db.user.create({ followersCount: 10 })
  db.user.create({ followersCount: 12 })
  db.user.create({ followersCount: 15 })

  const users = db.user.findMany({
    where: {
      followersCount: {
        gt: 10,
      },
    },
  })
  expect(users).toHaveLength(2)
  const usersFollowersCount = users.map((user) => user.followersCount)
  expect(usersFollowersCount).toEqual([12, 15])
})

test('throws an exception when no results in strict mode', () => {
  const db = factory({
    user: {
      id: primaryKey(datatype.uuid),
    },
  })
  db.user.create()
  db.user.create()

  const error = getThrownError(() => {
    db.user.findMany({
      where: {
        id: {
          in: ['abc-123', 'def-456'],
        },
      },
      strict: true,
    })
  })

  expect(error).toHaveProperty('name', 'OperationError')
  expect(error).toHaveProperty('type', OperationErrorType.EntityNotFound)
  expect(error).toHaveProperty(
    'message',
    'Failed to execute "findMany" on the "user" model: no entities found matching the query "{"id":{"in":["abc-123","def-456"]}}".',
  )
})

test('returns an empty array when not found matching entities', () => {
  const db = factory({
    user: {
      id: primaryKey(datatype.uuid),
      followersCount: Number,
    },
  })

  db.user.create({ followersCount: 10 })
  db.user.create({ followersCount: 12 })
  db.user.create({ followersCount: 15 })

  const users = db.user.findMany({
    where: {
      followersCount: {
        gte: 1000,
      },
    },
  })
  expect(users).toHaveLength(0)
})

test('queries with null as criteria', () => {
  const db = factory({
    user: {
      id: String,
      organizationId: nullable((): string | null => null),
    },
  })

  const john = db.user.create({ id: 'john' })
  db.user.create({ id: 'katy', organizationId: 'org-1' })
  const clark = db.user.create({ id: 'clark' })

  const users = db.user.findMany({
    where: {
      organizationId: {
        equals: null,
      },
    },
  })

  expect(users).toEqual([john, clark])
})
