// Note: the `PrivateService` is only available when generating the client
// for local environments

import { PrivateService } from "@/lib/client";

OpenAPI.BASE = `${process.env.VITE_API_URL}`

export const createUser = async ({ email, password }: { email: string; password: string }) => {
	return await PrivateService.privateCreateUser({
		requestBody: {
			email,
			password,
			is_verified: true,
			full_name: 'Test User',
		},
	})
}
