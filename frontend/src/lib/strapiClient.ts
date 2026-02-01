import { strapi } from '@strapi/client'

export const strapiClient = strapi({
	baseURL: import.meta.env.VITE_STRAPI_URL,
	auth: import.meta.env.VITE_STRAPI_API_KEY,
})

export const articles = strapiClient.collection('articles')
