import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import postgres from 'postgres'
import { z } from 'zod'

const sql = postgres({
	host: process.env.DATABASE_HOST || 'localhost',
	port: Number(process.env.DATABASE_PORT) || 5432,
	database: process.env.DATABASE_NAME || 'app3',
	username: process.env.DATABASE_USERNAME || 'nwb',
	password: process.env.DATABASE_PASSWORD || 'changethis',
})

// Initialize table on startup
const initDb = async () => {
	await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      "user" VARCHAR(255) NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
	// Insert seed data if table is empty
	const count = await sql`SELECT COUNT(*) as count FROM messages`
	if (Number(count[0].count) === 0) {
		await sql`INSERT INTO messages ("user", text) VALUES ('Alice', 'Hello, how are you?')`
		await sql`INSERT INTO messages ("user", text) VALUES ('Bob', ${"I'm fine, thank you!"})`
	}
}

initDb().catch(console.error)

const IncomingMessageSchema = z.object({
	user: z.string(),
	text: z.string(),
})

const MessageSchema = IncomingMessageSchema.extend({
	id: z.number(),
})

export type Message = z.infer<typeof MessageSchema>

export const Route = createFileRoute('/demo/db-chat-api')({
	server: {
		handlers: {
			GET: async () => {
				const messages = await sql<Message[]>`SELECT id, "user", text FROM messages ORDER BY id`
				const stream = new ReadableStream({
					start(controller) {
						for (const message of messages) {
							controller.enqueue(JSON.stringify(message) + '\n')
						}
						controller.close()
					},
				})

				return new Response(stream, {
					headers: {
						'Content-Type': 'application/x-ndjson',
					},
				})
			},
			POST: async ({ request }) => {
				const body = IncomingMessageSchema.safeParse(await request.json())
				if (!body.success) {
					return new Response(body.error.message, { status: 400 })
				}
				const [inserted] = await sql<Message[]>`
          INSERT INTO messages ("user", text)
          VALUES (${body.data.user}, ${body.data.text})
          RETURNING id, "user", text
        `
				return json(inserted)
			},
		},
	},
})
